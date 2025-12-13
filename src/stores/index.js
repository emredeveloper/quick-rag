/**
 * Vector Stores - Unified Export
 * @since v2.3.0 - Added Chroma and Qdrant adapters
 */

export { AbstractVectorStore, createVectorStore } from './abstractStore.js';
export { SQLiteVectorStore } from './sqliteStore.js';

// Re-export InMemoryVectorStore from parent
export { InMemoryVectorStore } from '../vectorStore.js';

// External Vector Database Adapters (v2.3.0+)
export { ChromaVectorStore } from './chromaStore.js';
export { QdrantVectorStore } from './qdrantStore.js';
