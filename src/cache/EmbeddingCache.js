/**
 * Embedding Cache - Specialized cache for vector embeddings
 * 
 * Optimized for caching expensive embedding operations with
 * content-based hashing and batch support.
 * @since v2.3.0
 */

import { LRUCache } from './LRUCache.js';
import { createHash } from 'crypto';

/**
 * @typedef {Object} EmbeddingCacheOptions
 * @property {number} [maxSize=5000] - Maximum number of cached embeddings
 * @property {number} [ttl] - TTL in milliseconds (default: no expiry)
 * @property {string} [hashAlgorithm='sha256'] - Hash algorithm for content keys
 * @property {boolean} [normalizeText=true] - Normalize text before hashing
 */

/**
 * Embedding Cache with content-addressable storage
 * 
 * @example
 * const embeddingCache = new EmbeddingCache({ maxSize: 5000 });
 * const cachedEmbed = embeddingCache.wrap(originalEmbeddingFn);
 * 
 * // Now use cachedEmbed instead of originalEmbeddingFn
 * const embedding = await cachedEmbed('Hello world');
 */
export class EmbeddingCache {
    /**
     * @param {EmbeddingCacheOptions} options
     */
    constructor(options = {}) {
        this.cache = new LRUCache({
            maxSize: options.maxSize || 5000,
            defaultTTL: options.ttl || null
        });

        this.hashAlgorithm = options.hashAlgorithm || 'sha256';
        this.normalizeText = options.normalizeText !== false;

        // Metrics
        this.metrics = {
            embeddings: 0,
            cacheHits: 0,
            cacheMisses: 0,
            totalLatencySaved: 0
        };
    }

    /**
     * Generate cache key from text content
     * @param {string} text - Input text
     * @returns {string} Cache key
     */
    generateKey(text) {
        let normalizedText = text;
        
        if (this.normalizeText) {
            // Normalize whitespace and case for better cache hits
            normalizedText = text.trim().toLowerCase().replace(/\s+/g, ' ');
        }

        return createHash(this.hashAlgorithm)
            .update(normalizedText)
            .digest('hex')
            .substring(0, 32); // Use first 32 chars for shorter keys
    }

    /**
     * Get cached embedding
     * @param {string} text - Input text
     * @returns {number[]|undefined} Cached embedding or undefined
     */
    get(text) {
        const key = this.generateKey(text);
        return this.cache.get(key);
    }

    /**
     * Store embedding in cache
     * @param {string} text - Input text
     * @param {number[]} embedding - Embedding vector
     * @param {Object} [options] - Cache options
     */
    set(text, embedding, options = {}) {
        const key = this.generateKey(text);
        this.cache.set(key, embedding, options);
    }

    /**
     * Check if embedding is cached
     * @param {string} text - Input text
     * @returns {boolean}
     */
    has(text) {
        const key = this.generateKey(text);
        return this.cache.has(key);
    }

    /**
     * Wrap an embedding function with caching
     * @param {Function} embeddingFn - Original embedding function
     * @returns {Function} Cached embedding function
     * 
     * @example
     * const cachedEmbed = embeddingCache.wrap(createOllamaEmbedding());
     * const embedding = await cachedEmbed('Hello world');
     */
    wrap(embeddingFn) {
        return async (text) => {
            const startTime = Date.now();
            const cached = this.get(text);

            if (cached) {
                this.metrics.cacheHits++;
                // Estimate latency saved (assume ~100ms per embedding)
                this.metrics.totalLatencySaved += 100;
                return cached;
            }

            this.metrics.cacheMisses++;
            const embedding = await embeddingFn(text);
            const latency = Date.now() - startTime;

            this.set(text, embedding);
            this.metrics.embeddings++;

            return embedding;
        };
    }

    /**
     * Wrap embedding function with batch support
     * @param {Function} embeddingFn - Original embedding function
     * @returns {Function} Cached batch embedding function
     * 
     * @example
     * const batchEmbed = embeddingCache.wrapBatch(embedFn);
     * const embeddings = await batchEmbed(['text1', 'text2', 'text3']);
     */
    wrapBatch(embeddingFn) {
        return async (texts) => {
            const results = new Array(texts.length);
            const uncachedTexts = [];
            const uncachedIndices = [];

            // Check cache for each text
            texts.forEach((text, index) => {
                const cached = this.get(text);
                if (cached) {
                    results[index] = cached;
                    this.metrics.cacheHits++;
                } else {
                    uncachedTexts.push(text);
                    uncachedIndices.push(index);
                    this.metrics.cacheMisses++;
                }
            });

            // Generate embeddings for uncached texts
            if (uncachedTexts.length > 0) {
                const newEmbeddings = await Promise.all(
                    uncachedTexts.map(text => embeddingFn(text))
                );

                // Store in cache and results
                newEmbeddings.forEach((embedding, i) => {
                    const originalIndex = uncachedIndices[i];
                    const text = uncachedTexts[i];
                    
                    this.set(text, embedding);
                    results[originalIndex] = embedding;
                    this.metrics.embeddings++;
                });
            }

            return results;
        };
    }

    /**
     * Precompute and cache embeddings for texts
     * @param {string[]} texts - Texts to precompute
     * @param {Function} embeddingFn - Embedding function
     * @param {Object} [options] - Options
     * @param {Function} [options.onProgress] - Progress callback
     */
    async precompute(texts, embeddingFn, options = {}) {
        const batchSize = options.batchSize || 50;
        const total = texts.length;
        let processed = 0;

        for (let i = 0; i < total; i += batchSize) {
            const batch = texts.slice(i, i + batchSize);
            
            await Promise.all(
                batch.map(async (text) => {
                    if (!this.has(text)) {
                        const embedding = await embeddingFn(text);
                        this.set(text, embedding);
                        this.metrics.embeddings++;
                    }
                })
            );

            processed += batch.length;
            if (options.onProgress) {
                options.onProgress(processed, total);
            }
        }
    }

    /**
     * Get cache statistics
     * @returns {Object}
     */
    getStats() {
        const cacheStats = this.cache.getStats();
        const totalRequests = this.metrics.cacheHits + this.metrics.cacheMisses;
        
        return {
            ...cacheStats,
            embeddings: this.metrics.embeddings,
            cacheHits: this.metrics.cacheHits,
            cacheMisses: this.metrics.cacheMisses,
            hitRate: totalRequests > 0 
                ? Math.round((this.metrics.cacheHits / totalRequests) * 100) / 100 
                : 0,
            estimatedLatencySaved: `${this.metrics.totalLatencySaved}ms`
        };
    }

    /**
     * Clear cache and reset metrics
     */
    clear() {
        this.cache.clear();
        this.metrics = {
            embeddings: 0,
            cacheHits: 0,
            cacheMisses: 0,
            totalLatencySaved: 0
        };
    }

    /**
     * Get cache size
     * @returns {number}
     */
    get size() {
        return this.cache.size;
    }

    /**
     * Export cache to JSON
     * @returns {Object}
     */
    toJSON() {
        return {
            cache: this.cache.toJSON(),
            metrics: this.metrics,
            hashAlgorithm: this.hashAlgorithm,
            normalizeText: this.normalizeText
        };
    }

    /**
     * Import cache from JSON
     * @param {Object} data - Exported cache data
     * @returns {EmbeddingCache}
     */
    static fromJSON(data) {
        const embeddingCache = new EmbeddingCache({
            hashAlgorithm: data.hashAlgorithm,
            normalizeText: data.normalizeText
        });

        embeddingCache.cache = LRUCache.fromJSON(data.cache);
        embeddingCache.metrics = data.metrics;

        return embeddingCache;
    }
}

export default EmbeddingCache;
