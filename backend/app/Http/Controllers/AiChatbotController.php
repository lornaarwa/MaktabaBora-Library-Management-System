<?php

namespace App\Http\Controllers;

use App\Contracts\Services\OpenAiRecommendationServiceInterface;
use App\Models\AiUsageLog;
use App\Models\ChatSession;
use App\Models\Member;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AiChatbotController extends Controller
{
    protected OpenAiRecommendationServiceInterface $aiService;

    public function __construct(OpenAiRecommendationServiceInterface $aiService)
    {
        $this->aiService = $aiService;
    }

    public function chat(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'prompt' => 'required|string|max:1000',
            'chat_session_id' => 'nullable|exists:chat_sessions,id',
        ]);

        $user = $request->user();
        $member = Member::where('user_id', $user->id ?? 1)->first();

        if (!$member) {
            $member = Member::firstOrCreate([
                'user_id' => 1,
            ], [
                'member_number' => 'MEM-DEFAULT',
                'membership_tier' => 'general',
            ]);
        }

        $session = null;
        if (!empty($validated['chat_session_id'])) {
            $session = ChatSession::find($validated['chat_session_id']);
        }

        if (!$session) {
            $session = ChatSession::create([
                'member_id' => $member->id,
                'title' => substr($validated['prompt'], 0, 30) . '...',
            ]);
        }

        $result = $this->aiService->generateRecommendation($session, $validated['prompt']);

        // Log AI usage
        AiUsageLog::create([
            'member_id' => $member->id,
            'chat_session_id' => $session->id,
            'tokens_consumed' => $result['tokens_used'],
            'cost_estimate' => ($result['tokens_used'] / 1000) * 0.0015,
            'request_type' => 'chat_recommendation',
            'ip_address' => $request->ip(),
        ]);

        $providerName = 'SmartLib AI';
        try {
            $settings = app(\App\Services\AiLibrarianManagerService::class)->getSettings();
            $providerName = $settings['providers'][$settings['active_provider'] ?? 'gemini']['name'] ?? 'AI Librarian';
        } catch (\Throwable $e) {
            // fallback gracefully
        }

        return response()->json([
            'session_id' => $session->id,
            'message' => $result['message'],
            'tokens_used' => $result['tokens_used'],
            'books' => $result['books'] ?? [],
            'provider' => $providerName,
        ]);
    }
}
