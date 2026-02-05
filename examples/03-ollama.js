import {
  OllamaRAGClient,
  createOllamaRAGEmbedding,
  InMemoryVectorStore,
  Retriever,
  generateWithRAG
} from 'quick-rag';

const client = new OllamaRAGClient({ host: 'http://127.0.0.1:11434' });
const embed = createOllamaRAGEmbedding(client, 'qwen3-embedding:0.6b');
const store = new InMemoryVectorStore(embed);

await store.addDocuments([
  { id: '1', text: 'RAG retrieves context and then generates an answer.' },
  { id: '2', text: 'Ollama serves local models over HTTP.' },
  { id: '3', text: 'granite4:3b is used here as the chat model.' }
]);

const retriever = new Retriever(store, { k: 2 });
const query = 'How do RAG and Ollama work together?';
const docs = await retriever.getRelevant(query, 2);
const out = await generateWithRAG(client, 'granite4:3b', query, docs);

console.log('docs:', docs.length);
console.log(out.response);
