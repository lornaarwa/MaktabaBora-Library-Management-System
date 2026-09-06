<?php

namespace Tests\Unit\Services;

use App\Models\Book;
use App\Models\BookCopy;
use App\Services\OpenLibraryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class OpenLibraryServiceTest extends TestCase
{
    use RefreshDatabase;

    private OpenLibraryService $service;

    protected function setUp(): void
    {
        parent::setUp();
        \Illuminate\Support\Facades\Cache::flush();
        $this->service = new OpenLibraryService();
    }

    public function test_it_formats_openlibrary_user_agent_properly(): void
    {
        Http::fake([
            'openlibrary.org/subjects/technology.json*' => Http::response([
                'works' => [
                    [
                        'key' => '/works/OL123W',
                        'title' => 'Introduction to Algorithms',
                        'authors' => [['name' => 'Thomas H. Cormen']],
                        'first_publish_year' => 2009,
                        'cover_id' => 98765,
                        'ia' => ['cormen_ia_scan'],
                    ]
                ]
            ], 200),
        ]);

        $results = $this->service->fetchBySubject('technology', 1);

        $this->assertCount(1, $results);
        $this->assertEquals('Introduction to Algorithms', $results[0]['title']);
        $this->assertEquals('Thomas H. Cormen', $results[0]['author']);
        $this->assertStringContainsString('https://covers.openlibrary.org/b/id/98765-L.jpg', $results[0]['cover_image_path']);
        $this->assertStringContainsString('https://archive.org/embed/cormen_ia_scan', $results[0]['file_path']);

        Http::assertSent(function ($request) {
            return str_contains($request->header('User-Agent')[0] ?? '', 'SmartLibrarySystem/1.0');
        });
    }

    public function test_it_imports_and_persists_books_with_copies(): void
    {
        Http::fake([
            'openlibrary.org/search.json*' => Http::response([
                'docs' => [
                    [
                        'key' => '/works/OL456W',
                        'title' => 'Design Patterns',
                        'author_name' => ['Erich Gamma'],
                        'isbn' => ['978-0201633610'],
                        'first_publish_year' => 1994,
                        'cover_i' => 54321,
                        'subject' => ['Computer Science', 'Programming'],
                        'ia' => ['designpatterns00gamm'],
                    ]
                ]
            ], 200),
        ]);

        $imported = $this->service->searchAndImport('Design Patterns', 1);

        $this->assertCount(1, $imported);
        $this->assertDatabaseHas('books', [
            'title' => 'Design Patterns',
            'author' => 'Erich Gamma',
        ]);

        $book = Book::where('title', 'Design Patterns')->first();
        $this->assertNotNull($book);
        $this->assertGreaterThan(0, $book->available_copies);
        $this->assertDatabaseHas('book_copies', [
            'book_id' => $book->id,
            'condition' => 'good',
        ]);
    }

    public function test_it_handles_api_failure_gracefully(): void
    {
        Http::fake([
            'openlibrary.org/*' => Http::response('Server Error', 500),
        ]);

        $results = $this->service->fetchBySubject('fiction', 5);
        $this->assertIsArray($results);
        $this->assertEmpty($results);
    }
}
