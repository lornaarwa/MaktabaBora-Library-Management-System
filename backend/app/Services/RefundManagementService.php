<?php

namespace App\Services;

use App\Contracts\Services\RefundManagementServiceInterface;
use App\Models\Member;
use App\Models\RefundRequest;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use RuntimeException;

class RefundManagementService implements RefundManagementServiceInterface
{
    public function submitRefundRequest(User $user, Member $member, float $amount, string $reason): RefundRequest
    {
        $activeSub = Subscription::where('member_id', $member->id)
            ->where('payment_status', 'paid')
            ->latest()
            ->first();

        return RefundRequest::create([
            'user_id' => $user->id,
            'member_id' => $member->id,
            'subscription_id' => $activeSub?->id,
            'amount' => $amount,
            'reason' => $reason,
            'status' => 'pending',
            'payment_reference' => $activeSub?->transaction_reference ?? ('MPESA-REF-' . strtoupper(bin2hex(random_bytes(3)))),
        ]);
    }

    public function getAllRefundRequests(): Collection
    {
        return RefundRequest::with(['user', 'member', 'subscription', 'processor'])
            ->latest()
            ->get();
    }

    public function approveRefund(int $refundRequestId, User $librarianUser): RefundRequest
    {
        $refund = RefundRequest::findOrFail($refundRequestId);

        if ($refund->status !== 'pending') {
            throw new RuntimeException("Refund request #{$refundRequestId} has already been processed.");
        }

        $refund->update([
            'status' => 'approved',
            'processed_by' => $librarianUser->id,
            'processed_at' => now(),
        ]);

        if ($refund->subscription) {
            $refund->subscription->update([
                'payment_status' => 'refunded',
            ]);
        }

        $member = $refund->member;
        if ($member) {
            $member->update([
                'is_subscribed' => false,
                'subscription_expires_at' => now(),
            ]);
        }

        $user = $refund->user;
        if ($user) {
            $user->update([
                'subscription_status' => 'refunded',
            ]);
        }

        return $refund->fresh(['user', 'member', 'subscription', 'processor']);
    }

    public function rejectRefund(int $refundRequestId, User $librarianUser): RefundRequest
    {
        $refund = RefundRequest::findOrFail($refundRequestId);

        if ($refund->status !== 'pending') {
            throw new RuntimeException("Refund request #{$refundRequestId} has already been processed.");
        }

        $refund->update([
            'status' => 'rejected',
            'processed_by' => $librarianUser->id,
            'processed_at' => now(),
        ]);

        return $refund->fresh(['user', 'member', 'subscription', 'processor']);
    }
}
