/**
 * Quick verification test - matches README example
 * Tests the exact code users will copy from documentation
 */

import { 
  OllamaRAGClient, 
  createOllamaRAGEmbedding, 
  InMemoryVectorStore, 
  Retriever 
} from './src/index.node.js';

async function test() {
  console.log('✅ Testing README Example (Option 3)\n');

  // 1. Initialize client
  const client = new OllamaRAGClient();

  // 2. Setup embedding
  const embed = createOllamaRAGEmbedding(client, 'embeddinggemma');

  // 3. Create vector store and retriever
  const vectorStore = new InMemoryVectorStore(embed);
  const retriever = new Retriever(vectorStore);

  // 4. Add documents
  await vectorStore.addDocuments([
    { text: 'JavaScript is a programming language.' },
    { text: 'Python is great for data science.' },
    { text: 'Rust is a systems programming language.' }
  ]);

  console.log('✅ Documents added\n');

  // 5. Query
  const query = 'What is JavaScript?';
  const results = await retriever.getRelevant(query, 2);

  console.log('✅ Retrieval works\n');
  console.log('📚 Retrieved:', results.map(d => d.text));

  // 6. Generate answer
  const context = results.map(d => d.text).join('\n');
  const response = await client.chat({
    model: 'granite4:tiny-h',
    messages: [{ 
      role: 'user', 
      content: `Context:\n${context}\n\nQuestion: ${query}\n\nAnswer briefly:` 
    }]
  });

  console.log('✅ Generation works\n');
  console.log('🤖 Answer:', response.message.content);
  
  console.log('\n✅ All README examples are correct!');
}

test().catch(error => {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
});
