# Quick RAG Examples# Quick RAG Examples# Quick RAG Examples



Clear examples showing how to use quick-rag with both **Ollama** and **LM Studio**.



## 📚 ExamplesSimple, focused examples to get started with quick-rag.Simple, focused examples to get started with quick-rag.



Each feature has **two versions** - one for Ollama, one for LM Studio:



### 1️⃣ Basic Usage## 📚 Examples## 📚 Examples

- **`01-basic-usage.js`** - Ollama 🦙

- **`01-basic-usage-lmstudio.js`** - LM Studio 🎨



Learn the basics: setup client, add documents, query, and generate answers.### Basic Examples### Basic Examples



### 2️⃣ Document Loading

- **`02-document-loading.js`** - Ollama 🦙

- **`02-document-loading-lmstudio.js`** - LM Studio 🎨1. **`01-basic-usage.js`** - Getting started with RAG1. **`01-basic-usage.js`** - Getting started with RAG



Load PDFs, Word, Excel files. Chunk documents and query them.   - Setup client and embedding   - Setup client and embedding



### 3️⃣ Metadata Filtering   - Add documents to vector store   - Add documents to vector store

- **`03-metadata-filtering.js`** - Ollama 🦙

- **`03-metadata-filtering-lmstudio.js`** - LM Studio 🎨   - Query and generate answers   - Query and generate answers



Filter documents by category, language, difficulty, or custom metadata.



### 4️⃣ Streaming2. **`02-document-loading.js`** - Load PDFs, Word, Excel files2. **`02-document-loading.js`** - Load PDFs, Word, Excel files

- **`05-streaming.js`** - Ollama 🦙

- **`05-streaming-lmstudio.js`** - LM Studio 🎨   - Load single PDF or entire directory   - Load single PDF or entire directory



Stream responses in real-time for better UX.   - Chunk documents intelligently   - Chunk documents intelligently



### 5️⃣ Test Both Providers   - Query with RAG pipeline   - Query with RAG pipeline

- **`04-test-both-providers.js`** - Test both Ollama & LM Studio

   - Bonus: Load from URLs   - Bonus: Load from URLs

Automatically detect and test both providers.



## 🚀 Quick Start

3. **`03-metadata-filtering.js`** - Filter by metadata3. **`03-metadata-filtering.js`** - Filter by metadata

### With Ollama

   - Add documents with metadata   - Add documents with metadata

```bash

# Make sure Ollama is running   - Filter by category, language, etc.   - Filter by category, language, etc.

ollama serve

   - Use minimum score threshold   - Use minimum score threshold

# Install models

ollama pull embeddinggemma

ollama pull granite4:tiny-h

4. **`04-lmstudio.js`** - Use LM Studio instead of Ollama4. **`04-lmstudio.js`** - Use LM Studio instead of Ollama

# Run examples

node 01-basic-usage.js   - Setup LM Studio client   - Setup LM Studio client

node 02-document-loading.js

node 03-metadata-filtering.js   - Check loaded models   - Check loaded models

node 05-streaming.js

```   - Query and generate answers   - Query and generate answers



### With LM Studio



```bash5. **`05-streaming.js`** - Stream responses in real-time5. **`05-streaming.js`** - Stream responses in real-time

# 1. Open LM Studio

# 2. Load a model (e.g., qwen3-4b, gemma-3-4b)   - Real-time token streaming   - Real-time token streaming

# 3. Make sure nomic-embed-text-v1.5 is available

# 4. Enable local server: Settings → Local Server → Start   - Better user experience   - Better user experience



# Run examples

node 01-basic-usage-lmstudio.js

node 02-document-loading-lmstudio.js6. **`06-test-both-providers.js`** - Test both Ollama & LM Studio6. **`06-test-both-providers.js`** - Test both Ollama & LM Studio

node 03-metadata-filtering-lmstudio.js

node 05-streaming-lmstudio.js   - Detect available providers   - Detect available providers

```

   - Test each provider   - Test each provider

### Test Both

   - Show summary   - Show summary

```bash

# Automatically detect and test available providers

node 04-test-both-providers.js

```## 🚀 Quick Start## 🚀 Quick Start



## 📄 Document Loading Examples



To test PDF loading (examples 02):```bash```



```bash# Run any example

# Create PDF folder

mkdir PDFnode 01-basic-usage.js```bash



# Add some PDF files to the foldernode 02-document-loading.js

# Then run

node 02-document-loading.jsnode 06-test-both-providers.jsnode example/official-lmstudio-example.js### All Examples

# or

node 02-document-loading-lmstudio.js```

```

```

## 💡 Tips

## 📋 Requirements

- **Start here**: `01-basic-usage.js` (Ollama) or `01-basic-usage-lmstudio.js` (LM Studio)

- **Test setup**: `04-test-both-providers.js`All examples work with a running Ollama server. Make sure you have:

- **Check errors**: All examples have helpful error messages

- **Streaming**: Try `05-streaming.js` for better user experience- **Node.js** 18+ (for native fetch support)



## 🔧 Requirements- **Ollama** or **LM Studio** running locally**Features:**```bash



### Ollama- **Models installed**:

- Ollama running: `ollama serve`

- Models: `embeddinggemma`, `granite4:tiny-h`  - Ollama: `ollama pull embeddinggemma` and `ollama pull granite4:tiny-h`- ✅ Tests all downloaded modelsollama pull granite4:tiny-h



### LM Studio  - LM Studio: Load any model + nomic-embed-text-v1.5

- LM Studio app running

- Local server enabled- ✅ Official LM Studio SDKollama pull embeddinggemma

- Models loaded: any LLM + `nomic-embed-text-v1.5` embedding

## 📄 Document Loading

## 📖 Full Documentation

- ✅ Automatic model loadingollama serve

See main [README.md](../README.md) for complete API reference.

To test document loading (example 02):

- ✅ Comparison output```

```bash

# Create PDF folder

mkdir PDF

### 3️⃣ Simple Node.js## 📁 Examples

# Add some PDF files

# Then run

node 02-document-loading.js

```Basic example without streaming:### 🌟 **simple-nodejs.js** - Clean & Simple (NEW!)



## 💡 TipsPerfect starting point with clean output:



- Start with `01-basic-usage.js` to understand the basics```bash- ✅ Minimal setup

- Use `06-test-both-providers.js` to test your setup

- Check console output for helpful error messagesnode example/simple-nodejs.js- ✅ Clean console output



## 📖 Full Documentation```- ✅ Easy to understand



See main [README.md](../README.md) for complete API reference.


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
