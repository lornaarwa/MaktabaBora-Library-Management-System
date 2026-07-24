<?php

namespace Tests\Feature\Controllers;

use Tests\TestCase;
use App\Models\Book;
use App\Models\Member;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class DigitalRentalControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_member_can_purchase_digital_book_and_stream_content(): void
    {
        $user = User::create(['name' => 'Digital Buyer', 'email' => 'digibuy@example.com', 'password' => bcrypt('password'), 'role' => 'member']);
        $member = Member::create(['user_id' => $user->id, 'member_number' => 'MEM-DIGI-1', 'is_subscribed' => true]);
        $book = Book::create(['title' => 'Digital Mastery', 'author' => 'Author', 'isbn' => '978999', 'genre' => 'Tech', 'digital_purchase_price' => 100.00]);

        // Purchase digital book (Subscribed discount 20% -> 80.00 KES)
        $purchaseResp = $this->actingAs($user)->postJson("/api/v1/digital-books/{$book->id}/purchase", [
            'phone_number' => '254712345678',
        ]);

        $purchaseResp->assertStatus(201)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.amount_paid', 80);

        // Read / Stream digital book (Guarded by EnsureValidDigitalAccess)
        $readResp = $this->actingAs($user)->getJson("/api/v1/digital-books/{$book->id}/read");

        $readResp->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.access_type', 'lifetime');
    }
}
