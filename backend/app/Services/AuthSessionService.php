<?php

namespace App\Services;

use App\Contracts\Services\AuthSessionServiceInterface;
use App\Models\User;
use Illuminate\Support\Facades\Cache;

class AuthSessionService implements AuthSessionServiceInterface
{
    protected string $secret;

    public function __construct()
    {
        $this->secret = config('app.key', 'secret-key-32-chars-long-placeholder');
    }

    public function createSessionToken(User $user, bool $remember = false): string
    {
        return $this->generateToken($user, $remember);
    }

    public function validateSessionToken(string $token): ?User
    {
        $payload = $this->validateToken($token);
        if (!$payload || !isset($payload['sub'])) {
            return null;
        }

        return User::find($payload['sub']);
    }

    public function invalidateSessionToken(string $token): bool
    {
        $this->blacklistToken($token);
        return true;
    }

    public function getAuthenticatedUser(string $token): ?User
    {
        return $this->validateSessionToken($token);
    }

    public function generateToken(User $user, bool $remember = false): string
    {
        $header = base64_encode(json_encode(['typ' => 'JWT', 'alg' => 'HS256']));
        $ttl = $remember ? (60 * 60 * 24 * 30) : (60 * 60 * 24); // 30 days vs 24 hours

        $payload = base64_encode(json_encode([
            'sub' => $user->id,
            'email' => $user->email,
            'role' => $user->role ?? 'member',
            'iat' => time(),
            'exp' => time() + $ttl,
        ]));

        $signature = hash_hmac('sha256', "$header.$payload", $this->secret);
        return "$header.$payload.$signature";
    }

    public function validateToken(string $token): ?array
    {
        if (Cache::has("blacklisted_token:" . md5($token))) {
            return null;
        }

        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }

        [$header, $payload, $signature] = $parts;
        $validSignature = hash_hmac('sha256', "$header.$payload", $this->secret);

        if (!hash_equals($validSignature, $signature)) {
            return null;
        }

        $data = json_decode(base64_decode($payload), true);
        if (!$data || ($data['exp'] ?? 0) < time()) {
            return null;
        }

        return $data;
    }

    public function blacklistToken(string $token): void
    {
        $decoded = $this->validateToken($token);
        if ($decoded) {
            $ttl = max(1, $decoded['exp'] - time());
            Cache::put("blacklisted_token:" . md5($token), true, $ttl);
        }
    }
}
