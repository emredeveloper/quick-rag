# Changelog

## [2.1.0] - 2025-11-20 🎉

### 🚀 Major Features - Phase 1: Technical Infrastructure

**Embedded Persistent Storage with SQLite**
- ✅ **SQLiteVectorStore** - Embedded persistent vector storage (no server required!)
- ✅ **Single File Storage** - All data in one .db file
- ✅ **Full CRUD Operations** - Create, Read, Update, Delete documents
- ✅ **Metadata Filtering** - SQL-based filtering capabilities
- ✅ **Batch Processing** - Efficient handling of large document sets
- ✅ **Rate Limiting** - Configurable concurrency control
- ✅ **Progress Tracking** - Real-time progress callbacks
- ✅ **Zero Configuration** - No server setup needed

**Advanced Error Handling System**
- ✅ **7 Custom Error Classes** - Specific errors for different failure types
  - `RAGError` - Base error class with codes and metadata
  - `EmbeddingError` - Embedding operation failures
  - `RetrievalError` - Document retrieval failures
  - `DocumentLoadError` - Document loading failures
  - `VectorStoreError` - Vector store operation failures
  - `GenerationError` - LLM generation failures
  - `ConfigurationError` - Configuration issues
- ✅ **Error Codes** - Programmatic error identification
- ✅ **Rich Metadata** - Context and debugging information
- ✅ **Helpful Suggestions** - How to fix the error
- ✅ **Utility Functions** - `isRAGError()`, `getErrorCode()`, `getErrorMetadata()`

### 📚 New Files

**Core Implementation:**
- `src/stores/sqliteStore.js` - SQLite vector store integration (~400 lines)
- `src/errors/index.js` - Complete error handling system (~350 lines)

**Examples:**
- `example/14-sqlite-embedded-storage.js` - Full SQLite workflow demo

**Documentation:**
- `docs/ERROR_HANDLING.md` - Error handling best practices

### 🔧 API Changes

**New Exports (v2.1.0+):**
```javascript
// Persistent Vector Stores (Embedded - No Server!)
import { SQLiteVectorStore } from 'quick-rag';

// Error Handling
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

### 📝 Usage Examples

**SQLite Vector Store (No Server Required!):**
```javascript
import { SQLiteVectorStore, createOllamaRAGEmbedding } from 'quick-rag';

const embed = createOllamaRAGEmbedding(ollamaClient, 'embeddinggemma');
const store = new SQLiteVectorStore('./my-vectors.db', embed);

// Add documents with progress
await store.addDocuments(docs, {
  batchSize: 20,
  maxConcurrent: 5,
  onProgress: (current, total) => console.log(`${current}/${total}`)
});

// Search with metadata filtering
const results = await store.similaritySearch('query', 5, {
  where: { category: 'programming' }
});

// Update document
await store.updateDocument('id', 'new text', { updated: true });

// Get statistics
const stats = store.getStats();
console.log(`Documents: ${stats.documentCount}`);

// Close database
store.close();
```

**Error Handling:**
```javascript
import { EmbeddingError, isRAGError } from 'quick-rag';

try {
  await vectorStore.addDocuments(docs);
} catch (error) {
  if (error instanceof EmbeddingError) {
    console.error('Embedding failed:', error.message);
    console.log('Suggestion:', error.metadata.suggestion);
  } else if (isRAGError(error)) {
    console.error('Error code:', error.code);
    console.error('Metadata:', error.metadata);
  }
}
```

### 📦 Dependencies

**New Optional Dependency:**
- `better-sqlite3` (^11.10.0) - Fast SQLite library for Node.js

**Installation:**
```bash
npm install better-sqlite3
```

### 🎯 Key Benefits

1. **No Server** - Embedded database, no setup required
2. **Single File** - All data in one .db file
3. **Fast** - SQLite is battle-tested and performant
4. **Easy Backup** - Just copy the .db file
5. **Better Debugging** - Clear error messages with suggestions
6. **Production Ready** - Used by countless applications
7. **Type Safe** - Full TypeScript support for errors

### 🔄 Migration from v2.0

**No Breaking Changes!** All v2.0 code works unchanged.

**Optional Upgrades:**

1. **Add persistence with SQLite:**
```javascript
// Before (v2.0) - in-memory
import { InMemoryVectorStore } from 'quick-rag';
const store = new InMemoryVectorStore(embed);

// After (v2.1.0) - persistent, no server!
import { SQLiteVectorStore } from 'quick-rag';
const store = new SQLiteVectorStore('./my-vectors.db', embed);
// Same API, but persistent!
```

2. **Add error handling:**
```javascript
// Before (v2.0)
try {
  await store.addDocuments(docs);
} catch (error) {
  console.error(error.message);
}

// After (v2.1.0) - Optional
import { EmbeddingError, isRAGError } from 'quick-rag';
try {
  await store.addDocuments(docs);
} catch (error) {
  if (error instanceof EmbeddingError) {
    console.error('Code:', error.code);
    console.error('Suggestion:', error.metadata.suggestion);
  }
}
```

### 🧪 Testing

- Error handling system fully tested
- SQLite store tested manually
- No external dependencies for testing

### 📖 Documentation

- Error handling best practices and patterns
- Migration guides from InMemoryVectorStore
- SQLite usage examples

### 🙏 Acknowledgments

Thank you to the community for requesting persistent storage and better error handling!

---

## [2.0.3] - 2025-01-XX 🚀

### ✨ Performance Improvements & Bug Fixes
- ✅ **Batch Embedding Support** - `InMemoryVectorStore.addDocuments()` now processes embeddings in batches to prevent overwhelming the server
- ✅ **Rate Limiting** - Added `batchSize` and `maxConcurrent` options to control embedding request rate
- ✅ **Browser Embedding Batch Support** - `createBrowserEmbedding` now supports batch embedding (array of texts)
- ✅ **Better Error Handling** - Improved error messages for network failures
- ✅ **Progress Tracking** - Enhanced progress callback to work with batch processing

### 📝 Usage Example
```javascript
import { InMemoryVectorStore } from 'quick-rag';

const store = new InMemoryVectorStore(embed);

// Process large document sets efficiently
await store.addDocuments(largeChunks, {
  batchSize: 20,        // Process 20 chunks at a time
  maxConcurrent: 5,     // Max 5 concurrent requests
  onProgress: (current, total) => {
    console.log(`Progress: ${current}/${total}`);
  }
});
```

### 🐛 Bug Fixes
- Fixed "Failed to fetch" errors when processing large document sets
- Fixed CORS issues in browser embedding
- Improved connection error handling

## [2.0.2] - 2025-01-XX 🚀

### ✨ New Features & Improvements
- ✅ **Progress Callback Support** - `addDocument` and `addDocuments` now support `onProgress` callback for tracking embedding progress
- ✅ **Auto-Chunking Detection** - VectorStore can detect large documents and suggest chunking (requires `chunkDocuments` function)
- ✅ **Enhanced Options** - Added `autoChunkThreshold`, `chunkSize`, and `chunkOverlap` options to VectorStore constructor
- ✅ **Better Large Document Handling** - Improved support for large PDFs and documents with progress tracking

### 📝 Usage Example
```javascript
import { InMemoryVectorStore, chunkDocuments } from 'quick-rag';

const store = new InMemoryVectorStore(embed, {
  autoChunkThreshold: 10000, // Auto-chunk docs > 10KB
  chunkSize: 1000,
  chunkOverlap: 100
});

// With progress tracking
await store.addDocument(largeDoc, {
  onProgress: (current, total) => {
    console.log(`Progress: ${current}/${total}`);
  },
  chunkDocuments: chunkDocuments // Use library's chunking function
});
```

## [2.0.1] - 2025-01-XX 🔧

### 🐛 Bug Fixes & Improvements
- ✅ Fixed npm package dependencies resolution
- ✅ Improved Vite/bundler compatibility
- ✅ Enhanced error messages for missing dependencies
- ✅ Updated documentation for npm installation

## [2.0.0] - 2025-01-XX 🎉

### 🎊 Major Release - Production-Ready v2.0

**Quick RAG v2.0 is here!** A comprehensive, production-ready RAG framework with advanced features, excellent developer experience, and full TypeScript support.

### ✨ What's New in v2.0.0

**Major Features:**
- ✅ **Official SDK Integration** - Full support for Ollama (v0.6.2+) and LM Studio (v1.5.0+) official SDKs
- ✅ **Decision Engine** - Multi-criteria weighted scoring with heuristic reasoning and adaptive learning
- ✅ **Query Explainability** - Industry-first feature to understand WHY documents were retrieved
- ✅ **Dynamic Prompt Management** - 10 built-in templates + full customization
- ✅ **Document Loaders** - PDF, Word, Excel, Text, Markdown, JSON, URLs, Sitemaps
- ✅ **Smart Chunking** - 4 chunking strategies with overlap support
- ✅ **Metadata Filtering** - Object-based and function-based filtering
- ✅ **Streaming Support** - Real-time token-by-token response streaming
- ✅ **React Hooks** - `useRAG` hook for React applications
- ✅ **CRUD Operations** - Full document management (add, update, delete, query)
- ✅ **Conversation History** - Track and export conversation sessions
- ✅ **Multi-Provider Support** - Seamless switching between Ollama and LM Studio
- ✅ **Auto-Detection** - Automatically detects available providers

**Quality Improvements:**
- ✅ **TypeScript Support** - Complete type definitions for all exports
- ✅ **Comprehensive Testing** - All features tested with both providers
- ✅ **Error Handling** - Helpful error messages and graceful degradation
- ✅ **Documentation** - Complete API documentation and 12+ examples
- ✅ **Performance** - Parallel batch embedding (5x faster)
- ✅ **Browser Support** - Works in Node.js, React, Next.js, and browsers

### 🚀 Breaking Changes

**None!** v2.0.0 maintains full backward compatibility with v1.x. All existing code works without changes.

### 📦 Installation

```bash
npm install quick-rag
```

**Optional Dependencies:**
```bash
# PDF support
npm install pdf-parse

# Word support
npm install mammoth

# Excel support
npm install xlsx
```

### 🎯 Key Features

#### 1. Official SDK Integration
```javascript
import { OllamaRAGClient, LMStudioRAGClient } from 'quick-rag';

// Full access to official SDK features
const client = new OllamaRAGClient();
await client.chat({ model: 'llama3.2', messages: [...] });
await client.generate({ model: 'granite4:3b', prompt: '...' });
```

#### 2. Decision Engine
```javascript
import { SmartRetriever, DEFAULT_WEIGHTS } from 'quick-rag';

const smartRetriever = new SmartRetriever(basicRetriever, {
  weights: {
    semanticSimilarity: 0.35,
    keywordMatch: 0.20,
    recency: 0.30,
    sourceQuality: 0.10,
    contextRelevance: 0.05
  }
});
```

#### 3. Query Explainability
```javascript
const results = await retriever.getRelevant('What is Ollama?', 3, {
  explain: true
});

console.log(results[0].explanation);
// {
//   queryTerms: ["ollama", "local", "ai"],
//   matchedTerms: ["ollama", "local"],
//   matchCount: 2,
//   matchRatio: 0.67,
//   cosineSimilarity: 0.856
// }
```

#### 4. Dynamic Prompt Management
```javascript
await generateWithRAG(client, model, query, docs, {
  template: 'conversational',
  systemPrompt: 'You are a helpful programming tutor'
});
```

#### 5. Document Loaders
```javascript
import { loadPDF, loadWord, loadExcel, loadURL } from 'quick-rag';

const pdf = await loadPDF('./document.pdf');
const word = await loadWord('./document.docx');
const excel = await loadExcel('./data.xlsx');
const web = await loadURL('https://example.com');
```

#### 6. Streaming Support
```javascript
const response = await client.chat({
  model: 'granite4:3b',
  messages: [{ role: 'user', content: '...' }],
  stream: true
});

for await (const chunk of response) {
  process.stdout.write(chunk.message?.content || '');
}
```

#### 7. React Hooks
```javascript
import { useRAG, initRAG } from 'quick-rag';

const { run, loading, response, docs } = useRAG({
  retriever,
  modelClient: createBrowserModelClient(),
  model: 'granite4:3b'
});
```

#### 8. Conversation History
```javascript
// Track conversations
const history = conversationManager.addMessage({
  query: 'What is RAG?',
  response: '...',
  retrievedDocs: [...],
  timestamp: new Date()
});

// Export to JSON
conversationManager.exportToJSON('conversation.json');
```

### 📚 Examples

**12 Comprehensive Examples:**
1. Basic Usage (Ollama & LM Studio)
2. Document Loading (PDF, Word, Excel)
3. Metadata Filtering
4. Test Both Providers (Auto-detection)
5. Streaming Responses
6. Advanced Filtering
7. Query Explainability
8. Prompt Management
9. Decision Engine (Simple)
10. Decision Engine (PDF Real-World)
11. Conversation History & Export

### 🔄 Migration from v1.x

**No migration needed!** All v1.x code works as-is. New features are opt-in:

```javascript
// v1.x code - still works!
const results = await retriever.getRelevant(query, 3);
await generateWithRAG(client, model, query, docs);

// v2.0.0 enhancements - optional
const results = await retriever.getRelevant(query, 3, { explain: true });
await generateWithRAG(client, model, query, docs, { template: 'technical' });
```

### 📊 Statistics

- **12+ Examples** - Comprehensive examples for all features
- **100% TypeScript** - Complete type definitions
- **2 Providers** - Ollama and LM Studio
- **10+ Document Formats** - PDF, Word, Excel, Text, Markdown, JSON, URLs
- **10 Prompt Templates** - Built-in templates for different use cases
- **5 Scoring Factors** - Multi-criteria weighted scoring
- **4 Chunking Strategies** - Text, sentences, documents, markdown

### 🎯 Use Cases

- **Documentation Sites** - RAG-powered documentation search
- **Knowledge Bases** - Enterprise knowledge management
- **Research Platforms** - Academic and research document retrieval
- **Customer Support** - AI-powered support systems
- **Content Management** - Intelligent content retrieval
- **E-learning** - Educational content search and generation

### 🙏 Acknowledgments

Thank you to the community for feedback, testing, and contributions!

---

## [1.1.10] - 2025-01-XX

### 🔧 Bug Fixes & Improvements

- Fixed file upload issues in React applications
- Improved error handling for document loading
- Enhanced streaming support for LM Studio
- Better TypeScript definitions

---

## [1.1.9] - 2025-01-XX

### ✨ New Features

- Conversation History & Export example (Example 12)
- Multi-provider auto-detection
- Settings management system
- Conversation statistics

---

## [1.1.8] - 2025-01-XX

### ✨ New Features

- Function-based Filters
- PowerPoint Support
- Organized Examples
- Advanced Filtering scenarios

---

## [1.1.7] - 2025-11-06 🐛

### 🐛 Critical Bug Fix

#### Fixed Missing Exports in index.node.js
- **Decision Engine exports missing** - Added SmartRetriever, WeightedDecisionEngine, HeuristicEngine, and DEFAULT_WEIGHTS to `src/index.node.js`
- **Prompt Management exports missing** - Added PromptManager and related exports to `src/index.node.js`

**Issue:** Users installing from NPM couldn't use Decision Engine or Prompt Management features because these exports were only in `src/index.js` but not in the main entry point `src/index.node.js`.

**Fixed:**
```javascript
// Now properly exported from index.node.js:
export { 
  SmartRetriever,
  WeightedDecisionEngine,
  HeuristicEngine,
  createSmartRetriever,
  DEFAULT_WEIGHTS
} from './decisionEngine.js';

export { 
  PromptManager, 
  PromptTemplates, 
  createPromptManager, 
  getTemplate 
} from './promptManager.js';
```

This fix ensures all v1.1.x features are accessible when installing from NPM.

---

## [1.1.6] - 2025-11-06 📚

### 📖 Documentation Update

#### 📝 README.md Update
- **Comprehensive Decision Engine Documentation** - Added complete documentation for the Decision Engine feature
- **Multi-Criteria Scoring** - Detailed explanation of 5-factor weighted scoring system
- **Heuristic Reasoning** - Pattern learning and query optimization documentation
- **Code Examples** - Production-ready examples for all Decision Engine features
- **Use Cases** - Real-world scenarios (news sites, documentation, research platforms)
- **Updated package description** - Now includes "Decision Engine" in description

**What's Documented:**
- ✅ SmartRetriever API and usage
- ✅ Multi-criteria weighted scoring (5 factors)
- ✅ Heuristic rules and learning system
- ✅ Adaptive learning from user feedback
- ✅ Scenario customization (news, docs, research)
- ✅ Decision transparency and explanations
- ✅ Knowledge transfer (export/import)
- ✅ Real-world example reference (Example 11)

This ensures NPM package page displays complete feature documentation!

---

## [1.1.5] - 2025-11-06 📝

### 🌍 Internationalization Update

#### 📝 Updated Examples
- **Example 10 (Simple)**: Translated all Turkish comments and console outputs to English
- **Example 11 (PDF Real-World)**: Translated all Turkish comments and console outputs to English
- Improved code readability for international developers
- Maintained all functionality while making examples globally accessible

**Files Updated:**
- `example/10-decision-engine-simple.js` - Smart Document Selection example now fully in English
- `example/11-decision-engine-pdf-real-world.js` - Real-world PDF scenario example now fully in English

**Benefits:**
- ✅ Better accessibility for international developers
- ✅ Consistent documentation language
- ✅ Easier to understand and follow examples
- ✅ Professional, production-ready code samples

---

## [1.1.0] - 2025-11-05 ✨

### 🎯 Major Feature Release

Two powerful new features that make Quick RAG even more unique!

### ✨ New Features

#### 🔍 Query Explainability
**Industry-first feature!** Now you can see WHY documents were retrieved and understand the retrieval process.

```javascript
const results = await retriever.getRelevant(query, 3, {
  explain: true  // Enable explanations
});

// Each result now includes:
{
  text: "...",
  score: 0.856,
  explanation: {
    queryTerms: ["ollama", "local", "ai"],        // Extracted from query
    matchedTerms: ["ollama", "local"],            // Found in document
    matchCount: 2,                                // Number of matches
    matchRatio: 0.67,                             // Match percentage
    cosineSimilarity: 0.856,                      // Semantic similarity
    relevanceFactors: {
      termMatches: 2,
      semanticSimilarity: 0.856,
      coverage: "67%"
    }
  }
}
```

**Benefits:**
- 🐛 Debug unexpected search results
- 📊 Understand semantic vs keyword matching
- ✅ Validate retrieval accuracy
- 📈 Optimize query quality
- 💡 Explain results to end users

**No other RAG library offers this level of explainability!**

#### 🎨 Dynamic Prompt Management
Intelligent, flexible prompt system with 10 built-in templates and full customization.

**Built-in Templates:**
- `default` - Standard RAG format
- `conversational` - Chat-style responses
- `technical` - Technical documentation format
- `academic` - Research/scholarly style
- `code` - Code-focused responses
- `concise` - Brief answers
- `detailed` - Comprehensive responses
- `qa` - Question-Answer format
- `instructional` - Step-by-step guides
- `creative` - Creative writing style

**Usage Examples:**

```javascript
// 1. Quick template selection
await generateWithRAG(client, model, query, docs, {
  template: 'conversational'
});

// 2. System prompt for role definition
await generateWithRAG(client, model, query, docs, {
  systemPrompt: 'You are a helpful programming tutor',
  template: 'instructional'
});

// 3. Context formatting options
await generateWithRAG(client, model, query, docs, {
  context: {
    includeScores: true,      // Show similarity scores
    includeMetadata: true,    // Show document metadata
    maxLength: 500           // Limit context length
  }
});

// 4. Advanced: PromptManager for reusable configs
const promptMgr = createPromptManager({
  systemPrompt: 'You are an expert engineer',
  template: 'technical',
  variables: { company: 'TechCorp' }
});

await generateWithRAG(client, model, query, docs, {
  promptManager: promptMgr
});

// 5. Custom template function
const customTemplate = (query, context) => `
  Custom format here
  Query: ${query}
  Context: ${context}
`;

await generateWithRAG(client, model, query, docs, {
  template: customTemplate
});
```

**Benefits:**
- 🎭 Different response styles per use case
- 👤 Role-based assistants (tutor, expert, analyst)
- 🏢 Multi-tenant applications with different prompts
- 🧪 A/B test prompt effectiveness
- 🎯 Domain-specific formatting

### 📝 New Files

- `src/promptManager.js` - Complete prompt management system
- `example/08-explain-scores.js` - Query explainability demo (Ollama + LM Studio)
- `example/09-prompt-management.js` - Dynamic prompt system demo

### 🔧 Improvements

- Enhanced `generateWithRAG()` to support options parameter
- Added `explain` option to `retriever.getRelevant()`
- Fixed React import to be optional (no longer requires React dependency)
- Better context formatting in RAG generation
- Improved error messages

### 📚 API Additions

**New Exports:**
```javascript
import {
  PromptManager,          // Advanced prompt management class
  PromptTemplates,        // Built-in template collection
  createPromptManager,    // Factory function
  getTemplate            // Get template by name
} from 'quick-rag';
```

**Enhanced Functions:**
```javascript
// Retriever now supports explain option
retriever.getRelevant(query, topK, { 
  explain: true,
  filters: {...},
  minScore: 0.5 
});

// generateWithRAG now accepts options
generateWithRAG(client, model, query, docs, {
  template: 'conversational',
  systemPrompt: '...',
  promptManager: manager,
  context: {
    includeScores: true,
    includeMetadata: true,
    maxLength: 1000
  }
});
```

### 🎯 Why v1.1.0?

These features represent significant functionality additions that:
1. ✅ Provide unique capabilities not found in competing libraries
2. ✅ Maintain backward compatibility (all v1.0.0 code works unchanged)
3. ✅ Follow semantic versioning (minor version bump for new features)
4. ✅ Are production-ready and fully tested

### 🔄 Migration from v1.0.0

**No breaking changes!** All existing code works as-is. New features are opt-in:

```javascript
// v1.0.0 code - still works!
const results = await retriever.getRelevant(query, 3);
await generateWithRAG(client, model, query, docs);

// v1.1.0 enhancements - optional
const results = await retriever.getRelevant(query, 3, { explain: true });
await generateWithRAG(client, model, query, docs, { template: 'technical' });
```

---

## [1.0.0] - 2025-11-04 🎉

### 🎊 Production Release

**Quick RAG is now production-ready!** This major release marks the stability and maturity of the library with comprehensive features, thorough testing, and excellent developer experience.

### ✨ What's Included in v1.0.0

**Core Features:**
- ✅ **Dual Provider Support** - Both Ollama and LM Studio fully tested and working
- ✅ **Document Loaders** - PDF, Word, Excel, Text, JSON, Markdown support
- ✅ **Web Loaders** - Load content from URLs and sitemaps
- ✅ **Smart Chunking** - 4 different chunking strategies
- ✅ **Metadata Filtering** - Filter by any metadata field + minimum score
- ✅ **Streaming Support** - Real-time response streaming
- ✅ **TypeScript Definitions** - Complete type safety
- ✅ **React Hook** - `useRAG` hook for React applications

**Quality Assurance:**
- ✅ **Comprehensive Testing** - All features tested with both providers
- ✅ **Clean Examples** - 10 focused examples (5 for Ollama, 5 for LM Studio)
- ✅ **Error Handling** - Helpful error messages and graceful degradation
- ✅ **Documentation** - Complete API documentation and examples

### 🔧 Breaking Changes from 0.7.x

**None!** This is a stability release. All 0.7.x code will work without changes.

### 🆕 New in v1.0.0

**Example Organization:**
- 📁 **Reorganized Examples** - Clear separation between Ollama and LM Studio
- 📝 **Better Documentation** - Each example is self-contained and well-documented
- 🧪 **Test Both Providers** - New dual-provider test script

**Example Files:**
1. `01-basic-usage.js` / `01-basic-usage-lmstudio.js` - Get started
2. `02-document-loading.js` / `02-document-loading-lmstudio.js` - Load PDFs
3. `03-metadata-filtering.js` / `03-metadata-filtering-lmstudio.js` - Filter documents
4. `04-test-both-providers.js` - Test your setup
5. `05-streaming.js` / `05-streaming-lmstudio.js` - Stream responses

**Bug Fixes:**
- ✅ Fixed LM Studio `listLoaded()` API call (was using wrong method)
- ✅ Fixed embedding model caching in LM Studio (no more "model already exists" error)
- ✅ Removed unused imports from example files
- ✅ Cleaned up example directory structure

### 📦 Installation

```bash
npm install quick-rag
```

**Optional Dependencies (install as needed):**
```bash
# PDF support
npm install pdf-parse

# Word support
npm install mammoth

# Excel support
npm install xlsx
```

### 🚀 Quick Start

**Ollama:**
```javascript
import { 
  OllamaRAGClient, 
  createOllamaRAGEmbedding, 
  InMemoryVectorStore 
} from 'quick-rag';

const client = new OllamaRAGClient();
const embed = createOllamaRAGEmbedding(client, 'embeddinggemma');
const store = new InMemoryVectorStore(embed);

await store.addDocuments([
  { text: 'Your knowledge here' }
]);
```

**LM Studio:**
```javascript
import { 
  LMStudioRAGClient, 
  createLMStudioRAGEmbedding, 
  InMemoryVectorStore 
} from 'quick-rag';

const client = new LMStudioRAGClient();
const embed = createLMStudioRAGEmbedding(client, 'nomic-embed-text-v1.5');
const store = new InMemoryVectorStore(embed);

await store.addDocuments([
  { text: 'Your knowledge here' }
]);
```

### 📊 Testing

All features thoroughly tested:
- ✅ Ollama integration (embeddinggemma + granite4:tiny-h)
- ✅ LM Studio integration (nomic-embed-text-v1.5 + qwen3-vl-4b)
- ✅ Document loading (PDF, Word, Excel)
- ✅ Web loading (URLs, sitemaps)
- ✅ Chunking strategies (text, sentences, documents, markdown)
- ✅ Metadata filtering
- ✅ Streaming responses
- ✅ Vector store operations
- ✅ RAG pipeline

### 🙏 Acknowledgments

Thank you to the community for feedback and testing!

---

## [0.7.4] - 2025-11-04

### 🚀 Major Feature: Document Loaders

**Load Various Document Formats:**
- ✅ **PDF Support** - `loadPDF()` (requires: `npm install pdf-parse`)
- ✅ **Word Support** - `loadWord()` for .docx files (requires: `npm install mammoth`)
- ✅ **Excel Support** - `loadExcel()` for .xlsx files (requires: `npm install xlsx`)
- ✅ **Text Files** - `loadText()` for .txt files
- ✅ **JSON Files** - `loadJSON()` with field extraction
- ✅ **Markdown Files** - `loadMarkdown()` with optional syntax stripping
- ✅ **Auto-Detection** - `loadDocument()` automatically detects file type
- ✅ **Directory Loading** - `loadDirectory()` loads entire folders recursively

**Web Content Loading:**
- ✅ `loadURL()` - Load content from any URL
- ✅ `loadURLs()` - Batch load multiple URLs
- ✅ `loadSitemap()` - Extract URLs from sitemap.xml
- ✅ Automatic HTML to text conversion

### 📦 New Dependencies

**Optional Dependencies (install only what you need):**
```bash
# PDF support
npm install pdf-parse

# Word support
npm install mammoth

# Excel support
npm install xlsx
```

### 🔧 Usage Examples

**Load PDF and Query:**
```javascript
import { loadPDF, chunkDocuments, InMemoryVectorStore } from 'quick-rag';

// Load PDF
const pdf = await loadPDF('./document.pdf');
console.log(`Loaded ${pdf.meta.pages} pages`);

// Chunk and add to RAG
const chunks = chunkDocuments([pdf], { chunkSize: 500 });
await store.addDocuments(chunks);
```

**Load from URL:**
```javascript
import { loadURL } from 'quick-rag';

const doc = await loadURL('https://example.com', {
  extractText: true  // Convert HTML to plain text
});
```

**Load Entire Directory:**
```javascript
import { loadDirectory } from 'quick-rag';

const docs = await loadDirectory('./documents', {
  extensions: ['.pdf', '.docx', '.txt', '.md'],
  recursive: true
});
console.log(`Loaded ${docs.length} documents`);
```

### 📚 New Examples

- `example/advanced/document-loading-example.js` - Complete guide for document loading

### 🧪 Testing

```bash
npm test
# ✅ Text loader tests passed
# ✅ JSON loader tests passed
# ✅ Markdown loader tests passed
# ✅ Auto-detect tests passed
# ✅ Web loader tests passed
```

### 📊 What's Supported

| Format | Function | Requires |
|--------|----------|----------|
| PDF | `loadPDF()` | `pdf-parse` |
| Word (.docx) | `loadWord()` | `mammoth` |
| Excel (.xlsx) | `loadExcel()` | `xlsx` |
| Text (.txt) | `loadText()` | Built-in |
| JSON | `loadJSON()` | Built-in |
| Markdown | `loadMarkdown()` | Built-in |
| Web URLs | `loadURL()` | Built-in |

### 🎯 Benefits

- 📄 **No manual text extraction** - Load documents directly
- 🔄 **Automatic chunking** - Split large documents intelligently
- 🏷️ **Metadata preservation** - Keep document metadata through pipeline
- 🌐 **Web scraping** - Load content from URLs
- 📁 **Batch processing** - Load entire directories at once
- 🎨 **TypeScript support** - Full type definitions included

---

## [0.7.3] - 2025-11-04

### ✨ New Features

**Text Chunking Utilities:**
- ✅ `chunkText()` - Split text by character limit with overlap
- ✅ `chunkBySentences()` - Split by sentences with smart overlap
- ✅ `chunkDocuments()` - Chunk documents with metadata preservation
- ✅ `chunkMarkdown()` - Markdown-aware chunking (preserves code blocks)

**Metadata Filtering:**
- ✅ Filter retrieval results by metadata fields
- ✅ Support for exact match, array contains, and regex patterns
- ✅ Minimum similarity score filtering
- ✅ Multiple filters can be combined

**TypeScript Support:**
- ✅ Full TypeScript definitions (`src/index.d.ts`)
- ✅ Complete type coverage for all exports
- ✅ IntelliSense and autocomplete in VS Code
- ✅ Type-safe API calls

**Enhanced Testing:**
- ✅ Comprehensive chunking tests
- ✅ Metadata filtering tests
- ✅ Integration tests (optional, requires Ollama)
- ✅ Test coverage for all new features

**useRAG Hook Improvements:**
- ✅ Fixed streaming support for OllamaRAGClient
- ✅ Fixed streaming support for LMStudioRAGClient
- ✅ Smart client detection for proper API usage
- ✅ Better error handling

### 📚 Examples

**New Advanced Examples:**
- `example/advanced/chunking-example.js` - Comprehensive chunking guide
- `example/advanced/metadata-filtering-example.js` - Advanced filtering patterns

### 🔧 API Changes

**Retriever.getRelevant()** now accepts options parameter:
```javascript
// Before
const results = await retriever.getRelevant(query, k);

// Now (backward compatible)
const results = await retriever.getRelevant(query, k, {
  filters: { source: 'web', year: 2024 },
  minScore: 0.5
});
```

**New Exports:**
```javascript
import { 
  chunkText, 
  chunkBySentences, 
  chunkDocuments, 
  chunkMarkdown 
} from 'quick-rag';
```

### 📊 Test Results

```bash
npm test
# ✅ vectorStore tests passed
# ✅ retriever tests passed
# ✅ chunking tests passed (4 test suites)
# ✅ metadata filtering tests passed (2 test suites)
# ✅ ALL TESTS PASSED!
```

---

## [0.7.2] - 2025-11-04

### 🐛 Critical Fixes

**generateWithRAG() Improvements:**
- ✅ Added dual API support (new and legacy signatures)
- ✅ Fixed LMStudioRAGClient compatibility
- ✅ Fixed OllamaRAGClient compatibility
- ✅ Smart client detection for proper API usage

**New API (Recommended):**
```javascript
const answer = await generateWithRAG(client, model, query, results);
```

**Legacy API (Still Supported):**
```javascript
const result = await generateWithRAG({ retriever, modelClient, model, query });
```

**What Works Now:**
- ✅ Both Ollama and LM Studio clients work perfectly
- ✅ All README examples tested and working
- ✅ Backward compatibility maintained

---

## [0.7.1] - 2025-11-04

### 🐛 Bug Fixes

**Critical README Corrections:**
- ✅ Fixed all code examples to use correct API
- ✅ Updated Option 3 (Node.js) to use official SDK
- ✅ Updated Option 4 (LM Studio) with proper usage
- ✅ Corrected API calls:
  - `vectorStore.addDocuments()` (not `retriever.addDocuments()`)
  - `retriever.getRelevant()` (not `retriever.retrieve()`)
  - `LMStudioRAGClient` (not `LMStudioClient`)
  - `createOllamaRAGEmbedding` (recommended over legacy)

**What Changed:**
- All examples now work out-of-the-box
- Consistent API usage throughout documentation
- Clear distinction between official SDK clients and legacy clients

---

## [0.7.0] - 2025-11-04

### 🎉 Major Update: Rebranding + Official SDK Integration

**Package Name Change:**
- 🆕 **NEW NAME: `quick-rag`** (was: `js-rag-local-llm`)
- More memorable, cleaner, and easier to use
- npm install: `npm install quick-rag`

**Example Organization:**
- 📁 Cleaned up examples folder (14 → 5 main examples)
- 📂 Advanced examples moved to `example/advanced/`
- 📖 New simplified example README

**Breaking Changes:**
- Added official `ollama` (v0.6.2) and `@lmstudio/sdk` (v1.5.0) as dependencies
- New recommended clients: `OllamaRAGClient` and `LMStudioRAGClient`

**New Features:**
- ✨ **Full Official SDK Support**: All features from official SDKs now available
  - **Streaming responses** - Real-time token-by-token generation
  - **Tool calling & function execution** - Build autonomous AI agents
  - **Vision model support** - Process images alongside text
  - **Image input handling** - Send images in prompts
  - **Web search & fetch** - Access web content (with Ollama account)
  - **Model management** - list, pull, push, create, delete, copy models
  - **Advanced configuration** - All SDK options exposed

- 🎨 **Dual Client System**:
  - `OllamaRAGClient` - Wraps official `ollama` SDK + RAG features
  - `LMStudioRAGClient` - Wraps official `@lmstudio/sdk` + RAG features
  - Legacy clients still available for backward compatibility

- 📚 **Enhanced Examples**:
  - `official-ollama-example.js` - Showcases official SDK + RAG
  - `lmstudio-example.js` - Complete LM Studio integration

**Backward Compatibility:**
- ✅ All existing code continues to work
- ✅ Legacy clients (`OllamaClient`, `LMStudioClient`) still exported
- ✅ No breaking changes to vector store or retriever APIs
- ✅ Existing examples work as before

**Migration Guide:**
```javascript
// Old way (still works)
import { OllamaClient } from 'js-rag-local-llm';
const client = new OllamaClient();

// New way (recommended - more features!)
import { OllamaRAGClient } from 'js-rag-local-llm';
const client = new OllamaRAGClient();

// Now you get: streaming, tool calling, vision, web search, etc.
```

---

## [0.6.5] - 2025-11-04 (Unreleased)

### 🚀 Major Feature: Universal Model Support

- **Auto-fallback to Chat API**: Automatically detects and uses the correct API (generate or chat)
- **Support for ALL Ollama models**: Now works with `llama3.2`, `llama3.1`, `mistral`, `granite4`, `qwen2.5`, and any other Ollama model
- **Seamless experience**: No configuration needed - just use any model name

### ✨ New Features

- `OllamaClient.chat()` method for chat-only models
- `_parseResponse()` internal method supporting both API formats
- Automatic warning when falling back to chat API

### 📝 Documentation

- Updated README with universal model support note
- Added `llama-chat-example.js` demonstrating chat-only models
- Removed model restrictions from troubleshooting

### 🔧 Technical

- Response parsing now handles both `response` and `message.content` fields
- Better error handling with helpful messages
- Zero breaking changes - fully backward compatible

---

## [0.6.4] - 2025-11-04

### 📝 Documentation & Examples

- **Clean output examples**: Added `simple-nodejs.js` with beautiful, readable output
- **Better console logging**: Examples now show clean results without vector arrays
- **Improved README**: Added output examples to show expected results
- **Updated example/README.md**: Better organization with new simple example

### 🎨 User Experience

- Output now shows relevance scores as percentages (e.g., "80.2%")
- Clean separation between retrieved docs and AI answers
- No more cluttered vector arrays in console output

---

## [0.6.3] - 2025-11-04

### 🔴 Critical Fix

- **Pure Node.js support**: Fixed React dependency issue in pure Node.js projects
- **Separate entry points**: 
  - Node.js: `src/index.node.js` (no React dependencies)
  - Browser/React: `src/index.js` or `js-rag-local-llm/react`
  - Browser: `src/index.browser.js`

### ✨ New Features

- **Automatic response parsing**: `OllamaClient.generate()` now automatically parses NDJSON streaming responses
- **Better package.json exports**: Conditional exports for Node.js vs Browser vs React

### 📝 Documentation

- Added pure Node.js example (`example/pure-nodejs-example.js`)
- Updated README with React import instructions
- Clarified usage for different environments

### 🔧 Technical

- `generate()` method now returns clean text instead of raw NDJSON
- Package correctly resolves entry points based on environment
- No breaking changes for existing users

---

## [0.6.2] - 2025-11-04

### 📝 Documentation

- **Major README overhaul**: Complete rewrite for clarity and user-friendliness
- **Step-by-step guides**: Added detailed setup instructions for React (Vite), Next.js, and vanilla JavaScript
- **Better examples**: Clear, focused code examples for each use case
- **Troubleshooting table**: Quick reference for common issues
- **Cleaner structure**: Organized documentation by framework and use case

### 🎯 Improvements

- Simplified Quick Start section with 6 clear steps
- Added comparison table for different framework setups
- Enhanced API reference with real-world examples
- Better error messages and solutions

---

## [0.6.1] - 2025-11-04

### ✨ New Features

- **Single document add**: Added `addDocument(doc, opts)` convenience method to `InMemoryVectorStore` for adding single documents without array wrapping

### 🔧 Improvements

- Simplified API: No need to wrap single documents in arrays anymore
- Better DX: `await store.addDocument({id: 'x', text: '...'})` instead of `await store.addDocuments([{...}])`

### 📝 Documentation

- Updated README with `addDocument()` usage examples
- Added test coverage for single document addition

---

## [0.6.0] - 2025-11-03

### 🔴 Critical Fixes

- **Removed circular dependency**: Package no longer lists itself as a dependency
- **Fixed topK parameter**: `generateWithRAG` now properly passes `topK` to `retriever.getRelevant()`
- **Fixed streaming support**: `generateWithRAG` now returns `prompt` for proper streaming initialization

### ✨ New Features

- **VectorStore CRUD operations**: Added `deleteDocument()`, `updateDocument()`, `getDocument()`, `getAllDocuments()`, and `clear()` methods
- **Batch embedding support**: `addDocuments()` now uses `Promise.all()` for parallel embedding (major performance boost)
- **Dynamic topK**: `Retriever.getRelevant()` now accepts optional `topK` parameter to override instance default

### 🚀 Improvements

- **Modern fetch usage**: `OllamaClient` now uses native `fetch` (Node.js 18+) with `node-fetch` as fallback
- **Streaming state**: `useRAG` hook now returns `streaming` boolean in addition to `loading`
- **Dependency cleanup**: `node-fetch` moved to `optionalDependencies` (not needed for Node.js 18+)

### 📝 API Changes

- `retriever.getRelevant(query, topK?)` - `topK` is now optional
- `generateWithRAG()` - now returns `{ docs, response, prompt }` (added `prompt`)
- `useRAG()` - now returns `{ run, loading, error, response, docs, streaming }` (added `streaming`)
- `InMemoryVectorStore` - new methods: `deleteDocument()`, `updateDocument()`, `getDocument()`, `getAllDocuments()`, `clear()`

### ⚡ Performance

- Embedding 100 documents is now ~100x faster (parallel vs sequential)
- Reduced bundle size by making `node-fetch` optional

### 🔧 Technical

- All existing tests pass
- No breaking changes for existing users (only additions)
- Better TypeScript inference support (return types are more explicit)

---

## [0.5.0] - Previous Release

- Initial stable release
