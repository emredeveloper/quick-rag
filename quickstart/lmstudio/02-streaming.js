/**
 * Quick RAG - LM Studio Examples
 * Run: node lmstudio/02-streaming.js
 */

import { 
  LMStudioRAGClient,
  createLMStudioRAGEmbedding,
  InMemoryVectorStore, 
  Retriever,
  generateWithRAG
} from 'quick-rag';

async function main() {
  console.log('🚀 Quick RAG - LM Studio\n');

  const client = new LMStudioRAGClient();
  const embed = createLMStudioRAGEmbedding(client, 'text-embedding-embeddinggemma-300m');
  const store = new InMemoryVectorStore(embed);
  const retriever = new Retriever(store);

  const docs = [
    { text: 'RAG combines LLMs with information retrieval for accurate responses.' },
    { text: 'Vector embeddings convert text into numerical representations.' }
  ];

  await store.addDocuments(docs);

  const query = 'What is RAG?';
  const results = await retriever.getRelevant(query, 2);
  const answer = await generateWithRAG(client, 'qwen/qwen3-4b-2507', query, results);

  console.log('Q:', query);
  console.log('A:', typeof answer === 'string' ? answer : answer.response);
}

main().catch(console.error);
