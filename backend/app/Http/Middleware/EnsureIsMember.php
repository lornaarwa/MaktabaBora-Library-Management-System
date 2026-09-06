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
            $member = $user->member ?? \App\Models\Member::where('user_id', $user->id)->first();
            if (!$member) {
                $member = \App\Models\Member::create([
                    'user_id' => $user->id,
                    'member_number' => 'MEM-' . strtoupper(bin2hex(random_bytes(3))),
                    'membership_tier' => 'standard',
                    'borrow_limit' => 5,
                    'is_subscribed' => true,
                ]);
            }

            if ($member->is_banned) {
                return response()->json([
                    'error' => 'Account Suspended',
                    'message' => 'Your library account is currently suspended: ' . ($member->ban_reason ?? 'Contact library administrator.'),
                ], 403);
            }
        }

        return $next($request);
    }
}
