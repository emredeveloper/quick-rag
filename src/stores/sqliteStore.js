/**
 * SQLite Vector Store - Embedded Persistence
 * 
 * No server required! Data stored in a single .db file
 * Perfect for local applications and development
 */

import Database from 'better-sqlite3';
import { VectorStoreError, EmbeddingError } from '../errors/index.js';

// Helper functions for vector operations
function dot(a, b) {
    return a.reduce((s, v, i) => s + v * b[i], 0);
}

function norm(a) {
    return Math.sqrt(dot(a, a));
}

function cosine(a, b) {
    const n = norm(a) * norm(b);
    return n === 0 ? 0 : dot(a, b) / n;
}

/**
 * SQLite Vector Store
 * 
 * Embedded, serverless vector database using SQLite
 * 
 * @example
 * ```javascript
 * import { SQLiteVectorStore, createOllamaRAGEmbedding } from 'quick-rag';
 * 
 * const embed = createOllamaRAGEmbedding(ollamaClient, 'embeddinggemma');
 * const store = new SQLiteVectorStore('./my-vectors.db', embed);
 * 
 * await store.addDocuments([
 *   { text: 'JavaScript is a programming language.' }
 * ]);
 * 
 * const results = await store.similaritySearch('What is JavaScript?', 3);
 * ```
 */
export class SQLiteVectorStore {
    /**
     * @param {string} dbPath - Path to SQLite database file
     * @param {Function} embeddingFn - Embedding function: async (text, dim?) => number[]
     * @param {Object} options - Configuration options
     * @param {number} options.defaultDim - Default embedding dimension (default: 768)
     */
    constructor(dbPath, embeddingFn, options = {}) {
        if (!dbPath) {
            throw VectorStoreError.invalidDocument('Database path is required');
        }
        if (!embeddingFn) {
            throw new EmbeddingError('Embedding function is required');
        }

        this.dbPath = dbPath;
        this.embeddingFn = embeddingFn;
        this.defaultDim = options.defaultDim || 768;

        // Initialize database
        this.db = new Database(dbPath);
        this._initializeDatabase();
    }

    /**
     * Initialize database schema
     * @private
     */
    _initializeDatabase() {
        // Create documents table
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        text TEXT NOT NULL,
        metadata TEXT,
        vector BLOB NOT NULL,
        dim INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Create index on id for faster lookups
        this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_documents_id ON documents(id)
    `);
    }

    /**
     * Serialize vector to blob
     * @private
     */
    _serializeVector(vector) {
        const buffer = Buffer.allocUnsafe(vector.length * 8);
        for (let i = 0; i < vector.length; i++) {
            buffer.writeDoubleLE(vector[i], i * 8);
        }
        return buffer;
    }

    /**
     * Deserialize blob to vector
     * @private
     */
    _deserializeVector(blob) {
        const vector = new Array(blob.length / 8);
        for (let i = 0; i < vector.length; i++) {
            vector[i] = blob.readDoubleLE(i * 8);
        }
        return vector;
    }

    /**
     * Add multiple documents
     * 
     * @param {Array} docs - Documents to add
     * @param {Object} opts - Options
     * @param {number} [opts.dim] - Embedding dimension
     * @param {number} [opts.batchSize=20] - Batch size
     * @param {number} [opts.maxConcurrent=5] - Max concurrent requests
     * @param {Function} [opts.onProgress] - Progress callback
     */
    async addDocuments(docs, opts = {}) {
        if (!Array.isArray(docs) || docs.length === 0) {
            throw VectorStoreError.invalidDocument('docs must be a non-empty array');
        }

        const dim = opts.dim || this.defaultDim;
        const batchSize = opts.batchSize || 20;
        const maxConcurrent = opts.maxConcurrent || 5;
        const onProgress = opts.onProgress;

        const totalDocs = docs.length;
        let processed = 0;

        // Prepare insert statement
        const insert = this.db.prepare(`
      INSERT OR REPLACE INTO documents (id, text, metadata, vector, dim, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

        // Process in batches
        for (let i = 0; i < docs.length; i += batchSize) {
            const batch = docs.slice(i, i + batchSize);
            const batchTexts = batch.map(d => d.text);

            // Get embeddings
            let embeddings;
            try {
                const result = await this.embeddingFn(batchTexts, dim);
                if (Array.isArray(result) && Array.isArray(result[0])) {
                    embeddings = result;
                } else {
                    // Fall back to individual requests
                    embeddings = await this._embedWithRateLimit(batchTexts, dim, maxConcurrent);
                }
            } catch (error) {
                throw EmbeddingError.networkError(error);
            }

            // Insert using transaction for performance
            const insertMany = this.db.transaction((docs, embeddings) => {
                for (let j = 0; j < docs.length; j++) {
                    const doc = docs[j];
                    const id = doc.id || `doc_${Date.now()}_${Math.random()}`;
                    const metadata = JSON.stringify(doc.meta || {});
                    const vectorBlob = this._serializeVector(embeddings[j]);

                    insert.run(id, doc.text, metadata, vectorBlob, dim);
                }
            });

            insertMany(batch, embeddings);

            processed += batch.length;
            if (onProgress) {
                onProgress(processed, totalDocs);
            }

            // Small delay between batches
            if (i + batchSize < docs.length) {
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        }
    }

    /**
     * Embed texts with rate limiting
     * @private
     */
    async _embedWithRateLimit(texts, dim, maxConcurrent) {
        const semaphore = { count: 0 };
        const results = [];

        for (let i = 0; i < texts.length; i++) {
            while (semaphore.count >= maxConcurrent) {
                await new Promise(resolve => setTimeout(resolve, 50));
            }

            semaphore.count++;
            const promise = (async () => {
                try {
                    return await this.embeddingFn(texts[i], dim);
                } finally {
                    semaphore.count--;
                }
            })();

            results.push(promise);
        }

        return await Promise.all(results);
    }

    /**
     * Add a single document
     */
    async addDocument(doc, opts = {}) {
        return this.addDocuments([doc], opts);
    }

    /**
     * Search for similar documents
     * 
     * @param {string} query - Query text
     * @param {number} k - Number of results
     * @param {Object} options - Search options
     * @param {Object} [options.where] - Metadata filters
     * @param {number} [options.queryDim] - Query embedding dimension
     * @returns {Promise<Array>} Results with scores
     */
    async similaritySearch(query, k = 3, options = {}) {
        if (!query || typeof query !== 'string') {
            throw VectorStoreError.invalidDocument('query must be a non-empty string');
        }

        const dim = options.queryDim || this.defaultDim;

        // Get query embedding
        let queryVector;
        try {
            queryVector = await this.embeddingFn(query, dim);
        } catch (error) {
            throw EmbeddingError.networkError(error);
        }

        // Get all documents (with optional metadata filtering)
        let sql = 'SELECT id, text, metadata, vector FROM documents WHERE dim = ?';
        const params = [dim];

        // Apply metadata filters if provided
        const filter = options.where || options.filter || options.filters;
        if (filter) {
            for (const [key, value] of Object.entries(filter)) {
                sql += ` AND json_extract(metadata, '$.${key}') = ?`;
                params.push(value);
            }
        }

        const stmt = this.db.prepare(sql);
        const rows = stmt.all(...params);

        if (rows.length === 0) {
            if (options.where) {
                throw VectorStoreError.invalidDocument('No documents match filters');
            }
            throw VectorStoreError.invalidDocument('No documents in store');
        }

        // Calculate similarities
        const scored = rows.map(row => {
            const vector = this._deserializeVector(row.vector);
            const score = cosine(queryVector, vector);
            return {
                id: row.id,
                text: row.text,
                meta: JSON.parse(row.metadata),
                score
            };
        });

        // Sort by score and return top k
        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, k);
    }

    /**
     * Get document by ID
     */
    getDocument(id) {
        const stmt = this.db.prepare('SELECT id, text, metadata FROM documents WHERE id = ?');
        const row = stmt.get(id);

        if (!row) {
            return null;
        }

        return {
            id: row.id,
            text: row.text,
            meta: JSON.parse(row.metadata)
        };
    }

    /**
     * Get all documents
     */
    getAllDocuments(options = {}) {
        let sql = 'SELECT id, text, metadata FROM documents';
        const params = [];

        if (options.limit) {
            sql += ' LIMIT ?';
            params.push(options.limit);
        }

        if (options.offset) {
            sql += ' OFFSET ?';
            params.push(options.offset);
        }

        const stmt = this.db.prepare(sql);
        const rows = stmt.all(...params);

        return rows.map(row => ({
            id: row.id,
            text: row.text,
            meta: JSON.parse(row.metadata)
        }));
    }

    /**
     * Update a document
     */
    async updateDocument(id, newText, newMeta) {
        const existing = this.getDocument(id);
        if (!existing) {
            return false;
        }

        // Get new embedding
        let embedding;
        try {
            embedding = await this.embeddingFn(newText, this.defaultDim);
        } catch (error) {
            throw EmbeddingError.networkError(error);
        }

        const metadata = JSON.stringify(newMeta !== undefined ? newMeta : existing.meta);
        const vectorBlob = this._serializeVector(embedding);

        const stmt = this.db.prepare(`
      UPDATE documents 
      SET text = ?, metadata = ?, vector = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

        stmt.run(newText, metadata, vectorBlob, id);
        return true;
    }

    /**
     * Delete a document
     */
    deleteDocument(id) {
        const stmt = this.db.prepare('DELETE FROM documents WHERE id = ?');
        const result = stmt.run(id);
        return result.changes > 0;
    }

    /**
     * Clear all documents
     */
    clear() {
        this.db.exec('DELETE FROM documents');
    }

    /**
     * Get statistics
     */
    getStats() {
        const countStmt = this.db.prepare('SELECT COUNT(*) as count FROM documents');
        const { count } = countStmt.get();

        return {
            dbPath: this.dbPath,
            documentCount: count
        };
    }

    /**
     * Close database connection
     */
    close() {
        this.db.close();
    }

    /**
     * Vacuum database (optimize storage)
     */
    vacuum() {
        this.db.exec('VACUUM');
    }
}
