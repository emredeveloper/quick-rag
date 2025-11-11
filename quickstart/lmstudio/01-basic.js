/**
 * Quick RAG - LM Studio Basic
 * Run: node lmstudio/01-basic.js
 */

import { 
  LMStudioRAGClient,
  createLMStudioRAGEmbedding,
  InMemoryVectorStore, 
  Retriever,
  generateWithRAG
} from 'quick-rag';

const client = new LMStudioRAGClient();
const embed = createLMStudioRAGEmbedding(client, 'text-embedding-embeddinggemma-300m');
const store = new InMemoryVectorStore(embed);
const retriever = new Retriever(store);

const docs = [
  { text: 'The sky appears blue due to Rayleigh scattering.', meta: { topic: 'science' } },
  { text: 'Neil Armstrong was the first person on the moon.', meta: { topic: 'history' } }
];

async function main() {
  await store.addDocuments(docs);

  const query = 'Why is the sky blue?';
  const results = await retriever.getRelevant(query, 1);
  const answer = await generateWithRAG(client, 'qwen/qwen3-4b-2507', query, results);

  console.log('Q:', query);
  console.log('A:', typeof answer === 'string' ? answer : answer.response);
}

main().catch(console.error);
