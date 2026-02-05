import {
  createVectorStore,
  createMRL
} from 'quick-rag';

async function embedding(text, dim = 128) {
  if (Array.isArray(text)) {
    return Promise.all(text.map((t) => embedding(t, dim)));
  }
  const vec = new Array(dim).fill(0);
  for (let i = 0; i < text.length; i++) vec[i % dim] += text.charCodeAt(i);
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

const memoryStore = await createVectorStore('memory', createMRL(embedding, 128), { defaultDim: 64 });
await memoryStore.addDocuments([{ id: '1', text: 'Memory store works without extra deps.' }], { dim: 64 });
const memResults = await memoryStore.similaritySearch('memory', 1);
console.log('memory store:', memResults[0].id, memResults[0].score.toFixed(3));

try {
  const sqliteStore = await createVectorStore('sqlite', createMRL(embedding, 128), {
    dbPath: './examples.sqlite'
  });
  await sqliteStore.addDocuments([{ id: 's1', text: 'SQLite store example.' }], { dim: 64 });
  const sqliteResults = await sqliteStore.similaritySearch('sqlite', 1);
  console.log('sqlite store:', sqliteResults[0].id, sqliteResults[0].score.toFixed(3));
} catch (err) {
  console.log('sqlite skipped:', err.message);
}
