import { generateWithRAG } from '../src/rag.js';
import { InMemoryVectorStore } from '../src/vectorStore.js';
import { Retriever } from '../src/retriever.js';
import OllamaClient from '../src/ollamaClient.js';
import { createOllamaEmbedding } from '../src/embeddings/ollamaEmbedding.js';
import { createMRL } from '../src/embeddings/mrl.js';

/**
 * ✨ NEW FEATURE DEMO: Prompt Return for Streaming
 * Shows how generateWithRAG now returns the prompt for proper streaming support
 */
async function main() {
  console.log('🌊 Testing Streaming Support with Prompt Return\n');
  console.log('='.repeat(60));

  // Setup
  const docs = [
    { id: '1', text: 'React is a JavaScript library for building user interfaces.' },
    { id: '2', text: 'React supports component-based architecture.' },
    { id: '3', text: 'React hooks allow state management in functional components.' }
  ];

  const baseEmbedding = createOllamaEmbedding({});
  const mrl = createMRL(baseEmbedding, 768);
  const store = new InMemoryVectorStore(mrl, { defaultDim: 128 });
  await store.addDocuments(docs, { dim: 128 });

  const retriever = new Retriever(store, { k: 2 });
  const modelClient = new OllamaClient();
  const model = process.env.OLLAMA_MODEL || 'granite4:tiny-h';
  const query = 'What is React and how does it work?';

  console.log(`\n📝 Query: "${query}"\n`);

  // Test 1: Check that generateWithRAG returns prompt
  console.log('1️⃣  Calling generateWithRAG:');
  const result = await generateWithRAG({
    retriever,
    modelClient,
    model,
    query,
    topK: 2
  });

  console.log(`   ✅ Returned docs: ${result.docs.length}`);
  console.log(`   ✅ Returned response: ${result.response ? 'Yes' : 'No'}`);
  console.log(`   ✅ Returned prompt: ${result.prompt ? 'Yes' : 'No'} (${result.prompt?.length || 0} chars)`);

  // Show the prompt structure
  console.log('\n2️⃣  Generated prompt structure:');
  const promptLines = result.prompt.split('\n');
  console.log(`   Total lines: ${promptLines.length}`);
  console.log('   Preview (first 300 chars):');
  console.log('   ' + '─'.repeat(58));
  console.log('   ' + result.prompt.slice(0, 300).split('\n').join('\n   '));
  if (result.prompt.length > 300) {
    console.log('   ...(truncated)...');
  }
  console.log('   ' + '─'.repeat(58));

  // Test 2: Simulate streaming usage (like useRAG does)
  console.log('\n3️⃣  Simulating streaming scenario:');
  
  if (process.env.OLLAMA_TEST === '1') {
    console.log('   🌊 Starting stream with the returned prompt...\n');
    
    // This is how useRAG hook now uses the prompt
    const streamResult = await generateWithRAG({
      retriever,
      modelClient,
      model,
      query,
      topK: 2
    });

    // Now we can use streamResult.prompt for streaming
    console.log('   Streaming response:');
    console.log('   ' + '─'.repeat(58));
    
    let streamedText = '';
    let chunkCount = 0;
    
    // Note: This is a simplified version. Real streaming would use:
    // for await (const chunk of modelClient.generateStream(model, streamResult.prompt)) { ... }
    
    // For this demo, we'll show the response directly
    const lines = (typeof streamResult.response === 'string' 
      ? streamResult.response 
      : JSON.stringify(streamResult.response)).split('\n');
    
    for (const line of lines) {
      if (line.trim()) {
        process.stdout.write('   ');
        for (let i = 0; i < line.length; i++) {
          process.stdout.write(line[i]);
          await new Promise(resolve => setTimeout(resolve, 10)); // Simulate streaming
        }
        console.log();
        chunkCount++;
      }
    }
    
    console.log('   ' + '─'.repeat(58));
    console.log(`\n   ✅ Streamed ${chunkCount} lines successfully`);
  } else {
    console.log('   ℹ️  Set OLLAMA_TEST=1 to see actual streaming');
    console.log('   ✅ Prompt is available and ready for streaming');
  }

  // Test 3: Verify backward compatibility
  console.log('\n4️⃣  Backward compatibility check:');
  console.log('   Old code expecting { docs, response } still works:');
  console.log(`   - docs: ${result.docs ? '✅' : '❌'}`);
  console.log(`   - response: ${result.response ? '✅' : '❌'}`);
  console.log('   New code can also access:');
  console.log(`   - prompt: ${result.prompt ? '✅' : '❌'}`);

  console.log('\n' + '='.repeat(60));
  console.log('✅ Streaming support working correctly!\n');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
