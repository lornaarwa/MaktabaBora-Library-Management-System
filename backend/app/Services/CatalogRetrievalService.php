<?php

namespace App\Services;

use App\Models\Book;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Pagination\LengthAwarePaginator as Paginator;
use Illuminate\Support\Collection as SupportCollection;
use Illuminate\Support\Facades\Log;

/**
 * Hybrid catalog retrieval for the Grounded AI Librarian.
 *
 * Combines the existing keyword recall (SQL LIKE) with a semantic layer:
 *  - OpenAI embeddings cosine similarity when embeddings are indexed and an API
 *    key is configured (books:embed command);
 *  - TF-IDF weighted cosine over book metadata as the always-available,
 *    dependency-free fallback.
 *
 * Works offline and scales comfortably to catalogs of tens of thousands of
 * titles without a vector database. Ranking is deterministic and unit-testable.
 */
class CatalogRetrievalService
{
    /**
     * Run a hybrid (keyword + semantic) search over the catalog.
     *
     * Response shape is identical to the previous paginated search so the
     * existing API consumers are unaffected.
     */
    public function search(array $params, int $perPage = 15): LengthAwarePaginator
    {
        $queryText = trim((string) ($params['q'] ?? ''));
        $books = $this->candidates($params);

        // No query: preserve the legacy default ordering (sort_by / sort_order).
        if ($queryText === '') {
            $sortField = $params['sort_by'] ?? 'created_at';
            $sortOrder = (($params['sort_order'] ?? 'desc') === 'asc') ? 'asc' : 'desc';
            $sorted = $books->sortBy($sortField, SORT_REGULAR, $sortOrder === 'desc')->values();

            return $this->paginate($sorted, $perPage, $params);
        }

        $queryTerms = $this->tokenize($queryText);

        // Stopword-only query (e.g. "find me a book") — fall back to default ordering.
        if (count($queryTerms) === 0) {
            return $this->paginate($books, $perPage, $params);
        }

        $indexed = $books
            ->map(fn (Book $book) => [
                'book' => $book,
                'terms' => $this->tokenize($this->bookText($book)),
            ])
            ->filter(fn (array $item) => count($item['terms']) > 0)
            ->values();

        $idf = $this->inverseDocumentFrequency($indexed);

        // Optional embeddings layer: when an OpenAI key is configured and the query can
        // be embedded, blend embedding cosine with the TF-IDF signal. Any failure (network,
        // quota, key) degrades gracefully to TF-IDF-only ranking.
        $queryVector = null;
        $bookVectors = [];
        try {
            $embeddingService = app(BookEmbeddingService::class);
            if ($embeddingService->configured()) {
                $queryVector = $embeddingService->embedText($queryText);
                if ($queryVector !== null) {
                    foreach ($indexed as $item) {
                        $raw = $item['book']->embedding;
                        $bookVectors[$item['book']->id] = (is_string($raw) && $raw !== '')
                            ? json_decode($raw, true)
                            : null;
                    }
                }
            }
        } catch (\Throwable $e) {
            Log::warning('Embedding search unavailable — using TF-IDF ranking.', ['error' => $e->getMessage()]);
            $queryVector = null;
            $bookVectors = [];
        }

        $scored = $indexed
            ->map(function (array $item) use ($queryTerms, $idf, $queryText, $queryVector, $bookVectors) {
                $tfidfCosine = $this->cosineSimilarity($queryTerms, $item['terms'], $idf);

                $bookVector = $bookVectors[$item['book']->id] ?? null;
                $embeddingCosine = ($queryVector !== null && is_array($bookVector))
                    ? BookEmbeddingService::cosine($queryVector, $bookVector)
                    : null;

                $semantic = $embeddingCosine !== null
                    ? (0.6 * $embeddingCosine + 0.4 * $tfidfCosine)
                    : $tfidfCosine;

                $keywordBoost = $this->matchesKeyword($item['book'], $queryText) ? 0.45 : 0.0;
                $titleBoost = $this->matchesTitle($item['book'], $queryTerms) ? 0.3 : 0.0;

                return [
                    'book' => $item['book'],
                    'score' => round($semantic + $keywordBoost + $titleBoost, 6),
                ];
            })
            ->sortByDesc('score')
            ->values();

        // Keep only genuinely relevant books (semantic overlap or keyword match).
        $relevant = $scored->filter(fn (array $item) => $item['score'] > 0.0)->values();

        if ($relevant->isEmpty()) {
            return $this->paginate(new SupportCollection(), $perPage, $params);
        }

        return $this->paginate($relevant->pluck('book'), $perPage, $params);
    }

    /**
     * Convenience used by the AI service: top N relevant books for a prompt.
     *
     * @return SupportCollection<int, Book>
     */
    public function retrieve(string $query, int $limit = 5): SupportCollection
    {
        return new SupportCollection($this->search(['q' => $query, 'per_page' => max($limit, 1)])->items());
    }

    /**
     * Candidate set after applying non-text filters (genre, author, isbn, availability).
     *
     * @return SupportCollection<int, Book>
     */
    protected function candidates(array $params): SupportCollection
    {
        $query = Book::query();

        if (! empty($params['genre'])) {
            $query->where('genre', $params['genre']);
        }

        if (! empty($params['author'])) {
            $query->where('author', 'like', '%'.$params['author'].'%');
        }

        if (! empty($params['isbn'])) {
            $query->where('isbn', $params['isbn']);
        }

        if (! empty($params['available_only'])) {
            $query->where('available_copies', '>', 0)->where('is_blocked', false);
        }

        // Return a base collection so map/filter/pluck behave predictably on arrays.
        return new SupportCollection($query->get()->all());
    }

    protected function bookText(Book $book): string
    {
        return implode(' ', array_filter([
            $book->title,
            $book->author,
            $book->genre,
            $book->description,
            $book->publisher,
            $book->isbn,
        ]));
    }

    protected function matchesKeyword(Book $book, string $queryText): bool
    {
        $term = '%'.$queryText.'%';

        return stripos($book->title, $queryText) !== false
            || stripos((string) $book->author, $queryText) !== false
            || stripos((string) $book->isbn, $queryText) !== false
            || stripos((string) $book->genre, $queryText) !== false
            || stripos((string) $book->description, $queryText) !== false;
    }

    protected function matchesTitle(Book $book, array $queryTerms): bool
    {
        $titleTerms = $this->tokenize($book->title);

        return count(array_intersect($queryTerms, $titleTerms)) > 0;
    }

    /**
     * @return string[]
     */
    public function tokenize(string $text): array
    {
        return TextSimilarity::tokenize($text);
    }

    /**
     * @param  SupportCollection<int, array{book: Book, terms: string[]}>  $documents
     * @return array<string, float>
     */
    protected function inverseDocumentFrequency(SupportCollection $documents): array
    {
        return TextSimilarity::idf($documents->map(fn (array $document) => $document['terms']));
    }

    /**
     * @param  string[]  $queryTerms
     * @param  string[]  $documentTerms
     * @param  array<string, float>  $idf
     */
    protected function cosineSimilarity(array $queryTerms, array $documentTerms, array $idf): float
    {
        return TextSimilarity::tfidfCosine($queryTerms, $documentTerms, $idf);
    }

    /**
     * @param  SupportCollection<int, Book>  $items
     */
    protected function paginate(SupportCollection $items, int $perPage, array $params): LengthAwarePaginator
    {
        $page = Paginator::resolveCurrentPage();
        $sliced = $items->forPage($page, $perPage)->values();

        return new Paginator($sliced, $items->count(), $perPage, $page, [
            'path' => Paginator::resolveCurrentPath(),
            'query' => $params,
        ]);
    }
}