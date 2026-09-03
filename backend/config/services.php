<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    // Grounded AI Librarian — OpenAI configuration.
    // Leave OPENAI_API_KEY empty to run in offline mode (grounded SQL retrieval + member context,
    // no external calls). Set it in .env to enable live GPT responses over the retrieved facts.
    'openai' => [
        'api_key' => env('OPENAI_API_KEY'),
        'model' => env('OPENAI_MODEL', 'gpt-4o-mini'),
        'embedding_model' => env('OPENAI_EMBEDDING_MODEL', 'text-embedding-3-small'),
        'embedding_batch_size' => (int) env('OPENAI_EMBEDDING_BATCH_SIZE', 64),
        'max_tokens' => (int) env('OPENAI_MAX_TOKENS', 500),
    ],

    // Currency conversion for displaying foreign retail prices as an *estimated* KES amount.
    // Uses the free no-key endpoint https://open.er-api.com/v6/latest (daily-updated rates,
    // ~1,500 requests/month) fetched once per day and cached server-side.
    'currency' => [
        'url' => env('EXCHANGE_RATE_API_URL', 'https://open.er-api.com/v6/latest'),
        'base' => env('EXCHANGE_RATE_BASE', 'USD'),
        'cache_ttl_seconds' => (int) env('EXCHANGE_RATE_CACHE_TTL', 86400),
        'timeout' => (int) env('EXCHANGE_RATE_TIMEOUT', 8),
    ],

];
