/**
 * Quick RAG - Multiple Document Types
 * Run: node ollama/08-multiple-document-types.js
 */

import { 
  OllamaRAGClient, 
  createOllamaRAGEmbedding,
  InMemoryVectorStore, 
  Retriever,
  generateWithRAG,
  loadPDF,
  loadWord,
  loadExcel
} from 'quick-rag';

const client = new OllamaRAGClient();
const embed = createOllamaRAGEmbedding(client, 'nomic-embed-text');
const store = new InMemoryVectorStore(embed);
const retriever = new Retriever(store);

async function main() {
  // Load different document types
  const pdfDoc = await loadPDF('./PDF/example.pdf');
  const wordDoc = await loadWord('./Word/example.docx');
  const excelDoc = await loadExcel('./Excel/example.xlsx');

  await store.addDocuments([pdfDoc, wordDoc, excelDoc]);

  const query = 'What information is in these documents?';
  const results = await retriever.getRelevant(query, 3);
  const answer = await generateWithRAG(client, 'granite4:3b', query, results.map(d => d.text));

  console.log('Q:', query);
  console.log('A:', typeof answer === 'string' ? answer : answer.response);
}

main().catch(console.error);
