<?php

namespace Tests\Feature\Controllers;

use Tests\TestCase;
use App\Models\User;
use App\Models\Member;
use App\Models\Book;
use App\Models\BookCopy;
use App\Models\Reservation;
use App\Models\Loan;
use Illuminate\Foundation\Testing\RefreshDatabase;

class LibrarianDashboardControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_librarian_can_access_dashboard_metrics(): void
    {
        $librarian = User::create(['name' => 'Lib Admin', 'email' => 'libmetrics@example.com', 'password' => 'secret', 'role' => 'librarian']);

        $response = $this->actingAs($librarian)->getJson('/api/v1/librarian/metrics');
        $response->assertStatus(200)
            ->assertJsonStructure(['total_books', 'total_copies', 'active_loans', 'total_members']);
    }

    public function test_librarian_can_list_reservations(): void
    {
        $librarian = User::create(['name' => 'Lib Admin', 'email' => 'libres@example.com', 'password' => 'secret', 'role' => 'librarian']);
        $user = User::create(['name' => 'Jane Reader', 'email' => 'jane@example.com', 'password' => 'secret', 'role' => 'member']);
        $member = Member::create(['user_id' => $user->id, 'member_number' => 'MEM-TEST-001', 'membership_tier' => 'standard', 'borrow_limit' => 5]);
        $book = Book::create(['title' => 'Dune', 'author' => 'Frank Herbert', 'isbn' => '9780441013593', 'genre' => 'Sci-Fi', 'total_copies' => 1, 'available_copies' => 1]);
        
        Reservation::create([
            'book_id' => $book->id,
            'member_id' => $member->id,
            'queue_position' => 1,
            'status' => 'pending',
            'reserved_at' => now(),
        ]);

        $response = $this->actingAs($librarian)->getJson('/api/v1/librarian/reservations');
        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.book.title', 'Dune');
    }

    public function test_librarian_can_approve_reservation_and_issue_loan(): void
    {
        $librarian = User::create(['name' => 'Lib Admin', 'email' => 'libappr@example.com', 'password' => 'secret', 'role' => 'librarian']);
        $user = User::create(['name' => 'Jane Reader', 'email' => 'janeappr@example.com', 'password' => 'secret', 'role' => 'member']);
        $member = Member::create(['user_id' => $user->id, 'member_number' => 'MEM-TEST-002', 'membership_tier' => 'standard', 'borrow_limit' => 5]);
        $book = Book::create(['title' => '1984', 'author' => 'George Orwell', 'isbn' => '9780451524935', 'genre' => 'Dystopian', 'total_copies' => 1, 'available_copies' => 1]);
        $copy = BookCopy::create([
            'book_id' => $book->id,
            'barcode' => 'BC-1984-001',
            'condition' => 'good',
            'status' => 'available',
            'location_rack' => 'A-12',
        ]);

        $reservation = Reservation::create([
            'book_id' => $book->id,
            'member_id' => $member->id,
            'queue_position' => 1,
            'status' => 'pending',
            'reserved_at' => now(),
        ]);

        $response = $this->actingAs($librarian)->postJson("/api/v1/librarian/reservations/{$reservation->id}/approve", [
            'barcode' => 'BC-1984-001',
            'days' => 14,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('reservation.status', 'fulfilled');

        $this->assertDatabaseHas('loans', [
            'book_copy_id' => $copy->id,
            'member_id' => $member->id,
            'status' => 'active',
        ]);

        $this->assertEquals('checked_out', $copy->fresh()->status);
        $this->assertEquals(0, $book->fresh()->available_copies);
    }

    public function test_librarian_cannot_approve_reservation_without_available_copies(): void
    {
        $librarian = User::create(['name' => 'Lib Admin', 'email' => 'libnone@example.com', 'password' => 'secret', 'role' => 'librarian']);
        $user = User::create(['name' => 'Jane Reader', 'email' => 'janenone@example.com', 'password' => 'secret', 'role' => 'member']);
        $member = Member::create(['user_id' => $user->id, 'member_number' => 'MEM-TEST-003', 'membership_tier' => 'standard', 'borrow_limit' => 5]);
        $book = Book::create(['title' => 'Solaris', 'author' => 'Stanislaw Lem', 'isbn' => '9780156027601', 'genre' => 'Sci-Fi', 'total_copies' => 0, 'available_copies' => 0]);

        $reservation = Reservation::create([
            'book_id' => $book->id,
            'member_id' => $member->id,
            'queue_position' => 1,
            'status' => 'pending',
            'reserved_at' => now(),
        ]);

        $response = $this->actingAs($librarian)->postJson("/api/v1/librarian/reservations/{$reservation->id}/approve");
        $response->assertStatus(422)
            ->assertJsonStructure(['error']);
    }

    public function test_librarian_can_deny_reservation(): void
    {
        $librarian = User::create(['name' => 'Lib Admin', 'email' => 'libdeny@example.com', 'password' => 'secret', 'role' => 'librarian']);
        $user = User::create(['name' => 'Jane Reader', 'email' => 'janedeny@example.com', 'password' => 'secret', 'role' => 'member']);
        $member = Member::create(['user_id' => $user->id, 'member_number' => 'MEM-TEST-004', 'membership_tier' => 'standard', 'borrow_limit' => 5]);
        $book = Book::create(['title' => 'Brave New World', 'author' => 'Aldous Huxley', 'isbn' => '9780060850524', 'genre' => 'Dystopian', 'total_copies' => 1, 'available_copies' => 1]);

        $reservation = Reservation::create([
            'book_id' => $book->id,
            'member_id' => $member->id,
            'queue_position' => 1,
            'status' => 'pending',
            'reserved_at' => now(),
        ]);

        $response = $this->actingAs($librarian)->postJson("/api/v1/librarian/reservations/{$reservation->id}/deny");
        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('reservation.status', 'cancelled');

        $this->assertEquals('cancelled', $reservation->fresh()->status);
    }
}
