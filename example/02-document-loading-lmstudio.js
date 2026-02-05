/**
 * Document Loading with LM Studio
 * Load and process PDFs, Word, Excel, and other documents
 */

import {
  loadPDF,
  loadDirectory,
  loadURL,
  chunkDocuments,
  LMStudioRAGClient,
  createLMStudioRAGEmbedding,
  InMemoryVectorStore,
  Retriever,
  generateWithRAG
} from '../src/index.js';

async function main() {
  console.log('📄 Document Loading - LM Studio Example\n');
  console.log('═'.repeat(60) + '\n');

  try {
    // 0. Check LM Studio
    const client = new LMStudioRAGClient();
    const models = await client.listLoaded();
    
    if (models.length === 0) {
      console.log('⚠️  No models loaded in LM Studio');
      return;
    }

    const modelPath = models[0].path || models[0].id;
    console.log(`✅ Using model: ${modelPath}\n`);

    // 1. Load a single PDF
    console.log('📖 Loading single PDF...');
    try {
      const pdf = await loadPDF('./PDF/2509.17874v1.pdf');
      console.log(`✅ Loaded: ${pdf.meta.fileName}`);
      console.log(`   Pages: ${pdf.meta.pages}`);
      console.log(`   Characters: ${pdf.text.length}\n`);
    } catch (err) {
      console.log('⚠️  PDF not found, skipping...\n');
    }

    // 2. Load entire directory
    console.log('📂 Loading PDF directory...');
    try {
      const pdfs = await loadDirectory('./PDF', {
        extensions: ['.pdf'],
        recursive: false
      });
      console.log(`✅ Loaded ${pdfs.length} PDFs\n`);

      // 3. Chunk documents
      console.log('🔪 Chunking documents...');
      const chunks = chunkDocuments(pdfs, {
        chunkSize: 500,
        overlap: 50
      });
      console.log(`✅ Created ${chunks.length} chunks\n`);

      // 4. RAG Pipeline
      console.log('🤖 Setting up RAG pipeline...');
      const embed = createLMStudioRAGEmbedding(client, 'text-embedding-qwen3-embedding-0.6b');
      const store = new InMemoryVectorStore(embed);
      
      await store.addDocuments(chunks);
      console.log('✅ Documents added to vector store\n');

      // 5. Query
      const retriever = new Retriever(store, { k: 3 });
      const query = 'What is the main topic?';
      console.log(`🔍 Query: "${query}"\n`);

      const results = await retriever.getRelevant(query);
      console.log(`📋 Top ${results.length} results:\n`);
      
      results.forEach((doc, i) => {
        console.log(`${i + 1}. ${doc.meta.fileName} (score: ${doc.score.toFixed(3)})`);
        console.log(`   "${doc.text.substring(0, 80).replace(/\n/g, ' ')}..."\n`);
      });

      // 6. Generate answer
      console.log('💭 Generating answer...\n');
      const answer = await generateWithRAG(client, modelPath, query, results);
      const answerText = typeof answer === 'string' ? answer : answer.response || JSON.stringify(answer);
      console.log(`💡 ${answerText}\n`);

    } catch (err) {
      console.error('❌ Error:', err.message);
      if (err.code === 'ENOENT') {
        console.log('\n💡 Create a PDF folder and add some PDF files');
      }
    }

    // 7. Load from URL (bonus)
    console.log('─'.repeat(60) + '\n');
    console.log('🌐 Loading from URL...');
    try {
      const webDoc = await loadURL('https://example.com');
      console.log(`✅ Loaded: ${webDoc.meta.url}`);
      console.log(`   Text length: ${webDoc.text.length} characters\n`);
    } catch (err) {
      console.log('⚠️  URL loading failed (may need internet)\n');
    }

    console.log('✅ Example completed!');

  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Make sure LM Studio is running');
    }
  }
}

main().catch(console.error);
