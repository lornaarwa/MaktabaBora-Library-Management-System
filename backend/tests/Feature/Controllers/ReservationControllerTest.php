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
}
