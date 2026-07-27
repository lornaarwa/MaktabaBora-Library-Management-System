<?php

namespace App\Http\Controllers;

use App\Contracts\Services\CatalogSearchEngineInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CatalogSearchController extends Controller
{
    protected CatalogSearchEngineInterface $searchEngine;

    public function __construct(CatalogSearchEngineInterface $searchEngine)
    {
        $this->searchEngine = $searchEngine;
    }

    public function search(Request $request): JsonResponse
    {
        $results = $this->searchEngine->search(
            $request->all(),
            (int) $request->input('per_page', 12)
        );

        return response()->json($results);
    }

    public function recommendations(Request $request): JsonResponse
    {
        $user = $request->user();
        $member = $user ? \App\Models\Member::where('user_id', $user->id)->first() : null;
        if (!$member) {
            return response()->json(['data' => []]);
        }

        $recService = app(\App\Contracts\Services\OpenAiRecommendationServiceInterface::class);
        $recommendations = $recService->getPersonalizedRecommendations($member, 6);

        return response()->json(['data' => $recommendations]);
    }
}
