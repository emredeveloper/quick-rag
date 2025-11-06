// Official SDK Wrappers (Recommended)
export { OllamaRAGClient } from './ollamaRAGClient.js';
export { LMStudioRAGClient } from './lmstudioRAGClient.js';
export { createOllamaEmbedding as createOllamaRAGEmbedding } from './embeddings/ollamaRAGEmbedding.js';
export { createLMStudioEmbedding as createLMStudioRAGEmbedding } from './embeddings/lmstudioRAGEmbedding.js';

// Legacy clients (for backward compatibility)
export { default as OllamaClient } from './ollamaClient.js';
export { LMStudioClient } from './lmstudioClient.js';
export { createOllamaEmbedding } from './embeddings/ollamaEmbedding.js';
export { createLMStudioEmbedding } from './embeddings/lmstudioEmbedding.js';

// Core RAG components
export { InMemoryVectorStore } from './vectorStore.js';
export { Retriever } from './retriever.js';
export { generateWithRAG } from './rag.js';
export { createMRL } from './embeddings/mrl.js';
export { initRAG } from './initRag.js';
export { createBrowserModelClient } from './browserModelClient.js';

// Prompt Management
export { PromptManager, PromptTemplates, createPromptManager, getTemplate } from './promptManager.js';

// Decision Engine (Advanced RAG)
export { 
  WeightedDecisionEngine,
  HeuristicEngine,
  SmartRetriever,
  createSmartRetriever,
  DEFAULT_WEIGHTS
} from './decisionEngine.js';

// React hook (optional - only import if using React)
// To use: import { useRAG } from 'quick-rag/react'
// export { useRAG } from './react/useRag.js';
export { createBrowserEmbedding } from './embeddings/browserEmbedding.js';

// Utilities
export { 
  chunkText, 
  chunkBySentences, 
  chunkDocuments, 
  chunkMarkdown 
} from './utils/chunking.js';

// Document Loaders (Node.js only)
export { 
  loadPDF,
  loadWord,
  loadExcel,
  loadText,
  loadJSON,
  loadMarkdown,
  loadDocument,
  loadDirectory
} from './loaders/documents.js';

// Web Loaders
export { 
  loadURL,
  loadURLs,
  loadSitemap
} from './loaders/web.js';
