/**
 * Ollama Client Wrapper
 * Wraps the official ollama SDK and adds RAG-specific functionality
 * All official ollama features (streaming, tool calling, vision, etc.) are preserved
 */

import { Ollama } from 'ollama';

export class OllamaRAGClient {
  constructor(config = {}) {
    // Initialize official Ollama client
    this.ollama = new Ollama({
      host: config.host || 'http://127.0.0.1:11434',
      ...config
    });
    
    // Store config for RAG operations
    this.config = config;
  }

  /**
   * Generate text - delegates to official SDK
   * Supports all official options: streaming, format, system, tools, etc.
   */
  async generate(options) {
    return this.ollama.generate(options);
  }

  /**
   * Chat - delegates to official SDK
   * Supports all official options: streaming, tools, format, images, etc.
   */
  async chat(options) {
    return this.ollama.chat(options);
  }

  /**
   * Generate embeddings - delegates to official SDK
   * @param {string} model - Embedding model name
   * @param {string|string[]} input - Text or array of texts to embed
   * @param {Object} options - Additional embedding options
   * @returns {Promise<Object>} Embedding response with embeddings array
   */
  async embed(model, input, options = {}) {
    return this.ollama.embed({
      model,
      input,
      ...options
    });
  }

  /**
   * List available models
   */
  async list() {
    return this.ollama.list();
  }

  /**
   * Show model details
   */
  async show(options) {
    return this.ollama.show(options);
  }

  /**
   * Pull a model
   */
  async pull(options) {
    return this.ollama.pull(options);
  }

  /**
   * Push a model
   */
  async push(options) {
    return this.ollama.push(options);
  }

  /**
   * Create a model
   */
  async create(options) {
    return this.ollama.create(options);
  }

  /**
   * Delete a model
   */
  async delete(options) {
    return this.ollama.delete(options);
  }

  /**
   * Copy a model
   */
  async copy(options) {
    return this.ollama.copy(options);
  }

  /**
   * List running models
   */
  async ps() {
    return this.ollama.ps();
  }

  /**
   * Web search (requires Ollama account)
   */
  async webSearch(options) {
    return this.ollama.webSearch(options);
  }

  /**
   * Web fetch (requires Ollama account)
   */
  async webFetch(options) {
    return this.ollama.webFetch(options);
  }

  /**
   * Abort all streaming requests
   */
  abort() {
    return this.ollama.abort();
  }

  /**
   * Direct access to underlying Ollama client for advanced use cases
   */
  get client() {
    return this.ollama;
  }
}

// For backward compatibility, also export as default
export default OllamaRAGClient;
