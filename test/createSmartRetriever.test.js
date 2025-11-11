/**
 * Tests for createSmartRetriever
 */

import assert from 'assert';
import { createSmartRetriever } from '../src/decisionEngine.js';
import { InMemoryVectorStore } from '../src/vectorStore.js';
import { Retriever } from '../src/retriever.js';

async function testEmbedding(text, dim = 128) {
  const vec = new Array(dim).fill(0);
  for (let i = 0; i < text.length; i++) {
    vec[i % dim] += text.charCodeAt(i);
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map(v => v / norm);
}

async function testCreateSmartRetriever() {
  const store = new InMemoryVectorStore(testEmbedding);
  await store.addDocuments([
    { text: 'Python 3.12 features', meta: { source: 'official', date: '2024-01-01' } },
    { text: 'Python tutorial', meta: { source: 'blog', date: '2023-06-01' } }
  ]);
  
  const retriever = new Retriever(store);
  
  // Test factory function
  const smartRetriever = createSmartRetriever(retriever);
  assert.ok(smartRetriever, 'should create SmartRetriever');
  assert.ok(smartRetriever.getRelevant, 'should have getRelevant method');
  
  // Test with options
  const smartRetriever2 = createSmartRetriever(retriever, {
    weights: {
      semanticSimilarity: 0.5,
      recency: 0.3
    }
  });
  assert.ok(smartRetriever2, 'should create with custom options');
  
  const results = await smartRetriever.getRelevant('Python features', 1);
  assert.ok(results.results, 'should return results object');
  assert.ok(results.decisions, 'should have decisions');
  
  console.log('✅ createSmartRetriever tests passed');
}

export async function runCreateSmartRetrieverTests() {
  console.log('\n🧪 Running createSmartRetriever Tests...');
  await testCreateSmartRetriever();
  console.log('✅ createSmartRetriever tests completed\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCreateSmartRetrieverTests().catch(console.error);
}

