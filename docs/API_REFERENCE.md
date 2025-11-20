# API Reference

Complete API documentation for Quick RAG v2.1.0+

## Table of Contents

- [Client Classes](#client-classes)
  - [OllamaRAGClient](#ollamaRAGclient)
  - [LMStudioRAGClient](#lmstudioRAGclient)
- [Vector Stores](#vector-stores)
  - [InMemoryVectorStore](#inmemoryvectorstore)
  - [SQLiteVectorStore](#sqlitevectorstore)
- [Retriever](#retriever)
- [RAG Functions](#rag-functions)
- [Embeddings](#embeddings)
- [Document Loaders](#document-loaders)
- [Utilities](#utilities)
- [Error Handling](#error-handling)
- [Decision Engine](#decision-engine)
- [Prompt Management](#prompt-management)

---

## Client Classes

### OllamaRAGClient

Official Ollama SDK wrapper for RAG applications.

**Constructor:**
```javascript
import { OllamaRAGClient } from 'quick-rag';

const client = new OllamaRAGClient({
  host: 'http://127.0.0.1:11434'  // Optional, defaults to localhost
});
```

**Methods:**

#### `generate(options: GenerateOptions): Promise<GenerateResponse>`

Generate text with a model.

```javascript
const response = await client.generate({
  model: 'granite4:tiny-h',
  prompt: 'What is JavaScript?',
  stream: false,
  system: 'You are a helpful assistant',
  options: {
    temperature: 0.7,
    num_predict: 100
  }
});

console.log(response.response);
```

#### `chat(options: ChatOptions): Promise<ChatResponse>`

Chat with a model using message history.

```javascript
const response = await client.chat({
  model: 'granite4:tiny-h',
  messages: [
    { role: 'system', content: 'You are a helpful assistant' },
    { role: 'user', content: 'What is RAG?' }
  ],
  stream: false
});

console.log(response.message.content);
```

#### `embed(model: string, input: string | string[]): Promise<EmbedResponse>`

Generate embeddings for text.

```javascript
const response = await client.embed('embeddinggemma', 'Hello world');
console.log(response.embeddings[0]); // [0.123, -0.456, ...]

// Batch embeddings
const batchResponse = await client.embed('embeddinggemma', [
  'First text',
  'Second text'
]);
```

#### `list(): Promise<ListResponse>`

List all available models.

```javascript
const models = await client.list();
models.models.forEach(m => console.log(m.name));
```

#### `show(options: { model: string }): Promise<ShowResponse>`

Get detailed model information.

```javascript
const info = await client.show({ model: 'granite4:tiny-h' });
console.log(info.modelfile);
console.log(info.parameters);
```

#### `pull(options: PullOptions): Promise<PullResponse>`

Download a model.

```javascript
await client.pull({ 
  model: 'granite4:tiny-h',
  stream: true  // Show progress
});
```

#### `delete(options: { model: string }): Promise<void>`

Delete a model.

```javascript
await client.delete({ model: 'old-model' });
```

---

### LMStudioRAGClient

Official LM Studio SDK wrapper for RAG applications.

**Constructor:**
```javascript
import { LMStudioRAGClient } from 'quick-rag';

const client = new LMStudioRAGClient({
  baseUrl: 'ws://127.0.0.1:1234'  // Optional, defaults to localhost
});
```

**Methods:**

#### `chat(modelPath: string, messages: ChatMessage[] | string, options?: ChatOptions): Promise<string>`

Chat with a loaded model.

```javascript
// Simple string prompt
const response = await client.chat(
  'qwen/qwen3-4b-2507',
  'What is JavaScript?'
);

// With message history
const response = await client.chat(
  'qwen/qwen3-4b-2507',
  [
    { role: 'system', content: 'You are a helpful assistant' },
    { role: 'user', content: 'What is JavaScript?' }
  ],
  {
    temperature: 0.7,
    maxPredictedTokens: 500
  }
);
```

#### `generate(modelPath: string, prompt: string, options?: ChatOptions): Promise<string>`

Generate text with a loaded model (alias for chat with string).

```javascript
const response = await client.generate(
  'qwen/qwen3-4b-2507',
  'Explain RAG in simple terms',
  { temperature: 0.7 }
);
```

#### `embed(model: string, text: string | string[]): Promise<number[] | number[][]>`

Generate embeddings.

```javascript
// Single text
const embedding = await client.embed('nomic-embed-text-v1.5', 'Hello');
console.log(embedding); // [0.123, -0.456, ...]

// Batch
const embeddings = await client.embed('nomic-embed-text-v1.5', [
  'First text',
  'Second text'
]);
```

#### `listDownloaded(): Promise<ModelDescriptor[]>`

List all downloaded models.

```javascript
const models = await client.listDownloaded();
models.forEach(m => console.log(m.path));
```

#### `listLoaded(): Promise<LoadedModelDescriptor[]>`

List currently loaded models.

```javascript
const loaded = await client.listLoaded();
loaded.forEach(m => console.log(m.path, m.identifier));
```

#### `unload(modelPath: string): Promise<void>`

Unload a model from memory.

```javascript
await client.unload('qwen/qwen3-4b-2507');
```

---

## Vector Stores

### InMemoryVectorStore

Fast in-memory vector storage for development and small datasets.

**Constructor:**
```javascript
import { InMemoryVectorStore, createOllamaRAGEmbedding, OllamaRAGClient } from 'quick-rag';

const client = new OllamaRAGClient();
const embedFn = createOllamaRAGEmbedding(client, 'embeddinggemma');

const store = new InMemoryVectorStore(embedFn, {
  defaultDim: 768,
  autoChunkThreshold: 10000,
  chunkSize: 1000,
  chunkOverlap: 100
});
```

**Methods:**

#### `addDocument(doc: Document, opts?: AddDocumentOptions): Promise<void>`

Add a single document.

```javascript
await store.addDocument({
  id: 'doc1',
  text: 'JavaScript is a programming language',
  meta: { category: 'programming', year: 2024 }
});
```

#### `addDocuments(docs: Document[], opts?: AddDocumentsOptions): Promise<void>`

Add multiple documents with batch processing.

```javascript
await store.addDocuments([
  { id: 'doc1', text: 'First document' },
  { id: 'doc2', text: 'Second document' }
], {
  dim: 768,
  batchSize: 20,
  maxConcurrent: 5,
  autoChunk: true,
  onProgress: (current, total, doc) => {
    console.log(`Processing ${current}/${total}: ${doc.text.substring(0, 30)}...`);
  }
});
```

**Options:**
- `dim` - Embedding dimension
- `batchSize` - Documents per batch (default: 10)
- `maxConcurrent` - Max concurrent requests (default: 5)
- `autoChunk` - Auto-chunk large documents (default: true)
- `onProgress` - Progress callback

#### `similaritySearch(query: string, k?: number, queryDim?: number): Promise<Document[]>`

Search for similar documents.

```javascript
const results = await store.similaritySearch('What is JavaScript?', 5, 768);
results.forEach(doc => {
  console.log(`Score: ${doc.score}, Text: ${doc.text}`);
});
```

#### `getDocument(id: string): Document | undefined`

Get a document by ID.

```javascript
const doc = store.getDocument('doc1');
if (doc) {
  console.log(doc.text);
}
```

#### `updateDocument(id: string, newText: string, newMeta?: Record<string, any>): Promise<boolean>`

Update a document (automatically re-embeds).

```javascript
const updated = await store.updateDocument('doc1', 'Updated text', {
  category: 'updated',
  lastModified: Date.now()
});
```

#### `deleteDocument(id: string): boolean`

Delete a document.

```javascript
const deleted = store.deleteDocument('doc1');
```

#### `getAllDocuments(): Document[]`

Get all documents.

```javascript
const allDocs = store.getAllDocuments();
console.log(`Total: ${allDocs.length}`);
```

#### `clear(): void`

Clear all documents.

```javascript
store.clear();
```

---

### SQLiteVectorStore

Embedded persistent vector storage with SQLite (v2.1.0+).

**Installation:**
```bash
npm install better-sqlite3
```

**Constructor:**
```javascript
import { SQLiteVectorStore, createOllamaRAGEmbedding, OllamaRAGClient } from 'quick-rag';

const client = new OllamaRAGClient();
const embedFn = createOllamaRAGEmbedding(client, 'embeddinggemma');

const store = new SQLiteVectorStore('./knowledge.db', embedFn, {
  defaultDim: 768
});
```

**Methods:**

All methods from `InMemoryVectorStore` plus:

#### `similaritySearch(query: string, k?: number, options?: SearchOptions): Promise<Document[]>`

Search with metadata filtering.

```javascript
const results = await store.similaritySearch('JavaScript', 5, {
  where: { 
    category: 'programming',
    year: 2024 
  }
});
```

#### `getStats(): StoreStats`

Get database statistics.

```javascript
const stats = store.getStats();
console.log(`Documents: ${stats.documentCount}`);
console.log(`DB Size: ${stats.dbSize} bytes`);
```

#### `close(): void`

Close the database connection.

```javascript
store.close();
```

**See:** [SQLITE_PERSISTENCE.md](./SQLITE_PERSISTENCE.md) for complete guide.

---

## Retriever

Enhanced search with filtering and explainability.

**Constructor:**
```javascript
import { Retriever } from 'quick-rag';

const retriever = new Retriever(vectorStore, {
  k: 3  // Default number of results
});
```

**Methods:**

#### `getRelevant(query: string, k?: number, options?: GetRelevantOptions): Promise<Document[]>`

Get relevant documents with advanced options.

```javascript
// Basic search
const docs = await retriever.getRelevant('What is JavaScript?', 3);

// With metadata filters
const docs = await retriever.getRelevant('JavaScript', 5, {
  filters: { category: 'programming', year: 2024 },
  minScore: 0.7
});

// With function filter
const docs = await retriever.getRelevant('JavaScript', 5, {
  filters: (meta) => {
    return meta.year >= 2020 && meta.tags.includes('modern');
  }
});

// With explainability
const docs = await retriever.getRelevant('JavaScript', 3, {
  explain: true
});

docs.forEach(doc => {
  console.log(`Score: ${doc.score}`);
  console.log(`Matched terms: ${doc.explanation.matchedTerms.join(', ')}`);
  console.log(`Match ratio: ${doc.explanation.matchRatio}`);
});
```

**Options:**
- `filters` - Object or function to filter by metadata
- `minScore` - Minimum similarity score (0-1)
- `explain` - Add detailed explanations to results

---

## RAG Functions

### generateWithRAG

Generate text using Retrieval-Augmented Generation.

**Signature 1: Object-based (Legacy)**
```javascript
import { generateWithRAG } from 'quick-rag';

const result = await generateWithRAG({
  retriever,
  modelClient,
  model: 'granite4:tiny-h',
  query: 'What is JavaScript?',
  topK: 3
});

console.log(result.response);
console.log(result.docs);
```

**Signature 2: Direct (Current)**
```javascript
const response = await generateWithRAG(
  client,
  'granite4:tiny-h',
  'What is JavaScript?',
  documents,  // Retrieved documents
  {
    systemPrompt: 'You are a helpful programming tutor',
    template: 'technical',  // or custom function
    promptManager: myPromptManager,
    context: {
      includeScores: true,
      includeMetadata: true
    }
  }
);
```

### initRAG

Quick setup for RAG pipeline.

```javascript
import { initRAG } from 'quick-rag';

const { retriever, store, mrl } = await initRAG(documents, {
  defaultDim: 128,
  k: 3,
  mrlBaseDim: 768,
  baseEmbeddingOptions: {
    useBrowser: true,
    baseUrl: '/api/embed',
    model: 'embeddinggemma',
    headers: { 'Authorization': 'Bearer token' }
  }
});

// Use retriever
const docs = await retriever.getRelevant('query', 3);
```

---

## Embeddings

### createOllamaRAGEmbedding

Create Ollama embedding function.

```javascript
import { createOllamaRAGEmbedding, OllamaRAGClient } from 'quick-rag';

const client = new OllamaRAGClient();
const embedFn = createOllamaRAGEmbedding(client, 'embeddinggemma');

// Use with vector store
const embedding = await embedFn('Hello world', 768);
```

### createLMStudioRAGEmbedding

Create LM Studio embedding function.

```javascript
import { createLMStudioRAGEmbedding, LMStudioRAGClient } from 'quick-rag';

const client = new LMStudioRAGClient();
const embedFn = createLMStudioRAGEmbedding(client, 'nomic-embed-text-v1.5');

const embedding = await embedFn('Hello world');
```

### createBrowserEmbedding

Browser-safe embedding with custom endpoint.

```javascript
import { createBrowserEmbedding } from 'quick-rag';

const embedFn = createBrowserEmbedding({
  endpoint: '/api/embed',
  model: 'embeddinggemma',
  headers: { 'Authorization': 'Bearer token' }
});
```

### createMRL

Matryoshka Representation Learning - flexible dimensions.

```javascript
import { createMRL, createOllamaRAGEmbedding, OllamaRAGClient } from 'quick-rag';

const client = new OllamaRAGClient();
const baseEmbed = createOllamaRAGEmbedding(client, 'embeddinggemma');

const mrl = createMRL(baseEmbed, 768);

// Request different dimensions
const small = await mrl('text', 128);   // 128-dim
const large = await mrl('text', 512);   // 512-dim
```

---

## Document Loaders

### loadPDF

Load PDF documents.

```javascript
import { loadPDF } from 'quick-rag';

const doc = await loadPDF('./document.pdf', {
  meta: { source: 'research', category: 'AI' }
});

console.log(`Pages: ${doc.meta.pages}`);
console.log(`Text length: ${doc.text.length}`);
```

**Requires:** `npm install pdf-parse`

### loadWord

Load Word documents (.docx).

```javascript
import { loadWord } from 'quick-rag';

const doc = await loadWord('./document.docx');
console.log(doc.text);
```

**Requires:** `npm install mammoth`

### loadExcel

Load Excel spreadsheets (.xlsx, .xls).

```javascript
import { loadExcel } from 'quick-rag';

// Load first sheet
const doc = await loadExcel('./data.xlsx');

// Load specific sheet
const doc = await loadExcel('./data.xlsx', { 
  sheetName: 'Sheet2' 
});

// Load all sheets
const doc = await loadExcel('./data.xlsx', { 
  allSheets: true 
});

console.log(doc.sheets);  // { 'Sheet1': [...], 'Sheet2': [...] }
```

**Requires:** `npm install xlsx`

### loadText, loadJSON, loadMarkdown

Load text-based files.

```javascript
import { loadText, loadJSON, loadMarkdown } from 'quick-rag';

const txt = await loadText('./file.txt');
const json = await loadJSON('./data.json', { 
  textField: 'content'  // Extract specific field
});
const md = await loadMarkdown('./README.md', {
  stripMarkdown: true  // Remove markdown syntax
});
```

### loadDocument

Auto-detect file type and load.

```javascript
import { loadDocument } from 'quick-rag';

const doc = await loadDocument('./file.pdf');  // Auto-detects format
// Supports: .pdf, .docx, .xlsx, .txt, .json, .md, .pptx
```

### loadDirectory

Load all documents from a directory.

```javascript
import { loadDirectory } from 'quick-rag';

const docs = await loadDirectory('./documents', {
  extensions: ['.pdf', '.docx', '.txt', '.md'],
  recursive: true,
  meta: { source: 'documentation' }
});

console.log(`Loaded ${docs.length} documents`);
```

### loadURL, loadURLs, loadSitemap

Load from web.

```javascript
import { loadURL, loadURLs, loadSitemap } from 'quick-rag';

// Single URL
const doc = await loadURL('https://example.com', {
  extractText: true,
  headers: { 'User-Agent': 'MyBot/1.0' }
});

// Multiple URLs
const docs = await loadURLs([
  'https://example.com/page1',
  'https://example.com/page2'
]);

// From sitemap
const urls = await loadSitemap('https://example.com/sitemap.xml');
const docs = await loadURLs(urls);
```

---

## Utilities

### chunkText

Split text into chunks.

```javascript
import { chunkText } from 'quick-rag';

const chunks = chunkText('Long text...', {
  chunkSize: 500,
  overlap: 50,
  separator: '\n\n'  // Or regex: /\n{2,}/
});
```

### chunkBySentences

Chunk by sentence boundaries.

```javascript
import { chunkBySentences } from 'quick-rag';

const chunks = chunkBySentences('Text with. Multiple sentences.', {
  sentencesPerChunk: 3,
  overlapSentences: 1
});
```

### chunkDocuments

Chunk entire documents.

```javascript
import { chunkDocuments } from 'quick-rag';

const chunked = chunkDocuments([
  { id: '1', text: 'Long text...' },
  { id: '2', text: 'Another long text...' }
], {
  chunkSize: 500,
  overlap: 50
});

// Each chunk preserves metadata and gets a unique ID
chunked.forEach(chunk => {
  console.log(chunk.id);  // '1-chunk-0', '1-chunk-1', ...
  console.log(chunk.meta.chunkIndex);
});
```

### chunkMarkdown

Chunk markdown by headers.

```javascript
import { chunkMarkdown } from 'quick-rag';

const chunks = chunkMarkdown('# Title\n\nContent...', {
  chunkSize: 500,
  overlap: 50
});
```

---

## Error Handling

Quick RAG v2.1.0+ includes comprehensive error handling.

### Error Classes

```javascript
import {
  RAGError,
  EmbeddingError,
  RetrievalError,
  DocumentLoadError,
  VectorStoreError,
  GenerationError,
  ConfigurationError,
  isRAGError,
  getErrorCode,
  getErrorMetadata
} from 'quick-rag';
```

### Using Errors

```javascript
try {
  await store.addDocuments(docs);
} catch (error) {
  if (isRAGError(error)) {
    console.error('Error code:', getErrorCode(error));
    console.error('Message:', error.message);
    console.error('Metadata:', getErrorMetadata(error));
    console.error('Suggestions:', error.metadata.suggestions);
  }
}
```

### Creating Custom Errors

```javascript
import { EmbeddingError } from 'quick-rag';

throw EmbeddingError.modelNotFound('my-model');
throw EmbeddingError.dimensionMismatch(768, 512);
throw EmbeddingError.batchTooLarge(100, 50);
```

**See:** [ERROR_HANDLING.md](./ERROR_HANDLING.md) for complete guide.

---

## Decision Engine

Advanced retrieval with multi-criteria scoring.

### SmartRetriever

```javascript
import { SmartRetriever, DEFAULT_WEIGHTS } from 'quick-rag';

const smartRetriever = new SmartRetriever(retriever, {
  weights: {
    semanticSimilarity: 0.50,
    keywordMatch: 0.20,
    recency: 0.15,
    sourceQuality: 0.10,
    contextRelevance: 0.05
  },
  enableHeuristics: true,
  enableLearning: true
});

// Get results with decision transparency
const result = await smartRetriever.getRelevant('latest AI news', 3);

console.log(result.results[0].scoreBreakdown);
console.log(result.decisions.appliedRules);
console.log(result.decisions.suggestions);
```

### Heuristics

```javascript
// Add custom rule
smartRetriever.heuristicEngine.addRule(
  'boost-recent',
  (query) => query.includes('latest'),
  (query, context) => {
    context.adjustWeight('recency', 0.40);
    return { adjusted: true };
  },
  10  // Priority
);

// Provide feedback for learning
smartRetriever.provideFeedback(query, results, {
  rating: 5,
  comment: 'Perfect results!'
});

// Export/import knowledge
const knowledge = smartRetriever.exportKnowledge();
newRetriever.importKnowledge(knowledge);
```

---

## Prompt Management

Dynamic prompt templates and customization.

### PromptManager

```javascript
import { PromptManager, PromptTemplates, createPromptManager } from 'quick-rag';

// Create manager
const pm = new PromptManager({
  systemPrompt: 'You are a helpful assistant',
  template: 'technical',  // or PromptTemplates.technical
  variables: {
    company: 'Acme Corp',
    version: '2.0'
  }
});

// Generate prompts
const prompt = pm.generate('What is JavaScript?', documents, {
  context: {
    includeScores: true,
    includeMetadata: true,
    maxLength: 2000,
    separator: '\n---\n'
  }
});

// Update settings
pm.setSystemPrompt('New system prompt');
pm.setTemplate('conversational');
pm.addVariables({ author: 'John' });

// Clone with modifications
const newPm = pm.clone({ template: 'academic' });
```

### Built-in Templates

Available templates:
- `default` - Standard RAG template
- `conversational` - Friendly chat style
- `technical` - Technical documentation
- `academic` - Research/academic style
- `code` - Code-focused responses
- `concise` - Brief answers
- `detailed` - Comprehensive responses
- `qa` - Question-answer format
- `instructional` - Step-by-step teaching
- `creative` - Creative writing

### Custom Templates

```javascript
const customTemplate = (query, context) => {
  return `Context: ${context}\n\nQ: ${query}\nA: Let me explain...`;
};

pm.setTemplate(customTemplate);
```

---

## Complete Example

```javascript
import {
  OllamaRAGClient,
  createOllamaRAGEmbedding,
  SQLiteVectorStore,
  Retriever,
  SmartRetriever,
  PromptManager,
  generateWithRAG,
  loadPDF,
  chunkDocuments
} from 'quick-rag';

// 1. Setup
const client = new OllamaRAGClient();
const embedFn = createOllamaRAGEmbedding(client, 'embeddinggemma');

// 2. Persistent storage
const store = new SQLiteVectorStore('./knowledge.db', embedFn);

// 3. Load and chunk documents
const pdf = await loadPDF('./research.pdf');
const chunks = chunkDocuments([pdf], { chunkSize: 500, overlap: 50 });

// 4. Add to store with progress
await store.addDocuments(chunks, {
  batchSize: 20,
  onProgress: (cur, tot) => console.log(`${cur}/${tot}`)
});

// 5. Smart retrieval
const retriever = new Retriever(store);
const smartRetriever = new SmartRetriever(retriever, {
  enableHeuristics: true,
  enableLearning: true
});

// 6. Query
const result = await smartRetriever.getRelevant('What is the main finding?', 3);

// 7. Generate with custom prompts
const pm = new PromptManager({
  systemPrompt: 'You are a research assistant',
  template: 'academic'
});

const answer = await generateWithRAG(
  client,
  'granite4:tiny-h',
  'What is the main finding?',
  result.results,
  { promptManager: pm }
);

console.log(answer);
```

---

## TypeScript Support

Quick RAG is fully typed. Import types:

```typescript
import type {
  Document,
  EmbeddingFunction,
  VectorStoreOptions,
  ChatMessage,
  GenerateOptions,
  ChatOptions
} from 'quick-rag';
```

---

## Next Steps

- See [ERROR_HANDLING.md](./ERROR_HANDLING.md) for error handling best practices
- See [SQLITE_PERSISTENCE.md](./SQLITE_PERSISTENCE.md) for persistent storage guide
- Check [/example](../example) folder for complete working examples

---

**Last Updated:** v2.1.0 (November 20, 2025)
