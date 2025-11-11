/**
 * Quick RAG - Metadata Filtering
 * Run: node ollama/04-metadata-filtering.js
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
  { text: 'Paris is the capital of France.', meta: { topic: 'geography' } },
  { text: 'The Eiffel Tower is in Paris.', meta: { topic: 'landmarks' } },
  { text: 'The Louvre Museum is in Paris.', meta: { topic: 'art' } }
];

async function main() {
  await store.addDocuments(docs);

  // With filter
  const query1 = 'What famous landmark is in Paris?';
  const results1 = await retriever.getRelevant(query1, 1, { filters: { topic: 'landmarks' } });
  const answer1 = await generateWithRAG(client, 'granite4:3b', query1, results1.map(d => d.text));

  console.log('With filter:', answer1.response);

  // Without filter
  const query2 = 'What is the capital of France?';
  const results2 = await retriever.getRelevant(query2, 1);
  const answer2 = await generateWithRAG(client, 'granite4:3b', query2, results2.map(d => d.text));

  console.log('\nWithout filter:', answer2.response);
}

main().catch(console.error);
