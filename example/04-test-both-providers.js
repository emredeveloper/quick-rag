/**
 * Complete Test - Both Ollama and LM Studio
 * Tests document loading with both providers
 */

import {
  InMemoryVectorStore,
  Retriever,
  OllamaRAGClient,
  LMStudioRAGClient,
  createOllamaRAGEmbedding,
  createLMStudioRAGEmbedding,
  generateWithRAG
} from '../src/index.js';

// Detect available providers
async function detectProviders() {
  const providers = { ollama: false, lmstudio: false };

  try {
    const ollamaClient = new OllamaRAGClient();
    await ollamaClient.list();
    providers.ollama = true;
    console.log('✅ Ollama available');
  } catch (err) {
    console.log('⚠️  Ollama not available');
  }

  try {
    const lmClient = new LMStudioRAGClient();
    await lmClient.listLoaded();
    providers.lmstudio = true;
    console.log('✅ LM Studio available');
  } catch (err) {
    console.log('⚠️  LM Studio not available');
  }

  return providers;
}

async function testOllama() {
  console.log('\n🦙 OLLAMA TEST');
  console.log('═'.repeat(60) + '\n');

  const client = new OllamaRAGClient();
  const embed = createOllamaRAGEmbedding(client, 'embeddinggemma');
  const store = new InMemoryVectorStore(embed);

  // Simple test data
  const docs = [
    { text: 'Ollama allows you to run LLMs locally on your machine.' },
    { text: 'You can use Ollama with various models like Llama, Mistral, and more.' },
    { text: 'Ollama provides a simple API for embeddings and completions.' }
  ];

  await store.addDocuments(docs);
  console.log(`✅ Added ${docs.length} documents`);

  const retriever = new Retriever(store, { k: 2 });
  const query = 'What is Ollama?';
  const results = await retriever.getRelevant(query);

  console.log(`\n🔍 Query: "${query}"`);
  console.log(`📋 Found ${results.length} results\n`);

  const answer = await generateWithRAG(client, 'granite4:tiny-h', query, results);
  const answerText = typeof answer === 'string' ? answer : answer.response || JSON.stringify(answer);
  console.log(`💡 Answer: ${answerText}\n`);

  return true;
}

async function testLMStudio() {
  console.log('\n🎨 LM STUDIO TEST');
  console.log('═'.repeat(60) + '\n');

  const client = new LMStudioRAGClient();
  const models = await client.listLoaded();
  
  if (models.length === 0) {
    console.log('⚠️  No models loaded');
    return false;
  }

  const modelPath = models[0].path || models[0].id;
  console.log(`✅ Using: ${modelPath}\n`);

  const embed = createLMStudioRAGEmbedding(client, 'nomic-embed-text-v1.5');
  const store = new InMemoryVectorStore(embed);

  // Simple test data
  const docs = [
    { text: 'LM Studio is a desktop application for running LLMs locally.' },
    { text: 'LM Studio supports GGUF format models.' },
    { text: 'You can chat with models and use them via API in LM Studio.' }
  ];

  await store.addDocuments(docs);
  console.log(`✅ Added ${docs.length} documents`);

  const retriever = new Retriever(store, { k: 2 });
  const query = 'What is LM Studio?';
  const results = await retriever.getRelevant(query);

  console.log(`\n🔍 Query: "${query}"`);
  console.log(`📋 Found ${results.length} results\n`);

  const answer = await generateWithRAG(client, modelPath, query, results);
  const answerText = typeof answer === 'string' ? answer : answer.response || JSON.stringify(answer);
  console.log(`💡 Answer: ${answerText}\n`);

  return true;
}

async function main() {
  console.log('🔄 DUAL PROVIDER TEST\n');
  console.log('═'.repeat(60) + '\n');

  const providers = await detectProviders();
  console.log();

  if (!providers.ollama && !providers.lmstudio) {
    console.log('❌ No providers available!');
    console.log('\n💡 Start Ollama or LM Studio');
    return;
  }

  const results = {};

  try {
    if (providers.ollama) results.ollama = await testOllama();
  } catch (err) {
    console.error('❌ Ollama failed:', err.message);
    results.ollama = false;
  }

  try {
    if (providers.lmstudio) results.lmstudio = await testLMStudio();
  } catch (err) {
    console.error('❌ LM Studio failed:', err.message);
    results.lmstudio = false;
  }

  // Summary
  console.log('═'.repeat(60));
  console.log('\n📊 SUMMARY:\n');
  
  if (providers.ollama) {
    console.log(`🦙 Ollama: ${results.ollama ? '✅ PASSED' : '❌ FAILED'}`);
  }
  if (providers.lmstudio) {
    console.log(`🎨 LM Studio: ${results.lmstudio ? '✅ PASSED' : '❌ FAILED'}`);
  }

  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;

  console.log(`\n${passed === total ? '🎉' : '⚠️'} ${passed}/${total} passed\n`);
}

main().catch(console.error);
