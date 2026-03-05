import assert from 'node:assert/strict';
import OllamaClient from '../src/ollamaClient.js';
import { createOllamaEmbedding } from '../src/embeddings/ollamaEmbedding.js';
import { InMemoryVectorStore } from '../src/vectorStore.js';
import { Retriever } from '../src/retriever.js';
import { generateWithRAG } from '../src/rag.js';

function normalizeHost(host) {
  if (!host) return 'http://127.0.0.1:11434';
  if (host === '0.0.0.0') return 'http://127.0.0.1:11434';
  if (host.startsWith('0.0.0.0:')) return `http://127.0.0.1:${host.split(':')[1]}`;
  if (!/^https?:\/\//.test(host)) return `http://${host}`;
  return host.replace('://0.0.0.0', '://127.0.0.1');
}

const OLLAMA_HOST = normalizeHost(process.env.OLLAMA_HOST || 'http://127.0.0.1:11434');
const CHAT_MODEL = process.env.OLLAMA_CHAT_MODEL || 'qwen3.5:9b';
const EMBEDDING_MODEL = process.env.OLLAMA_EMBED_MODEL || 'qwen3-embedding:0.6b';

async function main() {
  const client = new OllamaClient({ baseUrl: `${OLLAMA_HOST}/api` });
  const models = await fetch(`${OLLAMA_HOST}/api/tags`).then(res => res.json());
  const names = new Set((models.models || []).map(model => model.name));

  assert.ok(names.has(CHAT_MODEL), `Chat model not found in Ollama: ${CHAT_MODEL}`);
  assert.ok(names.has(EMBEDDING_MODEL), `Embedding model not found in Ollama: ${EMBEDDING_MODEL}`);

  const embed = createOllamaEmbedding({ baseUrl: `${OLLAMA_HOST}/api`, model: EMBEDDING_MODEL });
  const vector = await embed('integration smoke test');
  assert.ok(Array.isArray(vector) && vector.length > 0, 'Embedding response should be a non-empty vector');

  const store = new InMemoryVectorStore(embed);
  await store.addDocuments([
    { id: '1', text: 'Project codename LANTERNFOX is used for the internal retrieval smoke test.' },
    { id: '2', text: 'RAG stands for retrieval-augmented generation.' },
    { id: '3', text: 'Ollama serves local models over HTTP for local inference.' }
  ]);

  const retriever = new Retriever(store, { k: 2 });
  const docs = await retriever.getRelevant('What codename is used for the internal retrieval smoke test?', 2);
  assert.equal(docs.length, 2);
  assert.equal(docs[0].id, '1', 'Expected the codename document to rank first');

  const modelClient = {
    async generate({ model, prompt }) {
      return client.generate(model, prompt);
    }
  };

  const result = await generateWithRAG(modelClient, CHAT_MODEL, 'What codename is used for the internal retrieval smoke test?', docs, {
    systemPrompt: 'Answer with only the codename found in the context. Do not add punctuation or extra words.'
  });

  assert.equal(typeof result.response, 'string');
  assert.ok(result.response.trim().length > 0, 'Generation response should not be empty');
  assert.match(result.response.toUpperCase(), /LANTERNFOX/, 'Expected generated answer to mention the codename');

  console.log('Integration tests passed');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
