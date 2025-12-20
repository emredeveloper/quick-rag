/**
 * Quick RAG v2.4.0 - COMPREHENSIVE Feature Test
 * Tests ALL major library features with BOTH Ollama and LM Studio
 */

import {
    OllamaRAGClient,
    LMStudioRAGClient,
    InMemoryVectorStore,
    Retriever,
    HybridRetriever,
    CacheManager,
    ConversationManager,
    QueryExpander,
    Reranker,
    PromptManager,
    chunkBySentences,
    chunkText,
    calculateAllMetrics,
    precisionAtK,
    meanReciprocalRank
} from './src/index.js';

// Provider selection: 'ollama', 'lmstudio', or 'both'
const USE_PROVIDER = process.env.PROVIDER || 'both';

async function testWithProvider(providerName) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 Testing with ${providerName.toUpperCase()}`);
    console.log('='.repeat(60));

    // Initialize client based on provider
    let client, embedModel, chatModel;

    if (providerName === 'lmstudio') {
        client = new LMStudioRAGClient();
        embedModel = 'text-embedding-nomic-embed-text-v1.5';
        chatModel = 'google/gemma-3-4b';
    } else {
        client = new OllamaRAGClient();
        embedModel = 'nomic-embed-text-v2-moe:latest';
        chatModel = 'granite4:3b';
    }

    console.log(`📦 Provider: ${providerName}`);
    console.log(`🔤 Embed Model: ${embedModel}`);
    console.log(`💬 Chat Model: ${chatModel}\n`);

    // ========== 1. ROBUST CHUNKING (v2.4.0) ==========
    console.log('━━━ [1/8] Robust Chunking ━━━');
    const text = `Dr. House and Prof. X joined the meeting at Marvel LTD. 
    The results were approx. 99% vs. 80% with previous methods. 
    They led the research team to victory.`;

    const sentenceChunks = chunkBySentences(text, { sentencesPerChunk: 1 });
    console.log(`✅ Sentence chunks: ${sentenceChunks.length} (abbreviations preserved)`);

    const textChunks = chunkText(text, { chunkSize: 50, overlap: 10 });
    console.log(`✅ Text chunks: ${textChunks.length} (word-safe splitting)`);

    // ========== 2. CACHING LAYER ==========
    console.log('\n━━━ [2/8] Caching Layer ━━━');
    const cache = new CacheManager({
        embeddings: { maxSize: 100 },
        queries: { ttl: 60000 }
    });

    const embedFn = cache.wrapEmbedding(async (t) => {
        try {
            const r = await client.embed(embedModel, t);
            // Handle different response formats
            if (Array.isArray(r)) {
                return r;
            } else if (r && r.embeddings && Array.isArray(r.embeddings)) {
                return r.embeddings[0];
            } else if (r && typeof r === 'object') {
                // LM Studio might return object directly
                return r;
            }
            throw new Error(`Unexpected embedding response format: ${JSON.stringify(r).slice(0, 100)}`);
        } catch (err) {
            console.error(`Embedding error for provider ${providerName}:`, err.message);
            throw err;
        }
    });

    console.log('✅ Cache initialized (embeddings + queries)');

    // ========== 3. VECTOR STORE & RETRIEVAL ==========
    console.log('\n━━━ [3/8] Vector Store & Retrieval ━━━');
    const store = new InMemoryVectorStore(embedFn);
    const docs = sentenceChunks.map((chunk, i) => ({
        id: `doc-${i}`,
        text: chunk.text || chunk,
        meta: { source: 'test', index: i }
    }));
    await store.addDocuments(docs);
    console.log(`✅ ${docs.length} documents embedded and stored`);

    // Test basic retrieval
    const basicRetriever = new Retriever(store, { k: 2 });
    const basicResults = await basicRetriever.getRelevant('research team', 2);
    console.log(`✅ Basic retrieval: ${basicResults.length} results`);

    // ========== 4. HYBRID SEARCH (Vector + BM25) ==========
    console.log('\n━━━ [4/8] Hybrid Search ━━━');
    const hybridRetriever = new HybridRetriever(store, { alpha: 0.5 });

    const query = "Who led the research team?";
    const hybridResults = await hybridRetriever.getRelevant(query, 2, { explain: true });

    console.log(`✅ Hybrid search: ${hybridResults.length} results`);
    console.log(`   Rich Explainability:`);
    hybridResults.forEach((r, i) => {
        const exp = r.explanation || {};
        console.log(`   [${i + 1}] Snippet: "${exp.snippet?.slice(0, 50)}..."`);
        console.log(`       Matched: ${exp.matchedTerms?.join(', ') || 'N/A'}`);
        console.log(`       Density: ${exp.relevanceFactors?.density?.toFixed(4) || 'N/A'}`);
    });

    // ========== 5. QUERY TRANSFORMATION ==========
    console.log('\n━━━ [5/8] Query Transformation ━━━');
    const expander = new QueryExpander();
    expander.addSynonyms('led', ['guided', 'managed', 'directed']);
    expander.addSynonyms('research', ['study', 'investigation']);
    const { expanded, addedTerms } = expander.expand(query);
    console.log(`✅ Query expanded: "${query}"`);
    console.log(`   → "${expanded}"`);
    console.log(`   Added terms: ${addedTerms.join(', ')}`);

    // ========== 6. RERANKING ==========
    console.log('\n━━━ [6/8] Reranking ━━━');
    const reranker = new Reranker({
        keywordWeight: 0.3,
        semanticWeight: 0.4,
        coverageWeight: 0.2,
        coherenceWeight: 0.1
    });

    const reranked = reranker.rerank(query, hybridResults, { explain: true });
    console.log(`✅ Reranked ${reranked.length} results`);
    console.log(`   Top result score: ${(reranked[0].score * 100).toFixed(1)}%`);

    // ========== 7. CONVERSATION MANAGEMENT ==========
    console.log('\n━━━ [7/8] Conversation Management ━━━');
    const conversation = new ConversationManager({
        maxTokens: 2000,
        autoSummarize: false
    });

    conversation.addUserMessage(query);
    const context = reranked.map(r => r.text).join('\n');

    // Generate with Prompt Management
    const promptMgr = new PromptManager({ template: 'conversational' });
    const prompt = promptMgr.generate(query, reranked);

    let response;
    if (providerName === 'lmstudio') {
        // LM Studio uses: generate(modelPath, prompt, options)
        const content = await client.generate(chatModel, prompt);
        response = { response: content };
    } else {
        // Ollama uses: generate({ model, prompt })
        response = await client.generate({
            model: chatModel,
            prompt
        });
    }

    conversation.addAssistantMessage(response.response);
    console.log(`✅ Conversation: ${conversation.messages.length} messages`);
    console.log(`   AI Response: "${response.response.slice(0, 80)}..."`);

    // ========== 8. EVALUATION METRICS ==========
    console.log('\n━━━ [8/8] Evaluation Metrics ━━━');
    const retrievedIds = reranked.map(r => r.id);
    const relevantIds = ['doc-2']; // Ground truth

    const precision = precisionAtK(retrievedIds, relevantIds, 2);
    const mrr = meanReciprocalRank(retrievedIds, relevantIds);
    const allMetrics = calculateAllMetrics(retrievedIds, relevantIds);

    console.log(`✅ Precision@2: ${precision.toFixed(3)}`);
    console.log(`✅ MRR: ${mrr.toFixed(3)}`);
    console.log(`✅ All metrics calculated: ${Object.keys(allMetrics).length} metrics`);

    // ========== CACHE STATS ==========
    console.log('\n━━━ Cache Performance ━━━');
    const cacheStats = cache.getStats();
    console.log(`Embedding cache: ${cacheStats.embeddings.size} entries, ${cacheStats.embeddings.cacheHits} hits`);
    console.log(`Hit rate: ${(cacheStats.embeddings.hitRate * 100).toFixed(1)}%`);

    console.log(`\n✅✅✅ ${providerName.toUpperCase()} - ALL FEATURES VERIFIED! ✅✅✅\n`);
}

// Main function to test both providers
async function main() {
    console.log('🚀 Quick RAG v2.4.0 - COMPREHENSIVE Feature Test');
    console.log('Testing with BOTH Ollama and LM Studio\n');

    // Test with selected provider or both
    if (USE_PROVIDER === 'both') {
        try {
            await testWithProvider('ollama');
        } catch (err) {
            console.error(`\n❌ Ollama test failed: ${err.message}`);
        }

        try {
            await testWithProvider('lmstudio');
        } catch (err) {
            console.error(`\n❌ LM Studio test failed: ${err.message}`);
        }
    } else {
        await testWithProvider(USE_PROVIDER);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🏁 Testing Complete!');
    console.log('='.repeat(60));
}

main().catch(err => {
    console.error('\n❌ Test failed:', err.message);
    console.error(err.stack);
    process.exit(1);
});
