# RAG Ollama JS (starter)

Minimal RAG utilities for React apps using local Ollama models.

## Installation

```bash
npm install js-rag-local-llm
```

## Quick Start (React + API proxy)

Add a minimal API route to proxy your local Ollama server (browsers cannot call it directly due to CORS):

```javascript
// pages/api/rag-generate.js (Next.js)
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

Use the hook in your component:

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

Notes:
- Default model: `granite4:tiny-h`, default embedding model: `embeddinggemma`.
- Adjust `OllamaClient({ baseUrl: 'http://localhost:11434/api' })` if needed.