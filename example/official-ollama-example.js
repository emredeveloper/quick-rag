/**
 * Official Ollama SDK Integration Example
 * Demonstrates using the official ollama package with RAG
 * 
 * Features showcased:
 * - Official Ollama SDK streaming
 * - Vector store with embeddings
 * - RAG with context retrieval
 * - All official SDK features available
 * 
 * Run: node example/official-ollama-example.js
 */

import { 
  OllamaRAGClient, 
  createOllamaRAGEmbedding,
  InMemoryVectorStore, 
  Retriever 
} from '../src/index.node.js';

async function main() {
  console.log('🦙 Official Ollama SDK + RAG Example\n');

  // 1. Initialize client using official SDK
  const client = new OllamaRAGClient({
    host: 'http://127.0.0.1:11434'
  });

  // 2. Setup embedding function
  const embed = createOllamaRAGEmbedding(client, 'embeddinggemma');

  // 3. Create vector store with embedding function
  const vectorStore = new InMemoryVectorStore(embed);
  const retriever = new Retriever(vectorStore);

  // 4. Add documents
  console.log('📚 Adding documents...\n');
  
  const documents = [
    'The official Ollama JavaScript library provides streaming support.',
    'You can use tool calling and function execution with Ollama models.',
    'Vision models can process images alongside text prompts.',
    'The library supports both chat and completion endpoints.',
  ];

  for (const doc of documents) {
    await vectorStore.addDocument({ text: doc });
  }

  console.log(`✅ Added ${documents.length} documents\n`);

  // 5. Query with streaming
  const query = 'What features does the Ollama library have?';
  console.log(`🔍 Query: "${query}"`);
  console.log('─'.repeat(70));

  // Retrieve relevant context
  const results = await retriever.getRelevant(query, 2);
  
  console.log('\n📄 Retrieved context:');
  results.forEach((doc, i) => {
    const relevance = (doc.score * 100).toFixed(1);
    console.log(`   ${i + 1}. [${relevance}%] ${doc.text}`);
  });

  // Prepare context for the model
  const context = results.map(d => d.text).join('\n');
  const prompt = `Context:\n${context}\n\nQuestion: ${query}\n\nAnswer based on the context:`;

  // 6. Generate with streaming (official SDK feature!)
  console.log('\n💬 AI Response (streaming):');
  console.log('─'.repeat(70));
  process.stdout.write('   ');

  const response = await client.chat({
    model: 'granite4:tiny-h',
    messages: [{ role: 'user', content: prompt }],
    stream: true, // Official SDK streaming!
  });

  // Stream the response
  for await (const part of response) {
    if (part.message?.content) {
      process.stdout.write(part.message.content);
    }
  }

  console.log('\n\n' + '─'.repeat(70));

  // 7. Demonstrate other official SDK features
  console.log('\n📊 Additional SDK Features:\n');

  // List models
  const models = await client.list();
  console.log(`   Available models: ${models.models.length} models`);

  // Show model details
  const modelInfo = await client.show({ model: 'granite4:tiny-h' });
  console.log(`   Model info: ${modelInfo.details?.parameter_size} parameters`);

  // Check running models
  const running = await client.ps();
  console.log(`   Running models: ${running.models.length} model(s)`);

  console.log('\n✨ Done!\n');
}

main().catch(error => {
  console.error('\n❌ Error:', error.message);
  console.error('\nMake sure:');
  console.error('1. Ollama is installed and running');
  console.error('2. Models are pulled: ollama pull granite4:tiny-h && ollama pull embeddinggemma');
  process.exit(1);
});
