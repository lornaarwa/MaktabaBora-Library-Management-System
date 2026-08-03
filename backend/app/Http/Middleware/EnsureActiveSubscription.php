<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureActiveSubscription
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'error' => 'Unauthenticated',
                'message' => 'Please sign in to access subscription perks.',
            ], 401);
        }

        $member = $user->member;

        if (!$member || !$member->is_subscribed) {
            return response()->json([
                'error' => 'Subscription Required',
                'message' => 'Perk discounts and member benefits are exclusively reserved for members with an active subscription.',
                'requires_subscription' => true,
            ], 403);
        }

        return $next($request);
    }
}
