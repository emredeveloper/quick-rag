# RAG Ollama JS (starter)

Minimal scaffold for a Retrieval-Augmented Generation (RAG) library targeting React-like frameworks and local Ollama models.

Key ideas:
- Pluggable embedding function (Ollama may not provide embeddings; use external or local embedding provider)
- Simple in-memory vector store (for prototype)
- Retriever + RAG pipeline that injects retrieved documents into prompts
- Optional adapter to official `ollama-js` if available; otherwise uses local HTTP endpoint (configurable)

See `example/` for a minimal usage demo.

## Installation

```bash
npm install js-rag-local-llm
```

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

## Examples

### Quick Start (React + API proxy)

Install the library and add a minimal API proxy to reach your local Ollama server (browsers cannot call it directly due to CORS):

```javascript
// pages/api/rag-generate.js (Next.js Pages Router example)
import { OllamaClient } from 'js-rag-local-llm';

export default async function handler(req, res) {
  try {
    const { model, prompt } = req.body || {};
    const client = new OllamaClient();
    const raw = await client.generate(model || 'granite4:tiny-h', prompt);
    let text = '';
    if (typeof raw === 'string') {
      for (const line of raw.split(/\r?\n/)) {
        try { const obj = JSON.parse(line.trim()); text += obj.response || ''; } catch {}
      }
    } else if (raw && raw.response) {
      text = String(raw.response);
    } else {
      text = String(raw);
    }
    res.status(200).json({ response: text.trim() });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}
```

Use the hook directly in your app:

```jsx
// App.jsx
import { useEffect, useState } from 'react';
import { useRAG, initRAG, createBrowserModelClient } from 'js-rag-local-llm';

const docs = [
  { id: '1', text: 'React is a JavaScript library for building user interfaces.' },
  { id: '2', text: 'Ollama provides local LLM hosting.' },
  { id: '3', text: 'RAG uses retrieval to augment model responses.' }
];

export default function App() {
  const [{ retriever }, setCore] = useState({});
  const [query, setQuery] = useState('');
  const { run, loading, error, response, docs: retrieved } = useRAG({
    retriever,
    modelClient: createBrowserModelClient(),
    model: 'granite4:tiny-h'
  });

  useEffect(() => { initRAG(docs).then(setCore); }, []);

  return (
    <div>
      <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Ask something..." />
      <button onClick={() => run(query)} disabled={loading || !retriever}>Ask</button>
      {error && <div style={{color:'red'}}>Error: {String(error)}</div>}
      {!!retrieved?.length && <ul>{retrieved.map(d => <li key={d.id}>[{d.id}] {d.text}</li>)}</ul>}
      {response && <pre>{response}</pre>}
    </div>
  );
}
```

### Basic RAG Example

Run the local example with a question:

```bash
npm start -- "What is React?"
```

Enable real model calls on Windows Command Prompt (cmd):

```bash
set OLLAMA_TEST=1
npm start -- "What is React?"
```

If `OLLAMA_TEST` is NOT set, the script prints the retrieved documents and the constructed prompt only. If set, it will also call the local Ollama server and print the model's answer. Default model is `granite4:tiny-h`, and the embedding model is `embeddinggemma`.

### MRL (Mixed-Resolution Layers) Example

Compare similarity at 128- and 256-dim embeddings:

```bash
node ./example/mrl-example.js
```

This script prints similarity scores for both dimensions and a brief comparison per document.

### React Quick Start (App.jsx)

Add a minimal API route in your app (Next.js example) to proxy Ollama calls:

```javascript
// pages/api/rag-generate.js
import { OllamaClient } from 'js-rag-local-llm';

export default async function handler(req, res) {
  try {
    const { model, prompt } = req.body || {};
    const client = new OllamaClient();
    const raw = await client.generate(model || 'granite4:tiny-h', prompt);
    let text = '';
    if (typeof raw === 'string') {
      for (const line of raw.split(/\r?\n/)) {
        try { const obj = JSON.parse(line.trim()); text += obj.response || ''; } catch {}
      }
    } else if (raw && raw.response) {
      text = String(raw.response);
    } else {
      text = String(raw);
    }
    res.status(200).json({ response: text.trim() });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}
```

Then use the hook directly in your component:

```jsx
// App.jsx
import { useEffect, useState } from 'react';
import { useRAG, initRAG, createBrowserModelClient } from 'js-rag-local-llm';

const docs = [
  { id: '1', text: 'React is a JavaScript library for building user interfaces.' },
  { id: '2', text: 'Ollama provides local LLM hosting.' },
  { id: '3', text: 'RAG uses retrieval to augment model responses.' }
];

export default function App() {
  const [{ retriever }, setCore] = useState({});
  const [query, setQuery] = useState('');
  const { run, loading, error, response, docs: retrieved } = useRAG({
    retriever,
    modelClient: createBrowserModelClient(),
    model: 'granite4:tiny-h'
  });

  useEffect(() => {
    initRAG(docs).then(setCore);
  }, []);

  return (
    <div>
      <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Ask something..." />
      <button onClick={() => run(query)} disabled={loading || !retriever}>Ask</button>
      {error && <div style={{color:'red'}}>Error: {String(error)}</div>}
      {!!retrieved?.length && (
        <ul>{retrieved.map(d => <li key={d.id}>[{d.id}] {d.text}</li>)}</ul>
      )}
      {response && <pre>{response}</pre>}
    </div>
  );
}
```