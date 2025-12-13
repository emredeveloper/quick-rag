/**
 * Chroma Vector Store Adapter
 * 
 * Integration with ChromaDB for persistent vector storage.
 * Requires: npm install chromadb
 * @since v2.3.0
 */

import { AbstractVectorStore } from './abstractStore.js';
import { VectorStoreError } from '../errors/index.js';

/**
 * @typedef {Object} ChromaStoreOptions
 * @property {string} [collectionName='documents'] - Collection name
 * @property {string} [host='localhost'] - Chroma server host
 * @property {number} [port=8000] - Chroma server port
 * @property {string} [path] - Custom path for Chroma API
 * @property {Object} [metadata] - Collection metadata
 * @property {'cosine'|'l2'|'ip'} [distanceFunction='cosine'] - Distance function
 */

/**
 * Chroma Vector Store
 * 
 * @extends AbstractVectorStore
 * 
 * @example
 * import { ChromaVectorStore } from 'quick-rag';
 * 
 * const store = new ChromaVectorStore(embeddingFn, {
 *   collectionName: 'my-docs',
 *   host: 'localhost',
 *   port: 8000
 * });
 * 
 * await store.initialize();
 * await store.addDocuments(documents);
 */
export class ChromaVectorStore extends AbstractVectorStore {
    /**
     * @param {Function} embeddingFn - Embedding function
     * @param {ChromaStoreOptions} [options]
     */
    constructor(embeddingFn, options = {}) {
        super(embeddingFn, options);

        this.collectionName = options.collectionName || 'documents';
        this.host = options.host || 'localhost';
        this.port = options.port || 8000;
        this.path = options.path || '';
        this.distanceFunction = options.distanceFunction || 'cosine';
        this.collectionMetadata = options.metadata || {};

        this.client = null;
        this.collection = null;
        this._initialized = false;
    }

    /**
     * Initialize connection to Chroma
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this._initialized) return;

        try {
            // Dynamic import for optional dependency
            const { ChromaClient } = await import('chromadb');

            this.client = new ChromaClient({
                path: this.path || `http://${this.host}:${this.port}`
            });

            // Get or create collection
            this.collection = await this.client.getOrCreateCollection({
                name: this.collectionName,
                metadata: {
                    ...this.collectionMetadata,
                    'hnsw:space': this.distanceFunction
                }
            });

            this._initialized = true;
        } catch (error) {
            if (error.code === 'MODULE_NOT_FOUND') {
                throw new VectorStoreError(
                    'chromadb package not installed. Run: npm install chromadb'
                );
            }
            throw new VectorStoreError(`Failed to initialize Chroma: ${error.message}`);
        }
    }

    /**
     * Ensure initialized before operations
     * @private
     */
    async _ensureInitialized() {
        if (!this._initialized) {
            await this.initialize();
        }
    }

    /**
     * Add a single document
     * @param {Object} doc - Document with text, id, and optional metadata
     * @returns {Promise<boolean>}
     */
    async addDocument(doc) {
        await this._ensureInitialized();
        this._validateDocument(doc);

        const id = doc.id || this._generateId();
        const embedding = doc.embedding || await this.embeddingFn(doc.text);

        await this.collection.add({
            ids: [id],
            embeddings: [embedding],
            documents: [doc.text],
            metadatas: [doc.meta || {}]
        });

        return true;
    }

    /**
     * Add multiple documents
     * @param {Array} docs - Documents to add
     * @param {Object} [options] - Options
     * @returns {Promise<boolean>}
     */
    async addDocuments(docs, options = {}) {
        await this._ensureInitialized();
        this._validateDocuments(docs);

        const batchSize = options.batchSize || 100;
        const total = docs.length;

        for (let i = 0; i < total; i += batchSize) {
            const batch = docs.slice(i, i + batchSize);
            
            const ids = [];
            const embeddings = [];
            const documents = [];
            const metadatas = [];

            for (const doc of batch) {
                ids.push(doc.id || this._generateId());
                embeddings.push(doc.embedding || await this.embeddingFn(doc.text));
                documents.push(doc.text);
                metadatas.push(doc.meta || {});
            }

            await this.collection.add({
                ids,
                embeddings,
                documents,
                metadatas
            });

            if (options.onProgress) {
                options.onProgress(Math.min(i + batchSize, total), total);
            }
        }

        return true;
    }

    /**
     * Search for similar documents
     * @param {string} query - Query text
     * @param {number} [k=3] - Number of results
     * @param {Object} [options] - Search options
     * @returns {Promise<Array>}
     */
    async similaritySearch(query, k = 3, options = {}) {
        await this._ensureInitialized();

        if (!query || typeof query !== 'string') {
            throw VectorStoreError.invalidQuery('Query must be a non-empty string');
        }

        const queryEmbedding = await this.embeddingFn(query);

        const searchOptions = {
            queryEmbeddings: [queryEmbedding],
            nResults: k,
            include: ['documents', 'metadatas', 'distances']
        };

        // Add where filter if provided
        if (options.filter) {
            searchOptions.where = this._convertFilter(options.filter);
        }

        const results = await this.collection.query(searchOptions);

        // Convert to standard format
        return results.ids[0].map((id, index) => ({
            id,
            text: results.documents[0][index],
            meta: results.metadatas[0][index],
            // Convert distance to similarity score
            score: this._distanceToScore(results.distances[0][index])
        }));
    }

    /**
     * Get document by ID
     * @param {string} id - Document ID
     * @returns {Promise<Object|null>}
     */
    async getDocument(id) {
        await this._ensureInitialized();

        const result = await this.collection.get({
            ids: [id],
            include: ['documents', 'metadatas', 'embeddings']
        });

        if (result.ids.length === 0) {
            return null;
        }

        return {
            id: result.ids[0],
            text: result.documents[0],
            meta: result.metadatas[0],
            embedding: result.embeddings?.[0]
        };
    }

    /**
     * Update a document
     * @param {string} id - Document ID
     * @param {string} newText - New text content
     * @param {Object} [newMeta] - New metadata
     * @returns {Promise<boolean>}
     */
    async updateDocument(id, newText, newMeta) {
        await this._ensureInitialized();

        const existing = await this.getDocument(id);
        if (!existing) return false;

        const embedding = await this.embeddingFn(newText);
        const metadata = newMeta ? { ...existing.meta, ...newMeta } : existing.meta;

        await this.collection.update({
            ids: [id],
            embeddings: [embedding],
            documents: [newText],
            metadatas: [metadata]
        });

        return true;
    }

    /**
     * Delete a document
     * @param {string} id - Document ID
     * @returns {Promise<boolean>}
     */
    async deleteDocument(id) {
        await this._ensureInitialized();

        await this.collection.delete({
            ids: [id]
        });

        return true;
    }

    /**
     * Delete documents matching filter
     * @param {Object} filter - Filter criteria
     * @returns {Promise<number>} Number deleted
     */
    async deleteWhere(filter) {
        await this._ensureInitialized();

        const whereFilter = this._convertFilter(filter);
        
        // Get matching IDs first
        const results = await this.collection.get({
            where: whereFilter,
            include: []
        });

        if (results.ids.length > 0) {
            await this.collection.delete({
                ids: results.ids
            });
        }

        return results.ids.length;
    }

    /**
     * Get collection statistics
     * @returns {Promise<Object>}
     */
    async getStats() {
        await this._ensureInitialized();

        const count = await this.collection.count();

        return {
            documentCount: count,
            collectionName: this.collectionName,
            distanceFunction: this.distanceFunction,
            host: this.host,
            port: this.port
        };
    }

    /**
     * Clear all documents
     * @returns {Promise<void>}
     */
    async clear() {
        await this._ensureInitialized();

        // Delete and recreate collection
        await this.client.deleteCollection({ name: this.collectionName });
        this.collection = await this.client.createCollection({
            name: this.collectionName,
            metadata: {
                ...this.collectionMetadata,
                'hnsw:space': this.distanceFunction
            }
        });
    }

    /**
     * List all collections
     * @returns {Promise<string[]>}
     */
    async listCollections() {
        await this._ensureInitialized();
        
        const collections = await this.client.listCollections();
        return collections.map(c => c.name);
    }

    /**
     * Switch to different collection
     * @param {string} collectionName
     * @returns {Promise<void>}
     */
    async switchCollection(collectionName) {
        await this._ensureInitialized();

        this.collectionName = collectionName;
        this.collection = await this.client.getOrCreateCollection({
            name: collectionName,
            metadata: { 'hnsw:space': this.distanceFunction }
        });
    }

    /**
     * Convert filter to Chroma where clause
     * @private
     */
    _convertFilter(filter) {
        if (typeof filter === 'function') {
            throw new VectorStoreError(
                'Function filters not supported in Chroma. Use object filters.'
            );
        }

        // Simple key-value filter
        const where = {};
        for (const [key, value] of Object.entries(filter)) {
            if (Array.isArray(value)) {
                where[key] = { '$in': value };
            } else {
                where[key] = value;
            }
        }

        return where;
    }

    /**
     * Convert distance to similarity score
     * @private
     */
    _distanceToScore(distance) {
        // For cosine distance, similarity = 1 - distance
        // For L2 distance, use inverse
        if (this.distanceFunction === 'cosine') {
            return 1 - distance;
        }
        return 1 / (1 + distance);
    }

    /**
     * Generate unique ID
     * @private
     */
    _generateId() {
        return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Close connection
     */
    async close() {
        this.client = null;
        this.collection = null;
        this._initialized = false;
    }
}

export default ChromaVectorStore;
