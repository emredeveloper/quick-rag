import {
  CacheManager,
  InMemoryVectorStore,
  Retriever,
  createMRL
} from 'quick-rag';

async function embedding(text, dim = 128) {
  const vec = new Array(dim).fill(0);
  for (let i = 0; i < text.length; i++) vec[i % dim] += text.charCodeAt(i);
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

const cache = new CacheManager({
  embeddings: { maxSize: 100, ttl: 60_000 },
  queries: { maxSize: 100, ttl: 60_000 }
});

const cachedEmbedding = cache.wrapEmbedding(createMRL(embedding, 128));
const store = new InMemoryVectorStore(cachedEmbedding, { defaultDim: 64 });
await store.addDocuments([{ id: '1', text: 'Caching reduces repeated compute cost.' }], { dim: 64 });

const retriever = new Retriever(store, { k: 1 });
const cachedRetriever = cache.wrapRetriever((q, opts) => retriever.getRelevant(q, opts?.k ?? 1));

await cachedRetriever('caching', { k: 1 });
await cachedRetriever('caching', { k: 1 });

console.log(cache.getStats());
