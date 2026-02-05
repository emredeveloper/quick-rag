/**
 * Streaming with LM Studio
 * Stream responses in real-time
 */

import {
  LMStudioRAGClient,
  createLMStudioRAGEmbedding,
  InMemoryVectorStore,
  Retriever
} from '../src/index.js';

async function main() {
  console.log('📡 Streaming - LM Studio Example\n');

  try {
    // Setup
    const client = new LMStudioRAGClient();
    const models = await client.listLoaded();
    
    if (models.length === 0) {
      console.log('⚠️  No models loaded in LM Studio');
      return;
    }

    const modelPath = models[0].path || models[0].id;
    console.log(`✅ Using model: ${modelPath}\n`);

    const embed = createLMStudioRAGEmbedding(client, 'text-embedding-qwen3-embedding-0.6b');
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
    
    const model = await client.getModel(modelPath);
    const prediction = model.respond(prompt, {
      temperature: 0.7,
      maxTokens: 200
    });

    for await (const chunk of prediction) {
      process.stdout.write(chunk);
    }

    console.log('\n' + '─'.repeat(60));
    console.log('\n✅ Streaming completed!');

  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Make sure LM Studio is running');
    }
  }
}

main().catch(console.error);
