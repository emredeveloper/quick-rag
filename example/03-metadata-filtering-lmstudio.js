/**
 * Metadata Filtering with LM Studio
 * Filter documents by metadata and minimum score
 */

import {
  LMStudioRAGClient,
  createLMStudioRAGEmbedding,
  InMemoryVectorStore,
  Retriever
} from '../src/index.js';

async function main() {
  console.log('🏷️  Metadata Filtering - LM Studio Example\n');

  try {
    // Setup
    const client = new LMStudioRAGClient();
    const models = await client.listLoaded();
    
    if (models.length === 0) {
      console.log('⚠️  No models loaded in LM Studio');
      return;
    }

    console.log(`✅ Using model: ${models[0].path || models[0].id}\n`);

    const embed = createLMStudioRAGEmbedding(client, 'nomic-embed-text-v1.5');
    const store = new InMemoryVectorStore(embed);

    // Add documents with metadata
    const docs = [
      {
        text: 'Python is great for data science and machine learning.',
        meta: { category: 'programming', language: 'python', difficulty: 'beginner' }
      },
      {
        text: 'JavaScript is the language of the web.',
        meta: { category: 'programming', language: 'javascript', difficulty: 'beginner' }
      },
      {
        text: 'Rust provides memory safety without garbage collection.',
        meta: { category: 'programming', language: 'rust', difficulty: 'advanced' }
      },
      {
        text: 'The recipe requires flour, eggs, and butter.',
        meta: { category: 'cooking', difficulty: 'easy' }
      }
    ];

    await store.addDocuments(docs);
    console.log(`✅ Added ${docs.length} documents\n`);

    // Example 1: Filter by category
    console.log('🔍 Query 1: "What programming languages?" (category: programming)\n');
    const retriever1 = new Retriever(store, { k: 5 });
    const results1 = await retriever1.getRelevant('programming languages', 5, {
      filters: { category: 'programming' }
    });
    
    console.log(`Found ${results1.length} results:\n`);
    results1.forEach((doc, i) => {
      console.log(`${i + 1}. ${doc.text}`);
      console.log(`   Language: ${doc.meta.language}, Difficulty: ${doc.meta.difficulty}`);
      console.log(`   Score: ${doc.score.toFixed(3)}\n`);
    });

    // Example 2: Filter by multiple metadata
    console.log('─'.repeat(60) + '\n');
    console.log('🔍 Query 2: "beginner friendly" (category: programming, difficulty: beginner)\n');
    const results2 = await retriever1.getRelevant('beginner friendly programming', 5, {
      filters: { 
        category: 'programming',
        difficulty: 'beginner'
      }
    });
    
    console.log(`Found ${results2.length} results:\n`);
    results2.forEach((doc, i) => {
      console.log(`${i + 1}. ${doc.text} (score: ${doc.score.toFixed(3)})`);
    });

    // Example 3: Minimum score filtering
    console.log('\n' + '─'.repeat(60) + '\n');
    console.log('🔍 Query 3: "cooking" (minScore: 0.3)\n');
    const results3 = await retriever1.getRelevant('cooking recipes', 5, {
      minScore: 0.3
    });
    
    console.log(`Found ${results3.length} results (score >= 0.3):\n`);
    results3.forEach((doc, i) => {
      console.log(`${i + 1}. ${doc.text}`);
      console.log(`   Category: ${doc.meta.category}`);
      console.log(`   Score: ${doc.score.toFixed(3)}\n`);
    });

    console.log('✅ Example completed!');

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

main().catch(console.error);
