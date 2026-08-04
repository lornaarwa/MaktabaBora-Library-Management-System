<?php

namespace App\Contracts\Services;

use App\Models\User;

interface LibrarianAuthServiceInterface
{
    public function changeFirstLoginPassword(User $user, string $newPassword): User;
}
