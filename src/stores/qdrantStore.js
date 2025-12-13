/**
 * Qdrant Vector Store Adapter
 * 
 * Integration with Qdrant for high-performance vector storage.
 * Requires: npm install @qdrant/js-client-rest
 * @since v2.3.0
 */

import { AbstractVectorStore } from './abstractStore.js';
import { VectorStoreError } from '../errors/index.js';

/**
 * @typedef {Object} QdrantStoreOptions
 * @property {string} [collectionName='documents'] - Collection name
 * @property {string} [host='localhost'] - Qdrant server host
 * @property {number} [port=6333] - Qdrant server port
 * @property {string} [apiKey] - API key for Qdrant Cloud
 * @property {boolean} [https=false] - Use HTTPS
 * @property {number} [vectorSize] - Vector dimension (auto-detected if not set)
 * @property {'Cosine'|'Euclid'|'Dot'} [distance='Cosine'] - Distance metric
 */

/**
 * Qdrant Vector Store
 * 
 * @extends AbstractVectorStore
 * 
 * @example
 * import { QdrantVectorStore } from 'quick-rag';
 * 
 * const store = new QdrantVectorStore(embeddingFn, {
 *   collectionName: 'my-docs',
 *   host: 'localhost',
 *   port: 6333
 * });
 * 
 * await store.initialize();
 * await store.addDocuments(documents);
 */
export class QdrantVectorStore extends AbstractVectorStore {
    /**
     * @param {Function} embeddingFn - Embedding function
     * @param {QdrantStoreOptions} [options]
     */
    constructor(embeddingFn, options = {}) {
        super(embeddingFn, options);

        this.collectionName = options.collectionName || 'documents';
        this.host = options.host || 'localhost';
        this.port = options.port || 6333;
        this.apiKey = options.apiKey || null;
        this.https = options.https || false;
        this.vectorSize = options.vectorSize || null;
        this.distance = options.distance || 'Cosine';

        this.client = null;
        this._initialized = false;
    }

    /**
     * Initialize connection to Qdrant
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this._initialized) return;

        try {
            // Dynamic import for optional dependency
            const { QdrantClient } = await import('@qdrant/js-client-rest');

            const config = {
                host: this.host,
                port: this.port
            };

            if (this.apiKey) {
                config.apiKey = this.apiKey;
            }

            if (this.https) {
                config.https = true;
            }

            this.client = new QdrantClient(config);

            // Check if collection exists, create if not
            await this._ensureCollection();

            this._initialized = true;
        } catch (error) {
            if (error.code === 'MODULE_NOT_FOUND') {
                throw new VectorStoreError(
                    '@qdrant/js-client-rest not installed. Run: npm install @qdrant/js-client-rest'
                );
            }
            throw new VectorStoreError(`Failed to initialize Qdrant: ${error.message}`);
        }
    }

    /**
     * Ensure collection exists
     * @private
     */
    async _ensureCollection() {
        const collections = await this.client.getCollections();
        const exists = collections.collections.some(c => c.name === this.collectionName);

        if (!exists) {
            // Detect vector size if not provided
            if (!this.vectorSize) {
                const sampleEmbedding = await this.embeddingFn('sample text');
                this.vectorSize = sampleEmbedding.length;
            }

            await this.client.createCollection(this.collectionName, {
                vectors: {
                    size: this.vectorSize,
                    distance: this.distance
                }
            });
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

        const id = this._toPointId(doc.id);
        const embedding = doc.embedding || await this.embeddingFn(doc.text);

        await this.client.upsert(this.collectionName, {
            points: [{
                id,
                vector: embedding,
                payload: {
                    text: doc.text,
                    originalId: doc.id,
                    ...doc.meta
                }
            }]
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
            
            const points = await Promise.all(batch.map(async (doc, idx) => {
                const embedding = doc.embedding || await this.embeddingFn(doc.text);
                const id = this._toPointId(doc.id || `${i + idx}`);
                
                return {
                    id,
                    vector: embedding,
                    payload: {
                        text: doc.text,
                        originalId: doc.id,
                        ...doc.meta
                    }
                };
            }));

            await this.client.upsert(this.collectionName, { points });

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

        const searchParams = {
            vector: queryEmbedding,
            limit: k,
            with_payload: true
        };

        // Add filter if provided
        if (options.filter) {
            searchParams.filter = this._convertFilter(options.filter);
        }

        // Add score threshold if provided
        if (options.scoreThreshold) {
            searchParams.score_threshold = options.scoreThreshold;
        }

        const results = await this.client.search(this.collectionName, searchParams);

        return results.map(result => ({
            id: result.payload.originalId || result.id.toString(),
            text: result.payload.text,
            meta: this._extractMeta(result.payload),
            score: result.score
        }));
    }

    /**
     * Get document by ID
     * @param {string} id - Document ID
     * @returns {Promise<Object|null>}
     */
    async getDocument(id) {
        await this._ensureInitialized();

        const pointId = this._toPointId(id);

        try {
            const results = await this.client.retrieve(this.collectionName, {
                ids: [pointId],
                with_payload: true,
                with_vector: true
            });

            if (results.length === 0) {
                return null;
            }

            const point = results[0];
            return {
                id: point.payload.originalId || point.id.toString(),
                text: point.payload.text,
                meta: this._extractMeta(point.payload),
                embedding: point.vector
            };
        } catch (error) {
            return null;
        }
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
        const pointId = this._toPointId(id);

        await this.client.upsert(this.collectionName, {
            points: [{
                id: pointId,
                vector: embedding,
                payload: {
                    text: newText,
                    originalId: id,
                    ...(newMeta ? { ...existing.meta, ...newMeta } : existing.meta)
                }
            }]
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

        const pointId = this._toPointId(id);

        await this.client.delete(this.collectionName, {
            points: [pointId]
        });

        return true;
    }

    /**
     * Delete documents matching filter
     * @param {Object} filter - Filter criteria
     * @returns {Promise<void>}
     */
    async deleteWhere(filter) {
        await this._ensureInitialized();

        await this.client.delete(this.collectionName, {
            filter: this._convertFilter(filter)
        });
    }

    /**
     * Get collection statistics
     * @returns {Promise<Object>}
     */
    async getStats() {
        await this._ensureInitialized();

        const info = await this.client.getCollection(this.collectionName);

        return {
            documentCount: info.points_count,
            vectorCount: info.vectors_count,
            collectionName: this.collectionName,
            vectorSize: info.config.params.vectors.size,
            distance: info.config.params.vectors.distance,
            status: info.status
        };
    }

    /**
     * Clear all documents
     * @returns {Promise<void>}
     */
    async clear() {
        await this._ensureInitialized();

        // Delete and recreate collection
        await this.client.deleteCollection(this.collectionName);
        await this._ensureCollection();
    }

    /**
     * List all collections
     * @returns {Promise<string[]>}
     */
    async listCollections() {
        await this._ensureInitialized();
        
        const collections = await this.client.getCollections();
        return collections.collections.map(c => c.name);
    }

    /**
     * Convert filter to Qdrant format
     * @private
     */
    _convertFilter(filter) {
        if (typeof filter === 'function') {
            throw new VectorStoreError(
                'Function filters not supported in Qdrant. Use object filters.'
            );
        }

        const must = [];

        for (const [key, value] of Object.entries(filter)) {
            if (Array.isArray(value)) {
                must.push({
                    key,
                    match: { any: value }
                });
            } else if (typeof value === 'object' && value !== null) {
                // Handle range filters
                if (value.$gt !== undefined) {
                    must.push({ key, range: { gt: value.$gt } });
                }
                if (value.$gte !== undefined) {
                    must.push({ key, range: { gte: value.$gte } });
                }
                if (value.$lt !== undefined) {
                    must.push({ key, range: { lt: value.$lt } });
                }
                if (value.$lte !== undefined) {
                    must.push({ key, range: { lte: value.$lte } });
                }
            } else {
                must.push({
                    key,
                    match: { value }
                });
            }
        }

        return { must };
    }

    /**
     * Convert string ID to Qdrant point ID
     * @private
     */
    _toPointId(id) {
        if (typeof id === 'number') return id;
        
        // Generate numeric hash from string
        let hash = 0;
        for (let i = 0; i < id.length; i++) {
            const char = id.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }

    /**
     * Extract metadata from payload (exclude internal fields)
     * @private
     */
    _extractMeta(payload) {
        const { text, originalId, ...meta } = payload;
        return meta;
    }

    /**
     * Close connection
     */
    async close() {
        this.client = null;
        this._initialized = false;
    }
}

export default QdrantVectorStore;
