// Node.js entry point - no React dependencies
export { default as OllamaClient } from './ollamaClient.js';
export { InMemoryVectorStore } from './vectorStore.js';
export { Retriever } from './retriever.js';
export { generateWithRAG } from './rag.js';
export { createOllamaEmbedding } from './embeddings/ollamaEmbedding.js';
export { createMRL } from './embeddings/mrl.js';
export { initRAG } from './initRag.js';

// React hook is NOT exported here (use index.js for React projects)
