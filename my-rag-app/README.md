# Quick RAG Chat App

A modern React application for RAG (Retrieval-Augmented Generation) powered by Quick RAG library.

## Features

- 💬 **Conversation History** - Track all your queries and responses
- 📊 **Analytics Dashboard** - View usage statistics and performance metrics
- 🔍 **Advanced Search & Filtering** - Search documents and filter by metadata
- 📥 **Import/Export** - Import and export conversation history
- 🌊 **Streaming Responses** - Real-time token-by-token response generation
- 🌓 **Dark/Light Theme** - Toggle between dark and light modes
- 📁 **File Upload** - Upload documents (txt, md, json, pdf, docx, xlsx)
- ⚙️ **Settings Panel** - Configure model, topK, and streaming options
- ⚡ **Batch Processing** - Efficient handling of large PDFs (v2.0.3!)
- 🚦 **Rate Limiting** - Prevents server overload (v2.0.3!)

## Setup

This app uses the `quick-rag` npm package (v2.0.3+).

### Prerequisites

- Node.js 18+
- Ollama running locally (`ollama serve`)
- Required models:
  - `ollama pull granite4:3b` (or your preferred model)
  - `ollama pull embeddinggemma:latest`

### Installation

```bash
cd my-rag-app
npm install
```

This will install `quick-rag` from npm registry (v2.0.3+).

### Running

```bash
npm run dev
```

This will start:
- Backend server on `http://127.0.0.1:3001`
- Frontend dev server (Vite) on `http://localhost:5173`

## Usage

1. **Add Documents**: Use the "Upload" button or add text directly
   - Large PDFs are automatically chunked and processed in batches
   - Progress tracking shows embedding progress
2. **Ask Questions**: Type your question and press Enter or click the send button
3. **View History**: All conversations are automatically saved
4. **Export/Import**: Export conversations as JSON or import previous conversations
5. **Analytics**: Click the Analytics button to view usage statistics

## Configuration

- **Model**: Change the LLM model in Settings
- **Top K**: Adjust the number of retrieved documents (1-10)
- **Streaming**: Enable/disable real-time streaming responses

## Performance Features (v2.0.3+)

- **Batch Processing**: Large documents are processed in batches (20 chunks at a time)
- **Rate Limiting**: Maximum 5 concurrent embedding requests to prevent server overload
- **Progress Tracking**: Real-time progress updates during document embedding
- **Error Handling**: Improved error messages and automatic retry logic

## Technical Details

- **Frontend**: React 19 + Vite
- **Backend**: Express.js
- **RAG Library**: quick-rag v2.0.3+ (npm package)
- **Styling**: Inline styles with dark/light theme support
