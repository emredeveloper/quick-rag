// Minimal Ollama client adapter.
// Assumptions: local Ollama server available at baseUrl (default http://localhost:11434).
// If the official `ollama` JS client is installed, you can pass a custom `requestFn`.

import fetch from 'node-fetch';

// Minimal Ollama client adapter using the documented base API path (/api).
// Docs: https://docs.ollama.com/api
export default class OllamaClient {
  constructor(options = {}) {
    // Ollama's API base (documented): http://localhost:11434/api
    this.baseUrl = options.baseUrl || process.env.OLLAMA_HOST || 'http://localhost:11434/api';
    this.requestFn = options.requestFn || this._defaultRequest.bind(this);
    this.headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
  }

  async _defaultRequest(path, opts = {}) {
    const buildUrl = host => `${host.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;

    const tryFetch = async url => {
      const res = await fetch(url, opts);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Ollama request failed ${res.status}: ${text}`);
      }
      const txt = await res.text();
      try {
        return JSON.parse(txt);
      } catch {
        return txt;
      }
    };

    const url = buildUrl(this.baseUrl);
    try {
      return await tryFetch(url);
    } catch (err) {
      // If connection refused to localhost/::1, try IPv4 localhost as a fallback.
      const isConnRefused = err && (err.code === 'ECONNREFUSED' || (err.message && err.message.includes('ECONNREFUSED')));
      if (isConnRefused && this.baseUrl.includes('localhost')) {
        const ipv4Base = this.baseUrl.replace('localhost', '127.0.0.1');
        const url2 = buildUrl(ipv4Base);
        try {
          return await tryFetch(url2);
        } catch (err2) {
          // Preserve original error context but include second attempt info
          err2.message = `${err2.message} (also attempted ${url2})`;
          throw err2;
        }
      }
      throw err;
    }
  }

  // Generate text from a model. Default: POST to /api/generate with {model, prompt}
  async generate(model, prompt, opts = {}) {
    const path = opts.path || 'generate';
    const body = Object.assign({ model, prompt }, opts.body || {});
    return this.requestFn(path, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(body),
    });
  }

  // Generate embeddings via Ollama's /api/embed endpoint. Returns whatever the API returns.
  // Default model for embeddings will be provided by callers (we'll default to 'embeddinggemma' elsewhere).
  async embed(model, input, opts = {}) {
    const path = opts.path || 'embed';
    const body = Object.assign({ model, input }, opts.body || {});
    return this.requestFn(path, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(body),
    });
  }
}
