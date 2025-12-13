/**
 * Cache Manager - Unified cache management for RAG operations
 * 
 * Provides a single interface to manage embedding, query, and response caches.
 * @since v2.3.0
 */

import { LRUCache } from './LRUCache.js';
import { EmbeddingCache } from './EmbeddingCache.js';
import { QueryCache } from './QueryCache.js';

/**
 * @typedef {Object} CacheManagerOptions
 * @property {Object} [embeddings] - Embedding cache options
 * @property {number} [embeddings.maxSize=5000] - Max cached embeddings
 * @property {number} [embeddings.ttl] - Embedding TTL
 * @property {Object} [queries] - Query cache options
 * @property {number} [queries.maxSize=500] - Max cached queries
 * @property {number} [queries.ttl=1800000] - Query TTL (30 min default)
 * @property {Object} [responses] - Response cache options
 * @property {number} [responses.maxSize=200] - Max cached responses
 * @property {number} [responses.ttl=3600000] - Response TTL (1 hour default)
 * @property {boolean} [enabled=true] - Enable/disable caching globally
 */

/**
 * Unified Cache Manager
 * 
 * @example
 * import { CacheManager } from 'quick-rag';
 * 
 * const cache = new CacheManager({
 *   embeddings: { maxSize: 5000, ttl: 3600000 },
 *   queries: { maxSize: 500, ttl: 1800000 },
 *   responses: { maxSize: 200, ttl: 3600000 }
 * });
 * 
 * // Use with RAG
 * const rag = await createRAG({ cache, ... });
 */
export class CacheManager {
    /**
     * @param {CacheManagerOptions} options
     */
    constructor(options = {}) {
        this.enabled = options.enabled !== false;

        // Initialize caches
        this.embeddings = new EmbeddingCache({
            maxSize: options.embeddings?.maxSize || 5000,
            ttl: options.embeddings?.ttl || null
        });

        this.queries = new QueryCache({
            maxSize: options.queries?.maxSize || 500,
            ttl: options.queries?.ttl || 30 * 60 * 1000
        });

        this.responses = new LRUCache({
            maxSize: options.responses?.maxSize || 200,
            defaultTTL: options.responses?.ttl || 60 * 60 * 1000
        });

        // General purpose cache
        this.general = new LRUCache({
            maxSize: options.general?.maxSize || 1000,
            defaultTTL: options.general?.ttl || null
        });
    }

    /**
     * Wrap an embedding function with caching
     * @param {Function} embeddingFn - Original embedding function
     * @returns {Function} Cached embedding function
     */
    wrapEmbedding(embeddingFn) {
        if (!this.enabled) return embeddingFn;
        return this.embeddings.wrap(embeddingFn);
    }

    /**
     * Wrap a retriever function with caching
     * @param {Function} retrieverFn - Original retriever function
     * @returns {Function} Cached retriever function
     */
    wrapRetriever(retrieverFn) {
        if (!this.enabled) return retrieverFn;
        return this.queries.wrap(retrieverFn);
    }

    /**
     * Get cached response
     * @param {string} key - Response key
     * @returns {*} Cached response or undefined
     */
    getResponse(key) {
        if (!this.enabled) return undefined;
        return this.responses.get(key);
    }

    /**
     * Set cached response
     * @param {string} key - Response key
     * @param {*} value - Response value
     * @param {Object} [options] - Cache options
     */
    setResponse(key, value, options = {}) {
        if (!this.enabled) return;
        this.responses.set(key, value, options);
    }

    /**
     * Get general cache entry
     * @param {string} key - Cache key
     * @returns {*} Cached value or undefined
     */
    get(key) {
        if (!this.enabled) return undefined;
        return this.general.get(key);
    }

    /**
     * Set general cache entry
     * @param {string} key - Cache key
     * @param {*} value - Value to cache
     * @param {Object} [options] - Cache options
     */
    set(key, value, options = {}) {
        if (!this.enabled) return;
        this.general.set(key, value, options);
    }

    /**
     * Get comprehensive statistics
     * @returns {Object}
     */
    getStats() {
        return {
            enabled: this.enabled,
            embeddings: this.embeddings.getStats(),
            queries: this.queries.getStats(),
            responses: this.responses.getStats(),
            general: this.general.getStats()
        };
    }

    /**
     * Clear all caches
     */
    clearAll() {
        this.embeddings.clear();
        this.queries.clear();
        this.responses.clear();
        this.general.clear();
    }

    /**
     * Clear specific cache type
     * @param {'embeddings'|'queries'|'responses'|'general'} type
     */
    clear(type) {
        switch (type) {
            case 'embeddings':
                this.embeddings.clear();
                break;
            case 'queries':
                this.queries.clear();
                break;
            case 'responses':
                this.responses.clear();
                break;
            case 'general':
                this.general.clear();
                break;
            default:
                throw new Error(`Unknown cache type: ${type}`);
        }
    }

    /**
     * Enable caching
     */
    enable() {
        this.enabled = true;
    }

    /**
     * Disable caching
     */
    disable() {
        this.enabled = false;
    }

    /**
     * Prune expired entries from all caches
     * @returns {Object} Number of entries removed per cache
     */
    prune() {
        return {
            embeddings: this.embeddings.cache.prune(),
            queries: this.queries.cache.prune(),
            responses: this.responses.prune(),
            general: this.general.prune()
        };
    }

    /**
     * Export all caches to JSON
     * @returns {Object}
     */
    toJSON() {
        return {
            enabled: this.enabled,
            embeddings: this.embeddings.toJSON(),
            queries: this.queries.cache.toJSON(),
            responses: this.responses.toJSON(),
            general: this.general.toJSON()
        };
    }

    /**
     * Create CacheManager from JSON export
     * @param {Object} data - Exported cache data
     * @returns {CacheManager}
     */
    static fromJSON(data) {
        const manager = new CacheManager({ enabled: data.enabled });

        if (data.embeddings) {
            manager.embeddings = EmbeddingCache.fromJSON(data.embeddings);
        }
        if (data.queries) {
            manager.queries.cache = LRUCache.fromJSON(data.queries);
        }
        if (data.responses) {
            manager.responses = LRUCache.fromJSON(data.responses);
        }
        if (data.general) {
            manager.general = LRUCache.fromJSON(data.general);
        }

        return manager;
    }
}

export default CacheManager;
