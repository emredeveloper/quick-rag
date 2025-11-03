# Changelog

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
