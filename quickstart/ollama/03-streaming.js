/**
 * Quick RAG - Streaming
 * Run: node ollama/03-streaming.js
 */

import { OllamaRAGClient, createOllamaRAGEmbedding, InMemoryVectorStore, Retriever } from 'quick-rag';

const client = new OllamaRAGClient();
const embed = createOllamaRAGEmbedding(client, 'nomic-embed-text');
const store = new InMemoryVectorStore(embed);
const retriever = new Retriever(store);

async function main() {
  await store.addDocument({ text: 'Robots are now being programmed to appreciate music.' });

  const query = 'Write a short story about a robot who discovers music.';
  const results = await retriever.getRelevant('robot music', 1);
  const context = results.map(d => d.text).join('\n');

  console.log('Streaming response:\n');
  const response = await client.chat({
    model: 'granite4:3b',
    messages: [{ role: 'user', content: `Context: ${context}\n\n${query}` }],
    stream: true
  });

  for await (const part of response) {
    process.stdout.write(part.message?.content || '');
  }
  console.log('\n');
}

main().catch(console.error);
