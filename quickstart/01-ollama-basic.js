/**
 * Quickstart: 01 - Basic RAG with Ollama
 *
 * This example shows the simplest way to use the library with Ollama.
 * It uses the official Ollama SDK wrapper for reliable communication.
 *
 * Prerequisites:
 * 1. Ollama running
 * 2. Models pulled: `ollama pull nomic-embed-text` and `ollama pull orca-mini`
 */

import {
  OllamaRAGClient,
  createOllamaRAGEmbedding,
  InMemoryVectorStore,
  Retriever,
  generateWithRAG,
} from 'quick-rag';

async function main() {
  try {
    console.log('🚀 01 - Running Basic Ollama RAG Example...');

    // 1. Initialize the official Ollama client and embedding function
    const client = new OllamaRAGClient();
    const embed = createOllamaRAGEmbedding(client, 'embeddinggemma:latest');

    // 2. Create an in-memory vector store
    const store = new InMemoryVectorStore(embed);

    // 3. Add documents to the store
    console.log('📚 Adding documents to the vector store...');
    await store.addDocuments([
      { text: 'The sky is blue due to Rayleigh scattering.' },
      { text: 'The ocean is salty because of dissolved minerals from rocks.' },
    ]);
    console.log('✅ Documents added successfully.');

    // 4. Create a retriever
    const retriever = new Retriever(store);

    // 5. Define a query and get relevant documents
    const query = 'Why is the sky blue?';
    console.log(`🔍 Querying with: "${query}"`);
    const relevantDocs = await retriever.getRelevant(query, 2);
    console.log(`Retrieved ${relevantDocs.length} relevant documents.`);

    // 6. Generate a response using the retrieved context
    console.log('🤖 Generating a response from the LLM...');
    const { response } = await generateWithRAG(
      client,
      'granite4:3b', // A small, fast model
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
        '💡 Make sure Ollama is running. You can start it with `ollama serve`.'
      );
    }
  }
}

main();
