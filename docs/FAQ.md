# Frequently Asked Questions (FAQ)

## 🚀 Getting Started

### Which provider should I use - Ollama or LM Studio?

| Factor | Ollama | LM Studio |
|--------|--------|-----------|
| **Ease of Setup** | ⭐⭐⭐⭐⭐ CLI-based | ⭐⭐⭐⭐ GUI-based |
| **Resource Usage** | Lower | Higher |
| **Model Variety** | Good | Excellent |
| **API Compatibility** | Native | OpenAI-compatible |
| **Best For** | CLI users, automation | GUI users, experimentation |

**Recommendation**: Start with Ollama for simpler setup. Use LM Studio for more model options.

---

### What embedding model should I use?

| Model | Dimensions | Speed | Quality |
|-------|------------|-------|---------|
| `qwen3-embedding:0.6b` | Varies | Fast | Good |
| `mxbai-embed-large` | 1024 | Medium | Better |
| `all-minilm` | 384 | Very Fast | Basic |

**Recommendation**: `qwen3-embedding:0.6b` for most Ollama-based use cases.

---

### How do I install Quick RAG?

```bash
npm install quick-rag

# Optional dependencies
npm install pdf-parse      # PDF support
npm install mammoth        # Word support
npm install xlsx           # Excel support
npm install better-sqlite3 # SQLite persistence
```

---

## 📄 Document Processing

### How do I handle large PDF files?

Use chunking to split large documents:

```javascript
import { loadPDF, chunkText } from 'quick-rag';

const doc = await loadPDF('./large-document.pdf');
const chunks = chunkText(doc.text, { 
  chunkSize: 1000, 
  overlap: 100 
});

await store.addDocuments(
  chunks.map((text, i) => ({ id: `chunk-${i}`, text })),
  { batchSize: 20, maxConcurrent: 5 }
);
```

---

### What file formats are supported?

| Format | Extension | Required Package |
|--------|-----------|------------------|
| PDF | .pdf | `pdf-parse` |
| Word | .docx | `mammoth` |
| Excel | .xlsx | `xlsx` |
| PowerPoint | .pptx | `officeparser` |
| Text | .txt | - |
| Markdown | .md | - |
| JSON | .json | - |

---

### Why am I getting "Failed to fetch" errors?

This usually means:

1. **Ollama/LM Studio not running** - Start the server
2. **Wrong host/port** - Check your configuration
3. **Rate limiting** - Use batch processing:

```javascript
await store.addDocuments(docs, {
  batchSize: 10,      // Smaller batches
  maxConcurrent: 3    // Fewer concurrent requests
});
```

---

## 🔍 Search & Retrieval

### What's the difference between BM25 and Vector search?

| Feature | BM25 (Sparse) | Vector (Dense) |
|---------|---------------|----------------|
| **Based on** | Keyword matching | Semantic similarity |
| **Good for** | Exact term matching | Understanding meaning |
| **Speed** | Very fast | Depends on store |
| **Best for** | Known terminology | Natural language |

**Tip**: Use `HybridRetriever` to combine both for 20-30% better results!

---

### How do I improve retrieval quality?

1. **Use Hybrid Search** - Combines BM25 + Vector
2. **Enable Reranking** - Multi-signal scoring
3. **Tune chunk size** - Usually 500-1500 characters
4. **Add metadata** - Enable filtering

```javascript
import { HybridRetriever, createRerankedRetriever } from 'quick-rag';

const hybrid = new HybridRetriever(store, { alpha: 0.5 });
const retriever = createRerankedRetriever(hybrid);
```

---

### How do I filter search results?

```javascript
// Object-based filter
const results = await retriever.getRelevant(query, 5, {
  filters: { category: 'tech', year: 2024 }
});

// Function-based filter
const results = await retriever.getRelevant(query, 5, {
  filter: (meta) => meta.year > 2020 && meta.tags.includes('AI')
});
```

---

## 💾 Storage & Persistence

### How do I persist my vectors?

Use `SQLiteVectorStore` instead of `InMemoryVectorStore`:

```javascript
import { SQLiteVectorStore } from 'quick-rag';

const store = new SQLiteVectorStore('./vectors.db', embedFn);
// Data automatically persists!
```

---

### How do I backup my data?

Simply copy the `.db` file:

```bash
cp vectors.db vectors.backup.db
```

---

## ⚡ Performance

### How can I speed up embedding?

1. Use batch processing:
```javascript
await store.addDocuments(docs, {
  batchSize: 50,
  maxConcurrent: 10
});
```

2. Use a faster embedding model
3. Consider using GPU acceleration in Ollama/LM Studio

---

### How much memory does Quick RAG use?

- **InMemoryVectorStore**: ~1KB per document
- **SQLiteVectorStore**: Minimal RAM, disk-based
- **BM25**: ~0.5KB per document

For 10,000 documents, expect ~10-15MB with InMemoryVectorStore.

---

## 🐛 Troubleshooting

### Common Error Messages

| Error | Solution |
|-------|----------|
| `ECONNREFUSED` | Start Ollama/LM Studio |
| `Model not found` | Pull the model: `ollama pull model-name` |
| `Dimension mismatch` | Ensure consistent embedding model |
| `Memory error` | Use SQLiteVectorStore or reduce batch size |

---

### How do I debug retrieval results?

Use the `explain` option:

```javascript
const results = await retriever.getRelevant(query, 5, { explain: true });

results.forEach(r => {
  console.log('Score:', r.score);
  console.log('Explanation:', r.explanation);
});
```

---

## 🤝 Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

---

**Still have questions?** [Open an issue](https://github.com/emredeveloper/quick-rag/issues)!
