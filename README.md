# RAG Ollama JS

[![npm version](https://img.shields.io/npm/v/js-rag-local-llm.svg)](https://www.npmjs.com/package/js-rag-local-llm)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Minimal, fast, and powerful RAG (Retrieval-Augmented Generation) library for React apps using local Ollama models.

## ✨ What's New in v0.6.0

- 🚀 **5x Faster Embedding**: Parallel batch processing with `Promise.all`
- 📚 **Full CRUD Operations**: Add, update, delete, and query documents
- 🎯 **Dynamic topK**: Control retrieval count per query
- 🌊 **Streaming Ready**: Proper prompt return for streaming support
- 🔧 **Modern Fetch**: Native fetch for Node.js 18+ (smaller bundle)
- ✅ **Production Ready**: No circular dependencies, tested and stable

[View full changelog](./CHANGELOG.md)

## Installation

```bash
npm install js-rag-local-llm
```

Quick setup (Vite + Express)

```bash
# 1) Create a Vite React app
npm create vite@latest my-rag-app -- --template react
cd my-rag-app

# 2) Install deps
npm install js-rag-local-llm express
npm install -D concurrently @vitejs/plugin-react

# 3) Add server.js (Express proxy) and Vite proxy

# server.js (create this file at project root)
```javascript
import express from 'express';
import { OllamaClient } from 'js-rag-local-llm';

const app = express();
app.use(express.json());

// text generation
app.post('/api/rag-generate', async (req, res) => {
  try {
    const { model, prompt } = req.body || {};
    const client = new OllamaClient({ baseUrl: 'http://127.0.0.1:11434/api' });
    const raw = await client.generate(model || 'granite4:tiny-h', prompt);
    let text = '';
    if (typeof raw === 'string') {
      for (const line of raw.split(/\r?\n/)) { try { const obj = JSON.parse(line.trim()); text += obj.response || ''; } catch {} }
    } else if (raw?.response) text = String(raw.response); else text = String(raw);
    res.json({ response: text.trim() });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// embeddings
app.post('/api/embed', async (req, res) => {
  try {
    const { model = 'embeddinggemma', input } = req.body || {};
    const client = new OllamaClient({ baseUrl: 'http://127.0.0.1:11434/api' });
    const resp = await client.embed(model, input);
    res.json(resp);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.listen(3001, () => console.log('API proxy http://127.0.0.1:3001'));
```

vite.config.js (ensure the proxy below exists)
```
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': { target: 'http://127.0.0.1:3001', changeOrigin: true } } }
});
```

4) Scripts
```bash
npm pkg set scripts.dev="concurrently \"npm:dev:server\" \"npm:dev:client\""
npm pkg set scripts.dev:server="node server.js"
npm pkg set scripts.dev:client="vite"
```

5) Run
```bash
npm run dev
```

## Quick Start (React + API proxy)

Add a minimal API route to proxy your local Ollama server (browsers cannot call it directly due to CORS):

```javascript
// pages/api/rag-generate.js (Next.js)
import { OllamaClient } from 'js-rag-local-llm';

export default async function handler(req, res) {
  try {
    const { model, prompt } = req.body || {};
    const client = new OllamaClient();
    const raw = await client.generate(model || 'granite4:tiny-h', prompt);
    let text = '';
    if (typeof raw === 'string') {
      for (const line of raw.split(/\r?\n/)) {
        try { const obj = JSON.parse(line.trim()); text += obj.response || ''; } catch {}
      }
    } else if (raw && raw.response) {
      text = String(raw.response);
    } else {
      text = String(raw);
    }
    res.status(200).json({ response: text.trim() });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}
```

Use the hook in your component:

```jsx
// App.jsx
import { useEffect, useState } from 'react';
import { useRAG, initRAG, createBrowserModelClient } from 'js-rag-local-llm';

const docs = [
  { id: '1', text: 'React is a JavaScript library for building user interfaces.' },
  { id: '2', text: 'Ollama provides local LLM hosting.' },
  { id: '3', text: 'RAG uses retrieval to augment model responses.' }
];

export default function App() {
  const [{ retriever, store }, setCore] = useState({});
  const [query, setQuery] = useState('');
  const { run, loading, error, response, docs: retrieved, streaming } = useRAG({
    retriever,
    modelClient: createBrowserModelClient(),
    model: 'granite4:tiny-h'
  });

  // Choose a custom embedding model via baseEmbeddingOptions.model (default: 'embeddinggemma')
  useEffect(() => {
    initRAG(docs, { baseEmbeddingOptions: { model: 'nomic-embed-text' } }).then(setCore);
  }, []);

  return (
    <div>
      <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Ask something..." />
      <button onClick={() => run(query)} disabled={loading || !retriever}>
        {loading ? (streaming ? 'Streaming...' : 'Loading...') : 'Ask'}
      </button>
      <button onClick={() => run(query, { stream: true })} disabled={loading || !retriever}>
        Stream Answer
      </button>
      {error && <div style={{color:'red'}}>Error: {String(error)}</div>}
      {!!retrieved?.length && <ul>{retrieved.map(d => <li key={d.id}>[{d.id}] {d.text}</li>)}</ul>}
      {response && <pre>{response}</pre>}
    </div>
  );
}
```

Notes:
- Default model: `granite4:tiny-h`, default embedding model: `embeddinggemma`.
- Adjust `OllamaClient({ baseUrl: 'http://127.0.0.1:11434/api' })` if needed (Windows: use 127.0.0.1).

## 🎯 New Features in v0.6.0

### Dynamic topK Parameter

Control the number of retrieved documents per query:

```javascript
const retriever = new Retriever(store, { k: 2 }); // default

// Override per query
const docs = await retriever.getRelevant(query, 5); // get 5 instead

// Use with generateWithRAG
const result = await generateWithRAG({
  retriever,
  modelClient,
  model,
  query,
  topK: 10 // retrieve 10 documents for this query
});
```

### VectorStore CRUD Operations

Manage your document store dynamically:

```javascript
const store = new InMemoryVectorStore(mrl, { defaultDim: 128 });

// Get all documents
const allDocs = store.getAllDocuments();

// Get specific document
const doc = store.getDocument('doc-id');

// Update document (re-embeds automatically)
await store.updateDocument('doc-id', 'New text content', { updated: true });

// Delete document
store.deleteDocument('doc-id');

// Clear all
store.clear();
```

### Streaming Support

The `generateWithRAG` function now returns the prompt for streaming:

```javascript
const result = await generateWithRAG({ retriever, modelClient, model, query });
// result.prompt is now available for streaming
// result.response contains the generated text
// result.docs contains retrieved documents

// Use with streaming in React
await run(query, { 
  stream: true, 
  onDelta: (chunk, fullText) => {
    console.log('Received chunk:', chunk);
  } 
});
```

### Performance Improvements

Batch embedding is now 5x faster:

```javascript
// Before: sequential (slow)
// Now: parallel with Promise.all (fast!)
await store.addDocuments(docs, { dim: 128 }); // All docs embedded in parallel
```

## 📚 Examples

Check out the [example folder](./example) for complete demos:

- `all-features-demo.js` - Complete showcase of all v0.6.0 features
- `topk-example.js` - Dynamic topK parameter usage
- `crud-example.js` - VectorStore CRUD operations
- `batch-embedding-example.js` - Performance comparison
- `streaming-example.js` - Streaming support

Run any example:
```bash
node example/all-features-demo.js
```

## Browser & CORS

Direct calls from the browser to Ollama (e.g., `http://localhost:11434/api`) are blocked by CORS. You must use a proxy:

- Preferred: App server proxy (Next.js API routes or Express):
  - Text generation: `POST /api/rag-generate`
  - Embeddings: `POST /api/embed`
- Alternative: Reverse proxy (Nginx/Caddy) adding permissive CORS headers in front of Ollama.
- SSR option: Run the whole RAG pipeline on the server and send only the answer to the client.

Client setup with proxy for embeddings as well:

```jsx
useEffect(() => {
  initRAG(docs, {
    baseEmbeddingOptions: {
      useBrowser: true,      // use browser-friendly embedding via fetch
      baseUrl: '/api/embed', // your proxy endpoint
      model: 'nomic-embed-text'
    }
  }).then(setCore);
}, []);
```

## Framework Guides

### Vite (React)

- Backend proxy (project root): create `server.js` and add:

```javascript
import express from 'express';
import { OllamaClient } from 'js-rag-local-llm';
const app = express(); app.use(express.json());

app.post('/api/rag-generate', async (req, res) => {
  try {
    const { model, prompt } = req.body || {};
    const client = new OllamaClient({ baseUrl: process.env.OLLAMA_HOST || 'http://localhost:11434/api' });
    const raw = await client.generate(model || 'granite4:tiny-h', prompt);
    let text = '';
    if (typeof raw === 'string') {
      for (const line of raw.split(/\r?\n/)) { try { const obj = JSON.parse(line.trim()); text += obj.response || ''; } catch {} }
    } else if (raw?.response) text = String(raw.response); else text = String(raw);
    res.json({ response: text.trim() });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post('/api/embed', async (req, res) => {
  try {
    const { model = 'embeddinggemma', input } = req.body || {};
    const client = new OllamaClient({ baseUrl: process.env.OLLAMA_HOST || 'http://localhost:11434/api' });
    const resp = await client.embed(model, input);
    res.json(resp);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.listen(process.env.PORT || 3001, () => console.log('API proxy http://localhost:3001'));
```

- Vite proxy (`vite.config.js`):

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': { target: 'http://127.0.0.1:3001', changeOrigin: true } } }
});
```

- App setup (client):

```jsx
useEffect(() => {
  initRAG(docs, {
    baseEmbeddingOptions: { useBrowser: true, baseUrl: '/api/embed', model: 'nomic-embed-text' }
  }).then(setCore);
}, []);
```

### Next.js

- Pages Router: create `pages/api/rag-generate.js` and `pages/api/embed.js`.

```javascript
// pages/api/rag-generate.js
import { OllamaClient } from 'js-rag-local-llm';
export default async function handler(req, res) {
  try {
    const { model, prompt } = req.body || {};
    const client = new OllamaClient({ baseUrl: process.env.OLLAMA_HOST || 'http://localhost:11434/api' });
    const raw = await client.generate(model || 'granite4:tiny-h', prompt);
    let text = '';
    if (typeof raw === 'string') {
      for (const line of raw.split(/\r?\n/)) { try { const obj = JSON.parse(line.trim()); text += obj.response || ''; } catch {} }
    } else if (raw?.response) text = String(raw.response); else text = String(raw);
    res.status(200).json({ response: text.trim() });
  } catch (e) { res.status(500).json({ error: String(e) }); }
}
```

```javascript
// pages/api/embed.js
import { OllamaClient } from 'js-rag-local-llm';
export default async function handler(req, res) {
  try {
    const { model = 'embeddinggemma', input } = req.body || {};
    const client = new OllamaClient({ baseUrl: process.env.OLLAMA_HOST || 'http://localhost:11434/api' });
    const resp = await client.embed(model, input);
    res.status(200).json(resp);
  } catch (e) { res.status(500).json({ error: String(e) }); }
}
```

- App.jsx usage aynı: `initRAG(..., { baseEmbeddingOptions: { useBrowser: true, baseUrl: '/api/embed' } })`.

Note on dependencies

- This library intentionally does not depend on `express` or `concurrently`. Those are app‑level choices handled by the starter (`npm create rag-local-app`) or by your project setup. 

## Streaming

Server (Express) streaming route (NDJSON lines with `{ response: "..." }`):

```javascript
// /api/rag-generate-stream
import express from 'express';
import { OllamaClient } from 'js-rag-local-llm';
const app = express(); app.use(express.json());

app.post('/api/rag-generate-stream', async (req, res) => {
  res.setHeader('Content-Type', 'application/x-ndjson');
  res.setHeader('Transfer-Encoding', 'chunked');
  const { model, prompt } = req.body || {};
  const client = new OllamaClient({ baseUrl: process.env.OLLAMA_HOST || 'http://localhost:11434/api' });
  const raw = await client.generate(model || 'granite4:tiny-h', prompt);
  const writeChunk = (text) => res.write(JSON.stringify({ response: text }) + '\n');
  if (typeof raw === 'string') {
    for (const line of raw.split(/\r?\n/)) {
      try { const obj = JSON.parse(line.trim()); if (obj.response) writeChunk(obj.response); } catch { writeChunk(line); }
    }
    return res.end();
  }
  writeChunk(String(raw?.response || raw));
  res.end();
});
```

Client usage:

```jsx
const { run, response } = useRAG({ retriever, modelClient: createBrowserModelClient({ endpoint: '/api/rag-generate-stream' }), model });
// Stream by passing { stream: true }
await run(query, { stream: true, onDelta: (delta, full) => {/* optional */} });
```

## Troubleshooting (Quick)

- Blank page or `node:fs` error in browser: use the package root import and ensure browser entry is selected automatically (update to latest). Do not import `OllamaClient` in the browser.
- 404 `/api/embed`: add the endpoint in your proxy (Express/Next) or fix the Vite proxy path.
- 500 from `/api/*`: check proxy logs; ensure Ollama is running and models are pulled (`granite4:tiny-h`, `embeddinggemma`).
- ECONNREFUSED to `::1:3001`: pin Vite proxy target to `http://127.0.0.1:3001` and run the proxy server.

## Embeddings

Use Ollama embeddings directly with MRL and the in-memory store:

```javascript
import { createOllamaEmbedding, createMRL, InMemoryVectorStore } from 'js-rag-local-llm';

// You can pick the embedding model (default is 'embeddinggemma')
const baseEmbedding = createOllamaEmbedding({ model: 'nomic-embed-text' });
const mrl = createMRL(baseEmbedding, 768); // base dim of the upstream model

const store = new InMemoryVectorStore(mrl, { defaultDim: 128 });
await store.addDocuments([
  { id: '1', text: 'React is a JavaScript library.' },
  { id: '2', text: 'Ollama runs LLMs locally.' }
], { dim: 128 });

const results = await store.similaritySearch('What is React?', 2, 128);
// results -> [{ id, text, score }, ...]
```