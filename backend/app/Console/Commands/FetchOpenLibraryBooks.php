<?php

namespace App\Console\Commands;

use App\Services\OpenLibraryService;
use Illuminate\Console\Command;

class FetchOpenLibraryBooks extends Command
{
    protected $signature = 'books:fetch-openlibrary
        {subject=technology : Subject genre to query on Open Library (e.g., science, technology, fiction, history)}
        {--count=10 : Number of books to retrieve (1-25)}';

    protected $description = 'Fetch and import placeholder catalog books from Open Library API with reader streams';

    public function handle(OpenLibraryService $service): int
    {
        $subject = (string) $this->argument('subject');
        $count = (int) $this->option('count');

        $this->info("Connecting to Open Library APIs (User-Agent: SmartLibrarySystem/1.0)...");
        $this->info("Fetching up to {$count} books under subject '{$subject}'...");

        $results = $service->fetchBySubject($subject, $count);

        if (empty($results)) {
            $this->warn("No books found for subject '{$subject}'. Trying fallback search...");
            $results = $service->search($subject, $count);
        }

        if (empty($results)) {
            $this->error("Unable to retrieve books from Open Library. Please verify network connectivity or check subject query.");
            return self::FAILURE;
        }

        $this->info("Retrieved " . count($results) . " candidate books from Open Library. Importing into catalog...");

        $importResult = $service->importBooks($results);

        $this->table(
            ['ID', 'Title', 'Author', 'ISBN', 'Price (KES)', 'Copies', 'Stream Reader'],
            collect($importResult['books'])->map(fn ($b) => [
                $b->id,
                substr($b->title, 0, 35),
                substr($b->author, 0, 22),
                $b->isbn,
                number_format($b->digital_purchase_price, 2),
                $b->total_copies,
                str_contains($b->file_path ?? '', 'archive.org') ? 'IA Embed' : 'Digital PDF',
            ])
        );

        $this->info("Successfully imported {$importResult['imported']} books and generated physical copies!");

        return self::SUCCESS;
    }
}
