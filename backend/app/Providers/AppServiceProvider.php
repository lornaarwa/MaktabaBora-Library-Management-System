<?php

namespace App\Providers;

use App\Contracts\Services\BookAvailabilityServiceInterface;
use App\Contracts\Services\BorrowLimitServiceInterface;
use App\Contracts\Services\QueueReservationServiceInterface;
use App\Contracts\Services\TokenBucketRateLimiterInterface;
use App\Services\BookAvailabilityService;
use App\Services\BorrowLimitService;
use App\Services\QueueReservationService;
use App\Services\TokenBucketRateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(TokenBucketRateLimiterInterface::class, TokenBucketRateLimiter::class);
        $this->app->singleton(TokenBucketRateLimiter::class, TokenBucketRateLimiter::class);

        $this->app->singleton(BorrowLimitServiceInterface::class, BorrowLimitService::class);
        $this->app->singleton(BorrowLimitService::class, BorrowLimitService::class);

        $this->app->singleton(BookAvailabilityServiceInterface::class, BookAvailabilityService::class);
        $this->app->singleton(BookAvailabilityService::class, BookAvailabilityService::class);

        $this->app->singleton(QueueReservationServiceInterface::class, QueueReservationService::class);
        $this->app->singleton(QueueReservationService::class, QueueReservationService::class);
    }

    public function boot(): void
    {
        //
    }
}
