#!/bin/sh
# ==============================================================================
# MaktabaBora Production Container Entrypoint Wrapper
# Ensures dynamic cloud provider port binding ($PORT -> $NGINX_HTTP_PORT)
# ==============================================================================

# If Render or any PaaS provides a dynamic $PORT, bind Nginx to it
if [ -n "$PORT" ]; then
    export NGINX_HTTP_PORT="$PORT"
fi

# Default to /init if no arguments are provided to start S6-overlay supervisor
if [ $# -eq 0 ]; then
    set -- /init
fi

# Pass execution to serversideup base entrypoint which handles S6-overlay initialization
exec docker-php-serversideup-entrypoint "$@"
