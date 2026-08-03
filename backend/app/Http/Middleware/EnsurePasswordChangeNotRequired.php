<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePasswordChangeNotRequired
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->must_change_password) {
            return response()->json([
                'error' => 'Password Change Required',
                'message' => 'First-time login detected. You must update your temporary password before accessing library features.',
                'must_change_password' => true,
            ], 428); // 428 Precondition Required
        }

        return $next($request);
    }
}
