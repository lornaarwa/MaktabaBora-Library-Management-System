<?php

namespace App\Http\Controllers;

use App\Contracts\Services\BorrowLimitServiceInterface;
use App\Models\Book;
use App\Models\BookCopy;
use App\Models\DigitalPurchase;
use App\Models\Fine;
use App\Models\Loan;
use App\Models\Member;
use App\Models\Reservation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LibrarianDashboardController extends Controller
{
    protected BorrowLimitServiceInterface $borrowLimitService;

    public function __construct(BorrowLimitServiceInterface $borrowLimitService)
    {
        $this->borrowLimitService = $borrowLimitService;
    }

    public function metrics(): JsonResponse
    {
        return response()->json([
            'total_books' => Book::count(),
            'total_copies' => BookCopy::count(),
            'active_loans' => Loan::where('status', 'active')->count(),
            'overdue_loans' => Loan::where('status', 'overdue')->count(),
            'pending_reservations' => Reservation::where('status', 'pending')->count(),
            'total_unpaid_fines' => Fine::where('status', 'unpaid')->sum('balance'),
            'total_members' => Member::count(),
        ]);
    }

    public function members(): JsonResponse
    {
        $members = Member::with('user')->get()->map(function ($m) {
            return [
                'id' => $m->id,
                'member_number' => $m->member_number,
                'name' => $m->user ? $m->user->name : 'N/A',
                'email' => $m->user ? $m->user->email : 'N/A',
                'membership_tier' => $m->membership_tier,
                'borrow_limit' => $m->borrow_limit,
                'is_banned' => $m->is_banned,
                'active_loans_count' => Loan::where('member_id', $m->id)->where('status', 'active')->count(),
                'total_loans_count' => Loan::where('member_id', $m->id)->count(),
                'reserved_books_count' => Reservation::where('member_id', $m->id)->count(),
                'digital_purchases_count' => DigitalPurchase::where('member_id', $m->id)->orWhere('user_id', $m->user_id)->count(),
            ];
        });

        return response()->json(['status' => 'success', 'data' => $members]);
    }

    public function configureBorrowLimit(Request $request, Member $member): JsonResponse
    {
        $validated = $request->validate([
            'borrow_limit' => 'required|integer|min:1|max:20',
        ]);

        $updated = $this->borrowLimitService->updateMemberLimit($member, $validated['borrow_limit']);

        return response()->json([
            'message' => 'Member borrow limit updated successfully',
            'member' => $updated,
        ]);
    }

    public function toggleBookRestriction(Book $book): JsonResponse
    {
        $book->is_blocked = !$book->is_blocked;
        $book->save();

        return response()->json([
            'message' => $book->is_blocked ? 'Book restricted from borrowing' : 'Book restriction lifted',
            'book' => $book,
        ]);
    }
}
