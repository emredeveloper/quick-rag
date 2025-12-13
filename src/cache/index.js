/**
 * Cache Module - Unified exports for caching layer
 * @since v2.3.0
 */

export { LRUCache } from './LRUCache.js';
export { EmbeddingCache } from './EmbeddingCache.js';
export { QueryCache } from './QueryCache.js';
export { CacheManager } from './CacheManager.js';

// Default export
export { CacheManager as default } from './CacheManager.js';
