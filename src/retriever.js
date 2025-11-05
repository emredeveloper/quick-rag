export class Retriever {
  constructor(vectorStore, options = {}) {
    this.store = vectorStore;
    this.k = options.k || 3;
  }

  /**
   * Get relevant documents with optional metadata filtering and explanations
   * @param {string} query - Search query
   * @param {number} topK - Number of results to return (optional)
   * @param {Object} options - Additional options
   * @param {Object} options.filters - Metadata filters (e.g., { source: 'web', date: '2025-01-01' })
   * @param {number} options.minScore - Minimum similarity score (0-1)
   * @param {boolean} options.explain - Add explanation for why each document was retrieved
   * @returns {Promise<Array>} Relevant documents
   */
  async getRelevant(query, topK, options = {}) {
    // Use provided topK or fall back to instance default
    const k = topK !== undefined ? topK : this.k;
    const { filters, minScore, explain } = options;
    
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
    
    // Add explanations if requested
    if (explain) {
      results = results.map(doc => this._addExplanation(query, doc));
    }
    
    // Return top k after filtering
    return results.slice(0, k);
  }

  /**
   * Add explanation for why a document was retrieved
   * @private
   * @param {string} query - Search query
   * @param {Object} doc - Document with score
   * @returns {Object} Document with explanation
   */
  _addExplanation(query, doc) {
    // Extract query terms (simple tokenization)
    const queryTerms = query
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(term => term.length > 2); // Ignore very short words

    // Extract document terms
    const docText = doc.text.toLowerCase();
    const docTerms = docText
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(term => term.length > 2);

    // Find matched terms
    const matchedTerms = queryTerms.filter(term => 
      docTerms.some(docTerm => 
        docTerm.includes(term) || term.includes(docTerm)
      )
    );

    // Calculate match statistics
    const matchCount = matchedTerms.length;
    const matchRatio = queryTerms.length > 0 ? matchCount / queryTerms.length : 0;

    // Create explanation
    const explanation = {
      queryTerms,
      matchedTerms,
      matchCount,
      matchRatio: Math.round(matchRatio * 100) / 100,
      cosineSimilarity: Math.round(doc.score * 1000) / 1000,
      relevanceFactors: {
        termMatches: matchCount,
        semanticSimilarity: doc.score,
        coverage: `${Math.round(matchRatio * 100)}%`
      }
    };

    return {
      ...doc,
      explanation
    };
  }
}
