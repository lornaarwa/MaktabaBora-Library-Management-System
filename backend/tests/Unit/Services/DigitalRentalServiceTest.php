<?php

namespace Tests\Unit\Services;

use Tests\TestCase;
use App\Models\Book;
use App\Models\Member;
use App\Models\User;
use App\Services\DigitalRentalService;
use Illuminate\Foundation\Testing\RefreshDatabase;

class DigitalRentalServiceTest extends TestCase
{
    use RefreshDatabase;

    protected DigitalRentalService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new DigitalRentalService();
    }

    public function test_it_calculates_discount_for_subscribers(): void
    {
        $user = User::create(['name' => 'User', 'email' => 'u1@example.com', 'password' => 'secret', 'role' => 'member']);
        $subMember = Member::create(['user_id' => $user->id, 'member_number' => 'M1', 'is_subscribed' => true]);
        $regularMember = Member::create(['user_id' => $user->id, 'member_number' => 'M2', 'is_subscribed' => false]);

        $book = Book::create(['title' => 'Book', 'author' => 'Author', 'isbn' => '978111', 'genre' => 'Tech', 'digital_purchase_price' => 100.00]);

        $this->assertEquals(80.00, $this->service->calculatePurchasePrice($book, $subMember));
        $this->assertEquals(100.00, $this->service->calculatePurchasePrice($book, $regularMember));
    }

    public function test_it_activates_perk_subscription_and_purchases_digital_book(): void
    {
        $user = User::create(['name' => 'User 2', 'email' => 'u2@example.com', 'password' => 'secret', 'role' => 'member']);
        $member = Member::create(['user_id' => $user->id, 'member_number' => 'M3']);
        $book = Book::create(['title' => 'Book 2', 'author' => 'Author', 'isbn' => '978222', 'genre' => 'Tech', 'digital_purchase_price' => 100.00]);

        $sub = $this->service->activatePerkSubscription($user, $member);
        $this->assertTrue($member->fresh()->is_subscribed);

        $purchase = $this->service->purchaseDigitalBook($user, $member, $book);
        $this->assertEquals(80.00, $purchase->amount_paid);
        $this->assertTrue($this->service->hasDigitalAccess($member, $book));
    }

    public function test_it_automatically_unsubscribes_previous_subscription_when_changing_tier(): void
    {
        $user = User::create(['name' => 'User 3', 'email' => 'u3@example.com', 'password' => 'secret', 'role' => 'member']);
        $member = Member::create(['user_id' => $user->id, 'member_number' => 'M4']);

        $firstSub = $this->service->activatePerkSubscription($user, $member, 'student', 500.00);
        $this->assertEquals('paid', $firstSub->payment_status);
        $this->assertEquals('student', $member->fresh()->membership_tier);
        $this->assertEquals(3, $member->fresh()->borrow_limit);

        // Switch to scholar
        $newSub = $this->service->activatePerkSubscription($user, $member, 'scholar', 3000.00);

        // Old sub must be automatically expired / unsubscribed
        $this->assertTrue($firstSub->fresh()->expires_at <= now()->addSeconds(2));

        // New sub is active
        $this->assertEquals('paid', $newSub->payment_status);
        $this->assertEquals('scholar', $newSub->plan_type);
        $this->assertEquals('scholar', $member->fresh()->membership_tier);
        $this->assertEquals(15, $member->fresh()->borrow_limit);
        $this->assertEquals($newSub->id, $user->fresh()->subscription_id);
    }
}
