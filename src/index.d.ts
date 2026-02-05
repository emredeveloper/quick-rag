/**
 * Quick RAG - TypeScript Definitions
 * Official type definitions for quick-rag package
 */

// ==================== Core Types ====================

export interface QueryExplanation {
  queryTerms: string[];
  matchedTerms: string[];
  matchCount: number;
  matchRatio: number;
  cosineSimilarity: number;
  relevanceFactors: {
    termMatches: number;
    semanticSimilarity: number;
    coverage: string;
  };
}

export interface Document {
  id?: string;
  text: string;
  meta?: Record<string, any>;
  vector?: number[];
  dim?: number;
  score?: number;
  explanation?: QueryExplanation;
}

export interface EmbeddingOptions {
  dim?: number;
  [key: string]: any;
}

export type EmbeddingFunction = (text: string, dim?: number) => Promise<number[]>;

// ==================== Vector Store ====================

export interface VectorStoreOptions {
  defaultDim?: number;
  autoChunkThreshold?: number; // Auto-chunk documents larger than this (default: 10000)
  chunkSize?: number; // Characters per chunk (default: 1000)
  chunkOverlap?: number; // Overlap between chunks (default: 100)
}

export interface AddDocumentsOptions {
  dim?: number;
  onProgress?: (current: number, total: number, currentDoc?: Document) => void; // Progress callback
  autoChunk?: boolean; // Auto-chunk large documents (default: true)
  chunkDocuments?: (docs: Document[], options: { chunkSize: number; overlap: number }) => Document[]; // Chunking function
  batchSize?: number; // Process embeddings in batches (default: 10)
  maxConcurrent?: number; // Max concurrent requests when batch fails (default: 5)
}

export class InMemoryVectorStore {
  constructor(embeddingFn: EmbeddingFunction, options?: VectorStoreOptions);
  
  addDocuments(docs: Document[], opts?: AddDocumentsOptions): Promise<void>;
  addDocument(doc: Document, opts?: AddDocumentsOptions): Promise<void>;
  similaritySearch(query: string, k?: number, queryDim?: number): Promise<Document[]>;
  deleteDocument(id: string): boolean;
  updateDocument(id: string, newText: string, newMeta?: Record<string, any>): Promise<boolean>;
  getDocument(id: string): Document | undefined;
  getAllDocuments(): Document[];
  clear(): void;
}

// ==================== Retriever ====================

export interface RetrieverOptions {
  k?: number;
}

export interface GetRelevantOptions {
  filters?: Record<string, any> | ((meta: Record<string, any>) => boolean);
  minScore?: number;
  explain?: boolean;
}

export class Retriever {
  constructor(vectorStore: InMemoryVectorStore, options?: RetrieverOptions);
  
  getRelevant(query: string, k?: number, options?: GetRelevantOptions): Promise<Document[]>;
}

// ==================== Ollama Client ====================

export interface OllamaConfig {
  host?: string;
  [key: string]: any;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  images?: string[];
}

export interface ChatOptions {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
  format?: 'json' | string;
  tools?: any[];
  options?: Record<string, any>;
}

export interface GenerateOptions {
  model: string;
  prompt: string;
  stream?: boolean;
  system?: string;
  format?: 'json' | string;
  options?: Record<string, any>;
}

export interface EmbedOptions {
  model: string;
  input: string | string[];
  truncate?: boolean;
  options?: Record<string, any>;
}

export class OllamaRAGClient {
  constructor(config?: OllamaConfig);
  
  generate(options: GenerateOptions): Promise<any>;
  chat(options: ChatOptions): Promise<any>;
  embed(model: string, input: string | string[], options?: Record<string, any>): Promise<any>;
  list(): Promise<any>;
  show(options: { model: string }): Promise<any>;
  pull(options: { model: string; stream?: boolean }): Promise<any>;
  push(options: { model: string; stream?: boolean }): Promise<any>;
  create(options: { model: string; modelfile: string; stream?: boolean }): Promise<any>;
  delete(options: { model: string }): Promise<any>;
  copy(options: { source: string; destination: string }): Promise<any>;
  ps(): Promise<any>;
  abort(): Promise<void>;
  
  // Direct access to underlying client
  client: any;
}

// ==================== LM Studio Client ====================

export interface LMStudioConfig {
  baseUrl?: string;
  [key: string]: any;
}

export interface LMStudioChatOptions {
  temperature?: number;
  maxPredictedTokens?: number;
  [key: string]: any;
}

export class LMStudioRAGClient {
  constructor(config?: LMStudioConfig);
  
  getModel(modelPath: string): Promise<any>;
  chat(modelPath: string, messagesOrPrompt: ChatMessage[] | string, options?: LMStudioChatOptions): Promise<string>;
  generate(modelPath: string, prompt: string, options?: LMStudioChatOptions): Promise<string>;
  embed(model: string, text: string | string[], options?: Record<string, any>): Promise<number[] | number[][]>;
  listDownloaded(): Promise<any[]>;
  listLoaded(): Promise<any[]>;
  unload(modelPath: string): Promise<void>;
  
  // Direct access to SDK namespaces
  llm: any;
  embedding: any;
  system: any;
  client: any;
}

// ==================== Embeddings ====================

export function createOllamaRAGEmbedding(
  client: OllamaRAGClient, 
  model?: string
): EmbeddingFunction;

export function createLMStudioRAGEmbedding(
  client: LMStudioRAGClient,
  model: string,
  options?: Record<string, any>
): EmbeddingFunction;

export function createBrowserEmbedding(options: {
  endpoint: string;
  model?: string;
  headers?: Record<string, string>;
}): EmbeddingFunction;

export interface BrowserModelClient {
  generate(model: string, prompt: string): Promise<string>;
  generateStream(model: string, prompt: string, options?: { signal?: AbortSignal }): AsyncGenerator<string, void, unknown>;
}

export function createBrowserModelClient(options?: {
  endpoint?: string;
  headers?: Record<string, string>;
}): BrowserModelClient;

export function createMRL(
  baseEmbedding: EmbeddingFunction,
  baseDim?: number
): EmbeddingFunction;

// ==================== RAG ====================

export interface GenerateWithRAGOptions {
  retriever: Retriever;
  modelClient: OllamaRAGClient | LMStudioRAGClient | any;
  model: string;
  query: string;
  promptTemplate?: (docs: Document[], query: string) => string;
  topK?: number;
}

export interface GenerateWithRAGOptionsV2 {
  systemPrompt?: string;
  template?: string | PromptTemplate;
  promptManager?: PromptManager;
  context?: ContextFormatOptions;
}

export function generateWithRAG(
  options: GenerateWithRAGOptions
): Promise<{ response: string; docs: Document[]; prompt: string }>;

export function generateWithRAG(
  client: OllamaRAGClient | LMStudioRAGClient,
  model: string,
  query: string,
  results: Document[],
  options?: GenerateWithRAGOptionsV2
): Promise<{ response: string; docs: Document[]; prompt: string }>;

// ==================== Init RAG ====================

export interface InitRAGOptions {
  defaultDim?: number;
  k?: number;
  baseEmbeddingOptions?: {
    useBrowser?: boolean;
    baseUrl?: string;
    model?: string;
    headers?: Record<string, string>;
    createEmbedding?: EmbeddingFunction;
  };
  mrlBaseDim?: number;
}

export function initRAG(
  docs: Document[],
  options?: InitRAGOptions
): Promise<{
  retriever: Retriever;
  store: InMemoryVectorStore;
  mrl: EmbeddingFunction;
}>;

// ==================== React Hook ====================

export interface UseRAGOptions {
  retriever: Retriever;
  modelClient: any;
  model: string;
  promptTemplate?: (docs: Document[], query: string) => string;
}

export interface UseRAGRunOptions {
  stream?: boolean;
  topK?: number;
  onDelta?: (chunk: string, accumulated: string) => void;
}

export interface UseRAGResult {
  run: (query: string, options?: UseRAGRunOptions) => Promise<{ 
    response: string; 
    docs: Document[] 
  }>;
  loading: boolean;
  error: Error | null;
  response: string | null;
  docs: Document[];
  streaming: boolean;
}

export function useRAG(options: UseRAGOptions): UseRAGResult;

// ==================== Legacy Exports ====================

export class OllamaClient {
  constructor(config?: OllamaConfig);
  generate(model: string, prompt: string, options?: any): Promise<string>;
  embed(model: string, text: string): Promise<number[]>;
}

export class LMStudioClient {
  constructor(config?: LMStudioConfig);
  generate(modelPath: string, prompt: string, options?: any): Promise<string>;
  embed(model: string, text: string): Promise<number[]>;
}

export function createOllamaEmbedding(options?: any): EmbeddingFunction;

// ==================== Utilities ====================

export interface ChunkTextOptions {
  chunkSize?: number;
  overlap?: number;
  separator?: string | RegExp;
}

export interface ChunkBySentencesOptions {
  sentencesPerChunk?: number;
  overlapSentences?: number;
}

export interface ChunkMarkdownOptions {
  chunkSize?: number;
  overlap?: number;
}

export function chunkText(text: string, options?: ChunkTextOptions): string[];
export function chunkBySentences(text: string, options?: ChunkBySentencesOptions): string[];
export function chunkDocuments(docs: Document[], options?: ChunkTextOptions): Document[];
export function chunkMarkdown(markdown: string, options?: ChunkMarkdownOptions): string[];

// ==================== Document Loaders ====================

export interface LoadedDocument {
  text: string;
  meta: Record<string, any>;
  data?: any;
  sheets?: Record<string, any[]>;
}

export interface LoadOptions {
  meta?: Record<string, any>;
}

export interface LoadExcelOptions extends LoadOptions {
  sheetName?: string;
  allSheets?: boolean;
}

export interface LoadMarkdownOptions extends LoadOptions {
  stripMarkdown?: boolean;
}

export interface LoadJSONOptions extends LoadOptions {
  textField?: string;
}

export interface LoadTextOptions extends LoadOptions {
  encoding?: string;
}

export interface LoadDirectoryOptions extends LoadOptions {
  extensions?: string[];
  recursive?: boolean;
}

export function loadPDF(filePath: string, options?: LoadOptions): Promise<LoadedDocument>;
export function loadWord(filePath: string, options?: LoadOptions): Promise<LoadedDocument>;
export function loadExcel(filePath: string, options?: LoadExcelOptions): Promise<LoadedDocument>;
export function loadText(filePath: string, options?: LoadTextOptions): Promise<LoadedDocument>;
export function loadJSON(filePath: string, options?: LoadJSONOptions): Promise<LoadedDocument>;
export function loadMarkdown(filePath: string, options?: LoadMarkdownOptions): Promise<LoadedDocument>;
export function loadDocument(filePath: string, options?: LoadOptions): Promise<LoadedDocument>;
export function loadDirectory(dirPath: string, options?: LoadDirectoryOptions): Promise<LoadedDocument[]>;

// ==================== Web Loaders ====================

export interface LoadURLOptions {
  headers?: Record<string, string>;
  extractText?: boolean;
  meta?: Record<string, any>;
}

export function loadURL(url: string, options?: LoadURLOptions): Promise<LoadedDocument>;
export function loadURLs(urls: string[], options?: LoadURLOptions): Promise<LoadedDocument[]>;
export function loadSitemap(sitemapURL: string, options?: LoadURLOptions): Promise<string[]>;

// ==================== Prompt Management ====================

export type PromptTemplate = (query: string, context: string) => string;

export interface PromptTemplates {
  default: PromptTemplate;
  conversational: PromptTemplate;
  technical: PromptTemplate;
  academic: PromptTemplate;
  code: PromptTemplate;
  concise: PromptTemplate;
  detailed: PromptTemplate;
  qa: PromptTemplate;
  instructional: PromptTemplate;
  creative: PromptTemplate;
  [key: string]: PromptTemplate;
}

export interface PromptManagerOptions {
  systemPrompt?: string;
  template?: string | PromptTemplate;
  variables?: Record<string, string>;
  contextFormatters?: Record<string, any>;
}

export interface ContextFormatOptions {
  includeScores?: boolean;
  includeMetadata?: boolean;
  maxLength?: number;
  separator?: string;
}

export class PromptManager {
  constructor(options?: PromptManagerOptions);
  setSystemPrompt(prompt: string): PromptManager;
  setTemplate(template: string | PromptTemplate): PromptManager;
  addVariables(variables: Record<string, string>): PromptManager;
  generate(query: string, docs: Document[], options?: { context?: ContextFormatOptions }): string;
  clone(options?: PromptManagerOptions): PromptManager;
}

export const PromptTemplates: PromptTemplates;

export function createPromptManager(options?: PromptManagerOptions): PromptManager;

export function getTemplate(name: string): PromptTemplate | undefined;

// ==================== Decision Engine ====================

export interface DecisionWeights {
  semanticSimilarity: number;
  keywordMatch: number;
  recency: number;
  sourceQuality: number;
  contextRelevance: number;
}

export const DEFAULT_WEIGHTS: DecisionWeights;

export interface ScoreBreakdown {
  semanticSimilarity: { score: number; weight: number; contribution: number };
  keywordMatch: { score: number; weight: number; contribution: number };
  recency: { score: number; weight: number; contribution: number };
  sourceQuality: { score: number; weight: number; contribution: number };
  contextRelevance: { score: number; weight: number; contribution: number };
}

export interface ScoredDocument extends Document {
  weightedScore: number;
  scoreBreakdown: ScoreBreakdown;
  originalScore?: number;
}

export interface HeuristicRule {
  name: string;
  condition: (query: string, context: any) => boolean;
  action: (query: string, context: any) => any;
  priority: number;
}

export interface DecisionContext {
  weights: DecisionWeights;
  appliedRules: string[];
  suggestions: string[];
}

export interface SmartRetrievalResult {
  results: ScoredDocument[];
  decisions: DecisionContext;
}

export class WeightedDecisionEngine {
  constructor(weights?: Partial<DecisionWeights>);
  scoreDocument(doc: Document, factors?: Record<string, any>): ScoredDocument;
  calculateRecency(dateStr?: string): number;
  getSourceQuality(source?: string): number;
}

export class HeuristicEngine {
  constructor(options?: { enableLearning?: boolean });
  addRule(name: string, condition: (query: string, context: any) => boolean, action: (query: string, context: any) => any, priority?: number): void;
  removeRule(name: string): void;
  evaluate(query: string, context: any): any;
  provideFeedback(query: string, results: Document[], feedback: { rating: number; comment?: string }): void;
  getInsights(): any;
  exportKnowledge(): any;
  importKnowledge(knowledge: any): void;
}

export interface SmartRetrieverOptions {
  weights?: Partial<DecisionWeights>;
  enableHeuristics?: boolean;
  enableLearning?: boolean;
}

export class SmartRetriever {
  constructor(retriever: Retriever, options?: SmartRetrieverOptions);
  getRelevant(query: string, k?: number, options?: GetRelevantOptions): Promise<SmartRetrievalResult>;
  provideFeedback(query: string, results: Document[], feedback: { rating: number; comment?: string }): void;
  getInsights(): any;
  exportKnowledge(): any;
  importKnowledge(knowledge: any): void;
  heuristicEngine: HeuristicEngine;
}

export function createSmartRetriever(retriever: Retriever, options?: SmartRetrieverOptions): SmartRetriever;

// ==================== Caching (v2.3.0+) ====================

export interface LRUCacheOptions {
  maxSize?: number;
  defaultTTL?: number;
  updateAgeOnGet?: boolean;
  onEvict?: (key: string, value: any) => void;
}

export interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  maxSize: number;
  hitRate: number;
}

export class LRUCache<T = any> {
  constructor(options?: LRUCacheOptions);
  get(key: string): T | undefined;
  set(key: string, value: T, options?: { ttl?: number }): LRUCache<T>;
  has(key: string): boolean;
  delete(key: string): boolean;
  clear(): void;
  readonly size: number;
  keys(): string[];
  values(): T[];
  getStats(): CacheStats;
  prune(): number;
  getOrSet(key: string, factory: () => Promise<T>, options?: { ttl?: number }): Promise<T>;
  toJSON(): object;
  static fromJSON<T>(data: object): LRUCache<T>;
}

export interface EmbeddingCacheOptions {
  maxSize?: number;
  ttl?: number;
  hashAlgorithm?: string;
  normalizeText?: boolean;
}

export interface EmbeddingCacheStats extends CacheStats {
  embeddings: number;
  cacheHits: number;
  cacheMisses: number;
  estimatedLatencySaved: string;
}

export class EmbeddingCache {
  constructor(options?: EmbeddingCacheOptions);
  generateKey(text: string): string;
  get(text: string): number[] | undefined;
  set(text: string, embedding: number[], options?: { ttl?: number }): void;
  has(text: string): boolean;
  wrap(embeddingFn: EmbeddingFunction): EmbeddingFunction;
  wrapBatch(embeddingFn: EmbeddingFunction): (texts: string[]) => Promise<number[][]>;
  precompute(texts: string[], embeddingFn: EmbeddingFunction, options?: { batchSize?: number; onProgress?: (current: number, total: number) => void }): Promise<void>;
  getStats(): EmbeddingCacheStats;
  clear(): void;
  readonly size: number;
  toJSON(): object;
  static fromJSON(data: object): EmbeddingCache;
}

export interface QueryCacheOptions {
  maxSize?: number;
  ttl?: number;
  cacheMetadata?: boolean;
}

export class QueryCache {
  constructor(options?: QueryCacheOptions);
  generateKey(query: string, options?: object): string;
  get(query: string, options?: object): Document[] | undefined;
  set(query: string, results: Document[], options?: object): void;
  has(query: string, options?: object): boolean;
  invalidate(predicate: (query: string) => boolean): void;
  wrap(retrieverFn: (query: string, options?: object) => Promise<Document[]>): (query: string, options?: object) => Promise<Document[]>;
  getStats(): CacheStats;
  clear(): void;
  readonly size: number;
}

export interface CacheManagerOptions {
  embeddings?: EmbeddingCacheOptions;
  queries?: QueryCacheOptions;
  responses?: LRUCacheOptions;
  general?: LRUCacheOptions;
  enabled?: boolean;
}

export interface CacheManagerStats {
  enabled: boolean;
  embeddings: EmbeddingCacheStats;
  queries: CacheStats;
  responses: CacheStats;
  general: CacheStats;
}

export class CacheManager {
  constructor(options?: CacheManagerOptions);
  embeddings: EmbeddingCache;
  queries: QueryCache;
  responses: LRUCache;
  general: LRUCache;
  wrapEmbedding(embeddingFn: EmbeddingFunction): EmbeddingFunction;
  wrapRetriever(retrieverFn: (query: string, options?: object) => Promise<Document[]>): (query: string, options?: object) => Promise<Document[]>;
  getResponse(key: string): any;
  setResponse(key: string, value: any, options?: { ttl?: number }): void;
  get(key: string): any;
  set(key: string, value: any, options?: { ttl?: number }): void;
  getStats(): CacheManagerStats;
  clearAll(): void;
  clear(type: 'embeddings' | 'queries' | 'responses' | 'general'): void;
  enable(): void;
  disable(): void;
  prune(): { embeddings: number; queries: number; responses: number; general: number };
  toJSON(): object;
  static fromJSON(data: object): CacheManager;
}

// ==================== Conversation Management (v2.3.0+) ====================

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  metadata?: Record<string, any>;
  tokenCount?: number;
}

export interface ConversationManagerOptions {
  id?: string;
  maxTokens?: number;
  reservedTokens?: number;
  autoSummarize?: boolean;
  systemPrompt?: string;
  tokenCounter?: (text: string) => number;
  summarizer?: (history: string) => Promise<string>;
}

export interface TokenUsage {
  total: number;
  contextWindow: number;
  maxTokens: number;
  reservedTokens: number;
  availableTokens: number;
  utilization: number;
  isOverLimit: boolean;
}

export interface ConversationStats extends TokenUsage {
  id: string;
  messageCount: number;
  userMessages: number;
  assistantMessages: number;
  hasSummary: boolean;
  hasSystemPrompt: boolean;
  createdAt: string;
  updatedAt: string;
}

export class ConversationManager {
  constructor(options?: ConversationManagerOptions);
  id: string;
  messages: Message[];
  summary: string | null;
  systemPrompt: string | null;
  addMessage(role: 'user' | 'assistant' | 'system', content: string, metadata?: Record<string, any>): Message;
  addUserMessage(content: string, metadata?: Record<string, any>): Message;
  addAssistantMessage(content: string, metadata?: Record<string, any>): Message;
  addSystemMessage(content: string): Message;
  getContext(options?: { maxTokens?: number; includeSystem?: boolean }): Array<{ role: string; content: string }>;
  getFormattedHistory(options?: { separator?: string; rolePrefix?: boolean }): string;
  getLastMessages(n: number): Message[];
  getMessage(id: string): Message | null;
  updateMessage(id: string, newContent: string): boolean;
  deleteMessage(id: string): boolean;
  clear(keepSummary?: boolean): void;
  setSystemPrompt(prompt: string): void;
  setSummary(summary: string): void;
  summarize(summarizer?: (history: string) => Promise<string>): Promise<string>;
  getTokenUsage(): TokenUsage;
  getStats(): ConversationStats;
  fork(): ConversationManager;
  toJSON(): object;
  static fromJSON(data: object, options?: ConversationManagerOptions): ConversationManager;
}

export interface ContextWindowOptions {
  maxTokens?: number;
  reservedTokens?: number;
  tokenCounter?: (text: string) => number;
}

export interface ContextUtilization {
  usedTokens: number;
  availableTokens: number;
  maxTokens: number;
  reservedTokens: number;
  utilization: number;
  remaining: number;
  fits: boolean;
}

export class ContextWindow {
  constructor(options?: ContextWindowOptions);
  readonly availableTokens: number;
  countTokens(text: string): number;
  fits(content: string | string[]): boolean;
  truncate(text: string, maxTokens?: number): string;
  fitItems(items: Array<{ content: string; priority?: number }>): string[];
  buildContext(messages: Array<{ role: string; content: string }>, options?: { systemFirst?: boolean }): Array<{ role: string; content: string }>;
  getUtilization(content: string | string[]): ContextUtilization;
}

export const tokenCounters: {
  simple: (text: string) => number;
  wordBased: (text: string) => number;
  gptApprox: (text: string) => number;
};

export const modelContextLimits: Record<string, number>;

export function getContextLimit(model: string): number;

export function createSummarizer(client: any, options?: { model?: string; prompt?: string }): (history: string) => Promise<string>;

export function extractiveSummarize(text: string, options?: { maxSentences?: number; maxLength?: number }): string;

export function summarizeByRoles(messages: Array<{ role: string; content: string }>, options?: object): string;

export class ProgressiveSummarizer {
  constructor(options?: { summarizer?: (text: string) => Promise<string>; maxHistoryLength?: number });
  currentSummary: string;
  addText(text: string): void;
  addMessage(role: string, content: string): void;
  needsSummarization(): boolean;
  summarizeIfNeeded(): Promise<string | null>;
  summarize(): Promise<string>;
  getContext(): string;
  reset(): void;
}

// ==================== RAG Evaluation (v2.3.0+) ====================

export function precisionAtK(retrieved: string[], relevant: string[], k: number): number;
export function recallAtK(retrieved: string[], relevant: string[], k: number): number;
export function f1AtK(retrieved: string[], relevant: string[], k: number): number;
export function meanReciprocalRank(retrieved: string[], relevant: string[]): number;
export function averageMRR(queries: Array<{ retrieved: string[]; relevant: string[] }>): number;
export function dcg(relevanceScores: number[], k: number): number;
export function ndcgAtK(retrieved: string[], relevanceMap: Record<string, number>, k: number): number;
export function ndcgAtKBinary(retrieved: string[], relevant: string[], k: number): number;
export function averagePrecision(retrieved: string[], relevant: string[]): number;
export function meanAveragePrecision(queries: Array<{ retrieved: string[]; relevant: string[] }>): number;
export function hitAtK(retrieved: string[], relevant: string[], k: number): number;
export function averageHitRate(queries: Array<{ retrieved: string[]; relevant: string[] }>, k: number): number;

export interface MetricsResult {
  mrr: number;
  ap: number;
  [key: string]: number;
}

export function calculateAllMetrics(retrieved: string[], relevant: string[], options?: { kValues?: number[]; relevanceScores?: Record<string, number> }): MetricsResult;
export function calculateAggregateMetrics(queries: Array<{ retrieved: string[]; relevant: string[] }>, options?: { kValues?: number[] }): MetricsResult;

export interface EvaluationQuery {
  query: string;
  relevantDocs: string[];
  relevanceScores?: Record<string, number>;
}

export interface EvaluationSummary {
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface EvaluationResult {
  metrics: MetricsResult;
  queryResults: Array<{
    query: string;
    retrieved: string[];
    relevant: string[];
    metrics: MetricsResult;
    retrievedDocs: Array<{ id: string; score: number; isRelevant: boolean }>;
  }>;
  summary: EvaluationSummary;
}

export interface RAGEvaluatorOptions {
  kValues?: number[];
  includePerQuery?: boolean;
}

export class RAGEvaluator {
  constructor(retriever: Retriever, options?: RAGEvaluatorOptions);
  evaluate(testQueries: EvaluationQuery[], options?: { onProgress?: (current: number, total: number, metrics: MetricsResult) => void; retrievalOptions?: object }): Promise<EvaluationResult>;
  quickEvaluate(testQueries: EvaluationQuery[], metric?: string): Promise<number>;
  static compare(retrieverA: Retriever, retrieverB: Retriever, testQueries: EvaluationQuery[], options?: RAGEvaluatorOptions): Promise<{
    retrieverA: MetricsResult;
    retrieverB: MetricsResult;
    differences: Record<string, { absolute: number; relative: number }>;
    winner: Record<string, 'A' | 'B' | 'tie'>;
  }>;
}

export function evaluateRetrieval(retriever: Retriever, testQueries: EvaluationQuery[], options?: RAGEvaluatorOptions): Promise<EvaluationResult>;

export interface BenchmarkResult {
  name: string;
  metrics: MetricsResult;
  summary: EvaluationSummary;
  latency: {
    average: number;
    min: number;
    max: number;
    p95: number;
  };
  throughput: number;
}

export class BenchmarkRunner {
  constructor();
  addRetriever(name: string, retriever: Retriever): BenchmarkRunner;
  removeRetriever(name: string): BenchmarkRunner;
  run(testQueries: EvaluationQuery[], options?: { kValues?: number[] }): Promise<BenchmarkResult[]>;
  runComparison(testQueries: EvaluationQuery[]): Promise<{
    results: BenchmarkResult[];
    rankings: Record<string, Array<{ rank: number; name: string; value: number }>>;
    overall: Array<{ name: string; score: number; latency: number }>;
    fastest: string;
  }>;
  printReport(results: BenchmarkResult[]): void;
  exportJSON(results: BenchmarkResult[]): string;
}

export function createTestDataset(documents: Document[], options?: { queriesPerDoc?: number }): EvaluationQuery[];

// ==================== Vector Store Adapters (v2.3.0+) ====================

export interface ChromaStoreOptions extends VectorStoreOptions {
  collectionName?: string;
  host?: string;
  port?: number;
  path?: string;
  metadata?: Record<string, any>;
  distanceFunction?: 'cosine' | 'l2' | 'ip';
}

export class ChromaVectorStore {
  constructor(embeddingFn: EmbeddingFunction, options?: ChromaStoreOptions);
  initialize(): Promise<void>;
  addDocument(doc: Document): Promise<boolean>;
  addDocuments(docs: Document[], options?: AddDocumentsOptions): Promise<boolean>;
  similaritySearch(query: string, k?: number, options?: { filter?: Record<string, any> }): Promise<Document[]>;
  getDocument(id: string): Promise<Document | null>;
  updateDocument(id: string, newText: string, newMeta?: Record<string, any>): Promise<boolean>;
  deleteDocument(id: string): Promise<boolean>;
  deleteWhere(filter: Record<string, any>): Promise<number>;
  getStats(): Promise<{ documentCount: number; collectionName: string; distanceFunction: string; host: string; port: number }>;
  clear(): Promise<void>;
  listCollections(): Promise<string[]>;
  switchCollection(collectionName: string): Promise<void>;
  close(): Promise<void>;
}

export interface QdrantStoreOptions extends VectorStoreOptions {
  collectionName?: string;
  host?: string;
  port?: number;
  apiKey?: string;
  https?: boolean;
  vectorSize?: number;
  distance?: 'Cosine' | 'Euclid' | 'Dot';
}

export class QdrantVectorStore {
  constructor(embeddingFn: EmbeddingFunction, options?: QdrantStoreOptions);
  initialize(): Promise<void>;
  addDocument(doc: Document): Promise<boolean>;
  addDocuments(docs: Document[], options?: AddDocumentsOptions): Promise<boolean>;
  similaritySearch(query: string, k?: number, options?: { filter?: Record<string, any>; scoreThreshold?: number }): Promise<Document[]>;
  getDocument(id: string): Promise<Document | null>;
  updateDocument(id: string, newText: string, newMeta?: Record<string, any>): Promise<boolean>;
  deleteDocument(id: string): Promise<boolean>;
  deleteWhere(filter: Record<string, any>): Promise<void>;
  getStats(): Promise<{ documentCount: number; vectorCount: number; collectionName: string; vectorSize: number; distance: string; status: string }>;
  clear(): Promise<void>;
  listCollections(): Promise<string[]>;
  close(): Promise<void>;
}

export type VectorStoreType = 'memory' | 'inmemory' | 'sqlite' | 'chroma' | 'qdrant';

export function createVectorStore(type: 'memory' | 'inmemory', embeddingFn: EmbeddingFunction, options?: VectorStoreOptions): Promise<InMemoryVectorStore>;
export function createVectorStore(type: 'sqlite', embeddingFn: EmbeddingFunction, options: VectorStoreOptions & { dbPath: string }): Promise<any>;
export function createVectorStore(type: 'chroma', embeddingFn: EmbeddingFunction, options?: ChromaStoreOptions): Promise<ChromaVectorStore>;
export function createVectorStore(type: 'qdrant', embeddingFn: EmbeddingFunction, options?: QdrantStoreOptions): Promise<QdrantVectorStore>;
export function createVectorStore(type: VectorStoreType, embeddingFn: EmbeddingFunction, options?: VectorStoreOptions): Promise<InMemoryVectorStore | ChromaVectorStore | QdrantVectorStore | any>;
