/**
 * Vector Store Interface and In-Memory Implementation
 */

import { AbstractVectorStore, Document, EmbeddingFunction } from './stores/abstractStore.js';
import { VectorStoreError } from './errors/index.js';

// Export Document type for consumers
export type { Document };

/**
 * In-Memory Vector Store
 * Suitable for small datasets and browser usage
 */
export class InMemoryVectorStore extends AbstractVectorStore {
    private docs: Map<string, Document>;
    private embeddings: number[][];
    private ids: string[];

    /**
     * @param embeddingFn - Embedding function
     * @param options - Store options
     */
    constructor(embeddingFn: EmbeddingFunction, options: any = {}) {
        super(embeddingFn, options);

        this.docs = new Map();
        this.embeddings = [];
        this.ids = [];
    }

    /**
     * Add a single document
     */
    async addDocument(doc: Document): Promise<boolean> {
        this._validateDocument(doc);

        // Generate ID if missing
        if (!doc.id) {
            doc.id = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }

        // Generate embedding if not present
        if (!doc.embedding) {
            // Cast to number[] because embeddingFn can return number[][] for batch
            doc.embedding = (await this.embeddingFn(doc.text)) as number[];
        }

        // Update or insert
        if (this.docs.has(doc.id)) {
            const index = this.ids.indexOf(doc.id);
            if (index !== -1) {
                this.embeddings[index] = doc.embedding;
            }
        } else {
            this.ids.push(doc.id);
            this.embeddings.push(doc.embedding);
        }

        this.docs.set(doc.id, doc);
        return true;
    }

    /**
     * Add multiple documents
     */
    async addDocuments(docs: Document[], options: any = {}): Promise<boolean> {
        this._validateDocuments(docs);

        // Process in batches if needed
        const batchSize = options.batchSize || 50;
        const total = docs.length;

        for (let i = 0; i < total; i += batchSize) {
            const batch = docs.slice(i, i + batchSize);

            // Generate embeddings in parallel
            // We need to handle potential batch embedding function support here
            // But for now we assume parallel calls if not provided
            const embeddings = await Promise.all(
                batch.map(async d => {
                    if (d.embedding) return d.embedding;
                    return (await this.embeddingFn(d.text)) as number[];
                })
            );

            // Store documents
            for (let idx = 0; idx < batch.length; idx++) {
                const doc = batch[idx];
                doc.embedding = embeddings[idx];
                await this.addDocument(doc); // Reuse single add logic
            }

            if (options.onProgress) {
                options.onProgress(Math.min(i + batchSize, total), total);
            }
        }

        return true;
    }

    /**
     * Search for similar documents
     */
    async similaritySearch(query: string, k: number = 3, options: any = {}): Promise<Document[]> {
        if (!query || typeof query !== 'string') {
            throw new VectorStoreError('Query must be a non-empty string');
        }

        const queryEmbedding = (await this.embeddingFn(query)) as number[];
        const scores = this.embeddings.map(emb => this._cosineSimilarity(queryEmbedding, emb));

        // Map scores to documents
        let results = this.ids.map((id, i) => {
            const doc = this.docs.get(id)!;
            return {
                ...doc,
                score: scores[i]
            };
        });

        // Filter
        const filter = options.filter || options.filters;
        if (filter) {
            if (typeof filter === 'function') {
                results = results.filter(doc => filter(doc.meta || {}));
            } else {
                results = results.filter(doc => {
                    if (!doc.meta) return false;
                    return Object.entries(filter).every(([key, val]) => doc.meta![key] === val);
                });
            }
        }

        // Sort and slice
        return results
            .sort((a, b) => (b.score || 0) - (a.score || 0))
            .slice(0, k);
    }

    /**
     * Get document by ID
     */
    getDocument(id: string): Document | null {
        return this.docs.get(id) || null;
    }

    /**
     * Update document
     */
    async updateDocument(id: string, newText: string, newMeta?: object): Promise<boolean> {
        const doc = this.docs.get(id);
        if (!doc) return false;

        doc.text = newText;
        if (newMeta) {
            doc.meta = { ...doc.meta, ...newMeta };
        }

        // Re-embed
        doc.embedding = (await this.embeddingFn(newText)) as number[];

        // Update embedding array
        const index = this.ids.indexOf(id);
        if (index !== -1) {
            this.embeddings[index] = doc.embedding;
        }

        return true;
    }

    /**
     * Delete document
     */
    deleteDocument(id: string): boolean {
        if (!this.docs.has(id)) return false;

        const index = this.ids.indexOf(id);
        if (index !== -1) {
            this.ids.splice(index, 1);
            this.embeddings.splice(index, 1);
        }

        this.docs.delete(id);
        return true;
    }

    /**
     * Get all documents (with pagination)
     */
    getAllDocuments(options: any = {}): Document[] {
        const limit = options.limit || 100;
        const offset = options.offset || 0;

        const allDocs = Array.from(this.docs.values());
        return allDocs.slice(offset, offset + limit);
    }

    /**
     * Get stats
     */
    getStats(): object {
        return {
            documentCount: this.docs.size,
            dimension: this.embeddings[0]?.length || 0,
            type: 'memory'
        };
    }

    /**
     * Clear store
     */
    clear(): void {
        this.docs.clear();
        this.embeddings = [];
        this.ids = [];
    }

    /**
     * Calculate cosine similarity
     */
    private _cosineSimilarity(a: number[], b: number[]): number {
        let dot = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < a.length; i++) {
            dot += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        return dot / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}
