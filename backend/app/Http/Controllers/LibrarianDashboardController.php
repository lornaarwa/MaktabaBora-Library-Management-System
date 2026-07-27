<?php

namespace App\Http\Controllers;

use App\Contracts\Services\BorrowLimitServiceInterface;
use App\Models\Book;
use App\Models\BookCopy;
use App\Models\Fine;
use App\Models\Loan;
use App\Models\Member;
use App\Models\Reservation;
use App\Models\Category;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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
                'department' => $m->department,
                'programme' => $m->programme,
                'interests' => $m->interests,
                'is_approved' => $m->is_approved,
                'membership_fee_paid' => $m->membership_fee_paid,
                'borrow_limit' => $m->borrow_limit,
                'is_banned' => $m->is_banned,
                'active_loans_count' => Loan::where('member_id', $m->id)->where('status', 'active')->count(),
                'total_loans_count' => Loan::where('member_id', $m->id)->count(),
                'reserved_books_count' => Reservation::where('member_id', $m->id)->whereIn('status', ['pending', 'ready_for_pickup'])->count(),
                'fines_amount' => Fine::where('member_id', $m->id)->where('status', 'unpaid')->sum('balance'),
            ];
        });

        return response()->json(['status' => 'success', 'data' => $members]);
    }

    public function approveMember(Member $member): JsonResponse
    {
        if (!$member->membership_fee_paid) {
            return response()->json([
                'error' => 'Unpaid Fee',
                'message' => 'Cannot approve member before membership activation fee is paid.'
            ], 422);
        }

        $member->update(['is_approved' => true]);

        return response()->json([
            'message' => 'Member membership approved successfully',
            'member' => $member,
        ]);
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

    /**
     * Record a cash, card, or mpesa payment for membership fee, overdue fines, or lost book replacement
     */
    public function recordPayment(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'member_id' => 'required|exists:members,id',
            'amount' => 'required|numeric|min:0.01',
            'payment_type' => 'required|string|in:membership_fee,fine,lost_book_fee',
            'payment_method' => 'required|string|in:cash,mpesa,card',
            'transaction_reference' => 'nullable|string',
            'fine_id' => 'nullable|exists:fines,id',
            'loan_id' => 'nullable|exists:loans,id',
        ]);

        $member = Member::find($validated['member_id']);
        
        $payment = Payment::create([
            'member_id' => $validated['member_id'],
            'amount' => $validated['amount'],
            'payment_type' => $validated['payment_type'],
            'payment_method' => $validated['payment_method'],
            'transaction_reference' => $validated['transaction_reference'] ?? ('PAY-' . strtoupper(bin2hex(random_bytes(4)))),
            'status' => 'completed',
            'fine_id' => $validated['fine_id'] ?? null,
            'loan_id' => $validated['loan_id'] ?? null,
        ]);

        if ($validated['payment_type'] === 'membership_fee') {
            $member->update(['membership_fee_paid' => true]);
        } elseif ($validated['payment_type'] === 'fine' || $validated['payment_type'] === 'lost_book_fee') {
            if (!empty($validated['fine_id'])) {
                $fine = Fine::find($validated['fine_id']);
                $newBalance = max(0, $fine->balance - $validated['amount']);
                $fine->update([
                    'balance' => $newBalance,
                    'status' => $newBalance <= 0 ? 'paid' : 'partial',
                    'transaction_reference' => $payment->transaction_reference,
                ]);

                // If lost book fee and now paid, close case
                if ($validated['payment_type'] === 'lost_book_fee' && $newBalance <= 0 && $fine->loan_id) {
                    $loan = Loan::find($fine->loan_id);
                    if ($loan) {
                        $loan->update(['status' => 'lost_resolved']);
                    }
                }
            }
        }

        return response()->json([
            'message' => 'Payment recorded successfully',
            'payment' => $payment,
            'member' => $member->fresh(),
        ], 201);
    }

    /**
     * Record a book copy as lost and calculate penalty
     */
    public function markLost(Loan $loan): JsonResponse
    {
        if ($loan->status === 'returned' || $loan->status === 'lost_resolved') {
            return response()->json(['error' => 'Loan is already closed'], 400);
        }

        // Set status
        $loan->update(['status' => 'lost']);

        $copy = $loan->bookCopy;
        $copy->update(['condition' => 'lost']);
        
        // Decrement available copies of Book
        $copy->book->decrement('available_copies');

        // Penalty fee: Book replacement fee (default 1000 KES if not known) + 500 KES administrative penalty
        $bookReplacementPrice = 1000.00;
        $penaltyAmount = $bookReplacementPrice + 500.00;

        $fine = Fine::create([
            'loan_id' => $loan->id,
            'member_id' => $loan->member_id,
            'amount' => $penaltyAmount,
            'balance' => $penaltyAmount,
            'status' => 'unpaid',
            'reason' => 'lost_book_fee',
        ]);

        return response()->json([
            'message' => 'Book marked as lost. Penalty replacement fee calculated.',
            'loan' => $loan->load('bookCopy.book'),
            'fine' => $fine,
        ]);
    }

    /**
     * Categories Management endpoints
     */
    public function getCategories(): JsonResponse
    {
        return response()->json(Category::all());
    }

    public function manageCategories(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'action' => 'required|string|in:create,update,delete',
            'id' => 'nullable|exists:categories,id',
            'name' => 'required_if:action,create,update|string|max:255',
            'description' => 'nullable|string',
        ]);

        if ($validated['action'] === 'create') {
            $category = Category::create([
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
            ]);
            return response()->json(['message' => 'Category created successfully', 'category' => $category], 201);
        }

        $category = Category::find($validated['id']);

        if ($validated['action'] === 'update') {
            $category->update([
                'name' => $validated['name'],
                'description' => $validated['description'] ?? $category->description,
            ]);
            return response()->json(['message' => 'Category updated successfully', 'category' => $category]);
        }

        // Delete action
        $category->delete();
        return response()->json(['message' => 'Category deleted successfully']);
    }

    /**
     * Book Demand Prediction
     */
    public function getDemandPredictions(): JsonResponse
    {
        $books = Book::all()->map(function ($book) {
            $reservationsCount = Reservation::where('book_id', $book->id)
                ->whereIn('status', ['pending', 'ready_for_pickup'])
                ->count();

            $activeLoansCount = Loan::join('book_copies', 'loans.book_copy_id', '=', 'book_copies.id')
                ->where('book_copies.book_id', $book->id)
                ->where('loans.status', 'active')
                ->count();

            $utilizationRate = $book->total_copies > 0 
                ? round(($activeLoansCount / $book->total_copies) * 100, 1) 
                : 0;

            // Demand score formula: (reservations * 3) + (active loans * 1)
            $demandScore = ($reservationsCount * 3) + ($activeLoansCount * 1);

            $recommendation = 'Maintain Stock';
            $recommendedPurchase = 0;

            if ($demandScore >= 7) {
                $recommendation = 'Critical Shortage: Purchase copies immediately';
                $recommendedPurchase = max(2, ceil($reservationsCount));
            } elseif ($demandScore >= 3) {
                $recommendation = 'High Demand: Monitor and consider additional copies';
                $recommendedPurchase = 1;
            }

            return [
                'id' => $book->id,
                'title' => $book->title,
                'author' => $book->author,
                'total_copies' => $book->total_copies,
                'available_copies' => $book->available_copies,
                'reservations_count' => $reservationsCount,
                'active_loans_count' => $activeLoansCount,
                'utilization_rate' => $utilizationRate,
                'demand_score' => $demandScore,
                'recommendation' => $recommendation,
                'recommended_purchase' => $recommendedPurchase,
            ];
        })->sortByDesc('demand_score')->values();

        return response()->json(['status' => 'success', 'data' => $books]);
    }

    /**
     * Borrowing Analytics
     */
    public function getBorrowingAnalytics(): JsonResponse
    {
        // 1. Loans per category
        $loansPerCategory = Category::withCount('books')->get()->map(function ($cat) {
            $loansCount = Loan::join('book_copies', 'loans.book_copy_id', '=', 'book_copies.id')
                ->join('books', 'book_copies.book_id', '=', 'books.id')
                ->where('books.category_id', $cat->id)
                ->count();
            return [
                'category' => $cat->name,
                'loans_count' => $loansCount,
            ];
        });

        // 2. Overdue rate
        $totalLoans = Loan::count();
        $overdueLoans = Loan::where('status', 'overdue')->orWhere(function ($q) {
            $q->whereNotNull('returned_date')->whereColumn('returned_date', '>', 'due_date');
        })->count();
        $overdueRate = $totalLoans > 0 ? round(($overdueLoans / $totalLoans) * 100, 1) : 0;

        // 3. Top borrowed books
        $topBooks = Book::all()->map(function ($book) {
            $loansCount = Loan::join('book_copies', 'loans.book_copy_id', '=', 'book_copies.id')
                ->where('book_copies.book_id', $book->id)
                ->count();
            return [
                'title' => $book->title,
                'author' => $book->author,
                'loans_count' => $loansCount,
            ];
        })->sortByDesc('loans_count')->take(5)->values();

        // 4. Overdue books directory
        $overdueList = Loan::with('member.user', 'bookCopy.book')
            ->where('status', 'overdue')
            ->get()
            ->map(function ($loan) {
                return [
                    'id' => $loan->id,
                    'book_title' => $loan->bookCopy->book->title,
                    'member_name' => $loan->member->user->name,
                    'member_email' => $loan->member->user->email,
                    'due_date' => $loan->due_date,
                    'days_overdue' => now()->diffInDays($loan->due_date),
                ];
            });

        return response()->json([
            'status' => 'success',
            'data' => [
                'loans_per_category' => $loansPerCategory,
                'overdue_rate' => $overdueRate,
                'top_books' => $topBooks,
                'overdue_books' => $overdueList,
                'total_loans' => $totalLoans,
            ]
        ]);
    }
}
