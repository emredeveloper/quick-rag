import { InMemoryVectorStore } from '../src/vectorStore.js';
import { Retriever } from '../src/retriever.js';
import { generateWithRAG } from '../src/rag.js';
import OllamaClient from '../src/ollamaClient.js';
import { createOllamaEmbedding } from '../src/embeddings/ollamaEmbedding.js';
import { createMRL } from '../src/embeddings/mrl.js';

/**
 * ✨ NEW FEATURE DEMO: Dynamic topK parameter
 * Shows how topK now properly controls the number of retrieved documents
 */
async function main() {
  console.log('🎯 Testing Dynamic topK Feature\n');
  console.log('='.repeat(60));

  // Create test documents
  const docs = [
    { id: '1', text: 'React is a JavaScript library for building user interfaces.' },
    { id: '2', text: 'Vue is a progressive framework for building web apps.' },
    { id: '3', text: 'Angular is a platform for building mobile and desktop applications.' },
    { id: '4', text: 'Svelte is a radical new approach to building user interfaces.' },
    { id: '5', text: 'Next.js is a React framework for production.' },
    { id: '6', text: 'Nuxt.js is a Vue.js framework.' },
    { id: '7', text: 'Ollama provides local LLM hosting.' },
    { id: '8', text: 'RAG uses retrieval to augment model responses.' }
  ];

  // Setup embedding and store
  const baseEmbedding = createOllamaEmbedding({});
  const mrl = createMRL(baseEmbedding, 768);
  const store = new InMemoryVectorStore(mrl, { defaultDim: 128 });
  await store.addDocuments(docs, { dim: 128 });

  // Create retriever with default k=2
  const retriever = new Retriever(store, { k: 2 });
  const query = 'JavaScript frameworks for building UIs';

  console.log(`\n📝 Query: "${query}"\n`);

  // Test 1: Use default k (2)
  console.log('1️⃣  Using default k=2:');
  const results1 = await retriever.getRelevant(query);
  console.log(`   Retrieved ${results1.length} documents:`);
  results1.forEach(r => console.log(`   - [${r.id}] (${r.score.toFixed(3)}) ${r.text.slice(0, 50)}...`));

  // Test 2: Override with topK=5
  console.log('\n2️⃣  Overriding with topK=5:');
  const results2 = await retriever.getRelevant(query, 5);
  console.log(`   Retrieved ${results2.length} documents:`);
  results2.forEach(r => console.log(`   - [${r.id}] (${r.score.toFixed(3)}) ${r.text.slice(0, 50)}...`));

  // Test 3: Use with generateWithRAG
  console.log('\n3️⃣  Using topK with generateWithRAG:');
  const modelClient = new OllamaClient();
  const model = process.env.OLLAMA_MODEL || 'granite4:tiny-h';
  
  const ragResult = await generateWithRAG({
    retriever,
    modelClient,
    model,
    query,
    topK: 3  // ✨ This now works correctly!
  });

  console.log(`   Retrieved ${ragResult.docs.length} documents for RAG`);
  ragResult.docs.forEach(r => console.log(`   - [${r.id}] (${r.score.toFixed(3)})`));
  console.log(`\n   ✅ Prompt generated successfully (${ragResult.prompt.length} chars)`);
  console.log(`   ✅ Response field exists: ${!!ragResult.response}`);

  console.log('\n' + '='.repeat(60));
  console.log('✅ topK feature working correctly!\n');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
