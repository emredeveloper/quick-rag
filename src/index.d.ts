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
): Promise<{ response: string; docs: Document[] }>;

export function generateWithRAG(
  client: OllamaRAGClient | LMStudioRAGClient,
  model: string,
  query: string,
  results: Document[],
  options?: GenerateWithRAGOptionsV2
): Promise<string>;

// ==================== Init RAG ====================

export interface InitRAGOptions {
  defaultDim?: number;
  k?: number;
  baseEmbeddingOptions?: {
    useBrowser?: boolean;
    baseUrl?: string;
    model?: string;
    headers?: Record<string, string>;
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
