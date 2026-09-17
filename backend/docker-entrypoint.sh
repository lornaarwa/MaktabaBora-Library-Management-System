#!/bin/sh
set -e

echo "=== Starting MaktabaBora Backend Container ==="

# Optimize Laravel configuration and route caches if APP_KEY is provided
if [ -n "$APP_KEY" ]; then
    echo ">> Caching Laravel configuration..."
    php artisan config:cache || true
    echo ">> Caching Laravel API routes..."
    php artisan route:cache || true
    echo ">> Caching Laravel views..."
    php artisan view:cache || true
fi

# Automatically execute database migrations against Neon Cloud if RUN_MIGRATIONS=true
if [ "$RUN_MIGRATIONS" = "true" ]; then
    echo ">> Executing database migrations against remote Neon DB..."
    php artisan migrate --force || true
fi

echo ">> MaktabaBora initialization complete. Passing control to Nginx & PHP-FPM..."

