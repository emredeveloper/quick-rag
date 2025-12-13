/**
 * RAG Evaluator - Comprehensive evaluation for RAG systems
 * 
 * Evaluates retrieval quality using ground truth data.
 * @since v2.3.0
 */

import {
    calculateAllMetrics,
    calculateAggregateMetrics,
    precisionAtK,
    recallAtK,
    meanReciprocalRank
} from './metrics.js';

/**
 * @typedef {Object} EvaluationQuery
 * @property {string} query - The query text
 * @property {string[]} relevantDocs - IDs of relevant documents
 * @property {Object<string, number>} [relevanceScores] - Graded relevance scores
 */

/**
 * @typedef {Object} EvaluationResult
 * @property {Object} metrics - Aggregate metrics
 * @property {Array} queryResults - Per-query results
 * @property {Object} summary - Summary statistics
 */

/**
 * @typedef {Object} EvaluatorOptions
 * @property {number[]} [kValues=[1,3,5,10]] - K values for metrics
 * @property {boolean} [includePerQuery=true] - Include per-query results
 * @property {Function} [onProgress] - Progress callback
 */

/**
 * RAG Evaluator
 * 
 * @example
 * const evaluator = new RAGEvaluator(retriever);
 * 
 * const results = await evaluator.evaluate([
 *   { query: 'What is RAG?', relevantDocs: ['doc1', 'doc2'] },
 *   { query: 'How does embedding work?', relevantDocs: ['doc3'] }
 * ]);
 * 
 * console.log(results.metrics);
 */
export class RAGEvaluator {
    /**
     * @param {Object} retriever - Retriever instance with search method
     * @param {EvaluatorOptions} [options]
     */
    constructor(retriever, options = {}) {
        this.retriever = retriever;
        this.kValues = options.kValues || [1, 3, 5, 10];
        this.includePerQuery = options.includePerQuery !== false;
        this.maxK = Math.max(...this.kValues);
    }

    /**
     * Evaluate retriever on test queries
     * 
     * @param {EvaluationQuery[]} testQueries - Test queries with ground truth
     * @param {Object} [options] - Evaluation options
     * @returns {Promise<EvaluationResult>}
     */
    async evaluate(testQueries, options = {}) {
        const onProgress = options.onProgress || null;
        const retrievalOptions = options.retrievalOptions || {};
        
        const queryResults = [];
        const allQueryMetrics = [];

        for (let i = 0; i < testQueries.length; i++) {
            const testQuery = testQueries[i];
            
            // Retrieve documents
            const retrieved = await this.retriever.search(
                testQuery.query,
                { k: this.maxK, ...retrievalOptions }
            );

            // Extract document IDs
            const retrievedIds = retrieved.map(doc => doc.id);

            // Calculate metrics for this query
            const metrics = calculateAllMetrics(
                retrievedIds,
                testQuery.relevantDocs,
                {
                    kValues: this.kValues,
                    relevanceScores: testQuery.relevanceScores
                }
            );

            // Store for aggregation
            allQueryMetrics.push({
                retrieved: retrievedIds,
                relevant: testQuery.relevantDocs
            });

            // Store per-query result if enabled
            if (this.includePerQuery) {
                queryResults.push({
                    query: testQuery.query,
                    retrieved: retrievedIds,
                    relevant: testQuery.relevantDocs,
                    metrics,
                    // Include retrieved documents for debugging
                    retrievedDocs: retrieved.map(d => ({
                        id: d.id,
                        score: d.score,
                        isRelevant: testQuery.relevantDocs.includes(d.id)
                    }))
                });
            }

            // Report progress
            if (onProgress) {
                onProgress(i + 1, testQueries.length, metrics);
            }
        }

        // Calculate aggregate metrics
        const aggregateMetrics = calculateAggregateMetrics(
            allQueryMetrics,
            { kValues: this.kValues }
        );

        // Generate summary
        const summary = this._generateSummary(aggregateMetrics, queryResults);

        return {
            metrics: aggregateMetrics,
            queryResults: this.includePerQuery ? queryResults : [],
            summary
        };
    }

    /**
     * Quick evaluation with single metric
     * 
     * @param {EvaluationQuery[]} testQueries
     * @param {string} metric - Metric name (e.g., 'mrr', 'ndcg@5')
     * @returns {Promise<number>}
     */
    async quickEvaluate(testQueries, metric = 'mrr') {
        const results = await this.evaluate(testQueries, { 
            includePerQuery: false 
        });
        
        return results.metrics[metric] || 0;
    }

    /**
     * Compare two retrievers
     * 
     * @param {Object} retrieverA - First retriever
     * @param {Object} retrieverB - Second retriever
     * @param {EvaluationQuery[]} testQueries - Test queries
     * @returns {Promise<Object>} Comparison results
     */
    static async compare(retrieverA, retrieverB, testQueries, options = {}) {
        const evaluatorA = new RAGEvaluator(retrieverA, options);
        const evaluatorB = new RAGEvaluator(retrieverB, options);

        const [resultsA, resultsB] = await Promise.all([
            evaluatorA.evaluate(testQueries),
            evaluatorB.evaluate(testQueries)
        ]);

        // Calculate differences
        const comparison = {
            retrieverA: resultsA.metrics,
            retrieverB: resultsB.metrics,
            differences: {},
            winner: {}
        };

        for (const [key, valueA] of Object.entries(resultsA.metrics)) {
            if (typeof valueA === 'number') {
                const valueB = resultsB.metrics[key];
                const diff = valueA - valueB;
                comparison.differences[key] = {
                    absolute: Math.round(diff * 1000) / 1000,
                    relative: valueB !== 0 
                        ? Math.round((diff / valueB) * 100) / 100 
                        : 0
                };
                comparison.winner[key] = diff > 0 ? 'A' : diff < 0 ? 'B' : 'tie';
            }
        }

        return comparison;
    }

    /**
     * Generate human-readable summary
     * @private
     */
    _generateSummary(metrics, queryResults) {
        const summary = {
            overallScore: this._calculateOverallScore(metrics),
            strengths: [],
            weaknesses: [],
            recommendations: []
        };

        // Analyze metrics
        if (metrics.mrr >= 0.7) {
            summary.strengths.push('Good ranking of relevant documents (high MRR)');
        } else if (metrics.mrr < 0.3) {
            summary.weaknesses.push('Relevant documents often not ranked highly');
            summary.recommendations.push('Consider reranking or improving embeddings');
        }

        if (metrics['recall@10'] >= 0.8) {
            summary.strengths.push('High recall - finding most relevant documents');
        } else if (metrics['recall@10'] < 0.5) {
            summary.weaknesses.push('Low recall - missing relevant documents');
            summary.recommendations.push('Consider expanding query or using hybrid search');
        }

        if (metrics['precision@3'] >= 0.6) {
            summary.strengths.push('Good precision in top results');
        } else if (metrics['precision@3'] < 0.3) {
            summary.weaknesses.push('Many irrelevant documents in top results');
            summary.recommendations.push('Consider stricter similarity thresholds');
        }

        // Analyze query-level performance
        if (queryResults.length > 0) {
            const zeroRecallQueries = queryResults.filter(
                q => q.metrics['recall@10'] === 0
            );
            
            if (zeroRecallQueries.length > 0) {
                summary.weaknesses.push(
                    `${zeroRecallQueries.length} queries returned no relevant documents`
                );
                summary.recommendations.push(
                    'Review failed queries for potential embedding issues'
                );
            }
        }

        return summary;
    }

    /**
     * Calculate overall score (0-100)
     * @private
     */
    _calculateOverallScore(metrics) {
        // Weighted combination of key metrics
        const weights = {
            mrr: 0.25,
            'ndcg@5': 0.25,
            'recall@10': 0.25,
            'precision@3': 0.25
        };

        let score = 0;
        let totalWeight = 0;

        for (const [metric, weight] of Object.entries(weights)) {
            if (metrics[metric] !== undefined) {
                score += metrics[metric] * weight * 100;
                totalWeight += weight;
            }
        }

        return totalWeight > 0 
            ? Math.round(score / totalWeight) 
            : 0;
    }
}

/**
 * Evaluate retrieval quality (convenience function)
 * 
 * @param {Object} retriever - Retriever to evaluate
 * @param {EvaluationQuery[]} testQueries - Test queries
 * @param {Object} [options] - Options
 * @returns {Promise<EvaluationResult>}
 * 
 * @example
 * const results = await evaluateRetrieval(retriever, [
 *   { query: 'What is AI?', relevantDocs: ['doc1'] }
 * ]);
 * console.log(results.metrics.mrr);
 */
export async function evaluateRetrieval(retriever, testQueries, options = {}) {
    const evaluator = new RAGEvaluator(retriever, options);
    return evaluator.evaluate(testQueries, options);
}

export default RAGEvaluator;
