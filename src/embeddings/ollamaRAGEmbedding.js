/**
 * Ollama embedding function using official SDK
 */
export function createOllamaEmbedding(client, model = 'embeddinggemma') {
  return async (text) => {
    if (Array.isArray(text)) {
      // Batch embedding
      const response = await client.embed(model, text);
      return response.embeddings;
    } else {
      // Single embedding
      const response = await client.embed(model, text);
      return response.embeddings[0];
    }
  };
}
