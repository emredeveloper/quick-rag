// server.js
import express from 'express';
import { OllamaClient } from 'js-rag-local-llm';

const app = express();
app.use(express.json());

// Text generate
app.post('/api/rag-generate', async (req, res) => {
  try {
    const { model, prompt } = req.body || {};
    const client = new OllamaClient({ baseUrl: 'http://127.0.0.1:11434/api' });
    const raw = await client.generate(model || 'granite4:tiny-h', prompt);

    let text = '';
    if (typeof raw === 'string') {
      for (const line of raw.split(/\r?\n/)) {
        try { const obj = JSON.parse(line.trim()); text += obj.response || ''; } catch {}
      }
    } else if (raw?.response) text = String(raw.response);
    else text = String(raw);

    res.json({ response: text.trim() });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Embeddings
app.post('/api/embed', async (req, res) => {
  try {
    const { model = 'embeddinggemma', input } = req.body || {};
    const client = new OllamaClient({ baseUrl: 'http://127.0.0.1:11434/api' });
    const resp = await client.embed(model, input);
    res.json(resp);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.listen(3001, () => console.log('API proxy http://127.0.0.1:3001'));