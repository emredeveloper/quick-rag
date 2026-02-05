import {
  InMemoryVectorStore,
  HybridRetriever,
  Reranker,
  QueryExpander,
  createMRL
} from 'quick-rag';

async function embedding(text, dim = 128) {
  const vec = new Array(dim).fill(0);
  for (let i = 0; i < text.length; i++) vec[i % dim] += text.charCodeAt(i);
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

const store = new InMemoryVectorStore(createMRL(embedding, 128), { defaultDim: 64 });
const hybrid = new HybridRetriever(store, { alpha: 0.5, fusionMethod: 'rrf' });

await hybrid.addDocuments(
  [
    { id: '1', text: 'Node.js API performance tuning with caching.' },
    { id: '2', text: 'Frontend React rendering optimization.' },
    { id: '3', text: 'Database indexing and query speed.' }
  ],
  { dim: 64 }
);

const expander = new QueryExpander();
const expanded = expander.expand('api speed');
console.log('expanded query:', expanded.expanded);

const hybridResults = await hybrid.getRelevant(expanded.expanded, 3, { explain: true });
const reranker = new Reranker();
const reranked = reranker.rerank(expanded.expanded, hybridResults, { explain: true, topK: 2 });

console.log('hybrid top:', hybridResults.map((d) => `${d.id}:${d.score.toFixed(3)}`));
console.log('reranked top:', reranked.map((d) => `${d.id}:${d.score.toFixed(3)}`));
