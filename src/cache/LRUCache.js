/**
 * LRU (Least Recently Used) Cache Implementation
 * 
 * High-performance cache with configurable size limits and TTL support.
 * @since v2.3.0
 */

/**
 * @typedef {Object} CacheEntry
 * @property {*} value - Cached value
 * @property {number} timestamp - Creation timestamp
 * @property {number} [ttl] - Time-to-live in milliseconds
 * @property {number} hits - Access count
 */

/**
 * LRU Cache with TTL support
 * 
 * @example
 * const cache = new LRUCache({ maxSize: 1000, defaultTTL: 3600000 });
 * cache.set('key', 'value');
 * const value = cache.get('key');
 */
export class LRUCache {
    /**
     * @param {Object} options - Cache options
     * @param {number} [options.maxSize=1000] - Maximum number of entries
     * @param {number} [options.defaultTTL] - Default TTL in milliseconds
     * @param {boolean} [options.updateAgeOnGet=true] - Update timestamp on access
     * @param {Function} [options.onEvict] - Callback when item is evicted
     */
    constructor(options = {}) {
        this.maxSize = options.maxSize || 1000;
        this.defaultTTL = options.defaultTTL || null;
        this.updateAgeOnGet = options.updateAgeOnGet !== false;
        this.onEvict = options.onEvict || null;

        /** @type {Map<string, CacheEntry>} */
        this.cache = new Map();

        // Statistics
        this.stats = {
            hits: 0,
            misses: 0,
            evictions: 0
        };
    }

    /**
     * Get a value from cache
     * @param {string} key - Cache key
     * @returns {*} Cached value or undefined
     */
    get(key) {
        const entry = this.cache.get(key);

        if (!entry) {
            this.stats.misses++;
            return undefined;
        }

        // Check TTL expiration
        if (this._isExpired(entry)) {
            this.delete(key);
            this.stats.misses++;
            return undefined;
        }

        // Update access order (move to end = most recently used)
        this.cache.delete(key);
        
        if (this.updateAgeOnGet) {
            entry.timestamp = Date.now();
        }
        entry.hits++;
        
        this.cache.set(key, entry);
        this.stats.hits++;

        return entry.value;
    }

    /**
     * Set a value in cache
     * @param {string} key - Cache key
     * @param {*} value - Value to cache
     * @param {Object} [options] - Entry options
     * @param {number} [options.ttl] - TTL for this entry (overrides default)
     * @returns {LRUCache} This instance for chaining
     */
    set(key, value, options = {}) {
        // Remove existing entry to update order
        if (this.cache.has(key)) {
            this.cache.delete(key);
        }

        // Evict oldest entries if at capacity
        while (this.cache.size >= this.maxSize) {
            this._evictOldest();
        }

        const entry = {
            value,
            timestamp: Date.now(),
            ttl: options.ttl !== undefined ? options.ttl : this.defaultTTL,
            hits: 0
        };

        this.cache.set(key, entry);
        return this;
    }

    /**
     * Check if key exists and is not expired
     * @param {string} key - Cache key
     * @returns {boolean}
     */
    has(key) {
        const entry = this.cache.get(key);
        if (!entry) return false;
        
        if (this._isExpired(entry)) {
            this.delete(key);
            return false;
        }
        
        return true;
    }

    /**
     * Delete a key from cache
     * @param {string} key - Cache key
     * @returns {boolean} True if key existed
     */
    delete(key) {
        return this.cache.delete(key);
    }

    /**
     * Clear all entries
     */
    clear() {
        this.cache.clear();
        this.stats = { hits: 0, misses: 0, evictions: 0 };
    }

    /**
     * Get cache size
     * @returns {number}
     */
    get size() {
        return this.cache.size;
    }

    /**
     * Get all keys
     * @returns {string[]}
     */
    keys() {
        return Array.from(this.cache.keys());
    }

    /**
     * Get all values
     * @returns {*[]}
     */
    values() {
        return Array.from(this.cache.values()).map(e => e.value);
    }

    /**
     * Get cache statistics
     * @returns {Object}
     */
    getStats() {
        const hitRate = this.stats.hits + this.stats.misses > 0
            ? this.stats.hits / (this.stats.hits + this.stats.misses)
            : 0;

        return {
            ...this.stats,
            size: this.cache.size,
            maxSize: this.maxSize,
            hitRate: Math.round(hitRate * 100) / 100
        };
    }

    /**
     * Remove expired entries
     * @returns {number} Number of entries removed
     */
    prune() {
        let removed = 0;
        const now = Date.now();

        for (const [key, entry] of this.cache) {
            if (this._isExpired(entry, now)) {
                this.cache.delete(key);
                removed++;
            }
        }

        return removed;
    }

    /**
     * Get or set with factory function
     * @param {string} key - Cache key
     * @param {Function} factory - Factory function if key doesn't exist
     * @param {Object} [options] - Cache options
     * @returns {Promise<*>} Cached or new value
     */
    async getOrSet(key, factory, options = {}) {
        const existing = this.get(key);
        if (existing !== undefined) {
            return existing;
        }

        const value = await factory();
        this.set(key, value, options);
        return value;
    }

    /**
     * Check if entry is expired
     * @private
     */
    _isExpired(entry, now = Date.now()) {
        if (!entry.ttl) return false;
        return now - entry.timestamp > entry.ttl;
    }

    /**
     * Evict the oldest (least recently used) entry
     * @private
     */
    _evictOldest() {
        const oldestKey = this.cache.keys().next().value;
        
        if (oldestKey !== undefined) {
            const entry = this.cache.get(oldestKey);
            this.cache.delete(oldestKey);
            this.stats.evictions++;

            if (this.onEvict) {
                this.onEvict(oldestKey, entry.value);
            }
        }
    }

    /**
     * Export cache to JSON
     * @returns {Object}
     */
    toJSON() {
        const entries = [];
        for (const [key, entry] of this.cache) {
            entries.push({ key, ...entry });
        }
        return {
            maxSize: this.maxSize,
            defaultTTL: this.defaultTTL,
            entries
        };
    }

    /**
     * Import cache from JSON
     * @param {Object} data - Exported cache data
     * @returns {LRUCache}
     */
    static fromJSON(data) {
        const cache = new LRUCache({
            maxSize: data.maxSize,
            defaultTTL: data.defaultTTL
        });

        const now = Date.now();
        for (const entry of data.entries) {
            // Skip expired entries
            if (entry.ttl && now - entry.timestamp > entry.ttl) {
                continue;
            }
            cache.cache.set(entry.key, {
                value: entry.value,
                timestamp: entry.timestamp,
                ttl: entry.ttl,
                hits: entry.hits || 0
            });
        }

        return cache;
    }
}

export default LRUCache;
