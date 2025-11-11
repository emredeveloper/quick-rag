/**
 * Quickstart: Basic RAG with LM Studio
 * Run: node 02-lmstudio-basic.js
 */

import {
  LMStudioRAGClient,
  createLMStudioRAGEmbedding,
  InMemoryVectorStore,
  Retriever,
  generateWithRAG,
} from 'quick-rag';

const client = new LMStudioRAGClient();
const embed = createLMStudioRAGEmbedding(client, 'text-embedding-embeddinggemma-300m');
const store = new InMemoryVectorStore(embed);
const retriever = new Retriever(store);

async function main() {
    await store.addDocuments([
      { text: 'React is a JavaScript library for building user interfaces.' },
    { text: 'Vue is a progressive framework for building user interfaces.' }
    ]);

    const query = 'What is React?';
  const results = await retriever.getRelevant(query, 1);
  const answer = await generateWithRAG(client, 'qwen/qwen3-vl-4b', query, results);

  console.log('Q:', query);
  console.log('A:', typeof answer === 'string' ? answer : answer.response);
}

main().catch(console.error);
