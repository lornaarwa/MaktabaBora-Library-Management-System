<?php

namespace Tests\Unit\Models;

use Tests\TestCase;
use App\Models\Book;
use App\Models\DigitalPurchase;
use App\Models\Member;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class SubscriptionModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_subscription_and_digital_purchase_relationships(): void
    {
        $user = User::create(['name' => 'Sub User', 'email' => 'sub@example.com', 'password' => 'secret', 'role' => 'member']);
        $member = Member::create(['user_id' => $user->id, 'member_number' => 'MEM-SUB1', 'is_subscribed' => true]);

        $sub = Subscription::create([
            'member_id' => $member->id,
            'user_id' => $user->id,
            'plan_type' => 'pro_perks_monthly',
            'discount_percentage' => 20.00,
            'amount_paid' => 500.00,
            'payment_status' => 'paid',
        ]);

        $book = Book::create([
            'title' => 'Digital Arch',
            'author' => 'Author',
            'isbn' => '9780000000001',
            'genre' => 'Tech',
            'digital_purchase_price' => 100.00,
        ]);

        $purchase = DigitalPurchase::create([
            'member_id' => $member->id,
            'user_id' => $user->id,
            'book_id' => $book->id,
            'subscription_id' => $sub->id,
            'standard_price' => 100.00,
            'amount_paid' => 80.00,
            'access_type' => 'lifetime',
            'status' => 'active',
        ]);

        $this->assertEquals($member->id, $sub->member->id);
        $this->assertEquals($user->id, $sub->user->id);
        $this->assertEquals(80.00, $purchase->amount_paid);
        $this->assertEquals('lifetime', $purchase->access_type);
        $this->assertEquals(1, $sub->digitalPurchases()->count());
    }
}
