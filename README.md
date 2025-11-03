# RAG Ollama JS (starter)

Minimal RAG utilities for React apps using local Ollama models.

## Installation

```bash
npm install js-rag-local-llm
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
  const [{ retriever }, setCore] = useState({});
  const [query, setQuery] = useState('');
  const { run, loading, error, response, docs: retrieved } = useRAG({
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
      <button onClick={() => run(query)} disabled={loading || !retriever}>Ask</button>
      {error && <div style={{color:'red'}}>Error: {String(error)}</div>}
      {!!retrieved?.length && <ul>{retrieved.map(d => <li key={d.id}>[{d.id}] {d.text}</li>)}</ul>}
      {response && <pre>{response}</pre>}
    </div>
  );
}
```

Notes:
- Default model: `granite4:tiny-h`, default embedding model: `embeddinggemma`.
- Adjust `OllamaClient({ baseUrl: 'http://localhost:11434/api' })` if needed.

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