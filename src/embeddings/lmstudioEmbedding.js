/**
 * LM Studio embedding function
 * Uses LM Studio's OpenAI-compatible embeddings API
 */
export function createLMStudioEmbedding(client, model = 'text-embedding-model') {
  return async (text) => {
    if (Array.isArray(text)) {
      // Batch embedding
      return client.embed(model, text);
    } else {
      // Single embedding
      return client.embed(model, text);
    }
  };
}
