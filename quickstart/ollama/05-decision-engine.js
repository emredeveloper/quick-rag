/**
 * Quick RAG - Decision Engine Example
 * 
 * Shows how to use the Decision Engine for smart retrieval
 */

import { 
  OllamaRAGClient, 
  createOllamaRAGEmbedding,
  InMemoryVectorStore, 
  Retriever,
  SmartRetriever,
  generateWithRAG
} from 'quick-rag';

async function main() {
  console.log('🚀 Quick RAG - Decision Engine\n');

  // Initialize
  const client = new OllamaRAGClient();
  const embed = createOllamaRAGEmbedding(client, 'nomic-embed-text');
  const vectorStore = new InMemoryVectorStore(embed);
  const basicRetriever = new Retriever(vectorStore);

  // Load documents with different sources and dates
  console.log('📚 Loading documents...\n');
  const documents = [
    { 
      text: 'Python 3.12 was released in October 2023 with significant performance improvements.',
      meta: { source: 'official', quality: 'high', date: '2023-10-15' }
    },
    { 
      text: 'I just started learning Python. It\'s great for beginners!',
      meta: { source: 'blog', quality: 'medium', date: '2024-11-01' }
    },
    { 
      text: 'Research shows Python 3.12 is 5-10% faster than Python 3.11.',
      meta: { source: 'research', quality: 'high', date: '2024-01-20' }
    },
    { 
      text: 'Someone on Reddit asked which Python version to use.',
      meta: { source: 'forum', quality: 'low', date: '2024-11-05' }
    }
  ];

  await vectorStore.addDocuments(documents);
  console.log(`✅ Loaded ${documents.length} documents\n`);

  // Create Smart Retriever
  console.log('🧠 Creating Smart Retriever with Decision Engine...\n');
  const smartRetriever = new SmartRetriever(basicRetriever, {
    weights: {
      semanticSimilarity: 0.35,
      keywordMatch: 0.20,
      recency: 0.25,         // Prioritize recent info
      sourceQuality: 0.15,   // Prioritize quality sources
      contextRelevance: 0.05
    },
    enableLearning: true
  });

  // Query with smart retrieval
  const query = 'What are the latest Python features?';
  console.log(`❓ Question: ${query}\n`);

  const response = await smartRetriever.getRelevant(query, 2);

  console.log('📊 Smart Retrieval Results:\n');
  response.results.forEach((doc, i) => {
    console.log(`${i + 1}. [${doc.meta.source}] Score: ${doc.weightedScore.toFixed(3)}`);
    console.log(`   Date: ${doc.meta.date} | Quality: ${doc.meta.quality}`);
    console.log(`   "${doc.text.substring(0, 60)}..."`);
    console.log(`   Breakdown:`);
    console.log(`   - Similarity: ${doc.scoreBreakdown.semanticSimilarity.contribution.toFixed(3)}`);
    console.log(`   - Keywords: ${doc.scoreBreakdown.keywordMatch.contribution.toFixed(3)}`);
    console.log(`   - Recency: ${doc.scoreBreakdown.recency.contribution.toFixed(3)}`);
    console.log(`   - Quality: ${doc.scoreBreakdown.sourceQuality.contribution.toFixed(3)}`);
    console.log();
  });

  if (response.decisions.suggestions.length > 0) {
    console.log('💡 Suggestions:');
    response.decisions.suggestions.forEach(s => console.log(`   - ${s}`));
    console.log();
  }

  // Generate answer
  const answer = await generateWithRAG(
    client,
    'granite4:3b',
    query,
    response.results.map(d => d.text)
  );

  console.log('🤖 Answer:');
  console.log(answer.response);
  console.log('\n✅ Decision Engine completed!');
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
