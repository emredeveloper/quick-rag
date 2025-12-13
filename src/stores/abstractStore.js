/**
 * Abstract Vector Store Base Class
 * 
 * Provides common interface and validation for all vector store implementations
 */

import { VectorStoreError } from '../errors/index.js';

/**
 * Abstract base class for vector stores
 * 
 * All concrete implementations should extend this class and implement
 * the abstract methods.
 */
export class AbstractVectorStore {
    constructor(embeddingFn, options = {}) {
        if (!embeddingFn) {
            throw new VectorStoreError('Embedding function is required');
        }

        this.embeddingFn = embeddingFn;
        this.options = options;
    }

    /**
     * Validate document structure
     * @protected
     */
    _validateDocument(doc) {
        if (!doc.text || typeof doc.text !== 'string') {
            throw VectorStoreError.invalidDocument('Document must have text field');
        }
        return true;
    }

    /**
     * Validate documents array
     * @protected
     */
    _validateDocuments(docs) {
        if (!Array.isArray(docs)) {
            throw VectorStoreError.invalidDocument('docs must be an array');
        }
        if (docs.length === 0) return true;
        docs.forEach(doc => this._validateDocument(doc));
        return true;
    }

    /**
     * Add a single document to the store
     * @abstract
     */
    async addDocument(doc, options = {}) {
        throw new Error('addDocument must be implemented by subclass');
    }

    /**
     * Add multiple documents to the store
     * @abstract
     */
    async addDocuments(docs, options = {}) {
        throw new Error('addDocuments must be implemented by subclass');
    }

    /**
     * Search for similar documents
     * @abstract
     */
    async similaritySearch(query, k = 3, options = {}) {
        throw new Error('similaritySearch must be implemented by subclass');
    }

    /**
     * Get document by ID
     * @abstract
     */
    getDocument(id) {
        throw new Error('getDocument must be implemented by subclass');
    }

    /**
     * Update a document
     * @abstract
     */
    async updateDocument(id, newText, newMeta) {
        throw new Error('updateDocument must be implemented by subclass');
    }

    /**
     * Delete a document
     * @abstract
     */
    deleteDocument(id) {
        throw new Error('deleteDocument must be implemented by subclass');
    }

    /**
     * Get statistics about the store
     * @abstract
     */
    getStats() {
        throw new Error('getStats must be implemented by subclass');
    }

    /**
     * Clear all documents
     * @abstract
     */
    clear() {
        throw new Error('clear must be implemented by subclass');
    }
}

/**
 * Factory function to create vector stores
 * 
 * @param {string} type - Store type: 'memory', 'sqlite', 'chroma', 'qdrant'
 * @param {Function} embeddingFn - Embedding function
 * @param {Object} options - Store-specific options
 * @returns {Promise<AbstractVectorStore>} Vector store instance
 * 
 * @example
 * // In-memory store
 * const memoryStore = await createVectorStore('memory', embedFn);
 * 
 * // SQLite store
 * const sqliteStore = await createVectorStore('sqlite', embedFn, { dbPath: './data.db' });
 * 
 * // Chroma store (requires: npm install chromadb)
 * const chromaStore = await createVectorStore('chroma', embedFn, {
 *   collectionName: 'my-docs',
 *   host: 'localhost',
 *   port: 8000
 * });
 * 
 * // Qdrant store (requires: npm install @qdrant/js-client-rest)
 * const qdrantStore = await createVectorStore('qdrant', embedFn, {
 *   collectionName: 'my-docs',
 *   host: 'localhost',
 *   port: 6333
 * });
 */
export async function createVectorStore(type, embeddingFn, options = {}) {
    switch (type.toLowerCase()) {
        case 'memory':
        case 'inmemory': {
            const { InMemoryVectorStore } = await import('../vectorStore.js');
            return new InMemoryVectorStore(embeddingFn, options);
        }

        case 'sqlite': {
            const { SQLiteVectorStore } = await import('./sqliteStore.js');
            if (!options.dbPath) {
                throw new VectorStoreError('SQLite requires dbPath option');
            }
            return new SQLiteVectorStore(options.dbPath, embeddingFn, options);
        }

        case 'chroma': {
            const { ChromaVectorStore } = await import('./chromaStore.js');
            const store = new ChromaVectorStore(embeddingFn, options);
            await store.initialize();
            return store;
        }

        case 'qdrant': {
            const { QdrantVectorStore } = await import('./qdrantStore.js');
            const store = new QdrantVectorStore(embeddingFn, options);
            await store.initialize();
            return store;
        }

        default:
            throw new VectorStoreError(`Unknown vector store type: ${type}. Supported: memory, sqlite, chroma, qdrant`);
    }
}
