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

    public function checkoutCart(Request $request): JsonResponse
    {
        $user = $request->user();
        $member = $user->member;

        if (!$member) {
            return $this->sendError('User does not have an active Member profile.', [], 403);
        }

        $validated = $request->validate([
            'phone_number' => 'required|string',
            'items' => 'required|array|min:1',
            'items.*.book_id' => 'required|integer|exists:books,id',
            'items.*.quantity' => 'nullable|integer|min:1',
        ]);

        $totalAmount = 0;
        $booksToPurchase = [];

        foreach ($validated['items'] as $item) {
            $book = Book::find($item['book_id']);
            $qty = $item['quantity'] ?? 1;
            if ($book) {
                $unitPrice = $this->digitalService->calculatePurchasePrice($book, $member);
                $totalAmount += ($unitPrice * $qty);
                $booksToPurchase[] = ['book' => $book, 'qty' => $qty];
            }
        }

        if (empty($booksToPurchase)) {
            return $this->sendError('No valid books found in cart.', [], 400);
        }

        // Initiate ONE Daraja M-Pesa STK Push for grand total
        $stkResponse = $this->darajaService->initiateStkPush(
            null,
            $validated['phone_number'],
            round($totalAmount, 2),
            "CART-CHECKOUT-" . count($booksToPurchase) . "-ITEMS"
        );

        $purchases = [];
        foreach ($booksToPurchase as $entry) {
            $purchases[] = $this->digitalService->purchaseDigitalBook(
                $user,
                $member,
                $entry['book'],
                $stkResponse['CheckoutRequestID'] ?? null
            );
        }

        return $this->sendResponse([
            'purchases' => $purchases,
            'total_amount' => round($totalAmount, 2),
            'stk_push' => $stkResponse,
        ], 'Cart checkout completed. Lifetime access unlocked for all items.', 201);
    }

    public function read(Request $request, int|string $id): JsonResponse
    {
        $user = $request->user();
        $book = $request->attributes->get('resolved_book') ?? Book::find($id);

        if (!$book && $user) {
            $purchase = DigitalPurchase::where('id', $id)
                ->where('user_id', $user->id)
                ->first();
            if ($purchase) {
                $book = $purchase->book;
            }
        }

        if (!$book) {
            return $this->sendError('Target book not found.', [], 404);
        }

        $fileUrl = null;
        $contentType = 'text';
        $chapters = [];
        $readingMinutes = 60;

        if ($book->file_path) {
            $rawPath = trim($book->file_path);

            if (str_starts_with($rawPath, '{') && str_ends_with($rawPath, '}')) {
                $decoded = json_decode($rawPath, true);
                if (is_array($decoded) && ($decoded['type'] ?? '') === 'chapters') {
                    $contentType = 'chapters';
                    $chapters = $decoded['chapters'] ?? [];
                    $readingMinutes = $decoded['estimated_reading_minutes'] ?? 120;
                }
            } elseif (str_starts_with($rawPath, 'data:application/pdf')) {
                $contentType = 'pdf_data';
                $fileUrl = $rawPath;
            } elseif (str_starts_with($rawPath, 'http://') || str_starts_with($rawPath, 'https://')) {
                $contentType = 'embed_url';
                $fileUrl = $rawPath;
            } else {
                $fileUrl = url($rawPath);
            }
        }

        // If no chapters decoded but plain text description exists, create fallback chapter
        if ($contentType !== 'chapters' && empty($chapters) && empty($fileUrl)) {
            $contentType = 'chapters';
            $chapters = [
                [
                    'number' => 1,
                    'title' => 'Overview and Introduction',
                    'subtitle' => 'Official Library Reading Material',
                    'content' => $book->description ?: "Welcome to the digital edition of {$book->title} by {$book->author}.",
                ],
            ];
        }

        return $this->sendResponse([
            'book_id' => $book->id,
            'title' => $book->title,
            'author' => $book->author,
            'cover_image_path' => $book->cover_image_path,
            'description' => $book->description,
            'content_type' => $contentType,
            'file_url' => $fileUrl,
            'chapters' => $chapters,
            'total_chapters' => count($chapters),
            'estimated_reading_minutes' => $readingMinutes,
            'access_type' => 'lifetime',
            'stream_token' => bin2hex(random_bytes(16)),
        ], 'Digital content stream authorized.');
    }

    public function myLibrary(Request $request): JsonResponse
    {
        $user = $request->user();
        $purchases = DigitalPurchase::where('user_id', $user->id)
            ->where('status', 'active')
            ->with('book')
            ->latest()
            ->get();

        return $this->sendResponse($purchases, 'Purchased digital library retrieved.');
    }
}
