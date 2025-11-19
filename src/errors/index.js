/**
 * Custom Error Classes for Quick RAG
 * 
 * Provides structured error handling with error codes and metadata
 */

/**
 * Base RAG Error Class
 * All Quick RAG errors extend from this class
 */
export class RAGError extends Error {
  /**
   * @param {string} message - Error message
   * @param {string} code - Error code for programmatic handling
   * @param {Object} metadata - Additional error context
   */
  constructor(message, code, metadata = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.metadata = metadata;
    this.timestamp = new Date();
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert error to JSON for logging/serialization
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      metadata: this.metadata,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
}

/**
 * Embedding-related errors
 * Thrown when embedding operations fail
 */
export class EmbeddingError extends RAGError {
  constructor(message, metadata = {}) {
    super(message, 'EMBEDDING_ERROR', metadata);
  }

  static modelNotFound(modelName) {
    return new EmbeddingError(
      `Embedding model "${modelName}" not found`,
      { modelName, suggestion: 'Check if the model is pulled/loaded' }
    );
  }

  static dimensionMismatch(expected, actual) {
    return new EmbeddingError(
      `Embedding dimension mismatch: expected ${expected}, got ${actual}`,
      { expected, actual, suggestion: 'Ensure all embeddings use the same dimension' }
    );
  }

  static batchTooLarge(batchSize, maxSize) {
    return new EmbeddingError(
      `Batch size ${batchSize} exceeds maximum ${maxSize}`,
      { batchSize, maxSize, suggestion: 'Reduce batch size or process in chunks' }
    );
  }

  static networkError(originalError) {
    return new EmbeddingError(
      'Failed to fetch embeddings from server',
      { 
        originalError: originalError.message,
        suggestion: 'Check if Ollama/LM Studio is running and accessible'
      }
    );
  }
}

/**
 * Retrieval-related errors
 * Thrown when document retrieval fails
 */
export class RetrievalError extends RAGError {
  constructor(message, metadata = {}) {
    super(message, 'RETRIEVAL_ERROR', metadata);
  }

  static emptyVectorStore() {
    return new RetrievalError(
      'Cannot retrieve from empty vector store',
      { suggestion: 'Add documents using vectorStore.addDocuments()' }
    );
  }

  static invalidTopK(topK, available) {
    return new RetrievalError(
      `Cannot retrieve ${topK} documents, only ${available} available`,
      { topK, available, suggestion: `Reduce topK to ${available} or less` }
    );
  }

  static filterNoResults(filters) {
    return new RetrievalError(
      'No documents match the provided filters',
      { filters, suggestion: 'Try broader filter criteria' }
    );
  }

  static scoreBelowThreshold(minScore, actualScore) {
    return new RetrievalError(
      `All results below minimum score threshold`,
      { 
        minScore, 
        actualScore,
        suggestion: 'Lower the minScore threshold or refine the query'
      }
    );
  }
}

/**
 * Document loading errors
 * Thrown when document loading/processing fails
 */
export class DocumentLoadError extends RAGError {
  constructor(message, metadata = {}) {
    super(message, 'DOCUMENT_LOAD_ERROR', metadata);
  }

  static fileNotFound(filePath) {
    return new DocumentLoadError(
      `File not found: ${filePath}`,
      { filePath, suggestion: 'Check if the file path is correct' }
    );
  }

  static unsupportedFormat(filePath, format) {
    return new DocumentLoadError(
      `Unsupported file format: ${format}`,
      { 
        filePath, 
        format,
        suggestion: 'Supported formats: .pdf, .docx, .xlsx, .txt, .md, .json'
      }
    );
  }

  static parsingError(filePath, originalError) {
    return new DocumentLoadError(
      `Failed to parse document: ${filePath}`,
      { 
        filePath,
        originalError: originalError.message,
        suggestion: 'Check if the file is corrupted or in the correct format'
      }
    );
  }

  static dependencyMissing(format, dependency) {
    return new DocumentLoadError(
      `Missing dependency for ${format} files: ${dependency}`,
      { 
        format,
        dependency,
        suggestion: `Install with: npm install ${dependency}`
      }
    );
  }
}

/**
 * Vector store errors
 * Thrown when vector store operations fail
 */
export class VectorStoreError extends RAGError {
  constructor(message, metadata = {}) {
    super(message, 'VECTOR_STORE_ERROR', metadata);
  }

  static documentNotFound(id) {
    return new VectorStoreError(
      `Document with id "${id}" not found`,
      { id, suggestion: 'Check if the document ID is correct' }
    );
  }

  static duplicateId(id) {
    return new VectorStoreError(
      `Document with id "${id}" already exists`,
      { id, suggestion: 'Use a unique ID or update the existing document' }
    );
  }

  static invalidDocument(reason) {
    return new VectorStoreError(
      `Invalid document: ${reason}`,
      { reason, suggestion: 'Ensure document has required fields: text' }
    );
  }

  static connectionError(storeName, originalError) {
    return new VectorStoreError(
      `Failed to connect to ${storeName}`,
      {
        storeName,
        originalError: originalError.message,
        suggestion: 'Check if the vector database is running and accessible'
      }
    );
  }
}

/**
 * Generation errors
 * Thrown when LLM generation fails
 */
export class GenerationError extends RAGError {
  constructor(message, metadata = {}) {
    super(message, 'GENERATION_ERROR', metadata);
  }

  static modelNotAvailable(modelName) {
    return new GenerationError(
      `Model "${modelName}" is not available`,
      { modelName, suggestion: 'Check available models with client.list()' }
    );
  }

  static contextTooLong(tokenCount, maxTokens) {
    return new GenerationError(
      `Context length ${tokenCount} exceeds model limit ${maxTokens}`,
      { 
        tokenCount, 
        maxTokens,
        suggestion: 'Reduce the number of retrieved documents or use a larger model'
      }
    );
  }

  static streamingNotSupported(clientType) {
    return new GenerationError(
      `Streaming is not supported for ${clientType}`,
      { clientType, suggestion: 'Use a client that supports streaming' }
    );
  }
}

/**
 * Configuration errors
 * Thrown when configuration is invalid
 */
export class ConfigurationError extends RAGError {
  constructor(message, metadata = {}) {
    super(message, 'CONFIGURATION_ERROR', metadata);
  }

  static missingRequired(paramName) {
    return new ConfigurationError(
      `Missing required parameter: ${paramName}`,
      { paramName, suggestion: `Provide the ${paramName} parameter` }
    );
  }

  static invalidValue(paramName, value, expected) {
    return new ConfigurationError(
      `Invalid value for ${paramName}: ${value}`,
      { 
        paramName, 
        value, 
        expected,
        suggestion: `Expected ${expected}`
      }
    );
  }

  static incompatibleOptions(option1, option2) {
    return new ConfigurationError(
      `Options ${option1} and ${option2} are incompatible`,
      { option1, option2, suggestion: 'Choose one of the options' }
    );
  }
}

/**
 * Helper function to check if an error is a RAG error
 */
export function isRAGError(error) {
  return error instanceof RAGError;
}

/**
 * Helper function to get error code
 */
export function getErrorCode(error) {
  return error instanceof RAGError ? error.code : 'UNKNOWN_ERROR';
}

/**
 * Helper function to safely extract error metadata
 */
export function getErrorMetadata(error) {
  if (error instanceof RAGError) {
    return error.metadata;
  }
  return { originalError: error.message };
}
