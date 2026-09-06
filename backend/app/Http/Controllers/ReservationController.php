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
        $user = $request->user();
        $member = $user->member ?? \App\Models\Member::where('user_id', $user->id)->first() ?? \App\Models\Member::where('email', $user->email)->first();

        if (!$member && $user->role !== 'admin') {
            return response()->json([
                'status' => 'success',
                'data' => [],
            ]);
        }

        $query = Reservation::with(['book']);

        if ($member) {
            $query->where('member_id', $member->id);
        }

        $reservations = $query->latest()->get();

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

    public function destroy(Request $request, Reservation $reservation): JsonResponse
    {
        $user = $request->user();
        $member = $user->member ?? \App\Models\Member::where('user_id', $user->id)->first();

        if ($user->role !== 'admin' && (!$member || $reservation->member_id !== $member->id)) {
            return response()->json([
                'error' => 'Unauthorized',
                'message' => 'You do not have permission to cancel this reservation.',
            ], 403);
        }

        $this->reservationService->cancelReservation($reservation);

        return response()->json([
            'status' => 'success',
            'message' => 'Book reservation hold cancelled successfully.',
        ]);
    }
}
