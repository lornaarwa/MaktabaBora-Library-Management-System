<?php

namespace App\Http\Controllers;

use App\Contracts\Services\DarajaPaymentServiceInterface;
use App\Contracts\Services\DigitalRentalServiceInterface;
use App\Models\Book;
use App\Models\DigitalPurchase;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DigitalRentalController extends Controller
{
    public function __construct(
        protected DigitalRentalServiceInterface $digitalService,
        protected DarajaPaymentServiceInterface $darajaService
    ) {}

    public function purchase(Request $request, int|string $id): JsonResponse
    {
        $user = $request->user();
        $member = $user->member;

        if (!$member) {
            return $this->sendError('User does not have an active Member profile.', [], 403);
        }

        $book = Book::find($id);
        if (!$book) {
            return $this->sendError('Book not found.', [], 404);
        }

        $validated = $request->validate([
            'phone_number' => 'required|string',
        ]);

        $finalPrice = $this->digitalService->calculatePurchasePrice($book, $member);

        // Initiate Daraja M-Pesa STK Push
        $stkResponse = $this->darajaService->initiateStkPush(
            null,
            $validated['phone_number'],
            $finalPrice,
            "DIGITAL-BOOK-{$book->id}"
        );

        // Grant Digital Purchase Lifetime Access
        $purchase = $this->digitalService->purchaseDigitalBook(
            $user,
            $member,
            $book,
            $stkResponse['CheckoutRequestID'] ?? null
        );

        return $this->sendResponse([
            'purchase' => $purchase,
            'standard_price' => $book->digital_purchase_price ?? 50.00,
            'discount_applied' => $member->is_subscribed,
            'amount_paid' => $finalPrice,
            'stk_push' => $stkResponse,
        ], 'Digital book purchase completed. Lifetime access unlocked.', 201);
    }

    public function read(Request $request, int|string $id): JsonResponse
    {
        $book = Book::find($id);

        $fileUrl = null;
        if ($book->file_path) {
            if (str_starts_with($book->file_path, 'data:') || str_starts_with($book->file_path, 'http://') || str_starts_with($book->file_path, 'https://')) {
                $fileUrl = $book->file_path;
            } else {
                $fileUrl = url($book->file_path);
            }
        } else {
            $fileUrl = url("/storage/digital-books/sample-{$book->id}.pdf");
        }

        return $this->sendResponse([
            'book_id' => $book->id,
            'title' => $book->title,
            'file_url' => $fileUrl,
            'access_type' => 'lifetime',
            'stream_token' => bin2hex(random_bytes(16)),
        ], 'Digital content stream authorized.');
    }

    public function myLibrary(Request $request): JsonResponse
    {
        $user = $request->user();
        $purchases = DigitalPurchase::where('user_id', $user->id)
            ->with('book')
            ->get();

        return $this->sendResponse($purchases, 'Purchased digital library retrieved.');
    }
}
