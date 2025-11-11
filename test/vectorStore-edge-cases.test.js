/**
 * Tests for VectorStore edge cases
 */

import assert from 'assert';
import { InMemoryVectorStore } from '../src/vectorStore.js';

async function testEmbedding(text, dim = 128) {
  const vec = new Array(dim).fill(0);
  for (let i = 0; i < text.length; i++) {
    vec[i % dim] += text.charCodeAt(i);
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map(v => v / norm);
}

async function testVectorStoreEdgeCases() {
  // Test constructor validation
  try {
    new InMemoryVectorStore(null);
    assert.fail('should throw error for null embedding function');
  } catch (err) {
    assert.ok(err.message.includes('embeddingFn required'), 'should require embedding function');
  }
  
  const store = new InMemoryVectorStore(testEmbedding);
  
  // Test empty similarity search
  const emptyResults = await store.similaritySearch('test', 5);
  assert.strictEqual(emptyResults.length, 0, 'should return empty array for empty store');
  
  // Test addDocuments with empty array
  await store.addDocuments([]);
  assert.strictEqual(store.getAllDocuments().length, 0, 'should handle empty array');
  
  // Test addDocuments with auto-generated IDs
  await store.addDocuments([
    { text: 'Doc 1' },
    { text: 'Doc 2' }
  ]);
  assert.strictEqual(store.getAllDocuments().length, 2, 'should auto-generate IDs');
  
  // Test different dimensions
  await store.addDocument({ text: 'Doc 3' }, { dim: 256 });
  const doc3 = store.getDocument('2'); // Auto-generated ID
  assert.ok(doc3, 'should handle different dimensions');
  
  // Test similaritySearch with different queryDim
  const results = await store.similaritySearch('Doc', 2, 256);
  assert.ok(Array.isArray(results), 'should handle different queryDim');
  
  // Test updateDocument with non-existent id
  const updated = await store.updateDocument('999', 'New text');
  assert.strictEqual(updated, false, 'should return false for non-existent id');
  
  // Test getDocument with non-existent id
  const notFound = store.getDocument('999');
  assert.strictEqual(notFound, undefined, 'should return undefined for non-existent id');
  
  console.log('✅ VectorStore edge cases tests passed');
}

export async function runVectorStoreEdgeCaseTests() {
  console.log('\n🧪 Running VectorStore Edge Cases Tests...');
  await testVectorStoreEdgeCases();
  console.log('✅ VectorStore edge cases tests completed\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runVectorStoreEdgeCaseTests().catch(console.error);
}

