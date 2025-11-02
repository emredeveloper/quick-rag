import { InMemoryVectorStore } from '../src/vectorStore.js';
import { Retriever } from '../src/retriever.js';
import dummyEmbedding from '../src/embeddings/dummyEmbedding.js';
import OllamaClient from '../src/ollamaClient.js';
import { createOllamaEmbedding } from '../src/embeddings/ollamaEmbedding.js';
import readline from 'readline';

async function main() {
  // If OLLAMA_TEST=1, use Ollama's `embeddinggemma` model for embeddings, otherwise use the dummy.
  const useOllama = process.env.OLLAMA_TEST === '1';
  const embeddingFn = useOllama ? createOllamaEmbedding({}) : dummyEmbedding;
  const store = new InMemoryVectorStore(embeddingFn);
  // Minimal example for users: add documents, retrieve, optionally call local Ollama.
  import { InMemoryVectorStore } from '../src/vectorStore.js';
  import { Retriever } from '../src/retriever.js';
  import dummyEmbedding from '../src/embeddings/dummyEmbedding.js';
  import OllamaClient from '../src/ollamaClient.js';
  import { createOllamaEmbedding } from '../src/embeddings/ollamaEmbedding.js';

  async function runSimple(prompt) {
    const docs = [
      { id: '1', text: 'React is a JavaScript library for building user interfaces.' },
      { id: '2', text: 'Ollama provides local LLM hosting.' },
      { id: '3', text: 'RAG uses retrieval to augment model responses.' }
    ];

    // Choose embedding: use Ollama if OLLAMA_TEST=1, otherwise dummy
    const useOllama = process.env.OLLAMA_TEST === '1';
    const embeddingFn = useOllama ? createOllamaEmbedding({}) : dummyEmbedding;

    const store = new InMemoryVectorStore(embeddingFn);
    await store.addDocuments(docs);

    const retriever = new Retriever(store, { k: 2 });
    const results = await retriever.getRelevant(prompt);

    console.log('\nRetrieved:');
    results.forEach(r => console.log(`- [${r.id}] (score=${r.score.toFixed(3)}) ${r.text}`));

    // Build a short prompt and optionally call Ollama
    const context = results.map((r, i) => `Doc ${i+1}: ${r.text}`).join('\n');
    const fullPrompt = `${context}\n\nUser: ${prompt}\nAssistant:`;

    if (!useOllama) {
      console.log('\nPrompt (not calling model):');
      console.log(fullPrompt);
      return;
    }

    console.log('\nCalling local Ollama...');
    const client = new OllamaClient();
    const model = process.env.OLLAMA_MODEL || 'granite4:tiny-h';
    const raw = await client.generate(model, fullPrompt);

    // Aggregate streaming JSON lines or simple response
    let text = '';
    if (typeof raw === 'string') {
      for (const line of raw.split(/\r?\n/)) {
        try {
          const obj = JSON.parse(line.trim());
          text += obj.response || '';
        } catch {
          // ignore
        }
      }
    } else if (raw && raw.response) {
      text = String(raw.response);
    } else {
      text = String(raw);
    }

    console.log('\nModel answer:');
    console.log(text.trim());
  }

  // Run from CLI: node run.js "Your question"
  const cli = process.argv.slice(2).join(' ').trim();
  if (!cli) {
    console.log('Usage: node run.js "Your question"');
    process.exit(0);
  }

  runSimple(cli).catch(err => { console.error(err); process.exit(1); });
      const autoEval = {
