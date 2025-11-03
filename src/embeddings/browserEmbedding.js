// Browser embedding adapter that calls a server proxy endpoint (e.g., /api/embed)
// options: { endpoint?: string, model?: string, headers?: object }
export default function createBrowserEmbedding({ endpoint = '/api/embed', model = 'embeddinggemma', headers } = {}) {
  return async function browserEmbedding(text) {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(headers || {}) },
      body: JSON.stringify({ model, input: text })
    });
    if (!res.ok) {
      const msg = await res.text();
      throw new Error(`embed request failed ${res.status}: ${msg}`);
    }
    const resp = await res.json();

    // Accept common Ollama embed response shapes
    if (resp?.embeddings?.[0]) {
      const first = resp.embeddings[0];
      if (Array.isArray(first)) return first;
      if (first?.embedding && Array.isArray(first.embedding)) return first.embedding;
    }
    if (resp?.data?.[0]) {
      const d0 = resp.data[0];
      if (Array.isArray(d0)) return d0;
      if (Array.isArray(d0?.embedding)) return d0.embedding;
      return d0;
    }
    if (Array.isArray(resp) && typeof resp[0] === 'number') return resp;
    if (Array.isArray(resp) && Array.isArray(resp[0]?.embedding)) return resp[0].embedding;
    if (Array.isArray(resp?.embedding)) return resp.embedding;

    throw new Error('Unrecognized embedding response shape: ' + JSON.stringify(resp).slice(0, 200));
  };
}

export { createBrowserEmbedding };


