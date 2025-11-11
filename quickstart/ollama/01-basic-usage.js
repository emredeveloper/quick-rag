/**
 * Quick RAG - Basic Usage
 * Run: node ollama/01-basic-usage.js
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

async function main() {
  await store.addDocument({ 
    text: 'The sky appears blue due to Rayleigh scattering.',
    meta: { source: 'science', topic: 'physics' }
  });

  const query = 'Why is the sky blue?';
  const results = await retriever.getRelevant(query, 1);
  const answer = await generateWithRAG(client, 'granite4:3b', query, results.map(d => d.text));

  console.log('Q:', query);
  console.log('A:', answer.response);
}

main().catch(console.error);
