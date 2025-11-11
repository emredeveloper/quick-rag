/**
 * Streaming with Ollama
 * Stream responses in real-time
 */

import {
  OllamaRAGClient,
  createOllamaRAGEmbedding,
  InMemoryVectorStore,
  Retriever
} from '../src/index.js';

async function main() {
  console.log('📡 Streaming - Ollama Example\n');

  // Setup
  const client = new OllamaRAGClient();
  const embed = createOllamaRAGEmbedding(client, 'embeddinggemma');
  const store = new InMemoryVectorStore(embed);

  // Add knowledge
  const docs = [
    { text: 'Streaming allows real-time response generation.' },
    { text: 'Tokens are sent as they are generated, improving user experience.' }
  ];
  await store.addDocuments(docs);

  // Query
  const retriever = new Retriever(store, { k: 2 });
  const query = 'What is streaming?';
  const results = await retriever.getRelevant(query);

  console.log(`🔍 Query: "${query}"\n`);
  console.log('📋 Context:', results.length, 'documents\n');

  // Build context
  const context = results.map(r => r.text).join('\n');
  const prompt = `Context:\n${context}\n\nQuestion: ${query}\n\nAnswer:`;

  // Stream response
  console.log('🤖 Streaming response:\n');
  console.log('─'.repeat(60));
  
  const stream = await client.ollama.generate({
    model: 'granite4:tiny-h',
    prompt: prompt,
    stream: true
  });

  for await (const chunk of stream) {
    process.stdout.write(chunk.response);
  }

  console.log('\n' + '─'.repeat(60));
  console.log('\n✅ Streaming completed!');
}

main().catch(console.error);
