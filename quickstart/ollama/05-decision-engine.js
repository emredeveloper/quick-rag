/**
 * Quick RAG - Decision Engine
 * Run: node ollama/05-decision-engine.js
 */

import { 
  OllamaRAGClient, 
  createOllamaRAGEmbedding,
  InMemoryVectorStore, 
  Retriever,
  SmartRetriever,
  generateWithRAG
} from 'quick-rag';

const client = new OllamaRAGClient();
const embed = createOllamaRAGEmbedding(client, 'nomic-embed-text');
const store = new InMemoryVectorStore(embed);
const retriever = new Retriever(store);

const docs = [
  { text: 'Python 3.12 was released in October 2023.', meta: { source: 'official', date: '2023-10-15' } },
  { text: 'I just started learning Python.', meta: { source: 'blog', date: '2024-11-01' } },
  { text: 'Research shows Python 3.12 is faster.', meta: { source: 'research', date: '2024-01-20' } }
];

async function main() {
  await store.addDocuments(docs);

  const smartRetriever = new SmartRetriever(retriever, {
    weights: {
      semanticSimilarity: 0.35,
      recency: 0.25,
      sourceQuality: 0.15
    }
  });

  const query = 'What are the latest Python features?';
  const results = await smartRetriever.getRelevant(query, 2);

  console.log('Smart Retrieval Results:');
  results.results.forEach((doc, i) => {
    console.log(`${i + 1}. [${doc.meta.source}] Score: ${(doc.weightedScore * 100).toFixed(1)}%`);
    console.log(`   "${doc.text}"`);
  });

  const answer = await generateWithRAG(client, 'granite4:3b', query, results.results.map(d => d.text));
  console.log('\nAnswer:', answer.response);
}

main().catch(console.error);
