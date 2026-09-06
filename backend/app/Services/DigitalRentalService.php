<?php

namespace App\Services;

use App\Contracts\Services\DigitalRentalServiceInterface;
use App\Models\Book;
use App\Models\DigitalPurchase;
use App\Models\Member;
use App\Models\Subscription;
use App\Models\User;

class DigitalRentalService implements DigitalRentalServiceInterface
{
    public function calculatePurchasePrice(Book $book, ?Member $member): float
    {
        $standardPrice = $book->digital_purchase_price ?? 50.00;

        if ($member && $member->is_subscribed) {
            $discount = 0.20; // 20% perk discount
            return round($standardPrice * (1.00 - $discount), 2);
        }

        return round($standardPrice, 2);
    }

    public function purchaseDigitalBook(User $user, Member $member, Book $book, ?string $transactionRef = null): DigitalPurchase
    {
        $standardPrice = $book->digital_purchase_price ?? 50.00;
        $finalPrice = $this->calculatePurchasePrice($book, $member);

        $activeSub = $member->is_subscribed ? Subscription::where('member_id', $member->id)->where('payment_status', 'paid')->latest()->first() : null;

        return DigitalPurchase::create([
            'member_id' => $member->id,
            'user_id' => $user->id,
            'book_id' => $book->id,
            'subscription_id' => $activeSub?->id,
            'standard_price' => $standardPrice,
            'amount_paid' => $finalPrice,
            'purchased_at' => now(),
            'access_type' => 'lifetime',
            'transaction_reference' => $transactionRef ?? ('MPESA-' . strtoupper(bin2hex(random_bytes(4)))),
            'status' => 'active',
        ]);
    }

    public function activatePerkSubscription(User $user, Member $member, string $planType = 'standard', float $amount = 1500.00, ?string $transactionRef = null): Subscription
    {
        $tier = strtolower($planType);
        if (str_contains($tier, 'student')) {
            $tierName = 'student';
            $borrowLimit = 3;
        } elseif (str_contains($tier, 'scholar') || str_contains($tier, 'faculty')) {
            $tierName = 'scholar';
            $borrowLimit = 15;
        } else {
            $tierName = 'standard';
            $borrowLimit = 7;
        }

        $expiresAt = now()->addYear();

        $subscription = Subscription::create([
            'member_id' => $member->id,
            'user_id' => $user->id,
            'plan_type' => $planType,
            'discount_percentage' => 20.00,
            'amount_paid' => $amount,
            'payment_status' => 'paid',
            'transaction_reference' => $transactionRef ?? ('MPESA-SUB-' . strtoupper(bin2hex(random_bytes(4)))),
            'starts_at' => now(),
            'expires_at' => $expiresAt,
        ]);

        $member->update([
            'membership_tier' => $tierName,
            'borrow_limit' => $borrowLimit,
            'is_subscribed' => true,
            'subscription_expires_at' => $expiresAt,
        ]);

        $user->update([
            'subscription_status' => 'active',
            'subscription_id' => $subscription->id,
        ]);

        return $subscription;
    }

    public function hasDigitalAccess(Member $member, Book $book): bool
    {
        // 1. Check if subscriber exclusive book and member is subscribed
        if ($book->is_exclusive && $member->is_subscribed) {
            return true;
        }

        // 2. Check for active lifetime purchase across member_id OR user_id
        return DigitalPurchase::where(function ($q) use ($member) {
                $q->where('member_id', $member->id);
                if ($member->user_id) {
                    $q->orWhere('user_id', $member->user_id);
                }
            })
            ->where('book_id', $book->id)
            ->where('status', 'active')
            ->exists();
    }
}
