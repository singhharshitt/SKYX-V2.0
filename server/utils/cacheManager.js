/**
 * Simple in-memory cache with TTL support
 */
class CacheManager {
    constructor() {
        this.cache = new Map();
    }

    /**
     * Get value from cache
     * @param {string} key - Cache key
     * @returns {any|null} - Cached value or null if expired/missing
     */
    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;

        // Check if expired
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }

        return item.value;
    }

    /**
     * Set value in cache with TTL
     * @param {string} key - Cache key
     * @param {any} value - Value to cache
     * @param {number} ttlSeconds - Time to live in seconds
     */
    set(key, value, ttlSeconds = 60) {
        const expiry = Date.now() + (ttlSeconds * 1000);
        this.cache.set(key, { value, expiry });
    }

    /**
     * Clear all cache entries
     */
    clear() {
        this.cache.clear();
    }

    /**
     * Remove expired entries (cleanup)
     */
    cleanup() {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (now > item.expiry) {
                this.cache.delete(key);
            }
        }
    }
}

// Singleton instance
const cache = new CacheManager();

// Cleanup every 5 minutes
setInterval(() => cache.cleanup(), 5 * 60 * 1000);

module.exports = cache;
