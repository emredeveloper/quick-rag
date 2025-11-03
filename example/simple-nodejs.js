// Simple Node.js example - Clean output
import { createOllamaEmbedding, createMRL, InMemoryVectorStore, Retriever, generateWithRAG, OllamaClient } from '../src/index.node.js';

console.log('🚀 Simple RAG Example\n');

// Setup
const embedding = createOllamaEmbedding({ model: 'embeddinggemma' });
const mrl = createMRL(embedding, 768);
const store = new InMemoryVectorStore(mrl, { defaultDim: 128 });

// Add documents
await store.addDocuments([
  { id: '1', text: 'JavaScript is a programming language.' },
  { id: '2', text: 'Python is great for data science.' },
  { id: '3', text: 'Rust is a systems programming language.' }
], { dim: 128 });

// Create retriever
const retriever = new Retriever(store, { k: 2 });

// Ask a question
const result = await generateWithRAG({
  retriever,
  modelClient: new OllamaClient(),
  model: 'granite4:tiny-h',
  query: 'What is JavaScript?',
  topK: 2
});

// Display results (clean output)
console.log('📚 Retrieved Documents:');
result.docs.forEach((doc, i) => {
  console.log(`\n${i + 1}. ${doc.text}`);
  console.log(`   ID: ${doc.id} | Relevance: ${(doc.score * 100).toFixed(1)}%`);
});

console.log('\n' + '='.repeat(60));
console.log('🤖 AI Answer:\n');
console.log(result.response);
console.log('\n' + '='.repeat(60));
