/**
 * Vector Store Interface and In-Memory Implementation
 */

import { AbstractVectorStore } from './stores/abstractStore.js';
import { VectorStoreError } from './errors/index.js';

/**
 * @typedef {Object} Document
 * @property {string} id - Unique identifier
 * @property {string} text - Document content
 * @property {Object} [meta] - Metadata
 * @property {number[]} [embedding] - Vector embedding
 * @property {number} [score] - Similarity score
 */

/**
 * In-Memory Vector Store
 * Suitable for small datasets and browser usage
 * @extends AbstractVectorStore
 */
export class InMemoryVectorStore extends AbstractVectorStore {
  /**
   * @param {Function} embeddingFn - Embedding function
   * @param {Object} [options] - Store options
   */
  constructor(embeddingFn, options = {}) {
    super(embeddingFn, options);

    /** @type {Map<string, Document>} */
    this.docs = new Map();

    /** @type {number[][]} */
    this.embeddings = [];

    /** @type {string[]} */
    this.ids = [];
  }

  /**
   * Add a single document
   * @param {Document} doc 
   */
  async addDocument(doc) {
    this._validateDocument(doc);

    // Generate embedding if not present
    if (!doc.embedding) {
      doc.embedding = await this.embeddingFn(doc.text);
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
   * @param {Document[]} docs 
   * @param {Object} [options]
   */
  async addDocuments(docs, options = {}) {
    this._validateDocuments(docs);

    // Process in batches if needed
    const batchSize = options.batchSize || 50;
    const total = docs.length;

    for (let i = 0; i < total; i += batchSize) {
      const batch = docs.slice(i, i + batchSize);

      // Generate embeddings in parallel
      const embeddings = await Promise.all(
        batch.map(d => d.embedding || this.embeddingFn(d.text))
      );

      // Store documents
      batch.forEach((doc, idx) => {
        doc.embedding = embeddings[idx];
        this.addDocument(doc); // Reuse single add logic
      });

      if (options.onProgress) {
        options.onProgress(Math.min(i + batchSize, total), total);
      }
    }

    return true;
  }

  /**
   * Search for similar documents
   * @param {string} query 
   * @param {number} [k=3] 
   * @param {Object} [options] 
   */
  async similaritySearch(query, k = 3, options = {}) {
    if (!query || typeof query !== 'string') {
      throw VectorStoreError.invalidQuery('Query must be a non-empty string');
    }

    const queryEmbedding = await this.embeddingFn(query);
    const scores = this.embeddings.map(emb => this._cosineSimilarity(queryEmbedding, emb));

    // Map scores to documents
    let results = this.ids.map((id, i) => ({
      ...this.docs.get(id),
      score: scores[i]
    }));

    // Filter
    if (options.filter) {
      results = results.filter(doc => {
        return Object.entries(options.filter).every(([key, val]) => doc.meta[key] === val);
      });
    }

    // Sort and slice
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
  }

  /**
   * Get document by ID
   * @param {string} id 
   */
  getDocument(id) {
    return this.docs.get(id) || null;
  }

  /**
   * Update document
   * @param {string} id 
   * @param {string} newText 
   * @param {Object} [newMeta] 
   */
  async updateDocument(id, newText, newMeta) {
    const doc = this.docs.get(id);
    if (!doc) return false;

    doc.text = newText;
    if (newMeta) {
      doc.meta = { ...doc.meta, ...newMeta };
    }

    // Re-embed
    doc.embedding = await this.embeddingFn(newText);

    // Update embedding array
    const index = this.ids.indexOf(id);
    if (index !== -1) {
      this.embeddings[index] = doc.embedding;
    }

    return true;
  }

  /**
   * Delete document
   * @param {string} id 
   */
  deleteDocument(id) {
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
   * @param {Object} [options]
   */
  getAllDocuments(options = {}) {
    const limit = options.limit || 100;
    const offset = options.offset || 0;

    const allDocs = Array.from(this.docs.values());
    return allDocs.slice(offset, offset + limit);
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      documentCount: this.docs.size,
      dimension: this.embeddings[0]?.length || 0,
      type: 'memory'
    };
  }

  /**
   * Clear store
   */
  clear() {
    this.docs.clear();
    this.embeddings = [];
    this.ids = [];
  }

  /**
   * Calculate cosine similarity
   * @private
   */
  _cosineSimilarity(a, b) {
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
