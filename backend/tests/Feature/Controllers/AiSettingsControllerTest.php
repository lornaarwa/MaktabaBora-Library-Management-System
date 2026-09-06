<?php

namespace Tests\Feature\Controllers;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AiSettingsControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $member;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::create([
            'name' => 'Main Administrator',
            'email' => 'admin.ai@example.com',
            'password' => bcrypt('password123'),
            'role' => 'admin',
        ]);

        $this->member = User::create([
            'name' => 'Regular Patron',
            'email' => 'patron.ai@example.com',
            'password' => bcrypt('password123'),
            'role' => 'member',
        ]);
    }

    public function test_unauthenticated_user_cannot_access_ai_settings(): void
    {
        $response = $this->getJson('/api/v1/admin/ai-settings');
        $response->assertStatus(401);
    }

    public function test_non_admin_user_is_forbidden(): void
    {
        $response = $this->actingAs($this->member)->getJson('/api/v1/admin/ai-settings');
        $response->assertStatus(403);
    }

    public function test_admin_can_retrieve_ai_settings_with_masked_keys(): void
    {
        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/ai-settings');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'data' => [
                    'active_provider',
                    'providers' => [
                        'gemini' => ['name', 'model', 'has_key', 'masked_key'],
                        'openai' => ['name', 'model', 'has_key', 'masked_key'],
                        'anthropic' => ['name', 'model', 'has_key', 'masked_key'],
                        'offline' => ['name', 'model'],
                    ],
                    'system_prompt',
                    'temperature',
                    'max_tokens',
                ],
            ]);

        // Raw API key should NEVER be present in the JSON response
        $this->assertArrayNotHasKey('api_key', $response->json('data.providers.gemini'));
    }

    public function test_admin_can_update_ai_settings(): void
    {
        $updatePayload = [
            'active_provider' => 'openai',
            'system_prompt' => 'Custom AI librarian system prompt instructions for tests.',
            'temperature' => 0.5,
            'max_tokens' => 900,
            'providers' => [
                'openai' => [
                    'model' => 'gpt-4o',
                    'api_key' => 'sk-test-sample-secret-api-key-1234',
                ],
            ],
        ];

        $response = $this->actingAs($this->admin)->putJson('/api/v1/admin/ai-settings', $updatePayload);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'message' => 'AI Librarian configuration updated successfully.',
            ]);

        $this->assertEquals('openai', $response->json('data.active_provider'));
        $this->assertEquals('gpt-4o', $response->json('data.providers.openai.model'));
        $this->assertTrue($response->json('data.providers.openai.has_key'));
    }

    public function test_admin_can_test_offline_engine_connection(): void
    {
        $response = $this->actingAs($this->admin)->postJson('/api/v1/admin/ai-settings/test-key', [
            'provider' => 'offline',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'provider' => 'offline',
            ]);
    }

    public function test_admin_can_test_gemini_connection_with_mocked_http(): void
    {
        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [['text' => 'CONNECTED']]
                        ]
                    ]
                ],
                'usageMetadata' => ['totalTokenCount' => 15]
            ], 200),
        ]);

        $response = $this->actingAs($this->admin)->postJson('/api/v1/admin/ai-settings/test-key', [
            'provider' => 'gemini',
            'api_key' => 'AIzaSyTestMockSecret12345678',
            'model' => 'gemini-1.5-flash',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'provider' => 'gemini',
            ]);
    }
}
