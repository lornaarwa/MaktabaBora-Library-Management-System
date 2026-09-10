<?php

namespace App\Services;

use App\Models\Book;
use App\Models\BookCopy;
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
You are the official intelligent Library Assistant and interactive guide for the MaktabaBora Smart Library Management System.

### MISSION & CATALOG-FOCUSED BEHAVIOR
1. Comprehensive Catalog Knowledge: Answer book, author, genre, and reading inquiries using the rich database catalog records provided in your context. You have access to real-time information on all books, authors, publishers, genres, publication years, ISBNs, shelf rack locations, physical copy availability, and digital e-book reading prices.
2. Grounded Accuracy: Answer strictly using facts from the catalog database records. Never invent, hallucinate, or recommend books that do not exist in the MaktabaBora catalog.
3. Privacy & Sensitive Data Protection: You have access ONLY to the public book catalog and website navigation directory. You DO NOT have access to sensitive user accounts, passwords, patron identities, member profiles, or private personal borrowing histories.
4. Clean Rich-Text Output: Present all information with clean, polished rich text:
   - **Bold** all book titles, authors, and key highlights with `**Title**`.
   - <u>Underline</u> important action steps, notices, or status callouts with `<u>term</u>` or `__term__`.
   - Use clean markdown bullet lists (`- item`) for catalog books and copy status.
   - Use interactive links for platform navigation, e.g. `**[Browse Catalog](/catalog)**`, `**[Shopping Cart](/cart)**`, `**[Member Dashboard](/member)**`.
5. Friendly & Professional: Be welcoming, concise, well-structured with markdown, and helpful to students, scholars, and library patrons.

### PRIVACY BOUNDARY (USER ACCOUNTS)
- If a user asks about their personal account details, active loans, return due dates, fine balances, or passwords, DO NOT invent or guess any account data.
- Instruct them to check their secure private **[Member Dashboard](/member)** where their active loans, due dates, fine balances, and digital reader shelf are safely displayed.

### WEBSITE NAVIGATION DIRECTORY
When users ask about website navigation, account features, or how to perform actions, provide exact links and steps:
- **Browse & Search Catalog**: `/catalog` (Filter by genre, search titles/authors/ISBN, check copy availability, or preview covers).
- **Shopping Cart & Checkout**: `/cart` (Purchase digital e-books for instant online reading via M-Pesa).
- **Member Dashboard**: `/member` (View active physical book loans, due dates, renew books, view fine balance, pay fines via M-Pesa STK, and access My Digital Library reader).
- **Membership & Perks**: `/membership` (Compare Student Pass, Standard Reader, and Scholar tiers, subscribe or upgrade membership).
- **Book Details Page**: `/books/:id` (Inspect book synopsis, view available shelf copies, check digital price, or place a hold reservation).

### BOOK RECOMMENDATION & AVAILABILITY RULES
- When a user asks for recommendations, analyze their query or interest and recommend real titles from the catalog database context.
- Clearly state whether copies are **available to borrow physically** on the shelf, or if the user can **buy lifetime digital reading access** to read online immediately.
- If a book has 0 available physical copies, explain that they can place a hold reservation on its details page (`/books/:id`) or purchase the digital e-book version.
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
                    'model' => 'gemini-2.5-flash',
                    'available_models' => ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'],
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
        $merged = array_replace_recursive($defaults, $decoded);

        // Auto-migrate retired gemini models in active configuration
        if (isset($merged['providers']['gemini']['model']) && 
            ($merged['providers']['gemini']['model'] === 'gemini-1.5-flash' || $merged['providers']['gemini']['model'] === 'gemini-1.5-pro')) {
            $merged['providers']['gemini']['model'] = 'gemini-2.5-flash';
            $merged['providers']['gemini']['available_models'] = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'];
            $this->saveSettings($merged);
        }

        return $merged;
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

                // If remove_key flag is set or api_key explicitly set to empty string
                if (!empty($provData['remove_key'])) {
                    $current['providers'][$providerKey]['api_key'] = '';
                } elseif (isset($provData['api_key'])) {
                    $newKey = trim((string) $provData['api_key']);
                    if ($newKey === '') {
                        // Empty string explicit reset
                        $current['providers'][$providerKey]['api_key'] = '';
                    } elseif (!str_contains($newKey, '•') && !str_contains($newKey, '*')) {
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
     * Fetch available models dynamically from provider APIs.
     *
     * @return array{models: array<string>, source: string, message?: string}
     */
    public function fetchAvailableModels(string $provider, ?string $apiKey = null): array
    {
        $settings = $this->getSettings();
        $providerConfig = $settings['providers'][$provider] ?? null;

        if ($provider === 'offline') {
            return [
                'models' => ['deterministic-catalog-engine'],
                'source' => 'offline',
            ];
        }

        $key = $apiKey ?: ($providerConfig['api_key'] ?? '');

        if (empty(trim($key))) {
            $currentModels = $providerConfig['available_models'] ?? match ($provider) {
                'gemini' => ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'],
                'openai' => ['gpt-4o', 'gpt-4o-mini', 'o1-mini', 'o3-mini', 'gpt-3.5-turbo'],
                'anthropic' => ['claude-3-7-sonnet-20250219', 'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
                default => ['default'],
            };
            return [
                'models' => $currentModels,
                'source' => 'cache_no_key',
                'message' => 'No API key provided. Showing standard provider models.',
            ];
        }

        try {
            $models = [];
            switch ($provider) {
                case 'gemini':
                    $res = Http::withOptions(['verify' => false, 'version' => 1.1])
                        ->timeout(15)
                        ->get("https://generativelanguage.googleapis.com/v1beta/models", [
                            'key' => $key,
                        ]);
                    if ($res->successful()) {
                        $items = $res->json('models') ?? [];
                        foreach ($items as $item) {
                            $methods = $item['supportedGenerationMethods'] ?? [];
                            if (in_array('generateContent', $methods, true)) {
                                $name = str_replace('models/', '', $item['name'] ?? '');
                                if (!empty($name) && str_contains($name, 'gemini')) {
                                    $models[] = $name;
                                }
                            }
                        }
                    } else {
                        throw new \Exception($res->json('error.message') ?? 'Gemini models request failed with HTTP ' . $res->status());
                    }
                    break;

                case 'openai':
                    $res = Http::withOptions(['verify' => false, 'version' => 1.1])
                        ->withToken($key)
                        ->timeout(15)
                        ->get('https://api.openai.com/v1/models');
                    if ($res->successful()) {
                        $items = $res->json('data') ?? [];
                        foreach ($items as $item) {
                            $id = $item['id'] ?? '';
                            if (preg_match('/^(gpt|o1|o3|chatgpt)/i', $id) && !str_contains($id, 'realtime') && !str_contains($id, 'audio') && !str_contains($id, 'transcription')) {
                                $models[] = $id;
                            }
                        }
                        sort($models);
                    } else {
                        throw new \Exception($res->json('error.message') ?? 'OpenAI models request failed with HTTP ' . $res->status());
                    }
                    break;

                case 'anthropic':
                    $res = Http::withOptions(['verify' => false, 'version' => 1.1])
                        ->withHeaders([
                            'x-api-key' => $key,
                            'anthropic-version' => '2023-06-01',
                        ])
                        ->timeout(15)
                        ->get('https://api.anthropic.com/v1/models');

                    if ($res->successful()) {
                        $items = $res->json('data') ?? [];
                        foreach ($items as $item) {
                            if (!empty($item['id'])) {
                                $models[] = $item['id'];
                            }
                        }
                    } else {
                        // Anthropic models endpoint fallback to verified modern releases
                        $models = ['claude-3-7-sonnet-20250219', 'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'];
                    }
                    break;

                default:
                    throw new \Exception("Unsupported provider {$provider}");
            }

            if (!empty($models)) {
                // Update settings file cache
                $settings['providers'][$provider]['available_models'] = array_values(array_unique($models));
                $this->saveSettings($settings);

                return [
                    'models' => array_values(array_unique($models)),
                    'source' => 'live_api',
                    'message' => "Successfully fetched live models from {$provider}.",
                ];
            }

            throw new \Exception("No text generation models returned from {$provider}.");

        } catch (\Throwable $e) {
            Log::warning("Live models fetch failed for {$provider}: " . $e->getMessage());
            $cached = $providerConfig['available_models'] ?? ['default'];
            return [
                'models' => $cached,
                'source' => 'fallback_cache',
                'message' => 'Live fetch failed: ' . $e->getMessage() . '. Displaying cached models.',
            ];
        }
    }

    /**
     * Build comprehensive catalog context directly from database records,
     * strictly excluding any sensitive user account data.
     *
     * @param  string  $userPrompt
     * @param  \Illuminate\Database\Eloquent\Collection|null  $retrieved
     * @return string
     */
    public function buildCatalogDatabaseContext(string $userPrompt = '', $retrieved = null): string
    {
        try {
            // 1. Live database catalog summary metrics
            $totalTitles = Book::count();
            $totalPhysicalCopies = (int) Book::sum('total_copies');
            $availableCopies = (int) Book::sum('available_copies');
            $distinctGenres = Book::whereNotNull('genre')
                ->where('genre', '!=', '')
                ->distinct()
                ->pluck('genre')
                ->filter()
                ->values()
                ->all();
            $genresStr = !empty($distinctGenres) ? implode(', ', $distinctGenres) : 'General';

            $header = "=== LIBRARY CATALOG DATABASE INVENTORY SUMMARY ===\n"
                . "- Total Catalog Titles: {$totalTitles}\n"
                . "- Total Physical Copies in Inventory: {$totalPhysicalCopies} ({$availableCopies} copies currently on shelf ready to borrow)\n"
                . "- Active Genres in Library: {$genresStr}\n";

            // 2. Fetch specific matching books or general catalog records
            $booksCollection = $retrieved;
            if (!$booksCollection || $booksCollection->isEmpty()) {
                if (!empty(trim($userPrompt))) {
                    try {
                        $booksCollection = app(CatalogRetrievalService::class)->retrieve($userPrompt, 8);
                    } catch (\Throwable $e) {
                        $booksCollection = collect();
                    }
                }
            }

            // Always ensure the assistant has rich book records from the database
            if (!$booksCollection || $booksCollection->count() < 4) {
                $supplemental = Book::with('copies')
                    ->where('is_blocked', false)
                    ->orderByDesc('available_copies')
                    ->limit(10)
                    ->get();
                $booksCollection = $booksCollection ? $booksCollection->merge($supplemental)->unique('id')->take(10) : $supplemental;
            } else {
                $booksCollection->loadMissing('copies');
            }

            if ($booksCollection->isEmpty()) {
                return $header . "\nNo books currently found in the catalog database.";
            }

            $bookLines = [];
            foreach ($booksCollection as $book) {
                // Shelf Rack Locations from book copies
                $racks = $book->copies
                    ? $book->copies->pluck('location_rack')->filter()->unique()->values()->all()
                    : [];
                $rackStr = !empty($racks) ? implode(', ', $racks) : 'Main Stack';

                // Physical shelf availability status
                if ($book->is_blocked) {
                    $shelfStatus = 'RESTRICTED (Administrative hold, currently unavailable)';
                } elseif ($book->available_copies > 0) {
                    $shelfStatus = "IN STOCK: {$book->available_copies} of {$book->total_copies} physical copies ready to borrow";
                } else {
                    $shelfStatus = "CHECKED OUT: 0 of {$book->total_copies} copies on shelf (Hold reservation available)";
                }

                // Digital reading access & pricing
                if ($book->digital_purchase_price > 0) {
                    $digitalAccess = "Digital E-Book available for instant reading online at KES " . number_format((float) $book->digital_purchase_price, 2) . " via M-Pesa";
                } elseif (!empty($book->file_path)) {
                    $digitalAccess = "Digital E-Book available for online reading";
                } else {
                    $digitalAccess = "Physical borrow only";
                }

                $tier = $book->is_exclusive ? 'Pro / Scholar Exclusive' : 'All Tiers (Standard & Scholar)';
                $synopsis = !empty($book->description) ? trim($book->description) : 'No synopsis recorded.';

                $bookLines[] = "- [Book #{$book->id}] \"{$book->title}\" by {$book->author}\n"
                    . "  * Genre: {$book->genre} | Year: {$book->publication_year} | Publisher: " . ($book->publisher ?: 'N/A') . " | ISBN: {$book->isbn}\n"
                    . "  * Physical Status: {$shelfStatus} | Shelf Rack Location: {$rackStr}\n"
                    . "  * Digital Reading: {$digitalAccess} | Access Tier: {$tier}\n"
                    . "  * Direct URL: /books/{$book->id}\n"
                    . "  * Synopsis: {$synopsis}";
            }

            return $header . "\n=== CATALOG DATABASE RECORDS (LIVE REAL-TIME DATA) ===\n" . implode("\n\n", $bookLines);
        } catch (\Throwable $e) {
            Log::warning('Failed building catalog database context for AI prompt', ['error' => $e->getMessage()]);
            return "Catalog database context currently unavailable.";
        }
    }

    /**
     * Dispatch prompt to the active provider with grounded catalog context.
     * Strictly excludes sensitive user accounts from the prompt.
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

        // If catalogContext is empty, automatically build it from database records
        if (empty(trim($catalogContext))) {
            $catalogContext = $this->buildCatalogDatabaseContext($userPrompt);
        }

        // Compose full system prompt with dynamic runtime catalog context (strictly excluding sensitive user accounts)
        $basePrompt = $settings['system_prompt'] ?? $this->getDefaultSystemPrompt();
        $fullSystemPrompt = $basePrompt . "\n\n"
            . "### LIVE CATALOG DATABASE RECORDS CONTEXT\n" . $catalogContext;

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
        $cleanModel = preg_replace('#^models/#', '', trim($model));
        if (empty($cleanModel) || $cleanModel === 'gemini-1.5-flash' || $cleanModel === 'gemini-1.5-pro') {
            // Auto-upgrade retired 1.5 versions to current stable 2.5 flash
            $cleanModel = 'gemini-2.5-flash';
        }

        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$cleanModel}:generateContent?key={$apiKey}";

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
            // If 404 indicating model is retired or not found, auto-fallback to gemini-2.5-flash
            if ($response->status() === 404 && $cleanModel !== 'gemini-2.5-flash') {
                Log::info("Gemini model '{$cleanModel}' returned 404, automatically falling back to gemini-2.5-flash");
                $fallbackResult = $this->callGemini($userPrompt, $systemPrompt, $apiKey, 'gemini-2.5-flash');
                if ($fallbackResult['success'] ?? false) {
                    // Save the working model into settings
                    try {
                        $settings = $this->getSettings();
                        $settings['providers']['gemini']['model'] = 'gemini-2.5-flash';
                        $this->saveSettings($settings);
                    } catch (\Throwable $e) {
                        // ignore
                    }
                    return $fallbackResult;
                }
            }

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
            'model' => $cleanModel,
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
    protected function groundedOfflineAnswer(string $userPrompt, string $catalogContext, string $memberContext = ''): string
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

            if (str_contains($lower, 'tier') || str_contains($lower, 'membership') || str_contains($lower, 'upgrade') || str_contains($lower, 'subscribe')) {
                return "Explore our membership tiers and perk packages at **[Membership Plans](/membership)**.\n\n"
                    . "Choose from Student Pass, Standard Reader, or Scholar tiers to unlock higher borrowing limits and extended loan durations.";
            }

            if (str_contains($lower, 'catalog') || str_contains($lower, 'search') || str_contains($lower, 'browse')) {
                return "Visit our full **[Book Catalog](/catalog)** to search by title, author, genre, or ISBN, and check shelf availability.";
            }
        }

        // 2. Member account queries (Strict privacy boundary: protect personal user accounts)
        if (str_contains($lower, 'due') || str_contains($lower, 'fine') || str_contains($lower, 'loan') || str_contains($lower, 'account') || str_contains($lower, 'renew') || str_contains($lower, 'overdue')) {
            return "For your privacy and security, personal account details, active loans, and fines are kept strictly confidential and are not accessed by the Library Assistant.\n\n"
                . "You can securely view your active loans, return due dates, and fine balances directly on your **[Member Dashboard](/member)**.";
        }

        // 3. Availability queries
        if (str_contains($lower, 'available') || str_contains($lower, 'in stock') || str_contains($lower, 'on shelf')) {
            $available = Book::where('is_blocked', false)
                ->where('available_copies', '>', 0)
                ->orderByDesc('available_copies')
                ->limit(6)
                ->get(['title', 'author', 'genre', 'available_copies']);

            if ($available->isNotEmpty()) {
                $lines = $available->map(fn (Book $b) => "- **{$b->title}** by {$b->author} ({$b->genre}) — {$b->available_copies} copy/copies available to borrow now.")->implode("\n");
                return "Here is what is available to borrow right now:\n\n{$lines}\n\nWant more details or a reservation on any of these? Visit the **[Book Catalog](/catalog)**!";
            }
        }

        // 4. Catalog recommendations
        if ($catalogContext && !str_contains($catalogContext, 'No books currently found')) {
            return "Based on our library catalog records, here are titles from our collection:\n\n"
                . "{$catalogContext}\n\n"
                . "You can borrow physical copies on shelf or buy digital editions to read online. Visit the **[Book Catalog](/catalog)** for more options!";
        }

        return "Hello! I am your Library Assistant. I can help you search our catalog, recommend great reads, check shelf availability, and guide you through the library platform.\n\n"
            . "How can I assist you today?";
    }
}
