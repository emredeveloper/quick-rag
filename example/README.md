# Example Demos - RAG Local LLM v0.6.3

This folder contains examples demonstrating all features.

## 🚀 Quick Start

### Simple Example (Recommended)

```bash
node example/simple-nodejs.js
```

**Output:**
```
📚 Retrieved Documents:

1. JavaScript is a programming language.
   ID: 1 | Relevance: 80.2%

2. Python is great for data science.
   ID: 2 | Relevance: 38.8%

🤖 AI Answer:
JavaScript is a programming language...
```

### All Examples

All examples work with a running Ollama server. Make sure you have:
```bash
ollama pull granite4:tiny-h
ollama pull embeddinggemma
ollama serve
```

## 📁 Examples

### 🌟 **simple-nodejs.js** - Clean & Simple (NEW!)
Perfect starting point with clean output:
- ✅ Minimal setup
- ✅ Clean console output
- ✅ Easy to understand

```bash
node example/simple-nodejs.js
```

### 🔧 **pure-nodejs-example.js** - Detailed Output
Same as simple but with more details:
- 📊 Step-by-step process
- 🔍 Detailed logging

```bash
node example/pure-nodejs-example.js
```

### 1. **all-features-demo.js** - Complete Feature Showcase
Demonstrates ALL new features in one comprehensive demo:
- ⚡ Batch embedding with Promise.all
- 📚 CRUD operations (add, update, delete, get)
- 🎯 Dynamic topK parameter
- 🌊 Prompt return for streaming
- 🚀 Modern fetch support

```bash
node example/all-features-demo.js
```

### 2. **topk-example.js** - Dynamic topK Parameter
Shows how the `topK` parameter now works correctly:
- Default retriever behavior (k=2)
- Override with different topK values (3, 5, 10)
- Integration with generateWithRAG

```bash
node example/topk-example.js
```

### 3. **crud-example.js** - VectorStore CRUD Operations
Demonstrates the new document management methods:
- `getAllDocuments()` - Get all documents
- `getDocument(id)` - Get specific document
- `updateDocument(id, text, meta)` - Update and re-embed
- `deleteDocument(id)` - Remove document
- `clear()` - Clear all documents

```bash
node example/crud-example.js
```

### 4. **batch-embedding-example.js** - Performance Improvement
Shows the massive performance gain from parallel embedding:
- Sequential vs parallel embedding comparison
- Real-world performance metrics
- Works with 80+ documents

```bash
node example/batch-embedding-example.js
```

### 5. **streaming-example.js** - Streaming Support
Demonstrates how generateWithRAG now returns prompts:
- Prompt structure and generation
- Streaming integration (like useRAG hook)
- Backward compatibility

```bash
node example/streaming-example.js
```

### 6. **run.js** (Original) - Basic RAG Example
The original simple RAG orchestration example.

```bash
node example/run.js
```

### 7. **mrl-example.js** (Original) - MRL Embedding
Demonstrates Matryoshka Representation Learning with different dimensions.

```bash
node example/mrl-example.js
```

## 🔧 Environment Variables

- `OLLAMA_TEST=1` - Enable real Ollama API calls
- `OLLAMA_MODEL=<model>` - Set model (default: granite4:tiny-h)

## 📊 Expected Output

Each example includes:
- ✅ Success indicators
- 📊 Performance metrics
- 🎯 Feature demonstrations
- ❌ Error handling

## 🎯 What's New in v0.6.0?

### Critical Fixes
- ✅ Removed circular dependency
- ✅ Fixed topK parameter handling
- ✅ Fixed streaming support

### New Features
- ⚡ 100x faster batch embedding
- 📚 Full CRUD operations
- 🎯 Dynamic topK parameter
- 🌊 Streaming-ready prompt return
- 🚀 Modern fetch (Node 18+)

## 📝 Notes

- All examples run without Ollama (mock mode) by default
- Set `OLLAMA_TEST=1` for real API calls
- Make sure Ollama is running on `localhost:11434` if testing with it
- Examples use dimension 128 for speed (MRL allows this!)

## 🤝 Contributing

See more examples? Have suggestions? Open an issue or PR!
