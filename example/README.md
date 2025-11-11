# Quick RAG Examples

Clear examples showing how to use quick-rag with both **Ollama** and **LM Studio**.

**Using quick-rag v2.0.3+** with batch processing and rate limiting for optimal performance.

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

### 1️⃣1️⃣ Conversation History & Export (NEW!)

- **`12-conversation-history-and-export.js`** - Conversation management

   - 💬 Track multiple query-response pairs
   - 💾 Export conversations to JSON
   - 📚 Document CRUD operations
   - ⚙️ Settings management
   - 🔄 Multi-query sessions
   - 📊 Conversation statistics
   - 🎨 Multi-Provider Support (Ollama 🦙 & LM Studio 🎨)
   - 🔍 Auto-detection (automatically detects available provider)
   - 🔧 Manual provider selection via USE_LMSTUDIO flag or environment variable
   
   **Provider Configuration:**
   - Auto-detect (default): Tries LM Studio first, falls back to Ollama
   - Force LM Studio: Set `USE_LMSTUDIO=true` or edit file: `const USE_LMSTUDIO = true`
   - Force Ollama: Set `USE_LMSTUDIO=false` or edit file: `const USE_LMSTUDIO = false`
   
   **LM Studio Models:**
   - LLM Model: `qwen/qwen3-4b-2507`
   - Embedding Model: `text-embedding-embeddinggemma-300m`
   
   **Ollama Models:**
   - LLM Model: `granite4:3b`
   - Embedding Model: `embeddinggemma:latest`

## 🚀 Quick Start

### With Ollama

```bash
# Make sure Ollama is running
ollama serve

# Install models
ollama pull embeddinggemma
ollama pull granite4:tiny-h

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
# 3. Make sure nomic-embed-text-v1.5 is available
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
- Models: `embeddinggemma`, `granite4:tiny-h`

### LM Studio

- LM Studio app running
- Local server enabled
- Models loaded: any LLM + `nomic-embed-text-v1.5` embedding

## 📖 Full Documentation

See main [README.md](../README.md) for complete API reference.

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| `Connection refused` | Start Ollama: `ollama serve` or LM Studio server |
| `Model not found` | Pull model: `ollama pull <model>` or download in LM Studio |
| `Import errors` | Run from project root: `node example/...` |

## 🎯 What's New in Examples?

### Example 12: Conversation History & Export

**New Features Demonstrated:**

1. **Conversation History Manager**
   - Track multiple query-response pairs
   - Store metadata (timestamp, topK, retrieved docs)
   - Manage conversation sessions

2. **Export Functionality**
   - Export conversations to JSON
   - Include all metadata and context
   - Save conversation history to file

3. **Document Management**
   - Add, update, delete documents
   - Track document changes
   - Manage document metadata

4. **Settings Management**
   - Change model on the fly
   - Adjust topK dynamically
   - Test different configurations

5. **Multi-Query Session**
   - Ask multiple questions in sequence
   - Build conversation context
   - Export complete session

**Usage:**

```bash
# Run the example
node example/12-conversation-history-and-export.js

# Check the exports folder for JSON file
cat exports/conversation-*.json
```

**Output:**

- Conversation session with multiple queries
- Exported JSON file with full conversation history
- Document CRUD operations demonstration
- Settings management examples
- Statistics and summaries

## 🤝 Contributing

See more examples? Have suggestions? Open an issue or PR!

**Made with ⚡ by Quick RAG**
