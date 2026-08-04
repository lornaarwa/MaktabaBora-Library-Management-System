<?php

namespace Tests\Feature\Controllers;

use Tests\TestCase;
use App\Models\Book;
use App\Models\BookCopy;
use App\Models\Fine;
use App\Models\Loan;
use App\Models\Member;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class FineControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_member_can_initiate_daraja_fine_payment(): void
    {
        $user = User::create(['name' => 'Fine User', 'email' => 'finepay@example.com', 'password' => 'secret', 'role' => 'member']);
        $member = Member::create(['user_id' => $user->id, 'member_number' => 'MEM-6001', 'is_subscribed' => true]);
        $book = Book::create(['title' => 'Book', 'author' => 'Author', 'isbn' => '9786001600160', 'genre' => 'Genre']);
        $copy = BookCopy::create(['book_id' => $book->id, 'barcode' => 'BC-6001', 'status' => 'checked_out']);
        $loan = Loan::create(['member_id' => $member->id, 'book_copy_id' => $copy->id, 'loan_date' => now(), 'due_date' => now(), 'status' => 'overdue']);
        $fine = Fine::create(['loan_id' => $loan->id, 'member_id' => $member->id, 'amount' => 100.00, 'balance' => 100.00, 'status' => 'unpaid']);

        $response = $this->actingAs($user)->postJson("/api/v1/fines/{$fine->id}/pay-daraja", [
            'phone_number' => '0712345678',
            'amount' => 100.00,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true);
    }
}
