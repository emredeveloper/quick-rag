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
- This project uses a dummy, deterministic embedding for demos. Replace `src/embeddings/dummyEmbedding.js` with a real embedding provider for production.
- The `OllamaClient` is a small adapter that posts to a configurable local endpoint; adjust `baseUrl` or use the official `ollama-js` client if you prefer.
- This project uses a dummy, deterministic embedding for demos. Replace `src/embeddings/dummyEmbedding.js` with a real embedding provider for production.
- You can use Ollama for embeddings and generation. Defaults in the example:

- You can use Ollama for embeddings and generation. Defaults in the example:
  - main model: `granite4:tiny-h`
  - embedding model: `embeddinggemma`
  To enable real Ollama calls set `OLLAMA_TEST=1` and ensure a local Ollama server is running (API base: `http://localhost:11434/api`).

Publish to npm
--------------

To publish this package to npm (prepare the repository first and replace the placeholder repository fields in `package.json`):

1. Update `package.json` repository fields (`url`, `homepage`, `bugs`) with your repository details.
2. Ensure you are logged in to npm and have permission to publish the package name:

```cmd
npm login
```

3. (Optional) Run tests and linting locally:

```cmd
npm test
```

4. Publish (this project sets `publishConfig.access` to `public`):

```cmd
npm publish --access public
```

Notes:
- The `prepublishOnly` script runs `npm test` to prevent accidental publishes with failing tests.
- The `files` field in `package.json` restricts what is included in the package; it contains `src/`, `README.md`, and `LICENSE`. The `.npmignore` also excludes `test/` and `example/`.

If you want, I can:
- Create a GitHub repo with this code and update `package.json` automatically.
- Add CI (GitHub Actions) to run tests on push and to publish on new tags.

