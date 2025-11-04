/**
 * Tests for Retriever Metadata Filtering
 */

import assert from 'assert';
import { InMemoryVectorStore } from '../src/vectorStore.js';
import { Retriever } from '../src/retriever.js';

// Test embedding (deterministic)
async function testEmbedding(text, dim = 128) {
  const vec = new Array(dim).fill(0);
  for (let i = 0; i < text.length; i++) {
    vec[i % dim] += text.charCodeAt(i);
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map(v => v / norm);
}

async function testMetadataFiltering() {
  const store = new InMemoryVectorStore(testEmbedding);
  
  // Add documents with different metadata
  await store.addDocuments([
    { id: '1', text: 'JavaScript tutorial', meta: { source: 'web', year: 2024 } },
    { id: '2', text: 'JavaScript guide', meta: { source: 'book', year: 2024 } },
    { id: '3', text: 'Python tutorial', meta: { source: 'web', year: 2023 } },
    { id: '4', text: 'React documentation', meta: { source: 'docs', year: 2024 } }
  ]);

  const retriever = new Retriever(store, { k: 3 });

  // Test 1: No filter (should return top 3)
  const noFilter = await retriever.getRelevant('tutorial', 3);
  assert.strictEqual(noFilter.length, 3, 'should return 3 results without filter');

  // Test 2: Filter by source
  const webOnly = await retriever.getRelevant('tutorial', 3, {
    filters: { source: 'web' }
  });
  assert(webOnly.every(doc => doc.meta.source === 'web'), 'should only return web sources');

  // Test 3: Filter by year
  const year2024 = await retriever.getRelevant('tutorial', 3, {
    filters: { year: 2024 }
  });
  assert(year2024.every(doc => doc.meta.year === 2024), 'should only return 2024 docs');

  // Test 4: Multiple filters
  const webAnd2024 = await retriever.getRelevant('tutorial', 3, {
    filters: { source: 'web', year: 2024 }
  });
  assert(webAnd2024.every(doc => 
    doc.meta.source === 'web' && doc.meta.year === 2024
  ), 'should match all filters');

  console.log('✅ Metadata filtering tests passed');
}

async function testMinScoreFilter() {
  const store = new InMemoryVectorStore(testEmbedding);
  
  await store.addDocuments([
    { id: '1', text: 'exact match' },
    { id: '2', text: 'close match' },
    { id: '3', text: 'distant match' }
  ]);

  const retriever = new Retriever(store, { k: 5 });

  // Test with high minimum score
  const highScore = await retriever.getRelevant('exact match', 5, {
    minScore: 0.5
  });
  
  assert(highScore.length >= 1, 'should return at least one high-scoring result');
  assert(highScore.every(doc => doc.score >= 0.5), 'all results should meet minimum score');

  console.log('✅ Minimum score filtering tests passed');
}

export async function runRetrieverFilteringTests() {
  console.log('\n🧪 Running Retriever Filtering Tests...');
  await testMetadataFiltering();
  await testMinScoreFilter();
  console.log('✅ Retriever filtering tests completed\n');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runRetrieverFilteringTests().catch(console.error);
}
