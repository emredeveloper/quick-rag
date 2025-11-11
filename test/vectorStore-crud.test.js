/**
 * Tests for VectorStore CRUD Operations
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

async function testVectorStoreCRUD() {
  const store = new InMemoryVectorStore(testEmbedding);
  
  // Add documents
  await store.addDocuments([
    { id: '1', text: 'First document', meta: { source: 'web' } },
    { id: '2', text: 'Second document', meta: { source: 'book' } },
    { id: '3', text: 'Third document', meta: { source: 'web' } }
  ]);
  
  assert.strictEqual(store.getAllDocuments().length, 3, 'should have 3 documents');
  
  // Test getDocument
  const doc1 = store.getDocument('1');
  assert.ok(doc1, 'should retrieve document by id');
  assert.strictEqual(doc1.text, 'First document', 'should have correct text');
  
  // Test updateDocument
  await store.updateDocument('1', 'Updated first document', { source: 'updated' });
  const updatedDoc = store.getDocument('1');
  assert.strictEqual(updatedDoc.text, 'Updated first document', 'should update text');
  assert.strictEqual(updatedDoc.meta.source, 'updated', 'should update metadata');
  
  // Test deleteDocument
  const deleted = store.deleteDocument('2');
  assert.strictEqual(deleted, true, 'should return true on successful deletion');
  assert.strictEqual(store.getAllDocuments().length, 2, 'should have 2 documents after deletion');
  
  const notFound = store.deleteDocument('999');
  assert.strictEqual(notFound, false, 'should return false for non-existent id');
  
  // Test clear
  store.clear();
  assert.strictEqual(store.getAllDocuments().length, 0, 'should clear all documents');
  
  console.log('✅ VectorStore CRUD tests passed');
}

export async function runVectorStoreCRUDTests() {
  console.log('\n🧪 Running VectorStore CRUD Tests...');
  await testVectorStoreCRUD();
  console.log('✅ VectorStore CRUD tests completed\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runVectorStoreCRUDTests().catch(console.error);
}

