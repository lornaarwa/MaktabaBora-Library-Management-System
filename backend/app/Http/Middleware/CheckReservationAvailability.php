<?php

namespace App\Http\Middleware;

use App\Models\Reservation;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckReservationAvailability
{
    public function handle(Request $request, Closure $next): Response
    {
        $bookId = $request->input('book_id');
        $user = $request->user();

        if ($bookId && $user) {
            $member = $user->member ?? \App\Models\Member::where('user_id', $user->id)->first();
            if ($member) {
                if (!$member->is_approved) {
                    return response()->json([
                        'error' => 'Inactive Membership',
                        'message' => 'Your library membership is not approved. Please contact the librarian.'
                    ], 403);
                }

                if (!$member->membership_fee_paid) {
                    return response()->json([
                        'error' => 'Membership Fee Required',
                        'message' => 'Your library membership fee is not paid. Please pay the activation fee before reserving books.'
                    ], 402);
                }

                $existingHold = Reservation::where('book_id', $bookId)
                    ->where('member_id', $member->id)
                    ->whereIn('status', ['pending', 'ready_for_pickup'])
                    ->first();

                if ($existingHold) {
                    return response()->json([
                        'error' => 'Duplicate Reservation',
                        'message' => 'You already have an active hold or reservation queue spot for this book.'
                    ], 409);
                }
            }
        }

        return $next($request);
    }
}
