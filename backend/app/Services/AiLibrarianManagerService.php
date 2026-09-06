<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiLibrarianManagerService
{
    protected string $settingsFilePath;

    public function __construct()
    {
        $this->settingsFilePath = storage_path('app/ai_settings.json');
    }

    /**
     * Get the default system prompt incorporating website navigation,
     * database catalog recommendations, and library persona rules.
     */
    public function getDefaultSystemPrompt(): string
    {
        return <<<PROMPT
You are SmartLib AI, the official intelligent librarian and interactive guide for the MaktabaBora Smart Library Management System.

### MISSION & BEHAVIOR
1. Grounded Accuracy: Answer book queries using ONLY the live catalog records and the authenticated member's account details provided in the context. Never invent books, authors, ISBNs, or fake links.
2. Friendly & Professional: Be welcoming, concise, well-structured, and helpful to students, scholars, and library patrons.
3. Interactive Navigation Guide: Help users navigate the Smart Library web platform smoothly.

### WEBSITE NAVIGATION DIRECTORY
When users ask about website navigation, account features, or how to perform actions, provide exact links and steps:
- **Browse & Search Catalog**: `/catalog` (Filter by genre, search titles/authors/ISBN, check copy availability, or preview covers).
- **Shopping Cart & Checkout**: `/cart` (Purchase digital e-books for instant online reading via M-Pesa).
- **Member Dashboard**: `/member` (View active physical book loans, due dates, renew books, view fine balance, pay fines via M-Pesa STK, and access My Digital Library reader).
- **Membership & Perks**: `/membership` (Compare Student Pass, Standard Reader, and Scholar tiers, subscribe or upgrade membership).
- **Book Details Page**: `/books/:id` (Inspect book synopsis, view available shelf copies, check digital price, or place a hold reservation).

### BOOK RECOMMENDATION & AVAILABILITY RULES
- When a user asks for recommendations, analyze their query or interest, recommend 2-4 real titles from the catalog context.
- Clearly state whether copies are **available to borrow physically** on the shelf, or if the user can **buy lifetime digital reading access** to read online immediately.
- If a book has 0 available physical copies, explain that they can place a hold reservation or purchase the digital e-book version.

### ACCOUNT & LOANS CONTEXT
- If the user asks about their due dates, fines, or active loans, use the authenticated account context provided below and specify exact dates and KES fine amounts.
PROMPT;
    }

    /**
     * Return default configuration array.
     */
    public function getDefaultSettings(): array
    {
        return [
            'active_provider' => 'gemini',
            'providers' => [
                'gemini' => [
                    'name' => 'Google Gemini',
                    'api_key' => env('GEMINI_API_KEY', ''),
                    'model' => 'gemini-1.5-flash',
                    'available_models' => ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'],
                ],
                'openai' => [
                    'name' => 'OpenAI',
                    'api_key' => config('services.openai.api_key', env('OPENAI_API_KEY', '')),
                    'model' => config('services.openai.model', 'gpt-4o-mini'),
                    'available_models' => ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'],
                ],
                'anthropic' => [
                    'name' => 'Anthropic Claude',
                    'api_key' => env('ANTHROPIC_API_KEY', ''),
                    'model' => 'claude-3-5-sonnet-20241022',
                    'available_models' => ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'],
                ],
                'offline' => [
                    'name' => 'Offline Grounded Engine',
                    'api_key' => '',
                    'model' => 'deterministic-catalog-engine',
                    'available_models' => ['deterministic-catalog-engine'],
                ],
            ],
            'system_prompt' => $this->getDefaultSystemPrompt(),
            'temperature' => 0.4,
            'max_tokens' => 800,
        ];
    }

    /**
     * Retrieve full configuration (including unmasked keys for backend execution).
     */
    public function getSettings(): array
    {
        if (!file_exists($this->settingsFilePath)) {
            $defaults = $this->getDefaultSettings();
            $this->saveSettings($defaults);
            return $defaults;
        }

        $content = file_get_contents($this->settingsFilePath);
        $decoded = json_decode($content, true);

        if (!is_array($decoded)) {
            $defaults = $this->getDefaultSettings();
            $this->saveSettings($defaults);
            return $defaults;
        }

        // Merge defaults to handle missing keys gracefully
        $defaults = $this->getDefaultSettings();
        return array_replace_recursive($defaults, $decoded);
    }

    /**
     * Persist settings to JSON file.
     */
    public function saveSettings(array $settings): void
    {
        $dir = dirname($this->settingsFilePath);
        if (!is_dir($dir)) {
            @mkdir($dir, 0777, true);
        }

        file_put_contents($this->settingsFilePath, json_encode($settings, JSON_PRETTY_PRINT));
    }

    /**
     * Mask sensitive API key string for safe frontend display.
     */
    public function maskKey(string $key): string
    {
        $len = strlen(trim($key));
        if ($len <= 8) {
            return $len > 0 ? '••••••••' : '';
        }

        $prefix = substr($key, 0, 4);
        $suffix = substr($key, -4);
        return $prefix . '••••••••' . $suffix;
    }

    /**
     * Retrieve public-safe settings for Admin dashboard.
     */
    public function getPublicSettings(): array
    {
        $settings = $this->getSettings();

        foreach ($settings['providers'] as $providerKey => &$provider) {
            $rawKey = (string) ($provider['api_key'] ?? '');
            $provider['has_key'] = !empty(trim($rawKey));
            $provider['masked_key'] = $this->maskKey($rawKey);
            unset($provider['api_key']); // Never expose raw key to frontend
        }

        return $settings;
    }

    /**
     * Update settings from Admin dashboard input while preserving existing keys if masked.
     */
    public function updateFromAdmin(array $input): array
    {
        $current = $this->getSettings();

        if (isset($input['active_provider'])) {
            $current['active_provider'] = $input['active_provider'];
        }

        if (isset($input['system_prompt'])) {
            $current['system_prompt'] = $input['system_prompt'];
        }

        if (isset($input['temperature'])) {
            $current['temperature'] = (float) $input['temperature'];
        }

        if (isset($input['max_tokens'])) {
            $current['max_tokens'] = (int) $input['max_tokens'];
        }

        if (isset($input['providers']) && is_array($input['providers'])) {
            foreach ($input['providers'] as $providerKey => $provData) {
                if (!isset($current['providers'][$providerKey])) {
                    continue;
                }

                if (isset($provData['model'])) {
                    $current['providers'][$providerKey]['model'] = $provData['model'];
                }

                // If a new key is provided and not masked (doesn't contain bullet or asterisk)
                if (isset($provData['api_key'])) {
                    $newKey = trim((string) $provData['api_key']);
                    if ($newKey !== '' && !str_contains($newKey, '•') && !str_contains($newKey, '*')) {
                        $current['providers'][$providerKey]['api_key'] = $newKey;
                    }
                }
            }
        }

        $this->saveSettings($current);
        return $this->getPublicSettings();
    }

    /**
     * Test connection to a given provider.
     */
    public function testConnection(string $provider, ?string $apiKey = null, ?string $model = null): array
    {
        $settings = $this->getSettings();
        $providerConfig = $settings['providers'][$provider] ?? null;

        if (!$providerConfig && $provider !== 'offline') {
            return [
                'success' => false,
                'message' => "Provider '{$provider}' is not supported.",
            ];
        }

        $key = $apiKey ?: ($providerConfig['api_key'] ?? '');
        $selectedModel = $model ?: ($providerConfig['model'] ?? '');

        if ($provider === 'offline') {
            return [
                'success' => true,
                'message' => 'Offline Grounded Engine is active and operational without external API dependencies.',
                'provider' => 'offline',
                'model' => 'deterministic-catalog-engine',
            ];
        }

        if (empty(trim($key))) {
            return [
                'success' => false,
                'message' => "No API key configured for {$provider}.",
            ];
        }

        $testPrompt = "Return only the word 'CONNECTED' to confirm API connectivity.";

        try {
            switch ($provider) {
                case 'gemini':
                    return $this->callGemini($testPrompt, 'You are an API tester.', $key, $selectedModel);
                case 'openai':
                    return $this->callOpenAi($testPrompt, 'You are an API tester.', $key, $selectedModel);
                case 'anthropic':
                    return $this->callAnthropic($testPrompt, 'You are an API tester.', $key, $selectedModel);
                default:
                    return [
                        'success' => false,
                        'message' => "Unknown provider {$provider}",
                    ];
            }
        } catch (\Throwable $e) {
            return [
                'success' => false,
                'message' => 'API Connection failed: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Dispatch prompt to the active provider with grounded catalog and account context.
     *
     * @return array{text: string, tokens: int, provider: string, model: string}
     */
    public function generateLibrarianResponse(string $userPrompt, string $catalogContext = '', string $memberContext = ''): array
    {
        $settings = $this->getSettings();
        $activeProvider = $settings['active_provider'] ?? 'gemini';
        $providerConfig = $settings['providers'][$activeProvider] ?? null;

        $key = $providerConfig['api_key'] ?? '';
        $model = $providerConfig['model'] ?? '';

        // Compose full system prompt with dynamic runtime context
        $basePrompt = $settings['system_prompt'] ?? $this->getDefaultSystemPrompt();
        $fullSystemPrompt = $basePrompt . "\n\n"
            . "### LIVE CATALOG CONTEXT\n" . ($catalogContext ?: "No specific catalog records matched.") . "\n\n"
            . "### AUTHENTICATED PATRON CONTEXT\n" . ($memberContext ?: "Patron account details: none active or not signed in.");

        // If offline is selected or no API key exists, use grounded fallback
        if ($activeProvider === 'offline' || empty(trim($key))) {
            return [
                'text' => $this->groundedOfflineAnswer($userPrompt, $catalogContext, $memberContext),
                'tokens' => max(60, (int) (str_word_count($userPrompt) * 1.5 + 80)),
                'provider' => 'offline',
                'model' => 'deterministic-catalog-engine',
            ];
        }

        try {
            $result = null;
            switch ($activeProvider) {
                case 'gemini':
                    $result = $this->callGemini($userPrompt, $fullSystemPrompt, $key, $model);
                    break;
                case 'openai':
                    $result = $this->callOpenAi($userPrompt, $fullSystemPrompt, $key, $model);
                    break;
                case 'anthropic':
                    $result = $this->callAnthropic($userPrompt, $fullSystemPrompt, $key, $model);
                    break;
            }

            if ($result && ($result['success'] ?? false)) {
                return [
                    'text' => $result['text'] ?? $result['message'],
                    'tokens' => $result['tokens'] ?? 120,
                    'provider' => $activeProvider,
                    'model' => $model,
                ];
            }

            Log::warning("AI Provider {$activeProvider} failed, falling back to grounded offline engine", [
                'error' => $result['message'] ?? 'Unknown error',
            ]);
        } catch (\Throwable $e) {
            Log::error("Exception invoking AI Provider {$activeProvider}", [
                'error' => $e->getMessage(),
            ]);
        }

        // Graceful fallback to grounded offline answer if external API fails
        return [
            'text' => $this->groundedOfflineAnswer($userPrompt, $catalogContext, $memberContext),
            'tokens' => max(60, (int) (str_word_count($userPrompt) * 1.5 + 80)),
            'provider' => 'offline-fallback',
            'model' => 'deterministic-catalog-engine',
        ];
    }

    /**
     * Google Gemini API call
     */
    protected function callGemini(string $userPrompt, string $systemPrompt, string $apiKey, string $model): array
    {
        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";

        $payload = [
            'contents' => [
                [
                    'role' => 'user',
                    'parts' => [
                        ['text' => "SYSTEM INSTRUCTIONS:\n{$systemPrompt}\n\nUSER QUERY:\n{$userPrompt}"]
                    ]
                ]
            ],
            'generationConfig' => [
                'temperature' => 0.4,
                'maxOutputTokens' => 800,
            ]
        ];

        $response = Http::withOptions(['verify' => false, 'version' => 1.1])
            ->timeout(25)
            ->withHeaders(['Content-Type' => 'application/json'])
            ->post($url, $payload);

        if (!$response->successful()) {
            $err = $response->json('error.message') ?? $response->body();
            return [
                'success' => false,
                'message' => "Gemini API Error ({$response->status()}): {$err}",
            ];
        }

        $json = $response->json();
        $text = $json['candidates'][0]['content']['parts'][0]['text'] ?? '';
        $tokens = (int) ($json['usageMetadata']['totalTokenCount'] ?? 150);

        return [
            'success' => true,
            'message' => $text,
            'text' => $text,
            'tokens' => $tokens,
            'provider' => 'gemini',
            'model' => $model,
        ];
    }

    /**
     * OpenAI Chat Completions API call
     */
    protected function callOpenAi(string $userPrompt, string $systemPrompt, string $apiKey, string $model): array
    {
        $url = "https://api.openai.com/v1/chat/completions";

        $payload = [
            'model' => $model ?: 'gpt-4o-mini',
            'messages' => [
                ['role' => 'system', 'content' => $systemPrompt],
                ['role' => 'user', 'content' => $userPrompt],
            ],
            'temperature' => 0.4,
            'max_tokens' => 800,
        ];

        $response = Http::withOptions(['verify' => false, 'version' => 1.1])
            ->timeout(25)
            ->withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'Content-Type' => 'application/json',
            ])
            ->post($url, $payload);

        if (!$response->successful()) {
            $err = $response->json('error.message') ?? $response->body();
            return [
                'success' => false,
                'message' => "OpenAI API Error ({$response->status()}): {$err}",
            ];
        }

        $json = $response->json();
        $text = $json['choices'][0]['message']['content'] ?? '';
        $tokens = (int) ($json['usage']['total_tokens'] ?? 150);

        return [
            'success' => true,
            'message' => $text,
            'text' => $text,
            'tokens' => $tokens,
            'provider' => 'openai',
            'model' => $model,
        ];
    }

    /**
     * Anthropic Claude API call
     */
    protected function callAnthropic(string $userPrompt, string $systemPrompt, string $apiKey, string $model): array
    {
        $url = "https://api.anthropic.com/v1/messages";

        $payload = [
            'model' => $model ?: 'claude-3-5-sonnet-20241022',
            'max_tokens' => 800,
            'system' => $systemPrompt,
            'messages' => [
                ['role' => 'user', 'content' => $userPrompt]
            ]
        ];

        $response = Http::withOptions(['verify' => false, 'version' => 1.1])
            ->timeout(25)
            ->withHeaders([
                'x-api-key' => $apiKey,
                'anthropic-version' => '2023-06-01',
                'Content-Type' => 'application/json',
            ])
            ->post($url, $payload);

        if (!$response->successful()) {
            $err = $response->json('error.message') ?? $response->body();
            return [
                'success' => false,
                'message' => "Anthropic API Error ({$response->status()}): {$err}",
            ];
        }

        $json = $response->json();
        $text = $json['content'][0]['text'] ?? '';
        $tokens = (int) (($json['usage']['input_tokens'] ?? 60) + ($json['usage']['output_tokens'] ?? 80));

        return [
            'success' => true,
            'message' => $text,
            'text' => $text,
            'tokens' => $tokens,
            'provider' => 'anthropic',
            'model' => $model,
        ];
    }

    /**
     * Deterministic Grounded Offline Answer Engine
     */
    protected function groundedOfflineAnswer(string $userPrompt, string $catalogContext, string $memberContext): string
    {
        $lower = strtolower($userPrompt);

        // 1. Navigation queries
        if (str_contains($lower, 'navigate') || str_contains($lower, 'where') || str_contains($lower, 'how to') || str_contains($lower, 'find') || str_contains($lower, 'page')) {
            if (str_contains($lower, 'cart') || str_contains($lower, 'buy') || str_contains($lower, 'checkout') || str_contains($lower, 'mpesa') || str_contains($lower, 'm-pesa')) {
                return "You can buy digital e-books and checkout via M-Pesa at **[Shopping Cart](/cart)**.\n\n"
                    . "- Browse titles on **[Book Catalog](/catalog)**\n"
                    . "- Add desired e-books to your cart\n"
                    . "- Enter your M-Pesa number at checkout and authorize the prompt\n"
                    . "- Instantly read your book on your **[Member Dashboard](/member)**!";
            }

            if (str_contains($lower, 'loan') || str_contains($lower, 'due') || str_contains($lower, 'fine') || str_contains($lower, 'my books') || str_contains($lower, 'reader')) {
                return "You can manage all your active loans, overdue fines, and purchased digital e-books on your **[Member Dashboard](/member)**.\n\n"
                    . "Here you can renew borrowed books, pay penalties using M-Pesa STK push, or open the online interactive reader.";
            }

            if (str_contains($lower, 'tier') || str_contains($lower, 'membership') || str_contains($lower, 'upgrade') || str_contains($lower, 'subscribe')) {
                return "Explore our membership tiers and perk packages at **[Membership Plans](/membership)**.\n\n"
                    . "Choose from Student Pass, Standard Reader, or Scholar tiers to unlock higher borrowing limits and extended loan durations.";
            }

            if (str_contains($lower, 'catalog') || str_contains($lower, 'search') || str_contains($lower, 'browse')) {
                return "Visit our full **[Book Catalog](/catalog)** to search by title, author, genre, or ISBN, and check shelf availability.";
            }
        }

        // 2. Member account queries
        if ($memberContext && (str_contains($lower, 'due') || str_contains($lower, 'fine') || str_contains($lower, 'loan') || str_contains($lower, 'account'))) {
            return "Here is your current MaktabaBora account summary:\n\n{$memberContext}\n\n"
                . "You can manage loans and pay fines directly from your **[Member Dashboard](/member)**.";
        }

        // 3. Catalog recommendations
        if ($catalogContext && !str_contains($catalogContext, 'No specific catalog records matched.')) {
            return "Based on your interest, here are top matching titles from our library catalog:\n\n"
                . "{$catalogContext}\n\n"
                . "You can borrow physical copies on shelf or buy digital access to read online. Visit the **[Book Catalog](/catalog)** for more options!";
        }

        return "Hello! I am your SmartLib AI Librarian. I can help you find books in our catalog, recommend great reads, check your loan due dates, and guide you through the library platform.\n\n"
            . "How can I assist your reading journey today?";
    }
}
