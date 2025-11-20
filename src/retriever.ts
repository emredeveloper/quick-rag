/**
 * RAG Retriever
 * 
 * Orchestrates document retrieval from vector stores
 */

import { AbstractVectorStore, Document } from './stores/abstractStore.js';
import { RetrievalError } from './errors/index.js';

export interface RetrieverOptions {
    k?: number;
    filter?: object | null;
    debug?: boolean;
    explain?: boolean;
    [key: string]: any;
}

export interface Explanation {
    score?: number;
    reason: string;
    metadata?: object;
    queryTerms: string[];
    matchedTerms: string[];
    matchCount: number;
    matchRatio: number;
    cosineSimilarity?: number;
    relevanceFactors: {
        semanticScore?: number;
        termMatch: number;
    };
}

export interface ExplainedDocument extends Document {
    explanation?: Explanation;
}

export class Retriever {
    private vectorStore: AbstractVectorStore;
    private k: number;
    private filter: object | null;
    private debug: boolean;

    /**
     * @param vectorStore - Vector store instance
     * @param options - Configuration options
     */
    constructor(vectorStore: AbstractVectorStore, options: RetrieverOptions = {}) {
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
     */
    async getRelevant(query: string, k?: number, options: RetrieverOptions = {}): Promise<ExplainedDocument[]> {
        try {
            const limit = k || this.k;
            const searchOptions = {
                filter: this.filter,
                ...options
            };

            if (this.debug) {
                console.log(`[Retriever] Searching for: "${query}" (k=${limit})`);
            }

            const results = (await this.vectorStore.similaritySearch(query, limit, searchOptions)) as ExplainedDocument[];

            if (this.debug) {
                console.log(`[Retriever] Found ${results.length} documents`);
            }

            // Add explanations if requested
            if (options.explain) {
                results.forEach(doc => {
                    const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
                    const text = (doc.text || '').toLowerCase();
                    const matchedTerms = terms.filter(term => text.includes(term));
                    const score = doc.score || 0;

                    doc.explanation = {
                        score: score,
                        reason: `Matched query with similarity score of ${(score * 100).toFixed(1)}%`,
                        metadata: doc.meta,
                        queryTerms: terms,
                        matchedTerms: matchedTerms,
                        matchCount: matchedTerms.length,
                        matchRatio: terms.length > 0 ? matchedTerms.length / terms.length : 0,
                        cosineSimilarity: score,
                        relevanceFactors: {
                            semanticScore: score,
                            termMatch: matchedTerms.length / (terms.length || 1)
                        }
                    };
                });
            }

            return results;
        } catch (error: any) {
            throw new RetrievalError(`Retrieval failed: ${error.message}`, {
                query,
                originalError: error
            });
        }
    }

    /**
     * Update retrieval configuration
     */
    configure(options: RetrieverOptions = {}): void {
        if (options.k) this.k = options.k;
        if (options.filter !== undefined) this.filter = options.filter;
        if (options.debug !== undefined) this.debug = options.debug;
    }
}
