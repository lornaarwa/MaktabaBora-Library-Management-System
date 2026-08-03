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
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'member',
        ]);

        Member::create([
            'user_id' => $user->id,
            'member_number' => 'MEM-' . strtoupper(bin2hex(random_bytes(3))),
            'membership_tier' => 'general',
            'borrow_limit' => 3,
        ]);

        $token = $this->authSessionService->generateToken($user);

        return response()->json([
            'message' => 'Registration successful',
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    public function registerMembershipStk(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
            'phone_number' => 'required|string',
            'id_number' => 'nullable|string',
            'membership_tier' => 'nullable|string',
            'amount' => 'nullable|numeric',
        ]);

        $tier = $validated['membership_tier'] ?? 'standard';
        $amount = (float) ($validated['amount'] ?? 1500.00);

        $borrowLimit = 7;
        if ($tier === 'student') {
            $borrowLimit = 3;
        } elseif ($tier === 'scholar') {
            $borrowLimit = 15;
        }

        // 1. Save User to Database
        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'member',
        ]);

        // 2. Initiate Daraja M-Pesa STK Push
        $darajaService = app(\App\Contracts\Services\DarajaPaymentServiceInterface::class);
        $stkResponse = $darajaService->initiateStkPush(null, $validated['phone_number'], $amount, "MEMBERSHIP-{$tier}");

        // 3. Create Member Profile with Activated Status saved to Database
        $member = Member::create([
            'user_id' => $user->id,
            'member_number' => 'MB-' . rand(100000, 999999),
            'membership_tier' => $tier,
            'borrow_limit' => $borrowLimit,
            'is_subscribed' => true,
            'subscription_expires_at' => now()->addYear(),
        ]);

        // 4. Save Subscription Record in Database
        $subscription = \App\Models\Subscription::create([
            'member_id' => $member->id,
            'user_id' => $user->id,
            'plan_type' => ucfirst($tier) . ' Membership Pass',
            'amount_paid' => $amount,
            'payment_status' => 'completed',
            'transaction_reference' => $stkResponse['CheckoutRequestID'] ?? ('MPESA-' . strtoupper(bin2hex(random_bytes(4)))),
            'starts_at' => now(),
            'expires_at' => now()->addYear(),
        ]);

        $token = $this->authSessionService->generateToken($user);

        return response()->json([
            'message' => 'Membership registered and activated via M-Pesa payment.',
            'user' => $user->load('member'),
            'token' => $token,
            'subscription' => $subscription,
            'stk_response' => $stkResponse,
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

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|max:255|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:20',
            'id_number' => 'nullable|string|max:50',
        ]);

        if (isset($validated['name'])) $user->name = $validated['name'];
        if (isset($validated['email'])) $user->email = $validated['email'];
        if (isset($validated['phone'])) $user->phone = $validated['phone'];
        $user->save();

        if ($user->member && isset($validated['id_number'])) {
            $user->member->update(['id_number' => $validated['id_number']]);
        }

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $user->fresh('member', 'librarian'),
        ]);
    }
}
