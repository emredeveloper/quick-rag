# Embedded Persistence with SQLite

Quick RAG v2.1.0 introduces embedded vector storage using SQLite. This allows you to store embeddings and documents locally in a single file without needing a separate vector database server (like ChromaDB or Pinecone).

## 📦 Installation

SQLite persistence requires the `better-sqlite3` package:

```bash
npm install better-sqlite3
```

## 🚀 Quick Start

```javascript
import { SQLiteVectorStore, createOllamaRAGEmbedding, OllamaRAGClient } from 'quick-rag';

// 1. Setup Embedding Function
const client = new OllamaRAGClient({ host: 'http://127.0.0.1:11434' });
const embedFn = createOllamaRAGEmbedding(client, 'embeddinggemma');

// 2. Initialize Store
// Data will be saved to 'knowledge.db'
const store = new SQLiteVectorStore('./knowledge.db', embedFn);

// 3. Add Documents
await store.addDocuments([
  { 
    id: 'doc1', 
    text: 'Quick RAG is fast and easy.', 
    meta: { category: 'tech' } 
  },
  { 
    id: 'doc2', 
    text: 'SQLite is great for local storage.', 
    meta: { category: 'db' } 
  }
]);

// 4. Search
const results = await store.similaritySearch('fast framework', 2);
console.log(results);
```

## 💡 Key Features

### 1. Batch Processing
Efficiently process large datasets with built-in batching and progress tracking.

```javascript
await store.addDocuments(largeDocArray, {
  batchSize: 50,        // Process 50 docs at a time
  maxConcurrent: 5,     // Run 5 batches in parallel
  onProgress: (current, total) => {
    console.log(`Processed ${current}/${total} documents`);
  }
});
```

### 2. Metadata Filtering
Filter search results using SQL-based metadata queries.

```javascript
const results = await store.similaritySearch('database', 5, {
  where: { 
    category: 'db',
    published: true 
  }
});
```

### 3. CRUD Operations
Manage your documents dynamically.

```javascript
// Get a document
const doc = store.getDocument('doc1');

// Update a document (automatically re-embeds)
await store.updateDocument('doc1', 'Updated text content', { updated: true });

// Delete a document
store.deleteDocument('doc1');

// Get stats
const stats = store.getStats();
console.log(`Total docs: ${stats.documentCount}`);
```

## ⚠️ Important Considerations

1.  **Node.js Only:** SQLite persistence works in Node.js environments (Electron, Server-side). It does **NOT** work in the browser. For browser-based apps, use `InMemoryVectorStore`.
2.  **Performance:** SQLite is very fast for datasets up to ~100k documents. For millions of vectors, consider a dedicated vector DB.
3.  **Concurrency:** `better-sqlite3` is synchronous by default but very fast. Quick RAG handles concurrency for embedding generation, but database writes are serialized.

## 🔧 API Reference

### `new SQLiteVectorStore(dbPath, embeddingFn, options)`
- `dbPath` (string): Path to the .db file.
- `embeddingFn` (function): Function to generate embeddings.
- `options` (object):
  - `defaultDim` (number): Vector dimension (default: 768).

### `store.addDocuments(docs, options)`
- `docs` (Array): Array of document objects `{ id, text, meta }`.
- `options` (object):
  - `batchSize` (number): Docs per batch (default: 50).
  - `maxConcurrent` (number): Parallel batches (default: 3).
  - `onProgress` (function): Callback `(current, total)`.

### `store.similaritySearch(query, k, options)`
- `query` (string): Search query.
- `k` (number): Number of results.
- `options` (object):
  - `where` (object): Metadata filter `{ key: value }`.
