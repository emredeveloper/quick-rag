/**
 * Quick RAG - Basic Usage Example
 * 
 * Install: npm install quick-rag
 * Requirements: Ollama running with models pulled
 *   - ollama pull granite4:3b
 *   - ollama pull nomic-embed-text
 */

import { 
  OllamaRAGClient, 
  createOllamaRAGEmbedding,
  InMemoryVectorStore, 
  Retriever,
  generateWithRAG
} from 'quick-rag';

async function main() {
  console.log('🚀 Quick RAG - Basic Usage\n');

  // 1. Initialize Ollama client
  const client = new OllamaRAGClient();
  console.log('✅ Ollama client initialized\n');

  // 2. Setup embedding
  const embed = createOllamaRAGEmbedding(client, 'nomic-embed-text');
  console.log('✅ Embedding model ready\n');

  // 3. Create vector store and retriever
  const vectorStore = new InMemoryVectorStore(embed);
  const retriever = new Retriever(vectorStore);
  console.log('✅ Vector store and retriever created\n');

  // 4. Add a sample document
  await vectorStore.addDocument({ 
    text: 'The sky appears blue due to Rayleigh scattering. Shorter wavelengths of light (blue) scatter more than longer wavelengths (red).',
    meta: { source: 'science-facts', topic: 'physics' }
  });
  console.log('✅ Document added to vector store\n');

  // 5. Query with RAG
  const query = 'Why is the sky blue?';
  console.log(`❓ Question: ${query}\n`);

  const results = await retriever.getRelevant(query, 1);
  console.log(`📚 Retrieved ${results.length} relevant document(s)\n`);

  const response = await generateWithRAG(
    client,
    'granite4:3b',
    query,
    results.map(d => d.text)
  );

  console.log('🤖 Answer:');
  console.log(response.response);
  console.log('\n✅ Basic RAG completed successfully!');
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
