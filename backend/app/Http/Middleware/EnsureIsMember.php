<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureIsMember
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, ['member', 'admin'])) {
            return response()->json([
                'error' => 'Forbidden',
                'message' => 'Access restricted to library members.'
            ], 403);
        }

        if ($user->role === 'member') {
            $member = $user->member;
            if (!$member || !$member->is_subscribed) {
                return response()->json([
                    'error' => 'Active Membership Required',
                    'message' => 'Only users with an active membership can borrow books, reserve books, and access member services. Please register your membership.',
                    'requires_membership' => true,
                ], 403);
            }
        }

        return $next($request);
    }
}
