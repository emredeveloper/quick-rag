/**
 * Query Cache - Cache for RAG query results
 * 
 * Caches retrieval results to speed up repeated queries.
 * @since v2.3.0
 */

import { LRUCache } from './LRUCache.js';
import { createHash } from 'crypto';

/**
 * @typedef {Object} QueryCacheOptions
 * @property {number} [maxSize=500] - Maximum number of cached queries
 * @property {number} [ttl=1800000] - TTL in ms (default: 30 minutes)
 * @property {boolean} [cacheMetadata=true] - Include metadata in cache key
 */

/**
 * Query Result Cache
 * 
 * @example
 * const queryCache = new QueryCache({ maxSize: 500, ttl: 30 * 60 * 1000 });
 * 
 * // Check cache before retrieval
 * const cached = queryCache.get(query, { k: 5 });
 * if (cached) return cached;
 * 
 * // Store results
 * queryCache.set(query, results, { k: 5 });
 */
export class QueryCache {
    /**
     * @param {QueryCacheOptions} options
     */
    constructor(options = {}) {
        this.cache = new LRUCache({
            maxSize: options.maxSize || 500,
            defaultTTL: options.ttl || 30 * 60 * 1000 // 30 minutes
        });

        this.cacheMetadata = options.cacheMetadata !== false;

        // Metrics
        this.metrics = {
            queries: 0,
            hits: 0,
            misses: 0
        };
    }

    /**
     * Generate cache key from query and options
     * @param {string} query - Query string
     * @param {Object} [options] - Query options (k, filters, etc.)
     * @returns {string} Cache key
     */
    generateKey(query, options = {}) {
        const keyData = {
            q: query.trim().toLowerCase(),
            k: options.k || 3
        };

        // Include filters in key if cacheMetadata is enabled
        if (this.cacheMetadata && options.filter) {
            keyData.f = JSON.stringify(options.filter);
        }

        const keyString = JSON.stringify(keyData);
        return createHash('sha256')
            .update(keyString)
            .digest('hex')
            .substring(0, 24);
    }

    /**
     * Get cached query results
     * @param {string} query - Query string
     * @param {Object} [options] - Query options
     * @returns {Array|undefined} Cached results or undefined
     */
    get(query, options = {}) {
        this.metrics.queries++;
        const key = this.generateKey(query, options);
        const cached = this.cache.get(key);

        if (cached) {
            this.metrics.hits++;
            return cached;
        }

        this.metrics.misses++;
        return undefined;
    }

    /**
     * Store query results in cache
     * @param {string} query - Query string
     * @param {Array} results - Query results
     * @param {Object} [options] - Query options
     */
    set(query, results, options = {}) {
        const key = this.generateKey(query, options);
        this.cache.set(key, results);
    }

    /**
     * Check if query is cached
     * @param {string} query - Query string
     * @param {Object} [options] - Query options
     * @returns {boolean}
     */
    has(query, options = {}) {
        const key = this.generateKey(query, options);
        return this.cache.has(key);
    }

    /**
     * Invalidate cache entries matching a pattern
     * @param {Function} predicate - Function to test each query
     */
    invalidate(predicate) {
        // Since we hash keys, we can't easily filter
        // For now, just clear all
        this.cache.clear();
    }

    /**
     * Wrap a retriever function with caching
     * @param {Function} retrieverFn - Original retriever function
     * @returns {Function} Cached retriever function
     * 
     * @example
     * const cachedSearch = queryCache.wrap(retriever.search.bind(retriever));
     * const results = await cachedSearch(query, { k: 5 });
     */
    wrap(retrieverFn) {
        return async (query, options = {}) => {
            // Check cache first
            const cached = this.get(query, options);
            if (cached) {
                return cached;
            }

            // Execute query
            const results = await retrieverFn(query, options);

            // Cache results
            this.set(query, results, options);

            return results;
        };
    }

    /**
     * Get cache statistics
     * @returns {Object}
     */
    getStats() {
        const cacheStats = this.cache.getStats();
        
        return {
            ...cacheStats,
            queries: this.metrics.queries,
            hits: this.metrics.hits,
            misses: this.metrics.misses,
            hitRate: this.metrics.queries > 0
                ? Math.round((this.metrics.hits / this.metrics.queries) * 100) / 100
                : 0
        };
    }

    /**
     * Clear cache and reset metrics
     */
    clear() {
        this.cache.clear();
        this.metrics = { queries: 0, hits: 0, misses: 0 };
    }

    /**
     * Get cache size
     * @returns {number}
     */
    get size() {
        return this.cache.size;
    }
}

export default QueryCache;
