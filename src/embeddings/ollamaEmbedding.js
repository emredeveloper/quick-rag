import OllamaClient from '../ollamaClient.js';

// Embedding adapter that uses a local Ollama server.
// Defaults to model 'embeddinggemma' (per your instruction).
export default function createOllamaEmbedding({ baseUrl, model = 'embeddinggemma', headers } = {}) {
  const client = new OllamaClient({ baseUrl, headers });

  return async function ollamaEmbedding(text) {
    // Ollama embed endpoint accepts `input` as string or array.
    const resp = await client.embed(model, text);
    // The response shape from Ollama embed endpoint may be:
    // { data: [ { embedding: [...] } ] }
    // { embeddings: [[...]] }
    // or other variations. Accept common shapes and return a flat vector.
    if (!resp) throw new Error('empty embedding response from Ollama');

    // If API returns top-level `embeddings: [[...]]`
    if (resp.embeddings && Array.isArray(resp.embeddings) && resp.embeddings[0]) {
      const first = resp.embeddings[0];
      if (Array.isArray(first) && typeof first[0] === 'number') return first;
      if (first && Array.isArray(first.embedding)) return first.embedding;
    }

    // If the client returns { data: [ { embedding: [...] } ] }
    if (resp.data && Array.isArray(resp.data) && resp.data[0]) {
      const d0 = resp.data[0];
      if (Array.isArray(d0)) return d0;
      if (d0.embedding && Array.isArray(d0.embedding)) return d0.embedding;
      return d0;
    }

    // If the response is a simple array of numbers
    if (Array.isArray(resp) && typeof resp[0] === 'number') return resp;

    // If the response is an array wrapper like [ { embedding: [...] } ]
    if (Array.isArray(resp) && resp[0] && Array.isArray(resp[0].embedding)) return resp[0].embedding;

    // If the response has `embedding` key at top-level
    if (resp.embedding && Array.isArray(resp.embedding)) return resp.embedding;

    throw new Error('Unrecognized embedding response shape from Ollama: ' + JSON.stringify(resp).slice(0, 200));
  };
}

export { createOllamaEmbedding };
