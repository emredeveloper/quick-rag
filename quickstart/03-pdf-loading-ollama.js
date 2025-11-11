/**
 * Quick RAG - PDF Loading
 * Run: node 03-pdf-loading-ollama.js
 */

import { 
  OllamaRAGClient, 
  createOllamaRAGEmbedding,
  InMemoryVectorStore, 
  Retriever,
  generateWithRAG,
  loadPDF
} from 'quick-rag';

const client = new OllamaRAGClient();
const embed = createOllamaRAGEmbedding(client, 'nomic-embed-text');
const store = new InMemoryVectorStore(embed);
const retriever = new Retriever(store);

async function main() {
  // Load PDF (using available PDF file)
  // Note: Replace with your PDF path if you have a specific file
  const pdfFiles = ['./PDF/2509.17874v1.pdf', './PDF/2510.00184v1.pdf'];
  let pdfDoc;
  
  // Try to load first available PDF
  for (const pdfPath of pdfFiles) {
    try {
      pdfDoc = await loadPDF(pdfPath);
      console.log(`✅ Loaded PDF: ${pdfPath}\n`);
      break;
    } catch (err) {
      if (err.code === 'ENOENT') continue;
      throw err;
    }
  }
  
  if (!pdfDoc) {
    console.error('❌ No PDF file found. Please add a PDF file to the PDF/ directory.');
    console.error('   Available PDFs:', pdfFiles.join(', '));
    return;
  }
  
  await store.addDocuments([pdfDoc]);

  const query = 'What is this document about?';
  const results = await retriever.getRelevant(query, 1);
  const answer = await generateWithRAG(client, 'granite4:3b', query, results.map(d => d.text));

  console.log('Q:', query);
  console.log('A:', typeof answer === 'string' ? answer : answer.response);
}

main().catch(console.error);
