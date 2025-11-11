/**
 * Quick RAG v2.0.0 - Features Showcase
 * 
 * Demonstrates: Query Explainability & Decision Engine
 * Run: node v2-features-showcase.js
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
const embed = createOllamaRAGEmbedding(client, 'embeddinggemma:latest');
const store = new InMemoryVectorStore(embed);
const retriever = new Retriever(store);

const docs = [
  { id: '1', text: 'React is a JavaScript library for building user interfaces.', meta: { year: 2013, source: 'official' } },
  { id: '2', text: 'Ollama provides local LLM hosting capabilities.', meta: { year: 2023, source: 'official' } },
  { id: '3', text: 'RAG uses retrieval to augment model responses.', meta: { year: 2020, source: 'research' } }
];

async function main() {
  await store.addDocuments(docs);
  const query = 'What is React?';

  // Feature 1: Query Explainability
  console.log('🔍 Query Explainability:\n');
  const results = await retriever.getRelevant(query, 2, { explain: true });
  results.forEach((doc, i) => {
    console.log(`${i + 1}. ${doc.text.substring(0, 50)}...`);
    console.log(`   Score: ${(doc.score * 100).toFixed(1)}%`);
    if (doc.explanation) {
      console.log(`   Matched: ${doc.explanation.matchedTerms.join(', ')}`);
    }
    console.log();
  });

  // Feature 2: Decision Engine
  console.log('🎯 Decision Engine:\n');
  const smartRetriever = new SmartRetriever(retriever);
  const smartResults = await smartRetriever.getRelevant(query, 2);
  smartResults.results.forEach((doc, i) => {
    console.log(`${i + 1}. ${doc.text.substring(0, 50)}...`);
    console.log(`   Weighted Score: ${(doc.weightedScore * 100).toFixed(1)}%`);
    console.log();
  });

  // Generate answer
  const answer = await generateWithRAG(client, 'granite4:3b', query, smartResults.results);
  console.log('🤖 Answer:', typeof answer === 'string' ? answer : answer.response);
}

main().catch(console.error);
