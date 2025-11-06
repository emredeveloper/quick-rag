/**
 * Quick RAG - Streaming Example
 * 
 * Shows how to use streaming responses from Ollama
 */

import { 
  OllamaRAGClient, 
  createOllamaRAGEmbedding,
  InMemoryVectorStore, 
  Retriever
} from 'quick-rag';

async function main() {
  console.log('🚀 Quick RAG - Streaming Example\n');

  // Initialize
  const client = new OllamaRAGClient();
  const embed = createOllamaRAGEmbedding(client, 'nomic-embed-text');
  const vectorStore = new InMemoryVectorStore(embed);
  const retriever = new Retriever(vectorStore);

  // Add context document
  await vectorStore.addDocument({ 
    text: 'Music is a universal language that can evoke emotions and bring people together. Robots, traditionally seen as logical machines, are now being programmed to appreciate and create music.',
    meta: { source: 'ai-stories' }
  });

  console.log('✅ Context loaded\n');

  // Query
  const query = 'Write a very short story about a robot who discovers music.';
  console.log(`❓ Query: ${query}\n`);

  const results = await retriever.getRelevant('robot music', 1);
  const context = results.map(d => d.text).join('\n');

  // Stream response
  console.log('🤖 Story (streaming):\n');
  console.log('─'.repeat(60));

  const response = await client.chat({
    model: 'granite4:3b',
    messages: [{ 
      role: 'user', 
      content: `Context: ${context}\n\n${query}` 
    }],
    stream: true
  });

  for await (const part of response) {
    process.stdout.write(part.message?.content || '');
  }

  console.log('\n' + '─'.repeat(60));
  console.log('\n✅ Streaming completed!');
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
