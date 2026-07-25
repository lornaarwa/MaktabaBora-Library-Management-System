<?php

namespace App\Http\Controllers;

use App\Contracts\Services\AuthSessionServiceInterface;
use App\Models\Member;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    protected AuthSessionServiceInterface $authSessionService;

    public function __construct(AuthSessionServiceInterface $authSessionService)
    {
        $this->authSessionService = $authSessionService;
    }

    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role' => 'nullable|string|in:member,librarian,admin',
            'membership_tier' => 'nullable|string|in:student,faculty,general',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'] ?? 'member',
        ]);

        if ($user->role === 'member') {
            Member::create([
                'user_id' => $user->id,
                'member_number' => 'MEM-' . strtoupper(bin2hex(random_bytes(3))),
                'membership_tier' => $validated['membership_tier'] ?? 'general',
                'borrow_limit' => 3,
            ]);
        }

        $token = $this->authSessionService->generateToken($user);

        return response()->json([
            'message' => 'Registration successful',
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
            'remember' => 'nullable|boolean',
        ]);

        $user = User::where('email', $credentials['email'])->first();

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            return response()->json(['error' => 'Invalid email or password'], 401);
        }

        if ($user->role === 'member') {
            $member = Member::where('user_id', $user->id)->first();
            if ($member && $member->is_banned) {
                return response()->json([
                    'error' => 'Account Banned',
                    'message' => 'Your account is currently suspended.',
                    'reason' => $member->ban_reason,
                ], 403);
            }
        }

        $remember = (bool) ($credentials['remember'] ?? false);
        $token = $this->authSessionService->generateToken($user, $remember);

        return response()->json([
            'message' => 'Login successful',
            'user' => $user->load('member', 'librarian'),
            'token' => $token,
        ]);
    }

    public function refresh(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        $token = $this->authSessionService->generateAccessToken($user);

        return response()->json([
            'message' => 'Token refreshed successfully',
            'token' => $token,
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user()->load('member', 'librarian')
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        return response()->json(['message' => 'Logged out successfully']);
    }
}
