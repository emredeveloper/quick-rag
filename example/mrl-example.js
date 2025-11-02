import { InMemoryVectorStore } from '../src/vectorStore.js';
import { createOllamaEmbedding } from '../src/embeddings/ollamaEmbedding.js';
import { createMRL } from '../src/embeddings/mrl.js';

// MRL example: show how to produce/compare 128 and 256-dim embeddings
async function main() {
  const docs = [
    { id: '1', text: 'React is a JavaScript library for building user interfaces.' },
    { id: '2', text: 'Vue is a progressive framework for building user interfaces.' },
    { id: '3', text: 'Ollama provides local LLM hosting.' }
  ];

  // By default use Ollama for embeddings. Ensure your local Ollama server is running
  // and set OLLAMA_TEST=1 if you want to run live embedding/generation in examples.
  const baseEmbedding = createOllamaEmbedding({});
  const mrl = createMRL(baseEmbedding, 768);

  // Create two small stores to compare dims
  const store128 = new InMemoryVectorStore(mrl, { defaultDim: 128 });
  const store256 = new InMemoryVectorStore(mrl, { defaultDim: 256 });

  // Add documents at the chosen dims
  await store128.addDocuments(docs, { dim: 128 });
  await store256.addDocuments(docs, { dim: 256 });

  const query = 'How can I build user interfaces with JavaScript?';

  console.log('\n--- MRL example: similarity at 128-dim ---');
  const res128 = await store128.similaritySearch(query, 3, 128);
  res128.forEach(r => console.log(`${r.id}	${r.score.toFixed(4)}	${r.text}`));

  console.log('\n--- MRL example: similarity at 256-dim ---');
  const res256 = await store256.similaritySearch(query, 3, 256);
  res256.forEach(r => console.log(`${r.id}	${r.score.toFixed(4)}	${r.text}`));

  // Compare scores per doc id
  console.log('\n--- Compare scores (docId: dim128 vs dim256) ---');
  const scoreById = id => ({
    d128: (res128.find(x => x.id === id) || {}).score || 0,
    d256: (res256.find(x => x.id === id) || {}).score || 0
  });

  for (const d of docs) {
    const s = scoreById(d.id);
    console.log(`${d.id}: ${s.d128.toFixed(4)} vs ${s.d256.toFixed(4)}`);
  }

  console.log('\nNote: Lower-dim embeddings are faster and smaller; MRL lets you trade quality for speed/storage.');
}

main().catch(err => { console.error(err); process.exit(1); });
