/**
 * LM Studio Client Wrapper
 * Wraps the official @lmstudio/sdk and adds RAG-specific functionality
 * All official LM Studio features (streaming, tools, agents, etc.) are preserved
 */

import { LMStudioClient as LMStudioSDK } from '@lmstudio/sdk';

// Global cache for embedding models to avoid "already exists" errors
const globalEmbeddingCache = new Map();

export class LMStudioRAGClient {
  constructor(config = {}) {
    // Initialize official LM Studio client
    this.lmstudio = new LMStudioSDK(config);
    
    // Store config for RAG operations
    this.config = config;
    
    // Cache for loaded models
    this._modelCache = new Map();
  }

  /**
   * Get or load a model
   * @param {string} modelPath - Model identifier
   * @param {Object} config - Model configuration
   * @returns {Promise<Object>} Loaded model instance
   */
  async getModel(modelPath, config = {}) {
    const cacheKey = modelPath;
    
    if (this._modelCache.has(cacheKey)) {
      return this._modelCache.get(cacheKey);
    }
    
    const model = await this.lmstudio.llm.model(modelPath, config);
    this._modelCache.set(cacheKey, model);
    return model;
  }

  /**
   * Chat with a model - high-level API
   * @param {string} modelPath - Model identifier
   * @param {string|Array} messages - Single message or array of messages
   * @param {Object} options - Chat options
   * @returns {Promise<string>} Response text from model
   */
  async chat(modelPath, messages, options = {}) {
    const model = await this.getModel(modelPath, options.modelConfig);
    
    // Handle single message string
    if (typeof messages === 'string') {
      const result = await model.respond(messages, options);
      // Extract text from response
      return result.content || result.text || result.toString();
    }
    
    // Handle message array for chat history
    const result = await model.respond(messages, options);
    return result.content || result.text || result.toString();
  }

  /**
   * Generate completion - high-level API
   * @param {string} modelPath - Model identifier
   * @param {string} prompt - Prompt text
   * @param {Object} options - Generation options
   * @returns {Promise<string>} Generated text
   */
  async generate(modelPath, prompt, options = {}) {
    const model = await this.getModel(modelPath, options.modelConfig);
    const result = await model.respond(prompt, options);
    return result.content || result.text || result.toString();
  }

  /**
   * Generate embeddings
   * @param {string} modelPath - Embedding model identifier
   * @param {string|string[]} input - Text or array of texts
   * @param {Object} options - Embedding options
   * @returns {Promise<Array>} Embedding vector(s)
   */
  async embed(modelPath, input, options = {}) {
    const isArray = Array.isArray(input);
    const texts = isArray ? input : [input];
    
    // Use global cache to avoid "already exists" errors across instances
    const cacheKey = `${modelPath}`;
    let model;
    
    if (globalEmbeddingCache.has(cacheKey)) {
      model = globalEmbeddingCache.get(cacheKey);
    } else {
      try {
        // Get embedding model with verbose disabled by default
        model = await this.lmstudio.embedding.model(modelPath, {
          verbose: false,
          ...options
        });
        globalEmbeddingCache.set(cacheKey, model);
      } catch (err) {
        // If model already exists but not in our cache, it means another process created it
        // We can't load it, so give helpful error message
        if (err.message.includes('already exists')) {
          console.warn(`⚠️  Embedding model conflict detected. Attempting recovery...`);
          // Try one more time after a small delay
          await new Promise(resolve => setTimeout(resolve, 500));
          try {
            // Try to load it with a different approach - just call model() again
            // LM Studio SDK might have internal handling for this
            model = await this.lmstudio.embedding.model(modelPath, {
              verbose: false,
              ...options
            });
            globalEmbeddingCache.set(cacheKey, model);
          } catch (retryErr) {
            throw new Error(
              `LM Studio embedding model conflict. ` +
              `The model "${modelPath}" is already loaded. ` +
              `Please restart LM Studio or use a different embedding model.`
            );
          }
        } else {
          throw err;
        }
      }
    }
    
    // Generate embeddings
    const embeddings = [];
    for (const text of texts) {
      const embedding = await model.embed(text);
      // Handle different return formats from LM Studio SDK
      if (Array.isArray(embedding)) {
        embeddings.push(embedding);
      } else if (embedding.embedding) {
        embeddings.push(embedding.embedding);
      } else if (embedding.vector) {
        embeddings.push(embedding.vector);
      } else {
        embeddings.push(embedding);
      }
    }
    
    return isArray ? embeddings : embeddings[0];
  }

  /**
   * List downloaded models
   * @returns {Promise<Array>} List of downloaded models
   */
  async listDownloaded() {
    try {
      return await this.lmstudio.llm.listDownloaded();
    } catch (err) {
      console.warn('listDownloaded not available:', err.message);
      return [];
    }
  }

  /**
   * List loaded models
   * @returns {Promise<Array>} List of loaded models
   */
  async listLoaded() {
    try {
      return await this.lmstudio.llm.listLoaded();
    } catch (err) {
      console.warn('listLoaded not available:', err.message);
      return [];
    }
  }

  /**
   * Unload a model from memory
   * @param {string} modelPath - Model identifier
   */
  async unload(modelPath) {
    if (this._modelCache.has(modelPath)) {
      const model = this._modelCache.get(modelPath);
      await model.unload();
      this._modelCache.delete(modelPath);
    }
  }

  /**
   * Direct access to LLM namespace for advanced features
   */
  get llm() {
    return this.lmstudio.llm;
  }

  /**
   * Direct access to embedding namespace
   */
  get embedding() {
    return this.lmstudio.embedding;
  }

  /**
   * Direct access to system namespace
   */
  get system() {
    return this.lmstudio.system;
  }

  /**
   * Direct access to underlying LM Studio client for advanced use cases
   */
  get client() {
    return this.lmstudio;
  }
}

// For backward compatibility, also export as default
export default LMStudioRAGClient;
