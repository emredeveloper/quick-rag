/**
 * Hybrid Search Module
 * 
 * Combines dense (vector) and sparse (BM25) retrieval for better results.
 * Uses Reciprocal Rank Fusion (RRF) for score combination.
 * 
 * Research shows hybrid search improves retrieval by 20-30% compared to
 * vector-only or keyword-only approaches.
 * 
 * Pure JavaScript implementation - no external dependencies.
 */

import { BM25 } from './bm25.js';

/**
 * Reciprocal Rank Fusion (RRF) scoring
 * Combines rankings from multiple retrieval methods
 * 
 * RRF(d) = Σ 1 / (k + rank(d))
 * 
 * @param {Array<Array<{id: string, score: number}>>} rankedLists - Multiple ranked result lists
 * @param {number} [k=60] - RRF constant (default 60 works well in practice)
 * @returns {Map<string, number>} Combined scores by document ID
 */
function reciprocalRankFusion(rankedLists, k = 60) {
    const scores = new Map();

    for (const rankedList of rankedLists) {
        for (let rank = 0; rank < rankedList.length; rank++) {
            const doc = rankedList[rank];
            const rrfScore = 1 / (k + rank + 1); // rank is 0-indexed, so +1
            scores.set(doc.id, (scores.get(doc.id) || 0) + rrfScore);
        }
    }

    return scores;
}

/**
 * Linear combination scoring
 * Combines scores using weighted average
 * 
 * @param {Array<{id: string, score: number}>} denseResults - Vector search results
 * @param {Array<{id: string, score: number}>} sparseResults - BM25 search results
 * @param {number} alpha - Weight for dense scores (1-alpha for sparse)
 * @returns {Map<string, {denseScore: number, sparseScore: number, combinedScore: number}>}
 */
function linearCombination(denseResults, sparseResults, alpha = 0.5) {
    const scores = new Map();

    // Normalize dense scores to 0-1 range
    const maxDense = Math.max(...denseResults.map(r => r.score), 0.001);
    const maxSparse = Math.max(...sparseResults.map(r => r.score), 0.001);

    // Add dense results
    for (const result of denseResults) {
        const normalizedScore = result.score / maxDense;
        scores.set(result.id, {
            denseScore: normalizedScore,
            sparseScore: 0,
            combinedScore: alpha * normalizedScore
        });
    }

    // Add sparse results
    for (const result of sparseResults) {
        const normalizedScore = result.score / maxSparse;
        const existing = scores.get(result.id);

        if (existing) {
            existing.sparseScore = normalizedScore;
            existing.combinedScore += (1 - alpha) * normalizedScore;
        } else {
            scores.set(result.id, {
                denseScore: 0,
                sparseScore: normalizedScore,
                combinedScore: (1 - alpha) * normalizedScore
            });
        }
    }

    return scores;
}

/**
 * Hybrid Retriever
 * Combines vector search with BM25 for improved retrieval
 */
export class HybridRetriever {
    /**
     * @param {Object} vectorStore - Vector store instance (InMemoryVectorStore or SQLiteVectorStore)
     * @param {Object} options - Configuration options
     * @param {number} [options.alpha=0.5] - Weight for dense search (0-1). Higher = more weight on vectors
     * @param {string} [options.fusionMethod='rrf'] - Fusion method: 'rrf' or 'linear'
     * @param {number} [options.rrfK=60] - RRF constant
     * @param {number} [options.bm25K1=1.2] - BM25 k1 parameter
     * @param {number} [options.bm25B=0.75] - BM25 b parameter
     * @param {number} [options.sparseTopK=50] - How many results to fetch from each method before fusion
     */
    constructor(vectorStore, options = {}) {
        if (!vectorStore) {
            throw new Error('Vector store is required');
        }

        this.vectorStore = vectorStore;
        this.alpha = options.alpha ?? 0.5;
        this.fusionMethod = options.fusionMethod ?? 'rrf';
        this.rrfK = options.rrfK ?? 60;
        this.sparseTopK = options.sparseTopK ?? 50;

        // Initialize BM25 index
        this.bm25 = new BM25({
            k1: options.bm25K1 ?? 1.2,
            b: options.bm25B ?? 0.75
        });

        // Track if BM25 is synced with vector store
        this._bm25Synced = false;
    }

    /**
     * Sync BM25 index with vector store documents
     * Call this after adding documents to the vector store
     */
    async syncBM25() {
        this.bm25.clear();

        // Get all documents from vector store
        const allDocs = this.vectorStore.getAllDocuments
            ? this.vectorStore.getAllDocuments({ limit: Number.MAX_SAFE_INTEGER, offset: 0 })
            : this._getAllDocsFromStore();

        this.bm25.addDocuments(allDocs);
        this._bm25Synced = true;
    }

    /**
     * Get all documents from vector store (fallback method)
     * @private
     */
    _getAllDocsFromStore() {
        const docs = [];

        // InMemoryVectorStore has docs Map
        if (this.vectorStore.docs && this.vectorStore.docs instanceof Map) {
            for (const [id, doc] of this.vectorStore.docs) {
                docs.push({ ...doc, id });
            }
        }

        return docs;
    }

    /**
     * Add document and keep BM25 in sync
     * @param {Object} doc - Document to add
     */
    async addDocument(doc) {
        await this.vectorStore.addDocument(doc);
        this.bm25.addDocument(doc);
        this._bm25Synced = true;
    }

    /**
     * Add multiple documents and keep BM25 in sync
     * @param {Object[]} docs - Documents to add
     * @param {Object} [options] - Options passed to vector store
     */
    async addDocuments(docs, options = {}) {
        await this.vectorStore.addDocuments(docs, options);
        this.bm25.addDocuments(docs);
        this._bm25Synced = true;
    }

    /**
     * Perform hybrid search
     * @param {string} query - Search query
     * @param {number} [k=5] - Number of results to return
     * @param {Object} [options] - Search options
     * @param {Function} [options.filter] - Metadata filter function
     * @param {boolean} [options.explain=false] - Include score breakdown
     * @returns {Promise<Array<Object>>} Ranked results
     */
    async search(query, k = 5, options = {}) {
        // Ensure BM25 is synced
        if (!this._bm25Synced) {
            await this.syncBM25();
        }

        // Get results from both methods
        const fetchK = Math.max(k * 3, this.sparseTopK); // Fetch more for better fusion

        const [denseResults, sparseResults] = await Promise.all([
            this.vectorStore.similaritySearch(query, fetchK, { filter: options.filter }),
            Promise.resolve(this.bm25.search(query, fetchK, { filter: options.filter }))
        ]);

        // Fuse results
        let fusedScores;
        if (this.fusionMethod === 'rrf') {
            fusedScores = reciprocalRankFusion([denseResults, sparseResults], this.rrfK);
        } else {
            fusedScores = linearCombination(denseResults, sparseResults, this.alpha);
        }

        // Build result map for document lookup
        const docMap = new Map();
        for (const result of [...denseResults, ...sparseResults]) {
            if (!docMap.has(result.id)) {
                docMap.set(result.id, result);
            }
        }

        // Create final ranked results
        const results = [];
        for (const [id, scoreData] of fusedScores) {
            const doc = docMap.get(id);
            if (!doc) continue;

            const result = {
                id,
                text: doc.text,
                meta: doc.meta,
                score: this.fusionMethod === 'rrf'
                    ? scoreData
                    : scoreData.combinedScore
            };

            // Add explanation if requested
            if (options.explain) {
                const denseDoc = denseResults.find(d => d.id === id);
                const sparseDoc = sparseResults.find(d => d.id === id);

                // Extract query terms for matching
                const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
                const docText = doc.text.toLowerCase();
                const matchedTerms = queryTerms.filter(term => docText.includes(term));

                // Calculate density (matched terms per 100 chars)
                const density = matchedTerms.length / Math.max(doc.text.length / 100, 1);

                // Create snippet (context around first match)
                let snippet = doc.text.slice(0, 150);
                if (matchedTerms.length > 0) {
                    const firstMatch = docText.indexOf(matchedTerms[0]);
                    if (firstMatch > 0) {
                        const start = Math.max(0, firstMatch - 50);
                        const end = Math.min(doc.text.length, firstMatch + 100);
                        snippet = (start > 0 ? '...' : '') +
                            doc.text.slice(start, end) +
                            (end < doc.text.length ? '...' : '');
                    }
                }

                result.explanation = {
                    fusionMethod: this.fusionMethod,
                    denseScore: denseDoc?.score ?? 0,
                    sparseScore: sparseDoc?.score ?? 0,
                    denseRank: denseResults.findIndex(d => d.id === id) + 1 || null,
                    sparseRank: sparseResults.findIndex(d => d.id === id) + 1 || null,
                    combinedScore: result.score,
                    foundInDense: !!denseDoc,
                    foundInSparse: !!sparseDoc,
                    // v2.4.0 Rich Explainability
                    snippet,
                    matchedTerms,
                    relevanceFactors: {
                        density,
                        termMatch: matchedTerms.length / Math.max(queryTerms.length, 1),
                        semanticScore: denseDoc?.score ?? 0,
                        keywordScore: sparseDoc?.score ?? 0
                    }
                };
            }

            results.push(result);
        }

        // Sort by combined score and return top k
        return results
            .sort((a, b) => b.score - a.score)
            .slice(0, k);
    }

    /**
     * Alias for search to match Retriever interface
     */
    async getRelevant(query, k = 5, options = {}) {
        return this.search(query, k, options);
    }

    /**
     * Update configuration
     * @param {Object} options - New options
     */
    configure(options = {}) {
        if (options.alpha !== undefined) this.alpha = options.alpha;
        if (options.fusionMethod) this.fusionMethod = options.fusionMethod;
        if (options.rrfK !== undefined) this.rrfK = options.rrfK;
        if (options.sparseTopK !== undefined) this.sparseTopK = options.sparseTopK;
    }

    /**
     * Get statistics
     */
    getStats() {
        return {
            vectorStoreStats: this.vectorStore.getStats?.() || {},
            bm25Stats: this.bm25.getStats(),
            config: {
                alpha: this.alpha,
                fusionMethod: this.fusionMethod,
                rrfK: this.rrfK,
                sparseTopK: this.sparseTopK
            }
        };
    }

    /**
     * Clear all documents from both stores
     */
    clear() {
        this.vectorStore.clear?.();
        this.bm25.clear();
        this._bm25Synced = true; // Empty is synced
    }
}

// Export fusion functions for advanced usage
export { reciprocalRankFusion, linearCombination };

export default HybridRetriever;
