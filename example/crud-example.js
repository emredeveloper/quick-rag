import { InMemoryVectorStore } from '../src/vectorStore.js';
import { createOllamaEmbedding } from '../src/embeddings/ollamaEmbedding.js';
import { createMRL } from '../src/embeddings/mrl.js';

/**
 * ✨ NEW FEATURE DEMO: VectorStore CRUD Operations
 * Shows the new methods: deleteDocument, updateDocument, getDocument, getAllDocuments, clear
 */
async function main() {
  console.log('📚 Testing VectorStore CRUD Operations\n');
  console.log('='.repeat(60));

  // Setup
  const baseEmbedding = createOllamaEmbedding({});
  const mrl = createMRL(baseEmbedding, 768);
  const store = new InMemoryVectorStore(mrl, { defaultDim: 128 });

  // Initial documents
  const initialDocs = [
    { id: 'react', text: 'React is a JavaScript library for building user interfaces.' },
    { id: 'vue', text: 'Vue is a progressive framework.' },
    { id: 'angular', text: 'Angular is a platform for building applications.' }
  ];

  console.log('\n1️⃣  Adding initial documents...');
  await store.addDocuments(initialDocs, { dim: 128 });
  console.log(`   ✅ Added ${store.getAllDocuments().length} documents`);

  // Get all documents
  console.log('\n2️⃣  Getting all documents:');
  const allDocs = store.getAllDocuments();
  allDocs.forEach(d => console.log(`   - [${d.id}] ${d.text.slice(0, 40)}...`));

  // Get specific document
  console.log('\n3️⃣  Getting specific document (id: "react"):');
  const reactDoc = store.getDocument('react');
  if (reactDoc) {
    console.log(`   ✅ Found: ${reactDoc.text}`);
    console.log(`   Vector dimension: ${reactDoc.vector.length}`);
  }

  // Update document
  console.log('\n4️⃣  Updating document (id: "vue"):');
  console.log('   Old text: "Vue is a progressive framework."');
  const updated = await store.updateDocument(
    'vue',
    'Vue.js is a progressive JavaScript framework for building user interfaces.',
    { version: '3.0', updated: '2025-11-03' }
  );
  console.log(`   ✅ Update successful: ${updated}`);
  const vueDoc = store.getDocument('vue');
  console.log(`   New text: "${vueDoc.text}"`);
  console.log(`   New meta:`, vueDoc.meta);

  // Search to verify update
  console.log('\n5️⃣  Searching with updated content:');
  const results = await store.similaritySearch('progressive JavaScript framework', 2);
  results.forEach(r => console.log(`   - [${r.id}] (${r.score.toFixed(3)}) ${r.text.slice(0, 40)}...`));

  // Delete document
  console.log('\n6️⃣  Deleting document (id: "angular"):');
  const deleted = store.deleteDocument('angular');
  console.log(`   ✅ Delete successful: ${deleted}`);
  console.log(`   Remaining documents: ${store.getAllDocuments().length}`);

  // Try to get deleted document
  console.log('\n7️⃣  Trying to get deleted document:');
  const angularDoc = store.getDocument('angular');
  console.log(`   Found: ${angularDoc ? 'Yes' : 'No (correctly deleted)'}`);

  // Add new document
  console.log('\n8️⃣  Adding new document:');
  await store.addDocuments([
    { id: 'svelte', text: 'Svelte is a radical new approach to building user interfaces.', meta: { new: true } }
  ], { dim: 128 });
  console.log(`   ✅ Total documents now: ${store.getAllDocuments().length}`);

  // List all current documents
  console.log('\n9️⃣  Final document list:');
  store.getAllDocuments().forEach(d => {
    console.log(`   - [${d.id}] ${d.text.slice(0, 40)}...`);
    if (d.meta && Object.keys(d.meta).length > 0) {
      console.log(`     Meta: ${JSON.stringify(d.meta)}`);
    }
  });

  // Clear all
  console.log('\n🔟 Clearing all documents:');
  store.clear();
  console.log(`   ✅ Documents after clear: ${store.getAllDocuments().length}`);

  console.log('\n' + '='.repeat(60));
  console.log('✅ All CRUD operations working correctly!\n');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
