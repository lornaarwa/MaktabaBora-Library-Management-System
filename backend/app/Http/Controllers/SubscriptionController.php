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
            'phone_number' => 'required|string',
            'amount' => 'sometimes|numeric',
        ]);

        $planType = $validated['plan_type'] ?? 'pro_perks_monthly';
        $amount = $validated['amount'] ?? 500.00;

        // Initiate Daraja M-Pesa STK Push
        $stkResponse = $this->darajaService->initiateStkPush(null, $validated['phone_number'], $amount, 'SUB-PERK-PASS');

        // Activate subscription pass
        $subscription = $this->digitalService->activatePerkSubscription(
            $user,
            $member,
            $planType,
            $amount,
            $stkResponse['CheckoutRequestID'] ?? null
        );

        return $this->sendResponse([
            'subscription' => $subscription,
            'stk_push' => $stkResponse,
        ], 'Perk subscription checkout initiated successfully.', 201);
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
}
