/**
 * RAG Benchmark Suite
 * 
 * Tools for benchmarking RAG system performance.
 * @since v2.3.0
 */

import { RAGEvaluator } from './evaluator.js';

/**
 * @typedef {Object} BenchmarkConfig
 * @property {string} name - Benchmark name
 * @property {Array} testQueries - Test queries
 * @property {Object} [options] - Evaluation options
 */

/**
 * @typedef {Object} BenchmarkResult
 * @property {string} name - Retriever name
 * @property {Object} metrics - Evaluation metrics
 * @property {number} latency - Average latency in ms
 * @property {number} throughput - Queries per second
 */

/**
 * Benchmark Runner
 * 
 * @example
 * const benchmark = new BenchmarkRunner();
 * 
 * benchmark.addRetriever('baseline', baselineRetriever);
 * benchmark.addRetriever('hybrid', hybridRetriever);
 * 
 * const results = await benchmark.run(testQueries);
 * benchmark.printReport(results);
 */
export class BenchmarkRunner {
    constructor() {
        /** @type {Map<string, Object>} */
        this.retrievers = new Map();
        this.warmupRuns = 3;
        this.testRuns = 1;
    }

    /**
     * Add a retriever to benchmark
     * @param {string} name - Retriever name
     * @param {Object} retriever - Retriever instance
     */
    addRetriever(name, retriever) {
        this.retrievers.set(name, retriever);
        return this;
    }

    /**
     * Remove a retriever
     * @param {string} name
     */
    removeRetriever(name) {
        this.retrievers.delete(name);
        return this;
    }

    /**
     * Run benchmark on all retrievers
     * 
     * @param {Array} testQueries - Test queries with ground truth
     * @param {Object} [options] - Options
     * @returns {Promise<BenchmarkResult[]>}
     */
    async run(testQueries, options = {}) {
        const results = [];
        const kValues = options.kValues || [1, 3, 5, 10];

        for (const [name, retriever] of this.retrievers) {
            console.log(`Benchmarking: ${name}`);
            
            // Warmup runs
            for (let i = 0; i < this.warmupRuns; i++) {
                await retriever.search(testQueries[0]?.query || 'warmup', { k: 5 });
            }

            // Latency measurement
            const latencies = [];
            for (const testQuery of testQueries) {
                const start = performance.now();
                await retriever.search(testQuery.query, { k: Math.max(...kValues) });
                latencies.push(performance.now() - start);
            }

            // Quality evaluation
            const evaluator = new RAGEvaluator(retriever, { kValues });
            const evalResults = await evaluator.evaluate(testQueries);

            const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
            
            results.push({
                name,
                metrics: evalResults.metrics,
                summary: evalResults.summary,
                latency: {
                    average: Math.round(avgLatency * 100) / 100,
                    min: Math.round(Math.min(...latencies) * 100) / 100,
                    max: Math.round(Math.max(...latencies) * 100) / 100,
                    p95: this._percentile(latencies, 95)
                },
                throughput: Math.round(1000 / avgLatency * 100) / 100
            });
        }

        return results;
    }

    /**
     * Run comparative benchmark
     * 
     * @param {Array} testQueries
     * @returns {Promise<Object>}
     */
    async runComparison(testQueries) {
        const results = await this.run(testQueries);
        
        // Find best performer for each metric
        const rankings = {};
        const metricNames = Object.keys(results[0]?.metrics || {}).filter(
            k => typeof results[0].metrics[k] === 'number'
        );

        for (const metric of metricNames) {
            const sorted = [...results].sort(
                (a, b) => (b.metrics[metric] || 0) - (a.metrics[metric] || 0)
            );
            rankings[metric] = sorted.map((r, i) => ({
                rank: i + 1,
                name: r.name,
                value: r.metrics[metric]
            }));
        }

        // Overall ranking
        const overallScores = results.map(r => ({
            name: r.name,
            score: r.summary.overallScore,
            latency: r.latency.average
        }));

        return {
            results,
            rankings,
            overall: overallScores.sort((a, b) => b.score - a.score),
            fastest: [...results].sort((a, b) => a.latency.average - b.latency.average)[0]?.name
        };
    }

    /**
     * Print benchmark report to console
     * 
     * @param {BenchmarkResult[]} results
     */
    printReport(results) {
        console.log('\n' + '='.repeat(70));
        console.log('BENCHMARK RESULTS');
        console.log('='.repeat(70));

        for (const result of results) {
            console.log(`\n📊 ${result.name}`);
            console.log('-'.repeat(40));
            
            // Key metrics
            console.log(`  MRR:           ${this._formatMetric(result.metrics.mrr)}`);
            console.log(`  MAP:           ${this._formatMetric(result.metrics.map)}`);
            console.log(`  NDCG@5:        ${this._formatMetric(result.metrics['ndcg@5'])}`);
            console.log(`  Recall@10:     ${this._formatMetric(result.metrics['recall@10'])}`);
            console.log(`  Precision@3:   ${this._formatMetric(result.metrics['precision@3'])}`);
            
            // Performance
            console.log(`  Avg Latency:   ${result.latency.average}ms`);
            console.log(`  Throughput:    ${result.throughput} qps`);
            console.log(`  Overall Score: ${result.summary.overallScore}/100`);
        }

        // Comparison table
        if (results.length > 1) {
            console.log('\n' + '='.repeat(70));
            console.log('COMPARISON TABLE');
            console.log('='.repeat(70));
            
            const header = ['Metric', ...results.map(r => r.name)];
            console.log(header.join('\t'));
            
            const metrics = ['mrr', 'map', 'ndcg@5', 'recall@10', 'precision@3'];
            for (const metric of metrics) {
                const row = [metric, ...results.map(r => 
                    this._formatMetric(r.metrics[metric])
                )];
                console.log(row.join('\t'));
            }
        }

        console.log('\n' + '='.repeat(70));
    }

    /**
     * Export results to JSON
     * @param {BenchmarkResult[]} results
     * @returns {string}
     */
    exportJSON(results) {
        return JSON.stringify({
            timestamp: new Date().toISOString(),
            results
        }, null, 2);
    }

    /**
     * Calculate percentile
     * @private
     */
    _percentile(arr, p) {
        const sorted = [...arr].sort((a, b) => a - b);
        const index = Math.ceil((p / 100) * sorted.length) - 1;
        return Math.round(sorted[index] * 100) / 100;
    }

    /**
     * Format metric for display
     * @private
     */
    _formatMetric(value) {
        if (value === undefined) return 'N/A';
        return (Math.round(value * 1000) / 1000).toFixed(3);
    }
}

/**
 * Create test dataset from documents
 * 
 * @param {Array} documents - Documents with id and text
 * @param {Object} [options]
 * @returns {Array} Test queries
 */
export function createTestDataset(documents, options = {}) {
    const queriesPerDoc = options.queriesPerDoc || 1;
    const testQueries = [];

    for (const doc of documents) {
        // Extract potential queries from document
        const sentences = doc.text
            .split(/[.!?]+/)
            .filter(s => s.trim().length > 20 && s.trim().length < 200)
            .slice(0, queriesPerDoc);

        for (const sentence of sentences) {
            testQueries.push({
                query: sentence.trim(),
                relevantDocs: [doc.id],
                sourceDoc: doc.id
            });
        }
    }

    return testQueries;
}

/**
 * Load test dataset from JSON
 * 
 * @param {string} path - Path to JSON file
 * @returns {Promise<Array>}
 */
export async function loadTestDataset(path) {
    const fs = await import('fs/promises');
    const content = await fs.readFile(path, 'utf-8');
    return JSON.parse(content);
}

/**
 * Save benchmark results
 * 
 * @param {BenchmarkResult[]} results
 * @param {string} path
 */
export async function saveBenchmarkResults(results, path) {
    const fs = await import('fs/promises');
    const runner = new BenchmarkRunner();
    await fs.writeFile(path, runner.exportJSON(results));
}

export default BenchmarkRunner;
