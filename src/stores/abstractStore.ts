/**
 * Abstract Vector Store Base Class
 * 
 * Provides common interface and validation for all vector store implementations
 */

import { VectorStoreError } from '../errors/index.js';

export interface Document {
    id?: string;
    text: string;
    meta?: Record<string, any>;
    embedding?: number[];
    score?: number;
    [key: string]: any;
}

export type EmbeddingFunction = (text: string | string[], dim?: number) => Promise<number[] | number[][]>;

export interface VectorStoreOptions {
    [key: string]: any;
}

/**
 * Abstract base class for vector stores
 * 
 * All concrete implementations should extend this class and implement
 * the abstract methods.
 */
export abstract class AbstractVectorStore {
    protected embeddingFn: EmbeddingFunction;
    protected options: VectorStoreOptions;

    constructor(embeddingFn: EmbeddingFunction, options: VectorStoreOptions = {}) {
        if (!embeddingFn) {
            throw new VectorStoreError('Embedding function is required');
        }

        this.embeddingFn = embeddingFn;
        this.options = options;
    }

    /**
     * Validate document structure
     */
    protected _validateDocument(doc: Document): boolean {
        if (!doc.text || typeof doc.text !== 'string') {
            throw VectorStoreError.invalidDocument('Document must have text field');
        }
        return true;
    }

    /**
     * Validate documents array
     */
    protected _validateDocuments(docs: Document[]): boolean {
        if (!Array.isArray(docs)) {
            throw VectorStoreError.invalidDocument('docs must be an array');
        }
        if (docs.length === 0) return true;
        docs.forEach(doc => this._validateDocument(doc));
        return true;
    }

    /**
     * Add a single document to the store
     */
    abstract addDocument(doc: Document, options?: any): Promise<boolean>;

    /**
     * Add multiple documents to the store
     */
    abstract addDocuments(docs: Document[], options?: any): Promise<boolean>;

    /**
     * Search for similar documents
     */
    abstract similaritySearch(query: string, k?: number, options?: any): Promise<Document[]>;

    /**
     * Get document by ID
     */
    abstract getDocument(id: string): Document | null;

    /**
     * Update a document
     */
    abstract updateDocument(id: string, newText: string, newMeta?: object): Promise<boolean>;

    /**
     * Delete a document
     */
    abstract deleteDocument(id: string): boolean;

    /**
     * Get statistics about the store
     */
    abstract getStats(): object;

    /**
     * Clear all documents
     */
    abstract clear(): void;
}

/**
 * Factory function to create vector stores
 * 
 * @param type - Store type: 'memory', 'sqlite'
 * @param embeddingFn - Embedding function
 * @param options - Store-specific options
 * @returns Vector store instance
 */
export async function createVectorStore(type: string, embeddingFn: EmbeddingFunction, options: any = {}): Promise<AbstractVectorStore> {
    switch (type.toLowerCase()) {
        case 'memory':
        case 'inmemory': {
            // Dynamic import to avoid circular dependencies if any
            // Note: In TS with ESM, we keep .js extension
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

        default:
            throw new VectorStoreError(`Unknown vector store type: ${type}`);
    }
}
