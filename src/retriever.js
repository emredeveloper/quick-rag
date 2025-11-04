export class Retriever {
  constructor(vectorStore, options = {}) {
    this.store = vectorStore;
    this.k = options.k || 3;
  }

  /**
   * Get relevant documents with optional metadata filtering
   * @param {string} query - Search query
   * @param {number} topK - Number of results to return (optional)
   * @param {Object} options - Additional options
   * @param {Object} options.filters - Metadata filters (e.g., { source: 'web', date: '2025-01-01' })
   * @param {number} options.minScore - Minimum similarity score (0-1)
   * @returns {Promise<Array>} Relevant documents
   */
  async getRelevant(query, topK, options = {}) {
    // Use provided topK or fall back to instance default
    const k = topK !== undefined ? topK : this.k;
    const { filters, minScore } = options;
    
    // Get more results if filtering, to ensure we have enough after filtering
    const fetchK = filters ? k * 3 : k;
    let results = await this.store.similaritySearch(query, fetchK);
    
    // Apply metadata filters
    if (filters && Object.keys(filters).length > 0) {
      results = results.filter(doc => {
        if (!doc.meta) return false;
        return Object.entries(filters).every(([key, value]) => {
          // Support exact match
          if (doc.meta[key] === value) return true;
          // Support array contains
          if (Array.isArray(doc.meta[key]) && doc.meta[key].includes(value)) return true;
          // Support regex match
          if (value instanceof RegExp && typeof doc.meta[key] === 'string') {
            return value.test(doc.meta[key]);
          }
          return false;
        });
      });
    }
    
    // Apply minimum score filter
    if (minScore !== undefined) {
      results = results.filter(doc => doc.score >= minScore);
    }
    
    // Return top k after filtering
    return results.slice(0, k);
  }
}
