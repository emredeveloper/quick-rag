# Quick RAG ⚡

[![npm version](https://img.shields.io/npm/v/quick-rag.svg)](https://www.npmjs.com/package/quick-rag)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

🚀 **Lightning-fast RAG (Retrieval-Augmented Generation) for JavaScript & React**  
Built on official [Ollama](https://github.com/ollama/ollama-js) & [LM Studio](https://github.com/lmstudio-ai/lmstudio-js) SDKs.

## ✨ Features

- 🎯 **Official SDKs** - Built on `ollama` and `@lmstudio/sdk` packages
- ⚡ **5x Faster** - Parallel batch embedding
- 📚 **CRUD Operations** - Add, update, delete documents on the fly
- 🎯 **Smart Retrieval** - Dynamic topK parameter
- 🌊 **Streaming Support** - Real-time AI responses (official SDK feature)
- 🔧 **Zero Config** - Works with React, Next.js, Vite, Node.js
- 🎨 **Multiple Providers** - Ollama & LM Studio support
- �️ **All SDK Features** - Tool calling, vision, agents, and more
- �💪 **Type Safe** - Full TypeScript support

## 📦 Installation

```bash
npm install quick-rag
```

**This package includes:**
- ✅ Official `ollama` SDK (0.6.2+)
- ✅ Official `@lmstudio/sdk` (1.5.0+)
- ✅ RAG components (vector store, retrieval, embeddings)

**Prerequisites:**
- [Ollama](https://ollama.ai) installed and running, OR
- [LM Studio](https://lmstudio.ai) installed with server enabled
- Models pulled: `ollama pull granite4:tiny-h` and `ollama pull embeddinggemma`

> **✨ New in v0.7.0:** Now built on official SDKs! Get streaming, tool calling, vision, and all official features from `ollama` and `@lmstudio/sdk` packages.

---

## 🚀 Quick Start

### Option 1: With Official Ollama SDK (Recommended)

```javascript
import { 
  OllamaRAGClient, 
  createOllamaRAGEmbedding,
  InMemoryVectorStore, 
  Retriever 
} from 'quick-rag';

// 1. Initialize client (official SDK)
const client = new OllamaRAGClient({
  host: 'http://127.0.0.1:11434'
});

// 2. Setup embedding
const embed = createOllamaRAGEmbedding(client, 'embeddinggemma');

// 3. Create vector store
const vectorStore = new InMemoryVectorStore(embed);
const retriever = new Retriever(vectorStore);

// 4. Add documents
await vectorStore.addDocument({ 
  text: 'Ollama provides local LLM hosting.' 
});

// 5. Query with streaming (official SDK feature!)
const results = await retriever.getRelevant('What is Ollama?', 2);
const context = results.map(d => d.text).join('\n');

const response = await client.chat({
  model: 'granite4:tiny-h',
  messages: [{ 
    role: 'user', 
    content: `Context: ${context}\n\nQuestion: What is Ollama?` 
  }],
  stream: true, // Official SDK streaming!
});

// Stream response
for await (const part of response) {
  process.stdout.write(part.message?.content || '');
}
```

---

### Option 2: React with Vite

**Step 1:** Create your project

```bash
npm create vite@latest my-rag-app -- --template react
cd my-rag-app
npm install quick-rag express concurrently
```

**Step 2:** Create backend proxy (`server.js` in project root)

```javascript
import express from 'express';
import { OllamaRAGClient } from 'quick-rag';

const app = express();
app.use(express.json());

const client = new OllamaRAGClient({ host: 'http://127.0.0.1:11434' });

app.post('/api/generate', async (req, res) => {
  const { model = 'granite4:tiny-h', messages } = req.body;
  const response = await client.chat({ model, messages, stream: false });
  res.json({ response: response.message.content });
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
import { useRAG, initRAG, createBrowserModelClient } from 'quick-rag';

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
import { OllamaClient } from 'quick-rag';

export default async function handler(req, res) {
  const client = new OllamaClient();
  const { model = 'granite4:tiny-h', prompt } = req.body;
  const response = await client.generate(model, prompt);
  res.json({ response });
}
```

```javascript
// pages/api/embed.js
import { OllamaClient } from 'quick-rag';

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

**Simple approach with official Ollama SDK:**

```javascript
import { 
  OllamaRAGClient, 
  createOllamaRAGEmbedding, 
  InMemoryVectorStore, 
  Retriever 
} from 'quick-rag';

// 1. Initialize client
const client = new OllamaRAGClient();

// 2. Setup embedding
const embed = createOllamaRAGEmbedding(client, 'embeddinggemma');

// 3. Create vector store and retriever
const vectorStore = new InMemoryVectorStore(embed);
const retriever = new Retriever(vectorStore);

// 4. Add documents
await vectorStore.addDocuments([
  { text: 'JavaScript is a programming language.' },
  { text: 'Python is great for data science.' },
  { text: 'Rust is a systems programming language.' }
]);

// 5. Query
const query = 'What is JavaScript?';
const results = await retriever.getRelevant(query, 2);

// 6. Generate answer
const context = results.map(d => d.text).join('\n');
const response = await client.chat({
  model: 'granite4:tiny-h',
  messages: [{ 
    role: 'user', 
    content: `Context:\n${context}\n\nQuestion: ${query}\n\nAnswer:` 
  }]
});

// Clean output
console.log('📚 Retrieved:', results.map(d => d.text));
console.log('🤖 Answer:', response.message.content);
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

---

### Option 4: LM Studio 🎨

Use LM Studio instead of Ollama with OpenAI-compatible API:

```javascript
import { 
  LMStudioRAGClient, 
  createLMStudioRAGEmbedding, 
  InMemoryVectorStore, 
  Retriever, 
  generateWithRAG 
} from 'quick-rag';

// 1. Initialize LM Studio client
const client = new LMStudioRAGClient();

// 2. Setup embedding (use your embedding model from LM Studio)
const embed = createLMStudioRAGEmbedding(client, 'nomic-embed-text-v1.5');

// 3. Create vector store and retriever
const vectorStore = new InMemoryVectorStore(embed);
const retriever = new Retriever(vectorStore);

// 4. Add documents
await vectorStore.addDocuments([
  { text: 'LM Studio is a desktop app for running LLMs locally.' },
  { text: 'It provides an OpenAI-compatible API.' },
  { text: 'You can use models like Llama, Mistral, and more.' }
]);

// 5. Query with RAG
const results = await retriever.getRelevant('What is LM Studio?', 2);
const answer = await generateWithRAG(
  client,
  'qwen/qwen3-4b-2507', // or your model name
  'What is LM Studio?',
  results
);

console.log('Answer:', answer);
```

**Prerequisites for LM Studio:**

1. Download and install [LM Studio](https://lmstudio.ai)
2. Download a language model (e.g., Llama 3.2, Mistral)
3. Download an embedding model (e.g., nomic-embed-text)
4. Start the local server: `Developer > Local Server` (default: `http://localhost:1234`)

**For React projects:** Import from `'quick-rag/react'` to use hooks:

```javascript
import { useRAG } from 'quick-rag/react';
// or
import { useRAG } from 'quick-rag'; // Also works in React projects
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
| 📦 **Module not found** | Check imports: use `'quick-rag'` not `'quick-rag/...'` |

> **Note:** v0.6.5+ automatically detects and uses the correct API (generate or chat) for any model.

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
