/**
 * Ollama embedding function using OllamaRAGClient wrapper
 * @param {OllamaRAGClient} client - OllamaRAGClient instance
 * @param {string} model - Embedding model name
 * @returns {Function} Embedding function
 */
export function createOllamaEmbedding(client, model = 'embeddinggemma') {
  return async (text) => {
    try {
      // OllamaRAGClient.embed(model, input) signature
      const response = await client.embed(model, text);
      
      if (Array.isArray(text)) {
        // Batch embedding - return array of embeddings
        if (response.embeddings && Array.isArray(response.embeddings)) {
          return response.embeddings;
        }
        throw new Error('Unexpected embedding response format: ' + JSON.stringify(response).substring(0, 100));
      } else {
        // Single embedding - return first embedding
        if (response.embeddings && Array.isArray(response.embeddings) && response.embeddings[0]) {
          return response.embeddings[0];
        }
        throw new Error('Unexpected embedding response format: ' + JSON.stringify(response).substring(0, 100));
      }
    } catch (error) {
      // Provide helpful error message
      if (error.message && (error.message.includes('model') || error.message.includes('not found'))) {
        throw new Error(`Embedding model "${model}" not found. Please run: ollama pull ${model}`);
      }
      if (error.message && (error.message.includes('timeout') || error.message.includes('ECONNREFUSED'))) {
        throw new Error(`Cannot connect to Ollama. Make sure it's running: ollama serve`);
      }
      throw error;
    }
  };
}

// Alias for backward compatibility
export { createOllamaEmbedding as createOllamaRAGEmbedding };
