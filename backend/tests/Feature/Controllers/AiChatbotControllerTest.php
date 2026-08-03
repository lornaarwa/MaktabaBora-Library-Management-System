<?php

namespace Tests\Feature\Controllers;

use Tests\TestCase;
use App\Models\Member;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class AiChatbotControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_interact_with_ai_chatbot(): void
    {
        $user = User::create(['name' => 'AI User', 'email' => 'aichat@example.com', 'password' => 'secret', 'role' => 'member']);
        $member = Member::create(['user_id' => $user->id, 'member_number' => 'MEM-8888', 'is_subscribed' => true]);

        $response = $this->actingAs($user)->postJson('/api/v1/ai/chat', [
            'prompt' => 'Can you recommend good software books?',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['session_id', 'message', 'tokens_used']);
    }
}
