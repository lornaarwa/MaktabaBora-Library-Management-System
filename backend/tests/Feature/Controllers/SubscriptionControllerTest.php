<?php

namespace Tests\Feature\Controllers;

use Tests\TestCase;
use App\Models\Member;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class SubscriptionControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_member_can_checkout_subscription(): void
    {
        $user = User::create(['name' => 'Sub Checkout User', 'email' => 'subch@example.com', 'password' => bcrypt('password'), 'role' => 'member']);
        $member = Member::create(['user_id' => $user->id, 'member_number' => 'MEM-SUB-CH']);

        $response = $this->actingAs($user)->postJson('/api/v1/subscriptions/checkout', [
            'plan_type' => 'pro_perks_monthly',
            'phone_number' => '254712345678',
            'amount' => 500.00,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.subscription.plan_type', 'pro_perks_monthly');

        $this->assertTrue($member->fresh()->is_subscribed);
    }

    public function test_member_can_check_subscription_status(): void
    {
        $user = User::create(['name' => 'Sub Status User', 'email' => 'subst@example.com', 'password' => bcrypt('password'), 'role' => 'member']);
        $member = Member::create(['user_id' => $user->id, 'member_number' => 'MEM-SUB-ST', 'is_subscribed' => true]);

        $response = $this->actingAs($user)->getJson('/api/v1/subscriptions/status');

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.is_subscribed', true);
    }

    public function test_changing_subscription_automatically_unsubscribes_previous_tier(): void
    {
        $user = User::create(['name' => 'Changing Sub User', 'email' => 'changesub@example.com', 'password' => bcrypt('password'), 'role' => 'member']);
        $member = Member::create([
            'user_id' => $user->id,
            'member_number' => 'MEM-CH-SUB',
            'membership_tier' => 'student',
            'is_subscribed' => true,
            'subscription_expires_at' => now()->addMonths(6),
        ]);

        $firstCheckout = $this->actingAs($user)->postJson('/api/v1/subscriptions/checkout', [
            'membership_tier' => 'student',
            'phone_number' => '254712345678',
            'amount' => 500.00,
        ]);
        $firstCheckout->assertStatus(201);
        $firstSubId = $firstCheckout->json('data.subscription.id');

        // Now change to scholar tier
        $secondCheckout = $this->actingAs($user)->postJson('/api/v1/subscriptions/checkout', [
            'membership_tier' => 'scholar',
            'phone_number' => '254712345678',
            'amount' => 3000.00,
        ]);

        $secondCheckout->assertStatus(201)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('unsubscribed_previous', true)
            ->assertJsonPath('data.subscription.plan_type', 'scholar');

        // Verify the old subscription was automatically unsubscribed / expired
        $oldSub = \App\Models\Subscription::find($firstSubId);
        $this->assertTrue($oldSub->expires_at <= now()->addSeconds(2));

        // Verify member has the new tier and updated borrow limit
        $updatedMember = $member->fresh();
        $this->assertEquals('scholar', $updatedMember->membership_tier);
        $this->assertEquals(15, $updatedMember->borrow_limit);
        $this->assertTrue($updatedMember->is_subscribed);
        $this->assertEquals($secondCheckout->json('data.subscription.id'), $user->fresh()->subscription_id);
    }
}
