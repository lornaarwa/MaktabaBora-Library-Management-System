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

        return $next($request);
    }
}
