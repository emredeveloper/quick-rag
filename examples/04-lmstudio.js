import {
  LMStudioRAGClient,
  createLMStudioRAGEmbedding,
  InMemoryVectorStore,
  Retriever,
  generateWithRAG
} from 'quick-rag';

const client = new LMStudioRAGClient();
const LLM_MODEL = 'google/gemma-3-4b';
const EMBED_MODEL = 'text-embedding-embeddinggemma-300m';
const embed = createLMStudioRAGEmbedding(client, EMBED_MODEL);
const store = new InMemoryVectorStore(embed);

await store.addDocuments([
  { id: '1', text: 'LM Studio runs local LLMs with a desktop workflow.' },
  { id: '2', text: 'RAG improves answers using retrieved context.' }
]);

const retriever = new Retriever(store, { k: 2 });
const query = 'What is LM Studio in a RAG setup?';
const docs = await retriever.getRelevant(query, 2);
const out = await generateWithRAG(client, LLM_MODEL, query, docs);

console.log('model:', LLM_MODEL);
console.log('embedding:', EMBED_MODEL);
console.log(out.response);
