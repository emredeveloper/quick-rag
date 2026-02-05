import {
  InMemoryVectorStore,
  Retriever,
  createMRL,
  generateWithRAG,
  chunkText
} from 'quick-rag';

async function embedding(text, dim = 128) {
  const vec = new Array(dim).fill(0);
  for (let i = 0; i < text.length; i++) vec[i % dim] += text.charCodeAt(i);
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

const docs = chunkText(
  'RAG combines retrieval and generation. Quick RAG gives JS utilities for this.',
  { chunkSize: 60, overlap: 10 }
).map((text, i) => ({ id: String(i + 1), text }));

const mrl = createMRL(embedding, 128);
const store = new InMemoryVectorStore(mrl, { defaultDim: 64 });
await store.addDocuments(docs, { dim: 64 });

const retriever = new Retriever(store, { k: 2 });
const results = await retriever.getRelevant('What is RAG?', 2);

const fakeClient = {
  async generate({ model, prompt }) {
    return { response: `[${model}] ${prompt.slice(0, 80)}...` };
  }
};

const out = await generateWithRAG(fakeClient, 'local-demo', 'What is RAG?', results);

console.log('results:', results.length);
console.log('response:', out.response);
