<?php

namespace App\Http\Middleware;

use App\Contracts\Services\DigitalRentalServiceInterface;
use App\Models\Book;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureValidDigitalAccess
{
    public function __construct(protected DigitalRentalServiceInterface $digitalService) {}

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated access.',
            ], 401);
        }

        $member = $user->member;
        if (!$member) {
            return response()->json([
                'success' => false,
                'message' => 'User does not have an active Member profile.',
            ], 403);
        }

        $bookId = $request->route('id') ?? $request->route('book') ?? $request->input('book_id');
        $book = Book::find($bookId);

        if (!$book) {
            return response()->json([
                'success' => false,
                'message' => 'Target book not found.',
            ], 404);
        }

        if (!$this->digitalService->hasDigitalAccess($member, $book)) {
            return response()->json([
                'success' => false,
                'message' => 'Digital reading access denied. Please purchase the book to unlock lifetime access.',
                'error_code' => 'DIGITAL_ACCESS_DENIED',
            ], 403);
        }

        return $next($request);
    }
}
