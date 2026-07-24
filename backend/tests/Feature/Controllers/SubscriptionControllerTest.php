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
}
