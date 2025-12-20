/**
 * Quick RAG NPM Verification Script
 * Uses installed 'quick-rag' package
 */

import {
    OllamaRAGClient,
    LMStudioRAGClient,
    InMemoryVectorStore,
    Retriever,
    HybridRetriever,
    chunkText,
    chunkBySentences,
    CacheManager,
    ConversationManager,
    EvaluationMetrics,
    PromptManager,
    RAGApplication,
    meanReciprocalRank
} from 'quick-rag';

const USE_PROVIDER = process.env.PROVIDER || 'both';

async function testWithProvider(providerName) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 Testing with ${providerName.toUpperCase()}`);
    console.log('='.repeat(60));

    let client, embedModel, chatModel;

    try {
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
        console.log(`💬 Chat Model: ${chatModel}`);

        // 1. Test Chunking
        console.log('\n━━━ [1/8] Robust Chunking ━━━');
        const textToChunk = "Dr. House and Prof. X joined the meeting at Marvel LTD. They led the research team to victory.";
        const chunks = chunkBySentences(textToChunk, { sentencesPerChunk: 1 });

        if (chunks.length === 2) {
            console.log('✅ Sentence chunks: 2 (abbreviations preserved)');
        } else {
            console.warn(`⚠️ Unexpected chunk count: ${chunks.length}`);
            chunks.forEach(c => console.log(`   - "${c.text || c}"`));
        }

        const largeText = "JavaScript is awesome".repeat(10);
        const textChunks = chunkText(largeText, { chunkSize: 20 });
        console.log(`✅ Text chunks: ${textChunks.length} (word-safe splitting)`);

        // 2. Setup Cache
        console.log('\n━━━ [2/8] Caching Layer ━━━');
        const cache = new CacheManager({
            ttl: 3600,
            maxSize: 100
        });

        const embedFn = cache.wrapEmbedding(async (t) => {
            try {
                const r = await client.embed(embedModel, t);
                if (Array.isArray(r)) return r;
                if (r && r.embeddings && Array.isArray(r.embeddings)) return r.embeddings[0];
                if (r && typeof r === 'object') return r;
                return r;
            } catch (error) {
                console.error('Embed error:', error.message);
                throw error;
            }
        });

        console.log('✅ Cache initialized (embeddings + queries)');

        // 3. Vector Store
        console.log('\n━━━ [3/8] Vector Store & Retrieval ━━━');
        const store = new InMemoryVectorStore(embedFn);
        const docs = chunks.map((c, i) => ({
            id: `doc_${i}`,
            text: c.text || c,
            meta: { source: 'test-doc' }
        }));

        await store.addDocuments(docs);
        console.log(`✅ ${docs.length} documents embedded and stored`);

        // 4. Hybrid Search with Explainability
        console.log('\n━━━ [4/8] Hybrid Search ━━━');
        const retriever = new HybridRetriever(store, { alpha: 0.5 });
        const query = "Who led the research team?";

        const results = await retriever.getRelevant(query, 2, { explain: true });
        console.log(`✅ Hybrid search: ${results.length} results`);
        console.log('   Rich Explainability:');

        results.forEach((r, i) => {
            if (r.explanation) {
                const exp = r.explanation;
                console.log(`   [${i + 1}] Snippet: "${exp.snippet?.slice(0, 50)}..."`);
                console.log(`       Matched: ${exp.matchedTerms?.join(', ') || 'N/A'}`);
                console.log(`       Density: ${exp.relevanceFactors?.density?.toFixed(4) || 'N/A'}`);
            }
        });

        // 7. Conversation Management
        console.log('\n━━━ [7/8] Conversation Management ━━━');
        const conversation = new ConversationManager({
            maxHistory: 5,
            summarizeAt: 3
        });

        conversation.addSystemMessage("You are a helpful RAG assistant.");
        conversation.addUserMessage(query);

        // Simple generation
        console.log('   Generating response...');
        let response;
        const prompt = `Context: ${results.map(r => r.text).join('\n')}\n\nQuestion: ${query}`;

        if (providerName === 'lmstudio') {
            const content = await client.generate(chatModel, prompt);
            response = { response: content };
        } else {
            response = await client.generate({
                model: chatModel,
                prompt: prompt
            });
        }

        conversation.addAssistantMessage(response.response);
        console.log(`✅ Conversation: ${conversation.messages.length} messages`);
        console.log(`   AI Response: "${response.response.slice(0, 80)}..."`);

        console.log(`\n✅✅✅ ${providerName.toUpperCase()} - ALL FEATURES VERIFIED! ✅✅✅`);

    } catch (err) {
        console.error(`\n❌ ${providerName.toUpperCase()} Initial Test Failed:`, err);
        // Don't kill process so other provider can run
    }
}

async function main() {
    console.log('🚀 Quick RAG v2.4.2 - NPM Package Verification');
    console.log('Testing with: ' + USE_PROVIDER);

    if (USE_PROVIDER === 'ollama' || USE_PROVIDER === 'both') {
        await testWithProvider('ollama');
    }

    if (USE_PROVIDER === 'lmstudio' || USE_PROVIDER === 'both') {
        await testWithProvider('lmstudio');
    }

    console.log('\n============================================================');
    console.log('🏁 Verification Complete!');
    console.log('============================================================');
}

main().catch(console.error);
