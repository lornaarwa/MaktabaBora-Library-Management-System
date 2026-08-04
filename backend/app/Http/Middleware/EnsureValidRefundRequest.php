<?php

namespace App\Http\Middleware;

use App\Models\RefundRequest;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureValidRefundRequest
{
    public function handle(Request $request, Closure $next): Response
    {
        $id = $request->route('id') ?? $request->route('refund');

        if ($id) {
            $refund = RefundRequest::find($id);

            if (!$refund) {
                return response()->json([
                    'error' => 'Not Found',
                    'message' => "Refund request #{$id} was not found in database records.",
                ], 404);
            }
        }

        return $next($request);
    }
}
