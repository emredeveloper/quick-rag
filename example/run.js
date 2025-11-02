import { InMemoryVectorStore } from '../src/vectorStore.js';
import { Retriever } from '../src/retriever.js';
import OllamaClient from '../src/ollamaClient.js';
import { createOllamaEmbedding } from '../src/embeddings/ollamaEmbedding.js';
import { createMRL } from '../src/embeddings/mrl.js';

// Short, readable example
async function runSimple(prompt) {
  const docs = [
    { id: '1', text: 'React is a JavaScript library for building user interfaces.' },
    { id: '2', text: 'Ollama provides local LLM hosting.' },
    { id: '3', text: 'RAG uses retrieval to augment model responses.' }
  ];

  // Use Ollama embedding. To enable live Ollama generation set OLLAMA_TEST=1.
  const baseEmbedding = createOllamaEmbedding({});
  const useOllama = process.env.OLLAMA_TEST === '1';
  const mrl = createMRL(baseEmbedding, 768);

  const store = new InMemoryVectorStore(mrl, { defaultDim: 128 });
  // Add documents at default dim (128) for speed/storage tradeoff
  await store.addDocuments(docs, { dim: 128 });

  const retriever = new Retriever(store, { k: 2 });
  const results = await retriever.getRelevant(prompt);

  console.log('\nRetrieved:');
  results.forEach(r => console.log(`- [${r.id}] (score=${r.score.toFixed(3)}) ${r.text}`));

  const context = results.map((r, i) => `Doc ${i+1}: ${r.text}`).join('\n');
  const fullPrompt = `${context}\n\nUser: ${prompt}\nAssistant:`;

  if (!useOllama) {
    console.log('\nOLLAMA_TEST not set. Prompt (not calling model):');
    console.log(fullPrompt);
    return;
  }

  console.log('\nCalling local Ollama...');
  const client = new OllamaClient();
  const model = process.env.OLLAMA_MODEL || 'granite4:tiny-h';
  const raw = await client.generate(model, fullPrompt);

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

const cli = process.argv.slice(2).join(' ').trim();
if (!cli) {
  console.log('Usage: node run.js "Your question"');
  process.exit(0);
}

runSimple(cli).catch(err => { console.error(err); process.exit(1); });
