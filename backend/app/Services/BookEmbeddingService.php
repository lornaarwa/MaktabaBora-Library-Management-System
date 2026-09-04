<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Semantic embeddings for the hybrid catalog search.
 *
 * Generates text embeddings via OpenAI's embeddings API (offline-safe: when no
 * API key is configured the search simply falls back to TF-IDF ranking) and
 * provides the vector math used to score book-query similarity.
 */
class BookEmbeddingService
{
    protected string $apiKey;
    protected string $model;
    protected int $batchSize;

    public function __construct()
    {
        $this->apiKey = (string) config('services.openai.api_key', '');
        $this->model = config('services.openai.embedding_model', 'text-embedding-3-small');
        $this->batchSize = (int) config('services.openai.embedding_batch_size', 64);
    }

    public function configured(): bool
    {
        return $this->apiKey !== '';
    }

    public function model(): string
    {
        return $this->model;
    }

    public function batchSize(): int
    {
        return $this->batchSize;
    }

    /**
     * Embed a list of texts with a single API call.
     *
     * @param  string[]  $texts
     * @return array<int, array<float>|null> vectors aligned to $texts order
     */
    public function embedTexts(array $texts): array
    {
        if ($this->apiKey === '') {
            throw new \RuntimeException('OpenAI API key is not configured.');
        }

        if ($texts === []) {
            return [];
        }

        $response = Http::withHeaders([
            'Authorization' => 'Bearer '.$this->apiKey,
            'Content-Type' => 'application/json',
        ])->post('https://api.openai.com/v1/embeddings', [
            'model' => $this->model,
            'input' => array_values($texts),
        ]);

        $json = $response->json();

        if (! is_array($json) || ! isset($json['data'])) {
            Log::error('OpenAI embeddings call failed', ['status' => $response->status(), 'body' => $response->body()]);
            throw new \RuntimeException('Failed to generate embeddings from OpenAI.');
        }

        $vectors = array_fill(0, count($texts), null);
        foreach ($json['data'] as $entry) {
            $index = (int) ($entry['index'] ?? -1);
            if ($index >= 0 && $index < count($vectors)) {
                $vectors[$index] = $entry['embedding'] ?? null;
            }
        }

        return $vectors;
    }

    /**
     * Embed a single text.
     *
     * @return array<float>|null
     */
    public function embedText(string $text): ?array
    {
        return $this->embedTexts([$text])[0] ?? null;
    }

    /**
     * Cosine similarity between two vectors, clamped to [0, 1].
     *
     * @param  array<float>  $a
     * @param  array<float>  $b
     */
    public static function cosine(array $a, array $b): float
    {
        if ($a === [] || $b === [] || count($a) !== count($b)) {
            return 0.0;
        }

        $dot = 0.0;
        $normA = 0.0;
        $normB = 0.0;

        foreach ($a as $i => $value) {
            $dot += $value * $b[$i];
            $normA += $value * $value;
            $normB += $b[$i] * $b[$i];
        }

        if ($normA <= 0.0 || $normB <= 0.0) {
            return 0.0;
        }

        return max(0.0, min(1.0, $dot / (sqrt($normA) * sqrt($normB))));
    }

    /**
     * Metadata text used to embed a book.
     */
    public static function bookText(\App\Models\Book $book): string
    {
        $text = implode("\n", array_filter([
            $book->title,
            $book->author,
            $book->genre,
            $book->description,
            $book->publisher,
            'ISBN: '.$book->isbn,
        ]));

        return mb_substr($text, 0, 1000);
    }
}