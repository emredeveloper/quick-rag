# Quick RAG API Reference

## Table of Contents

- [Clients](#clients)
- [Vector Stores](#vector-stores)
- [Retrievers](#retrievers)
- [Search](#search)
- [Query Transformation](#query-transformation)
- [Document Loaders](#document-loaders)
- [Utilities](#utilities)
- [Error Handling](#error-handling)

---

## Clients

### OllamaRAGClient

Official Ollama SDK wrapper for RAG operations.

```javascript
import { OllamaRAGClient } from 'quick-rag';

const client = new OllamaRAGClient({
  host: 'http://127.0.0.1:11434' // optional, default
});
```

#### Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `chat(options)` | Chat with the model | `Promise<ChatResponse>` |
| `generate(options)` | Generate text | `Promise<GenerateResponse>` |
| `embed(model, input)` | Create embeddings | `Promise<number[]>` |
| `list()` | List available models | `Promise<ModelList>` |
| `pull(options)` | Pull a model | `Promise<void>` |
| `ps()` | List running models | `Promise<ProcessList>` |

### LMStudioRAGClient

Official LM Studio SDK wrapper.

```javascript
import { LMStudioRAGClient } from 'quick-rag';

const client = new LMStudioRAGClient({
  baseUrl: 'http://localhost:1234' // optional
});
```

#### Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `chat(model, messages, options)` | Chat completion | `Promise<string>` |
| `generate(model, prompt, options)` | Text generation | `Promise<string>` |
| `embed(model, text)` | Create embeddings | `Promise<number[]>` |
| `listDownloaded()` | List downloaded models | `Promise<Model[]>` |
| `listLoaded()` | List loaded models | `Promise<Model[]>` |

---

## Vector Stores

### InMemoryVectorStore

In-memory vector storage (non-persistent).

```javascript
import { InMemoryVectorStore, createOllamaRAGEmbedding } from 'quick-rag';

const embed = createOllamaRAGEmbedding(client, 'qwen3-embedding:0.6b');
const store = new InMemoryVectorStore(embed);
```

#### Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `addDocuments(docs, options?)` | `Document[], AddOptions` | Add multiple documents |
| `addDocument(doc, options?)` | `Document, AddOptions` | Add single document |
| `similaritySearch(query, k?, dim?)` | `string, number, number` | Search for similar docs |
| `deleteDocument(id)` | `string` | Delete by ID |
| `updateDocument(id, text, meta?)` | `string, string, object` | Update document |
| `getDocument(id)` | `string` | Get by ID |
| `getAllDocuments()` | - | Get all documents |
| `clear()` | - | Remove all documents |

#### AddDocuments Options

```javascript
await store.addDocuments(docs, {
  batchSize: 20,        // Process in batches
  maxConcurrent: 5,     // Max parallel requests
  onProgress: (current, total) => console.log(`${current}/${total}`)
});
```

### SQLiteVectorStore

Persistent SQLite-based vector storage.

```javascript
import { SQLiteVectorStore } from 'quick-rag';

const store = new SQLiteVectorStore('./vectors.db', embedFn);
```

#### Additional Methods

| Method | Description |
|--------|-------------|
| `getStats()` | Get database statistics |
| `close()` | Close database connection |

---

## Retrievers

### Retriever

Basic retriever for vector search.

```javascript
import { Retriever } from 'quick-rag';

const retriever = new Retriever(vectorStore, { k: 5 });
```

#### getRelevant(query, k?, options?)

```javascript
const results = await retriever.getRelevant('search query', 5, {
  filters: { category: 'tech' },  // Object filter
  // OR
  filter: (meta) => meta.year > 2020,  // Function filter
  minScore: 0.5,
  explain: true  // Include rich explanations (snippet, density, etc.)
});
```

#### Explanation Object (v2.4.0+)
When `explain: true` is used, each result includes:
- `snippet`: String showing context around the match.
- `relevanceFactors.density`: Keyword concentration in chunk.
- `relevanceFactors.termMatch`: Ratio of query terms matched.

### SmartRetriever

AI-powered retrieval with multi-criteria scoring.

```javascript
import { SmartRetriever, DEFAULT_WEIGHTS } from 'quick-rag';

const smart = new SmartRetriever(basicRetriever, {
  weights: {
    semanticSimilarity: 0.35,
    keywordMatch: 0.20,
    recency: 0.30,
    sourceQuality: 0.10,
    contextRelevance: 0.05
  },
  enableHeuristics: true,
  enableLearning: true
});
```

---

## Search

### BM25

Sparse text search using BM25 algorithm.

```javascript
import { BM25 } from 'quick-rag';

const bm25 = new BM25({ k1: 1.2, b: 0.75 });
bm25.addDocuments(docs);

const results = bm25.search('query', 5);
```

### HybridRetriever

Combines dense (vector) and sparse (BM25) search.

```javascript
import { HybridRetriever } from 'quick-rag';

const hybrid = new HybridRetriever(vectorStore, {
  alpha: 0.5,           // 0 = sparse only, 1 = dense only
  fusionMethod: 'rrf', // 'rrf' or 'linear'
  rrfK: 60
});

const results = await hybrid.search('query', 5, { explain: true });
```

### Reranker

Multi-signal result reranking.

```javascript
import { Reranker, createRerankedRetriever } from 'quick-rag';

const reranker = new Reranker({
  keywordWeight: 0.35,
  semanticWeight: 0.35,
  coverageWeight: 0.20,
  coherenceWeight: 0.10
});

const reranked = reranker.rerank(query, results, { explain: true });

// Or wrap a retriever
const rerankedRetriever = createRerankedRetriever(retriever);
```

---

## Query Transformation

### QueryExpander

Expand queries with synonyms.

```javascript
import { QueryExpander } from 'quick-rag';

const expander = new QueryExpander();
expander.addSynonyms('ml', ['machine learning', 'AI']);

const { expanded, addedTerms } = expander.expand('ml models');
// expanded: "ml models machine learning AI"
```

### QueryDecomposer

Break complex queries into sub-queries.

```javascript
import { QueryDecomposer } from 'quick-rag';

const decomposer = new QueryDecomposer();
const { subQueries, type } = decomposer.decompose(
  'Compare Python with JavaScript and explain differences'
);
// subQueries: ["What is Python", "What is JavaScript", ...]
```

### MultiQueryGenerator

Generate query variations.

```javascript
import { MultiQueryGenerator } from 'quick-rag';

const generator = new MultiQueryGenerator();
const variations = generator.generate('How does RAG work?');
// ["How does RAG work?", "What is RAG?", "RAG explanation"]
```

---

## Document Loaders

```javascript
import { 
  loadPDF, loadWord, loadExcel, 
  loadText, loadJSON, loadMarkdown,
  loadDocument, loadDirectory,
  loadURL, loadURLs, loadSitemap
} from 'quick-rag';
```

| Function | Description | Required Package |
|----------|-------------|------------------|
| `loadPDF(path)` | Load PDF file | `pdf-parse` |
| `loadWord(path)` | Load .docx file | `mammoth` |
| `loadExcel(path)` | Load .xlsx file | `xlsx` |
| `loadText(path)` | Load text file | - |
| `loadJSON(path)` | Load JSON file | - |
| `loadMarkdown(path)` | Load markdown file | - |
| `loadDocument(path)` | Auto-detect format | varies |
| `loadDirectory(path, options)` | Load directory | varies |
| `loadURL(url)` | Load web page | `node-fetch` |
| `loadURLs(urls)` | Load multiple URLs | `node-fetch` |
| `loadSitemap(url)` | Extract URLs from sitemap | `node-fetch` |

---

## Utilities

### Chunking

```javascript
import { 
  chunkText, 
  chunkBySentences, 
  chunkDocuments, 
  chunkMarkdown 
} from 'quick-rag';

// Chunk by character count
const chunks = chunkText(text, { 
  chunkSize: 1000, 
  overlap: 100 
});

// Chunk by sentences (Abbreviation aware in v2.4.0+)
// Correcty handles Dr., Prof., LTD., etc.
const sentenceChunks = chunkBySentences(text, { 
  sentencesPerChunk: 5, 
  overlapSentences: 1 
});

// Chunk documents array
const docChunks = chunkDocuments(docs, { chunkSize: 1000 });

// Chunk markdown (preserves headers)
const mdChunks = chunkMarkdown(markdown, { chunkSize: 1000 });
```

### RAG Generation

```javascript
import { generateWithRAG } from 'quick-rag';

const answer = await generateWithRAG(client, 'model-name', query, docs, {
  template: 'conversational', // or: technical, academic, code, etc.
  systemPrompt: 'You are a helpful assistant'
});
```

---

## Error Handling

```javascript
import { 
  RAGError, EmbeddingError, RetrievalError,
  DocumentLoadError, VectorStoreError,
  GenerationError, ConfigurationError,
  isRAGError, getErrorCode, getErrorMetadata
} from 'quick-rag';

try {
  await store.addDocuments(docs);
} catch (error) {
  if (error instanceof EmbeddingError) {
    console.log('Code:', error.code);
    console.log('Suggestion:', error.metadata.suggestion);
  } else if (isRAGError(error)) {
    console.log('RAG Error:', getErrorCode(error));
  }
}
```

---

## React Hook

```javascript
import { useRAG, initRAG, createBrowserModelClient } from 'quick-rag/react';

const { run, loading, response, docs, streaming, error } = useRAG({
  retriever,
  modelClient: createBrowserModelClient(),
  model: 'llama3'
});

// Execute query
await run('What is React?', {
  stream: true,
  topK: 5,
  onDelta: (chunk, accumulated) => console.log(chunk)
});
```

---

For more examples, see the [example/](../example/) directory.
