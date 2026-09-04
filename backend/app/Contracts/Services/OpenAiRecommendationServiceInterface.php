<?php

namespace App\Contracts\Services;

use App\Models\ChatSession;

interface OpenAiRecommendationServiceInterface
{
    public function generateBookRecommendations(string $prompt, array $userHistory = []): array;

    public function chat(string $message, array $conversationContext = []): string;

    /**
     * Grounded assistant turn: persists the user message, retrieves real catalog
     * results plus the member's account context, composes an answer, and stores it.
     *
     * @return array{message: string, tokens_used: int, books: array<int, array<string, mixed>>}
     */
    public function generateRecommendation(ChatSession $session, string $userPrompt): array;
}