<?php

namespace App\Http\Middleware;

use App\Contracts\Services\DigitalRentalServiceInterface;
use App\Models\Book;
use App\Models\DigitalPurchase;
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
        $isStaff = in_array($user->role, ['admin', 'librarian']);

        if (!$member && !$isStaff) {
            return response()->json([
                'success' => false,
                'message' => 'User does not have an active Member profile.',
            ], 403);
        }

        $bookId = $request->route('id') ?? $request->route('book') ?? $request->input('book_id');
        $book = Book::find($bookId);

        // Fallback: check if the route parameter was actually a digital purchase ID
        if ((!$book || ($member && !$this->digitalService->hasDigitalAccess($member, $book))) && $user) {
            $purchase = DigitalPurchase::where('id', $bookId)
                ->where(function ($q) use ($member, $user) {
                    if ($member) {
                        $q->where('member_id', $member->id);
                    }
                    $q->orWhere('user_id', $user->id);
                })
                ->where('status', 'active')
                ->first();

            if ($purchase && $purchase->book) {
                $book = $purchase->book;
            }
        }

        if (!$book) {
            return response()->json([
                'success' => false,
                'message' => 'Target book not found.',
            ], 404);
        }

        // Staff (admin, librarian) bypass purchase check for catalog management
        if (!$isStaff && $member && !$this->digitalService->hasDigitalAccess($member, $book)) {
            return response()->json([
                'success' => false,
                'message' => 'Digital reading access denied. Please purchase the book to unlock lifetime access.',
                'error_code' => 'DIGITAL_ACCESS_DENIED',
            ], 403);
        }

        $request->attributes->set('resolved_book', $book);

        return $next($request);
    }
}
