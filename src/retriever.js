/**
 * RAG Retriever
 * 
 * Orchestrates document retrieval from vector stores
 */

import { RetrievalError } from './errors/index.js';

/**
 * @typedef {Object} RetrieverOptions
 * @property {number} [k=3] - Number of documents to retrieve
 * @property {Object} [filter] - Metadata filter
 * @property {boolean} [debug=false] - Enable debug logging
 */

export class Retriever {
  /**
   * @param {import('./stores/abstractStore').AbstractVectorStore} vectorStore 
   * @param {RetrieverOptions} [options]
   */
  constructor(vectorStore, options = {}) {
    if (!vectorStore) {
      throw new RetrievalError('Vector store is required');
    }

    this.vectorStore = vectorStore;
    this.k = options.k || 3;
    this.filter = options.filter || null;
    this.debug = options.debug || false;
  }

  /**
   * Retrieve relevant documents
   * @param {string} query - Search query
   * @param {number} [k] - Override default k
   * @param {Object} [options] - Additional search options
   * @returns {Promise<import('./vectorStore').Document[]>}
   */
  async getRelevant(query, k, options = {}) {
    try {
      const limit = k || this.k;
      const searchOptions = {
        filter: this.filter,
        ...options
      };

      if (this.debug) {
        console.log(`[Retriever] Searching for: "${query}" (k=${limit})`);
      }

      const results = await this.vectorStore.similaritySearch(query, limit, searchOptions);

      if (this.debug) {
        console.log(`[Retriever] Found ${results.length} documents`);
      }

      return results;
    } catch (error) {
      throw new RetrievalError(`Retrieval failed: ${error.message}`, {
        query,
        originalError: error
      });
    }
  }

  /**
   * Update retrieval configuration
   * @param {RetrieverOptions} options 
   */
  configure(options = {}) {
    if (options.k) this.k = options.k;
    if (options.filter !== undefined) this.filter = options.filter;
    if (options.debug !== undefined) this.debug = options.debug;
  }
}
