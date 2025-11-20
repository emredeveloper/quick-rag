// Quick RAG v2.1 - New Features Demo
// Install: npm install quick-rag

import { 
  SQLiteVectorStore, 
  InMemoryVectorStore,
  OllamaRAGClient,
  createOllamaRAGEmbedding,
  VectorStoreError 
} from 'quick-rag';

console.log('🚀 Quick RAG v2.1 - New Features\n');

const client = new OllamaRAGClient();
const embedFn = createOllamaRAGEmbedding(client, 'nomic-embed-text');

// ✨ Feature 1: SQLite Persistent Storage
console.log('📦 1. SQLite Persistent Storage');
const sqliteStore = new SQLiteVectorStore('./data.db', embedFn);
await sqliteStore.addDocuments([
  { text: 'SQLite stores data permanently on disk.' },
  { text: 'Data persists between restarts.' }
], (current, total) => {
  console.log(`   Progress: ${current}/${total}`);
});
console.log('   ✅ Data saved to disk\n');

// ✨ Feature 2: Advanced Error Handling
console.log('🛡️  2. Advanced Error Handling');
try {
  const emptyStore = new InMemoryVectorStore(embedFn);
  await emptyStore.similaritySearch('test'); // Empty store error
} catch (error) {
  console.log(`   ✅ Caught: ${error.code}`);
  console.log(`   💡 Suggestion: ${error.metadata?.suggestion || 'Add documents first'}\n`);
}

// ✨ Feature 3: Batch Processing
console.log('⚡ 3. Batch Processing with Progress');
const store = new InMemoryVectorStore(embedFn);

const docs = Array.from({ length: 10 }, (_, i) => ({
  text: `Document ${i + 1} about AI and machine learning.`
}));

const startTime = Date.now();
await store.addDocuments(docs, (current, total) => {
  process.stdout.write(`\r   Processing: ${current}/${total}`);
});
const elapsed = Date.now() - startTime;
console.log(`\n   ✅ ${docs.length} docs in ${elapsed}ms (${(elapsed/docs.length).toFixed(1)}ms avg)\n`);

// ✨ Feature 4: Search & Retrieve
console.log('🔍 4. Search & Retrieve');
const results = await store.similaritySearch('machine learning', 3);
console.log(`   Found ${results.length} results:`);
results.forEach((doc, i) => {
  console.log(`   ${i + 1}. ${doc.text.substring(0, 40)}... (score: ${doc.score.toFixed(3)})`);
});

console.log('\n🎉 All v2.1 features demonstrated!');
