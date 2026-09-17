/**
 * Lightweight Client-Side Stale-While-Revalidate (SWR) Cache & Speculative Preloader
 *
 * Provides:
 * - Instant UI rendering on page revisits (0ms load time)
 * - Transparent background revalidation (SWR)
 * - In-flight request deduplication
 * - Speculative preloading on hover/focus
 * - Targeted cache invalidation on mutations (reserve, buy, loan, cancel)
 * - SessionStorage persistence for catalog and public data
 */

const inMemoryCache = new Map();
const inFlightRequests = new Map();
const SESSION_PREFIX = 'mb_cache_';

class ClientCache {
    /**
     * Retrieve an entry from memory or sessionStorage
     */
    get(key) {
        let entry = inMemoryCache.get(key);

        // Fall back to sessionStorage if not in memory
        if (!entry && typeof window !== 'undefined' && window.sessionStorage) {
            try {
                const raw = window.sessionStorage.getItem(SESSION_PREFIX + key);
                if (raw) {
                    entry = JSON.parse(raw);
                    inMemoryCache.set(key, entry);
                }
            } catch {
                // Ignore storage errors
            }
        }

        if (!entry) return null;

        const now = Date.now();
        const age = now - entry.timestamp;
        const isFresh = age < entry.ttl;
        const isStale = age >= entry.ttl && age < (entry.ttl * 4); // Stale window allowed for SWR
        const isExpired = age >= (entry.ttl * 4);

        if (isExpired) {
            this.delete(key);
            return null;
        }

        return {
            data: entry.data,
            isFresh,
            isStale,
            timestamp: entry.timestamp,
        };
    }

    /**
     * Store data in cache
     */
    set(key, data, ttl = 120000, persist = false) {
        const entry = {
            data,
            timestamp: Date.now(),
            ttl,
            persist,
        };

        inMemoryCache.set(key, entry);

        if (persist && typeof window !== 'undefined' && window.sessionStorage) {
            try {
                window.sessionStorage.setItem(SESSION_PREFIX + key, JSON.stringify(entry));
            } catch {
                // Storage full or quota exceeded, silent ignore
            }
        }
    }

    /**
     * Delete a specific cache key
     */
    delete(key) {
        inMemoryCache.delete(key);
        if (typeof window !== 'undefined' && window.sessionStorage) {
            try {
                window.sessionStorage.removeItem(SESSION_PREFIX + key);
            } catch {
                // Ignore
            }
        }
    }

    /**
     * Invalidate all keys matching a prefix or regex pattern
     */
    invalidate(pattern) {
        const isRegex = pattern instanceof RegExp;
        const testFn = (k) => (isRegex ? pattern.test(k) : k.startsWith(pattern));

        // Memory cache invalidation
        for (const k of inMemoryCache.keys()) {
            if (testFn(k)) {
                inMemoryCache.delete(k);
            }
        }

        // SessionStorage invalidation
        if (typeof window !== 'undefined' && window.sessionStorage) {
            try {
                const keysToRemove = [];
                for (let i = 0; i < window.sessionStorage.length; i++) {
                    const rawKey = window.sessionStorage.key(i);
                    if (rawKey && rawKey.startsWith(SESSION_PREFIX)) {
                        const cleanKey = rawKey.slice(SESSION_PREFIX.length);
                        if (testFn(cleanKey)) {
                            keysToRemove.push(rawKey);
                        }
                    }
                }
                keysToRemove.forEach((k) => window.sessionStorage.removeItem(k));
            } catch {
                // Ignore
            }
        }
    }

    /**
     * Clear all cached items (e.g. on logout)
     */
    clear() {
        inMemoryCache.clear();
        inFlightRequests.clear();
        if (typeof window !== 'undefined' && window.sessionStorage) {
            try {
                const keysToRemove = [];
                for (let i = 0; i < window.sessionStorage.length; i++) {
                    const k = window.sessionStorage.key(i);
                    if (k && k.startsWith(SESSION_PREFIX)) {
                        keysToRemove.push(k);
                    }
                }
                keysToRemove.forEach((k) => window.sessionStorage.removeItem(k));
            } catch {
                // Ignore
            }
        }
    }

    /**
     * Fetch with SWR caching and in-flight deduplication
     */
    async fetchWithCache(key, fetcherFn, options = {}) {
        const {
            ttl = 120000,          // 2 minutes default fresh TTL
            swr = true,            // Serve stale while revalidating
            persist = false,       // Store in sessionStorage
            onRevalidate = null,   // Callback when background fetch finishes
        } = options;

        const cached = this.get(key);

        // 1. If fresh, return immediately without network call
        if (cached && cached.isFresh) {
            return cached.data;
        }

        // 2. If stale and SWR is allowed: return stale data immediately, revalidate in background
        if (cached && cached.isStale && swr) {
            this.revalidateInBackground(key, fetcherFn, ttl, persist, onRevalidate);
            return cached.data;
        }

        // 3. Cache miss or strictly expired: deduplicate in-flight network request
        if (inFlightRequests.has(key)) {
            return inFlightRequests.get(key);
        }

        const requestPromise = (async () => {
            try {
                const result = await fetcherFn();
                this.set(key, result, ttl, persist);
                return result;
            } finally {
                inFlightRequests.delete(key);
            }
        })();

        inFlightRequests.set(key, requestPromise);
        return requestPromise;
    }

    /**
     * Revalidate in background without blocking current execution
     */
    revalidateInBackground(key, fetcherFn, ttl, persist, onRevalidate) {
        if (inFlightRequests.has(key)) return;

        const promise = (async () => {
            try {
                const result = await fetcherFn();
                this.set(key, result, ttl, persist);
                if (typeof onRevalidate === 'function') {
                    onRevalidate(result);
                }
                return result;
            } catch {
                // Silently keep stale data if background revalidation fails
            } finally {
                inFlightRequests.delete(key);
            }
        })();

        inFlightRequests.set(key, promise);
    }

    /**
     * Speculatively prefetch a resource into cache before navigation
     */
    prefetch(key, fetcherFn, options = {}) {
        const cached = this.get(key);
        if (cached && cached.isFresh) {
            return Promise.resolve(cached.data);
        }

        const { ttl = 120000, persist = false } = options;

        // Use requestIdleCallback if available, or setTimeout to run during browser idle
        return new Promise((resolve) => {
            const runner = () => {
                this.fetchWithCache(key, fetcherFn, { ttl, persist, swr: false })
                    .then(resolve)
                    .catch(() => resolve(null));
            };

            if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
                window.requestIdleCallback(runner, { timeout: 400 });
            } else {
                setTimeout(runner, 20);
            }
        });
    }
}

export const clientCache = new ClientCache();
