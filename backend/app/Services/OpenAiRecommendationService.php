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

        // 1. Retrieve relevant books from the real catalog for payload
        $retrieved = app(CatalogRetrievalService::class)->retrieve($userPrompt, 6);
        $booksPayload = $retrieved->map(fn (Book $book) => $this->bookPayload($book))->values()->all();

        // 2. Answer strictly grounded in catalog database records (excluding sensitive user accounts)
        [$aiText, $tokensUsed] = $this->answer($userPrompt, $retrieved);

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

        [$message, $tokens] = $this->answer($prompt, $retrieved);

        return [
            'message' => $message,
            'tokens_used' => $tokens,
            'books' => $retrieved->map(fn (Book $book) => $this->bookPayload($book))->values()->all(),
        ];
    }

    /**
     * Decide the answer: LLM phrasing via AiLibrarianManagerService when an active provider/key exists, grounded fallback otherwise.
     * Strictly limits context to catalog records from database, excluding sensitive user accounts.
     *
     * @param  \Illuminate\Database\Eloquent\Collection<int, Book>  $retrieved
     * @return array{0: string, 1: int}  [text, tokens]
     */
    protected function answer(string $userPrompt, $retrieved): array
    {
        /** @var AiLibrarianManagerService $aiManager */
        $aiManager = app(AiLibrarianManagerService::class);
        $catalogText = $aiManager->buildCatalogDatabaseContext($userPrompt, $retrieved);

        try {
            $settings = $aiManager->getSettings();
            $activeProvider = $settings['active_provider'] ?? 'gemini';
            $providerConfig = $settings['providers'][$activeProvider] ?? null;
            $activeKey = trim((string) ($providerConfig['api_key'] ?? ''));

            if ($activeProvider !== 'offline' && $activeKey !== '') {
                $response = $aiManager->generateLibrarianResponse($userPrompt, $catalogText);
                if (!empty($response['text']) && ($response['provider'] ?? '') !== 'offline-fallback') {
                    return [
                        $response['text'],
                        (int) ($response['tokens'] ?? 150),
                    ];
                }
            }
        } catch (\Throwable $e) {
            Log::warning('Multi-provider AI call failed in OpenAiRecommendationService', ['error' => $e->getMessage()]);
        }

        return $this->groundedFallback($userPrompt, $retrieved);
    }

    /**
     * Offline, truthful answer composed strictly from catalog database records and platform navigation.
     * Strictly protects sensitive user accounts.
     *
     * @param  \Illuminate\Database\Eloquent\Collection<int, Book>  $retrieved
     * @return array{0: string, 1: int}
     */
    protected function groundedFallback(string $userPrompt, $retrieved): array
    {
        $normalized = strtolower($userPrompt);
        $mentionsAccount = (bool) preg_match('/due|return|overdue|fine|loan|renew|penalty|account|borrowed/i', $normalized);
        $mentionsAvailability = (bool) preg_match('/available|in stock|on shelf|ready to borrow|copy\b|copies\b/i', $normalized);
        $mentionsNavigation = (bool) preg_match('/navigate|where|how to|find|page|cart|checkout|mpesa|m-pesa|membership|tier|subscribe/i', $normalized);

        // Account questions protect patron privacy and direct to Member Dashboard
        if ($mentionsAccount) {
            return [
                "For your privacy and security, personal account details, active loans, and fines are kept strictly confidential and are not accessed by the Library Assistant.\n\n"
                . "You can view your active loans, return due dates, and fine balances directly on your **[Member Dashboard](/member)**.",
                60,
            ];
        }

        // Availability questions answer directly from the live catalog.
        if ($mentionsAvailability) {
            return $this->availabilityAnswer();
        }

        // Navigation questions guide users to specific pages.
        if ($mentionsNavigation) {
            return [
                $this->navigationAnswer($userPrompt),
                50,
            ];
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

    protected function navigationAnswer(string $userPrompt): string
    {
        $lower = strtolower($userPrompt);

        if (str_contains($lower, 'cart') || str_contains($lower, 'buy') || str_contains($lower, 'checkout') || str_contains($lower, 'mpesa') || str_contains($lower, 'm-pesa')) {
            return "You can buy digital e-books and checkout via M-Pesa at **[Shopping Cart](/cart)**.\n\n"
                . "1. Browse our collection on **[Book Catalog](/catalog)**\n"
                . "2. Add your favorite e-books to the cart\n"
                . "3. Enter your M-Pesa phone number and authorize payment\n"
                . "4. Instantly read online on your **[Member Dashboard](/member)**!";
        }

        if (str_contains($lower, 'tier') || str_contains($lower, 'membership') || str_contains($lower, 'upgrade') || str_contains($lower, 'subscribe')) {
            return "Compare membership plans and upgrade privileges at **[Membership Plans](/membership)**. "
                . "Choose between Student Pass, Standard Reader, and Scholar tiers.";
        }

        if (str_contains($lower, 'loan') || str_contains($lower, 'fine') || str_contains($lower, 'reader') || str_contains($lower, 'member')) {
            return "You can track your active loans, renew books, pay overdue fines via M-Pesa, and access your digital shelf on your **[Member Dashboard](/member)**.";
        }

        return "Explore our website:\n- **[Book Catalog](/catalog)** — Search and borrow\n- **[Shopping Cart](/cart)** — Checkout digital books\n- **[Member Dashboard](/member)** — Manage loans, fines & reader\n- **[Membership Plans](/membership)** — Tiers & upgrades";
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
        return app(AiLibrarianManagerService::class)->buildCatalogDatabaseContext('', $retrieved);
    }

    protected function systemPrompt(string $catalogText): string
    {
        return "You are the official Library Assistant of the MaktabaBora library management system.\n\n"
            ."You must answer using ONLY the catalog database records provided below. Never invent, guess, or mention books that are not in the catalog facts.\n"
            ."You have access ONLY to the public book catalog and website navigation directory. You DO NOT have access to sensitive user accounts, passwords, member profiles, or private personal borrowing histories.\n"
            ."If a user asks about their personal account details, active loans, return due dates, or fine balances, instruct them to check their secure private Member Dashboard (/member).\n"
            ."Format answers with short markdown bullets. Be concise, friendly and professional.\n\n"
            .$catalogText;
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