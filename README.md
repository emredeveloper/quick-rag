# Quick RAG ⚡

[![npm version](https://img.shields.io/npm/v/quick-rag.svg)](https://www.npmjs.com/package/quick-rag)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

🚀 **Production-ready RAG (Retrieval-Augmented Generation) for JavaScript & React**  
Built on official [Ollama](https://github.com/ollama/ollama-js) & [LM Studio](https://github.com/lmstudio-ai/lmstudio-js) SDKs.

> **🎉 v2.1.0 Released!** Embedded SQLite Persistence, Advanced Error Handling, Structured Logging, and Telemetry! See [CHANGELOG.md](CHANGELOG.md) for details.

## ✨ Features

- 🎯 **Official SDKs** - Built on `ollama` and `@lmstudio/sdk` packages
- 💾 **Embedded Persistence** - SQLite-based vector store (No server required!) (NEW!)
- 🛡️ **Robust Error Handling** - 7 custom error classes with recovery suggestions (NEW!)
- 📊 **Telemetry & Metrics** - Track performance, latency, and usage (NEW!)
- 📝 **Structured Logging** - JSON logging with Pino integration (NEW!)
- ⚡ **5x Faster** - Parallel batch embedding
- 📄 **Document Loaders** - PDF, Word, Excel, Text, Markdown, URLs
- 🔪 **Smart Chunking** - Intelligent text splitting with overlap
- 🏷️ **Metadata Filtering** - Filter by document properties
- 🔍 **Query Explainability** - See WHY documents were retrieved (unique!)
- 🎨 **Dynamic Prompts** - 10 built-in templates + full customization
- 🧠 **Weighted Decision Making** - Multi-criteria document scoring
- 🎯 **Heuristic Reasoning** - Pattern learning and query optimization
- 🔄 **CRUD Operations** - Add, update, delete documents on the fly
- 🌊 **Streaming Support** - Real-time AI responses
- 🔧 **Zero Config** - Works with React, Next.js, Vite, Node.js
- 💪 **Type Safe** - Full TypeScript support

## 📦 Installation

```bash
npm install quick-rag
```

**Optional Dependencies:**
```bash
# For embedded persistence
npm install better-sqlite3

# For logging
npm install pino pino-pretty
```

## 🆕 What's New in v2.1.0

### 💾 Embedded Persistence (SQLite)
Store your vectors locally without setting up a complex database server!
- **Zero Setup:** Just provide a file path (`./rag.db`)
- **Fast:** Built on `better-sqlite3`
- **Full Features:** Batch insert, metadata filtering, CRUD

### 🛡️ Advanced Error Handling
Never crash without knowing why. New error system provides:
- **Specific Error Types:** `RAGError`, `EmbeddingError`, `RetrievalError`, etc.
- **Error Codes:** Programmatic handling
- **Recovery Hints:** Actionable suggestions in error messages

### 📊 Metrics & Logging
Monitor your RAG pipeline in production:
- **Performance Tracking:** Embedding time, search latency, generation speed
- **Structured Logs:** JSON format for easy parsing
- **Prometheus Support:** Export metrics for monitoring dashboards
Advanced filtering with custom logic - filter documents using JavaScript functions:
```javascript
const results = await retriever.getRelevant('latest AI news', 5, {
  filter: (meta) => {
    return meta.year === 2024 && 
           meta.tags.includes('AI') &&
           meta.difficulty !== 'beginner';
  }
});
```

### 📽️ PowerPoint Support
Load .pptx and .ppt files with `officeparser`:
```javascript
import { loadDocument } from 'quick-rag';
const pptDoc = await loadDocument('./presentation.pptx');
```

### 📁 Organized Examples
12 comprehensive examples covering all features:
- Basic Usage (Ollama & LM Studio)
- Document Loading (PDF, Word, Excel)
- Metadata Filtering
- Streaming Responses
- Advanced Filtering
- Query Explainability
- Prompt Management
- Decision Engine (Simple & Real-World)
- Conversation History & Export

---

## 🆕 Previous Features (v1.1.x)

### 📝 Internationalization Update
- Translated all example files to English for better international accessibility
- `example/10-decision-engine-simple.js` - Smart Document Selection example
- `example/11-decision-engine-pdf-real-world.js` - Real-world PDF scenario example

### 🧠 Decision Engine (v1.1.0)

**Revolutionary AI-powered retrieval system** - The most advanced RAG retrieval available!

Quick RAG now includes a **Decision Engine** that goes far beyond simple cosine similarity. It combines:
- 🎯 **Multi-Criteria Weighted Scoring** - 5 factors evaluated together
- 🧠 **Heuristic Reasoning** - Pattern-based query optimization  
- � **Adaptive Learning** - Learns from user feedback
- �🔍 **Full Transparency** - See exactly why each document was selected

#### Multi-Criteria Scoring

**5 weighted factors beyond similarity:**

1. **📊 Semantic Similarity** (50%) - Cosine similarity score
2. **🔤 Keyword Match** (20%) - Term matching in document
3. **📅 Recency** (15%) - Document freshness with exponential decay
4. **⭐ Source Quality** (10%) - Source reliability (official=1.0, research=0.9, blog=0.7, forum=0.6)
5. **🎯 Context Relevance** (5%) - Contextual fit

```javascript
import { SmartRetriever, DEFAULT_WEIGHTS } from 'quick-rag';

// Create smart retriever with default weights
const smartRetriever = new SmartRetriever(basicRetriever);

// Or customize weights for your use case
const smartRetriever = new SmartRetriever(basicRetriever, {
  weights: {
    semanticSimilarity: 0.35,
    keywordMatch: 0.20,
    recency: 0.30,         // Higher for news sites
    sourceQuality: 0.10,
    contextRelevance: 0.05
  }
});

// Get results with decision transparency
const response = await smartRetriever.getRelevant('latest AI news', 3);

// See scoring breakdown for each document
console.log(response.results[0]);
// {
//   text: "...",
//   weightedScore: 0.742,
//   scoreBreakdown: {
//     semanticSimilarity: { score: 0.85, weight: 0.35, contribution: 0.298 },
//     keywordMatch: { score: 0.67, weight: 0.20, contribution: 0.134 },
//     recency: { score: 0.95, weight: 0.30, contribution: 0.285 },
//     sourceQuality: { score: 0.90, weight: 0.10, contribution: 0.090 },
//     contextRelevance: { score: 1.00, weight: 0.05, contribution: 0.050 }
//   }
// }

// Decision context shows WHY these results
console.log(response.decisions);
// {
//   weights: { ... },
//   appliedRules: ["boost-recent-for-news"],
//   suggestions: [
//     "Time-sensitive query detected. Prioritizing recent documents.",
//     "Consider using filters if you need older historical content."
//   ]
// }
```

#### Heuristic Reasoning

**Pattern-based optimization that learns:**

```javascript
// Enable learning mode
const smartRetriever = new SmartRetriever(basicRetriever, {
  enableLearning: true,
  enableHeuristics: true
});

// Add custom rules
smartRetriever.heuristicEngine.addRule(
  'boost-documentation',
  (query, context) => query.includes('documentation'),
  (query, context) => {
    context.adjustWeight('sourceQuality', 0.15);  // Increase quality weight
    return { adjusted: true, reason: 'Documentation query prioritizes quality' };
  },
  5  // Priority
);

// Provide feedback to enable learning
smartRetriever.provideFeedback(query, results, {
  rating: 5,           // 1-5 rating
  hasFilters: true,    // User applied filters
  comment: 'Perfect results!'
});

// System learns successful patterns
const insights = smartRetriever.getInsights();
console.log(insights.heuristics.successfulPatterns);
// ["latest", "documentation", "official release"]

// Export learned knowledge
const knowledge = smartRetriever.exportKnowledge();

// Import to another instance
newRetriever.importKnowledge(knowledge);
```

#### Scenario Customization

**Different weights for different use cases:**

```javascript
// News Platform - Recency Priority
const newsRetriever = new SmartRetriever(basicRetriever, {
  weights: {
    semanticSimilarity: 0.30,
    keywordMatch: 0.20,
    recency: 0.40,         // 🔥 High recency
    sourceQuality: 0.05,
    contextRelevance: 0.05
  }
});

// Documentation Site - Quality Priority  
const docsRetriever = new SmartRetriever(basicRetriever, {
  weights: {
    semanticSimilarity: 0.35,
    keywordMatch: 0.20,
    recency: 0.10,
    sourceQuality: 0.30,   // 🔥 High quality
    contextRelevance: 0.05
  }
});

// Research Platform - Balanced
const researchRetriever = new SmartRetriever(basicRetriever, {
  weights: DEFAULT_WEIGHTS  // Balanced approach
});
```

#### Real-World Example

See `example/11-decision-engine-pdf-real-world.js` for a complete example with:
- PDF document loading
- Multiple source types (official, blog, research, forum)
- 3 different scenarios (news, documentation, research)
- RAG generation with quality metrics
- Decision transparency and explanations

**Benefits:**
- ✅ More accurate retrieval than pure similarity
- ✅ Adapts to different content types automatically
- ✅ Learns from user interactions
- ✅ Fully explainable decisions
- ✅ Customizable for any use case
- ✅ Production-ready with proven patterns

### 🔍 Query Explainability (v1.1.0)
**Understand WHY documents were retrieved** - A first-of-its-kind feature!

```javascript
const results = await retriever.getRelevant('What is Ollama?', 3, {
  explain: true
});

// Each result includes detailed explanation:
console.log(results[0].explanation);
// {
//   queryTerms: ["ollama", "local", "ai"],
//   matchedTerms: ["ollama", "local"],
//   matchCount: 2,
//   matchRatio: 0.67,
//   cosineSimilarity: 0.856,
//   relevanceFactors: {
//     termMatches: 2,
//     semanticSimilarity: 0.856,
//     coverage: "67%"
//   }
// }
```

**Use cases:** Debug searches, optimize queries, validate accuracy, explain to users

### 🎨 Dynamic Prompt Management (v1.1.0)
**10 built-in templates + full customization**

```javascript
// Quick template selection
await generateWithRAG(client, model, query, docs, {
  template: 'conversational'  // or: technical, academic, code, etc.
});

// System prompts for role definition
await generateWithRAG(client, model, query, docs, {
  systemPrompt: 'You are a helpful programming tutor',
  template: 'instructional'
});

// Advanced: Reusable PromptManager
import { createPromptManager } from 'quick-rag';

const promptMgr = createPromptManager({
  systemPrompt: 'You are an expert engineer',
  template: 'technical'
});

await generateWithRAG(client, model, query, docs, {
  promptManager: promptMgr
});
```

**Templates:** `default`, `conversational`, `technical`, `academic`, `code`, `concise`, `detailed`, `qa`, `instructional`, `creative`

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

> **💡 Starting from scratch?** Check out the detailed step-by-step guide in [QUICKSTART_REACT.md](./QUICKSTART_REACT.md)!

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

// Add multiple documents with batch processing (v2.0.3!)
await store.addDocuments([{ id: '1', text: '...' }], { 
  dim: 128,
  batchSize: 20,        // Process 20 chunks at a time
  maxConcurrent: 5,     // Max 5 concurrent requests
  onProgress: (current, total) => {
    console.log(`Progress: ${current}/${total}`);
  }
});

// Query
const results = await store.similaritySearch('query', k, queryDim);

// CRUD
const doc = store.getDocument('id');
const all = store.getAllDocuments();
await store.updateDocument('id', 'new text', { meta: 'data' });
store.deleteDocument('id');
store.clear();
```

**Batch Processing for Large Documents (v2.0.3):**

```javascript
// Process large PDFs efficiently
const chunks = chunkDocuments([largePDF], { chunkSize: 1000, overlap: 100 });

await store.addDocuments(chunks, {
  batchSize: 20,        // Process 20 chunks per batch
  maxConcurrent: 5,     // Max 5 concurrent embedding requests
  onProgress: (current, total) => {
    console.log(`Embedding progress: ${current}/${total} (${Math.round(current/total*100)}%)`);
  }
});
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

// Add multiple documents with batch processing (v2.0.3!)
await store.addDocuments([
  { id: 'doc1', text: 'First document' },
  { id: 'doc2', text: 'Second document' }
], {
  batchSize: 10,        // Process in batches
  maxConcurrent: 5,     // Rate limiting
  onProgress: (current, total) => {
    console.log(`Added ${current}/${total} documents`);
  }
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

## 📄 Document Loaders (v0.7.4+)

Load documents from various formats and use them with RAG!

### Supported Formats

| Format | Function | Requires |
|--------|----------|----------|
| PDF | `loadPDF()` | `npm install pdf-parse` |
| Word (.docx) | `loadWord()` | `npm install mammoth` |
| Excel (.xlsx) | `loadExcel()` | `npm install xlsx` |
| Text (.txt) | `loadText()` | Built-in ✅ |
| JSON | `loadJSON()` | Built-in ✅ |
| Markdown | `loadMarkdown()` | Built-in ✅ |
| Web URLs | `loadURL()` | Built-in ✅ |

### Quick Start

**Load PDF:**
```javascript
import { loadPDF, chunkDocuments } from 'quick-rag';

// Load PDF
const pdf = await loadPDF('./document.pdf');
console.log(`Loaded ${pdf.meta.pages} pages`);

// Chunk and add to RAG
const chunks = chunkDocuments([pdf], { 
  chunkSize: 500, 
  overlap: 50 
});
await store.addDocuments(chunks);
```

**Load from URL:**
```javascript
import { loadURL } from 'quick-rag';

const doc = await loadURL('https://example.com', {
  extractText: true  // Convert HTML to plain text
});
await store.addDocuments([doc]);
```

**Load Directory:**
```javascript
import { loadDirectory } from 'quick-rag';

// Load all supported documents from a folder
const docs = await loadDirectory('./documents', {
  extensions: ['.pdf', '.docx', '.txt', '.md'],
  recursive: true
});

console.log(`Loaded ${docs.length} documents`);

// Chunk and add to vector store
const chunks = chunkDocuments(docs, { chunkSize: 500 });
await store.addDocuments(chunks);
```

**Auto-Detect Format:**
```javascript
import { loadDocument } from 'quick-rag';

// Automatically detects file type
const doc = await loadDocument('./file.pdf');
// Works with: .pdf, .docx, .xlsx, .txt, .md, .json
```

### Installation

```bash
# Core package (includes text, JSON, markdown, URL loaders)
npm install quick-rag

# Optional: PDF support
npm install pdf-parse

# Optional: Word support
npm install mammoth

# Optional: Excel support
npm install xlsx

# Or install all at once:
npm install quick-rag pdf-parse mammoth xlsx
```

### Complete Example

```javascript
import {
  loadPDF,
  loadDirectory,
  chunkDocuments,
  InMemoryVectorStore,
  Retriever,
  OllamaRAGClient,
  createOllamaRAGEmbedding,
  generateWithRAG
} from 'quick-rag';

// Load documents
const pdf = await loadPDF('./research.pdf');
const docs = await loadDirectory('./articles');

// Combine and chunk
const allDocs = [pdf, ...docs];
const chunks = chunkDocuments(allDocs, { 
  chunkSize: 500,
  overlap: 50 
});

// Setup RAG
const client = new OllamaRAGClient();
const embed = createOllamaRAGEmbedding(client, 'embeddinggemma');
const store = new InMemoryVectorStore(embed);
const retriever = new Retriever(store);

// Add to vector store
await store.addDocuments(chunks);

// Query
const results = await retriever.getRelevant('What is the main topic?', 3);
const answer = await generateWithRAG(client, 'granite4:tiny-h', 
  'What is the main topic?', results);

console.log(answer);
```

**See full example:** [`example/advanced/document-loading-example.js`](./example/advanced/document-loading-example.js)

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

## 📚 Documentation

- **📖 [API Reference](./docs/API_REFERENCE.md)** - Complete API documentation
- **🛡️ [Error Handling](./docs/ERROR_HANDLING.md)** - Error handling best practices
- **💾 [SQLite Persistence](./docs/SQLITE_PERSISTENCE.md)** - Embedded storage guide
- **📊 [Metrics & Telemetry](./docs/METRICS_TELEMETRY.md)** - Monitoring and logging
- **🤝 [Contributing](./CONTRIBUTING.md)** - Contribution guidelines
- **📝 [Changelog](./CHANGELOG.md)** - Version history
- **💡 [Examples](./example)** - Working code examples
- **🚀 [Quickstart](./quickstart)** - Quick start guides

## 🔗 Resources

- **Ollama Models:** [ollama.ai/library](https://ollama.ai/library)
- **LM Studio:** [lmstudio.ai](https://lmstudio.ai)
- **Issues:** [GitHub Issues](https://github.com/emredeveloper/quick-rag/issues)
- **Discussions:** [GitHub Discussions](https://github.com/emredeveloper/quick-rag/discussions)
- **NPM Package:** [npmjs.com/package/quick-rag](https://www.npmjs.com/package/quick-rag)

---

## 📄 License

MIT © [Cihat Emre Karataş](https://github.com/emredeveloper)

---

## 🙏 Acknowledgments

Built with:
- [Ollama JS SDK](https://github.com/ollama/ollama-js)
- [LM Studio SDK](https://github.com/lmstudio-ai/lmstudio-js)
- [Pino](https://github.com/pinojs/pino) - Fast logging
- [Better SQLite3](https://github.com/WiseLibs/better-sqlite3) - Embedded database

Special thanks to all contributors and the open-source community!

---

**Made with ❤️ for the JavaScript & AI community**
