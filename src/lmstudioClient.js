/**
 * LM Studio API client
 * Compatible with OpenAI-style API endpoints
 * Default URL: http://localhost:1234/v1
 */
export class LMStudioClient {
  constructor(baseUrl = 'http://localhost:1234/v1', requestFn = null) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.headers = { 'Content-Type': 'application/json' };
    this.requestFn = requestFn || this._defaultRequest.bind(this);
  }

  // Default fetch-based request handler
  async _defaultRequest(endpoint, opts) {
    const url = `${this.baseUrl}/${endpoint}`;
    const res = await fetch(url, opts);
    
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`LM Studio request failed ${res.status}: ${text}`);
    }
    
    return res;
  }

  /**
   * Generate text completion using LM Studio's OpenAI-compatible API
   * @param {string} model - Model name (e.g., 'local-model')
   * @param {string} prompt - The prompt text
   * @param {Object} opts - Options like temperature, max_tokens, etc.
   * @returns {Promise<string>} Generated text
   */
  async generate(model, prompt, opts = {}) {
    const body = {
      model: model || 'local-model',
      prompt: prompt,
      temperature: opts.temperature || 0.7,
      max_tokens: opts.max_tokens || 512,
      stream: false,
      ...opts.body
    };

    const result = await this.requestFn('completions', {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(body),
    });

    const data = await result.json();
    
    // OpenAI format: { choices: [{ text: "..." }] }
    if (data.choices && data.choices[0]) {
      return data.choices[0].text.trim();
    }
    
    throw new Error('Invalid response format from LM Studio');
  }

  /**
   * Chat completion using LM Studio's OpenAI-compatible chat API
   * @param {string} model - Model name
   * @param {string} prompt - User message
   * @param {Object} opts - Options including messages array
   * @returns {Promise<string>} Generated response
   */
  async chat(model, prompt, opts = {}) {
    const messages = opts.messages || [{ role: 'user', content: prompt }];
    
    const body = {
      model: model || 'local-model',
      messages: messages,
      temperature: opts.temperature || 0.7,
      max_tokens: opts.max_tokens || 512,
      stream: false,
      ...opts.body
    };

    const result = await this.requestFn('chat/completions', {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(body),
    });

    const data = await result.json();
    
    // OpenAI format: { choices: [{ message: { content: "..." } }] }
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content.trim();
    }
    
    throw new Error('Invalid response format from LM Studio');
  }

  /**
   * Generate embeddings using LM Studio
   * @param {string} model - Embedding model name
   * @param {string|Array<string>} input - Text or array of texts
   * @returns {Promise<Array<number>|Array<Array<number>>>} Embedding vector(s)
   */
  async embed(model, input) {
    const body = {
      model: model || 'text-embedding-model',
      input: input
    };

    const result = await this.requestFn('embeddings', {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(body),
    });

    const data = await result.json();
    
    // OpenAI format: { data: [{ embedding: [...] }] }
    if (data.data) {
      if (Array.isArray(input)) {
        return data.data.map(item => item.embedding);
      } else {
        return data.data[0].embedding;
      }
    }
    
    throw new Error('Invalid response format from LM Studio');
  }

  /**
   * List available models
   * @returns {Promise<Array>} List of available models
   */
  async listModels() {
    const result = await this.requestFn('models', {
      method: 'GET',
      headers: this.headers,
    });

    const data = await result.json();
    return data.data || [];
  }
}
