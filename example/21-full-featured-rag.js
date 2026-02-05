/**
 * Full-Featured RAG Example (v2.4.0)
 * 
 * Demonstrates the synergy between:
 * 1. Robust Chunking (Sentence splitting with abbreviation awareness)
 * 2. Caching Layer (Embedding & Query caching)
 * 3. Conversation Management (History & Context window)
 * 4. Rich Explanations (Keyword awareness & Relevance factors)
 * 5. Multi-Store Architecture (Memory & SQLite)
 */

import {
    initRAG,
    InMemoryVectorStore,
    Retriever,
    CacheManager,
    ConversationManager,
    chunkBySentences,
    loadURL,
    OllamaRAGClient,
    loadPDF,
    loadDirectory,
    chunkDocuments
} from '../src/index.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
    console.log('--- Quick RAG v2.4.0 Full-Featured Demo ---');

    // 1. Setup Infrastructure
    const client = new OllamaRAGClient();
    const cache = new CacheManager({
        embeddings: { maxSize: 1000 },
        queries: { ttl: 60 * 60 * 1000 } // 1 hour
    });

    const conversation = new ConversationManager({
        maxTokens: 2000,
        autoSummarize: true
    });

    // 2. Load and Prepare Data
    console.log('\n[1/4] Loading documents from PDF directory...');

    const pdfDirPath = join(__dirname, 'PDF');
    let chunks = [];

    try {
        const loadedDocs = await loadDirectory(pdfDirPath, {
            extensions: ['.pdf'],
            recursive: true
        });
        console.log(`- Loaded ${loadedDocs.length} documents from: ${pdfDirPath}`);

        if (loadedDocs.length === 0) {
            throw new Error('No PDF files found in directory');
        }

        // Demonstrate robust document chunking
        chunks = chunkDocuments(loadedDocs, {
            chunkSize: 500,
            overlap: 50
        });
    } catch (err) {
        console.warn(`\n⚠️  Could not load documents from ${pdfDirPath}. Error: ${err.message}`);
        console.log('--- Falling back to text-based demonstration ---');

        const doc = {
            text: "Dr. Smith graduated from the University of AI. Prof. Jones lead the research. LTD. Corp funded the project. The results were approx. 95% accurate vs. previous attempts.",
            meta: { source: 'fallback_notes' }
        };
        chunks = chunkDocuments([doc], { chunkSize: 100, overlap: 20 });
    }

    console.log(`- Created ${chunks.length} chunks.`);
    if (chunks.length > 0) {
        console.log(`- First chunk preview: "${chunks[0].text.slice(0, 100)}..."`);
    }

    // 3. Setup Vector Store with Caching
    const embedFn = cache.wrapEmbedding(async (text) => {
        const response = await client.embed('qwen3-embedding:0.6b', text);
        return response.embeddings[0];
    });

    const store = new InMemoryVectorStore(embedFn);
    await store.addDocuments(chunks);

    const basicRetriever = new Retriever(store, { k: 2 });
    const retriever = cache.wrapRetriever(basicRetriever);

    // 4. Interactive RAG Session
    console.log('\n[2/4] Starting conversation...');

    const query = "Who led the research according to Prof. Jones?";
    conversation.addUserMessage(query);

    console.log(`\nQuery: "${query}"`);

    // Get relevant docs with rich explanations
    const results = await basicRetriever.getRelevant(query, 2, { explain: true });

    console.log(`\n[3/4] Retrieval Analysis:`);
    results.forEach((res, i) => {
        console.log(`\nResult #${i + 1} (Score: ${(res.score * 100).toFixed(1)}%)`);
        console.log(`- Text: "${res.text}"`);
        console.log(`- Matched Terms: ${res.explanation.matchedTerms.join(', ')}`);
        console.log(`- Reason: ${res.explanation.reason}`);
        console.log(`- Snippet: ${res.explanation.snippet}`);
    });

    // 5. Generate Response (Real generation with the specified model)
    const context = results.map(r => r.text).join('\n');
    const genResponse = await client.generate({
        model: 'granite4:3b',
        prompt: `Context: ${context}\n\nQuery: ${query}`,
        stream: false
    });

    const response = genResponse.response;
    conversation.addAssistantMessage(response);

    console.log(`\n[4/4] Final Response:`);
    console.log(`AI: ${response}`);

    console.log('\n--- Demo Complete ---');
}

main().catch(console.error);
