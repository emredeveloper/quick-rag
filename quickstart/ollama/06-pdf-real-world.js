/**
 * Quick RAG - PDF Real-World Example
 * Run: node ollama/06-pdf-real-world.js
 */

import { 
  OllamaRAGClient, 
  createOllamaRAGEmbedding,
  InMemoryVectorStore, 
  Retriever,
  generateWithRAG,
  loadPDF,
  chunkDocuments
} from 'quick-rag';

const client = new OllamaRAGClient();
const embed = createOllamaRAGEmbedding(client, 'nomic-embed-text');
const store = new InMemoryVectorStore(embed);
const retriever = new Retriever(store);

async function main() {
  // Load PDF (using available PDF file)
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
    return;
  }
  
  // Chunk for better retrieval
  const chunks = chunkDocuments([pdfDoc], { chunkSize: 500, overlap: 50 });
  await store.addDocuments(chunks);

  const query = 'What are the main findings?';
  const results = await retriever.getRelevant(query, 2);
  const answer = await generateWithRAG(client, 'granite4:3b', query, results.map(d => d.text));

  console.log('Q:', query);
  console.log('A:', typeof answer === 'string' ? answer : answer.response);
}

main().catch(console.error);
