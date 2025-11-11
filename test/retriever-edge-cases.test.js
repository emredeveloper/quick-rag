/**
 * Tests for Retriever edge cases and advanced features
 */

import assert from 'assert';
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

async function testRetrieverEdgeCases() {
  const store = new InMemoryVectorStore(testEmbedding);
  
  // Test empty store
  const retriever = new Retriever(store);
  const emptyResults = await retriever.getRelevant('test', 5);
  assert.strictEqual(emptyResults.length, 0, 'should return empty array for empty store');
  
  // Add documents
  await store.addDocuments([
    { id: '1', text: 'Document one', meta: { category: 'A', tags: ['tag1', 'tag2'] } },
    { id: '2', text: 'Document two', meta: { category: 'B', tags: ['tag2'] } },
    { id: '3', text: 'Document three', meta: { category: 'A' } }
  ]);
  
  // Test array contains filter
  const tagFilter = await retriever.getRelevant('document', 5, {
    filters: { tags: 'tag1' }
  });
  assert.ok(tagFilter.every(doc => 
    doc.meta.tags && doc.meta.tags.includes('tag1')
  ), 'should filter by array contains');
  
  // Test regex filter
  const regexFilter = await retriever.getRelevant('document', 5, {
    filters: { category: /^A$/ }
  });
  assert.ok(regexFilter.every(doc => doc.meta.category === 'A'), 'should filter by regex');
  
  // Test topK override
  const retrieverK2 = new Retriever(store, { k: 2 });
  const resultsK1 = await retrieverK2.getRelevant('document', 1);
  assert.strictEqual(resultsK1.length, 1, 'should respect topK parameter override');
  
  // Test with no topK (uses default k)
  const resultsDefault = await retrieverK2.getRelevant('document');
  assert.strictEqual(resultsDefault.length, 2, 'should use default k when topK not provided');
  
  // Test filter with no metadata
  await store.addDocument({ id: '4', text: 'No metadata document' });
  const noMetaResults = await retriever.getRelevant('document', 5, {
    filters: { category: 'A' }
  });
  assert.ok(noMetaResults.every(doc => doc.meta && doc.meta.category === 'A'), 
    'should filter out docs without matching metadata');
  
  console.log('✅ Retriever edge cases tests passed');
}

export async function runRetrieverEdgeCaseTests() {
  console.log('\n🧪 Running Retriever Edge Cases Tests...');
  await testRetrieverEdgeCases();
  console.log('✅ Retriever edge cases tests completed\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runRetrieverEdgeCaseTests().catch(console.error);
}

