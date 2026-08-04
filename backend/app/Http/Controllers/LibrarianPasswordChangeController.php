<?php

namespace App\Http\Controllers;

use App\Contracts\Services\LibrarianAuthServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LibrarianPasswordChangeController extends Controller
{
    public function __construct(
        protected LibrarianAuthServiceInterface $librarianAuthService
    ) {}

    public function changePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'new_password' => 'required|string|min:6|confirmed',
        ]);

        $user = $request->user();

        $updatedUser = $this->librarianAuthService->changeFirstLoginPassword($user, $validated['new_password']);

        return response()->json([
            'status' => 'success',
            'message' => 'Password updated successfully! You now have full access to your librarian portal.',
            'must_change_password' => false,
            'user' => $updatedUser,
        ]);
    }
}
