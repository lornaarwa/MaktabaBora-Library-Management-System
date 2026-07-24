<?php

namespace Tests\Unit\Middleware;

use Tests\TestCase;
use App\Http\Middleware\EnsureValidDigitalAccess;
use App\Models\Book;
use App\Models\DigitalPurchase;
use App\Models\Member;
use App\Models\User;
use App\Services\DigitalRentalService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;

class EnsureValidDigitalAccessTest extends TestCase
{
    use RefreshDatabase;

    protected EnsureValidDigitalAccess $middleware;

    protected function setUp(): void
    {
        parent::setUp();
        $this->middleware = new EnsureValidDigitalAccess(new DigitalRentalService());
    }

    public function test_it_denies_access_when_unpurchased(): void
    {
        $user = User::create(['name' => 'User', 'email' => 'u@example.com', 'password' => 'secret', 'role' => 'member']);
        $member = Member::create(['user_id' => $user->id, 'member_number' => 'M1']);
        $book = Book::create(['title' => 'Book', 'author' => 'Author', 'isbn' => '978111', 'genre' => 'Tech']);

        $request = Request::create("/api/v1/digital-books/{$book->id}/read", 'GET');
        $request->setUserResolver(fn () => $user);
        $request->setRouteResolver(fn () => new class($book->id) {
            public function __construct(public int $id) {}
            public function parameter($key) { return $this->id; }
        });

        $response = $this->middleware->handle($request, fn () => response()->json(['success' => true]));

        $this->assertEquals(403, $response->getStatusCode());
    }

    public function test_it_allows_access_when_purchased(): void
    {
        $user = User::create(['name' => 'User 2', 'email' => 'u2@example.com', 'password' => 'secret', 'role' => 'member']);
        $member = Member::create(['user_id' => $user->id, 'member_number' => 'M2']);
        $book = Book::create(['title' => 'Book 2', 'author' => 'Author', 'isbn' => '978222', 'genre' => 'Tech']);

        DigitalPurchase::create([
            'member_id' => $member->id,
            'user_id' => $user->id,
            'book_id' => $book->id,
            'standard_price' => 50.00,
            'amount_paid' => 50.00,
            'access_type' => 'lifetime',
            'status' => 'active',
        ]);

        $request = Request::create("/api/v1/digital-books/{$book->id}/read", 'GET');
        $request->setUserResolver(fn () => $user);
        $request->setRouteResolver(fn () => new class($book->id) {
            public function __construct(public int $id) {}
            public function parameter($key) { return $this->id; }
        });

        $response = $this->middleware->handle($request, fn () => response()->json(['success' => true]));

        $this->assertEquals(200, $response->getStatusCode());
    }
}
