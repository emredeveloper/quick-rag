/**
 * Official LM Studio SDK Integration Example
 * Tests with all available models in LM Studio
 * 
 * Features showcased:
 * - Official LM Studio SDK
 * - Multiple model testing
 * - Vector store with embeddings
 * - RAG with context retrieval
 * 
 * Prerequisites:
 * 1. Install LM Studio from https://lmstudio.ai/
 * 2. Download models shown in the screenshot:
 *    - qwen/qwen3-vl-4b (5.12 GB)
 *    - google/gemma-3-4b (4.98 GB)
 *    - google/gemma-3n-e4b (4.24 GB)
 *    - qwen/qwen3-4b-2507 (2.50 GB)
 * 3. Start LM Studio server (Developer > Local Server)
 * 
 * Run: node example/official-lmstudio-example.js
 */

import { 
  LMStudioRAGClient, 
  createLMStudioRAGEmbedding,
  InMemoryVectorStore, 
  Retriever 
} from '../src/index.node.js';

async function testWithModel(client, modelPath, documents, query) {
  console.log(`\n${'═'.repeat(80)}`);
  console.log(`🧪 Testing with: ${modelPath}`);
  console.log('═'.repeat(80));

  try {
    // Setup embedding with verbose disabled
    const embed = createLMStudioRAGEmbedding(
      client, 
      'nomic-embed-text-v1.5',
      { verbose: false }
    );

    // Create vector store with embedding function
    const vectorStore = new InMemoryVectorStore(embed);
    const retriever = new Retriever(vectorStore);

    // Add documents
    console.log('\n📚 Adding documents...');
    for (const doc of documents) {
      await vectorStore.addDocument({ text: doc });
    }
    console.log(`✅ Added ${documents.length} documents`);

    // Retrieve relevant context
    console.log(`\n🔍 Query: "${query}"`);
    const results = await retriever.getRelevant(query, 2);
    
    console.log('\n📄 Retrieved context:');
    results.forEach((doc, i) => {
      const relevance = (doc.score * 100).toFixed(1);
      console.log(`   ${i + 1}. [${relevance}%] ${doc.text}`);
    });

    // Prepare context
    const context = results.map(d => d.text).join('\n');
    const promptText = `Context:\n${context}\n\nQuestion: ${query}\n\nAnswer based on the context:`;

    // Generate response
    console.log('\n💬 AI Response:');
    console.log('─'.repeat(80));
    
    // Use official SDK's respond method
    const model = await client.getModel(modelPath, { verbose: false });
    const response = await model.respond(promptText, {
      temperature: 0.7,
      maxPredictedTokens: 256
    });

    // Check if response is streamable or direct text
    if (typeof response === 'string') {
      // Direct string response
      console.log(`   ${response}`);
    } else if (response.content) {
      // Response object with content
      console.log(`   ${response.content}`);
    } else if (Symbol.asyncIterator in Object(response)) {
      // Async iterable (streaming)
      process.stdout.write('   ');
      for await (const text of response) {
        process.stdout.write(text);
      }
      console.log('');
    } else {
      // Unknown format
      console.log(`   ${JSON.stringify(response)}`);
    }

    console.log('─'.repeat(80));
    console.log(`✅ ${modelPath} - SUCCESS\n`);

  } catch (error) {
    console.log('─'.repeat(80));
    console.log(`❌ ${modelPath} - FAILED`);
    console.log(`   Error: ${error.message}`);
    if (error.message.includes('not found') || error.message.includes('not loaded')) {
      console.log(`   💡 Tip: Load this model in LM Studio first`);
    }
    console.log('');
  }
}

async function main() {
  console.log('🎨 Official LM Studio SDK + RAG Example');
  console.log('Testing all available models from screenshot\n');

  // Initialize LM Studio client
  const client = new LMStudioRAGClient();

  // Test documents
  const documents = [
    'LM Studio is a desktop application for running LLMs locally.',
    'It provides a user-friendly interface with model management.',
    'LM Studio supports various model formats including GGUF.',
    'The application includes a built-in chat interface and API server.',
  ];

  const query = 'What is LM Studio?';

  // List available models first
  console.log('📋 Checking available models...\n');
  try {
    const downloaded = await client.listDownloaded();
    console.log(`Found ${downloaded.length} downloaded model(s):`);
    downloaded.forEach((model, i) => {
      console.log(`   ${i + 1}. ${model.path || model.id}`);
    });

    const loaded = await client.listLoaded();
    console.log(`\nCurrently loaded: ${loaded.length} model(s)`);
    if (loaded.length > 0) {
      loaded.forEach((model, i) => {
        console.log(`   ${i + 1}. ${model.path || model.id}`);
      });
    }
  } catch (error) {
    console.log(`⚠️  Could not list models: ${error.message}`);
    console.log('   Make sure LM Studio server is running (Developer > Local Server)');
  }

  // Models from screenshot
  const modelsToTest = [
    'qwen/qwen3-vl-4b',      // 5.12 GB
    'google/gemma-3-4b',     // 4.98 GB  
    'google/gemma-3n-e4b',   // 4.24 GB
    'qwen/qwen3-4b-2507',    // 2.50 GB
  ];

  // Test each model
  for (const modelPath of modelsToTest) {
    await testWithModel(client, modelPath, documents, query);
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Summary
  console.log(`\n${'═'.repeat(80)}`);
  console.log('📊 Test Summary');
  console.log('═'.repeat(80));
  console.log(`\nTested ${modelsToTest.length} models from screenshot`);
  console.log('\n✨ All tests completed!\n');
}

main().catch(error => {
  console.error('\n❌ Fatal Error:', error.message);
  console.error('\nTroubleshooting:');
  console.error('1. Make sure LM Studio is installed and running');
  console.error('2. Start the local server: Developer > Local Server');
  console.error('3. Load at least one model in LM Studio');
  console.error('4. Download an embedding model (e.g., nomic-embed-text-v1.5)');
  console.error('5. Server should be on http://localhost:1234');
  process.exit(1);
});
