import {
  InMemoryVectorStore,
  Retriever,
  createMRL,
  createSmartRetriever
} from 'quick-rag';

async function embedding(text, dim = 128) {
  const vec = new Array(dim).fill(0);
  for (let i = 0; i < text.length; i++) vec[i % dim] += text.charCodeAt(i);
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

const store = new InMemoryVectorStore(createMRL(embedding, 128), { defaultDim: 64 });
await store.addDocuments(
  [
    { id: '1', text: 'Official docs explain API usage clearly.', meta: { source: 'official-docs' } },
    { id: '2', text: 'Community forum post about API issue.', meta: { source: 'forum' } },
    { id: '3', text: 'Recent release notes and migration details.', meta: { source: 'documentation', date: '2026-02-01' } }
  ],
  { dim: 64 }
);

const baseRetriever = new Retriever(store, { k: 3 });
const smart = createSmartRetriever(baseRetriever, { enableLearning: true });

const out = await smart.getRelevant('latest api docs', 2, { critical: true });
console.log('effective query:', out.query);
console.log('decisions:', out.decisions);
console.log('top ids:', out.results.map((r) => `${r.id}:${r.weightedScore.toFixed(3)}`));
