import { InMemoryVectorStore } from './vectorStore.js';
import { Retriever } from './retriever.js';
import { createMRL } from './embeddings/mrl.js';

// Convenience initializer for quick React usage
// docs: Array<{ id: string, text: string }>
// options: { defaultDim?: number, k?: number, baseEmbeddingOptions?: object, mrlBaseDim?: number }
export async function initRAG(docs, options = {}) {
  const {
    defaultDim = 128,
    k = 2,
    baseEmbeddingOptions = {},
    mrlBaseDim = 768
  } = options;

  // Lazy-load embedding providers to avoid bundling server-only code in the browser
  let baseEmbedding;
  if (baseEmbeddingOptions.useBrowser) {
    const { createBrowserEmbedding } = await import('./embeddings/browserEmbedding.js');
    baseEmbedding = createBrowserEmbedding({
      endpoint: baseEmbeddingOptions.baseUrl || '/api/embed',
      model: baseEmbeddingOptions.model,
      headers: baseEmbeddingOptions.headers
    });
  } else {
    const { createOllamaEmbedding } = await import('./embeddings/ollamaEmbedding.js');
    baseEmbedding = createOllamaEmbedding(baseEmbeddingOptions);
  }
  const mrl = createMRL(baseEmbedding, mrlBaseDim);
  const store = new InMemoryVectorStore(mrl, { defaultDim });
  await store.addDocuments(docs, { dim: defaultDim });
  const retriever = new Retriever(store, { k });

  return { retriever, store, mrl };
}

export default initRAG;


