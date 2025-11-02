import assert from 'assert';
import { InMemoryVectorStore } from '../src/vectorStore.js';
import { Retriever } from '../src/retriever.js';

// Local deterministic embedding used only for tests (keeps tests independent
// of external services). This replaces the removed demo "dummyEmbedding".
async function testEmbedding(text, dim = 128) {
  const vec = new Array(dim).fill(0);
  for (let i = 0; i < text.length; i++) {
    vec[i % dim] += text.charCodeAt(i);
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map(v => v / norm);
}

async function testVectorStore() {
  const store = new InMemoryVectorStore(testEmbedding);
  await store.addDocuments([
    { id: 'a', text: 'apple fruit' },
    { id: 'b', text: 'banana yellow' },
    { id: 'c', text: 'carrot vegetable' }
  ]);
  const results = await store.similaritySearch('I like yellow fruit', 2);
  assert(Array.isArray(results), 'results should be array');
  assert(results.length === 2, 'should return top 2');
  results.forEach(r => {
    assert('id' in r, 'result should have id');
    assert('score' in r, 'result should have score');
    assert(typeof r.score === 'number' && !isNaN(r.score));
  });
  console.log('vectorStore tests passed');
}

async function testRetriever() {
  const store = new InMemoryVectorStore(testEmbedding);
  await store.addDocuments([
    { id: '1', text: 'React builds UIs' },
    { id: '2', text: 'Node.js is server side JS' },
    { id: '3', text: 'Ollama hosts local models' }
  ]);
  const retriever = new Retriever(store, { k: 2 });
  const docs = await retriever.getRelevant('build UI with JavaScript');
  assert(Array.isArray(docs) && docs.length === 2);
  console.log('retriever tests passed');
}

async function run() {
  await testVectorStore();
  await testRetriever();
  console.log('ALL TESTS OK');
}

run().catch(err => {
  console.error('Tests failed', err);
  process.exit(1);
});
