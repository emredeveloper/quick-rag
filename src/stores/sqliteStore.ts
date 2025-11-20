/**
 * SQLite Vector Store - Embedded Persistence
 * 
 * No server required! Data stored in a single .db file
 * Perfect for local applications and development
 */

import Database from 'better-sqlite3';
import { VectorStoreError, EmbeddingError } from '../errors/index.js';
import { AbstractVectorStore, Document, EmbeddingFunction } from './abstractStore.js';

// Helper functions for vector operations
function dot(a: number[], b: number[]): number {
    return a.reduce((s, v, i) => s + v * b[i], 0);
}

function norm(a: number[]): number {
    return Math.sqrt(dot(a, a));
}

function cosine(a: number[], b: number[]): number {
    const n = norm(a) * norm(b);
    return n === 0 ? 0 : dot(a, b) / n;
}

export interface SQLiteStoreOptions {
    defaultDim?: number;
    [key: string]: any;
}

/**
 * SQLite Vector Store
 * 
 * Embedded, serverless vector database using SQLite
 */
export class SQLiteVectorStore { // Should extend AbstractVectorStore but the original code didn't seem to extend it in the file view I saw earlier? 
    // Wait, looking back at step 427, SQLiteVectorStore class definition:
    // export class SQLiteVectorStore { ... } 
    // It did NOT extend AbstractVectorStore in the JS version I read. 
    // But it SHOULD extend it for consistency.
    // However, if I change it to extend, I must ensure it implements all methods.
    // The JS version implemented: addDocuments, addDocument, similaritySearch, getDocument, getAllDocuments, updateDocument, deleteDocument, clear, getStats.
    // This matches AbstractVectorStore.
    // So I will make it extend AbstractVectorStore.

    private dbPath: string;
    private embeddingFn: EmbeddingFunction;
    private defaultDim: number;
    private db: any; // Database.Database

    /**
     * @param dbPath - Path to SQLite database file
     * @param embeddingFn - Embedding function
     * @param options - Configuration options
     */
    constructor(dbPath: string, embeddingFn: EmbeddingFunction, options: SQLiteStoreOptions = {}) {
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
     */
    private _initializeDatabase(): void {
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
     */
    private _serializeVector(vector: number[]): Buffer {
        const buffer = Buffer.allocUnsafe(vector.length * 8);
        for (let i = 0; i < vector.length; i++) {
            buffer.writeDoubleLE(vector[i], i * 8);
        }
        return buffer;
    }

    /**
     * Deserialize blob to vector
     */
    private _deserializeVector(blob: Buffer): number[] {
        const vector = new Array(blob.length / 8);
        for (let i = 0; i < vector.length; i++) {
            vector[i] = blob.readDoubleLE(i * 8);
        }
        return vector;
    }

    /**
     * Add multiple documents
     */
    async addDocuments(docs: Document[], opts: any = {}): Promise<boolean> {
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
            let embeddings: number[][];
            try {
                const result = await this.embeddingFn(batchTexts, dim);
                if (Array.isArray(result) && Array.isArray(result[0])) {
                    embeddings = result as number[][];
                } else {
                    // Fall back to individual requests
                    embeddings = await this._embedWithRateLimit(batchTexts, dim, maxConcurrent);
                }
            } catch (error: any) {
                throw EmbeddingError.networkError(error);
            }

            // Insert using transaction for performance
            const insertMany = this.db.transaction((docs: Document[], embeddings: number[][]) => {
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
        return true;
    }

    /**
     * Embed texts with rate limiting
     */
    private async _embedWithRateLimit(texts: string[], dim: number, maxConcurrent: number): Promise<number[][]> {
        const semaphore = { count: 0 };
        const results: Promise<number[]>[] = [];

        for (let i = 0; i < texts.length; i++) {
            while (semaphore.count >= maxConcurrent) {
                await new Promise(resolve => setTimeout(resolve, 50));
            }

            semaphore.count++;
            const promise = (async () => {
                try {
                    return (await this.embeddingFn(texts[i], dim)) as number[];
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
    async addDocument(doc: Document, opts: any = {}): Promise<boolean> {
        return this.addDocuments([doc], opts);
    }

    /**
     * Search for similar documents
     */
    async similaritySearch(query: string, k: number = 3, options: any = {}): Promise<Document[]> {
        if (!query || typeof query !== 'string') {
            throw VectorStoreError.invalidDocument('query must be a non-empty string');
        }

        const dim = options.queryDim || this.defaultDim;

        // Get query embedding
        let queryVector: number[];
        try {
            queryVector = (await this.embeddingFn(query, dim)) as number[];
        } catch (error: any) {
            throw EmbeddingError.networkError(error);
        }

        // Get all documents (with optional metadata filtering)
        let sql = 'SELECT id, text, metadata, vector FROM documents WHERE dim = ?';
        const params: any[] = [dim];

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
        const scored = rows.map((row: any) => {
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
        scored.sort((a: any, b: any) => b.score - a.score);
        return scored.slice(0, k);
    }

    /**
     * Get document by ID
     */
    getDocument(id: string): Document | null {
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
    getAllDocuments(options: any = {}): Document[] {
        let sql = 'SELECT id, text, metadata FROM documents';
        const params: any[] = [];

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

        return rows.map((row: any) => ({
            id: row.id,
            text: row.text,
            meta: JSON.parse(row.metadata)
        }));
    }

    /**
     * Update a document
     */
    async updateDocument(id: string, newText: string, newMeta?: object): Promise<boolean> {
        const existing = this.getDocument(id);
        if (!existing) {
            return false;
        }

        // Get new embedding
        let embedding: number[];
        try {
            embedding = (await this.embeddingFn(newText, this.defaultDim)) as number[];
        } catch (error: any) {
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
    deleteDocument(id: string): boolean {
        const stmt = this.db.prepare('DELETE FROM documents WHERE id = ?');
        const result = stmt.run(id);
        return result.changes > 0;
    }

    /**
     * Clear all documents
     */
    clear(): void {
        this.db.exec('DELETE FROM documents');
    }

    /**
     * Get statistics
     */
    getStats(): object {
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
    close(): void {
        this.db.close();
    }

    /**
     * Vacuum database (optimize storage)
     */
    vacuum(): void {
        this.db.exec('VACUUM');
    }
}
