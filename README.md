# js-rag-local-llm

[![npm version](https://img.shields.io/npm/v/js-rag-local-llm.svg)](https://www.npmjs.com/package/js-rag-local-llm)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

🚀 **Simple, fast RAG (Retrieval-Augmented Generation) for JavaScript & React**  
Use local Ollama AI models in your apps with just a few lines of code.

## ✨ Features

- ⚡ **5x Faster** - Parallel batch embedding
- 📚 **CRUD Operations** - Add, update, delete documents on the fly
- 🎯 **Smart Retrieval** - Dynamic topK parameter
- 🌊 **Streaming Support** - Real-time AI responses
- 🔧 **Zero Config** - Works with React, Next.js, Vite, Node.js
- 💪 **Type Safe** - Full TypeScript support

## 📦 Installation

```bash
npm install js-rag-local-llm
```

**Prerequisites:**
- [Ollama](https://ollama.ai) installed and running
- Models pulled: `ollama pull granite4:tiny-h` and `ollama pull embeddinggemma`

---

## 🚀 Quick Start

### Option 1: React with Vite (Recommended)

**Step 1:** Create your project

```bash
npm create vite@latest my-rag-app -- --template react
cd my-rag-app
npm install js-rag-local-llm express concurrently
```

**Step 2:** Create backend proxy (`server.js` in project root)

```javascript
import express from 'express';
import { OllamaClient } from 'js-rag-local-llm';

const app = express();
app.use(express.json());

const client = new OllamaClient({ baseUrl: 'http://127.0.0.1:11434/api' });

app.post('/api/generate', async (req, res) => {
  const { model = 'granite4:tiny-h', prompt } = req.body;
  const response = await client.generate(model, prompt);
  res.json({ response });
});

app.post('/api/embed', async (req, res) => {
  const { model = 'embeddinggemma', input } = req.body;
  const response = await client.embed(model, input);
  res.json(response);
});

app.listen(3001, () => console.log('🚀 Server: http://127.0.0.1:3001'));
```

**Step 3:** Configure Vite proxy (`vite.config.js`)

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true
      }
    }
  }
});
```

**Step 4:** Update `package.json` scripts

```json
{
  "scripts": {
    "dev": "concurrently \"npm:server\" \"npm:client\"",
    "server": "node server.js",
    "client": "vite"
  }
}
```

**Step 5:** Use in your React component (`src/App.jsx`)

```jsx
import { useState, useEffect } from 'react';
import { useRAG, initRAG, createBrowserModelClient } from 'js-rag-local-llm';

const docs = [
  { id: '1', text: 'React is a JavaScript library for building user interfaces.' },
  { id: '2', text: 'Ollama provides local LLM hosting.' },
  { id: '3', text: 'RAG combines retrieval with AI generation.' }
];

export default function App() {
  const [rag, setRAG] = useState(null);
  const [query, setQuery] = useState('');
  
  const { run, loading, response, docs: results } = useRAG({
    retriever: rag?.retriever,
    modelClient: createBrowserModelClient(),
    model: 'granite4:tiny-h'
  });

  useEffect(() => {
    initRAG(docs, {
      baseEmbeddingOptions: {
        useBrowser: true,
        baseUrl: '/api/embed',
        model: 'embeddinggemma'
      }
    }).then(core => setRAG(core));
  }, []);

  return (
    <div style={{ padding: 40 }}>
      <h1>🤖 RAG Demo</h1>
      <input 
        value={query} 
        onChange={e => setQuery(e.target.value)}
        placeholder="Ask something..."
        style={{ width: 300, padding: 10 }}
      />
      <button onClick={() => run(query)} disabled={loading}>
        {loading ? 'Thinking...' : 'Ask AI'}
      </button>
      
      {results && (
        <div>
          <h3>📚 Retrieved:</h3>
          {results.map(d => <p key={d.id}>{d.text}</p>)}
        </div>
      )}
      
      {response && (
        <div>
          <h3>✨ Answer:</h3>
          <p>{response}</p>
        </div>
      )}
    </div>
  );
}
```

**Step 6:** Run your app

```bash
npm run dev
```

Open `http://localhost:5173` 🎉

---

### Option 2: Next.js (Pages Router)

**Step 1:** Create API routes

```javascript
// pages/api/generate.js
import { OllamaClient } from 'js-rag-local-llm';

export default async function handler(req, res) {
  const client = new OllamaClient();
  const { model = 'granite4:tiny-h', prompt } = req.body;
  const response = await client.generate(model, prompt);
  res.json({ response });
}
```

```javascript
// pages/api/embed.js
import { OllamaClient } from 'js-rag-local-llm';

export default async function handler(req, res) {
  const client = new OllamaClient();
  const { model = 'embeddinggemma', input } = req.body;
  const response = await client.embed(model, input);
  res.json(response);
}
```

**Step 2:** Use in your page (same React component as above)

---

### Option 3: Vanilla JavaScript (Node.js)

```javascript
import { createOllamaEmbedding, createMRL, InMemoryVectorStore, Retriever, generateWithRAG, OllamaClient } from 'js-rag-local-llm';

// Setup
const embedding = createOllamaEmbedding({ model: 'embeddinggemma' });
const mrl = createMRL(embedding, 768);
const store = new InMemoryVectorStore(mrl, { defaultDim: 128 });

// Add documents
await store.addDocuments([
  { id: '1', text: 'JavaScript is a programming language.' },
  { id: '2', text: 'Python is great for data science.' },
  { id: '3', text: 'Rust is a systems programming language.' }
], { dim: 128 });

// Create retriever
const retriever = new Retriever(store, { k: 2 });

// Ask a question
const result = await generateWithRAG({
  retriever,
  modelClient: new OllamaClient(),
  model: 'granite4:tiny-h',
  query: 'What is JavaScript?',
  topK: 2
});

// Clean output
console.log('📚 Retrieved:', result.docs.map(d => d.text));
console.log('🤖 Answer:', result.response);
```

**Output:**
```
📚 Retrieved: [
  'JavaScript is a programming language.',
  'Python is great for data science.'
]
🤖 Answer: JavaScript is a programming language that allows developers 
to write code and implement functionality in web browsers...
```

**For React projects:** Import from `'js-rag-local-llm/react'` to use hooks:

```javascript
import { useRAG } from 'js-rag-local-llm/react';
// or
import { useRAG } from 'js-rag-local-llm'; // Also works in React projects
```

---

## 📖 API Reference

### React Hook: `useRAG`

```javascript
const { run, loading, response, docs, streaming, error } = useRAG({
  retriever,        // Retriever instance
  modelClient,      // Model client (OllamaClient or BrowserModelClient)
  model            // Model name (e.g., 'granite4:tiny-h')
});

// Ask a question
await run('What is React?');

// With options
await run('What is React?', {
  topK: 5,           // Number of documents to retrieve
  stream: true,      // Enable streaming
  onDelta: (chunk, fullText) => console.log(chunk)
});
```

### Core Functions

**Initialize RAG**

```javascript
const { retriever, store, mrl } = await initRAG(documents, {
  defaultDim: 128,              // Embedding dimension
  k: 2,                         // Default number of results
  mrlBaseDim: 768,             // Base embedding dimension
  baseEmbeddingOptions: {
    useBrowser: true,           // Use browser-safe fetch
    baseUrl: '/api/embed',      // Embedding endpoint
    model: 'embeddinggemma'    // Embedding model
  }
});
```

**Generate with RAG**

```javascript
const result = await generateWithRAG({
  retriever,
  modelClient,
  model,
  query: 'Your question',
  topK: 3              // Optional: override default k
});

// Returns: { docs, response, prompt }
```

### VectorStore API

```javascript
const store = new InMemoryVectorStore(embeddingFn, { defaultDim: 128 });

// Add documents
await store.addDocument({ id: '1', text: 'Document text' });
await store.addDocuments([{ id: '1', text: '...' }], { dim: 128 });

// Query
const results = await store.similaritySearch('query', k, queryDim);

// CRUD
const doc = store.getDocument('id');
const all = store.getAllDocuments();
await store.updateDocument('id', 'new text', { meta: 'data' });
store.deleteDocument('id');
store.clear();
```

### Model Clients

**Browser (with proxy)**

```javascript
const client = createBrowserModelClient({
  endpoint: '/api/generate'  // Your proxy endpoint
});
```

**Node.js (direct)**

```javascript
const client = new OllamaClient({
  baseUrl: 'http://127.0.0.1:11434/api'
});
```

---

## 💡 Examples

### CRUD Operations

```javascript
// Add document dynamically
await store.addDocument({ 
  id: 'new-doc', 
  text: 'TypeScript adds types to JavaScript.' 
});

// Update existing
await store.updateDocument('1', 'React 19 is the latest version.', {
  version: '19',
  updated: Date.now()
});

// Delete
store.deleteDocument('2');

// Query all
const allDocs = store.getAllDocuments();
console.log(`Total documents: ${allDocs.length}`);
```

### Dynamic Retrieval

```javascript
// Ask with different topK values
const result1 = await run('What is JavaScript?', { topK: 1 }); // Get 1 doc
const result2 = await run('What is JavaScript?', { topK: 5 }); // Get 5 docs
```

### Streaming Responses

```javascript
await run('Explain React hooks', {
  stream: true,
  onDelta: (chunk, fullText) => {
    console.log('New chunk:', chunk);
    // Update UI in real-time
  }
});
```

### Custom Embedding Models

```javascript
// Use different embedding models
const rag = await initRAG(docs, {
  baseEmbeddingOptions: {
    useBrowser: true,
    baseUrl: '/api/embed',
    model: 'nomic-embed-text'  // or 'mxbai-embed-large', etc.
  }
});
```

**More examples:** Check the [`example/`](./example) folder for complete demos.

---

## ❓ Troubleshooting

| Problem | Solution |
|---------|----------|
| 🚫 **CORS errors** | Use a proxy server (Express/Next.js API routes) |
| 🔌 **Connection refused** | Ensure Ollama is running: `ollama serve` |
| 📦 **Models not found** | Pull models: `ollama pull granite4:tiny-h && ollama pull embeddinggemma` |
| 🌐 **404 on `/api/embed`** | Check your proxy configuration in `vite.config.js` or API routes |
| 💻 **Windows IPv6 issues** | Use `127.0.0.1` instead of `localhost` |
| 📦 **Module not found** | Check imports: use `'js-rag-local-llm'` not `'js-rag-local-llm/...'` |

---

## 📚 Learn More

- **Examples:** [`/example`](./example) folder with working demos
- **Changelog:** [`CHANGELOG.md`](./CHANGELOG.md) - version history
- **Ollama Models:** [ollama.ai/library](https://ollama.ai/library)
- **Issues:** [GitHub Issues](https://github.com/emredeveloper/rag-js-local/issues)

---

## 📄 License

MIT © [Emre Developer](https://github.com/emredeveloper)

---

**Made with ❤️ for the JavaScript & AI community**
