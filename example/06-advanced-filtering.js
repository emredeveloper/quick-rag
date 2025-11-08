/**
 * Advanced Metadata Filtering - Function-based Filters
 * Shows both object-based and function-based filtering
 */

import {
  OllamaRAGClient,
  createOllamaRAGEmbedding,
  InMemoryVectorStore,
  Retriever
} from '../src/index.js';

async function main() {
  console.log('🔍 Advanced Metadata Filtering Example\n');

  // Setup
  const client = new OllamaRAGClient();
  const embed = createOllamaRAGEmbedding(client, 'nomic-embed-text');
  const store = new InMemoryVectorStore(embed);

  // Add documents with rich metadata
  const docs = [
    {
      text: 'Python 3.12 released with improved performance and new syntax features.',
      meta: { 
        category: 'programming', 
        language: 'python', 
        version: '3.12',
        year: 2024,
        difficulty: 'intermediate',
        tags: ['performance', 'syntax']
      }
    },
    {
      text: 'JavaScript ES2024 introduces new array methods and async features.',
      meta: { 
        category: 'programming', 
        language: 'javascript',
        version: 'ES2024',
        year: 2024,
        difficulty: 'beginner',
        tags: ['arrays', 'async']
      }
    },
    {
      text: 'Rust 1.75 brings better compile times and memory optimization.',
      meta: { 
        category: 'programming', 
        language: 'rust',
        version: '1.75',
        year: 2024,
        difficulty: 'advanced',
        tags: ['performance', 'memory']
      }
    },
    {
      text: 'C++ 23 standard approved with major language improvements.',
      meta: { 
        category: 'programming', 
        language: 'cpp',
        version: '23',
        year: 2023,
        difficulty: 'advanced',
        tags: ['standard']
      }
    },
    {
      text: 'Go 1.22 adds enhanced routing and improved testing tools.',
      meta: { 
        category: 'programming', 
        language: 'go',
        version: '1.22',
        year: 2024,
        difficulty: 'intermediate',
        tags: ['routing', 'testing']
      }
    },
    {
      text: 'TypeScript 5.3 introduces better type inference and decorators.',
      meta: { 
        category: 'programming', 
        language: 'typescript',
        version: '5.3',
        year: 2024,
        difficulty: 'intermediate',
        tags: ['types', 'decorators']
      }
    }
  ];

  await store.addDocuments(docs);
  console.log(`✅ Added ${docs.length} documents\n`);

  const retriever = new Retriever(store);

  // Example 1: Object-based filtering (simple)
  console.log('═'.repeat(70));
  console.log('📋 Example 1: Object-Based Filter');
  console.log('═'.repeat(70) + '\n');
  console.log('Filter: { category: "programming", difficulty: "beginner" }\n');

  const results1 = await retriever.getRelevant('modern programming language', 5, {
    filters: { 
      category: 'programming',
      difficulty: 'beginner'
    }
  });

  console.log(`Found ${results1.length} result(s):\n`);
  results1.forEach((doc, i) => {
    console.log(`${i + 1}. ${doc.meta.language.toUpperCase()} - ${doc.text.substring(0, 60)}...`);
    console.log(`   Difficulty: ${doc.meta.difficulty} | Score: ${doc.score.toFixed(3)}\n`);
  });

  // Example 2: Function-based filtering (complex logic)
  console.log('═'.repeat(70));
  console.log('🎯 Example 2: Function-Based Filter (Complex Logic)');
  console.log('═'.repeat(70) + '\n');
  console.log('Filter: (meta) => meta.year === 2024 && meta.difficulty !== "beginner"\n');

  const results2 = await retriever.getRelevant('programming language updates', 5, {
    filter: (meta) => meta.year === 2024 && meta.difficulty !== 'beginner'
  });

  console.log(`Found ${results2.length} result(s):\n`);
  results2.forEach((doc, i) => {
    console.log(`${i + 1}. ${doc.meta.language.toUpperCase()} ${doc.meta.version}`);
    console.log(`   ${doc.text}`);
    console.log(`   Year: ${doc.meta.year} | Difficulty: ${doc.meta.difficulty} | Score: ${doc.score.toFixed(3)}\n`);
  });

  // Example 3: Function-based with array operations
  console.log('═'.repeat(70));
  console.log('🏷️  Example 3: Filter by Tag (Array Contains)');
  console.log('═'.repeat(70) + '\n');
  console.log('Filter: (meta) => meta.tags.includes("performance")\n');

  const results3 = await retriever.getRelevant('performance improvements', 5, {
    filter: (meta) => meta.tags && meta.tags.includes('performance')
  });

  console.log(`Found ${results3.length} result(s):\n`);
  results3.forEach((doc, i) => {
    console.log(`${i + 1}. ${doc.meta.language.toUpperCase()} - ${doc.text.substring(0, 60)}...`);
    console.log(`   Tags: [${doc.meta.tags.join(', ')}] | Score: ${doc.score.toFixed(3)}\n`);
  });

  // Example 4: Combining both filters
  console.log('═'.repeat(70));
  console.log('🔀 Example 4: Combined Filters (Object + Function)');
  console.log('═'.repeat(70) + '\n');
  console.log('Object filter: { category: "programming" }');
  console.log('Function filter: (meta) => meta.year === 2024 && meta.difficulty === "intermediate"\n');

  const results4 = await retriever.getRelevant('latest updates', 5, {
    filters: { category: 'programming' },
    filter: (meta) => meta.year === 2024 && meta.difficulty === 'intermediate'
  });

  console.log(`Found ${results4.length} result(s):\n`);
  results4.forEach((doc, i) => {
    console.log(`${i + 1}. ${doc.meta.language.toUpperCase()} ${doc.meta.version}`);
    console.log(`   ${doc.text}`);
    console.log(`   Difficulty: ${doc.meta.difficulty} | Year: ${doc.meta.year}\n`);
  });

  // Example 5: Advanced function - version comparison
  console.log('═'.repeat(70));
  console.log('⚡ Example 5: Advanced Filter (Version Comparison)');
  console.log('═'.repeat(70) + '\n');
  console.log('Filter: Languages with difficulty "intermediate" or "advanced"\n');

  const results5 = await retriever.getRelevant('advanced programming', 5, {
    filter: (meta) => {
      const advancedLevels = ['intermediate', 'advanced'];
      return advancedLevels.includes(meta.difficulty);
    }
  });

  console.log(`Found ${results5.length} result(s):\n`);
  results5.forEach((doc, i) => {
    console.log(`${i + 1}. ${doc.meta.language.toUpperCase()} - Difficulty: ${doc.meta.difficulty}`);
    console.log(`   ${doc.text.substring(0, 70)}...`);
    console.log(`   Score: ${doc.score.toFixed(3)}\n`);
  });

  // Example 6: minScore + function filter
  console.log('═'.repeat(70));
  console.log('🎚️  Example 6: Min Score + Function Filter');
  console.log('═'.repeat(70) + '\n');
  console.log('Filter: year === 2024, minScore: 0.4\n');

  const results6 = await retriever.getRelevant('recent programming language', 5, {
    filter: (meta) => meta.year === 2024,
    minScore: 0.4
  });

  console.log(`Found ${results6.length} result(s) with score >= 0.4:\n`);
  results6.forEach((doc, i) => {
    console.log(`${i + 1}. ${doc.meta.language.toUpperCase()} - Score: ${doc.score.toFixed(3)}`);
    console.log(`   ${doc.text}\n`);
  });

  console.log('✅ Advanced filtering examples completed!\n');
  
  console.log('💡 Key Takeaways:');
  console.log('   • Object filters: Simple key-value matching { key: value }');
  console.log('   • Function filters: Complex logic (meta) => boolean');
  console.log('   • Can combine both: filters: {...} + filter: (meta) => ...');
  console.log('   • Function filters support: arrays, comparisons, custom logic');
  console.log('   • Use minScore to filter by similarity threshold\n');
}

main().catch(console.error);
