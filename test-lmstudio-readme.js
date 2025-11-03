/**
 * Test LM Studio example from README
 * Matches user's exact code
 */

import { 
  LMStudioRAGClient, 
  createLMStudioRAGEmbedding, 
  InMemoryVectorStore, 
  Retriever, 
  generateWithRAG 
} from './src/index.node.js';

async function test() {
  console.log('🎨 Testing LM Studio README Example\n');

  // 1. Initialize LM Studio client
  const client = new LMStudioRAGClient();

  // 2. Setup embedding (use your embedding model from LM Studio)
  const embed = createLMStudioRAGEmbedding(client, 'text-embedding-qwen3-embedding-0.6b', { verbose: false });

  // 3. Create vector store and retriever
  const vectorStore = new InMemoryVectorStore(embed);
  const retriever = new Retriever(vectorStore);

  // 4. Add documents
  await vectorStore.addDocuments([
    { text: 'LM Studio is a desktop app for running LLMs locally.' },
    { text: 'It provides an OpenAI-compatible API.' },
    { text: 'You can use models like Llama, Mistral, and more.' }
  ]);

  console.log('✅ Documents added\n');

  // 5. Query with RAG
  const results = await retriever.getRelevant('What is LM Studio?', 2);
  console.log('✅ Retrieved:', results.length, 'documents\n');

  const answer = await generateWithRAG(
    client,
    'qwen/qwen3-4b-2507', // or your model name
    'What is LM Studio?',
    results
  );

  console.log('✅ Generation complete\n');
  console.log('Answer:', answer.response);
  console.log('\n✅ LM Studio README example works!');
}

test().catch(error => {
  console.error('❌ Test failed:', error.message);
  console.error('\nMake sure:');
  console.error('1. LM Studio is running');
  console.error('2. Local server is started (Developer > Local Server)');
  console.error('3. Models are loaded');
  process.exit(1);
});
