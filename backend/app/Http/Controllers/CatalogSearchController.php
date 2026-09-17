<?php

namespace App\Http\Controllers;

use App\Contracts\Services\CatalogSearchEngineInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class CatalogSearchController extends Controller
{
    protected CatalogSearchEngineInterface $searchEngine;

    public function __construct(CatalogSearchEngineInterface $searchEngine)
    {
        $this->searchEngine = $searchEngine;
    }

    public function search(Request $request): JsonResponse
    {
        $cacheKey = 'catalog_search_' . md5(json_encode($request->query()));

        $results = Cache::remember($cacheKey, 60, function () use ($request) {
            return $this->searchEngine->search(
                $request->all(),
                (int) $request->input('per_page', 12)
            );
        });

        return response()->json($results)
            ->header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    }
}
