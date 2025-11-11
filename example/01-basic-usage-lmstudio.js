/**
 * Basic RAG Usage with LM Studio
 * Simple example showing core quick-rag functionality
 */

import {
  LMStudioRAGClient,
  createLMStudioRAGEmbedding,
  InMemoryVectorStore,
  Retriever,
  generateWithRAG
} from '../src/index.js';

async function main() {
  console.log('🎨 Quick RAG - LM Studio Example\n');

  try {
    // 1. Setup client and check models
    const client = new LMStudioRAGClient();
    const models = await client.listLoaded();
    
    if (models.length === 0) {
      console.log('⚠️  No models loaded in LM Studio');
      console.log('💡 Load a model in LM Studio first (e.g., qwen3-4b, gemma-3-4b)');
      return;
    }

    const modelPath = models[0].path || models[0].id;
    console.log(`✅ Using model: ${modelPath}\n`);

    // 2. Setup embedding
    const embed = createLMStudioRAGEmbedding(client, 'nomic-embed-text-v1.5');

    // 3. Create vector store
    const store = new InMemoryVectorStore(embed);

    // 4. Add documents
    const docs = [
      { text: 'The sky is blue because of Rayleigh scattering.' },
      { text: 'Photosynthesis converts sunlight into energy in plants.' },
      { text: 'The Earth orbits the Sun once every 365.25 days.' }
    ];
    await store.addDocuments(docs);
    console.log(`✅ Added ${docs.length} documents\n`);

    // 5. Create retriever
    const retriever = new Retriever(store, { k: 2 });

    // 6. Query
    const query = 'Why is the sky blue?';
    console.log(`🔍 Query: "${query}"\n`);

    const results = await retriever.getRelevant(query);
    console.log(`📋 Found ${results.length} relevant documents:\n`);
    results.forEach((doc, i) => {
      console.log(`${i + 1}. ${doc.text} (score: ${doc.score.toFixed(3)})`);
    });

    // 7. Generate answer
    console.log('\n🤖 Generating answer...\n');
    const answer = await generateWithRAG(client, modelPath, query, results);
    const answerText = typeof answer === 'string' ? answer : answer.response || JSON.stringify(answer);
    console.log(`💡 Answer: ${answerText}\n`);

  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Make sure LM Studio is running with local server enabled');
      console.log('   Settings → Local Server → Start Server');
    }
  }
}

main().catch(console.error);
