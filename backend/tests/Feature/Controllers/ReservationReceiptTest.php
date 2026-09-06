<?php

namespace Tests\Feature\Controllers;

use Tests\TestCase;
use App\Models\Book;
use App\Models\Member;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ReservationReceiptTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_user_cannot_access_reservations(): void
    {
        $response = $this->getJson('/api/v1/reservations');
        $response->assertStatus(401);
    }

    public function test_authenticated_member_can_retrieve_their_reservations_with_book_details(): void
    {
        $user = User::create([
            'name' => 'Alice Reader',
            'email' => 'alice@example.com',
            'password' => 'secret',
            'role' => 'member',
        ]);
        $member = Member::create([
            'user_id' => $user->id,
            'member_number' => 'MEM-8001',
            'is_subscribed' => true,
        ]);

        $book = Book::create([
            'title' => 'The Great Gatsby',
            'author' => 'F. Scott Fitzgerald',
            'isbn' => '9780743273565',
            'genre' => 'Classic Literature',
            'total_copies' => 3,
            'available_copies' => 0,
        ]);

        $reservation = Reservation::create([
            'book_id' => $book->id,
            'member_id' => $member->id,
            'queue_position' => 1,
            'status' => 'pending',
            'reserved_at' => now(),
            'expires_at' => now()->addDays(7),
        ]);

        $response = $this->actingAs($user)->getJson('/api/v1/reservations');

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $reservation->id)
            ->assertJsonPath('data.0.queue_position', 1)
            ->assertJsonPath('data.0.book.title', 'The Great Gatsby')
            ->assertJsonPath('data.0.book.author', 'F. Scott Fitzgerald');
    }

    public function test_member_only_sees_their_own_reservations(): void
    {
        $userA = User::create(['name' => 'User A', 'email' => 'a@example.com', 'password' => 'secret', 'role' => 'member']);
        $memberA = Member::create(['user_id' => $userA->id, 'member_number' => 'MEM-A', 'is_subscribed' => true]);

        $userB = User::create(['name' => 'User B', 'email' => 'b@example.com', 'password' => 'secret', 'role' => 'member']);
        $memberB = Member::create(['user_id' => $userB->id, 'member_number' => 'MEM-B', 'is_subscribed' => true]);

        $book = Book::create(['title' => 'Book One', 'author' => 'Author One', 'isbn' => '9781111111111', 'genre' => 'Fiction', 'total_copies' => 1, 'available_copies' => 0]);

        Reservation::create([
            'book_id' => $book->id,
            'member_id' => $memberB->id,
            'queue_position' => 1,
            'status' => 'pending',
            'reserved_at' => now(),
        ]);

        $response = $this->actingAs($userA)->getJson('/api/v1/reservations');

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonCount(0, 'data');
    }
}
