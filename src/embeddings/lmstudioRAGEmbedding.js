/**
 * LM Studio embedding function using official SDK
 */
export function createLMStudioEmbedding(client, model = 'text-embedding-model', options = {}) {
  return async (text) => {
    return client.embed(model, text, options);
  };
}
