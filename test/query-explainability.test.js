/**
 * Tests for Query Explainability
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

async function testQueryExplainability() {
  const store = new InMemoryVectorStore(testEmbedding);
  
  await store.addDocuments([
    { id: '1', text: 'React is a JavaScript library for building user interfaces.', meta: { topic: 'react' } },
    { id: '2', text: 'Python is a programming language used for data science.', meta: { topic: 'python' } },
    { id: '3', text: 'Ollama provides local LLM hosting capabilities.', meta: { topic: 'ollama' } }
  ]);
  
  const retriever = new Retriever(store);
  
  // Test without explain
  const resultsNoExplain = await retriever.getRelevant('What is React?', 2);
  assert.ok(!resultsNoExplain[0].explanation, 'should not have explanation when explain=false');
  
  // Test with explain
  const resultsWithExplain = await retriever.getRelevant('What is React?', 2, { explain: true });
  
  assert.ok(resultsWithExplain.length > 0, 'should return results');
  assert.ok(resultsWithExplain[0].explanation, 'should have explanation when explain=true');
  
  const explanation = resultsWithExplain[0].explanation;
  assert.ok(Array.isArray(explanation.queryTerms), 'should have queryTerms array');
  assert.ok(Array.isArray(explanation.matchedTerms), 'should have matchedTerms array');
  assert.ok(typeof explanation.matchCount === 'number', 'should have matchCount');
  assert.ok(typeof explanation.matchRatio === 'number', 'should have matchRatio');
  assert.ok(typeof explanation.cosineSimilarity === 'number', 'should have cosineSimilarity');
  assert.ok(explanation.relevanceFactors, 'should have relevanceFactors');
  
  // Verify explanation content
  assert.ok(explanation.queryTerms.length > 0, 'should extract query terms');
  assert.ok(explanation.matchedTerms.length >= 0, 'should have matched terms (can be 0)');
  assert.ok(explanation.matchRatio >= 0 && explanation.matchRatio <= 1, 'matchRatio should be 0-1');
  assert.ok(explanation.cosineSimilarity >= 0 && explanation.cosineSimilarity <= 1, 'cosineSimilarity should be 0-1');
  
  console.log('✅ Query Explainability tests passed');
}

export async function runQueryExplainabilityTests() {
  console.log('\n🧪 Running Query Explainability Tests...');
  await testQueryExplainability();
  console.log('✅ Query Explainability tests completed\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runQueryExplainabilityTests().catch(console.error);
}

