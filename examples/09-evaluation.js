import {
  InMemoryVectorStore,
  Retriever,
  createMRL,
  RAGEvaluator,
  precisionAtK,
  meanReciprocalRank
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
    { id: 'd1', text: 'RAG retrieves relevant context.' },
    { id: 'd2', text: 'Embeddings convert text to vectors.' },
    { id: 'd3', text: 'Caching improves repeated query latency.' }
  ],
  { dim: 64 }
);

const retriever = new Retriever(store, { k: 3 });
const evaluatorRetriever = {
  async search(query, options = {}) {
    return retriever.getRelevant(query, options.k ?? 3);
  }
};

const evaluator = new RAGEvaluator(evaluatorRetriever);
const testQueries = [
  { query: 'What does RAG do?', relevantDocs: ['d1'] },
  { query: 'What are embeddings?', relevantDocs: ['d2'] }
];
const result = await evaluator.evaluate(testQueries);

console.log('MRR:', result.metrics.mrr);
console.log('Precision@1:', result.metrics['precision@1']);

const retrieved = ['d1', 'd3', 'd2'];
const relevant = ['d1', 'd2'];
console.log('manual precision@3:', precisionAtK(retrieved, relevant, 3));
console.log('manual mrr:', meanReciprocalRank(retrieved, relevant));
