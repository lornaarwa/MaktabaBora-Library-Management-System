<?php

use App\Http\Controllers\AiChatbotController;
use App\Http\Controllers\ApiGatewayController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BookInventoryController;
use App\Http\Controllers\CatalogSearchController;
use App\Http\Controllers\FineController;
use App\Http\Controllers\LibrarianDashboardController;
use App\Http\Controllers\LoanController;
use App\Http\Controllers\ReservationController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes - Smart Library Management System
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->middleware(['api', \App\Http\Middleware\CorsMiddleware::class, \App\Http\Middleware\ApiGatewayProxy::class])->group(function () {

    // Auth Routes
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);

    // Public OPAC Catalog & Search
    Route::get('/catalog/search', [CatalogSearchController::class, 'search']);
    Route::get('/books', [BookInventoryController::class, 'index']);
    Route::get('/books/{book}', [BookInventoryController::class, 'show']);

    // M-Pesa Callback (Public hook)
    Route::post('/fines/daraja/callback', [FineController::class, 'darajaCallback']);

    // Authenticated Dashboard Routes
    Route::middleware([\App\Http\Middleware\EnsureHasAccount::class, \App\Http\Middleware\CheckBannedStatus::class])->group(function () {
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);

        // Member Loans & Fine Payment
        Route::get('/loans', [LoanController::class, 'index']);
        Route::post('/fines/{fine}/pay-daraja', [FineController::class, 'payWithDaraja']);

        // Perk Subscriptions
        Route::post('/subscriptions/checkout', [\App\Http\Controllers\SubscriptionController::class, 'checkout']);
        Route::get('/subscriptions/status', [\App\Http\Controllers\SubscriptionController::class, 'status']);

        // Book Hold / Reservations Queue
        Route::post('/reservations', [ReservationController::class, 'store'])
            ->middleware([\App\Http\Middleware\CheckBookAvailability::class, \App\Http\Middleware\CheckReservationAvailability::class]);

        // AI Assistant Chatbot Endpoint
        Route::post('/ai/chat', [AiChatbotController::class, 'chat'])
            ->middleware([\App\Http\Middleware\ChatbotCostLimiter::class]);

        // Librarian & Admin Dashboards
        Route::middleware([\App\Http\Middleware\EnsureIsLibrarian::class])->prefix('librarian')->group(function () {
            Route::get('/metrics', [LibrarianDashboardController::class, 'metrics']);
            Route::post('/members/{member}/borrow-limit', [LibrarianDashboardController::class, 'configureBorrowLimit']);
            Route::post('/books/{book}/toggle-restriction', [LibrarianDashboardController::class, 'toggleBookRestriction']);

            Route::post('/books', [BookInventoryController::class, 'store']);
            Route::put('/books/{book}', [BookInventoryController::class, 'update']);
            Route::delete('/books/{book}', [BookInventoryController::class, 'destroy']);

            Route::post('/loans/checkout', [LoanController::class, 'checkout'])
                ->middleware([\App\Http\Middleware\ValidateBorrowLimit::class, \App\Http\Middleware\CheckFineAmount::class]);
            Route::post('/loans/{loan}/return', [LoanController::class, 'returnBook']);

            Route::get('/fines', [FineController::class, 'index']);
            Route::post('/fines/{fine}/waive', [FineController::class, 'waive']);
        });

        // API Gateway Proxy Route
        Route::any('/gateway/{service?}', [ApiGatewayController::class, 'proxy']);
    });
});
