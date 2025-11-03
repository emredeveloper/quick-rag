// Minimal Ollama client adapter.
// Assumptions: local Ollama server available at baseUrl (default http://localhost:11434).
// If the official `ollama` JS client is installed, you can pass a custom `requestFn`.

// Use native fetch in Node.js 18+ or browsers, fallback to node-fetch if needed
const fetchFn = (() => {
  try {
    // Try to use global fetch (Node 18+, browsers)
    if (typeof fetch !== 'undefined') {
      return fetch;
    }
  } catch {}
  
  // Fallback to node-fetch for older Node versions
  try {
    // Dynamic import to avoid bundler issues
    return (async (...args) => {
      const nodeFetch = await import('node-fetch');
      return nodeFetch.default(...args);
    });
  } catch {
    throw new Error('No fetch implementation available. Use Node.js 18+ or install node-fetch.');
  }
})();

// Minimal Ollama client adapter using the documented base API path (/api).
// Docs: https://docs.ollama.com/api
export default class OllamaClient {
  constructor(options = {}) {
    // Ollama's API base (documented): http://localhost:11434/api
    // Use 127.0.0.1 instead of localhost for better Windows compatibility
    this.baseUrl = options.baseUrl || process.env.OLLAMA_HOST || 'http://127.0.0.1:11434/api';
    this.requestFn = options.requestFn || this._defaultRequest.bind(this);
    this.headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
  }

  async _defaultRequest(path, opts = {}) {
    const buildUrl = host => `${host.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;

    const tryFetch = async url => {
      const res = await fetchFn(url, opts);
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
  // Auto-fallback to chat API if generate is not supported
  async generate(model, prompt, opts = {}) {
    const path = opts.path || 'generate';
    // Add stream: false for better compatibility
    const body = Object.assign({ model, prompt, stream: false }, opts.body || {});
    
    try {
      const result = await this.requestFn(path, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(body),
      });
      
      return this._parseResponse(result);
    } catch (error) {
      // Auto-fallback to chat API if generate is not supported
      if (error.message && error.message.includes('does not support generate')) {
        console.warn(`Model "${model}" doesn't support generate API, trying chat API...`);
        return this.chat(model, prompt, opts);
      }
      throw error;
    }
  }

  // Chat API for models that only support chat (like llama3.2)
  async chat(model, prompt, opts = {}) {
    const path = opts.path || 'chat';
    const messages = opts.messages || [{ role: 'user', content: prompt }];
    // Add stream: false for better compatibility
    const body = Object.assign({ model, messages, stream: false }, opts.body || {});
    
    const result = await this.requestFn(path, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(body),
    });
    
    return this._parseResponse(result);
  }

  // Parse NDJSON or JSON response
  _parseResponse(result) {
    // Parse NDJSON response (streaming format from Ollama)
    if (typeof result === 'string') {
      let fullResponse = '';
      for (const line of result.split(/\r?\n/)) {
        if (!line.trim()) continue;
        try {
          const obj = JSON.parse(line.trim());
          // Handle both generate and chat response formats
          if (obj.response) fullResponse += obj.response;
          if (obj.message?.content) fullResponse += obj.message.content;
        } catch {
          // If not JSON, treat as plain text
          fullResponse += line;
        }
      }
      return fullResponse.trim();
    }
    
    // If already an object, return response field or message content
    return result?.response || result?.message?.content || result;
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
