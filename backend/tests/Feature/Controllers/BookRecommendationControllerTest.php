<?php

namespace Tests\Feature\Controllers;

use App\Models\Book;
use App\Models\BookCopy;
use App\Models\Loan;
use App\Models\Member;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookRecommendationControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_similar_books_endpoint_returns_ranked_titles(): void
    {
        $user = User::create(['name' => 'Member', 'email' => 'sim@example.com', 'password' => 'secret', 'role' => 'member']);
        Member::create(['user_id' => $user->id, 'member_number' => 'MEM-SIM-1']);

        $science = Book::create([
            'isbn' => '978-0735211292',
            'title' => 'Atomic Habits: An Easy & Proven Way to Build Good Habits',
            'author' => 'James Clear',
            'genre' => 'Science',
            'description' => 'Small daily improvements that compound into massive growth.',
            'available_copies' => 4,
        ]);
        Book::create([
            'isbn' => '978-1591846352',
            'title' => 'Mindset: The New Psychology of Success',
            'author' => 'Carol Dweck',
            'genre' => 'Science',
            'description' => 'Growth mindsets shape learning and personal improvement.',
            'available_copies' => 3,
        ]);
        Book::create([
            'isbn' => '978-0743273565',
            'title' => 'The Great Gatsby',
            'author' => 'F. Scott Fitzgerald',
            'genre' => 'Fiction',
            'description' => 'A tragic story of Jay Gatsby in 1920s America.',
            'available_copies' => 3,
        ]);

        $response = $this->actingAs($user)->getJson("/api/v1/books/{$science->id}/similar");

        $response->assertOk()
            ->assertJsonStructure(['data' => [['id', 'title', 'author', 'genre']]]);

        $titles = collect($response->json('data'))->pluck('title');
        $this->assertStringContainsString('Mindset', $titles->first());
    }

    public function test_recommendations_endpoint_requires_member_and_returns_data(): void
    {
        $user = User::create(['name' => 'Member', 'email' => 'rec@example.com', 'password' => 'secret', 'role' => 'member']);
        $member = Member::create(['user_id' => $user->id, 'member_number' => 'MEM-REC-1', 'is_subscribed' => true]);

        $habits = Book::create([
            'isbn' => '978-0735211292',
            'title' => 'Atomic Habits: An Easy & Proven Way to Build Good Habits',
            'author' => 'James Clear',
            'genre' => 'Science',
            'description' => 'Small daily improvements that compound into massive growth.',
            'available_copies' => 4,
        ]);
        Book::create([
            'isbn' => '978-1591846352',
            'title' => 'Mindset: The New Psychology of Success',
            'author' => 'Carol Dweck',
            'genre' => 'Science',
            'description' => 'Growth mindsets shape learning and personal improvement.',
            'available_copies' => 3,
        ]);

        $copy = BookCopy::create(['book_id' => $habits->id, 'barcode' => 'BC-REC-1', 'status' => 'checked_out']);
        Loan::create([
            'book_copy_id' => $copy->id,
            'member_id' => $member->id,
            'loan_date' => now()->subDays(2)->toDateString(),
            'due_date' => now()->addDays(12)->toDateString(),
            'status' => 'active',
        ]);

        $response = $this->actingAs($user)->getJson('/api/v1/recommendations');

        $response->assertOk()->assertJsonStructure(['data' => [['id', 'title']]]);
        $titles = collect($response->json('data'))->pluck('title');
        $this->assertStringContainsString('Mindset', $titles->first());
    }
}