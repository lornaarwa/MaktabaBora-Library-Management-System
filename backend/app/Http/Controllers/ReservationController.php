<?php

namespace App\Http\Controllers;

use App\Contracts\Services\QueueReservationServiceInterface;
use App\Models\Book;
use App\Models\Reservation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReservationController extends Controller
{
    protected QueueReservationServiceInterface $reservationService;

    public function __construct(QueueReservationServiceInterface $reservationService)
    {
        $this->reservationService = $reservationService;
    }

    public function index(Request $request): JsonResponse
    {
        $member = $request->user()->member;

        if (!$member) {
            return response()->json([
                'status' => 'success',
                'data' => [],
            ]);
        }

        $reservations = Reservation::where('member_id', $member->id)
            ->with(['book'])
            ->latest()
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $reservations,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'book_id' => 'required|exists:books,id',
        ]);

        $user = $request->user();
        $book = Book::findOrFail($validated['book_id']);

        $reservation = $this->reservationService->reserveBook($user, $book);

        return response()->json([
            'message' => 'Book reservation queue hold placed successfully',
            'reservation' => $reservation->load('book'),
        ], 201);
    }
}
