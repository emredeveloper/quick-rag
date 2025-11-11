/**
 * Ollama embedding function using official SDK
 */
export function createOllamaEmbedding(client, model = 'embeddinggemma') {
  return async (text) => {
    try {
      if (Array.isArray(text)) {
        // Batch embedding
        const response = await client.embed(model, text);
        // Official Ollama SDK returns { embeddings: [[...], [...]] }
        if (response.embeddings && Array.isArray(response.embeddings)) {
          return response.embeddings;
        }
        // Fallback: check for data field (some versions)
        if (response.data && Array.isArray(response.data)) {
          return response.data.map(item => item.embedding || item);
        }
        throw new Error('Unexpected embedding response format: ' + JSON.stringify(response).substring(0, 100));
      } else {
        // Single embedding
        const response = await client.embed(model, text);
        // Official Ollama SDK returns { embeddings: [[...]] } for single input
        if (response.embeddings && Array.isArray(response.embeddings) && response.embeddings[0]) {
          return response.embeddings[0];
        }
        // Fallback: check for data field
        if (response.data && Array.isArray(response.data) && response.data[0]) {
          return response.data[0].embedding || response.data[0];
        }
        // Fallback: direct array
        if (Array.isArray(response) && typeof response[0] === 'number') {
          return response;
        }
        throw new Error('Unexpected embedding response format: ' + JSON.stringify(response).substring(0, 100));
      }
    } catch (error) {
      // Provide helpful error message
      if (error.message.includes('model') || error.message.includes('not found')) {
        throw new Error(`Embedding model "${model}" not found. Please run: ollama pull ${model}`);
      }
      if (error.message.includes('timeout') || error.message.includes('ECONNREFUSED')) {
        throw new Error(`Cannot connect to Ollama. Make sure it's running: ollama serve`);
      }
      throw error;
    }
  };
}
