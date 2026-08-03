<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->alias([
            'ensure.admin' => \App\Http\Middleware\EnsureIsAdmin::class,
            'ensure.librarian' => \App\Http\Middleware\EnsureIsLibrarian::class,
            'ensure.member' => \App\Http\Middleware\EnsureIsMember::class,
            'ensure.subscribed' => \App\Http\Middleware\EnsureActiveSubscription::class,
            'ensure.password_changed' => \App\Http\Middleware\EnsurePasswordChangeNotRequired::class,
            'ensure.account' => \App\Http\Middleware\EnsureHasAccount::class,
            'validate.borrow_limit' => \App\Http\Middleware\ValidateBorrowLimit::class,
            'check.book_availability' => \App\Http\Middleware\CheckBookAvailability::class,
            'check.reservation_availability' => \App\Http\Middleware\CheckReservationAvailability::class,
            'jwt.validation' => \App\Http\Middleware\JwtTokenValidation::class,
            'throttle.requests' => \App\Http\Middleware\ThrottleRequestsMiddleware::class,
            'ip.rate_limiter' => \App\Http\Middleware\IpRateLimiter::class,
            'cors' => \App\Http\Middleware\CorsMiddleware::class,
            'trust.proxies' => \App\Http\Middleware\TrustProxiesMiddleware::class,
            'api.gateway' => \App\Http\Middleware\ApiGatewayProxy::class,
            'check.banned' => \App\Http\Middleware\CheckBannedStatus::class,
            'check.fine' => \App\Http\Middleware\CheckFineAmount::class,
            'chatbot.cost_limiter' => \App\Http\Middleware\ChatbotCostLimiter::class,
            'ensure.digital_access' => \App\Http\Middleware\EnsureValidDigitalAccess::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
