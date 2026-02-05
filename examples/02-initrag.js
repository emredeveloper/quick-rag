import { initRAG } from 'quick-rag';

async function embedding(text, dim = 128) {
  const vec = new Array(dim).fill(0);
  for (let i = 0; i < text.length; i++) vec[i % dim] += text.charCodeAt(i);
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

const { retriever } = await initRAG(
  [
    { id: '1', text: 'LM Studio is a local model runtime.' },
    { id: '2', text: 'Ollama runs local models with a simple API.' }
  ],
  {
    defaultDim: 64,
    mrlBaseDim: 128,
    baseEmbeddingOptions: { createEmbedding: embedding }
  }
);

const docs = await retriever.getRelevant('local model runtime', 1);
console.log(docs[0]);
