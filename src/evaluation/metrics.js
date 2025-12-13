/**
 * RAG Evaluation Metrics
 * 
 * Standard Information Retrieval metrics for evaluating RAG performance.
 * @since v2.3.0
 */

/**
 * Calculate Precision at K
 * 
 * Precision@K = (Relevant documents in top K) / K
 * 
 * @param {string[]} retrieved - Retrieved document IDs
 * @param {string[]} relevant - Relevant (ground truth) document IDs
 * @param {number} k - Number of results to consider
 * @returns {number} Precision score (0-1)
 */
export function precisionAtK(retrieved, relevant, k) {
    const topK = retrieved.slice(0, k);
    const relevantSet = new Set(relevant);
    const relevantInTopK = topK.filter(id => relevantSet.has(id)).length;
    return relevantInTopK / k;
}

/**
 * Calculate Recall at K
 * 
 * Recall@K = (Relevant documents in top K) / (Total relevant documents)
 * 
 * @param {string[]} retrieved - Retrieved document IDs
 * @param {string[]} relevant - Relevant (ground truth) document IDs
 * @param {number} k - Number of results to consider
 * @returns {number} Recall score (0-1)
 */
export function recallAtK(retrieved, relevant, k) {
    if (relevant.length === 0) return 0;
    
    const topK = retrieved.slice(0, k);
    const relevantSet = new Set(relevant);
    const relevantInTopK = topK.filter(id => relevantSet.has(id)).length;
    return relevantInTopK / relevant.length;
}

/**
 * Calculate F1 Score at K
 * 
 * F1@K = 2 * (Precision@K * Recall@K) / (Precision@K + Recall@K)
 * 
 * @param {string[]} retrieved - Retrieved document IDs
 * @param {string[]} relevant - Relevant (ground truth) document IDs
 * @param {number} k - Number of results to consider
 * @returns {number} F1 score (0-1)
 */
export function f1AtK(retrieved, relevant, k) {
    const precision = precisionAtK(retrieved, relevant, k);
    const recall = recallAtK(retrieved, relevant, k);
    
    if (precision + recall === 0) return 0;
    return (2 * precision * recall) / (precision + recall);
}

/**
 * Calculate Mean Reciprocal Rank (MRR)
 * 
 * MRR = 1 / (rank of first relevant document)
 * 
 * @param {string[]} retrieved - Retrieved document IDs
 * @param {string[]} relevant - Relevant (ground truth) document IDs
 * @returns {number} MRR score (0-1)
 */
export function meanReciprocalRank(retrieved, relevant) {
    const relevantSet = new Set(relevant);
    
    for (let i = 0; i < retrieved.length; i++) {
        if (relevantSet.has(retrieved[i])) {
            return 1 / (i + 1);
        }
    }
    
    return 0;
}

/**
 * Calculate MRR for multiple queries
 * 
 * @param {Array<{retrieved: string[], relevant: string[]}>} queries
 * @returns {number} Average MRR
 */
export function averageMRR(queries) {
    if (queries.length === 0) return 0;
    
    const sum = queries.reduce((acc, q) => {
        return acc + meanReciprocalRank(q.retrieved, q.relevant);
    }, 0);
    
    return sum / queries.length;
}

/**
 * Calculate Discounted Cumulative Gain (DCG)
 * 
 * DCG@K = Σ (relevance_i / log2(i + 1))
 * 
 * @param {number[]} relevanceScores - Relevance scores for each position
 * @param {number} k - Number of results to consider
 * @returns {number} DCG score
 */
export function dcg(relevanceScores, k) {
    const topK = relevanceScores.slice(0, k);
    
    return topK.reduce((sum, rel, i) => {
        return sum + rel / Math.log2(i + 2); // +2 because i is 0-indexed
    }, 0);
}

/**
 * Calculate Normalized Discounted Cumulative Gain (NDCG)
 * 
 * NDCG@K = DCG@K / IDCG@K
 * 
 * @param {string[]} retrieved - Retrieved document IDs
 * @param {Object<string, number>} relevanceMap - Map of doc ID to relevance score
 * @param {number} k - Number of results to consider
 * @returns {number} NDCG score (0-1)
 */
export function ndcgAtK(retrieved, relevanceMap, k) {
    // Get relevance scores for retrieved docs
    const retrievedScores = retrieved
        .slice(0, k)
        .map(id => relevanceMap[id] || 0);
    
    // Calculate DCG
    const actualDCG = dcg(retrievedScores, k);
    
    // Calculate IDCG (ideal DCG - all relevant docs sorted by relevance)
    const idealScores = Object.values(relevanceMap)
        .sort((a, b) => b - a)
        .slice(0, k);
    
    const idealDCG = dcg(idealScores, k);
    
    if (idealDCG === 0) return 0;
    return actualDCG / idealDCG;
}

/**
 * Calculate NDCG with binary relevance (relevant = 1, not relevant = 0)
 * 
 * @param {string[]} retrieved - Retrieved document IDs
 * @param {string[]} relevant - Relevant (ground truth) document IDs
 * @param {number} k - Number of results to consider
 * @returns {number} NDCG score (0-1)
 */
export function ndcgAtKBinary(retrieved, relevant, k) {
    const relevanceMap = {};
    relevant.forEach(id => { relevanceMap[id] = 1; });
    return ndcgAtK(retrieved, relevanceMap, k);
}

/**
 * Calculate Average Precision (AP)
 * 
 * AP = Σ (Precision@k * rel(k)) / |relevant|
 * where rel(k) = 1 if doc at position k is relevant, 0 otherwise
 * 
 * @param {string[]} retrieved - Retrieved document IDs
 * @param {string[]} relevant - Relevant (ground truth) document IDs
 * @returns {number} AP score (0-1)
 */
export function averagePrecision(retrieved, relevant) {
    if (relevant.length === 0) return 0;
    
    const relevantSet = new Set(relevant);
    let numRelevantSeen = 0;
    let sumPrecision = 0;
    
    for (let i = 0; i < retrieved.length; i++) {
        if (relevantSet.has(retrieved[i])) {
            numRelevantSeen++;
            sumPrecision += numRelevantSeen / (i + 1);
        }
    }
    
    return sumPrecision / relevant.length;
}

/**
 * Calculate Mean Average Precision (MAP)
 * 
 * @param {Array<{retrieved: string[], relevant: string[]}>} queries
 * @returns {number} MAP score (0-1)
 */
export function meanAveragePrecision(queries) {
    if (queries.length === 0) return 0;
    
    const sum = queries.reduce((acc, q) => {
        return acc + averagePrecision(q.retrieved, q.relevant);
    }, 0);
    
    return sum / queries.length;
}

/**
 * Calculate Hit Rate at K (also known as Success Rate)
 * 
 * Hit@K = 1 if any relevant document is in top K, else 0
 * 
 * @param {string[]} retrieved - Retrieved document IDs
 * @param {string[]} relevant - Relevant (ground truth) document IDs
 * @param {number} k - Number of results to consider
 * @returns {number} 1 or 0
 */
export function hitAtK(retrieved, relevant, k) {
    const topK = retrieved.slice(0, k);
    const relevantSet = new Set(relevant);
    return topK.some(id => relevantSet.has(id)) ? 1 : 0;
}

/**
 * Calculate average Hit Rate across queries
 * 
 * @param {Array<{retrieved: string[], relevant: string[]}>} queries
 * @param {number} k
 * @returns {number} Average hit rate (0-1)
 */
export function averageHitRate(queries, k) {
    if (queries.length === 0) return 0;
    
    const sum = queries.reduce((acc, q) => {
        return acc + hitAtK(q.retrieved, q.relevant, k);
    }, 0);
    
    return sum / queries.length;
}

/**
 * Calculate all metrics at once
 * 
 * @param {string[]} retrieved - Retrieved document IDs
 * @param {string[]} relevant - Relevant (ground truth) document IDs
 * @param {Object} [options] - Options
 * @param {number[]} [options.kValues=[1,3,5,10]] - K values to calculate
 * @param {Object<string, number>} [options.relevanceScores] - Graded relevance
 * @returns {Object} All metrics
 */
export function calculateAllMetrics(retrieved, relevant, options = {}) {
    const kValues = options.kValues || [1, 3, 5, 10];
    const relevanceScores = options.relevanceScores || null;
    
    const metrics = {
        mrr: meanReciprocalRank(retrieved, relevant),
        ap: averagePrecision(retrieved, relevant)
    };
    
    // Calculate metrics for each k
    for (const k of kValues) {
        metrics[`precision@${k}`] = precisionAtK(retrieved, relevant, k);
        metrics[`recall@${k}`] = recallAtK(retrieved, relevant, k);
        metrics[`f1@${k}`] = f1AtK(retrieved, relevant, k);
        metrics[`hit@${k}`] = hitAtK(retrieved, relevant, k);
        
        if (relevanceScores) {
            metrics[`ndcg@${k}`] = ndcgAtK(retrieved, relevanceScores, k);
        } else {
            metrics[`ndcg@${k}`] = ndcgAtKBinary(retrieved, relevant, k);
        }
    }
    
    return metrics;
}

/**
 * Calculate aggregate metrics across multiple queries
 * 
 * @param {Array<{retrieved: string[], relevant: string[]}>} queries
 * @param {Object} [options]
 * @returns {Object} Aggregated metrics
 */
export function calculateAggregateMetrics(queries, options = {}) {
    const kValues = options.kValues || [1, 3, 5, 10];
    
    const metrics = {
        queryCount: queries.length,
        mrr: averageMRR(queries),
        map: meanAveragePrecision(queries)
    };
    
    // Calculate average metrics for each k
    for (const k of kValues) {
        metrics[`precision@${k}`] = average(queries.map(q => 
            precisionAtK(q.retrieved, q.relevant, k)
        ));
        metrics[`recall@${k}`] = average(queries.map(q => 
            recallAtK(q.retrieved, q.relevant, k)
        ));
        metrics[`f1@${k}`] = average(queries.map(q => 
            f1AtK(q.retrieved, q.relevant, k)
        ));
        metrics[`ndcg@${k}`] = average(queries.map(q => 
            ndcgAtKBinary(q.retrieved, q.relevant, k)
        ));
        metrics[`hitRate@${k}`] = averageHitRate(queries, k);
    }
    
    return metrics;
}

/**
 * Helper: Calculate average of numbers
 * @private
 */
function average(numbers) {
    if (numbers.length === 0) return 0;
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
}

export default {
    precisionAtK,
    recallAtK,
    f1AtK,
    meanReciprocalRank,
    averageMRR,
    dcg,
    ndcgAtK,
    ndcgAtKBinary,
    averagePrecision,
    meanAveragePrecision,
    hitAtK,
    averageHitRate,
    calculateAllMetrics,
    calculateAggregateMetrics
};
