<?php

namespace App\Services;

use App\Contracts\Services\OpenAiRecommendationServiceInterface;
use App\Models\Book;
use App\Models\ChatMessage;
use App\Models\ChatSession;
use App\Models\Fine;
use App\Models\Loan;
use App\Models\Member;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Grounded AI Librarian.
 *
 * Answers are built from two trusted sources only:
 *  1. Live catalog retrieval (hybrid keyword + semantic ranking) — never invents titles.
 *  2. The member's own account context (loans, fines, subscription) — never guesses.
 *
 * When an OPENAI_API_KEY is configured the retrieved facts are sent to the LLM
 * to be phrased naturally (RAG). Without a key the service answers directly
 * from the same facts, so the assistant remains truthful in offline mode.
 */
class OpenAiRecommendationService implements OpenAiRecommendationServiceInterface
{
    protected string $apiKey;
    protected string $model;
    protected int $maxTokens;

    public function __construct()
    {
        $this->apiKey = (string) config('services.openai.api_key', '');
        $this->model = config('services.openai.model', 'gpt-4o-mini');
        $this->maxTokens = (int) config('services.openai.max_tokens', 500);
    }

    public function generateBookRecommendations(string $prompt, array $userHistory = []): array
    {
        $books = app(CatalogRetrievalService::class)->retrieve($prompt, 5);

        return [
            'recommendations' => $books->pluck('title')->all(),
            'prompt' => $prompt,
        ];
    }

    public function chat(string $message, array $conversationContext = []): string
    {
        $result = $this->generateRecommendationForPrompt($message);

        return $result['message'];
    }

    /**
     * Single entry point used by the chat controller.
     *
     * @return array{message: string, tokens_used: int, books: array<int, array<string, mixed>>}
     */
    public function generateRecommendation(ChatSession $session, string $userPrompt): array
    {
        $this->storeMessage($session->id, 'user', $userPrompt);

        // 1. Retrieve relevant books from the real catalog.
        $retrieved = app(CatalogRetrievalService::class)->retrieve($userPrompt, 6);
        $booksPayload = $retrieved->map(fn (Book $book) => $this->bookPayload($book))->values()->all();

        // 2. Pull the member's live account context.
        $member = $session->member;
        $memberContext = $this->buildMemberContext($member);

        [$aiText, $tokensUsed] = $this->answer($userPrompt, $retrieved, $memberContext);

        $this->storeMessage($session->id, 'ai', $aiText, $tokensUsed);
        $session->increment('total_tokens_used', $tokensUsed);

        return [
            'message' => $aiText,
            'tokens_used' => $tokensUsed,
            'books' => $booksPayload,
        ];
    }

    protected function generateRecommendationForPrompt(string $prompt): array
    {
        $retrieved = app(CatalogRetrievalService::class)->retrieve($prompt, 5);

        [$message, $tokens] = $this->answer($prompt, $retrieved, '');

        return [
            'message' => $message,
            'tokens_used' => $tokens,
            'books' => $retrieved->map(fn (Book $book) => $this->bookPayload($book))->values()->all(),
        ];
    }

    /**
     * Decide the answer: LLM phrasing when a key exists, grounded fallback otherwise.
     *
     * @param  \Illuminate\Database\Eloquent\Collection<int, Book>  $retrieved
     * @return array{0: string, 1: int}  [text, tokens]
     */
    protected function answer(string $userPrompt, $retrieved, string $memberContext): array
    {
        $catalogText = $this->formatCatalog($retrieved);
        $systemPrompt = $this->systemPrompt($catalogText, $memberContext);

        if ($this->apiKey !== '') {
            try {
                $response = Http::withHeaders([
                    'Authorization' => 'Bearer '.$this->apiKey,
                    'Content-Type' => 'application/json',
                ])->post('https://api.openai.com/v1/chat/completions', [
                    'model' => $this->model,
                    'messages' => [
                        ['role' => 'system', 'content' => $systemPrompt],
                        ['role' => 'user', 'content' => $userPrompt],
                    ],
                    'max_tokens' => $this->maxTokens,
                    'temperature' => 0.4,
                ]);

                $json = $response->json();

                if (isset($json['choices'][0]['message']['content'])) {
                    return [
                        $json['choices'][0]['message']['content'],
                        (int) ($json['usage']['total_tokens'] ?? 150),
                    ];
                }
            } catch (\Throwable $e) {
                Log::error('OpenAI Recommendation Call Failed', ['error' => $e->getMessage()]);
            }
        }

        return $this->groundedFallback($userPrompt, $retrieved, $memberContext);
    }

    /**
     * Offline, truthful answer composed strictly from retrieved facts and member context.
     *
     * @param  \Illuminate\Database\Eloquent\Collection<int, Book>  $retrieved
     * @return array{0: string, 1: int}
     */
    protected function groundedFallback(string $userPrompt, $retrieved, string $memberContext): array
    {
        $normalized = strtolower($userPrompt);
        $mentionsAccount = (bool) preg_match('/due|return|overdue|fine|loan|renew|penalty/i', $normalized);
        $mentionsAvailability = (bool) preg_match('/available|in stock|on shelf|ready to borrow|copy\b|copies\b/i', $normalized);

        // Account questions take priority when the member has active context.
        if ($mentionsAccount && $memberContext !== '') {
            return [
                $this->memberContextAnswer($memberContext, $mentionsAccount),
                60,
            ];
        }

        // Availability questions answer directly from the live catalog.
        if ($mentionsAvailability) {
            return $this->availabilityAnswer();
        }

        if ($retrieved->isEmpty()) {
            return [
                "I couldn't find a close match in our catalog for that request. Try a different topic, or browse the full catalog to explore what's available.",
                40,
            ];
        }

        $lines = $retrieved->take(3)->map(function (Book $book) {
            $status = $book->is_blocked
                ? 'currently restricted'
                : ($book->available_copies > 0 ? $book->available_copies.' copy/copies available' : 'on loan');

            return "- **{$book->title}** by {$book->author} ({$book->genre}) — {$status}.";
        })->implode("\n");

        return [
            "Based on your request, here are the closest titles in our catalog:\n\n{$lines}\n\nWould you like more details about any of these, or shall I search another topic?",
            70,
        ];
    }

    protected function memberContextAnswer(string $memberContext, bool $accountQuestion): string
    {
        return "Here's what I found on your MaktabaBora account:\n\n{$memberContext}\n\n"
            . 'Need anything else — a title recommendation, availability check, or help with a reservation?';
    }

    /**
     * @return array{0: string, 1: int}
     */
    protected function availabilityAnswer(): array
    {
        $available = Book::where('is_blocked', false)
            ->where('available_copies', '>', 0)
            ->orderByDesc('available_copies')
            ->limit(6)
            ->get(['title', 'author', 'genre', 'available_copies']);

        if ($available->isEmpty()) {
            return [
                "All copies in the catalog are currently on loan. You can place a hold reservation to join the queue for a title.",
                35,
            ];
        }

        $lines = $available->map(function (Book $book) {
            return "- **{$book->title}** by {$book->author} ({$book->genre}) — {$book->available_copies} copy/copies available now.";
        })->implode("\n");

        return [
            "Here's what is available to borrow right now:\n\n{$lines}\n\nWant more details or a reservation on any of these?",
            65,
        ];
    }

    /**
     * @param  \Illuminate\Database\Eloquent\Collection<int, Book>  $retrieved
     */
    protected function formatCatalog($retrieved): string
    {
        if ($retrieved->isEmpty()) {
            return 'No close matches were found in the catalog for this request.';
        }

        $lines = $retrieved->map(function (Book $book) {
            $status = $book->is_blocked
                ? 'RESTRICTED'
                : ($book->available_copies > 0
                    ? "{$book->available_copies} of {$book->total_copies} copies available"
                    : 'all copies on loan');

            return "- [{$book->title}] by {$book->author} | genre: {$book->genre} | ISBN: {$book->isbn}"
                ." | year: {$book->publication_year} | availability: {$status} | description: {$book->description}";
        })->implode("\n");

        return "Retrieved catalog results (ranked by relevance to the user's request):\n{$lines}";
    }

    protected function systemPrompt(string $catalogText, string $memberContext): string
    {
        $accountBlock = $memberContext !== ''
            ? "The user's verified MaktabaBora account context:\n{$memberContext}\n"
            : '';

        return "You are SmartLib AI, the official librarian of the MaktabaBora library management system.\n\n"
            ."You must answer using ONLY the facts provided below. Never invent, guess, or mention books that are not in the catalog facts.\n"
            ."If the retrieved catalog results are empty or clearly irrelevant, say so and offer to browse the catalog.\n"
            ."If the question concerns the user's own loans, fines, due dates or membership, use the account context and be precise about dates and amounts.\n"
            ."Format answers with short markdown bullets. Be concise, friendly and professional.\n\n"
            .$catalogText."\n\n"
            .$accountBlock;
    }

    protected function buildMemberContext(?Member $member): string
    {
        if (! $member) {
            return '';
        }

        $parts = [];

        $loans = Loan::with('bookCopy.book')
            ->where('member_id', $member->id)
            ->whereIn('status', ['active', 'overdue'])
            ->get();

        if ($loans->isNotEmpty()) {
            $loanLines = $loans->map(function (Loan $loan) {
                $bookTitle = $loan->bookCopy->book->title ?? 'a library book';
                $daysLeft = $loan->due_date ? now()->startOfDay()->diffInDays($loan->due_date, false) : null;
                $overdue = $loan->status === 'overdue' || ($daysLeft !== null && $daysLeft < 0);
                $dueText = $overdue
                    ? "OVERDUE by ".abs($daysLeft)." day(s) (was due {$loan->due_date->format('Y-m-d')})"
                    : "due {$loan->due_date->format('Y-m-d')} (".max($daysLeft, 0)." day(s) left)";

                return "- \"{$bookTitle}\" — {$dueText}, renewal count: {$loan->renewal_count}";
            })->implode("\n");

            $parts[] = "Active loans:\n{$loanLines}";
        } else {
            $parts[] = 'Active loans: none.';
        }

        $unpaidFines = Fine::where('member_id', $member->id)
            ->where('status', '!=', 'paid')
            ->get();

        if ($unpaidFines->isNotEmpty()) {
            $total = $unpaidFines->sum('amount');
            $parts[] = "Unpaid fines: KES ".number_format((float) $total, 2)." across {$unpaidFines->count()} fine(s).";
        } else {
            $parts[] = 'Unpaid fines: none.';
        }

        $parts[] = 'Membership: '.($member->membership_tier ?: 'general')
            .($member->is_subscribed ? ' (active subscription)' : ' (no active subscription)')
            .' | member number: '.($member->member_number ?: 'N/A');

        return implode("\n", $parts);
    }

    protected function bookPayload(Book $book): array
    {
        return [
            'id' => $book->id,
            'title' => $book->title,
            'author' => $book->author,
            'genre' => $book->genre,
            'isbn' => $book->isbn,
            'publication_year' => $book->publication_year,
            'available_copies' => $book->available_copies,
            'total_copies' => $book->total_copies,
            'is_blocked' => (bool) $book->is_blocked,
            'is_exclusive' => (bool) $book->is_exclusive,
            'cover_image_path' => $book->cover_image_path,
        ];
    }

    protected function storeMessage(int $sessionId, string $sender, string $message, int $tokensUsed = 0): void
    {
        ChatMessage::create([
            'chat_session_id' => $sessionId,
            'sender' => $sender,
            'message' => $message,
            'tokens_used' => $tokensUsed,
        ]);
    }
}