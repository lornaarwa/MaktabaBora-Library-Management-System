# ==============================================================================
# MaktabaBora Backend - Production Dockerfile for Render Deployment
# Base: serversideup/php:8.2-fpm-nginx (Production-optimized for Laravel)
# ==============================================================================
FROM serversideup/php:8.2-fpm-nginx

# Set working directory
WORKDIR /var/www/html

# Environment defaults for production
ENV APP_ENV=production \
    APP_DEBUG=false \
    LOG_CHANNEL=stderr \
    PHP_OPCACHE_ENABLE=1 \
    PORT=8080

# Switch to root for installation & permission configuration
USER root

# Copy application codebase
COPY --chown=www-data:www-data . /var/www/html

# Install production PHP dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist

# Copy entrypoint script into S6 entrypoint hooks
COPY docker-entrypoint.sh /etc/entrypoint.d/99-maktababora-init.sh
RUN chmod +x /etc/entrypoint.d/99-maktababora-init.sh \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache \
    && chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Switch back to non-root application user
USER www-data

# Expose HTTP port (Render dynamically overrides via $PORT)
EXPOSE 8080

