# Quick RAG - Quick Start Examples

Ready-to-run examples that use `quick-rag` from NPM.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Make sure Ollama is running with required models:
```bash
ollama pull granite4:3b
ollama pull nomic-embed-text
```

## Examples

### 1. Basic Usage
```bash
npm run 01
# or: node 01-basic-usage.js
```
Shows basic RAG setup with document storage and querying.

### 2. Document Loading
```bash
npm run 02
# or: node 02-document-loading.js
```
Demonstrates loading multiple documents and querying different topics.

### 3. Streaming
```bash
npm run 03
# or: node 03-streaming.js
```
Shows how to use streaming responses from Ollama.

### 4. Metadata Filtering
```bash
npm run 04
# or: node 04-metadata-filtering.js
```
Demonstrates filtering documents by metadata properties.

### 5. Decision Engine
```bash
npm run 05
# or: node 05-decision-engine.js
```
Shows the advanced Decision Engine with multi-criteria scoring.

### 6. Real-World PDF Loading
```bash
npm run 06
# or: node 06-pdf-real-world.js
```
**Requires: `npm install pdf-parse`**

Demonstrates loading and querying real PDF documents with:
- Automatic PDF text extraction
- Multiple queries on same documents
- Different prompt templates (technical, academic, detailed)

### 7. PDF with Decision Engine
```bash
npm run 07
# or: node 07-pdf-with-decision-engine.js
```
**Requires: `npm install pdf-parse`**

Advanced example combining PDFs with Decision Engine:
- Multi-criteria scoring on PDF content
- Comparison: normal vs smart retrieval
- Quality metrics and decision transparency
- Academic-focused retrieval optimization

### 8. Multiple Document Types
```bash
npm run 08
# or: node 08-multiple-document-types.js
```
**Requires: `npm install pdf-parse mammoth xlsx`**

Load and query multiple document formats:
- PDF, Word (.docx), Excel (.xlsx)
- Text (.txt), Markdown (.md), JSON
- Cross-document semantic search
- Type-specific filtering

### 9. Multi-Format with Decision Engine
```bash
npm run 09
# or: node 09-multiformat-decision-engine.js
```
**Requires: `npm install pdf-parse mammoth xlsx`**

Most advanced example - combines everything:
- Multiple document formats (PDF, Word, Excel, etc.)
- Decision Engine with type-aware quality scoring
- Intelligent prioritization by format and content
- Comprehensive cross-document analysis

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

- Node.js 18+
- Ollama running locally (http://127.0.0.1:11434)
- Models: `granite4:3b` and `nomic-embed-text`

## Troubleshooting

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

**Module not found:**
```bash
npm install
```
