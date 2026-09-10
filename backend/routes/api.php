<?php

use App\Http\Controllers\AiChatbotController;
use App\Http\Controllers\AiSettingsController;
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
    Route::post('/auth/register-membership-stk', [AuthController::class, 'registerMembershipStk']);
    Route::post('/auth/login', [AuthController::class, 'login']);

    // Public Catalog & Search
    Route::get('/catalog/search', [CatalogSearchController::class, 'search']);
    Route::get('/books', [BookInventoryController::class, 'index']);
    Route::get('/books/{book}', [BookInventoryController::class, 'show']);

    // Dynamic Membership Tiers (Accessible to all guests & members)
    Route::get('/membership-tiers', [\App\Http\Controllers\MembershipTierController::class, 'index']);

    // M-Pesa Callback (Public hook)
    Route::post('/fines/daraja/callback', [FineController::class, 'darajaCallback']);

    // Authenticated Base Routes
    Route::middleware(['jwt.validation', 'ensure.account', 'check.banned'])->group(function () {
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::put('/auth/profile', [AuthController::class, 'updateProfile']);
        Route::post('/auth/change-first-login-password', [\App\Http\Controllers\LibrarianPasswordChangeController::class, 'changePassword']);
        Route::post('/auth/refresh', [AuthController::class, 'refresh']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);

        // Perk Subscriptions (Accessible to all authenticated users)
        Route::post('/subscriptions/checkout', [\App\Http\Controllers\SubscriptionController::class, 'checkout']);
        Route::get('/subscriptions/status', [\App\Http\Controllers\SubscriptionController::class, 'status']);

        // Member-only & Member-accessible Features
        Route::middleware(['ensure.member'])->group(function () {
            Route::get('/loans', [LoanController::class, 'index']);
            Route::get('/fines', [FineController::class, 'index']);
            Route::post('/fines/{fine}/pay-daraja', [FineController::class, 'payWithDaraja']);

            Route::post('/subscriptions/cancel', [\App\Http\Controllers\SubscriptionController::class, 'cancel']);
            Route::post('/subscriptions/refund', [\App\Http\Controllers\SubscriptionController::class, 'requestRefund']);
            Route::get('/subscriptions/refund-status', [\App\Http\Controllers\SubscriptionController::class, 'refundStatus']);

            // Digital Book Store & Reading
            Route::get('/digital-books/my-library', [\App\Http\Controllers\DigitalRentalController::class, 'myLibrary']);
            Route::post('/digital-books/checkout-cart', [\App\Http\Controllers\DigitalRentalController::class, 'checkoutCart']);
            Route::post('/digital-books/{id}/purchase', [\App\Http\Controllers\DigitalRentalController::class, 'purchase']);
            Route::get('/digital-books/{id}/read', [\App\Http\Controllers\DigitalRentalController::class, 'read'])
                ->middleware(['ensure.digital_access']);

            // Book Hold / Reservations Queue
            Route::get('/reservations', [ReservationController::class, 'index']);
            Route::post('/reservations', [ReservationController::class, 'store'])
                ->middleware(['check.book_availability', 'check.reservation_availability']);
            Route::delete('/reservations/{reservation}', [ReservationController::class, 'destroy']);

            // Personalized content-based recommendations (grounded in member history)
            Route::get('/recommendations', [\App\Http\Controllers\BookRecommendationController::class, 'forMember']);

        });            // Similar books (content-based TF-IDF cosine) — available to all authenticated roles
            Route::get('/books/{book}/similar', [\App\Http\Controllers\BookRecommendationController::class, 'similar']);

            // AI Assistant Chatbot (all authenticated roles — the widget is shown to members, librarians and admins)
            Route::post('/ai/chat', [AiChatbotController::class, 'chat'])
                ->middleware(['chatbot.cost_limiter']);
            Route::post('/ai/chat/clear', [AiChatbotController::class, 'clearChat']);

        // Librarian Portal Routes
        Route::middleware(['ensure.librarian'])->prefix('librarian')->group(function () {
            Route::get('/metrics', [LibrarianDashboardController::class, 'metrics']);
            Route::get('/members', [LibrarianDashboardController::class, 'members']);
            Route::post('/members/{member}/borrow-limit', [LibrarianDashboardController::class, 'configureBorrowLimit']);
            Route::post('/books/{book}/toggle-restriction', [LibrarianDashboardController::class, 'toggleBookRestriction']);

            Route::post('/books', [BookInventoryController::class, 'store']);
            Route::put('/books/{book}', [BookInventoryController::class, 'update']);
            Route::delete('/books/{book}', [BookInventoryController::class, 'destroy']);

            Route::post('/loans/checkout', [LoanController::class, 'checkout'])
                ->middleware(['validate.borrow_limit', 'check.fine']);
            Route::post('/loans/{loan}/return', [LoanController::class, 'returnBook']);

            // Book Copies Management
            Route::get('/book-copies', [LibrarianDashboardController::class, 'bookCopies']);
            Route::post('/book-copies', [LibrarianDashboardController::class, 'storeBookCopy']);
            Route::put('/book-copies/{copy}', [LibrarianDashboardController::class, 'updateBookCopy']);
            Route::delete('/book-copies/{copy}', [LibrarianDashboardController::class, 'deleteBookCopy']);

            // Active Loans & Returns
            Route::get('/loans/active', [LibrarianDashboardController::class, 'activeLoans']);

            // Valid Subscriptions CRUD
            Route::get('/subscriptions', [LibrarianDashboardController::class, 'subscriptions']);
            Route::post('/subscriptions', [LibrarianDashboardController::class, 'storeSubscription']);
            Route::put('/subscriptions/{subscription}', [LibrarianDashboardController::class, 'updateSubscription']);
            Route::delete('/subscriptions/{subscription}', [LibrarianDashboardController::class, 'deleteSubscription']);

            Route::get('/fines', [FineController::class, 'index']);
            Route::post('/fines/{fine}/waive', [FineController::class, 'waive']);

            // Reimbursement / Refund Requests Management
            Route::get('/reimbursements', [LibrarianDashboardController::class, 'reimbursements']);
            Route::post('/reimbursements/{id}/review', [LibrarianDashboardController::class, 'reviewReimbursement']);
            Route::get('/refund-requests', [LibrarianDashboardController::class, 'getRefundRequests']);
            Route::post('/refund-requests/{id}/approve', [LibrarianDashboardController::class, 'approveRefund']);
            Route::post('/refund-requests/{id}/reject', [LibrarianDashboardController::class, 'rejectRefund']);

            // Open Library Search & 1-Click Catalog Import
            Route::get('/openlibrary/search', [LibrarianDashboardController::class, 'searchOpenLibrary']);
            Route::post('/openlibrary/import', [LibrarianDashboardController::class, 'importOpenLibrary']);

            // Hold Reservations Approvals & Circulation Desk
            Route::get('/reservations', [LibrarianDashboardController::class, 'reservations']);
            Route::post('/reservations/{reservation}/approve', [LibrarianDashboardController::class, 'approveReservation']);
            Route::post('/reservations/{reservation}/deny', [LibrarianDashboardController::class, 'denyReservation']);
        });

        // Admin Console Routes
        Route::middleware(['ensure.admin'])->prefix('admin')->group(function () {
            Route::get('/users', function () {
                return response()->json(['status' => 'success', 'data' => \App\Models\User::with('member')->get()]);
            });

            // Analytics, Logs & Management
            Route::get('/analytics', [\App\Http\Controllers\AdminAnalyticsController::class, 'analytics']);
            Route::get('/api-logs', [\App\Http\Controllers\AdminAnalyticsController::class, 'apiLogs']);
            Route::post('/members/{member}/ban', [\App\Http\Controllers\AdminAnalyticsController::class, 'banMember']);
            Route::post('/librarians', [\App\Http\Controllers\AdminAnalyticsController::class, 'storeLibrarian']);

            // Reimbursements (Admin can also review)
            Route::get('/reimbursements', [LibrarianDashboardController::class, 'reimbursements']);
            Route::post('/reimbursements/{id}/review', [LibrarianDashboardController::class, 'reviewReimbursement']);

            // Dynamic Membership Tiers Customization
            Route::get('/membership-tiers', [\App\Http\Controllers\MembershipTierController::class, 'index']);
            Route::put('/membership-tiers', [\App\Http\Controllers\MembershipTierController::class, 'update']);

            // AI Librarian & Multi-Provider Settings
            Route::get('/ai-settings', [AiSettingsController::class, 'index']);
            Route::put('/ai-settings', [AiSettingsController::class, 'update']);
            Route::post('/ai-settings/test-key', [AiSettingsController::class, 'testKey']);
            Route::post('/ai-settings/fetch-models', [AiSettingsController::class, 'fetchModels']);

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
