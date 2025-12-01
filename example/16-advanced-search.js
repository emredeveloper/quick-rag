/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ADVANCED SEARCH DEMO - Phase 1 Features
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Bu örnek Phase 1'de eklenen gelişmiş arama özelliklerini gösterir:
 * 
 *   1. BM25 Sparse Search   - Keyword tabanlı arama (no dependencies)
 *   2. Query Expansion      - Sorgu genişletme (eşanlamlılar)
 *   3. Query Decomposition  - Karmaşık sorguları parçalama
 *   4. Reranking           - Sonuçları yeniden sıralama
 *   5. Hybrid Search       - BM25 + Vector arama kombinasyonu
 *   6. Full RAG Pipeline   - Tüm özelliklerin birlikte kullanımı
 * 
 * Kullanım:
 *   node example/16-advanced-search.js              # Ollama ile çalıştır
 *   node example/16-advanced-search.js --lmstudio   # LM Studio ile çalıştır
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import {
    // Ollama Client
    OllamaRAGClient,
    createOllamaRAGEmbedding,
    
    // LM Studio Client
    LMStudioRAGClient,
    createLMStudioRAGEmbedding,
    
    // Core Components
    InMemoryVectorStore,
    Retriever,
    generateWithRAG,
    
    // Phase 1: Advanced Search
    BM25,
    HybridRetriever,
    Reranker,
    createRerankedRetriever,
    
    // Phase 1: Query Transformation
    QueryExpander,
    QueryDecomposer
} from '../src/index.js';

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
    ollama: {
        model: 'granite4:3b',
        embeddingModel: 'nomic-embed-text',
        baseUrl: 'http://127.0.0.1:11434'
    },
    lmstudio: {
        model: 'qwen/qwen3-4b-2507',
        embeddingModel: 'text-embedding-embeddinggemma-300m',
        // LM Studio SDK uses WebSocket, no baseUrl needed (auto-discovery)
        baseUrl: null
    }
};

// Parse command line arguments
const useLMStudio = process.argv.includes('--lmstudio');
const provider = useLMStudio ? 'lmstudio' : 'ollama';

// ═══════════════════════════════════════════════════════════════════════════════
// SAMPLE DOCUMENTS
// ═══════════════════════════════════════════════════════════════════════════════

const SAMPLE_DOCUMENTS = [
    {
        id: 'doc-bm25',
        text: 'BM25 (Best Matching 25) is a bag-of-words ranking function used in information retrieval. It ranks documents based on the query terms appearing in each document, regardless of their proximity.',
        meta: { topic: 'algorithms', difficulty: 'intermediate' }
    },
    {
        id: 'doc-vector',
        text: 'Vector search uses embeddings to find semantically similar documents. Unlike keyword search, it can find documents even when they dont contain the exact query terms.',
        meta: { topic: 'search', difficulty: 'intermediate' }
    },
    {
        id: 'doc-hybrid',
        text: 'Hybrid search combines the best of both worlds: BM25 for exact keyword matching and vector search for semantic understanding. This typically improves retrieval quality by 20-30%.',
        meta: { topic: 'search', difficulty: 'advanced' }
    },
    {
        id: 'doc-rag',
        text: 'RAG (Retrieval-Augmented Generation) enhances LLM responses by first retrieving relevant documents and then using them as context for generation.',
        meta: { topic: 'rag', difficulty: 'beginner' }
    },
    {
        id: 'doc-rerank',
        text: 'Reranking is a technique to improve search results by re-scoring the initial retrieval using more sophisticated models or algorithms. Cross-encoders are commonly used for reranking.',
        meta: { topic: 'algorithms', difficulty: 'advanced' }
    },
    {
        id: 'doc-expansion',
        text: 'Query expansion adds related terms to the original query to improve recall. For example, expanding "ML" to include "machine learning" helps find more relevant documents.',
        meta: { topic: 'search', difficulty: 'intermediate' }
    },
    {
        id: 'doc-hyde',
        text: 'HyDE (Hypothetical Document Embeddings) is a technique where the LLM first generates a hypothetical answer, which is then used for retrieval instead of the original query.',
        meta: { topic: 'rag', difficulty: 'advanced' }
    },
    {
        id: 'doc-rrf',
        text: 'Reciprocal Rank Fusion (RRF) is a method to combine rankings from multiple retrieval systems. It assigns scores based on rank position rather than raw scores.',
        meta: { topic: 'algorithms', difficulty: 'advanced' }
    }
];

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Print a section header
 */
function printHeader(title, emoji = '📌') {
    console.log('\n' + '─'.repeat(75));
    console.log(`${emoji} ${title}`);
    console.log('─'.repeat(75) + '\n');
}

/**
 * Print a major section divider
 */
function printMajorDivider(title) {
    console.log('\n' + '═'.repeat(75));
    console.log(`🚀 ${title}`);
    console.log('═'.repeat(75) + '\n');
}

/**
 * Truncate text for display
 */
function truncate(text, maxLength = 70) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * Create the appropriate client based on provider
 */
async function createClient() {
    if (useLMStudio) {
        console.log('🔌 Connecting to LM Studio...');
        const client = new LMStudioRAGClient(); // No config needed, auto-discovery
        
        // Test connection by listing loaded models
        try {
            await client.listLoaded();
            console.log('✅ LM Studio connected successfully\n');
            return {
                client,
                model: CONFIG.lmstudio.model,
                embeddingModel: CONFIG.lmstudio.embeddingModel,
                createEmbedding: (c, m) => createLMStudioRAGEmbedding(c, m)
            };
        } catch (error) {
            throw new Error('LM Studio not available. Start LM Studio and load a model.');
        }
    } else {
        console.log('🔌 Connecting to Ollama...');
        const client = new OllamaRAGClient({ host: CONFIG.ollama.baseUrl });
        
        // Test connection
        try {
            await client.list();
            console.log('✅ Ollama connected successfully\n');
            return {
                client,
                model: CONFIG.ollama.model,
                embeddingModel: CONFIG.ollama.embeddingModel,
                createEmbedding: (c, m) => createOllamaRAGEmbedding(c, m)
            };
        } catch (error) {
            throw new Error('Ollama not available. Run: ollama serve');
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEMO FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * DEMO 1: BM25 Sparse Search
 * 
 * BM25, vector DB gerektirmeden keyword tabanlı arama yapar.
 * Exact term matching için idealdir.
 */
function demoBM25Search() {
    printHeader('DEMO 1: BM25 Sparse Search (Keyword-based)');
    
    // BM25 index oluştur
    const bm25 = new BM25({ 
        k1: 1.2,  // Term frequency saturation
        b: 0.75   // Length normalization
    });
    
    // Dokümanları indexle
    bm25.addDocuments(SAMPLE_DOCUMENTS);
    
    // Index istatistiklerini göster
    const stats = bm25.getStats();
    console.log('📊 Index Statistics:');
    console.log(`   • Documents: ${stats.documentCount}`);
    console.log(`   • Unique Terms: ${stats.uniqueTerms}`);
    console.log(`   • Avg Doc Length: ${stats.averageDocumentLength.toFixed(1)} terms`);
    console.log('');
    
    // Arama yap
    const query = 'BM25 ranking algorithm';
    const results = bm25.search(query, 3);
    
    console.log(`🔍 Query: "${query}"\n`);
    console.log('📋 Top 3 Results:');
    results.forEach((result, index) => {
        console.log(`   ${index + 1}. [Score: ${result.score.toFixed(3)}]`);
        console.log(`      ${truncate(result.text)}`);
    });
    
    return bm25;
}

/**
 * DEMO 2: Query Expansion
 * 
 * Sorguya eşanlamlı terimler ekleyerek recall'u artırır.
 */
function demoQueryExpansion(bm25) {
    printHeader('DEMO 2: Query Expansion');
    
    // Query expander oluştur
    const expander = new QueryExpander();
    
    // Custom domain synonyms ekle
    expander.addSynonyms('rag', ['retrieval augmented generation', 'retrieval']);
    expander.addSynonyms('bm25', ['best matching', 'okapi', 'ranking function']);
    expander.addSynonyms('ml', ['machine learning', 'artificial intelligence']);
    
    // Kısa bir sorguyu genişlet
    const originalQuery = 'rag search';
    const expanded = expander.expand(originalQuery);
    
    console.log('📝 Original Query:');
    console.log(`   "${originalQuery}"\n`);
    
    console.log('📝 Expanded Query:');
    console.log(`   "${expanded.expanded}"\n`);
    
    console.log('➕ Added Terms:');
    expanded.addedTerms.forEach(term => {
        console.log(`   • ${term}`);
    });
    console.log('');
    
    // Sonuçları karşılaştır
    const originalResults = bm25.search(originalQuery, 5);
    const expandedResults = bm25.search(expanded.expanded, 5);
    
    console.log('📊 Comparison:');
    console.log(`   • Original query results: ${originalResults.length}`);
    console.log(`   • Expanded query results: ${expandedResults.length}`);
}

/**
 * DEMO 3: Query Decomposition
 * 
 * Karmaşık sorguları alt sorgulara ayırır.
 */
function demoQueryDecomposition() {
    printHeader('DEMO 3: Query Decomposition');
    
    const decomposer = new QueryDecomposer();
    
    // Karmaşık sorguları test et
    const complexQueries = [
        'Compare BM25 with vector search and explain which is better',
        'What is RAG and how does it work with LLMs?',
        'Explain hybrid search, reranking, and query expansion'
    ];
    
    complexQueries.forEach((query, index) => {
        const result = decomposer.decompose(query);
        
        console.log(`📝 Query ${index + 1}:`);
        console.log(`   "${query}"\n`);
        console.log(`   Type: ${result.type}`);
        console.log('   Sub-queries:');
        result.subQueries.forEach((subQuery, i) => {
            console.log(`      ${i + 1}. ${subQuery}`);
        });
        console.log('');
    });
}

/**
 * DEMO 4: Reranking
 * 
 * İlk sonuçları multi-signal scoring ile yeniden sıralar.
 */
function demoReranking(bm25) {
    printHeader('DEMO 4: Reranking Results');
    
    // Reranker oluştur
    const reranker = new Reranker({
        keywordWeight: 0.35,   // Keyword eşleşme ağırlığı
        semanticWeight: 0.35, // Semantic benzerlik ağırlığı
        coverageWeight: 0.20, // Query coverage ağırlığı
        coherenceWeight: 0.10 // Coherence ağırlığı
    });
    
    const query = 'hybrid search retrieval';
    
    // İlk sonuçları al
    const initialResults = bm25.search(query, 5);
    
    // Rerank yap
    const rerankedResults = reranker.rerank(query, initialResults, { explain: true });
    
    console.log(`🔍 Query: "${query}"\n`);
    
    // Before vs After karşılaştırması
    console.log('📋 Before Reranking:');
    initialResults.forEach((result, index) => {
        console.log(`   ${index + 1}. [${result.score.toFixed(3)}] ${result.id}`);
    });
    
    console.log('\n📋 After Reranking:');
    rerankedResults.forEach((result, index) => {
        const exp = result.rerankExplanation;
        console.log(`   ${index + 1}. [${result.score.toFixed(3)}] ${result.id}`);
        console.log(`      Keywords: ${exp.keywordScore.toFixed(3)} | Coverage: ${exp.coverageScore.toFixed(3)}`);
        console.log(`      Matched: [${exp.matchedTerms.join(', ')}]`);
    });
    
    return reranker;
}

/**
 * DEMO 5: Hybrid Search (Vector + BM25)
 * 
 * Vector search ve BM25'i RRF ile birleştirir.
 */
async function demoHybridSearch(clientInfo) {
    printHeader('DEMO 5: Hybrid Search (Vector + BM25)');
    
    const { client, embeddingModel, createEmbedding } = clientInfo;
    
    // Embedding function oluştur
    const embed = createEmbedding(client, embeddingModel);
    
    // Vector store oluştur
    console.log('📦 Creating vector store and embedding documents...\n');
    const vectorStore = new InMemoryVectorStore(embed);
    
    await vectorStore.addDocuments(SAMPLE_DOCUMENTS, {
        batchSize: 4,
        onProgress: (current, total) => {
            process.stdout.write(`   Progress: ${current}/${total}\r`);
        }
    });
    console.log('   ✅ All documents embedded\n');
    
    // Hybrid retriever oluştur
    const hybridRetriever = new HybridRetriever(vectorStore, {
        alpha: 0.5,           // Dense vs Sparse balance (0.5 = eşit ağırlık)
        fusionMethod: 'rrf',  // Reciprocal Rank Fusion
        rrfK: 60              // RRF smoothing factor
    });
    
    // Regular retriever (sadece vector)
    const vectorRetriever = new Retriever(vectorStore);
    
    const query = 'how to improve search quality with ranking';
    console.log(`🔍 Query: "${query}"\n`);
    
    // Vector-only sonuçlar
    const vectorResults = await vectorRetriever.getRelevant(query, 3);
    console.log('📋 Vector-only Results:');
    vectorResults.forEach((result, index) => {
        console.log(`   ${index + 1}. [${result.score.toFixed(3)}] ${truncate(result.text, 55)}`);
    });
    
    // Hybrid sonuçlar
    const hybridResults = await hybridRetriever.search(query, 3, { explain: true });
    console.log('\n📋 Hybrid Search Results (Vector + BM25):');
    hybridResults.forEach((result, index) => {
        const exp = result.explanation || {};
        console.log(`   ${index + 1}. [${result.score.toFixed(3)}] ${truncate(result.text, 55)}`);
        console.log(`      Dense: ${(exp.denseScore || 0).toFixed(3)} | Sparse: ${(exp.sparseScore || 0).toFixed(3)}`);
    });
    
    return { vectorStore, hybridRetriever };
}

/**
 * DEMO 6: Full Pipeline (Hybrid + Reranking)
 * 
 * Tüm özellikleri birleştirir: Hybrid search + Reranking
 */
async function demoFullPipeline(hybridRetriever) {
    printHeader('DEMO 6: Full Pipeline (Hybrid + Reranking)');
    
    // Reranked hybrid retriever oluştur
    const rerankedRetriever = createRerankedRetriever(hybridRetriever, {
        keywordWeight: 0.30,
        semanticWeight: 0.40,
        coverageWeight: 0.20,
        coherenceWeight: 0.10
    });
    
    const query = 'best techniques for improving retrieval accuracy';
    console.log(`🔍 Query: "${query}"\n`);
    
    // Sonuçları al
    const results = await rerankedRetriever.getRelevant(query, 3, { explain: true });
    
    console.log('📋 Final Reranked Results:');
    results.forEach((result, index) => {
        console.log(`   ${index + 1}. [Score: ${result.score.toFixed(3)}]`);
        console.log(`      ${truncate(result.text, 65)}`);
        if (result.rerankExplanation) {
            console.log(`      Matched Terms: [${result.rerankExplanation.matchedTerms.join(', ')}]`);
        }
    });
    
    return rerankedRetriever;
}

/**
 * DEMO 7: RAG Generation
 * 
 * Advanced retrieval + LLM generation
 */
async function demoRAGGeneration(clientInfo, rerankedRetriever) {
    printHeader('DEMO 7: RAG Generation with Advanced Retrieval');
    
    const { client, model } = clientInfo;
    
    const question = 'What is hybrid search and why is it better than regular search?';
    console.log(`❓ Question: "${question}"\n`);
    
    // En iyi sonuçları al
    const results = await rerankedRetriever.getRelevant(question, 3);
    
    console.log('📚 Retrieved Context:');
    results.forEach((result, index) => {
        console.log(`   ${index + 1}. ${truncate(result.text, 60)}`);
    });
    console.log('');
    
    // LLM ile cevap üret
    console.log('💭 Generating response...\n');
    
    const response = await generateWithRAG(client, model, question, results, {
        context: { includeScores: true }
    });
    
    console.log('🤖 Generated Response:');
    console.log('─'.repeat(75));
    console.log(response.response);
    console.log('─'.repeat(75));
}

/**
 * Print summary of all features
 */
function printSummary() {
    printMajorDivider('SUMMARY: Phase 1 Features');
    
    console.log(`
┌─────────────────────────────────────────────────────────────────────────┐
│  ✅ BM25 Sparse Search                                                  │
│     • Pure JavaScript implementation, no external dependencies          │
│     • Fast keyword-based retrieval with TF-IDF scoring                  │
│     • Configurable k1 and b parameters                                  │
├─────────────────────────────────────────────────────────────────────────┤
│  ✅ Hybrid Search                                                       │
│     • Combines BM25 (sparse) + Vector (dense) search                    │
│     • Reciprocal Rank Fusion (RRF) or Linear fusion                     │
│     • Typically 20-30% better retrieval quality                         │
├─────────────────────────────────────────────────────────────────────────┤
│  ✅ Reranker                                                            │
│     • Multi-signal scoring (keyword, semantic, coverage, coherence)     │
│     • Improves top-K precision significantly                            │
│     • Configurable weights for each signal                              │
├─────────────────────────────────────────────────────────────────────────┤
│  ✅ Query Transformation                                                │
│     • Query Expansion: Adds synonyms and related terms                  │
│     • Query Decomposition: Splits complex queries into sub-queries      │
│     • Multi-Query Generation: Creates query variations                  │
│     • HyDE Support: Hypothetical document embeddings (with LLM)         │
└─────────────────────────────────────────────────────────────────────────┘

📖 Usage:
   node example/16-advanced-search.js              # Use Ollama
   node example/16-advanced-search.js --lmstudio   # Use LM Studio
`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
    printMajorDivider(`ADVANCED SEARCH DEMO - Using ${provider.toUpperCase()}`);
    
    // ─────────────────────────────────────────────────────────────────
    // Part 1: Offline Demos (No LLM required)
    // ─────────────────────────────────────────────────────────────────
    
    // DEMO 1: BM25
    const bm25 = demoBM25Search();
    
    // DEMO 2: Query Expansion
    demoQueryExpansion(bm25);
    
    // DEMO 3: Query Decomposition
    demoQueryDecomposition();
    
    // DEMO 4: Reranking
    demoReranking(bm25);
    
    // ─────────────────────────────────────────────────────────────────
    // Part 2: Online Demos (Requires LLM)
    // ─────────────────────────────────────────────────────────────────
    
    try {
        // Connect to LLM provider
        const clientInfo = await createClient();
        
        // DEMO 5: Hybrid Search
        const { hybridRetriever } = await demoHybridSearch(clientInfo);
        
        // DEMO 6: Full Pipeline
        const rerankedRetriever = await demoFullPipeline(hybridRetriever);
        
        // DEMO 7: RAG Generation
        await demoRAGGeneration(clientInfo, rerankedRetriever);
        
    } catch (error) {
        console.log('\n⚠️  LLM Provider Error:');
        console.log(`   ${error.message}`);
        console.log('');
        console.log('   Demos 5-7 require a running LLM provider.');
        console.log('   • For Ollama: ollama serve');
        console.log('   • For LM Studio: Start the application and load a model');
    }
    
    // Print summary
    printSummary();
}

// Run
main().catch(console.error);
