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
    protected \App\Contracts\Services\RefundManagementServiceInterface $refundService;

    public function __construct(
        BorrowLimitServiceInterface $borrowLimitService,
        \App\Contracts\Services\RefundManagementServiceInterface $refundService
    ) {
        $this->borrowLimitService = $borrowLimitService;
        $this->refundService = $refundService;
    }

    public function getRefundRequests(): JsonResponse
    {
        $refunds = $this->refundService->getAllRefundRequests();
        return response()->json([
            'status' => 'success',
            'data' => $refunds,
        ]);
    }

    public function approveRefund(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $refund = $this->refundService->approveRefund($id, $user);
        return response()->json([
            'status' => 'success',
            'message' => "Refund request #{$id} approved and membership subscription revoked.",
            'data' => $refund,
        ]);
    }

    public function rejectRefund(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $refund = $this->refundService->rejectRefund($id, $user);
        return response()->json([
            'status' => 'success',
            'message' => "Refund request #{$id} rejected.",
            'data' => $refund,
        ]);
    }

    public function searchOpenLibrary(Request $request, \App\Services\OpenLibraryService $openLibraryService): JsonResponse
    {
        $query = (string) $request->input('query', '');
        $subject = (string) $request->input('subject', '');
        $limit = (int) $request->input('limit', 12);

        if (!empty($subject)) {
            $results = $openLibraryService->fetchBySubject($subject, $limit);
        } else {
            $results = $openLibraryService->search($query ?: 'classic', $limit);
        }

        return response()->json([
            'status' => 'success',
            'data' => $results,
        ]);
    }

    public function importOpenLibrary(Request $request, \App\Services\OpenLibraryService $openLibraryService): JsonResponse
    {
        $validated = $request->validate([
            'books' => 'required|array|min:1',
            'books.*.title' => 'required|string',
            'books.*.author' => 'nullable|string',
            'books.*.genre' => 'nullable|string',
            'books.*.isbn' => 'nullable|string',
            'books.*.cover_image_path' => 'nullable|string',
            'books.*.file_path' => 'nullable|string',
            'books.*.publication_year' => 'nullable|integer',
            'books.*.digital_purchase_price' => 'nullable|numeric',
            'books.*.total_copies' => 'nullable|integer',
        ]);

        $result = $openLibraryService->importBooks($validated['books']);

        return response()->json([
            'status' => 'success',
            'message' => "Successfully imported {$result['imported']} book(s) into catalog.",
            'data' => $result['books'],
        ], 201);
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

    // 1. Book Copies Management
    public function bookCopies(): JsonResponse
    {
        $copies = BookCopy::with('book')->latest()->get();
        return response()->json(['status' => 'success', 'data' => $copies]);
    }

    public function storeBookCopy(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'book_id' => 'required|exists:books,id',
            'barcode' => 'required|string|unique:book_copies,barcode',
            'condition' => 'required|in:good,damaged,lost',
            'status' => 'required|in:available,checked_out,reserved,maintenance',
            'location_rack' => 'nullable|string|max:100',
        ]);

        $copy = BookCopy::create($validated);
        
        // Recalculate total_copies & available_copies for the book
        $book = Book::find($validated['book_id']);
        if ($book) {
            $book->total_copies = BookCopy::where('book_id', $book->id)->count();
            $book->available_copies = BookCopy::where('book_id', $book->id)->where('status', 'available')->count();
            $book->save();
        }

        return response()->json(['message' => 'Book copy registered successfully.', 'data' => $copy->load('book')], 201);
    }

    public function updateBookCopy(Request $request, BookCopy $copy): JsonResponse
    {
        $validated = $request->validate([
            'condition' => 'sometimes|in:good,damaged,lost',
            'status' => 'sometimes|in:available,checked_out,reserved,maintenance',
            'location_rack' => 'nullable|string|max:100',
        ]);

        $copy->update($validated);

        $book = $copy->book;
        if ($book) {
            $book->available_copies = BookCopy::where('book_id', $book->id)->where('status', 'available')->count();
            $book->save();
        }

        return response()->json(['message' => 'Book copy updated successfully.', 'data' => $copy]);
    }

    public function deleteBookCopy(BookCopy $copy): JsonResponse
    {
        $book = $copy->book;
        $copy->delete();

        if ($book) {
            $book->total_copies = BookCopy::where('book_id', $book->id)->count();
            $book->available_copies = BookCopy::where('book_id', $book->id)->where('status', 'available')->count();
            $book->save();
        }

        return response()->json(['message' => 'Book copy removed from inventory.']);
    }

    // 2. Active Loans Directory (Process Book Returns Desk)
    public function activeLoans(): JsonResponse
    {
        $loans = Loan::with(['member.user', 'copy.book'])
            ->latest()
            ->get();

        return response()->json(['status' => 'success', 'data' => $loans]);
    }

    // 3. Subscriptions Management (CRUD)
    public function subscriptions(): JsonResponse
    {
        $subscriptions = \App\Models\Subscription::with(['member.user', 'user'])->latest()->get();
        return response()->json(['status' => 'success', 'data' => $subscriptions]);
    }

    public function storeSubscription(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'member_id' => 'required|exists:members,id',
            'plan_type' => 'required|string|max:100',
            'amount_paid' => 'required|numeric|min:0',
            'payment_status' => 'required|in:pending,paid,failed',
            'expires_at' => 'nullable|date',
        ]);

        $member = Member::findOrFail($validated['member_id']);

        $subscription = \App\Models\Subscription::create([
            'member_id' => $member->id,
            'user_id' => $member->user_id,
            'plan_type' => $validated['plan_type'],
            'discount_percentage' => 20.00,
            'amount_paid' => $validated['amount_paid'],
            'payment_status' => $validated['payment_status'],
            'transaction_reference' => 'LIB-SUB-' . strtoupper(bin2hex(random_bytes(4))),
            'starts_at' => now(),
            'expires_at' => $validated['expires_at'] ?? now()->addMonth(),
        ]);

        if ($validated['payment_status'] === 'paid') {
            $member->is_subscribed = true;
            $member->subscription_expires_at = $subscription->expires_at;
            $member->save();

            if ($member->user) {
                $member->user->subscription_status = 'active';
                $member->user->subscription_id = $subscription->id;
                $member->user->save();
            }
        }

        return response()->json(['message' => 'Subscription created successfully.', 'data' => $subscription->load('member.user')], 201);
    }

    public function updateSubscription(Request $request, \App\Models\Subscription $subscription): JsonResponse
    {
        $validated = $request->validate([
            'plan_type' => 'sometimes|string|max:100',
            'payment_status' => 'sometimes|in:pending,paid,failed',
            'expires_at' => 'nullable|date',
        ]);

        $subscription->update($validated);

        if ($subscription->member) {
            $isPaid = ($subscription->payment_status === 'paid');
            $subscription->member->is_subscribed = $isPaid;
            $subscription->member->subscription_expires_at = $isPaid ? $subscription->expires_at : null;
            $subscription->member->save();
        }

        return response()->json(['message' => 'Subscription updated successfully.', 'data' => $subscription]);
    }

    public function deleteSubscription(\App\Models\Subscription $subscription): JsonResponse
    {
        if ($subscription->member) {
            $subscription->member->is_subscribed = false;
            $subscription->member->subscription_expires_at = null;
            $subscription->member->save();
        }

        if ($subscription->user) {
            $subscription->user->subscription_status = 'none';
            $subscription->user->subscription_id = null;
            $subscription->user->save();
        }

        $subscription->delete();

        return response()->json(['message' => 'Subscription record deleted/cancelled.']);
    }

    private function getReimbursementsFile(): array
    {
        $path = storage_path('app/reimbursements.json');
        if (!file_exists($path)) return [];
        return json_decode(file_get_contents($path), true) ?: [];
    }

    private function saveReimbursementsFile(array $data): void
    {
        $path = storage_path('app/reimbursements.json');
        if (!is_dir(dirname($path))) {
            @mkdir(dirname($path), 0777, true);
        }
        file_put_contents($path, json_encode(array_values($data), JSON_PRETTY_PRINT));
    }

    public function reimbursements(): JsonResponse
    {
        $requests = $this->getReimbursementsFile();
        return response()->json(['status' => 'success', 'data' => $requests]);
    }

    public function reviewReimbursement(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'action' => 'required|in:approve,reject',
            'rejection_reason' => 'nullable|string',
        ]);

        $requests = $this->getReimbursementsFile();
        $foundIndex = -1;

        foreach ($requests as $idx => $r) {
            if ($r['id'] === $id) {
                $foundIndex = $idx;
                break;
            }
        }

        if ($foundIndex === -1) {
            return response()->json(['error' => 'Reimbursement request not found.'], 404);
        }

        $req = $requests[$foundIndex];

        if ($validated['action'] === 'approve') {
            $req['status'] = 'approved';
            $req['rejection_reason'] = null;
            $req['reviewed_at'] = now()->toIso8601String();

            $member = Member::find($req['member_id']);
            if ($member) {
                $member->update([
                    'is_subscribed' => false,
                    'subscription_expires_at' => now(),
                ]);
            }
            $user = \App\Models\User::find($req['user_id']);
            if ($user) {
                $user->update(['subscription_status' => 'refunded']);
            }
        } else {
            $req['status'] = 'rejected';
            $req['rejection_reason'] = $validated['rejection_reason'] ?? 'Request does not meet refund policy terms.';
            $req['reviewed_at'] = now()->toIso8601String();
        }

        $requests[$foundIndex] = $req;
        $this->saveReimbursementsFile($requests);

        return response()->json([
            'message' => 'Reimbursement request reviewed successfully.',
            'data' => $req,
        ]);
    }
}
