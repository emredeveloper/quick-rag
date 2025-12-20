/**
 * BM25 (Best Matching 25) Implementation
 * 
 * A ranking function used for text retrieval based on term frequency.
 * Pure JavaScript implementation - no external dependencies.
 * 
 * BM25 Formula:
 * score(D,Q) = Σ IDF(qi) · (f(qi,D) · (k1 + 1)) / (f(qi,D) + k1 · (1 - b + b · |D|/avgdl))
 * 
 * Where:
 * - f(qi,D) = frequency of term qi in document D
 * - |D| = length of document D
 * - avgdl = average document length
 * - k1 = term frequency saturation parameter (default: 1.2)
 * - b = length normalization parameter (default: 0.75)
 */

/**
 * Simple tokenizer with stemming-like normalization
 * @param {string} text - Text to tokenize
 * @returns {string[]} Array of tokens
 */
function tokenize(text) {
    if (!text || typeof text !== 'string') return [];

    return text
        .toLowerCase()
        // Remove special characters but keep alphanumeric and spaces
        .replace(/[^\w\s]/g, ' ')
        // Split on whitespace
        .split(/\s+/)
        // Filter out empty strings and very short words
        .filter(token => token.length > 1)
        // Basic stemming: remove common suffixes (English)
        .map(token => {
            // Remove common English suffixes for better matching
            if (token.endsWith('ing')) return token.slice(0, -3);
            if (token.endsWith('tion')) return token.slice(0, -4);
            if (token.endsWith('ness')) return token.slice(0, -4);
            if (token.endsWith('ment')) return token.slice(0, -4);
            if (token.endsWith('able')) return token.slice(0, -4);
            if (token.endsWith('ible')) return token.slice(0, -4);
            if (token.endsWith('ous')) return token.slice(0, -3);
            if (token.endsWith('ive')) return token.slice(0, -3);
            if (token.endsWith('ly')) return token.slice(0, -2);
            if (token.endsWith('ed') && token.length > 3) return token.slice(0, -2);
            if (token.endsWith('es') && token.length > 3) return token.slice(0, -2);
            if (token.endsWith('s') && token.length > 2 && !token.endsWith('ss')) return token.slice(0, -1);
            return token;
        })
        .filter(token => token.length > 1);
}

/**
 * Calculate term frequency in a document
 * @param {string[]} tokens - Document tokens
 * @returns {Map<string, number>} Term frequency map
 */
function calculateTF(tokens) {
    const tf = new Map();
    for (const token of tokens) {
        tf.set(token, (tf.get(token) || 0) + 1);
    }
    return tf;
}

/**
 * BM25 Search Engine
 * Provides sparse retrieval using BM25 algorithm
 */
export class BM25 {
    /**
     * @param {Object} options - BM25 parameters
     * @param {number} [options.k1=1.2] - Term frequency saturation
     * @param {number} [options.b=0.75] - Length normalization
     */
    constructor(options = {}) {
        this.k1 = options.k1 ?? 1.2;
        this.b = options.b ?? 0.75;

        /** @type {Array<{id: string, tokens: string[], tf: Map<string, number>, length: number, doc: Object}>} */
        this.documents = [];

        /** @type {Map<string, number>} Document frequency for each term */
        this.df = new Map();

        /** @type {number} Average document length */
        this.avgdl = 0;

        /** @type {number} Total documents */
        this.N = 0;
    }

    /**
     * Add a single document to the index
     * @param {Object} doc - Document with id and text
     */
    addDocument(doc) {
        const id = doc.id || `doc_${this.documents.length}`;
        const text = doc.text || '';
        const tokens = tokenize(text);
        const tf = calculateTF(tokens);

        // Update document frequency
        const uniqueTokens = new Set(tokens);
        for (const token of uniqueTokens) {
            this.df.set(token, (this.df.get(token) || 0) + 1);
        }

        this.documents.push({
            id,
            tokens,
            tf,
            length: tokens.length,
            doc
        });

        // Update statistics
        this.N = this.documents.length;
        this._updateAvgdl();
    }

    /**
     * Add multiple documents
     * @param {Object[]} docs - Array of documents
     */
    addDocuments(docs) {
        for (const doc of docs) {
            this.addDocument(doc);
        }
    }

    /**
     * Update average document length
     * @private
     */
    _updateAvgdl() {
        if (this.documents.length === 0) {
            this.avgdl = 0;
            return;
        }
        const totalLength = this.documents.reduce((sum, d) => sum + d.length, 0);
        this.avgdl = totalLength / this.documents.length;
    }

    /**
     * Calculate IDF (Inverse Document Frequency)
     * @param {string} term - Search term
     * @returns {number} IDF score
     */
    idf(term) {
        const df = this.df.get(term) || 0;
        if (df === 0) return 0;

        // Standard BM25 IDF formula
        // log((N - df + 0.5) / (df + 0.5) + 1)
        return Math.log((this.N - df + 0.5) / (df + 0.5) + 1);
    }

    /**
     * Calculate BM25 score for a document given a query
     * @param {Object} docEntry - Internal document entry
     * @param {string[]} queryTokens - Query tokens
     * @returns {number} BM25 score
     */
    _score(docEntry, queryTokens) {
        let score = 0;
        const { tf, length } = docEntry;

        for (const token of queryTokens) {
            const termFreq = tf.get(token) || 0;
            if (termFreq === 0) continue;

            const idfScore = this.idf(token);

            // BM25 scoring formula
            const numerator = termFreq * (this.k1 + 1);
            const denominator = termFreq + this.k1 * (1 - this.b + this.b * (length / this.avgdl));

            score += idfScore * (numerator / denominator);
        }

        return score;
    }

    /**
     * Search for documents matching a query
     * @param {string} query - Search query
     * @param {number} [k=10] - Number of results to return
     * @param {Object} [options] - Search options
     * @param {Function} [options.filter] - Metadata filter function
     * @returns {Array<{id: string, score: number, doc: Object}>} Ranked results
     */
    search(query, k = 10, options = {}) {
        const queryTokens = tokenize(query);

        if (queryTokens.length === 0 || this.documents.length === 0) {
            return [];
        }

        // Use a simple Min-Heap for top-K if N is large, 
        // to avoid sorting the entire result set.
        if (this.documents.length > 1000 && k < 100) {
            const heap = [];
            for (const docEntry of this.documents) {
                if (options.filter) {
                    const meta = docEntry.doc.meta || {};
                    if (!options.filter(meta)) continue;
                }

                const score = this._score(docEntry, queryTokens);
                if (score <= 0) continue;

                const result = {
                    id: docEntry.id,
                    score,
                    text: docEntry.doc.text,
                    meta: docEntry.doc.meta,
                    doc: docEntry.doc
                };

                if (heap.length < k) {
                    heap.push(result);
                    if (heap.length === k) heap.sort((a, b) => a.score - b.score);
                } else if (score > heap[0].score) {
                    heap[0] = result;
                    heap.sort((a, b) => a.score - b.score);
                }
            }
            return heap.sort((a, b) => b.score - a.score);
        }

        const results = [];
        for (const docEntry of this.documents) {
            if (options.filter) {
                const meta = docEntry.doc.meta || {};
                if (!options.filter(meta)) continue;
            }

            const score = this._score(docEntry, queryTokens);

            if (score > 0) {
                results.push({
                    id: docEntry.id,
                    score,
                    text: docEntry.doc.text,
                    meta: docEntry.doc.meta,
                    doc: docEntry.doc
                });
            }
        }

        return results
            .sort((a, b) => b.score - a.score)
            .slice(0, k);
    }

    /**
     * Get document by ID
     * @param {string} id - Document ID
     * @returns {Object|null} Document or null
     */
    getDocument(id) {
        const entry = this.documents.find(d => d.id === id);
        return entry ? entry.doc : null;
    }

    /**
     * Remove document by ID
     * @param {string} id - Document ID
     * @returns {boolean} Success
     */
    removeDocument(id) {
        const index = this.documents.findIndex(d => d.id === id);
        if (index === -1) return false;

        const docEntry = this.documents[index];

        // Update document frequency
        const uniqueTokens = new Set(docEntry.tokens);
        for (const token of uniqueTokens) {
            const count = this.df.get(token) || 0;
            if (count <= 1) {
                this.df.delete(token);
            } else {
                this.df.set(token, count - 1);
            }
        }

        this.documents.splice(index, 1);
        this.N = this.documents.length;
        this._updateAvgdl();

        return true;
    }

    /**
     * Clear all documents
     */
    clear() {
        this.documents = [];
        this.df.clear();
        this.avgdl = 0;
        this.N = 0;
    }

    /**
     * Get index statistics
     * @returns {Object} Statistics
     */
    getStats() {
        return {
            documentCount: this.N,
            uniqueTerms: this.df.size,
            averageDocumentLength: this.avgdl,
            k1: this.k1,
            b: this.b
        };
    }

    /**
     * Export index for persistence
     * @returns {Object} Serializable index data
     */
    export() {
        return {
            k1: this.k1,
            b: this.b,
            documents: this.documents.map(d => ({
                id: d.id,
                text: d.doc.text,
                meta: d.doc.meta
            })),
            df: Object.fromEntries(this.df),
            avgdl: this.avgdl
        };
    }

    /**
     * Import index from exported data
     * @param {Object} data - Exported index data
     */
    import(data) {
        this.k1 = data.k1 ?? 1.2;
        this.b = data.b ?? 0.75;
        this.clear();

        // Restore documents
        if (data.documents) {
            this.addDocuments(data.documents);
        }
    }
}

// Export tokenize for testing/reuse
export { tokenize };

export default BM25;
