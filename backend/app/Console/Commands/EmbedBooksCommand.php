<?php

namespace App\Console\Commands;

use App\Models\Book;
use App\Services\BookEmbeddingService;
use Illuminate\Console\Command;

class EmbedBooksCommand extends Command
{
    protected $signature = 'books:embed
        {--limit=0 : Maximum number of books to embed (0 = all)}
        {--force : Re-embed books even if they already have an embedding}';

    protected $description = 'Generate semantic embeddings for all books (hybrid search ranking layer)';

    public function handle(BookEmbeddingService $embeddings): int
    {
        if (! $embeddings->configured()) {
            $this->warn('OpenAI API key is not configured (set OPENAI_API_KEY in .env).');
            $this->warn('Semantic search will keep using the offline TF-IDF ranking until embeddings are generated.');
            $this->warn('Run with a key, e.g.: OPENAI_API_KEY=sk-... php artisan books:embed');

            return self::SUCCESS;
        }

        $query = Book::query();

        if ((int) $this->option('limit') > 0) {
            $query->limit((int) $this->option('limit'));
        }

        $books = $query->get();
        $pending = $books->filter(function (Book $book) {
            return $this->option('force') || $book->embedding === null || $book->embedding === '';
        });

        $total = $pending->count();
        $this->info("Embedding {$total} book(s) with model [{$embeddings->model()}]...");

        if ($total === 0) {
            $this->info('Nothing to do — all books are already embedded. Use --force to re-embed.');

            return self::SUCCESS;
        }

        $batchSize = $embeddings->batchSize();
        $processed = 0;

        foreach ($pending->chunk($batchSize) as $chunk) {
            /** @var \Illuminate\Database\Eloquent\Collection<int, Book> $chunk */
            $texts = $chunk->map(fn (Book $book) => BookEmbeddingService::bookText($book))->values()->all();
            $vectors = $embeddings->embedTexts($texts);

            foreach ($chunk->values() as $index => $book) {
                $vector = $vectors[$index] ?? null;

                if ($vector === null) {
                    $this->error("  Skipped #{$book->id} ({$book->title}) — no vector returned.");
                    continue;
                }

                $book->forceFill([
                    'embedding' => json_encode($vector),
                    'embedding_model' => $embeddings->model(),
                    'embedded_at' => now(),
                ])->save();
                $processed++;
            }

            $this->info("  ...{$processed}/{$total} embedded");
        }

        $this->info("Done — {$processed} book(s) indexed for semantic search.");

        return self::SUCCESS;
    }
}