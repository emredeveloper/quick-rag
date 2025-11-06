/**
 * Quickstart: 02 - Basic RAG with LM Studio
 *
 * This example shows how to use the library with LM Studio.
 * It uses the official LM Studio SDK wrapper.
 *
 * Prerequisites:
 * 1. LM Studio running with the server started (Go to `Server` tab and click `Start Server`).
 * 2. An embedding model loaded (e.g., `nomic-embed-text`).
 * 3. A chat model loaded (e.g., `Qwen/Qwen2-1.5B-Instruct-GGUF`).
 */

import {
  LMStudioRAGClient,
  createLMStudioRAGEmbedding,
  InMemoryVectorStore,
  Retriever,
  generateWithRAG,
} from 'quick-rag';

// --- CONFIGURATION ---
// Make sure these model names match what you have loaded in LM Studio.
const EMBEDDING_MODEL = 'text-embedding-embeddinggemma-300m';
const CHAT_MODEL = 'qwen/qwen3-vl-4b';
// ---------------------

async function main() {
  try {
    console.log('🚀 02 - Running Basic LM Studio RAG Example...');

    // 1. Initialize the official LM Studio client and embedding function
    const client = new LMStudioRAGClient();
    const embed = createLMStudioRAGEmbedding(client, EMBEDDING_MODEL);

    // 2. Create an in-memory vector store
    const store = new InMemoryVectorStore(embed);

    // 3. Add documents to the store
    console.log('📚 Adding documents to the vector store...');
    await store.addDocuments([
      { text: 'React is a JavaScript library for building user interfaces.' },
      {
        text: 'Vue is a progressive framework for building user interfaces.',
      },
    ]);
    console.log('✅ Documents added successfully.');

    // 4. Create a retriever
    const retriever = new Retriever(store);

    // 5. Define a query and get relevant documents
    const query = 'What is React?';
    console.log(`🔍 Querying with: "${query}"`);
    const relevantDocs = await retriever.getRelevant(query, 1);
    console.log(`Retrieved ${relevantDocs.length} relevant document.`);

    // 6. Generate a response using the retrieved context
    console.log('🤖 Generating a response from the LLM...');
    const { response } = await generateWithRAG(
      client,
      CHAT_MODEL,
      query,
      relevantDocs
    );

    console.log('\n✨ AI Response:');
    console.log(response);
  } catch (error) {
    console.error('\n❌ An error occurred:');
    console.error(error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.log(
        '💡 Make sure the LM Studio server is running on its default port.'
      );
    }
  }
}

main();
