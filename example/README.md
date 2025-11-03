# Quick RAG Examples ⚡# Example Demos - RAG Local LLM v0.6.3



Simple, focused examples to get you started quickly.This folder contains examples demonstrating all features.



## 🚀 Quick Start## 🚀 Quick Start



### 1️⃣ Ollama Example (Recommended)### Simple Example (Recommended)



Official Ollama SDK with streaming support:```bash

node example/simple-nodejs.js

```bash```

node example/official-ollama-example.js

```**Output:**

```

**Features:**📚 Retrieved Documents:

- ✅ Official SDK integration

- ✅ Real-time streaming1. JavaScript is a programming language.

- ✅ Vector search with RAG   ID: 1 | Relevance: 80.2%

- ✅ Model management

- ✅ Clean, readable output2. Python is great for data science.

   ID: 2 | Relevance: 38.8%

### 2️⃣ LM Studio Example

🤖 AI Answer:

Test multiple models at once:JavaScript is a programming language...

```

```bash

node example/official-lmstudio-example.js### All Examples

```

All examples work with a running Ollama server. Make sure you have:

**Features:**```bash

- ✅ Tests all downloaded modelsollama pull granite4:tiny-h

- ✅ Official LM Studio SDKollama pull embeddinggemma

- ✅ Automatic model loadingollama serve

- ✅ Comparison output```



### 3️⃣ Simple Node.js## 📁 Examples



Basic example without streaming:### 🌟 **simple-nodejs.js** - Clean & Simple (NEW!)

Perfect starting point with clean output:

```bash- ✅ Minimal setup

node example/simple-nodejs.js- ✅ Clean console output

```- ✅ Easy to understand



**Features:**```bash

- ✅ Minimal setupnode example/simple-nodejs.js

- ✅ Easy to understand```

- ✅ Perfect for beginners

### 🔧 **pure-nodejs-example.js** - Detailed Output

---Same as simple but with more details:

- 📊 Step-by-step process

## 📋 Prerequisites- 🔍 Detailed logging



### For Ollama Examples```bash

node example/pure-nodejs-example.js

```bash```

# Install Ollama

curl -fsSL https://ollama.com/install.sh | sh### 1. **all-features-demo.js** - Complete Feature Showcase

Demonstrates ALL new features in one comprehensive demo:

# Pull models- ⚡ Batch embedding with Promise.all

ollama pull granite4:tiny-h- 📚 CRUD operations (add, update, delete, get)

ollama pull embeddinggemma- 🎯 Dynamic topK parameter

- 🌊 Prompt return for streaming

# Start server- 🚀 Modern fetch support

ollama serve

``````bash

node example/all-features-demo.js

### For LM Studio Examples```



1. Download [LM Studio](https://lmstudio.ai/)### 2. **topk-example.js** - Dynamic topK Parameter

2. Download models from the UIShows how the `topK` parameter now works correctly:

3. Start local server: `Developer > Local Server`- Default retriever behavior (k=2)

4. Server runs at `http://localhost:1234`- Override with different topK values (3, 5, 10)

- Integration with generateWithRAG

---

```bash

## 📂 Advanced Examplesnode example/topk-example.js

```

More complex examples are in `example/advanced/`:

### 3. **crud-example.js** - VectorStore CRUD Operations

- `all-features-demo.js` - Complete feature showcaseDemonstrates the new document management methods:

- `batch-embedding-example.js` - Batch processing- `getAllDocuments()` - Get all documents

- `crud-example.js` - CRUD operations- `getDocument(id)` - Get specific document

- `streaming-example.js` - Streaming responses- `updateDocument(id, text, meta)` - Update and re-embed

- `topk-example.js` - Dynamic retrieval- `deleteDocument(id)` - Remove document

- `mrl-example.js` - Matryoshka embeddings- `clear()` - Clear all documents



---```bash

node example/crud-example.js

## 🆘 Troubleshooting```



| Problem | Solution |### 4. **batch-embedding-example.js** - Performance Improvement

|---------|----------|Shows the massive performance gain from parallel embedding:

| `Connection refused` | Start Ollama: `ollama serve` or LM Studio server |- Sequential vs parallel embedding comparison

| `Model not found` | Pull model: `ollama pull <model>` or download in LM Studio |- Real-world performance metrics

| `Import errors` | Run from project root: `node example/...` |- Works with 80+ documents



---```bash

node example/batch-embedding-example.js

## 📖 Learn More```



- [Main README](../README.md) - Full documentation### 5. **streaming-example.js** - Streaming Support

- [Official Ollama SDK](https://github.com/ollama/ollama-js)Demonstrates how generateWithRAG now returns prompts:

- [Official LM Studio SDK](https://github.com/lmstudio-ai/lmstudio-js)- Prompt structure and generation

- Streaming integration (like useRAG hook)

**Made with ⚡ by Quick RAG**- Backward compatibility


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
