<?php

namespace App\Services;

use Illuminate\Support\Collection;

/**
 * Dependency-free TF-IDF text similarity primitives.
 *
 * Shared by the hybrid catalog search (CatalogRetrievalService) and the
 * content-based recommendation engine (BookRecommendationService) so that
 * tokenization, IDF weighting and cosine scoring behave identically everywhere.
 */
final class TextSimilarity
{
    private const STOPWORDS = [
        'the', 'a', 'an', 'and', 'or', 'but', 'if', 'then', 'else', 'when',
        'of', 'to', 'in', 'on', 'at', 'by', 'for', 'with', 'about', 'from',
        'as', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have',
        'has', 'had', 'do', 'does', 'did', 'will', 'would', 'can', 'could',
        'should', 'may', 'might', 'must', 'i', 'me', 'my', 'you', 'your',
        'it', 'its', 'we', 'our', 'they', 'their', 'this', 'that', 'these',
        'those', 'there', 'here', 'what', 'which', 'who', 'whom', 'how',
        'where', 'why', 'not', 'no', 'so', 'just', 'some', 'any', 'all',
        'more', 'most', 'other', 'such', 'only', 'very', 'please', 'want',
        'need', 'find', 'looking', 'look', 'recommend', 'recommendations',
        'recommended', 'suggest', 'suggestion', 'suggestions', 'book', 'books',
        'novel', 'novels', 'read', 'reading', 'like', 'best', 'good', 'great',
        'one', 'get', 'know', 'also', 'would', 'could', 'am', 'can', 'than',
    ];

    /**
     * @return string[]
     */
    public static function tokenize(string $text): array
    {
        $tokens = preg_split('/[^a-z0-9]+/', strtolower($text)) ?: [];
        $stopwords = array_flip(self::STOPWORDS);

        return array_values(array_filter(
            array_map('trim', $tokens),
            fn (string $token) => strlen($token) > 1 && ! isset($stopwords[$token])
        ));
    }

    /**
     * IDF weights for a corpus of token lists.
     *
     * @param  iterable<string[]>  $termLists
     * @return array<string, float>
     */
    public static function idf(iterable $termLists): array
    {
        $documentCount = 0;
        $documentFrequency = [];

        foreach ($termLists as $terms) {
            $documentCount++;
            foreach (array_unique($terms) as $term) {
                $documentFrequency[$term] = ($documentFrequency[$term] ?? 0) + 1;
            }
        }

        $documentCount = max($documentCount, 1);
        $idf = [];
        foreach ($documentFrequency as $term => $count) {
            $idf[$term] = log(($documentCount + 1) / ($count + 1)) + 1;
        }

        return $idf;
    }

    /**
     * TF-IDF weighted cosine similarity between a query and a document.
     *
     * @param  string[]  $queryTerms
     * @param  string[]  $documentTerms
     * @param  array<string, float>  $idf
     */
    public static function tfidfCosine(array $queryTerms, array $documentTerms, array $idf): float
    {
        $queryVector = self::termVector($queryTerms, $idf);
        $documentVector = self::termVector($documentTerms, $idf);

        $dot = 0.0;
        $queryNorm = 0.0;
        $documentNorm = 0.0;

        foreach ($queryVector as $term => $weight) {
            $queryNorm += $weight * $weight;
            if (isset($documentVector[$term])) {
                $dot += $weight * $documentVector[$term];
            }
        }

        foreach ($documentVector as $weight) {
            $documentNorm += $weight * $weight;
        }

        if ($queryNorm <= 0.0 || $documentNorm <= 0.0) {
            return 0.0;
        }

        return $dot / (sqrt($queryNorm) * sqrt($documentNorm));
    }

    /**
     * Convenience: cosine similarity between a query term list and each document
     * in a collection of books, computed against one shared IDF map.
     *
     * @param  string[]  $queryTerms
     * @param  \Illuminate\Support\Collection<int, \App\Models\Book>  $books
     * @param  callable(\App\Models\Book): string  $textOf
     * @return \Illuminate\Support\Collection<int, array{book: \App\Models\Book, score: float}>
     */
    public static function scoreBooks(array $queryTerms, Collection $books, callable $textOf): Collection
    {
        $idf = self::idf(
            $books->map(fn ($book) => self::tokenize($textOf($book)))
        );

        return $books
            ->map(fn ($book) => [
                'book' => $book,
                'score' => self::tfidfCosine($queryTerms, self::tokenize($textOf($book)), $idf),
            ])
            ->values();
    }

    /**
     * @param  string[]  $terms
     * @param  array<string, float>  $idf
     * @return array<string, float>
     */
    private static function termVector(array $terms, array $idf): array
    {
        $vector = [];
        $frequencies = array_count_values($terms);

        foreach ($frequencies as $term => $count) {
            $vector[$term] = $count * ($idf[$term] ?? 1.0);
        }

        return $vector;
    }
}