import { InMemoryVectorStore } from '../src/vectorStore.js';
import { createOllamaEmbedding } from '../src/embeddings/ollamaEmbedding.js';
import { createMRL } from '../src/embeddings/mrl.js';

/**
 * ⚡ PERFORMANCE DEMO: Batch Embedding with Promise.all
 * Shows the performance improvement from parallel embedding
 */
async function main() {
  console.log('⚡ Testing Batch Embedding Performance\n');
  console.log('='.repeat(60));

  // Create a larger set of documents
  const docs = [];
  const frameworks = ['React', 'Vue', 'Angular', 'Svelte', 'Next.js', 'Nuxt', 'Remix', 'SolidJS', 'Qwik', 'Astro'];
  const features = [
    'is great for building user interfaces',
    'provides excellent developer experience',
    'has strong TypeScript support',
    'offers server-side rendering',
    'includes built-in routing',
    'supports component composition',
    'has a vibrant ecosystem',
    'provides reactive state management'
  ];

  // Generate 80 documents (10 frameworks × 8 features)
  let id = 1;
  for (const fw of frameworks) {
    for (const feat of features) {
      docs.push({
        id: `doc${id}`,
        text: `${fw} ${feat}.`,
        meta: { framework: fw, feature: feat }
      });
      id++;
    }
  }

  console.log(`\n📊 Test dataset: ${docs.length} documents\n`);

  // Setup embedding
  const baseEmbedding = createOllamaEmbedding({});
  const mrl = createMRL(baseEmbedding, 768);

  // Test 1: Sequential embedding simulation (old way)
  console.log('1️⃣  Simulating OLD sequential approach:');
  console.log('   (Processing one document at a time...)');
  const startSeq = Date.now();
  
  // Create mock sequential embedding for demonstration
  let sequentialCount = 0;
  const mockSequentialEmbedding = async (text) => {
    sequentialCount++;
    if (sequentialCount % 10 === 0) {
      process.stdout.write(`\r   Progress: ${sequentialCount}/${docs.length}`);
    }
    // Simulate embedding with actual call
    return await mrl(text, 128);
  };

  const storeSeq = new InMemoryVectorStore(mockSequentialEmbedding, { defaultDim: 128 });
  
  // Manually do sequential to show the difference
  for (const doc of docs) {
    const vec = await mockSequentialEmbedding(doc.text, 128);
    storeSeq.items.push({ 
      id: doc.id, 
      text: doc.text, 
      meta: doc.meta || {}, 
      vector: vec, 
      dim: 128 
    });
  }
  
  const timeSeq = Date.now() - startSeq;
  console.log(`\n   ⏱️  Sequential time: ${(timeSeq / 1000).toFixed(2)}s`);

  // Test 2: Parallel embedding (new way)
  console.log('\n2️⃣  Using NEW parallel batch approach:');
  console.log('   (Processing all documents in parallel...)');
  const startPar = Date.now();
  
  const storePar = new InMemoryVectorStore(mrl, { defaultDim: 128 });
  await storePar.addDocuments(docs, { dim: 128 });
  
  const timePar = Date.now() - startPar;
  console.log(`   ⏱️  Parallel time: ${(timePar / 1000).toFixed(2)}s`);

  // Calculate improvement
  const speedup = (timeSeq / timePar).toFixed(2);
  const improvement = (((timeSeq - timePar) / timeSeq) * 100).toFixed(1);

  console.log('\n📈 Performance Analysis:');
  console.log('   ━'.repeat(30));
  console.log(`   Sequential: ${(timeSeq / 1000).toFixed(2)}s`);
  console.log(`   Parallel:   ${(timePar / 1000).toFixed(2)}s`);
  console.log(`   Speedup:    ${speedup}x faster`);
  console.log(`   Improvement: ${improvement}% faster`);
  console.log('   ━'.repeat(30));

  // Verify functionality
  console.log('\n3️⃣  Verifying search functionality:');
  const query = 'React server-side rendering';
  const results = await storePar.similaritySearch(query, 5);
  console.log(`   Query: "${query}"`);
  console.log('   Top results:');
  results.forEach((r, i) => {
    console.log(`   ${i + 1}. [${r.id}] (${r.score.toFixed(3)}) ${r.text.slice(0, 50)}...`);
  });

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Batch embedding is ${speedup}x faster!\n`);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
