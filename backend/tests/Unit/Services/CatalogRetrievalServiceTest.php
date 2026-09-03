<?php

namespace Tests\Unit\Services;

use App\Models\Book;
use App\Services\CatalogRetrievalService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class CatalogRetrievalServiceTest extends TestCase
{
    use RefreshDatabase;

    private CatalogRetrievalService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = new CatalogRetrievalService();

        Book::create([
            'isbn' => '978-0735211292',
            'title' => 'Atomic Habits: An Easy & Proven Way to Build Good Habits',
            'author' => 'James Clear',
            'publisher' => 'Avery',
            'genre' => 'Science',
            'description' => 'Tiny changes, remarkable results. Learn how small 1% daily improvements stack up over time into massive growth.',
            'publication_year' => 2018,
            'total_copies' => 4,
            'available_copies' => 4,
            'is_exclusive' => false,
            'digital_purchase_price' => 45.00,
        ]);

        Book::create([
            'isbn' => '978-0132350884',
            'title' => 'Clean Code: A Handbook of Agile Software Craftsmanship',
            'author' => 'Robert C. Martin',
            'publisher' => 'Prentice Hall',
            'genre' => 'Software',
            'description' => 'Even bad code can function. But if code isn\'t clean, it can bring a development organization to its knees.',
            'publication_year' => 2008,
            'total_copies' => 4,
            'available_copies' => 3,
            'is_exclusive' => false,
            'digital_purchase_price' => 50.00,
        ]);

        Book::create([
            'isbn' => '978-0743273565',
            'title' => 'The Great Gatsby',
            'author' => 'F. Scott Fitzgerald',
            'publisher' => 'Scribner',
            'genre' => 'Fiction',
            'description' => 'A tragic story of Jay Gatsby, a self-made millionaire, and his pursuit of Daisy Buchanan in 1920s America.',
            'publication_year' => 1925,
            'total_copies' => 3,
            'available_copies' => 3,
            'is_exclusive' => false,
            'digital_purchase_price' => 30.00,
        ]);

        Book::create([
            'isbn' => '978-0131838480',
            'title' => 'Computer Networking: A Top-Down Approach',
            'author' => 'James Kurose',
            'publisher' => 'Pearson',
            'genre' => 'Tech',
            'description' => 'A top-down look at computer networks, protocols, the internet and network security.',
            'publication_year' => 2021,
            'total_copies' => 2,
            'available_copies' => 2,
            'is_exclusive' => true,
            'digital_purchase_price' => 80.00,
        ]);
    }

    public function test_keyword_query_ranks_matching_book_first(): void
    {
        $results = $this->service->retrieve('habits', 5);

        $this->assertNotEmpty($results);
        $this->assertStringContainsString('Atomic Habits', $results->first()->title);
    }

    public function test_natural_language_query_finds_semantic_match(): void
    {
        $results = $this->service->retrieve('I want a beginner friendly book about building habits', 5);

        $this->assertNotEmpty($results);
        $this->assertStringContainsString('Atomic Habits', $results->first()->title);
    }

    public function test_semantic_terms_outrank_irrelevant_books(): void
    {
        $results = $this->service->retrieve('clean software code', 5);

        $this->assertNotEmpty($results);
        $this->assertStringContainsString('Clean Code', $results->first()->title);
    }

    public function test_empty_query_returns_all_books(): void
    {
        $results = $this->service->search(['q' => ''])->items();

        $this->assertCount(4, $results);
    }

    public function test_genre_filter_is_applied(): void
    {
        $results = $this->service->search(['q' => '', 'genre' => 'Science'])->items();

        $this->assertCount(1, $results);
        $this->assertStringContainsString('Atomic Habits', $results[0]->title);
    }

    public function test_available_only_filter_excludes_loaned_books(): void
    {
        Book::where('title', 'like', 'The Great Gatsby%')->update(['available_copies' => 0]);

        $results = $this->service->search(['q' => 'gatsby', 'available_only' => true])->items();

        $this->assertEmpty($results);
    }

    public function test_gibberish_query_returns_no_results(): void
    {
        $results = $this->service->search(['q' => 'quantum zoology xyzzy'])->items();

        $this->assertEmpty($results);
    }

    public function test_embeddings_ranking_is_used_when_configured(): void
    {
        // Give each book a distinct deterministic 4-dim embedding vector.
        $vectors = [
            'Atomic Habits' => [1.0, 0.0, 0.0, 0.0],
            'Clean Code' => [0.0, 1.0, 0.0, 0.0],
            'The Great Gatsby' => [0.0, 0.0, 1.0, 0.0],
            'Computer Networking' => [0.0, 0.0, 0.0, 1.0],
        ];

        foreach ($vectors as $titleFragment => $vector) {
            Book::where('title', 'like', "%{$titleFragment}%")->first()
                ->forceFill(['embedding' => json_encode($vector), 'embedding_model' => 'test-model'])
                ->save();
        }

        // Query vector closest to the Atomic Habits embedding.
        Http::fake([
            'api.openai.com/*' => Http::response([
                'data' => [['index' => 0, 'embedding' => [0.9, 0.3, 0.1, 0.05]]],
            ]),
        ]);
        config(['services.openai.api_key' => 'sk-test']);

        // "self improvement" has zero lexical overlap with any seeded title/description
        // ('improvement' vs 'improvements'), so only the embedding signal can rank Atomic Habits first.
        $results = $this->service->retrieve('self improvement', 5);

        $this->assertNotEmpty($results);
        $this->assertStringContainsString('Atomic Habits', $results->first()->title);

        // Prove the embeddings path actually ran.
        Http::assertSent(fn ($request) => str_contains($request->url(), '/v1/embeddings'));
    }

    public function test_pagination_shape_is_compatible(): void
    {
        $paginator = $this->service->search(['q' => 'code'], 2);

        $this->assertEquals(2, $paginator->perPage());
        $this->assertLessThanOrEqual(2, $paginator->count());
        $this->assertIsIterable($paginator->items());
    }
}