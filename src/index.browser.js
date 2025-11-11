// Browser-safe entry: DO NOT import server-only modules here
export { LMStudioClient } from './lmstudioClient.js';
export { InMemoryVectorStore } from './vectorStore.js';
export { Retriever } from './retriever.js';
export { generateWithRAG } from './rag.js';
export { useRAG } from './react/useRag.js';
export { createMRL } from './embeddings/mrl.js';
export { createLMStudioEmbedding } from './embeddings/lmstudioEmbedding.js';
export { initRAG } from './initRag.js';
export { createBrowserModelClient } from './browserModelClient.js';
export { createBrowserEmbedding } from './embeddings/browserEmbedding.js';

// Utilities (browser-safe)
export { 
  chunkText, 
  chunkBySentences, 
  chunkDocuments, 
  chunkMarkdown 
} from './utils/chunking.js';

// Prompt Management (browser-safe)
export { PromptManager, PromptTemplates, createPromptManager, getTemplate } from './promptManager.js';

// Decision Engine (browser-safe)
export { 
  WeightedDecisionEngine,
  HeuristicEngine,
  SmartRetriever,
  createSmartRetriever,
  DEFAULT_WEIGHTS
} from './decisionEngine.js';

// Intentionally NOT exporting OllamaClient or createOllamaEmbedding in browser build
// LMStudioClient CAN be used in browser if LM Studio server is accessible


