# RAG Ollama JS (starter)

Minimal scaffold for a Retrieval-Augmented Generation (RAG) library targeting React-like frameworks and local Ollama models.

Key ideas:
- Pluggable embedding function (Ollama may not provide embeddings; use external or local embedding provider)
- Simple in-memory vector store (for prototype)
- Retriever + RAG pipeline that injects retrieved documents into prompts
- Optional adapter to official `ollama-js` if available; otherwise uses local HTTP endpoint (configurable)

See `example/` for a minimal usage demo.

Assumptions:
- Ollama local server is reachable at a configurable base URL (default: `http://localhost:11434`). Endpoint paths can vary by Ollama version; the client supports configuration.

Try it (quick):

1. Install dependencies:

```bash
cd C:\Users\emreq\Desktop\javascript-ai
npm install
```

2. Run tests (smoke tests for vector store & retriever):

```bash
npm test
```

3. Run the example (prints retrieved docs and the prompt). To enable a real Ollama call set `OLLAMA_TEST=1` and run a local Ollama server:

```bash
set OLLAMA_TEST=1
npm start
```

Notes:
- The `OllamaClient` is a small adapter that posts to a configurable local endpoint; adjust `baseUrl` or use the official `ollama-js` client if you prefer.
- You can use Ollama for embeddings and generation. Defaults in the example:
  - main model: `granite4:tiny-h`
  - embedding model: `embeddinggemma`
  To enable real Ollama calls set `OLLAMA_TEST=1` and ensure a local Ollama server is running (API base: `http://localhost:11434/api`).