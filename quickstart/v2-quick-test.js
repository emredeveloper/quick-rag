/**
 * Quick RAG v2.0.0 - Quick Test
 * 
 * Minimal test to verify everything works
 * Run: node v2-quick-test.js
 */

import {
  OllamaRAGClient,
  createOllamaRAGEmbedding,
  InMemoryVectorStore,
  Retriever
} from 'quick-rag';

const client = new OllamaRAGClient();
    const embed = createOllamaRAGEmbedding(client, 'embeddinggemma:latest');
    const store = new InMemoryVectorStore(embed);
    const retriever = new Retriever(store);

async function main() {
    await store.addDocument({
      id: '1',
      text: 'Quick RAG v2.0 is a production-ready RAG framework.'
    });

    const results = await retriever.getRelevant('What is Quick RAG?', 1);
  console.log('Query: What is Quick RAG?');
  console.log('Result:', results[0].text);
  console.log('Score:', (results[0].score * 100).toFixed(1) + '%');
}

main().catch(console.error);
