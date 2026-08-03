<?php

namespace App\Services;

use App\Contracts\Services\LibrarianAuthServiceInterface;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use InvalidArgumentException;

class LibrarianAuthService implements LibrarianAuthServiceInterface
{
    public function changeFirstLoginPassword(User $user, string $newPassword): User
    {
        if (strlen($newPassword) < 6) {
            throw new InvalidArgumentException("New password must be at least 6 characters long.");
        }

        $user->update([
            'password' => Hash::make($newPassword),
            'must_change_password' => false,
        ]);

        return $user->fresh(['member', 'librarian']);
    }
}
