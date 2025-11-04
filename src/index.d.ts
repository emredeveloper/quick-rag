/**
 * Quick RAG - TypeScript Definitions
 * Official type definitions for quick-rag package
 */

// ==================== Core Types ====================

export interface Document {
  id?: string;
  text: string;
  meta?: Record<string, any>;
  vector?: number[];
  dim?: number;
  score?: number;
}

export interface EmbeddingOptions {
  dim?: number;
  [key: string]: any;
}

export type EmbeddingFunction = (text: string, dim?: number) => Promise<number[]>;

// ==================== Vector Store ====================

export interface VectorStoreOptions {
  defaultDim?: number;
}

export class InMemoryVectorStore {
  constructor(embeddingFn: EmbeddingFunction, options?: VectorStoreOptions);
  
  addDocuments(docs: Document[], opts?: { dim?: number }): Promise<void>;
  addDocument(doc: Document, opts?: { dim?: number }): Promise<void>;
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
  filters?: Record<string, any>;
  minScore?: number;
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

export function generateWithRAG(
  options: GenerateWithRAGOptions
): Promise<{ response: string; docs: Document[] }>;

export function generateWithRAG(
  client: OllamaRAGClient | LMStudioRAGClient,
  model: string,
  query: string,
  results: Document[]
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
