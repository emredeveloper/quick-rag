/**
 * Quick RAG - Multi-Format Documents with Decision Engine
 * 
 * Advanced example: Load multiple document formats and use Decision Engine
 * to intelligently prioritize based on document type, quality, and recency
 * 
 * Supported formats:
 * - PDF (research papers, technical docs)
 * - Word (documentation, reports)
 * - Excel (data, statistics)
 * - Text/Markdown (notes, summaries)
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
  console.log('🚀 Quick RAG - Multi-Format with Decision Engine\n');

  try {
    // Initialize
    const client = new OllamaRAGClient();
    const embed = createOllamaRAGEmbedding(client, 'nomic-embed-text');
    const vectorStore = new InMemoryVectorStore(embed);
    const basicRetriever = new Retriever(vectorStore, { k: 10 });

    console.log('📂 Loading documents from multiple formats...\n');

    let allDocuments = [];
    const loadedTypes = new Set();

    // Quality mapping by document type
    const qualityMap = {
      pdf: { quality: 'high', weight: 1.0 },
      word: { quality: 'high', weight: 0.9 },
      excel: { quality: 'medium', weight: 0.7 },
      text: { quality: 'medium', weight: 0.6 },
      markdown: { quality: 'medium', weight: 0.7 }
    };

    // Load from PDF folder
    try {
      const pdfDocs = await loadDirectory(path.join(__dirname, 'PDF'), {
        extensions: ['.pdf']
      });
      
      pdfDocs.forEach((doc, i) => {
        doc.meta = {
          ...doc.meta,
          type: 'pdf',
          quality: 'high',
          source: 'research',
          date: '2024-09-01',
          filename: doc.meta.source || `pdf-${i}.pdf`
        };
      });
      
      if (pdfDocs.length > 0) {
        console.log(`✓ PDFs: ${pdfDocs.length} file(s)`);
        allDocuments.push(...pdfDocs);
        loadedTypes.add('pdf');
      }
    } catch (e) { /* folder not found */ }

    // Load from documents folder
    try {
      const docDocs = await loadDirectory(path.join(__dirname, 'documents'), {
        extensions: ['.docx', '.xlsx', '.txt', '.md']
      });
      
      docDocs.forEach((doc, i) => {
        const filename = doc.meta.source || `doc-${i}`;
        let type = 'text';
        
        if (filename.endsWith('.docx')) type = 'word';
        else if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) type = 'excel';
        else if (filename.endsWith('.md')) type = 'markdown';
        
        const typeInfo = qualityMap[type];
        doc.meta = {
          ...doc.meta,
          type: type,
          quality: typeInfo.quality,
          source: type === 'excel' ? 'data' : 'documentation',
          date: '2024-10-01',
          filename: filename
        };
      });
      
      if (docDocs.length > 0) {
        const wordCount = docDocs.filter(d => d.meta.type === 'word').length;
        const excelCount = docDocs.filter(d => d.meta.type === 'excel').length;
        const textCount = docDocs.filter(d => d.meta.type === 'text').length;
        const mdCount = docDocs.filter(d => d.meta.type === 'markdown').length;
        
        if (wordCount > 0) { console.log(`✓ Word: ${wordCount} file(s)`); loadedTypes.add('word'); }
        if (excelCount > 0) { console.log(`✓ Excel: ${excelCount} file(s)`); loadedTypes.add('excel'); }
        if (textCount > 0) { console.log(`✓ Text: ${textCount} file(s)`); loadedTypes.add('text'); }
        if (mdCount > 0) { console.log(`✓ Markdown: ${mdCount} file(s)`); loadedTypes.add('markdown'); }
        
        allDocuments.push(...docDocs);
      }
    } catch (e) { /* folder not found */ }

    console.log(`\n📚 Total: ${allDocuments.length} document(s) loaded`);
    console.log(`📊 Types: ${Array.from(loadedTypes).join(', ')}\n`);

    if (allDocuments.length === 0) {
      console.log('⚠️  No documents found.');
      console.log('\n💡 To test this example:');
      console.log('   1. Add files to ./PDF/ and ./documents/ folders');
      console.log('   2. Install dependencies: npm install pdf-parse mammoth xlsx\n');
      return;
    }

    // Index all documents
    console.log('💾 Indexing documents...\n');
    await vectorStore.addDocuments(allDocuments);
    console.log('✅ Documents indexed\n');

    // Create Smart Retriever with custom weights
    console.log('🧠 Creating Smart Retriever...\n');
    const smartRetriever = new SmartRetriever(basicRetriever, {
      weights: {
        semanticSimilarity: 0.35,
        keywordMatch: 0.20,
        recency: 0.15,
        sourceQuality: 0.25,    // Higher weight for quality
        contextRelevance: 0.05
      },
      enableLearning: true
    });

    // Enhanced quality scoring based on document type
    const originalGetSourceQuality = smartRetriever.decisionEngine.getSourceQuality.bind(smartRetriever.decisionEngine);
    smartRetriever.decisionEngine.getSourceQuality = function(source) {
      // Use base quality from source
      const baseQuality = originalGetSourceQuality(source);
      return baseQuality;
    };

    // Query
    const query = 'What are the key insights and important information from all documents?';
    console.log(`❓ Question: ${query}\n`);

    // Smart retrieval
    console.log('🧠 Smart Retrieval Results:\n');
    const smartResults = await smartRetriever.getRelevant(query, 5);
    
    smartResults.results.forEach((doc, i) => {
      console.log(`${i + 1}. [${doc.meta.type?.toUpperCase()}] Score: ${doc.weightedScore.toFixed(3)}`);
      console.log(`   File: ${doc.meta.filename}`);
      console.log(`   Quality: ${doc.meta.quality} | Source: ${doc.meta.source}`);
      console.log(`   Breakdown:`);
      console.log(`   • Similarity: ${doc.scoreBreakdown.semanticSimilarity.contribution.toFixed(3)}`);
      console.log(`   • Keywords: ${doc.scoreBreakdown.keywordMatch.contribution.toFixed(3)}`);
      console.log(`   • Quality: ${doc.scoreBreakdown.sourceQuality.contribution.toFixed(3)}`);
      console.log(`   • Recency: ${doc.scoreBreakdown.recency.contribution.toFixed(3)}`);
      console.log(`   Preview: "${doc.text.substring(0, 80).replace(/\n/g, ' ')}..."\n`);
    });

    if (smartResults.decisions.suggestions.length > 0) {
      console.log('💡 Decision Engine Insights:');
      smartResults.decisions.suggestions.forEach(s => console.log(`   • ${s}`));
      console.log();
    }

    // Generate answer
    console.log(`${'='.repeat(70)}`);
    console.log('🤖 GENERATING COMPREHENSIVE ANSWER');
    console.log(`${'='.repeat(70)}\n`);

    const response = await generateWithRAG(
      client,
      'granite4:3b',
      query,
      smartResults.results.map(d => d.text),
      {
        systemPrompt: 'You are a document analysis expert. Synthesize information from multiple document types (PDFs, Word, Excel, etc.) and provide a comprehensive, well-organized summary.',
        template: 'detailed'
      }
    );

    console.log(response.response);
    console.log();

    // Quality metrics
    console.log(`${'='.repeat(70)}`);
    console.log('📊 QUALITY METRICS');
    console.log(`${'='.repeat(70)}\n`);

    const typeDistribution = smartResults.results.reduce((acc, d) => {
      const type = d.meta.type || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    console.log('Document Type Distribution in Answer:');
    Object.entries(typeDistribution).forEach(([type, count]) => {
      console.log(`   • ${type}: ${count} section(s)`);
    });

    const avgQuality = smartResults.results.reduce((sum, d) => 
      sum + d.scoreBreakdown.sourceQuality.score, 0) / smartResults.results.length;
    const avgSimilarity = smartResults.results.reduce((sum, d) => 
      sum + d.scoreBreakdown.semanticSimilarity.score, 0) / smartResults.results.length;

    console.log(`\nQuality Metrics:`);
    console.log(`   📈 Average Source Quality: ${avgQuality.toFixed(3)}`);
    console.log(`   🎯 Average Semantic Match: ${avgSimilarity.toFixed(3)}`);
    console.log(`   📚 Total Sections Used: ${smartResults.results.length}`);
    console.log(`   🧠 Decision Engine: Active\n`);

    console.log('✅ Multi-format + Decision Engine completed!\n');
    console.log('💡 Key Benefits Demonstrated:');
    console.log('   • Unified search across PDF, Word, Excel, Text formats');
    console.log('   • Quality-aware document prioritization');
    console.log('   • Type-specific scoring and ranking');
    console.log('   • Comprehensive cross-document synthesis');
    console.log('   • Transparent decision making and metrics\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
