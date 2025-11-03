// Test pure Node.js usage (no React)
import { createOllamaEmbedding, createMRL, InMemoryVectorStore, Retriever, generateWithRAG, OllamaClient } from '../src/index.node.js';

console.log('🧪 Testing pure Node.js usage...\n');

// Setup
const embedding = createOllamaEmbedding({ model: 'embeddinggemma' });
const mrl = createMRL(embedding, 768);
const store = new InMemoryVectorStore(mrl, { defaultDim: 128 });

// Add documents
console.log('📚 Adding documents...');
await store.addDocuments([
  { id: '1', text: 'JavaScript is a programming language.' },
  { id: '2', text: 'Python is great for data science.' },
  { id: '3', text: 'Rust is a systems programming language.' }
], { dim: 128 });
console.log('✅ Added 3 documents\n');

// Create retriever
const retriever = new Retriever(store, { k: 2 });

// Ask a question
console.log('🤖 Asking: "What is JavaScript?"\n');
const result = await generateWithRAG({
  retriever,
  modelClient: new OllamaClient(),
  model: 'granite4:tiny-h',
  query: 'What is JavaScript?',
  topK: 2
});

console.log('📄 Retrieved Documents:');
result.docs.forEach((doc, i) => {
  console.log(`   ${i + 1}. [${doc.id}] ${doc.text}`);
});

console.log('\n✨ AI Answer:');
console.log(`   ${result.response}`);

console.log('\n✅ Pure Node.js test successful!');
