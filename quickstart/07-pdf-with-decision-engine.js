/**
 * Quick RAG - PDF with Decision Engine
 * 
 * Advanced example: Load PDFs and use Decision Engine for smart retrieval
 * 
 * Requirements:
 * - npm install pdf-parse
 */

import { 
  OllamaRAGClient, 
  createOllamaRAGEmbedding,
  InMemoryVectorStore, 
  Retriever,
  SmartRetriever,
  generateWithRAG,
  loadDirectory
} from 'quick-rag';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('🚀 Quick RAG - PDF with Decision Engine\n');

  try {
    // Initialize
    const client = new OllamaRAGClient();
    const embed = createOllamaRAGEmbedding(client, 'nomic-embed-text');
    const vectorStore = new InMemoryVectorStore(embed);
    const basicRetriever = new Retriever(vectorStore, { k: 10 });

    // Load PDFs
    const pdfFolder = path.join(__dirname, 'PDF');
    console.log(`📁 Loading PDFs from: ${pdfFolder}\n`);

    const documents = await loadDirectory(pdfFolder, {
      recursive: true,
      extensions: ['.pdf']
    });

    console.log(`✅ Loaded ${documents.length} PDF(s)\n`);

    // Enhance documents with metadata
    documents.forEach((doc, i) => {
      const filename = doc.meta?.source || `document-${i}`;
      
      // Add enhanced metadata for Decision Engine
      doc.meta = {
        ...doc.meta,
        source: 'research',        // Source type
        quality: 'high',           // Quality assessment
        date: '2024-09-01',        // Publication date (example)
        filename: filename,
        documentType: 'academic'
      };
      
      console.log(`   ${i + 1}. ${filename}`);
      console.log(`      Type: ${doc.meta.documentType} | Quality: ${doc.meta.quality}`);
      console.log(`      Length: ${doc.text.length} characters\n`);
    });

    // Index documents
    console.log('💾 Indexing documents...\n');
    await vectorStore.addDocuments(documents);
    console.log('✅ Documents indexed\n');

    // Create Smart Retriever
    console.log('🧠 Creating Smart Retriever with Decision Engine...\n');
    const smartRetriever = new SmartRetriever(basicRetriever, {
      weights: {
        semanticSimilarity: 0.40,  // Strong semantic matching
        keywordMatch: 0.25,         // Important for academic terms
        recency: 0.10,              // Less important for research papers
        sourceQuality: 0.20,        // High importance for academic work
        contextRelevance: 0.05
      },
      enableLearning: true
    });

    // Compare: Normal vs Smart Retrieval
    console.log('═'.repeat(70));
    console.log('📊 COMPARISON: Normal Retrieval vs Smart Retrieval');
    console.log('═'.repeat(70) + '\n');

    const query = 'What are the key technical innovations and methodologies presented?';
    console.log(`❓ Question: ${query}\n`);

    // Normal retrieval
    console.log('📌 NORMAL RETRIEVAL (Similarity Only):\n');
    const normalResults = await basicRetriever.getRelevant(query, 3);
    
    normalResults.forEach((doc, i) => {
      console.log(`   ${i + 1}. Score: ${doc.score.toFixed(3)}`);
      console.log(`      "${doc.text.substring(0, 80).replace(/\n/g, ' ')}..."\n`);
    });

    // Smart retrieval
    console.log('🧠 SMART RETRIEVAL (Multi-Criteria + Decision Engine):\n');
    const smartResults = await smartRetriever.getRelevant(query, 3);
    
    smartResults.results.forEach((doc, i) => {
      console.log(`   ${i + 1}. Weighted Score: ${doc.weightedScore.toFixed(3)}`);
      console.log(`      Source: ${doc.meta.source} | Quality: ${doc.meta.quality}`);
      console.log(`      Score Breakdown:`);
      console.log(`      • Similarity: ${doc.scoreBreakdown.semanticSimilarity.contribution.toFixed(3)}`);
      console.log(`      • Keywords: ${doc.scoreBreakdown.keywordMatch.contribution.toFixed(3)}`);
      console.log(`      • Quality: ${doc.scoreBreakdown.sourceQuality.contribution.toFixed(3)}`);
      console.log(`      • Recency: ${doc.scoreBreakdown.recency.contribution.toFixed(3)}`);
      console.log(`      "${doc.text.substring(0, 80).replace(/\n/g, ' ')}..."\n`);
    });

    // Show decision insights
    if (smartResults.decisions.suggestions.length > 0) {
      console.log('💡 Decision Engine Insights:');
      smartResults.decisions.suggestions.forEach(s => console.log(`   • ${s}`));
      console.log();
    }

    // Generate answer with smart results
    console.log('═'.repeat(70));
    console.log('🤖 GENERATING ANSWER');
    console.log('═'.repeat(70) + '\n');

    const response = await generateWithRAG(
      client,
      'granite4:3b',
      query,
      smartResults.results.map(d => d.text),
      {
        systemPrompt: 'You are an academic research assistant. Provide comprehensive, well-structured answers based on research papers.',
        template: 'academic'
      }
    );

    console.log('Answer:');
    console.log('-'.repeat(70));
    console.log(response.response);
    console.log('-'.repeat(70) + '\n');

    // Quality metrics
    console.log('📊 Answer Quality Metrics:\n');
    const avgQuality = smartResults.results.reduce((sum, d) => 
      sum + d.scoreBreakdown.sourceQuality.score, 0) / smartResults.results.length;
    const avgSimilarity = smartResults.results.reduce((sum, d) => 
      sum + d.scoreBreakdown.semanticSimilarity.score, 0) / smartResults.results.length;

    console.log(`   📈 Average Source Quality: ${avgQuality.toFixed(3)}`);
    console.log(`   🎯 Average Semantic Match: ${avgSimilarity.toFixed(3)}`);
    console.log(`   📚 Documents Used: ${smartResults.results.length}`);
    console.log(`   🧠 Decision Engine: Active\n`);

    console.log('✅ PDF + Decision Engine completed successfully!');
    console.log('\n💡 This example demonstrates:');
    console.log('   • Real PDF document processing');
    console.log('   • Multi-criteria document scoring');
    console.log('   • Decision transparency and explainability');
    console.log('   • Quality-aware answer generation');
    console.log('   • Comparison between normal and smart retrieval\n');

  } catch (error) {
    if (error.message.includes('pdf-parse')) {
      console.error('\n❌ Error: pdf-parse module not found');
      console.error('\n📦 To use PDF loading, install pdf-parse:');
      console.error('   npm install pdf-parse\n');
    } else {
      console.error('❌ Error:', error.message);
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
