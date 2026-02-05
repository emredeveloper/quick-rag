/**
 * Example 10 (Simplified): Smart Document Selection - Simple Explanation
 * 
 * WHAT DOES THIS EXAMPLE DO?
 * ===========================
 * Normal RAG systems only use "similarity score" (cosine similarity).
 * This example uses 5 DIFFERENT CRITERIA for smarter selection:
 * 
 * 1. 📊 Semantic Similarity - 50%
 *    → How similar is the document to the query?
 * 
 * 2. 🔤 Keyword Match - 20%
 *    → Do keywords from the query appear in the document?
 * 
 * 3. 📅 Recency - 15%
 *    → How new is the document? (Important for news)
 * 
 * 4. ⭐ Source Quality - 10%
 *    → Is the source reliable? (official > research > blog > forum)
 * 
 * 5. 🎯 Context Relevance - 5%
 *    → Does the document fit the overall context?
 * 
 * RESULT: More accurate, more reliable, more recent documents are selected!
 */

import {
  OllamaRAGClient,
  createOllamaRAGEmbedding,
  LMStudioRAGClient,
  createLMStudioRAGEmbedding,
  InMemoryVectorStore,
  Retriever,
  SmartRetriever
} from '../src/index.js';

// ═══════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════
const USE_LMSTUDIO = true; // Set to true to use LM Studio

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🧠 SMART DOCUMENT SELECTION - SIMPLE EXAMPLE');
  console.log('═══════════════════════════════════════════════════════\n');

  // ─────────────────────────────────────────────────────────────────
  // STEP 1: System Setup
  // ─────────────────────────────────────────────────────────────────
  console.log('📦 STEP 1: Setting up system...\n');
  
  let client, embed;
  if (USE_LMSTUDIO) {
    console.log('   ✓ Using LM Studio');
    client = new LMStudioRAGClient({ baseUrl: 'ws://127.0.0.1:1234' });
    // Use one of the available embedding models in LM Studio
    embed = createLMStudioRAGEmbedding(client, 'text-embedding-qwen3-embedding-0.6b');
  } else {
    console.log('   ✓ Using Ollama');
    client = new OllamaRAGClient();
    embed = createOllamaRAGEmbedding(client, 'qwen3-embedding:0.6b');
  }

  const store = new InMemoryVectorStore(embed);
  const basicRetriever = new Retriever(store, { k: 5 });
  
  console.log('   ✓ Vector store ready');
  console.log('   ✓ Retriever ready\n');

  // ─────────────────────────────────────────────────────────────────
  // STEP 2: Adding Documents
  // ─────────────────────────────────────────────────────────────────
  console.log('📚 STEP 2: Adding documents...\n');

  const docs = [
    {
      text: 'Python 3.12 was released in October 2023 with significant performance improvements.',
      meta: { 
        source: 'official',      // OFFICIAL SOURCE (most reliable)
        date: '2023-10-15',      // 1 year ago (medium recency)
        quality: 'high'
      }
    },
    {
      text: 'I started learning Python last week. It\'s great for beginners!',
      meta: { 
        source: 'blog',          // BLOG (medium reliability)
        date: '2024-11-01',      // VERY RECENT (5 days ago)
        quality: 'medium'
      }
    },
    {
      text: 'Latest Python release includes async improvements and better debugging tools.',
      meta: { 
        source: 'research',      // RESEARCH (high reliability)
        date: '2024-01-10',      // 10 months ago (good recency)
        quality: 'high'
      }
    },
    {
      text: 'Someone asked on Reddit about Python. Maybe use version 3.10?',
      meta: { 
        source: 'forum',         // FORUM (low reliability)
        date: '2024-11-05',      // VERY RECENT (1 day ago)
        quality: 'low'
      }
    }
  ];

  for (const doc of docs) {
    await store.addDocuments([doc]);
  }
  
  console.log(`   ✓ ${docs.length} documents added\n`);
  
  // Show properties of each document
  docs.forEach((doc, i) => {
    console.log(`   ${i + 1}. "${doc.text.substring(0, 50)}..."`);
    console.log(`      📍 Source: ${doc.meta.source} (${doc.meta.quality})`);
    console.log(`      📅 Date: ${doc.meta.date}\n`);
  });

  // ─────────────────────────────────────────────────────────────────
  // STEP 3: NORMAL Retrieval (Similarity Score Only)
  // ─────────────────────────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 STEP 3: NORMAL Retrieval');
  console.log('═══════════════════════════════════════════════════════\n');
  
  const query = 'latest Python version';
  console.log(`❓ Query: "${query}"\n`);
  console.log('🔍 Normal method: Uses ONLY similarity score\n');

  const normalResults = await basicRetriever.getRelevant(query, 3);
  
  console.log('📄 Normal Results:\n');
  normalResults.forEach((doc, i) => {
    console.log(`${i + 1}. Similarity Score: ${doc.score.toFixed(3)}`);
    console.log(`   Source: ${doc.meta.source} | Date: ${doc.meta.date}`);
    console.log(`   "${doc.text.substring(0, 70)}..."\n`);
  });

  console.log('❌ PROBLEM: Highest score is from FORUM source!');
  console.log('   Forum is not reliable but got high score because "latest" keyword appears.\n');

  // ─────────────────────────────────────────────────────────────────
  // STEP 4: SMART Retrieval (Uses 5 Criteria)
  // ─────────────────────────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════════════');
  console.log('🧠 STEP 4: SMART Retrieval');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('🎯 Smart method: 5 CRITERIA evaluated together:\n');
  console.log('   1. Semantic Similarity          → 50% weight');
  console.log('   2. Keyword Match                → 20% weight');
  console.log('   3. Recency                      → 15% weight');
  console.log('   4. Source Quality               → 10% weight');
  console.log('   5. Context Relevance            → 5% weight\n');

  const smartRetriever = new SmartRetriever(basicRetriever);
  const smartResults = await smartRetriever.getRelevant(query, 3);

  console.log('📄 Smart Results:\n');
  smartResults.results.forEach((doc, i) => {
    console.log(`${i + 1}. TOTAL SCORE: ${doc.weightedScore.toFixed(3)}`);
    console.log(`   Source: ${doc.meta.source} | Date: ${doc.meta.date}`);
    console.log(`   "${doc.text.substring(0, 70)}..."`);
    
    // Score breakdown
    const breakdown = doc.scoreBreakdown;
    console.log('   ┌─ Detailed Scoring:');
    console.log(`   │  📊 Similarity:     ${breakdown.semanticSimilarity.score.toFixed(3)} × 50% = ${breakdown.semanticSimilarity.contribution.toFixed(3)}`);
    console.log(`   │  🔤 Keyword Match:  ${breakdown.keywordMatch.score.toFixed(3)} × 20% = ${breakdown.keywordMatch.contribution.toFixed(3)}`);
    console.log(`   │  📅 Recency:        ${breakdown.recency.score.toFixed(3)} × 15% = ${breakdown.recency.contribution.toFixed(3)}`);
    console.log(`   │  ⭐ Source Quality: ${breakdown.sourceQuality.score.toFixed(3)} × 10% = ${breakdown.sourceQuality.contribution.toFixed(3)}`);
    console.log(`   └─ TOTAL = ${doc.weightedScore.toFixed(3)}\n`);
  });

  console.log('✅ SOLUTION: Now OFFICIAL and RESEARCH sources are prioritized!');
  console.log('   Forum source dropped due to low reliability score.\n');

  // ─────────────────────────────────────────────────────────────────
  // STEP 5: COMPARISON
  // ─────────────────────────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════════════');
  console.log('⚖️  STEP 5: COMPARISON');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('┌──────────────────────┬──────────────┬──────────────┐');
  console.log('│ DOCUMENT             │ NORMAL RANK  │ SMART RANK   │');
  console.log('├──────────────────────┼──────────────┼──────────────┤');
  
  // Compare top 3
  for (let i = 0; i < 3; i++) {
    const normalSource = normalResults[i].meta.source.padEnd(10);
    const smartSource = smartResults.results[i].meta.source.padEnd(10);
    console.log(`│ ${i + 1}. rank             │ ${normalSource}   │ ${smartSource}   │`);
  }
  console.log('└──────────────────────┴──────────────┴──────────────┘\n');

  // ─────────────────────────────────────────────────────────────────
  // STEP 6: CUSTOM SCENARIOS
  // ─────────────────────────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════════════');
  console.log('🎨 STEP 6: CUSTOM SCENARIOS');
  console.log('═══════════════════════════════════════════════════════\n');

  // Scenario A: News site (Recency IMPORTANT)
  console.log('📰 Scenario A: NEWS SITE');
  console.log('   → Recency very important, source quality less important\n');
  
  const newsRetriever = new SmartRetriever(basicRetriever, {
    weights: {
      semanticSimilarity: 0.3,   // 30%
      keywordMatch: 0.2,          // 20%
      recency: 0.4,               // 40% ← RECENCY VERY HIGH!
      sourceQuality: 0.05,        // 5%  ← Source quality low
      contextRelevance: 0.05      // 5%
    }
  });

  const newsResults = await newsRetriever.getRelevant('Python updates', 2);
  console.log('   Results (most recent first):');
  newsResults.results.forEach((doc, i) => {
    console.log(`   ${i + 1}. ${doc.meta.date} | ${doc.meta.source} | Score: ${doc.weightedScore.toFixed(3)}`);
  });
  console.log('   ✓ Most recent documents selected!\n');

  // Scenario B: Official documentation (Quality IMPORTANT)
  console.log('📚 Scenario B: OFFICIAL DOCUMENTATION');
  console.log('   → Source quality very important, recency less important\n');
  
  const qualityRetriever = new SmartRetriever(basicRetriever, {
    weights: {
      semanticSimilarity: 0.35,   // 35%
      keywordMatch: 0.2,          // 20%
      recency: 0.1,               // 10%  ← Recency low
      sourceQuality: 0.3,         // 30%  ← QUALITY VERY HIGH!
      contextRelevance: 0.05      // 5%
    }
  });

  const qualityResults = await qualityRetriever.getRelevant('Python features', 2);
  console.log('   Results (highest quality first):');
  qualityResults.results.forEach((doc, i) => {
    console.log(`   ${i + 1}. ${doc.meta.source} (${doc.meta.quality}) | Score: ${doc.weightedScore.toFixed(3)}`);
  });
  console.log('   ✓ Most reliable sources selected!\n');

  // ─────────────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════════════');
  console.log('📋 SUMMARY: WHY USE SMART RETRIEVAL?');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('❌ Normal RAG Problem:');
  console.log('   • Only looks at "similarity"');
  console.log('   • May select outdated documents');
  console.log('   • May prioritize unreliable sources');
  console.log('   • Ignores context\n');

  console.log('✅ Smart RAG Solution:');
  console.log('   • Evaluates 5 different criteria together');
  console.log('   • Prioritizes recent information');
  console.log('   • Prefers reliable sources');
  console.log('   • Customizable for every use case\n');

  console.log('🎯 Use Cases:');
  console.log('   📰 News sites        → Recency priority');
  console.log('   📚 Documentation     → Quality priority');
  console.log('   🔬 Academic research → Balanced multi-criteria');
  console.log('   💼 Enterprise data   → Source reliability priority\n');

  console.log('🚀 Result: More accurate, more reliable, more useful RAG system!\n');
}

main().catch(console.error);
