<?php

namespace App\Http\Controllers;

use App\Contracts\Services\DarajaPaymentServiceInterface;
use App\Contracts\Services\DigitalRentalServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    public function __construct(
        protected DigitalRentalServiceInterface $digitalService,
        protected DarajaPaymentServiceInterface $darajaService
    ) {}

    public function checkout(Request $request): JsonResponse
    {
        $user = $request->user();
        $member = $user->member;

        if (!$member) {
            return $this->sendError('User does not have an active Member profile.', [], 403);
        }

        $validated = $request->validate([
            'plan_type' => 'sometimes|string',
            'membership_tier' => 'sometimes|string',
            'phone_number' => 'required|string',
            'amount' => 'sometimes|numeric',
        ]);

        $planType = $validated['membership_tier'] ?? $validated['plan_type'] ?? 'standard';
        $amount = isset($validated['amount']) ? (float)$validated['amount'] : 1500.00;

        // Initiate Daraja M-Pesa STK Push
        $stkResponse = $this->darajaService->initiateStkPush(null, $validated['phone_number'], $amount, "MEMBERSHIP-{$planType}");

        // Activate subscription pass
        $subscription = $this->digitalService->activatePerkSubscription(
            $user,
            $member,
            $planType,
            $amount,
            $stkResponse['CheckoutRequestID'] ?? null
        );

        $user->load('member');

        return response()->json([
            'status' => 'success',
            'message' => 'Membership checkout completed successfully.',
            'user' => $user,
            'subscription' => $subscription,
            'stk_push' => $stkResponse,
            'data' => [
                'user' => $user,
                'subscription' => $subscription,
                'stk_push' => $stkResponse,
            ]
        ], 201);
    }

    public function status(Request $request): JsonResponse
    {
        $user = $request->user();
        $member = $user->member;

        if (!$member) {
            return $this->sendError('User does not have an active Member profile.', [], 403);
        }

        $activeSub = $user->activeSubscription;

        return $this->sendResponse([
            'is_subscribed' => $member->is_subscribed,
            'subscription_expires_at' => $member->subscription_expires_at,
            'active_subscription' => $activeSub,
        ], 'Subscription status retrieved.');
    }

    public function cancel(Request $request): JsonResponse
    {
        $user = $request->user();
        $member = $user->member;

        if (!$member) {
            return response()->json(['error' => 'Member profile not found'], 404);
        }

        $member->update([
            'is_subscribed' => false,
            'subscription_expires_at' => now(),
        ]);

        $user->update([
            'subscription_status' => 'cancelled',
        ]);

        return response()->json([
            'message' => 'Membership cancelled successfully.',
            'user' => $user->fresh('member'),
        ]);
    }

    private function getReimbursementsFile(): array
    {
        $path = storage_path('app/reimbursements.json');
        if (!file_exists($path)) return [];
        return json_decode(file_get_contents($path), true) ?: [];
    }

    private function saveReimbursementsFile(array $data): void
    {
        $path = storage_path('app/reimbursements.json');
        if (!is_dir(dirname($path))) {
            @mkdir(dirname($path), 0777, true);
        }
        file_put_contents($path, json_encode(array_values($data), JSON_PRETTY_PRINT));
    }

    public function requestRefund(Request $request): JsonResponse
    {
        $user = $request->user();
        $member = $user->member;

        if (!$member) {
            return response()->json(['error' => 'Member profile not found'], 404);
        }

        $validated = $request->validate([
            'reason' => 'required|string|min:5',
        ]);

        $requests = $this->getReimbursementsFile();
        $refId = 'REF-' . strtoupper(bin2hex(random_bytes(3)));

        $tier = $member->membership_tier || 'standard';
        $amount = 1500.00;
        if ($tier === 'student') $amount = 500.00;
        elseif ($tier === 'scholar') $amount = 3000.00;

        $newRecord = [
            'id' => $refId,
            'user_id' => $user->id,
            'member_id' => $member->id,
            'user_name' => $user->name,
            'user_email' => $user->email,
            'membership_tier' => $tier,
            'amount' => $amount,
            'reason' => $validated['reason'],
            'status' => 'pending',
            'rejection_reason' => null,
            'created_at' => now()->toIso8601String(),
            'reviewed_at' => null,
        ];

        // Replace any previous pending request or prepend
        $requests = array_filter($requests, function ($r) use ($user) {
            return !($r['user_id'] == $user->id && $r['status'] == 'pending');
        });
        array_unshift($requests, $newRecord);
        $this->saveReimbursementsFile($requests);

        return response()->json([
            'message' => 'Reimbursement request submitted successfully and is pending review by library admins.',
            'reimbursement' => $newRecord,
            'refund_reference' => $refId,
            'status' => 'pending',
        ]);
    }

    public function refundStatus(Request $request): JsonResponse
    {
        $user = $request->user();
        $requests = $this->getReimbursementsFile();

        $userRequests = array_values(array_filter($requests, function ($r) use ($user) {
            return $r['user_id'] == $user->id;
        }));

        $latestRequest = count($userRequests) > 0 ? $userRequests[0] : null;

        return response()->json([
            'status' => 'success',
            'latest_reimbursement' => $latestRequest,
            'reimbursements' => $userRequests,
        ]);
    }
}
