/**
 * Quick RAG - Document Loading
 * Run: node ollama/02-document-loading.js
 */

import { 
  OllamaRAGClient, 
  createOllamaRAGEmbedding,
  InMemoryVectorStore, 
  Retriever,
  generateWithRAG
} from 'quick-rag';

const client = new OllamaRAGClient();
const embed = createOllamaRAGEmbedding(client, 'nomic-embed-text');
const store = new InMemoryVectorStore(embed);
const retriever = new Retriever(store);

const docs = [
  { text: 'The sky appears blue due to Rayleigh scattering.', meta: { topic: 'physics' } },
  { text: 'Neil Armstrong was the first person on the moon in 1969.', meta: { topic: 'space' } },
  { text: 'JavaScript is used for web development.', meta: { topic: 'programming' } }
];

async function main() {
  await store.addDocuments(docs);

  const query = 'What causes the sky to look blue?';
  const results = await retriever.getRelevant(query, 1);
  const answer = await generateWithRAG(client, 'granite4:3b', query, results.map(d => d.text));

  console.log('Q:', query);
  console.log('A:', answer.response);
}

main().catch(console.error);
