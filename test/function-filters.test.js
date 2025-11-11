/**
 * Tests for Function-based Filters
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

async function testFunctionBasedFilters() {
  const store = new InMemoryVectorStore(testEmbedding);
  
  await store.addDocuments([
    { id: '1', text: 'JavaScript tutorial', meta: { year: 2024, difficulty: 'beginner', tags: ['web', 'js'] } },
    { id: '2', text: 'Python advanced guide', meta: { year: 2023, difficulty: 'advanced', tags: ['data', 'python'] } },
    { id: '3', text: 'React basics', meta: { year: 2024, difficulty: 'beginner', tags: ['web', 'react'] } },
    { id: '4', text: 'Node.js expert', meta: { year: 2024, difficulty: 'expert', tags: ['backend', 'node'] } }
  ]);
  
  const retriever = new Retriever(store);
  
  // Test function-based filter: year === 2024
  const year2024 = await retriever.getRelevant('tutorial', 5, {
    filter: (meta) => meta.year === 2024
  });
  assert.ok(year2024.every(doc => doc.meta.year === 2024), 'should only return 2024 documents');
  
  // Test function-based filter: difficulty !== 'expert'
  const notExpert = await retriever.getRelevant('guide', 5, {
    filter: (meta) => meta.difficulty !== 'expert'
  });
  assert.ok(notExpert.every(doc => doc.meta.difficulty !== 'expert'), 'should exclude expert level');
  
  // Test function-based filter: tags includes 'web'
  const webOnly = await retriever.getRelevant('tutorial', 5, {
    filter: (meta) => meta.tags && meta.tags.includes('web')
  });
  assert.ok(webOnly.every(doc => doc.meta.tags && doc.meta.tags.includes('web')), 'should only return web-tagged docs');
  
  // Test complex filter: year === 2024 AND difficulty === 'beginner'
  const complexFilter = await retriever.getRelevant('tutorial', 5, {
    filter: (meta) => meta.year === 2024 && meta.difficulty === 'beginner'
  });
  assert.ok(complexFilter.every(doc => 
    doc.meta.year === 2024 && doc.meta.difficulty === 'beginner'
  ), 'should match complex conditions');
  
  // Test filter with no matches
  const noMatches = await retriever.getRelevant('tutorial', 5, {
    filter: (meta) => meta.year === 1999
  });
  assert.ok(Array.isArray(noMatches), 'should return array even with no matches');
  
  console.log('✅ Function-based filter tests passed');
}

export async function runFunctionFilterTests() {
  console.log('\n🧪 Running Function-based Filter Tests...');
  await testFunctionBasedFilters();
  console.log('✅ Function-based filter tests completed\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runFunctionFilterTests().catch(console.error);
}

