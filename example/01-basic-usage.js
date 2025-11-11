/**
 * Basic RAG Usage with Ollama
 * Simple example showing core quick-rag functionality
 */

import {
  OllamaRAGClient,
  createOllamaRAGEmbedding,
  InMemoryVectorStore,
  Retriever,
  generateWithRAG
} from '../src/index.js';

async function main() {
  console.log('🦙 Quick RAG - Ollama Example\n');

  // 1. Setup client and embedding
  const client = new OllamaRAGClient();
  const embed = createOllamaRAGEmbedding(client, 'embeddinggemma');

  // 2. Create vector store
  const store = new InMemoryVectorStore(embed);

  // 3. Add documents
  const docs = [
    { text: 'The sky is blue because of Rayleigh scattering.' },
    { text: 'Photosynthesis converts sunlight into energy in plants.' },
    { text: 'The Earth orbits the Sun once every 365.25 days.' }
  ];
  await store.addDocuments(docs);
  console.log(`✅ Added ${docs.length} documents\n`);

  // 4. Create retriever
  const retriever = new Retriever(store, { k: 2 });

  // 5. Query
  const query = 'Why is the sky blue?';
  console.log(`🔍 Query: "${query}"\n`);

  const results = await retriever.getRelevant(query);
  console.log(`📋 Found ${results.length} relevant documents:\n`);
  results.forEach((doc, i) => {
    console.log(`${i + 1}. ${doc.text} (score: ${doc.score.toFixed(3)})`);
  });

  // 6. Generate answer
  console.log('\n🤖 Generating answer...\n');
  const answer = await generateWithRAG(client, 'granite4:tiny-h', query, results);
  const answerText = typeof answer === 'string' ? answer : answer.response || JSON.stringify(answer);
  console.log(`💡 Answer: ${answerText}\n`);
}

main().catch(console.error);
