/**
 * Quick RAG - Real-World PDF Example
 * 
 * Shows how to load and query actual PDF documents
 * 
 * Requirements:
 * - npm install pdf-parse (for PDF loading)
 */

import { 
  OllamaRAGClient, 
  createOllamaRAGEmbedding,
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
  console.log('🚀 Quick RAG - Real-World PDF Example\n');

  try {
    // Initialize
    const client = new OllamaRAGClient();
    const embed = createOllamaRAGEmbedding(client, 'nomic-embed-text');
    const vectorStore = new InMemoryVectorStore(embed);
    const retriever = new Retriever(vectorStore);

    // Load PDFs from folder
    const pdfFolder = path.join(__dirname, 'PDF');
    console.log(`📁 Loading PDFs from: ${pdfFolder}\n`);

    const documents = await loadDirectory(pdfFolder, {
      recursive: true,
      extensions: ['.pdf']
    });

    console.log(`✅ Loaded ${documents.length} PDF document(s)\n`);

    // Show loaded documents
    documents.forEach((doc, i) => {
      const filename = doc.meta?.source || `document-${i}`;
      const preview = doc.text.substring(0, 150).replace(/\n/g, ' ');
      console.log(`   ${i + 1}. ${filename}`);
      console.log(`      Length: ${doc.text.length} characters`);
      console.log(`      Preview: "${preview}..."\n`);
    });

    // Add documents to vector store
    console.log('💾 Adding documents to vector store...\n');
    await vectorStore.addDocuments(documents);
    console.log('✅ Documents indexed and ready for search\n');

    // Query 1: Technical question
    console.log('═'.repeat(70));
    console.log('🔍 Query 1: Technical Research Question');
    console.log('═'.repeat(70) + '\n');

    const query1 = 'What are the main technical approaches discussed in these papers?';
    console.log(`❓ Question: ${query1}\n`);

    const results1 = await retriever.getRelevant(query1, 3);
    console.log(`📚 Retrieved ${results1.length} relevant section(s):\n`);

    results1.forEach((doc, i) => {
      console.log(`   ${i + 1}. Score: ${doc.score.toFixed(3)}`);
      console.log(`      Source: ${doc.meta.source || 'Unknown'}`);
      console.log(`      Content: "${doc.text.substring(0, 100).replace(/\n/g, ' ')}..."\n`);
    });

    const response1 = await generateWithRAG(
      client,
      'granite4:3b',
      query1,
      results1.map(d => d.text),
      {
        systemPrompt: 'You are a technical research assistant. Provide clear, structured answers based on the given research papers.',
        template: 'technical'
      }
    );

    console.log('🤖 Answer:');
    console.log('-'.repeat(70));
    console.log(response1.response);
    console.log('-'.repeat(70) + '\n');

    // Query 2: Specific detail
    console.log('═'.repeat(70));
    console.log('🔍 Query 2: Specific Detail Question');
    console.log('═'.repeat(70) + '\n');

    const query2 = 'What are the key contributions or findings mentioned?';
    console.log(`❓ Question: ${query2}\n`);

    const results2 = await retriever.getRelevant(query2, 3);
    console.log(`📚 Retrieved ${results2.length} relevant section(s):\n`);

    const response2 = await generateWithRAG(
      client,
      'granite4:3b',
      query2,
      results2.map(d => d.text),
      {
        template: 'academic'
      }
    );

    console.log('🤖 Answer:');
    console.log('-'.repeat(70));
    console.log(response2.response);
    console.log('-'.repeat(70) + '\n');

    // Query 3: Compare and analyze
    console.log('═'.repeat(70));
    console.log('🔍 Query 3: Comparative Analysis');
    console.log('═'.repeat(70) + '\n');

    const query3 = 'What methodologies or experimental approaches are described?';
    console.log(`❓ Question: ${query3}\n`);

    const results3 = await retriever.getRelevant(query3, 4);
    console.log(`📚 Retrieved ${results3.length} relevant section(s)\n`);

    const response3 = await generateWithRAG(
      client,
      'granite4:3b',
      query3,
      results3.map(d => d.text),
      {
        systemPrompt: 'You are a research methodology expert. Analyze and explain research methods clearly.',
        template: 'detailed'
      }
    );

    console.log('🤖 Answer:');
    console.log('-'.repeat(70));
    console.log(response3.response);
    console.log('-'.repeat(70) + '\n');

    console.log('✅ Real-world PDF RAG completed successfully!');
    console.log('\n💡 This example shows:');
    console.log('   • Loading real PDF documents');
    console.log('   • Automatic text extraction');
    console.log('   • Semantic search across PDFs');
    console.log('   • Context-aware answer generation');
    console.log('   • Different query types and templates\n');

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
