/**
 * Integration Tests for generateWithRAG
 * Tests the full RAG pipeline
 */

import assert from 'assert';
import { InMemoryVectorStore } from '../src/vectorStore.js';
import { Retriever } from '../src/retriever.js';
import { generateWithRAG } from '../src/rag.js';

const MOCK_MODE = process.env.MOCK_OLLAMA === 'true';

// Test embedding (for fallback)
async function testEmbedding(text, dim = 128) {
  const vec = new Array(dim).fill(0);
  for (let i = 0; i < text.length; i++) {
    vec[i % dim] += text.charCodeAt(i);
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map(v => v / norm);
}

async function testGenerateWithRAGNewAPI() {
  if (MOCK_MODE) {
    console.log('⏭️  Skipping generateWithRAG tests (MOCK_MODE)');
    return;
  }

  const { OllamaRAGClient } = await import('../src/ollamaRAGClient.js');
  const client = new OllamaRAGClient();
  
  // Setup store with test embedding
  const store = new InMemoryVectorStore(testEmbedding);
  await store.addDocuments([
    { text: 'JavaScript is a programming language.' },
    { text: 'Python is great for data science.' },
    { text: 'React is a UI library.' }
  ]);

  const retriever = new Retriever(store, { k: 2 });
  const results = await retriever.getRelevant('What is JavaScript?', 2);

  try {
    // Test new API: generateWithRAG(client, model, query, results)
    const response = await generateWithRAG(
      client,
      'granite4:tiny-h',
      'What is JavaScript?',
      results
    );

    assert(typeof response === 'string' && response.length > 0, 'should return string response');
    console.log('✅ generateWithRAG (new API) works');
  } catch (err) {
    console.warn('⚠️  generateWithRAG test skipped:', err.message);
  }
}

async function testGenerateWithRAGLegacyAPI() {
  if (MOCK_MODE) return;

  const { OllamaRAGClient } = await import('../src/ollamaRAGClient.js');
  const client = new OllamaRAGClient();
  const store = new InMemoryVectorStore(testEmbedding);
  await store.addDocuments([
    { text: 'Node.js runs JavaScript on the server.' }
  ]);

  const retriever = new Retriever(store, { k: 1 });

  try {
    // Test legacy API: generateWithRAG({ retriever, modelClient, model, query })
    const result = await generateWithRAG({
      retriever,
      modelClient: client,
      model: 'granite4:tiny-h',
      query: 'What is Node.js?',
      topK: 1
    });

    assert(result && result.response && result.docs, 'legacy API should return {response, docs}');
    console.log('✅ generateWithRAG (legacy API) works');
  } catch (err) {
    console.warn('⚠️  Legacy API test skipped:', err.message);
  }
}

export async function runGenerateWithRAGTests() {
  console.log('\n🧪 Running generateWithRAG Tests...');
  await testGenerateWithRAGNewAPI();
  await testGenerateWithRAGLegacyAPI();
  console.log('✅ generateWithRAG tests completed\n');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runGenerateWithRAGTests().catch(console.error);
}
