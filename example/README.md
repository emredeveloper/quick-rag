# Quick RAG Examples

Clear examples showing how to use quick-rag with both **Ollama** and **LM Studio**.

**Using quick-rag v2.4.0+** with robust chunking, rich explanations, and BM25 optimization.

## 📚 Examples

Simple, focused examples to get started with quick-rag.

Each feature has **two versions** - one for Ollama, one for LM Studio:

### 1️⃣ Basic Usage

- **`01-basic-usage.js`** - Ollama 🦙
- **`01-basic-usage-lmstudio.js`** - LM Studio 🎨

Learn the basics: setup client, add documents, query, and generate answers.

### 2️⃣ Document Loading

- **`02-document-loading.js`** - Ollama 🦙
- **`02-document-loading-lmstudio.js`** - LM Studio 🎨

Load PDFs, Word, Excel files. Chunk documents and query them.

### 3️⃣ Metadata Filtering

- **`03-metadata-filtering.js`** - Ollama 🦙
- **`03-metadata-filtering-lmstudio.js`** - LM Studio 🎨

Filter documents by category, language, difficulty, or custom metadata.

### 4️⃣ Streaming

- **`05-streaming.js`** - Ollama 🦙
- **`05-streaming-lmstudio.js`** - LM Studio 🎨

Stream responses in real-time for better UX.

### 5️⃣ Test Both Providers

- **`04-test-both-providers.js`** - Test both Ollama & LM Studio

   - Bonus: Load from URLs

Automatically detect and test both providers.

### 6️⃣ Advanced Filtering

- **`06-advanced-filtering.js`** - Advanced filtering scenarios

   - Function-based filters
   - Complex filtering logic
   - Multiple filter types

### 7️⃣ Query Explainability

- **`08-explain-scores.js`** - Understand WHY documents were retrieved

   - See query terms and matches
   - Understand similarity scores
   - Debug retrieval results

### 8️⃣ Prompt Management

- **`09-prompt-management.js`** - Dynamic prompt templates

   - 10 built-in templates
   - Custom prompt functions
   - System prompts and roles

### 9️⃣ Decision Engine (Simple)

- **`10-decision-engine-simple.js`** - Smart document selection

   - Multi-criteria weighted scoring
   - 5-factor evaluation system
   - Customizable weights

### 🔟 Decision Engine (PDF Real-World)

- **`11-decision-engine-pdf-real-world.js`** - Real-world PDF scenario

   - PDF document loading
   - Multiple source types
   - Scenario customization

### 1️⃣2️⃣ Full-Featured RAG Demo (NEW! v2.4.0)

- **`21-full-featured-rag.js`** - Comprehensive integration demo

   - 🔪 **Robust Chunking** (Abbreviation awareness)
   - 💬 **Conversation Management** (History & Context)
   - 🚀 **Caching Layer** (Embedding & Query)
   - 🔍 **Rich Explanations** (Density & Snippets)
   - 📄 **Real Document Loading** (PDF & Directory)
   - 🎨 **Multi-model Support** (Ollama 🦙)

   **Models Used:**
   - LLM: `granite4:3b`
   - Embedding: `qwen3-embedding:0.6b`
   
   **Provider Configuration:**
   - Auto-detect (default): Tries LM Studio first, falls back to Ollama
   - Force LM Studio: Set `USE_LMSTUDIO=true` or edit file: `const USE_LMSTUDIO = true`
   - Force Ollama: Set `USE_LMSTUDIO=false` or edit file: `const USE_LMSTUDIO = false`
   
   **LM Studio Models:**
   - LLM Model: `google/gemma-3-4b`
   - Embedding Model: `text-embedding-qwen3-embedding-0.6b`
   
   **Ollama Models:**
   - LLM Model: `granite4:3b`
   - Embedding Model: `qwen3-embedding:0.6b`

## 🚀 Quick Start

### With Ollama

```bash
# Make sure Ollama is running
ollama serve

# Install models
ollama pull qwen3-embedding:0.6b
ollama pull granite4:3b

# Default Ollama chat model in examples
# granite4:3b

# Run examples
node example/01-basic-usage.js
node example/02-document-loading.js
node example/03-metadata-filtering.js
node example/05-streaming.js

# Example 12: Conversation History & Export (Auto-detects provider)
node example/12-conversation-history-and-export.js

# Force LM Studio for Example 12
USE_LMSTUDIO=true node example/12-conversation-history-and-export.js

# Force Ollama for Example 12
USE_LMSTUDIO=false node example/12-conversation-history-and-export.js

# Or run with LM Studio-specific examples:
node example/01-basic-usage-lmstudio.js
node example/02-document-loading-lmstudio.js
node example/03-metadata-filtering-lmstudio.js
node example/05-streaming-lmstudio.js
```

### With LM Studio

```bash
# 1. Open LM Studio
# 2. Load a model (e.g., qwen3-4b, gemma-3-4b)
# 3. Make sure text-embedding-qwen3-embedding-0.6b is available
# 4. Enable local server: Settings → Local Server → Start

# Run examples
node example/01-basic-usage-lmstudio.js
node example/02-document-loading-lmstudio.js
node example/03-metadata-filtering-lmstudio.js
node example/05-streaming-lmstudio.js
```

### Test Both

```bash
# Automatically detect and test available providers
node example/04-test-both-providers.js
```

## 📄 Document Loading Examples

To test PDF loading (examples 02):

```bash
# Create PDF folder
mkdir example/PDF

# Add some PDF files to the folder
# Then run
node example/02-document-loading.js
# or
node example/02-document-loading-lmstudio.js
```

## 💡 Tips

- **Start here**: `01-basic-usage.js` (Ollama) or `01-basic-usage-lmstudio.js` (LM Studio)
- **Test setup**: `04-test-both-providers.js`
- **Check errors**: All examples have helpful error messages
- **Streaming**: Try `05-streaming.js` for better user experience
- **New features**: Try `12-conversation-history-and-export.js` for conversation management

## 📋 Requirements

All examples work with a running Ollama server. Make sure you have:

- **Node.js** 18+ (for native fetch support)

### Ollama

- Ollama running: `ollama serve`
- Models: `qwen3-embedding:0.6b`, `granite4:3b`

### LM Studio

- LM Studio app running
- Local server enabled
- Models loaded: any LLM + `text-embedding-qwen3-embedding-0.6b` embedding

## 📖 Full Documentation

See main [README.md](../README.md) for complete API reference.

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| `Connection refused` | Start Ollama: `ollama serve` or LM Studio server |
| `Model not found` | Pull model: `ollama pull <model>` or download in LM Studio |
| `Import errors` | Run from project root: `node example/...` |

## 🎯 What's New in Examples?

### Example 21: Full-Featured RAG Demo (v2.4.0)

**New Features Demonstrated:**

1. **Robust Chunking**
   - Handles abbreviations (Dr., Prof., LTD.) during sentence splitting.
   - Prevents word cutting in the middle of chunks.

2. **Rich Explainability**
   - See detailed reasons for retrieval.
   - Access context-aware snippets and keyword density metrics.

3. **Integrated Pipeline**
   - Combines `ConversationManager`, `CacheManager`, and `Retriever`.
   - Loads real PDF documents from a directory.

**Usage:**

```bash
# Ensure you have the models
ollama pull granite4:3b
ollama pull qwen3-embedding:0.6b

# Run the example
node example/21-full-featured-rag.js
```

## 🤝 Contributing

See more examples? Have suggestions? Open an issue or PR!

**Made with ⚡ by Quick RAG**
