# ==============================================================================
# Multi-Stage Production Dockerfile for MaktabaBora
# Builds React 18 SPA Frontend and serves via Nginx + PHP-FPM 8.2 Backend
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build React 18 Single-Page Application (SPA)
# ------------------------------------------------------------------------------
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Install frontend dependencies using clean install
COPY frontend/package*.json ./
RUN npm ci

# Copy frontend source code and compile production Vite bundle
COPY frontend/ ./
ENV VITE_API_URL=/api/v1
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Production PHP-FPM + Nginx Environment (Serversideup Alpine)
# ------------------------------------------------------------------------------
FROM serversideup/php:8.2-fpm-nginx AS production

# Production PHP & Webserver configuration
ENV PHP_OPCACHE_ENABLE=1 \
    AUTORUN_ENABLED=true \
    WEB_DOCUMENT_ROOT=/var/www/html/public

USER root

# Install PostgreSQL client drivers & extensions
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    postgresql-client \
    && docker-php-ext-install pdo_pgsql \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy backend application source code
COPY --chown=www-data:www-data backend /var/www/html

# Install Composer production dependencies with optimized classloader
WORKDIR /var/www/html
RUN composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist

# Copy compiled React SPA bundle directly into Laravel's public directory
COPY --from=frontend-builder --chown=www-data:www-data /app/frontend/dist/ /var/www/html/public/

# Copy container startup lifecycle entrypoint hook
COPY --chown=www-data:www-data backend/docker-entrypoint.sh /etc/entrypoint.d/99-maktababora.sh
RUN chmod +x /etc/entrypoint.d/99-maktababora.sh

# Copy dynamic port entrypoint wrapper
COPY --chown=www-data:www-data backend/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Expose default HTTP port for container documentation
EXPOSE 8080

# Run under unprivileged user
USER www-data

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["/init"]

