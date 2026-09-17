<?php

use Illuminate\Support\Facades\Route;

/**
 * Catch-all route to serve the compiled React 18 Single-Page Application (SPA)
 * for root and all non-API web routes.
 *
 * Any route starting with /api or /up is excluded so API endpoints and health probes work unobstructed.
 */
Route::get('/{any?}', function () {
    $spaIndexPath = public_path('index.html');

    if (file_exists($spaIndexPath)) {
        return response()->file($spaIndexPath);
    }

    return response()->json([
        'status' => 'active',
        'message' => 'MaktabaBora API Backend is running.',
        'documentation' => '/api/v1/catalog/search'
    ]);
})->where('any', '^(?!api|up).*$');
