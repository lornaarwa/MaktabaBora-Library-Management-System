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

    /**
     * Generate short-lived Access Token (15 minutes) or persistent token (30 days if remember)
     */
    public function generateToken(User $user, bool $remember = false): string
    {
        $ttl = $remember ? (60 * 60 * 24 * 30) : (60 * 15); // 30 days vs 15 minutes (short-lived)
        return $this->buildJwt($user, 'access', $ttl);
    }

    /**
     * Short-lived access token (15 minutes expiration)
     */
    public function generateAccessToken(User $user): string
    {
        return $this->buildJwt($user, 'access', 60 * 15);
    }

    /**
     * Refresh token (30 days expiration)
     */
    public function generateRefreshToken(User $user): string
    {
        return $this->buildJwt($user, 'refresh', 60 * 60 * 24 * 30);
    }

    /**
     * Helper to construct signed JWT token
     */
    protected function buildJwt(User $user, string $type, int $ttlSeconds): string
    {
        $header = base64_encode(json_encode(['typ' => 'JWT', 'alg' => 'HS256']));
        $payload = base64_encode(json_encode([
            'sub' => $user->id,
            'email' => $user->email,
            'role' => $user->role ?? 'member',
            'type' => $type,
            'iat' => time(),
            'exp' => time() + $ttlSeconds,
        ]));

        $signature = hash_hmac('sha256', "$header.$payload", $this->secret);
        return "$header.$payload.$signature";
    }

    /**
     * Completely stateless JWT validation with optional blacklist check
     */
    public function validateToken(string $token): ?array
    {
        try {
            if (Cache::has("blacklisted_token:" . md5($token))) {
                return null;
            }
        } catch (\Throwable $e) {
            // Ignore cache store connectivity errors safely
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
        if (!$data || !isset($data['exp']) || $data['exp'] < time()) {
            return null;
        }

        return $data;
    }

    public function blacklistToken(string $token): void
    {
        $decoded = $this->validateToken($token);
        if ($decoded) {
            $ttl = max(1, $decoded['exp'] - time());
            try {
                Cache::put("blacklisted_token:" . md5($token), true, $ttl);
            } catch (\Throwable $e) {
                // Ignore cache store connectivity errors safely
            }
        }
    }
}
