<?php

namespace App\Http\Controllers;

use App\Services\AiLibrarianManagerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AiSettingsController extends Controller
{
    protected AiLibrarianManagerService $aiManager;

    public function __construct(AiLibrarianManagerService $aiManager)
    {
        $this->aiManager = $aiManager;
    }

    /**
     * Retrieve public AI provider configuration (with masked keys).
     */
    public function index(): JsonResponse
    {
        $settings = $this->aiManager->getPublicSettings();

        return response()->json([
            'status' => 'success',
            'data' => $settings,
        ]);
    }

    /**
     * Update AI provider settings and custom system prompt.
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'active_provider' => 'sometimes|string|in:gemini,openai,anthropic,offline',
            'system_prompt' => 'sometimes|string|max:10000',
            'temperature' => 'sometimes|numeric|min:0|max:2',
            'max_tokens' => 'sometimes|integer|min:50|max:4000',
            'providers' => 'sometimes|array',
            'providers.*.model' => 'sometimes|string',
            'providers.*.api_key' => 'nullable|string',
        ]);

        $updated = $this->aiManager->updateFromAdmin($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'AI Librarian configuration updated successfully.',
            'data' => $updated,
        ]);
    }

    /**
     * Test connection to a specific AI provider.
     */
    public function testKey(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'provider' => 'required|string|in:gemini,openai,anthropic,offline',
            'api_key' => 'nullable|string',
            'model' => 'nullable|string',
        ]);

        $result = $this->aiManager->testConnection(
            $validated['provider'],
            $validated['api_key'] ?? null,
            $validated['model'] ?? null
        );

        $status = ($result['success'] ?? false) ? 200 : 422;

        return response()->json($result, $status);
    }
}
