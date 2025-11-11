/**
 * Quickstart: Basic RAG with Ollama
 * Run: node 01-ollama-basic.js
 */

import {
  OllamaRAGClient,
  createOllamaRAGEmbedding,
  InMemoryVectorStore,
  Retriever,
  generateWithRAG,
} from 'quick-rag';

const client = new OllamaRAGClient();
const embed = createOllamaRAGEmbedding(client, 'embeddinggemma:latest');
const store = new InMemoryVectorStore(embed);
const retriever = new Retriever(store);

async function main() {
  await store.addDocuments([
    { text: 'The sky is blue due to Rayleigh scattering.' },
    { text: 'The ocean is salty because of dissolved minerals.' }
  ]);

  const query = 'Why is the sky blue?';
  const results = await retriever.getRelevant(query, 1);
  const answer = await generateWithRAG(client, 'granite4:3b', query, results);

  console.log('Q:', query);
  console.log('A:', typeof answer === 'string' ? answer : answer.response);
}

main().catch(console.error);
