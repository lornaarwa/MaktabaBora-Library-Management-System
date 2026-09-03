<?php

namespace Tests\Unit\Services;

use App\Models\Book;
use App\Models\BookCopy;
use App\Models\Loan;
use App\Models\Member;
use App\Models\User;
use App\Services\BookRecommendationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookRecommendationServiceTest extends TestCase
{
    use RefreshDatabase;

    private BookRecommendationService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = new BookRecommendationService();
    }

    private function createBooks(): array
    {
        $habits = Book::create([
            'isbn' => '978-0735211292',
            'title' => 'Atomic Habits: An Easy & Proven Way to Build Good Habits',
            'author' => 'James Clear',
            'genre' => 'Science',
            'description' => 'Tiny changes, remarkable results. Learn how small 1% daily improvements stack up over time into massive growth.',
            'available_copies' => 4,
        ]);

        $mindset = Book::create([
            'isbn' => '978-1591846352',
            'title' => 'Mindset: The New Psychology of Success',
            'author' => 'Carol Dweck',
            'genre' => 'Science',
            'description' => 'How fixed versus growth mindsets shape learning, improvement and personal success.',
            'available_copies' => 3,
        ]);

        $gatsby = Book::create([
            'isbn' => '978-0743273565',
            'title' => 'The Great Gatsby',
            'author' => 'F. Scott Fitzgerald',
            'genre' => 'Fiction',
            'description' => 'A tragic story of Jay Gatsby, a self-made millionaire, and his pursuit of Daisy Buchanan in 1920s America.',
            'available_copies' => 3,
        ]);

        $networking = Book::create([
            'isbn' => '978-0131838480',
            'title' => 'Computer Networking: A Top-Down Approach',
            'author' => 'James Kurose',
            'genre' => 'Tech',
            'description' => 'A top-down look at computer networks, protocols, the internet and network security.',
            'available_copies' => 2,
        ]);

        return compact('habits', 'mindset', 'gatsby', 'networking');
    }

    public function test_similar_to_ranks_same_genre_book_first(): void
    {
        $books = $this->createBooks();

        $similar = $this->service->similarTo($books['habits'], 5);

        $this->assertNotEmpty($similar);
        // The other Science/self-improvement book ranks above unrelated genres.
        $this->assertEquals($books['mindset']->id, $similar->first()->id);
        $this->assertNotContains($books['habits']->id, $similar->pluck('id')->all());
    }

    public function test_similar_to_excludes_the_source_book(): void
    {
        $books = $this->createBooks();

        $similar = $this->service->similarTo($books['gatsby'], 5);

        $this->assertNotContains($books['gatsby']->id, $similar->pluck('id')->all());
    }

    public function test_for_member_recommends_from_loan_history_and_excludes_borrowed(): void
    {
        $books = $this->createBooks();

        $user = User::create(['name' => 'Member', 'email' => 'm@example.com', 'password' => 'secret', 'role' => 'member']);
        $member = Member::create(['user_id' => $user->id, 'member_number' => 'MEM-REC-1']);

        $copy = BookCopy::create(['book_id' => $books['habits']->id, 'barcode' => 'BC-REC-1', 'status' => 'checked_out']);
        Loan::create([
            'book_copy_id' => $copy->id,
            'member_id' => $member->id,
            'loan_date' => now()->subDays(5)->toDateString(),
            'due_date' => now()->addDays(9)->toDateString(),
            'status' => 'active',
        ]);

        $recommended = $this->service->forMember($member, 6);

        // The Science/self-improvement profile should surface the other Science book...
        $this->assertNotEmpty($recommended);
        $this->assertEquals($books['mindset']->id, $recommended->first()->id);
        // ...and never re-recommend the book the member already has.
        $this->assertNotContains($books['habits']->id, $recommended->pluck('id')->all());
    }

    public function test_for_member_without_history_falls_back_to_popular(): void
    {
        $books = $this->createBooks();

        $user = User::create(['name' => 'New', 'email' => 'new@example.com', 'password' => 'secret', 'role' => 'member']);
        $member = Member::create(['user_id' => $user->id, 'member_number' => 'MEM-REC-2']);

        // Gatsby is the most-borrowed book (2 loans vs 0 for the others).
        foreach ([$books['gatsby'], $books['gatsby']] as $i => $book) {
            $copy = BookCopy::create(['book_id' => $book->id, 'barcode' => "BC-REC-POP-{$i}", 'status' => 'available']);
            Loan::create([
                'book_copy_id' => $copy->id,
                'member_id' => $member->id,
                'loan_date' => now()->subDays(3)->toDateString(),
                'due_date' => now()->addDays(11)->toDateString(),
                'status' => 'active',
            ]);
        }

        $popular = $this->service->popular(3);

        $this->assertNotEmpty($popular);
        $this->assertEquals($books['gatsby']->id, $popular->first()->id);

        $recommended = $this->service->forMember($member, 3);
        $this->assertEquals($popular->pluck('id')->all(), $recommended->pluck('id')->all());
    }
}