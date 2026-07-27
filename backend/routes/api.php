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

    // Public Catalog & Search
    Route::get('/catalog/search', [CatalogSearchController::class, 'search']);
    Route::get('/books', [BookInventoryController::class, 'index']);
    Route::get('/books/{book}', [BookInventoryController::class, 'show']);

    // M-Pesa Callback (Public hook)
    Route::post('/fines/daraja/callback', [FineController::class, 'darajaCallback']);

    // Authenticated Base Routes
    Route::middleware(['jwt.validation', 'ensure.account', 'check.banned'])->group(function () {
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::post('/auth/refresh', [AuthController::class, 'refresh']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);

        // Member-only & Member-accessible Features
        Route::middleware(['ensure.member'])->group(function () {
            Route::get('/loans', [LoanController::class, 'index']);
            Route::post('/fines/{fine}/pay-daraja', [FineController::class, 'payWithDaraja']);

            // Personalized Recommendations
            Route::get('/recommendations', [CatalogSearchController::class, 'recommendations']);

            // Book Hold / Reservations Queue
            Route::post('/reservations', [ReservationController::class, 'store'])
                ->middleware(['check.book_availability', 'check.reservation_availability']);

            // AI Assistant Chatbot Endpoint
            Route::post('/ai/chat', [AiChatbotController::class, 'chat'])
                ->middleware(['chatbot.cost_limiter']);
        });

        // Librarian Portal Routes
        Route::middleware(['ensure.librarian'])->prefix('librarian')->group(function () {
            Route::get('/metrics', [LibrarianDashboardController::class, 'metrics']);
            Route::get('/members', [LibrarianDashboardController::class, 'members']);
            Route::post('/members/{member}/approve', [LibrarianDashboardController::class, 'approveMember']);
            Route::post('/members/{member}/borrow-limit', [LibrarianDashboardController::class, 'configureBorrowLimit']);
            Route::post('/books/{book}/toggle-restriction', [LibrarianDashboardController::class, 'toggleBookRestriction']);

            Route::post('/books', [BookInventoryController::class, 'store']);
            Route::put('/books/{book}', [BookInventoryController::class, 'update']);
            Route::delete('/books/{book}', [BookInventoryController::class, 'destroy']);

            Route::post('/loans/checkout', [LoanController::class, 'checkout'])
                ->middleware(['validate.borrow_limit', 'check.fine']);
            Route::post('/loans/{loan}/return', [LoanController::class, 'returnBook']);
            Route::post('/loans/{loan}/lost', [LibrarianDashboardController::class, 'markLost']);

            // Payments hub
            Route::post('/payments', [LibrarianDashboardController::class, 'recordPayment']);

            // Categories Management
            Route::get('/categories', [LibrarianDashboardController::class, 'getCategories']);
            Route::post('/categories', [LibrarianDashboardController::class, 'manageCategories']);

            // Analytics & predictions
            Route::get('/predictions/demand', [LibrarianDashboardController::class, 'getDemandPredictions']);
            Route::get('/analytics/borrowing', [LibrarianDashboardController::class, 'getBorrowingAnalytics']);

            Route::get('/fines', [FineController::class, 'index']);
            Route::post('/fines/{fine}/waive', [FineController::class, 'waive']);
        });

        // Admin Console Routes
        Route::middleware(['ensure.admin'])->prefix('admin')->group(function () {
            Route::get('/users', function () {
                return response()->json(['status' => 'success', 'data' => \App\Models\User::with('member')->get()]);
            });

            // Analytics & Management
            Route::get('/analytics', [\App\Http\Controllers\AdminAnalyticsController::class, 'analytics']);
            Route::post('/members/{member}/ban', [\App\Http\Controllers\AdminAnalyticsController::class, 'banMember']);
            Route::post('/librarians', [\App\Http\Controllers\AdminAnalyticsController::class, 'storeLibrarian']);

            // Dynamic Table CRUD Management Routes
            Route::get('/tables', [\App\Http\Controllers\AdminCrudController::class, 'indexTables']);
            Route::get('/tables/{table}', [\App\Http\Controllers\AdminCrudController::class, 'getTableData']);
            Route::post('/tables/{table}', [\App\Http\Controllers\AdminCrudController::class, 'storeRecord']);
            Route::put('/tables/{table}/{id}', [\App\Http\Controllers\AdminCrudController::class, 'updateRecord']);
            Route::delete('/tables/{table}/{id}', [\App\Http\Controllers\AdminCrudController::class, 'destroyRecord']);
        });

        // API Gateway Proxy Route
        Route::any('/gateway/{service?}', [ApiGatewayController::class, 'proxy']);
    });
});
