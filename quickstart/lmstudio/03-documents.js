/**
 * Quick RAG - LM Studio with Multiple Document Types
 * 
 * Shows how to use LM Studio with various document formats
 * Same functionality as 08-multiple-document-types.js but with LM Studio
 * 
 * Prerequisites:
 * - LM Studio running at http://localhost:1234
 * - npm install pdf-parse mammoth xlsx officeparser (for document loading)
 */

import { 
  LMStudioRAGClient,
  createLMStudioRAGEmbedding,
  InMemoryVectorStore, 
  Retriever,
  generateWithRAG,
  loadDirectory
} from 'quick-rag';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('🚀 Quick RAG - LM Studio with Multiple Document Types\n');

  try {
    // Initialize LM Studio client
    const client = new LMStudioRAGClient();
    const embed = createLMStudioRAGEmbedding(client, 'text-embedding-nomic-embed-text-v1.5');
    const vectorStore = new InMemoryVectorStore(embed);
    const retriever = new Retriever(vectorStore);

    console.log('✅ Connected to LM Studio\n');
    console.log('📂 Loading documents from multiple sources...\n');

    let allDocuments = [];

    // Load PDFs
    try {
      const pdfFolder = path.join(__dirname, 'PDF');
      const pdfDocs = await loadDirectory(pdfFolder, {
        extensions: ['.pdf']
      });
      
      if (pdfDocs.length > 0) {
        console.log(`📄 PDF Documents: ${pdfDocs.length} file(s)`);
        pdfDocs.forEach((doc, i) => {
          doc.meta = { ...doc.meta, type: 'pdf', source: 'research' };
          console.log(`   ✓ ${doc.meta.source} (${doc.text.length} chars)`);
        });
        allDocuments.push(...pdfDocs);
      }
    } catch (error) {
      console.log(`   ⚠️  No PDF files found`);
    }

    // Load Word documents
    try {
      const wordFolder = path.join(__dirname, 'Word');
      const wordDocs = await loadDirectory(wordFolder, {
        extensions: ['.docx']
      });
      
      if (wordDocs.length > 0) {
        console.log(`\n📝 Word Documents: ${wordDocs.length} file(s)`);
        wordDocs.forEach((doc, i) => {
          doc.meta = { ...doc.meta, type: 'word', source: 'documentation' };
          console.log(`   ✓ ${doc.meta.source} (${doc.text.length} chars)`);
        });
        allDocuments.push(...wordDocs);
      }
    } catch (error) {
      console.log(`   ⚠️  No Word files found`);
    }

    // Load Excel files
    try {
      const excelFolder = path.join(__dirname, 'Excel');
      console.log(`\n📊 Loading Excel files...`);
      const excelDocs = await loadDirectory(excelFolder, {
        extensions: ['.xlsx', '.xls']
      });
      
      if (excelDocs.length > 0) {
        console.log(`📊 Excel Documents: ${excelDocs.length} file(s)`);
        excelDocs.forEach((doc, i) => {
          doc.meta = { ...doc.meta, type: 'excel', source: 'data' };
          console.log(`   ✓ ${doc.meta.source} (${doc.text.length} chars)`);
        });
        allDocuments.push(...excelDocs);
      }
    } catch (error) {
      console.log(`   ⚠️  No Excel files found`);
    }

    // Load PowerPoint
    try {
      const pptFolder = path.join(__dirname, 'PowerPoint');
      console.log(`\n📊 Loading PowerPoint presentations...`);
      const pptDocs = await loadDirectory(pptFolder, {
        extensions: ['.pptx', '.ppt']
      });
      
      if (pptDocs.length > 0) {
        console.log(`📽️ PowerPoint Documents: ${pptDocs.length} file(s)`);
        pptDocs.forEach((doc, i) => {
          doc.meta = { ...doc.meta, type: 'powerpoint', source: 'presentation' };
          console.log(`   ✓ ${doc.meta.source} (${doc.text.length} chars)`);
        });
        allDocuments.push(...pptDocs);
      }
    } catch (error) {
      console.log(`   ⚠️  No PowerPoint files found`);
    }

    if (allDocuments.length === 0) {
      console.log('\n❌ No documents found! Add some PDF, Word, Excel, or PowerPoint files.\n');
      process.exit(1);
    }

    console.log('\n' + '═'.repeat(70));
    console.log(`📚 Total Documents Loaded: ${allDocuments.length}`);
    console.log('═'.repeat(70) + '\n');

    // Index documents
    console.log('💾 Indexing all documents...\n');
    await vectorStore.addDocuments(allDocuments);
    console.log('✅ All documents indexed and ready for search\n');

    // Query 1: Cross-document search
    console.log('═'.repeat(70));
    console.log('🔍 Query 1: Cross-Document Search with LM Studio');
    console.log('═'.repeat(70) + '\n');

    const query1 = 'What are the main topics or key information across all documents?';
    console.log(`❓ Question: ${query1}\n`);

    const results1 = await retriever.getRelevant(query1, 5);
    console.log(`📚 Retrieved ${results1.length} relevant sections:\n`);

    results1.forEach((doc, i) => {
      console.log(`   ${i + 1}. [${doc.meta.type.toUpperCase()}] Score: ${doc.score.toFixed(3)}`);
      console.log(`      Source: ${doc.meta.source}`);
      console.log(`      Preview: "${doc.text.substring(0, 100).replace(/\n/g, ' ')}..."\n`);
    });

    console.log('🌊 Streaming answer from LM Studio:\n');
    console.log('-'.repeat(70));

    // Stream response
    const stream1 = await client.chat({
      model: 'qwen/qwen3-vl-4b',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant analyzing multiple documents. Provide comprehensive summaries.'
        },
        {
          role: 'user',
          content: `Context from multiple documents:\n${results1.map(d => d.text).join('\n\n')}\n\nQuestion: ${query1}`
        }
      ],
      stream: true,
      temperature: 0.7
    });

    for await (const chunk of stream1) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) process.stdout.write(content);
    }

    console.log('\n' + '-'.repeat(70) + '\n');

    // Query 2: Type-specific query
    console.log('═'.repeat(70));
    console.log('🔍 Query 2: Filtered Query (Word Documents Only)');
    console.log('═'.repeat(70) + '\n');

    const query2 = 'What documentation or technical information is available?';
    console.log(`❓ Question: ${query2}\n`);

    const results2 = await retriever.getRelevant(query2, 3, {
      filter: (meta) => meta.type === 'word'
    });

    console.log(`📚 Retrieved ${results2.length} Word document(s)\n`);

    const response2 = await generateWithRAG(
      client,
      'google/gemma-3-4b',
      query2,
      results2.map(d => d.text),
      {
        template: 'concise'
      }
    );

    console.log('🤖 LM Studio Answer:');
    console.log('-'.repeat(70));
    console.log(response2.response);
    console.log('-'.repeat(70) + '\n');

    console.log('✅ LM Studio multi-document processing completed!\n');

    console.log('💡 This example demonstrates:');
    console.log('   • Using LM Studio instead of Ollama');
    console.log('   • Loading PDF, Word, Excel, PowerPoint files');
    console.log('   • Cross-document semantic search');
    console.log('   • Streaming responses for better UX');
    console.log('   • Type-specific filtering\n');

    console.log('🔄 Switching between LM Studio and Ollama:');
    console.log('   • Just change: LMStudioRAGClient ↔ OllamaRAGClient');
    console.log('   • And: createLMStudioRAGEmbedding ↔ createOllamaRAGEmbedding');
    console.log('   • Everything else stays the same!\n');

  } catch (error) {
    if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed')) {
      console.error('\n❌ Error: Cannot connect to LM Studio');
      console.error('\n📋 Setup:');
      console.error('   1. Download LM Studio: https://lmstudio.ai/');
      console.error('   2. Load a model (recommended: Llama 3.2 3B or Mistral 7B)');
      console.error('   3. Start local server on port 1234\n');
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
