// Test with llama3.2 (chat-only model)
import { createOllamaEmbedding, createMRL, InMemoryVectorStore, Retriever, generateWithRAG, OllamaClient } from '../src/index.node.js';

console.log('🦙 Testing with llama3.2:3b (chat-only model)\n');

// Setup
const embedding = createOllamaEmbedding({ model: 'embeddinggemma' });
const mrl = createMRL(embedding, 768);
const store = new InMemoryVectorStore(mrl, { defaultDim: 128 });

// Add documents
await store.addDocuments([
  { id: '1', text: 'JavaScript is a programming language for web development.' },
  { id: '2', text: 'Python is excellent for data science and AI.' },
  { id: '3', text: 'Rust is a systems programming language focused on safety.' }
], { dim: 128 });

// Create retriever
const retriever = new Retriever(store, { k: 2 });

// Test with llama3.2:3b (auto-fallback to chat API)
const result = await generateWithRAG({
  retriever,
  modelClient: new OllamaClient(),
  model: 'llama3.2:3b',  // This model only supports chat API
  query: 'What is Python used for?',
  topK: 2
});

// Display results
console.log('📚 Retrieved Documents:');
result.docs.forEach((doc, i) => {
  console.log(`\n${i + 1}. ${doc.text}`);
  console.log(`   ID: ${doc.id} | Relevance: ${(doc.score * 100).toFixed(1)}%`);
});

console.log('\n' + '='.repeat(60));
console.log('🤖 AI Answer (llama3.2:3b):\n');
console.log(result.response);
console.log('\n' + '='.repeat(60));
console.log('\n✅ Chat API auto-fallback working!');
