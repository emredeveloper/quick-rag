/**
 * Test file for Phase 1 Features: Advanced Search & Query Transformation
 * 
 * Tests:
 * 1. BM25 sparse search
 * 2. Hybrid search (BM25 + Vector)
 * 3. Reranker
 * 4. Query transformation
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

import { BM25, tokenize } from '../src/search/bm25.js';
import { HybridRetriever, reciprocalRankFusion, linearCombination } from '../src/search/hybridSearch.js';
import { Reranker, createRerankedRetriever, ngramOverlap, calculateCoverage } from '../src/search/reranker.js';
import { 
    QueryTransformer, 
    QueryExpander, 
    QueryDecomposer, 
    MultiQueryGenerator 
} from '../src/query/queryTransformer.js';
import { InMemoryVectorStore } from '../src/vectorStore.js';
import { Retriever } from '../src/retriever.js';

// Mock embedding function for testing
const mockEmbedding = async (text) => {
    // Simple hash-based mock embedding
    const hash = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return Array(128).fill(0).map((_, i) => Math.sin(hash + i) * 0.5 + 0.5);
};

// Test documents
const testDocs = [
    { id: 'doc1', text: 'JavaScript is a dynamic programming language used for web development.', meta: { type: 'language' } },
    { id: 'doc2', text: 'Python is popular for machine learning and data science applications.', meta: { type: 'language' } },
    { id: 'doc3', text: 'RAG combines retrieval with generation for accurate AI responses.', meta: { type: 'concept' } },
    { id: 'doc4', text: 'Vector embeddings convert text into numerical representations for similarity search.', meta: { type: 'concept' } },
    { id: 'doc5', text: 'BM25 is a ranking function used in information retrieval based on term frequency.', meta: { type: 'algorithm' } },
    { id: 'doc6', text: 'Hybrid search combines keyword matching with semantic vector search.', meta: { type: 'technique' } }
];

// ========================================
// BM25 Tests
// ========================================
describe('BM25 Sparse Search', () => {
    let bm25;

    beforeEach(() => {
        bm25 = new BM25();
        bm25.addDocuments(testDocs);
    });

    it('should tokenize text correctly', () => {
        const tokens = tokenize('JavaScript is amazing!');
        assert.ok(tokens.includes('javascript'));
        assert.ok(tokens.includes('amaz')); // stemmed
        // 'is' might be included since length > 1, that's ok
    });

    it('should add documents and calculate statistics', () => {
        const stats = bm25.getStats();
        assert.strictEqual(stats.documentCount, 6);
        assert.ok(stats.uniqueTerms > 0);
        assert.ok(stats.averageDocumentLength > 0);
    });

    it('should search and return relevant results', () => {
        const results = bm25.search('JavaScript programming', 3);
        assert.ok(results.length > 0);
        assert.strictEqual(results[0].id, 'doc1'); // Most relevant
        assert.ok(results[0].score > 0);
    });

    it('should apply metadata filter', () => {
        const results = bm25.search('programming language', 10, {
            filter: (meta) => meta.type === 'language'
        });
        assert.ok(results.every(r => r.meta.type === 'language'));
    });

    it('should handle empty query', () => {
        const results = bm25.search('', 3);
        assert.strictEqual(results.length, 0);
    });

    it('should remove documents correctly', () => {
        const removed = bm25.removeDocument('doc1');
        assert.strictEqual(removed, true);
        assert.strictEqual(bm25.getStats().documentCount, 5);
        
        const results = bm25.search('JavaScript', 3);
        assert.ok(!results.some(r => r.id === 'doc1'));
    });

    it('should export and import index', () => {
        const exported = bm25.export();
        
        const newBm25 = new BM25();
        newBm25.import(exported);
        
        const stats = newBm25.getStats();
        assert.strictEqual(stats.documentCount, 6);
    });
});

// ========================================
// Hybrid Search Tests
// ========================================
describe('Hybrid Search', () => {
    let hybridRetriever;
    let vectorStore;

    beforeEach(async () => {
        vectorStore = new InMemoryVectorStore(mockEmbedding);
        await vectorStore.addDocuments(testDocs);
        
        hybridRetriever = new HybridRetriever(vectorStore, {
            alpha: 0.5,
            fusionMethod: 'rrf'
        });
    });

    it('should combine BM25 and vector search results', async () => {
        const results = await hybridRetriever.search('vector embeddings', 3);
        
        assert.ok(results.length > 0);
        assert.ok(results[0].score > 0);
        assert.ok(results[0].text);
    });

    it('should include explanation when requested', async () => {
        const results = await hybridRetriever.search('RAG retrieval', 3, { explain: true });
        
        assert.ok(results.length > 0);
        assert.ok(results[0].explanation);
        assert.ok('denseScore' in results[0].explanation);
        assert.ok('sparseScore' in results[0].explanation);
    });

    it('should use RRF fusion correctly', async () => {
        const rankedLists = [
            [{ id: 'a', score: 0.9 }, { id: 'b', score: 0.7 }],
            [{ id: 'b', score: 0.95 }, { id: 'a', score: 0.6 }]
        ];
        
        const scores = reciprocalRankFusion(rankedLists, 60);
        
        // 'b' appears first in one list and second in another, should have high score
        assert.ok(scores.has('a'));
        assert.ok(scores.has('b'));
    });

    it('should use linear combination correctly', () => {
        const denseResults = [{ id: 'a', score: 0.8 }];
        const sparseResults = [{ id: 'a', score: 0.6 }, { id: 'b', score: 0.9 }];
        
        const scores = linearCombination(denseResults, sparseResults, 0.5);
        
        assert.ok(scores.has('a'));
        assert.ok(scores.has('b'));
    });

    it('should sync BM25 automatically', async () => {
        // Need to perform a search first to trigger sync
        await hybridRetriever.search('test query', 1);
        const stats = hybridRetriever.getStats();
        assert.ok(stats.bm25Stats.documentCount > 0);
    });
});

// ========================================
// Reranker Tests
// ========================================
describe('Reranker', () => {
    let reranker;

    beforeEach(() => {
        reranker = new Reranker({
            keywordWeight: 0.3,
            semanticWeight: 0.4,
            coverageWeight: 0.2,
            coherenceWeight: 0.1
        });
    });

    it('should rerank results based on multiple signals', () => {
        const results = [
            { id: 'doc1', text: 'Python is great for data science', score: 0.6 },
            { id: 'doc2', text: 'Machine learning with Python programming', score: 0.8 },
            { id: 'doc3', text: 'JavaScript web development', score: 0.7 }
        ];

        const reranked = reranker.rerank('Python machine learning', results);

        assert.ok(reranked.length === 3);
        // Doc2 should be ranked higher due to keyword match
        assert.ok(reranked[0].score >= reranked[1].score);
    });

    it('should include explanation when requested', () => {
        const results = [
            { id: 'doc1', text: 'Vector search for retrieval', score: 0.7 }
        ];

        const reranked = reranker.rerank('vector retrieval', results, { explain: true });

        assert.ok(reranked[0].rerankExplanation);
        assert.ok('keywordScore' in reranked[0].rerankExplanation);
        assert.ok('matchedTerms' in reranked[0].rerankExplanation);
    });

    it('should calculate n-gram overlap correctly', () => {
        const tokens1 = ['machine', 'learning', 'model'];
        const tokens2 = ['machine', 'learning', 'algorithm'];

        const overlap = ngramOverlap(tokens1, tokens2, 2);
        assert.ok(overlap > 0); // "machine learning" bigram matches
    });

    it('should calculate coverage correctly', () => {
        const queryTokens = ['python', 'machine', 'learning'];
        const docTokens = ['python', 'is', 'great', 'for', 'machine', 'learning'];

        const coverage = calculateCoverage(queryTokens, docTokens);
        assert.strictEqual(coverage.coverage, 1); // All query terms found
        assert.strictEqual(coverage.matchCount, 3);
    });

    it('should limit results with topK', () => {
        const results = Array(10).fill(null).map((_, i) => ({
            id: `doc${i}`,
            text: `Document ${i} about testing`,
            score: Math.random()
        }));

        const reranked = reranker.rerank('testing', results, { topK: 3 });
        assert.strictEqual(reranked.length, 3);
    });
});

// ========================================
// Query Transformation Tests
// ========================================
describe('Query Transformer', () => {
    describe('QueryExpander', () => {
        let expander;

        beforeEach(() => {
            expander = new QueryExpander();
        });

        it('should expand query with synonyms', () => {
            const result = expander.expand('javascript api');
            
            assert.ok(result.addedTerms.length > 0);
            assert.ok(result.expanded.includes('js') || 
                      result.expanded.includes('endpoint'));
        });

        it('should allow adding custom synonyms', () => {
            expander.addSynonyms('test', ['testing', 'spec', 'unit test']);
            const result = expander.expand('test code');
            
            assert.ok(result.addedTerms.some(t => 
                ['testing', 'spec', 'unit test'].includes(t)
            ));
        });

        it('should not add duplicates', () => {
            const result = expander.expand('javascript js');
            const uniqueTerms = [...new Set(result.expanded.split(' '))];
            assert.strictEqual(uniqueTerms.length, result.expanded.split(' ').length);
        });
    });

    describe('QueryDecomposer', () => {
        let decomposer;

        beforeEach(() => {
            decomposer = new QueryDecomposer();
        });

        it('should decompose conjunction queries', () => {
            const result = decomposer.decompose('What is Python and how to use it?');
            assert.ok(result.subQueries.length >= 1);
        });

        it('should decompose comparison queries', () => {
            const result = decomposer.decompose('Compare JavaScript with Python');
            assert.ok(result.subQueries.length >= 2);
            assert.strictEqual(result.type, 'comparison');
        });

        it('should return simple queries unchanged', () => {
            const result = decomposer.decompose('What is RAG?');
            assert.strictEqual(result.type, 'simple');
            assert.strictEqual(result.subQueries.length, 1);
        });
    });

    describe('MultiQueryGenerator', () => {
        let generator;

        beforeEach(() => {
            generator = new MultiQueryGenerator();
        });

        it('should generate query variations', () => {
            const result = generator.generateVariations('machine learning basics');
            
            assert.ok(result.variations.length >= 1);
            assert.ok(result.variations.includes('machine learning basics'));
        });

        it('should add question forms', () => {
            const result = generator.generateVariations('vector database');
            
            assert.ok(result.variations.some(v => 
                v.includes('What is') || v.includes('How does')
            ));
        });
    });

    describe('Combined QueryTransformer', () => {
        let transformer;

        beforeEach(() => {
            transformer = new QueryTransformer({
                enableHyDE: false, // No LLM
                enableExpansion: true,
                enableDecomposition: true,
                enableMultiQuery: true
            });
        });

        it('should combine multiple transformation techniques', async () => {
            const result = await transformer.transform('JavaScript and Python comparison');
            
            assert.ok(result.queries.length > 1);
            assert.ok(result.transformations.expansion);
            assert.ok(result.transformations.decomposition);
            assert.ok(result.transformations.multiQuery);
        });

        it('should remove duplicate queries', async () => {
            const result = await transformer.transform('What is RAG?');
            const uniqueQueries = [...new Set(result.queries)];
            assert.strictEqual(result.queries.length, uniqueQueries.length);
        });
    });
});

// ========================================
// Integration Tests
// ========================================
describe('Integration: Full Pipeline', () => {
    it('should work with reranked hybrid retriever', async () => {
        // Setup
        const vectorStore = new InMemoryVectorStore(mockEmbedding);
        await vectorStore.addDocuments(testDocs);
        
        const hybridRetriever = new HybridRetriever(vectorStore);
        const rerankedRetriever = createRerankedRetriever(hybridRetriever);
        
        // Query
        const results = await rerankedRetriever.getRelevant('BM25 ranking algorithm', 3);
        
        assert.ok(results.length > 0);
        assert.ok(results[0].text.toLowerCase().includes('bm25') || 
                  results[0].text.toLowerCase().includes('ranking'));
    });

    it('should transform query before search', async () => {
        const expander = new QueryExpander();
        const expanded = expander.expand('ml model');
        
        const bm25 = new BM25();
        bm25.addDocuments(testDocs);
        
        // Search with expanded query should find more results
        const originalResults = bm25.search('ml model', 5);
        const expandedResults = bm25.search(expanded.expanded, 5);
        
        // Expanded search should potentially find more
        assert.ok(expandedResults.length >= originalResults.length);
    });
});

console.log('Running Phase 1 Tests...');
