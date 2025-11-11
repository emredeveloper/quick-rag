// Browser embedding adapter that calls a server proxy endpoint (e.g., /api/embed)
// options: { endpoint?: string, model?: string, headers?: object }
export default function createBrowserEmbedding({ endpoint = '/api/embed', model = 'embeddinggemma', headers } = {}) {
  return async function browserEmbedding(text) {
    try {
      // Support both single text and batch (array of texts)
      const isBatch = Array.isArray(text);
      const input = isBatch ? text : [text];
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(headers || {}) },
        body: JSON.stringify({ model, input })
      });
      
      if (!res.ok) {
        const msg = await res.text().catch(() => 'Unknown error');
        throw new Error(`Embedding request failed ${res.status}: ${msg}`);
      }
      
      const resp = await res.json();

      // Accept common Ollama embed response shapes
      if (resp?.embeddings) {
        if (isBatch) {
          // Return array of vectors for batch
          return resp.embeddings.map(emb => {
            if (Array.isArray(emb)) return emb;
            if (emb?.embedding && Array.isArray(emb.embedding)) return emb.embedding;
            return emb;
          });
        } else {
          // Return single vector
          const first = resp.embeddings[0];
          if (Array.isArray(first)) return first;
          if (first?.embedding && Array.isArray(first.embedding)) return first.embedding;
        }
      }
      
      if (resp?.data) {
        if (isBatch) {
          return resp.data.map(d0 => {
            if (Array.isArray(d0)) return d0;
            if (Array.isArray(d0?.embedding)) return d0.embedding;
            return d0;
          });
        } else {
          const d0 = resp.data[0];
          if (Array.isArray(d0)) return d0;
          if (Array.isArray(d0?.embedding)) return d0.embedding;
          return d0;
        }
      }
      
      if (Array.isArray(resp) && typeof resp[0] === 'number') {
        return isBatch ? resp : resp[0];
      }
      
      if (Array.isArray(resp) && Array.isArray(resp[0]?.embedding)) {
        return isBatch ? resp.map(r => r.embedding) : resp[0].embedding;
      }
      
      if (Array.isArray(resp?.embedding)) {
        return isBatch ? resp.embedding : resp.embedding[0];
      }

      throw new Error('Unrecognized embedding response shape: ' + JSON.stringify(resp).slice(0, 200));
    } catch (error) {
      // Provide helpful error messages
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error(`Cannot connect to embedding server. Make sure backend is running on port 3001 and Vite proxy is configured correctly. Endpoint: ${endpoint}`);
      }
      throw error;
    }
  };
}

export { createBrowserEmbedding };


