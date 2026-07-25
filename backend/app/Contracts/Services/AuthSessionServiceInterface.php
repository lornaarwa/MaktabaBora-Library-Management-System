<?php

namespace App\Contracts\Services;

use App\Models\User;

interface AuthSessionServiceInterface
{
    public function createSessionToken(User $user, bool $remember = false): string;

    public function generateToken(User $user, bool $remember = false): string;

    public function generateAccessToken(User $user): string;

    public function generateRefreshToken(User $user): string;

    public function validateSessionToken(string $token): ?User;

    public function invalidateSessionToken(string $token): bool;

    public function getAuthenticatedUser(string $token): ?User;
}
