/**
 * Tests for initRAG
 */

import assert from 'assert';
import { initRAG } from '../src/initRag.js';

// Mock embedding function for testing (no external dependencies)
async function mockEmbedding(text, dim = 128) {
  const vec = new Array(dim).fill(0);
  for (let i = 0; i < text.length; i++) {
    vec[i % dim] += text.charCodeAt(i);
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map(v => v / norm);
}

async function testInitRAG() {
  const docs = [
    { id: '1', text: 'First document' },
    { id: '2', text: 'Second document' }
  ];

  // Deterministic test path (no external dependencies)
  const rag = await initRAG(docs, {
    defaultDim: 128,
    k: 2,
    mrlBaseDim: 128,
    baseEmbeddingOptions: {
      createEmbedding: mockEmbedding
    }
  });

  assert.ok(rag.retriever, 'should return retriever');
  assert.ok(rag.store, 'should return store');
  assert.ok(rag.mrl, 'should return mrl');

  const results = await rag.retriever.getRelevant('document', 1);
  assert.ok(Array.isArray(results), 'should return results');
  assert.ok(results.length === 1, 'should return top-1 result');

  // Optional integration smoke test (requires Ollama)
  if (process.env.RUN_INTEGRATION_TESTS === 'true') {
    const externalRag = await initRAG(docs);
    assert.ok(externalRag.retriever, 'should initialize with default provider');
  }

  console.log('initRAG tests passed');
}

export async function runInitRAGTests() {
  console.log('\nRunning initRAG Tests...');
  await testInitRAG();
  console.log('initRAG tests completed\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runInitRAGTests().catch(console.error);
}
