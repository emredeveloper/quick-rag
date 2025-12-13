/**
 * Evaluation Module - Unified exports
 * @since v2.3.0
 */

// Metrics
export {
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
} from './metrics.js';

// Evaluator
export { RAGEvaluator, evaluateRetrieval } from './evaluator.js';

// Benchmark
export { 
    BenchmarkRunner, 
    createTestDataset, 
    loadTestDataset,
    saveBenchmarkResults 
} from './benchmark.js';

// Default export
export { evaluateRetrieval as default } from './evaluator.js';
