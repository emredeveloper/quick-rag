/**
 * Quick RAG - Metadata Filtering Example
 * 
 * Shows how to filter documents by metadata
 */

import { 
  OllamaRAGClient, 
  createOllamaRAGEmbedding,
  InMemoryVectorStore, 
  Retriever,
  generateWithRAG
} from 'quick-rag';

async function main() {
  console.log('🚀 Quick RAG - Metadata Filtering\n');

  // Initialize
  const client = new OllamaRAGClient();
  const embed = createOllamaRAGEmbedding(client, 'nomic-embed-text');
  const vectorStore = new InMemoryVectorStore(embed);
  const retriever = new Retriever(vectorStore);

  // Load documents with metadata
  console.log('📚 Loading documents with metadata...\n');
  const documents = [
    { 
      text: 'Paris is the capital of France.',
      meta: { topic: 'geography', country: 'France' }
    },
    { 
      text: 'The Eiffel Tower is a famous landmark in Paris.',
      meta: { topic: 'landmarks', country: 'France' }
    },
    { 
      text: 'The Louvre Museum is located in Paris and houses the Mona Lisa.',
      meta: { topic: 'art', country: 'France' }
    }
  ];

  await vectorStore.addDocuments(documents);
  console.log(`✅ Loaded ${documents.length} documents\n`);

  // Query 1: With metadata filter
  console.log('🔍 Query 1: WITH metadata filter (topic: "landmarks")\n');
  const query1 = 'What famous landmark is in Paris?';
  
  const results1 = await retriever.getRelevant(query1, 2, {
    filter: { topic: 'landmarks' }
  });

  console.log(`📚 Retrieved ${results1.length} document(s) with filter`);
  results1.forEach((doc, i) => {
    console.log(`   ${i + 1}. [${doc.meta.topic}] "${doc.text.substring(0, 50)}..."`);
  });

  const response1 = await generateWithRAG(
    client,
    'granite4:3b',
    query1,
    results1.map(d => d.text)
  );

  console.log('\n🤖 Answer:');
  console.log(response1.response);
  console.log('\n---\n');

  // Query 2: Without filter
  console.log('🔍 Query 2: WITHOUT metadata filter\n');
  const query2 = 'What is the capital of France?';
  
  const results2 = await retriever.getRelevant(query2, 2);

  console.log(`📚 Retrieved ${results2.length} document(s) without filter`);
  results2.forEach((doc, i) => {
    console.log(`   ${i + 1}. [${doc.meta.topic}] "${doc.text.substring(0, 50)}..."`);
  });

  const response2 = await generateWithRAG(
    client,
    'granite4:3b',
    query2,
    results2.map(d => d.text)
  );

  console.log('\n🤖 Answer:');
  console.log(response2.response);
  console.log('\n✅ Metadata filtering completed!');
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
