/**
 * Metrics Collection and Tracking
 * 
 * Tracks performance metrics for RAG operations
 */

/**
 * Metrics store
 */
class MetricsCollector {
    constructor() {
        this.metrics = {
            queries: [],
            embeddings: [],
            retrievals: [],
            generations: [],
            errors: []
        };
        this.startTime = Date.now();
    }

    /**
     * Record query metrics
     */
    recordQuery(query, results, duration) {
        this.metrics.queries.push({
            timestamp: Date.now(),
            query,
            resultCount: results.length,
            topScore: results[0]?.score || 0,
            duration
        });
    }

    /**
     * Record embedding metrics
     */
    recordEmbedding(docCount, dimension, duration) {
        this.metrics.embeddings.push({
            timestamp: Date.now(),
            docCount,
            dimension,
            duration,
            throughput: docCount / (duration / 1000) // docs per second
        });
    }

    /**
     * Record retrieval metrics
     */
    recordRetrieval(query, k, resultsCount, duration) {
        this.metrics.retrievals.push({
            timestamp: Date.now(),
            query,
            k,
            resultsCount,
            duration
        });
    }

    /**
     * Record generation metrics
     */
    recordGeneration(model, promptLength, responseLength, duration) {
        this.metrics.generations.push({
            timestamp: Date.now(),
            model,
            promptLength,
            responseLength,
            duration,
            tokensPerSecond: responseLength / (duration / 1000)
        });
    }

    /**
     * Record error
     */
    recordError(operation, error, context = {}) {
        this.metrics.errors.push({
            timestamp: Date.now(),
            operation,
            error: error.message,
            code: error.code,
            ...context
        });
    }

    /**
     * Get summary statistics
     */
    getSummary() {
        const uptime = Date.now() - this.startTime;

        return {
            uptime,
            queries: {
                total: this.metrics.queries.length,
                avgDuration: this._avg(this.metrics.queries, 'duration'),
                avgTopScore: this._avg(this.metrics.queries, 'topScore')
            },
            embeddings: {
                total: this.metrics.embeddings.length,
                totalDocs: this._sum(this.metrics.embeddings, 'docCount'),
                avgDuration: this._avg(this.metrics.embeddings, 'duration'),
                avgThroughput: this._avg(this.metrics.embeddings, 'throughput')
            },
            retrievals: {
                total: this.metrics.retrievals.length,
                avgDuration: this._avg(this.metrics.retrievals, 'duration'),
                avgResults: this._avg(this.metrics.retrievals, 'resultsCount')
            },
            generations: {
                total: this.metrics.generations.length,
                avgDuration: this._avg(this.metrics.generations, 'duration'),
                avgTokensPerSec: this._avg(this.metrics.generations, 'tokensPerSecond')
            },
            errors: {
                total: this.metrics.errors.length,
                rate: (this.metrics.errors.length / (uptime / 1000)).toFixed(4)
            }
        };
    }

    /**
     * Get raw metrics
     */
    getRawMetrics() {
        return { ...this.metrics };
    }

    /**
     * Export to JSON
     */
    exportJSON() {
        return JSON.stringify({
            summary: this.getSummary(),
            raw: this.getRawMetrics()
        }, null, 2);
    }

    /**
     * Export to Prometheus format
     */
    exportPrometheus() {
        const summary = this.getSummary();
        const lines = [];

        // Queries
        lines.push(`# HELP rag_queries_total Total number of queries`);
        lines.push(`# TYPE rag_queries_total counter`);
        lines.push(`rag_queries_total ${summary.queries.total}`);

        lines.push(`# HELP rag_query_duration_avg Average query duration in ms`);
        lines.push(`# TYPE rag_query_duration_avg gauge`);
        lines.push(`rag_query_duration_avg ${summary.queries.avgDuration}`);

        // Embeddings
        lines.push(`# HELP rag_embeddings_total Total number of embedding operations`);
        lines.push(`# TYPE rag_embeddings_total counter`);
        lines.push(`rag_embeddings_total ${summary.embeddings.total}`);

        lines.push(`# HELP rag_documents_embedded Total documents embedded`);
        lines.push(`# TYPE rag_documents_embedded counter`);
        lines.push(`rag_documents_embedded ${summary.embeddings.totalDocs}`);

        // Errors
        lines.push(`# HELP rag_errors_total Total number of errors`);
        lines.push(`# TYPE rag_errors_total counter`);
        lines.push(`rag_errors_total ${summary.errors.total}`);

        return lines.join('\n');
    }

    /**
     * Reset metrics
     */
    reset() {
        this.metrics = {
            queries: [],
            embeddings: [],
            retrievals: [],
            generations: [],
            errors: []
        };
        this.startTime = Date.now();
    }

    // Helper methods
    _avg(arr, key) {
        if (arr.length === 0) return 0;
        return (this._sum(arr, key) / arr.length).toFixed(2);
    }

    _sum(arr, key) {
        return arr.reduce((sum, item) => sum + (item[key] || 0), 0);
    }
}

// Global metrics instance
export const metrics = new MetricsCollector();

/**
 * Decorator to measure function performance
 */
export function measured(type) {
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args) {
            const start = Date.now();
            try {
                const result = await originalMethod.apply(this, args);
                const duration = Date.now() - start;

                // Record based on type
                switch (type) {
                    case 'query':
                        metrics.recordQuery(args[0], result, duration);
                        break;
                    case 'embedding':
                        metrics.recordEmbedding(args[0]?.length || 1, args[1] || 768, duration);
                        break;
                    case 'retrieval':
                        metrics.recordRetrieval(args[0], args[1] || 3, result?.length || 0, duration);
                        break;
                }

                return result;
            } catch (error) {
                metrics.recordError(propertyKey, error);
                throw error;
            }
        };

        return descriptor;
    };
}

export default metrics;
