# Quick RAG - Quick Start Examples

Ready-to-run examples that use `quick-rag` from NPM (v2.0.3+).

## 🆕 v2.0.3 Performance Features

**New performance improvements:**
- ✅ Batch embedding for large documents
- ✅ Rate limiting to prevent server overload
- ✅ Enhanced progress tracking
- ✅ Better error handling

## 🆕 v2.0.0 New Features Showcase

**Quick demos of the most powerful v2.0.0 features:**

### 1. Features Showcase
```bash
npm run v2:features
# or: node v2-features-showcase.js
```
**Demonstrates:**
- ✅ Decision Engine - Multi-criteria weighted scoring
- ✅ Query Explainability - Understand WHY documents were retrieved
- ✅ Comparison: Basic vs Smart Retrieval

### 2. Prompt Management & Conversation History
```bash
npm run v2:prompts
# or: node v2-prompt-conversation.js
```
**Demonstrates:**
- ✅ Dynamic Prompt Management - 10 built-in templates
- ✅ Custom PromptManager configurations
- ✅ Conversation History tracking and export

### 3. Multi-Provider Auto-Detection
```bash
npm run v2:auto
# or: node v2-auto-detection.js
```
**Demonstrates:**
- ✅ Automatic provider detection (Ollama or LM Studio)
- ✅ Seamless switching between providers
- ✅ Zero configuration needed

---

## Legacy Examples

Examples are organized by provider:
- **`ollama/`** - Examples using Ollama (examples 01-09)
- **`lmstudio/`** - Examples using LM Studio (examples 01-03)

## Setup

```bash
npm install
```

### For Ollama Examples

Make sure Ollama is running with required models:
```bash
ollama pull granite4:3b
ollama pull embeddinggemma:latest
```

### For LM Studio Examples

1. Download and install [LM Studio](https://lmstudio.ai/)
2. Load a model (Llama 3.2, Mistral, etc.)
3. Load embedding model (text-embedding-nomic-embed-text-v1.5)
4. Start local server (port 1234)

---

## Ollama Examples

### 1. Basic Usage
```bash
npm run ollama:01
# or: node ollama/01-basic-usage.js
```
Shows basic RAG setup with document storage and querying.

### 2. Document Loading
```bash
npm run ollama:02
# or: node ollama/02-document-loading.js
```
Demonstrates loading multiple documents and querying different topics.

### 3. Streaming
```bash
npm run ollama:03
# or: node ollama/03-streaming.js
```
Shows how to use streaming responses from Ollama.

### 4. Metadata Filtering
```bash
npm run ollama:04
# or: node ollama/04-metadata-filtering.js
```
Demonstrates filtering documents by metadata properties.

### 5. Decision Engine
```bash
npm run ollama:05
# or: node ollama/05-decision-engine.js
```
Shows the advanced Decision Engine with multi-criteria scoring.

### 6. Real-World PDF Loading
```bash
npm run ollama:06
# or: node ollama/06-pdf-real-world.js
```
**Requires: `npm install pdf-parse`**

Demonstrates loading and querying real PDF documents with:
- Automatic PDF text extraction
- Multiple queries on same documents
- Different prompt templates (technical, academic, detailed)

### 7. PDF with Decision Engine
```bash
npm run ollama:07
# or: node ollama/07-pdf-with-decision-engine.js
```
**Requires: `npm install pdf-parse`**

Advanced example combining PDFs with Decision Engine:
- Multi-criteria scoring on PDF content
- Comparison: normal vs smart retrieval
- Quality metrics and decision transparency
- Academic-focused retrieval optimization

### 8. Multiple Document Types
```bash
npm run ollama:08
# or: node ollama/08-multiple-document-types.js
```
**Requires: `npm install pdf-parse mammoth xlsx officeparser`**

Load and query multiple document formats:
- PDF, Word (.docx), Excel (.xlsx), PowerPoint (.pptx)
- Text (.txt), Markdown (.md), JSON
- Cross-document semantic search
- Type-specific filtering

### 9. Multi-Format with Decision Engine
```bash
npm run ollama:09
# or: node ollama/09-multiformat-decision-engine.js
```
**Requires: `npm install pdf-parse mammoth xlsx officeparser`**

Most advanced example with Ollama - combines everything:
- Multiple document formats (PDF, Word, Excel, etc.)
- Decision Engine with type-aware quality scoring
- Intelligent prioritization by format and content
- Comprehensive cross-document analysis

---

## LM Studio Examples

### 1. LM Studio Basic Usage
```bash
npm run lmstudio:01
# or: node lmstudio/01-basic.js
```

Same functionality as Ollama Example 01 but with LM Studio:
- Basic RAG setup and querying
- Document storage
- Custom prompt templates
- Metadata filtering

### 2. LM Studio Streaming
```bash
npm run lmstudio:02
# or: node lmstudio/02-streaming.js
```

Shows streaming responses with LM Studio:
- Real-time token streaming
- Better user experience
- Performance metrics (tokens/second)
- Comparison with non-streaming

### 3. LM Studio with Documents
```bash
npm run lmstudio:03
# or: node lmstudio/03-documents.js
```
**Requires: `npm install pdf-parse mammoth xlsx officeparser`**

Load multiple document types with LM Studio:
- PDF, Word, Excel, PowerPoint
- Cross-document search
- Streaming responses
- Type-specific filtering

---

## 🔄 Switching Between Ollama and LM Studio

It's super easy! Just change 2 lines:

```javascript
// Ollama version
import { OllamaRAGClient, createOllamaRAGEmbedding } from 'quick-rag';
const client = new OllamaRAGClient();
const embed = createOllamaRAGEmbedding(client, 'nomic-embed-text');

// LM Studio version
import { LMStudioRAGClient, createLMStudioRAGEmbedding } from 'quick-rag';
const client = new LMStudioRAGClient();
const embed = createLMStudioRAGEmbedding(client, 'text-embedding-nomic-embed-text-v1.5');
```

Everything else stays exactly the same! ✨

---

## What's Inside?

All examples use the published `quick-rag` package from NPM:

```javascript
import { 
  OllamaRAGClient, 
  createOllamaRAGEmbedding,
  InMemoryVectorStore, 
  Retriever,
  SmartRetriever,
  generateWithRAG
} from 'quick-rag';
```

## Requirements

### For Ollama Examples (01-09)
- Node.js 18+
- Ollama running locally (http://127.0.0.1:11434)
- Models: `granite4:3b` and `nomic-embed-text`

### For LM Studio Examples (10-12)
- Node.js 18+
- [LM Studio](https://lmstudio.ai/) installed and running
- Any model loaded (Llama 3.2, Mistral, Phi-3, etc.)
- Local server started on port 1234

## Troubleshooting

### Ollama Issues

**Ollama not running:**
```bash
# Start Ollama
ollama serve
```

**Models not found:**
```bash
ollama pull granite4:3b
ollama pull nomic-embed-text
```

### LM Studio Issues

**Cannot connect to LM Studio:**
1. Make sure LM Studio is running
2. Go to "Local Server" tab
3. Load a model (recommended: Llama 3.2 3B or Mistral 7B)
4. Click "Start Server"
5. Verify it's running on http://localhost:1234

**Which model to use?**
- Small/Fast: Llama 3.2 3B, Phi-3 Mini
- Balanced: Mistral 7B, Llama 3.1 8B
- Best Quality: Llama 3.1 70B (requires powerful GPU)

### General Issues

**Module not found:**
```bash
npm install
```

**Document parsing errors:**
```bash
npm install pdf-parse mammoth xlsx officeparser
```
