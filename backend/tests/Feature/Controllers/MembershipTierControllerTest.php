<?php

namespace Tests\Feature\Controllers;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class MembershipTierControllerTest extends TestCase
{
    use RefreshDatabase;

    protected ?string $originalTiersContent = null;

    protected function setUp(): void
    {
        parent::setUp();
        $path = storage_path('app/membership_tiers.json');
        if (file_exists($path)) {
            $this->originalTiersContent = file_get_contents($path);
        }
    }

    protected function tearDown(): void
    {
        $path = storage_path('app/membership_tiers.json');
        if ($this->originalTiersContent !== null) {
            file_put_contents($path, $this->originalTiersContent);
        }
        parent::tearDown();
    }

    public function test_guest_can_access_membership_tiers(): void
    {
        $response = $this->getJson('/api/v1/membership-tiers');

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success');

        $this->assertIsArray($response->json('data'));
        $this->assertNotEmpty($response->json('data'));
    }

    public function test_member_can_access_membership_tiers_without_admin_forbidden(): void
    {
        $user = User::create([
            'name' => 'Test Member',
            'email' => 'tier_member@example.com',
            'password' => bcrypt('password'),
            'role' => 'member',
        ]);

        $response = $this->actingAs($user)->getJson('/api/v1/membership-tiers');

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success');
    }

    public function test_member_cannot_modify_membership_tiers(): void
    {
        $user = User::create([
            'name' => 'Member Trying Admin',
            'email' => 'forbidden_member@example.com',
            'password' => bcrypt('password'),
            'role' => 'member',
        ]);

        $response = $this->actingAs($user)->putJson('/api/v1/admin/membership-tiers', [
            'tiers' => [
                ['id' => 'custom', 'name' => 'Custom Tier', 'price' => 100],
            ],
        ]);

        $response->assertStatus(403)
            ->assertJsonPath('error', 'Forbidden')
            ->assertJsonPath('message', 'Access restricted to administrators only.');
    }

    public function test_admin_can_modify_membership_tiers(): void
    {
        $admin = User::create([
            'name' => 'Admin User',
            'email' => 'tier_admin@example.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
        ]);

        $response = $this->actingAs($admin)->putJson('/api/v1/admin/membership-tiers', [
            'tiers' => [
                [
                    'id' => 'student',
                    'name' => 'Student Pass Updated',
                    'price' => 550,
                    'borrowLimit' => '3 Books at a time',
                    'active' => true,
                ],
            ],
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success');
    }
}
