/**
 * Quick RAG - Document Loading Example
 * 
 * Shows how to load multiple documents and query them
 */

import { 
  OllamaRAGClient, 
  createOllamaRAGEmbedding,
  InMemoryVectorStore, 
  Retriever,
  generateWithRAG
} from 'quick-rag';

async function main() {
  console.log('🚀 Quick RAG - Document Loading\n');

  // Initialize
  const client = new OllamaRAGClient();
  const embed = createOllamaRAGEmbedding(client, 'nomic-embed-text');
  const vectorStore = new InMemoryVectorStore(embed);
  const retriever = new Retriever(vectorStore);

  // Load multiple documents
  console.log('📚 Loading documents...\n');
  const documents = [
    { 
      text: 'The sky appears blue due to a phenomenon called Rayleigh scattering.',
      meta: { source: 'science-facts', topic: 'physics' }
    },
    { 
      text: 'The first person to walk on the moon was Neil Armstrong in 1969.',
      meta: { source: 'history-facts', topic: 'space' }
    },
    { 
      text: 'JavaScript is a programming language commonly used for web development.',
      meta: { source: 'tech-facts', topic: 'programming' }
    }
  ];

  await vectorStore.addDocuments(documents);
  console.log(`✅ Loaded ${documents.length} documents\n`);

  // Query 1: Science
  const query1 = 'What causes the sky to look blue?';
  console.log(`❓ Question 1: ${query1}\n`);

  const results1 = await retriever.getRelevant(query1, 2);
  const response1 = await generateWithRAG(
    client,
    'granite4:3b',
    query1,
    results1.map(d => d.text)
  );

  console.log('🤖 Answer 1:');
  console.log(response1.response);
  console.log('\n---\n');

  // Query 2: History
  const query2 = 'Who was the first person on the moon?';
  console.log(`❓ Question 2: ${query2}\n`);

  const results2 = await retriever.getRelevant(query2, 2);
  const response2 = await generateWithRAG(
    client,
    'granite4:3b',
    query2,
    results2.map(d => d.text)
  );

  console.log('🤖 Answer 2:');
  console.log(response2.response);
  console.log('\n✅ Document loading completed!');
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
