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


// Advanced Search (v2.2.0+)
export {
  BM25,
  HybridRetriever,
  Reranker,
  createRerankedRetriever,
  reciprocalRankFusion,
  linearCombination
} from './search/index.js';

// Query Transformation (v2.2.0+)
export {
  QueryTransformer,
  HyDETransformer,
  QueryExpander,
  QueryDecomposer,
  MultiQueryGenerator
} from './query/index.js';

// Caching Layer (v2.3.0+)
export {
  LRUCache,
  EmbeddingCache,
  QueryCache,
  CacheManager
} from './cache/index.js';

// Conversation Management (v2.3.0+)
export {
  ConversationManager,
  ContextWindow,
  tokenCounters,
  modelContextLimits,
  getContextLimit,
  createSummarizer,
  extractiveSummarize,
  summarizeByRoles,
  ProgressiveSummarizer
} from './conversation/index.js';

// RAG Evaluation (v2.3.0+)
export {
  // Metrics check browser compatibility
  precisionAtK,
  recallAtK,
  f1AtK,
  meanReciprocalRank,
  averageMRR,
  ndcgAtK,
  ndcgAtKBinary,
  averagePrecision,
  meanAveragePrecision,
  hitAtK,
  averageHitRate,
  calculateAllMetrics,
  calculateAggregateMetrics,
  // Evaluator
  RAGEvaluator,
  evaluateRetrieval
} from './evaluation/index.js';

// Error Handling (v2.1.0+)
export {
  RAGError,
  EmbeddingError,
  RetrievalError,
  DocumentLoadError,
  VectorStoreError,
  GenerationError,
  ConfigurationError,
  isRAGError,
  getErrorCode,
  getErrorMetadata
} from './errors/index.js';


