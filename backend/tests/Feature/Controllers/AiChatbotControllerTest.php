<?php

namespace Tests\Feature\Controllers;

use Tests\TestCase;
use App\Models\AiUsageLog;
use App\Models\ChatMessage;
use App\Models\ChatSession;
use App\Models\Member;
use App\Models\User;
use App\Services\AiLibrarianManagerService;
use Illuminate\Foundation\Testing\RefreshDatabase;

class AiChatbotControllerTest extends TestCase
{
    use RefreshDatabase;

    private ?string $originalSettingsBackup = null;

    protected function setUp(): void
    {
        parent::setUp();

        $settingsFile = storage_path('app/ai_settings.json');
        if (file_exists($settingsFile)) {
            $this->originalSettingsBackup = file_get_contents($settingsFile);
        }

        // Force offline mode for unit tests so they execute deterministically without external API calls
        $manager = app(AiLibrarianManagerService::class);
        $settings = $manager->getSettings();
        $settings['active_provider'] = 'offline';
        $manager->saveSettings($settings);

        config(['services.openai.api_key' => '']);
    }

    protected function tearDown(): void
    {
        $settingsFile = storage_path('app/ai_settings.json');
        if ($this->originalSettingsBackup !== null) {
            file_put_contents($settingsFile, $this->originalSettingsBackup);
        } elseif (file_exists($settingsFile)) {
            @unlink($settingsFile);
        }

        parent::tearDown();
    }

    public function test_user_can_interact_with_ai_chatbot(): void
    {
        $user = User::create(['name' => 'AI User', 'email' => 'aichat@example.com', 'password' => 'secret', 'role' => 'member']);
        $member = Member::create(['user_id' => $user->id, 'member_number' => 'MEM-8888', 'is_subscribed' => true]);

        $response = $this->actingAs($user)->postJson('/api/v1/ai/chat', [
            'prompt' => 'Can you recommend good software books?',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['session_id', 'message', 'tokens_used']);

        $sessionId = $response->json('session_id');
        $this->assertDatabaseHas('chat_sessions', ['id' => $sessionId, 'member_id' => $member->id]);
        $this->assertDatabaseHas('chat_messages', ['chat_session_id' => $sessionId]);
    }

    public function test_subsequent_chat_messages_reuse_same_chat_session(): void
    {
        $user = User::create(['name' => 'AI User', 'email' => 'aichat2@example.com', 'password' => 'secret', 'role' => 'member']);
        $member = Member::create(['user_id' => $user->id, 'member_number' => 'MEM-8889', 'is_subscribed' => true]);

        // First prompt initializes session
        $res1 = $this->actingAs($user)->postJson('/api/v1/ai/chat', [
            'prompt' => 'Hello there',
        ]);
        $res1->assertStatus(200);
        $sessionId = $res1->json('session_id');

        // Second prompt passes the active session_id
        $res2 = $this->actingAs($user)->postJson('/api/v1/ai/chat', [
            'prompt' => 'What is available?',
            'chat_session_id' => $sessionId,
        ]);
        $res2->assertStatus(200);

        // Must reuse the same session ID
        $this->assertEquals($sessionId, $res2->json('session_id'));
        $this->assertEquals(1, ChatSession::where('member_id', $member->id)->count());
        $this->assertEquals(4, ChatMessage::where('chat_session_id', $sessionId)->count()); // 2 user + 2 ai
    }

    public function test_user_can_clear_ai_chat_session(): void
    {
        $user = User::create(['name' => 'AI User', 'email' => 'aichat3@example.com', 'password' => 'secret', 'role' => 'member']);
        $member = Member::create(['user_id' => $user->id, 'member_number' => 'MEM-8890', 'is_subscribed' => true]);

        $res = $this->actingAs($user)->postJson('/api/v1/ai/chat', [
            'prompt' => 'Initial query',
        ]);
        $sessionId = $res->json('session_id');
        $this->assertDatabaseHas('chat_sessions', ['id' => $sessionId]);

        // Clear chat endpoint
        $clearRes = $this->actingAs($user)->postJson('/api/v1/ai/chat/clear', [
            'chat_session_id' => $sessionId,
        ]);
        $clearRes->assertStatus(200);

        // Session and messages should be discarded
        $this->assertDatabaseMissing('chat_sessions', ['id' => $sessionId]);
        $this->assertDatabaseMissing('chat_messages', ['chat_session_id' => $sessionId]);
    }

    public function test_logging_out_purges_ephemeral_chat_sessions_while_preserving_usage_logs(): void
    {
        $user = User::create(['name' => 'AI User', 'email' => 'aichat4@example.com', 'password' => 'secret', 'role' => 'member']);
        $member = Member::create(['user_id' => $user->id, 'member_number' => 'MEM-8891', 'is_subscribed' => true]);

        $res = $this->actingAs($user)->postJson('/api/v1/ai/chat', [
            'prompt' => 'Ephemeral query',
        ]);
        $sessionId = $res->json('session_id');

        $this->assertDatabaseHas('chat_sessions', ['id' => $sessionId]);
        $this->assertDatabaseHas('chat_messages', ['chat_session_id' => $sessionId]);
        $this->assertDatabaseHas('ai_usage_logs', ['member_id' => $member->id]);

        // Perform logout
        $logoutRes = $this->actingAs($user)->postJson('/api/v1/auth/logout');
        $logoutRes->assertStatus(200);

        // Chat sessions and messages are completely discarded on logout
        $this->assertDatabaseMissing('chat_sessions', ['id' => $sessionId]);
        $this->assertDatabaseMissing('chat_messages', ['chat_session_id' => $sessionId]);

        // AI usage token logs remain intact for billing/audit with nullified session
        $this->assertDatabaseHas('ai_usage_logs', ['member_id' => $member->id, 'chat_session_id' => null]);
    }
}
