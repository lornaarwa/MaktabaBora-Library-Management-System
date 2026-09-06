<?php

namespace Tests\Feature\Controllers;

use Tests\TestCase;
use App\Models\Book;
use App\Models\Member;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ReservationControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_place_hold_reservation(): void
    {
        $user = User::create(['name' => 'Res User', 'email' => 'res@example.com', 'password' => 'secret', 'role' => 'member']);
        $member = Member::create(['user_id' => $user->id, 'member_number' => 'MEM-7001', 'is_subscribed' => true]);
        $book = Book::create(['title' => 'Title', 'author' => 'Author', 'isbn' => '9787001700170', 'genre' => 'Genre', 'total_copies' => 1, 'available_copies' => 0]);

        $response = $this->actingAs($user)->postJson('/api/v1/reservations', [
            'book_id' => $book->id,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('reservation.queue_position', 1);
    }

    public function test_member_can_cancel_their_reservation(): void
    {
        $user = User::create(['name' => 'Cancel User', 'email' => 'cancel@example.com', 'password' => 'secret', 'role' => 'member']);
        $member = Member::create(['user_id' => $user->id, 'member_number' => 'MEM-7002', 'is_subscribed' => true]);
        $book = Book::create(['title' => 'Title 2', 'author' => 'Author 2', 'isbn' => '9787002700270', 'genre' => 'Genre', 'total_copies' => 1, 'available_copies' => 0]);

        $reservation = \App\Models\Reservation::create([
            'book_id' => $book->id,
            'member_id' => $member->id,
            'queue_position' => 1,
            'status' => 'pending',
            'reserved_at' => now(),
        ]);

        $response = $this->actingAs($user)->deleteJson("/api/v1/reservations/{$reservation->id}");
        $response->assertStatus(200)
            ->assertJsonPath('status', 'success');

        $this->assertEquals('cancelled', $reservation->fresh()->status);
    }
}
