# 🚀 Quick RAG - React Project Setup Guide

This guide is designed for those who want to create a React project from scratch and use the Quick RAG library.

## 📋 Prerequisites

1. **Node.js 18+** must be installed
2. **Ollama** must be installed and running
3. **Required models** must be pulled

## 🎯 Step-by-Step Setup

### Step 1: Create React Project

```bash
npm create vite@latest my-rag-app -- --template react
cd my-rag-app
npm install
```

### Step 2: Install Quick RAG and Dependencies

```bash
npm install quick-rag express concurrently multer
npm install --save-dev concurrently
```

**Note:** The `quick-rag` package (v2.0.3+) automatically installs `ollama` and `@lmstudio/sdk` packages.

### Step 3: Install Ollama and Pull Models

**Ollama Installation:**
- Download and install from [ollama.ai](https://ollama.ai)
- Check in terminal: `ollama --version`

**Pull Required Models:**
```bash
# LLM model (for Q&A)
ollama pull granite4:3b

# Embedding model (for document search)
ollama pull embeddinggemma:latest
```

**Verify Ollama is Running:**
```bash
# Start Ollama service (if not running)
ollama serve

# List models
ollama list
```

### Step 4: Create Backend Proxy Server

Create a `server.js` file in the project root directory:

```javascript
// server.js
import express from 'express';
import { OllamaRAGClient } from 'quick-rag';
import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS (for development)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

const upload = multer({ dest: 'uploads/' });

// Ollama client
const client = new OllamaRAGClient({ host: 'http://127.0.0.1:11434' });

// Text generation endpoint
app.post('/api/rag-generate', async (req, res) => {
  try {
    const { model = 'granite4:3b', prompt, stream } = req.body;
    
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      const streamResponse = await client.chat({
        model,
        messages: [{ role: 'user', content: prompt }],
        stream: true
      });
      
      for await (const chunk of streamResponse) {
        const content = chunk.message?.content || '';
        if (content) {
          res.write(JSON.stringify({ response: content }) + '\n');
        }
      }
      res.end();
    } else {
      const response = await client.generate({ model, prompt });
      res.json({ response: response.response || response });
    }
  } catch (e) {
    if (!res.headersSent) {
      res.status(500).json({ error: String(e) });
    }
  }
});

// Embedding endpoint
app.post('/api/embed', async (req, res) => {
  try {
    const { model = 'embeddinggemma', input } = req.body;
    const resp = await client.embed(model, input);
    res.json(resp);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// File upload endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { loadDocument } = await import('quick-rag');
    const result = await loadDocument(req.file.path);
    
    // Cleanup
    await fs.unlink(req.file.path).catch(() => {});
    
    res.json({
      success: true,
      text: result.text,
      filename: req.file.originalname,
      meta: result.meta
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Create uploads directory
(async () => {
  await fs.mkdir('uploads', { recursive: true }).catch(() => {});
})();

app.listen(3001, () => console.log('🚀 Backend Server: http://127.0.0.1:3001'));
```

### Step 5: Vite Proxy Configuration

Update the `vite.config.js` file:

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
  },
  optimizeDeps: {
    exclude: ['quick-rag']
  },
  resolve: {
    dedupe: ['react', 'react-dom']
  }
});
```

### Step 6: Update Package.json Scripts

Update the `scripts` section in `package.json`:

```json
{
  "scripts": {
    "dev": "concurrently \"npm:dev:server\" \"npm:dev:client\"",
    "dev:server": "node server.js",
    "dev:client": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### Step 7: Usage in React Component

Update the `src/App.jsx` file:

```jsx
import { useState, useEffect } from 'react';
import { useRAG, initRAG, createBrowserModelClient } from 'quick-rag';

// Example documents
const docs = [
  { id: '1', text: 'React is a JavaScript library for building user interfaces.' },
  { id: '2', text: 'Ollama provides local LLM hosting capabilities.' },
  { id: '3', text: 'RAG combines retrieval with AI generation.' }
];

export default function App() {
  const [rag, setRAG] = useState(null);
  const [query, setQuery] = useState('');
  const [isReady, setIsReady] = useState(false);
  
  const { run, loading, response, docs: results, error } = useRAG({
    retriever: rag?.retriever,
    modelClient: createBrowserModelClient({ endpoint: '/api/rag-generate' }),
    model: 'granite4:3b'
  });

  // Initialize RAG system
  useEffect(() => {
    initRAG(docs, {
      baseEmbeddingOptions: {
        useBrowser: true,
        baseUrl: '/api/embed',
        model: 'embeddinggemma'
      }
    }).then(core => {
      setRAG(core);
      setIsReady(true);
    }).catch(err => {
      console.error('RAG initialization failed:', err);
    });
  }, []);

  const handleAsk = async () => {
    if (!query.trim() || loading) return;
    await run(query);
  };

  return (
    <div style={{ padding: 40, maxWidth: 800, margin: '0 auto' }}>
      <h1>🤖 Quick RAG Demo</h1>
      
      {!isReady && (
        <p>⏳ Initializing RAG system...</p>
      )}
      
      {isReady && (
        <>
          <div style={{ marginBottom: 20 }}>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAsk()}
              placeholder="Type your question..."
              style={{ 
                width: '100%', 
                padding: 12, 
                fontSize: 16,
                borderRadius: 8,
                border: '1px solid #ccc'
              }}
            />
            <button
              onClick={handleAsk}
              disabled={loading || !query.trim()}
              style={{
                marginTop: 10,
                padding: '12px 24px',
                fontSize: 16,
                borderRadius: 8,
                border: 'none',
                background: loading ? '#ccc' : '#007bff',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? '⏳ Thinking...' : '🚀 Ask'}
            </button>
          </div>
          
          {error && (
            <div style={{ 
              padding: 12, 
              background: '#fee', 
              borderRadius: 8,
              marginBottom: 20
            }}>
              ❌ Error: {String(error)}
            </div>
          )}
          
          {results && results.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h3>📚 Found Documents ({results.length}):</h3>
              {results.map((doc, i) => (
                <div key={i} style={{ 
                  padding: 10, 
                  marginBottom: 8,
                  background: '#f5f5f5',
                  borderRadius: 6
                }}>
                  <strong>#{i + 1}</strong> (Score: {(doc.score * 100).toFixed(1)}%)<br/>
                  {doc.text}
                </div>
              ))}
            </div>
          )}
          
          {response && (
            <div style={{ 
              padding: 20, 
              background: '#e8f5e9',
              borderRadius: 8
            }}>
              <h3>✨ Answer:</h3>
              <p style={{ whiteSpace: 'pre-wrap' }}>{response}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

### Step 8: Run the Application

```bash
npm run dev
```

This command:
- ✅ Starts the backend server (`http://127.0.0.1:3001`)
- ✅ Starts the frontend dev server (`http://localhost:5173`)

Open `http://localhost:5173` in your browser and start using it! 🎉

## 🔧 Troubleshooting

### "Cannot find package 'ollama'" Error

```bash
# Clean and reinstall node_modules
rm -rf node_modules package-lock.json
npm install
```

On Windows:
```bash
rmdir /s /q node_modules
del package-lock.json
npm install
```

### "Connection refused" Error

- Make sure Ollama is running: `ollama serve`
- Check that models are installed: `ollama list`
- Verify port 11434 is open

### Backend Not Working

- Make sure port 3001 is free
- Check that `server.js` is in the project root directory
- Check error messages in the terminal

### Frontend Errors

- Make sure Vite config is correct
- Check error messages in the browser console
- Verify that `/api/embed` and `/api/rag-generate` endpoints are working

## 📚 More Information

- **Full Documentation:** [README.md](../README.md)
- **Examples:** [quickstart/](../quickstart/) folder
- **API Reference:** API Reference section in README.md

## ✅ Checklist

When setup is complete, check the following:

- [ ] Node.js 18+ installed
- [ ] Ollama installed and running
- [ ] `granite4:3b` model pulled
- [ ] `embeddinggemma:latest` model pulled
- [ ] `quick-rag` package installed
- [ ] Backend server running (port 3001)
- [ ] Frontend dev server running (port 5173)
- [ ] Application opens in browser
- [ ] You get answers when asking questions

## 🎉 Success!

You can now use the Quick RAG library in your React project!

**Next Steps:**
- Add document upload features
- Enable streaming responses
- Use metadata filtering
- Perform smart search with Decision Engine
- Use batch processing for large PDFs (v2.0.3+)

## ⚡ Performance Tips (v2.0.3+)

### Batch Processing for Large Documents

Use batch processing when uploading large PDFs:

```javascript
import { chunkDocuments } from 'quick-rag';

// Split large PDF into chunks
const chunks = chunkDocuments([largePDF], { 
  chunkSize: 1000, 
  overlap: 100 
});

// Add with batch processing
await store.addDocuments(chunks, {
  batchSize: 20,        // 20 chunks/batch (adjustable)
  maxConcurrent: 5,     // Max 5 concurrent requests
  onProgress: (current, total) => {
    console.log(`Progress: ${current}/${total} (${Math.round(current/total*100)}%)`);
  }
});
```

### Rate Limiting Settings

- **Small documents (< 100 chunks)**: `batchSize: 10, maxConcurrent: 5`
- **Medium documents (100-1000 chunks)**: `batchSize: 20, maxConcurrent: 5`
- **Large documents (> 1000 chunks)**: `batchSize: 30, maxConcurrent: 3`

For more examples, check the `quickstart/` folder!

## 💾 Persistence in React

**Important:** The new SQLite persistence feature (`SQLiteVectorStore`) works **ONLY** in Node.js environments (like your backend server in `server.js`). It does **NOT** work directly in the browser.

For browser-side storage, use `InMemoryVectorStore` (default) or implement a custom store using IndexedDB.

If you need persistence in your React app:
1. Use `SQLiteVectorStore` in your **backend** (`server.js`).
2. Expose API endpoints (`/api/search`, `/api/add-doc`) to your frontend.
3. The frontend calls these endpoints instead of using the vector store directly.
