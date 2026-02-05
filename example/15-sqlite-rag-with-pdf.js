/**
 * SQLite RAG: Ollama vs LM Studio
 */

import {
    OllamaRAGClient,
    LMStudioRAGClient,
    createOllamaRAGEmbedding,
    createLMStudioRAGEmbedding,
    SQLiteVectorStore,
    generateWithRAG,
    loadPDF,
    chunkDocuments
} from 'quick-rag';

const CONFIG = {
    ollama: {
        host: 'http://127.0.0.1:11434',
        embeddingModel: 'qwen3-embedding:0.6b',
        chatModel: 'granite4:3b',
        db: './rag-ollama.db'
    },
    lmstudio: {
        baseUrl: 'ws://127.0.0.1:1234',
        embeddingModel: 'text-embedding-qwen3-embedding-0.6b',
        chatModel: 'google/gemma-3-4b',
        db: './rag-lmstudio.db'
    },
    pdf: './example/PDF/2509.17874v1.pdf',
    chunking: {
        chunkSize: 1500,    // Bigger chunks for better context
        overlap: 200        // More overlap
    }
};

async function testProvider(name, client, embedFn, chatModel, dbPath) {
    console.log(`\n${'='.repeat(70)}\n🧪 ${name}\n${'='.repeat(70)}`);

    const store = new SQLiteVectorStore(dbPath, embedFn, { defaultDim: 768 });
    console.log(`💾 DB: ${dbPath}`);

    console.log(`📄 Loading PDF...`);
    const pdf = await loadPDF(CONFIG.pdf);
    const chunks = chunkDocuments([pdf], CONFIG.chunking);
    console.log(`✂️  Chunks: ${chunks.length} (size: ${CONFIG.chunking.chunkSize})`);

    const docs = chunks.map((c, i) => ({
        id: `${name}-${i}`,
        text: c.text,
        meta: { provider: name, chunk: i }
    }));

    console.log('⚡ Embedding...');
    const tEmbed = Date.now();
    await store.addDocuments(docs, {
        batchSize: 10,
        maxConcurrent: 5,
        onProgress: (c, t) => process.stdout.write(`\r   ${Math.round((c / t) * 100)}%`)
    });
    const embedTime = ((Date.now() - tEmbed) / 1000).toFixed(1);
    console.log(`\n✅ ${embedTime}s`);

    console.log('\n🔍 Search...');
    const tSearch = Date.now();
    const results = await store.similaritySearch(
        'What are the main contributions and methodology of this research paper?',
        5
    );
    const searchTime = ((Date.now() - tSearch) / 1000).toFixed(2);
    console.log(`⏱️  ${searchTime}s\n`);

    results.forEach((r, i) => {
        const preview = r.text.replace(/\n/g, ' ').substring(0, 150);
        console.log(`${i + 1}. [${r.score.toFixed(3)}] ${preview}...`);
    });

    console.log('\n🤖 RAG...');
    const tRag = Date.now();
    const ragQuery = 'Provide a detailed summary of the main contributions, methodology, and key findings from this research paper.';
    const ragResult = await generateWithRAG(client, chatModel, ragQuery, results);
    const answer = ragResult.response || ragResult;
    const ragTime = ((Date.now() - tRag) / 1000).toFixed(1);
    console.log(`📋 Answer (${ragTime}s):\n${'─'.repeat(70)}`);
    console.log(answer);
    console.log('─'.repeat(70));

    store.close();

    return {
        provider: name,
        chunks: chunks.length,
        embedTime,
        searchTime,
        ragTime,
        topScore: results[0].score
    };
}

async function main() {
    console.log('🚀 Ollama vs LM Studio\n');

    const results = [];

    // Ollama
    try {
        const client = new OllamaRAGClient({ host: CONFIG.ollama.host });
        const embed = createOllamaRAGEmbedding(client, CONFIG.ollama.embeddingModel);
        results.push(await testProvider('Ollama', client, embed, CONFIG.ollama.chatModel, CONFIG.ollama.db));
    } catch (e) {
        console.error(`\n❌ Ollama: ${e.message}`);
    }

    // LM Studio
    try {
        const client = new LMStudioRAGClient({ baseUrl: CONFIG.lmstudio.baseUrl });
        const embed = createLMStudioRAGEmbedding(client, CONFIG.lmstudio.embeddingModel);
        results.push(await testProvider('LM Studio', client, embed, CONFIG.lmstudio.chatModel, CONFIG.lmstudio.db));
    } catch (e) {
        console.error(`\n❌ LM Studio: ${e.message}`);
    }

    // Compare
    if (results.length === 2) {
        console.log(`\n\n${'='.repeat(70)}\n📊 Comparison\n${'='.repeat(70)}`);
        console.log('\n                  Ollama      LM Studio');
        console.log('─'.repeat(70));
        console.log(`Chunks            ${results[0].chunks}          ${results[1].chunks}`);
        console.log(`Embedding         ${results[0].embedTime}s       ${results[1].embedTime}s`);
        console.log(`Search            ${results[0].searchTime}s       ${results[1].searchTime}s`);
        console.log(`RAG               ${results[0].ragTime}s       ${results[1].ragTime}s`);
        console.log(`Score             ${results[0].topScore.toFixed(3)}       ${results[1].topScore.toFixed(3)}`);
        console.log('─'.repeat(70));

        const t0 = parseFloat(results[0].embedTime) + parseFloat(results[0].ragTime);
        const t1 = parseFloat(results[1].embedTime) + parseFloat(results[1].ragTime);
        const faster = t0 < t1 ? 'Ollama' : 'LM Studio';
        console.log(`\n🏆 ${faster} is ${Math.abs(t0 - t1).toFixed(1)}s faster overall`);
    }

    console.log('\n');
}

main().catch(e => {
    console.error(`\n❌ ${e.message}\n`);
    console.error('Check:');
    console.error(`  • PDF: ${CONFIG.pdf}`);
    console.error('  • Ollama: ollama list');
    console.error('  • LM Studio on :1234\n');
    process.exit(1);
});
