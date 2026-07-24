<?php

namespace App\Contracts\Services;

use App\Models\Book;
use App\Models\DigitalPurchase;
use App\Models\Member;
use App\Models\Subscription;
use App\Models\User;

interface DigitalRentalServiceInterface
{
    public function calculatePurchasePrice(Book $book, ?Member $member): float;
    public function purchaseDigitalBook(User $user, Member $member, Book $book, ?string $transactionRef = null): DigitalPurchase;
    public function activatePerkSubscription(User $user, Member $member, string $planType = 'pro_perks_monthly', float $amount = 500.00, ?string $transactionRef = null): Subscription;
    public function hasDigitalAccess(Member $member, Book $book): bool;
}
