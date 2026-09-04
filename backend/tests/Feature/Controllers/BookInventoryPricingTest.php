<?php

namespace Tests\Feature\Controllers;

use App\Models\Book;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class BookInventoryPricingTest extends TestCase
{
    use RefreshDatabase;

    private const RATES = [
        'result' => 'success',
        'provider' => 'https://www.exchangerate-api.com',
        'base_code' => 'USD',
        'rates' => [
            'KES' => 129.465319,
            'USD' => 1.0,
        ],
    ];

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    private function librarian(): User
    {
        return User::create([
            'name' => 'Librarian User',
            'email' => 'pricing@library.org',
            'password' => bcrypt('password123'),
            'role' => 'librarian',
        ]);
    }

    public function test_store_persists_digital_price_and_foreign_price_fields(): void
    {
        $response = $this->actingAs($this->librarian())->postJson('/api/v1/librarian/books', [
            'isbn' => '9780132350884',
            'title' => 'Clean Code',
            'author' => 'Robert C. Martin',
            'genre' => 'Software Engineering',
            'digital_purchase_price' => 450.00,
            'foreign_price' => 29.99,
            'foreign_currency' => 'USD',
            'initial_copies' => 1,
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('books', [
            'title' => 'Clean Code',
            'digital_purchase_price' => 450.00,
            'foreign_price' => 29.99,
            'foreign_currency' => 'USD',
        ]);
    }

    public function test_update_sets_and_clears_foreign_price_fields(): void
    {
        $librarian = $this->librarian();

        $book = Book::create([
            'isbn' => '9780132350884',
            'title' => 'Clean Code',
            'author' => 'Robert C. Martin',
            'genre' => 'Software',
            'total_copies' => 1,
            'available_copies' => 1,
        ]);

        // Set a foreign price through the librarian update endpoint.
        $this->actingAs($librarian)->putJson("/api/v1/librarian/books/{$book->id}", [
            'digital_purchase_price' => 425.00,
            'foreign_price' => 29.99,
            'foreign_currency' => 'USD',
        ])->assertStatus(200);

        $book->refresh();
        $this->assertSame(425.0, $book->digital_purchase_price);
        $this->assertSame(29.99, $book->foreign_price);
        $this->assertSame('USD', $book->foreign_currency);

        // Clearing the foreign price removes both fields again.
        $this->actingAs($librarian)->putJson("/api/v1/librarian/books/{$book->id}", [
            'foreign_price' => null,
            'foreign_currency' => null,
        ])->assertStatus(200);

        $book->refresh();
        $this->assertNull($book->foreign_price);
        $this->assertNull($book->foreign_currency);
        // digital_purchase_price is NOT NULL — an omitted value must fall back to the default.
        $this->assertSame(425.0, $book->digital_purchase_price);
    }

    public function test_show_attaches_kes_estimate_when_foreign_price_is_set(): void
    {
        Http::fake(['open.er-api.com/*' => Http::response(self::RATES)]);

        $book = Book::create([
            'isbn' => '9780132350884',
            'title' => 'Clean Code',
            'author' => 'Robert C. Martin',
            'genre' => 'Software',
            'total_copies' => 1,
            'available_copies' => 1,
            'foreign_price' => 29.99,
            'foreign_currency' => 'USD',
        ]);

        $this->getJson("/api/v1/books/{$book->id}")
            ->assertOk()
            ->assertJsonPath('foreign_price', 29.99)
            ->assertJsonPath('foreign_currency', 'USD')
            ->assertJsonPath('foreign_price_kes_estimate', 3883);

        Http::assertSentCount(1);
    }

    public function test_show_omits_estimate_when_no_foreign_price(): void
    {
        $book = Book::create([
            'isbn' => '9780132350884',
            'title' => 'Clean Code',
            'author' => 'Robert C. Martin',
            'genre' => 'Software',
            'total_copies' => 1,
            'available_copies' => 1,
        ]);

        $this->getJson("/api/v1/books/{$book->id}")
            ->assertOk()
            ->assertJsonPath('foreign_price', null)
            ->assertJsonMissingPath('foreign_price_kes_estimate');
    }
}
