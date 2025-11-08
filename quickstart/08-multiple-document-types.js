/**
 * Quick RAG - Multiple Document Types Example
 * 
 * Shows how to load and query various document formats:
 * - PDF files
 * - Word documents (.docx)
 * - Excel spreadsheets (.xlsx)
 * - Text files (.txt)
 * - Markdown files (.md)
 * - JSON files (.json)
 * 
 * Requirements:
 * All dependencies are optional and auto-installed:
 * - pdf-parse (for PDF)
 * - mammoth (for Word)
 * - xlsx (for Excel)
 */

import { 
  OllamaRAGClient, 
  createOllamaRAGEmbedding,
  InMemoryVectorStore, 
  Retriever,
  generateWithRAG,
  loadDirectory,
  loadDocument
} from 'quick-rag';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('🚀 Quick RAG - Multiple Document Types\n');

  try {
    // Initialize
    const client = new OllamaRAGClient();
    const embed = createOllamaRAGEmbedding(client, 'nomic-embed-text');
    const vectorStore = new InMemoryVectorStore(embed);
    const retriever = new Retriever(vectorStore);

    console.log('📂 Loading documents from multiple sources...\n');

    let allDocuments = [];

    // 1. Load PDFs
    try {
      const pdfFolder = path.join(__dirname, 'PDF');
      const pdfDocs = await loadDirectory(pdfFolder, {
        extensions: ['.pdf']
      });
      
      if (pdfDocs.length > 0) {
        console.log(`📄 PDF Documents: ${pdfDocs.length} file(s)`);
        pdfDocs.forEach((doc, i) => {
          doc.meta = {
            ...doc.meta,
            type: 'pdf',
            quality: 'high',
            source: 'research'
          };
          console.log(`   ✓ ${doc.meta.source || `pdf-${i}`} (${doc.text.length} chars)`);
        });
        allDocuments.push(...pdfDocs);
      }
    } catch (error) {
      console.log(`   ⚠️  No PDF files found or pdf-parse not installed`);
    }

    // 2. Load Word documents
    try {
      const wordFolder = path.join(__dirname, 'Word');
      const wordDocs = await loadDirectory(wordFolder, {
        extensions: ['.docx']
      });
      
      if (wordDocs.length > 0) {
        console.log(`\n📝 Word Documents: ${wordDocs.length} file(s)`);
        wordDocs.forEach((doc, i) => {
          doc.meta = {
            ...doc.meta,
            type: 'word',
            quality: 'high',
            source: 'documentation'
          };
          console.log(`   ✓ ${doc.meta.source || `word-${i}`} (${doc.text.length} chars)`);
        });
        allDocuments.push(...wordDocs);
      }
    } catch (error) {
      console.log(`   ⚠️  No Word files found or mammoth not installed`);
    }

    // 3. Load Excel files
    try {
      const excelFolder = path.join(__dirname, 'Excel');
      console.log(`\n📊 Loading Excel files (this may take a moment for large spreadsheets)...`);
      const excelDocs = await loadDirectory(excelFolder, {
        extensions: ['.xlsx', '.xls']
      });
      
      if (excelDocs.length > 0) {
        console.log(`📊 Excel Documents: ${excelDocs.length} file(s)`);
        excelDocs.forEach((doc, i) => {
          doc.meta = {
            ...doc.meta,
            type: 'excel',
            quality: 'medium',
            source: 'data'
          };
          console.log(`   ✓ ${doc.meta.source || `excel-${i}`} (${doc.text.length} chars)`);
        });
        allDocuments.push(...excelDocs);
      }
    } catch (error) {
      console.log(`   ⚠️  No Excel files found or xlsx not installed`);
    }

    // 4. Load PowerPoint presentations
    try {
      const pptFolder = path.join(__dirname, 'PowerPoint');
      console.log(`\n📊 Loading PowerPoint presentations...`);
      const pptDocs = await loadDirectory(pptFolder, {
        extensions: ['.pptx', '.ppt']
      });
      
      if (pptDocs.length > 0) {
        console.log(`📽️ PowerPoint Documents: ${pptDocs.length} file(s)`);
        pptDocs.forEach((doc, i) => {
          doc.meta = {
            ...doc.meta,
            type: 'powerpoint',
            quality: 'high',
            source: 'presentation'
          };
          console.log(`   ✓ ${doc.meta.source || `ppt-${i}`} (${doc.text.length} chars)`);
        });
        allDocuments.push(...pptDocs);
      }
    } catch (error) {
      console.log(`   ⚠️  No PowerPoint files found or officeparser not installed`);
    }

    // 5. Load Text and Markdown files
    try {
      const textFolder = path.join(__dirname, 'documents');
      const textDocs = await loadDirectory(textFolder, {
        extensions: ['.txt', '.md']
      });
      
      if (textDocs.length > 0) {
        console.log(`\n📃 Text/Markdown Documents: ${textDocs.length} file(s)`);
        textDocs.forEach((doc, i) => {
          doc.meta = {
            ...doc.meta,
            type: doc.meta.source?.endsWith('.md') ? 'markdown' : 'text',
            quality: 'medium',
            source: 'notes'
          };
          console.log(`   ✓ ${doc.meta.source || `text-${i}`} (${doc.text.length} chars)`);
        });
        allDocuments.push(...textDocs);
      }
    } catch (error) {
      console.log(`   ⚠️  No text files found`);
    }

    // Summary
    console.log(`\n${'='.repeat(70)}`);
    console.log(`📚 Total Documents Loaded: ${allDocuments.length}`);
    console.log(`${'='.repeat(70)}\n`);

    if (allDocuments.length === 0) {
      console.log('⚠️  No documents found to index.');
      console.log('\n💡 To test this example:');
      console.log('   1. Add PDF files to ./PDF/ folder');
      console.log('   2. Add Word/Excel/Text files to ./documents/ folder');
      console.log('   3. Install optional dependencies if needed:');
      console.log('      npm install pdf-parse mammoth xlsx\n');
      return;
    }

    // Group by type
    const byType = allDocuments.reduce((acc, doc) => {
      const type = doc.meta.type || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    console.log('📊 Document Distribution:');
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`   • ${type}: ${count} document(s)`);
    });
    console.log();

    // Index all documents
    console.log('💾 Indexing all documents...\n');
    await vectorStore.addDocuments(allDocuments);
    console.log('✅ All documents indexed and ready for search\n');

    // Query across all document types
    console.log(`${'='.repeat(70)}`);
    console.log('🔍 Cross-Document Search');
    console.log(`${'='.repeat(70)}\n`);

    const query = 'What are the main topics or key information across all documents?';
    console.log(`❓ Question: ${query}\n`);

    const results = await retriever.getRelevant(query, 5);
    console.log(`📚 Retrieved ${results.length} relevant sections from different sources:\n`);

    results.forEach((doc, i) => {
      console.log(`   ${i + 1}. [${doc.meta.type?.toUpperCase() || 'UNKNOWN'}] Score: ${doc.score.toFixed(3)}`);
      console.log(`      Source: ${doc.meta.source || 'Unknown'}`);
      console.log(`      Preview: "${doc.text.substring(0, 100).replace(/\n/g, ' ')}..."\n`);
    });

    // Generate comprehensive answer
    const response = await generateWithRAG(
      client,
      'granite4:3b',
      query,
      results.map(d => d.text),
      {
        systemPrompt: 'You are a document analysis assistant. Synthesize information from multiple document types and provide a comprehensive overview.',
        template: 'detailed'
      }
    );

    console.log('🤖 Comprehensive Answer:');
    console.log('-'.repeat(70));
    console.log(response.response);
    console.log('-'.repeat(70) + '\n');

    // Type-specific query
    console.log(`${'='.repeat(70)}`);
    console.log('🎯 Type-Specific Query (Research Papers Only)');
    console.log(`${'='.repeat(70)}\n`);

    const researchQuery = 'What research methodologies or findings are discussed?';
    console.log(`❓ Question: ${researchQuery}\n`);

    const researchResults = await retriever.getRelevant(researchQuery, 3, {
      filter: { source: 'research' }  // Only research papers
    });

    if (researchResults.length > 0) {
      console.log(`📚 Retrieved ${researchResults.length} section(s) from research papers:\n`);
      
      const researchResponse = await generateWithRAG(
        client,
        'granite4:3b',
        researchQuery,
        researchResults.map(d => d.text),
        {
          template: 'academic'
        }
      );

      console.log('🤖 Answer (Research-focused):');
      console.log('-'.repeat(70));
      console.log(researchResponse.response);
      console.log('-'.repeat(70) + '\n');
    } else {
      console.log('   No research documents found\n');
    }

    console.log('✅ Multi-format document processing completed!\n');
    console.log('💡 This example demonstrates:');
    console.log('   • Loading multiple document formats (PDF, Word, Excel, Text)');
    console.log('   • Automatic format detection and processing');
    console.log('   • Cross-document semantic search');
    console.log('   • Type-specific filtering and querying');
    console.log('   • Unified knowledge base from diverse sources\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n💡 Make sure optional dependencies are installed:');
    console.error('   npm install pdf-parse mammoth xlsx\n');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
