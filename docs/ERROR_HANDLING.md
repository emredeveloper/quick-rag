# Error Handling Guide

## Overview

Quick RAG v2.1.0+ includes a comprehensive error handling system with:

- ✅ **Custom error classes** - Specific error types for different failures
- ✅ **Error codes** - Programmatic error identification
- ✅ **Rich metadata** - Context and debugging information
- ✅ **Helpful suggestions** - How to fix the error
- ✅ **Type safety** - Full TypeScript support

## Error Classes

### RAGError (Base Class)

All Quick RAG errors extend from `RAGError`.

```javascript
import { RAGError, isRAGError } from 'quick-rag';

try {
  // ... your code
} catch (error) {
  if (isRAGError(error)) {
    console.log('Error code:', error.code);
    console.log('Message:', error.message);
    console.log('Metadata:', error.metadata);
    console.log('Timestamp:', error.timestamp);
  }
}
```

### EmbeddingError

Thrown when embedding operations fail.

**Common scenarios:**
- Embedding model not found
- Dimension mismatch
- Batch size too large
- Network errors

**Examples:**

```javascript
import { EmbeddingError } from 'quick-rag';

// Model not found
throw EmbeddingError.modelNotFound('embeddinggemma');
// Error: Embedding model "embeddinggemma" not found
// Suggestion: Check if the model is pulled/loaded

// Dimension mismatch
throw EmbeddingError.dimensionMismatch(768, 1536);
// Error: Embedding dimension mismatch: expected 768, got 1536
// Suggestion: Ensure all embeddings use the same dimension

// Batch too large
throw EmbeddingError.batchTooLarge(100, 50);
// Error: Batch size 100 exceeds maximum 50
// Suggestion: Reduce batch size or process in chunks

// Network error
throw EmbeddingError.networkError(originalError);
// Error: Failed to fetch embeddings from server
// Suggestion: Check if Ollama/LM Studio is running and accessible
```

### RetrievalError

Thrown when document retrieval fails.

**Common scenarios:**
- Empty vector store
- Invalid topK parameter
- No results matching filters
- Score below threshold

**Examples:**

```javascript
import { RetrievalError } from 'quick-rag';

// Empty store
throw RetrievalError.emptyVectorStore();
// Error: Cannot retrieve from empty vector store
// Suggestion: Add documents using vectorStore.addDocuments()

// Invalid topK
throw RetrievalError.invalidTopK(10, 5);
// Error: Cannot retrieve 10 documents, only 5 available
// Suggestion: Reduce topK to 5 or less

// Filter no results
throw RetrievalError.filterNoResults({ category: 'programming' });
// Error: No documents match the provided filters
// Suggestion: Try broader filter criteria

// Score below threshold
throw RetrievalError.scoreBelowThreshold(0.8, 0.6);
// Error: All results below minimum score threshold
// Suggestion: Lower the minScore threshold or refine the query
```

### DocumentLoadError

Thrown when document loading/processing fails.

**Common scenarios:**
- File not found
- Unsupported format
- Parsing error
- Missing dependency

**Examples:**

```javascript
import { DocumentLoadError } from 'quick-rag';

// File not found
throw DocumentLoadError.fileNotFound('./document.pdf');
// Error: File not found: ./document.pdf
// Suggestion: Check if the file path is correct

// Unsupported format
throw DocumentLoadError.unsupportedFormat('./doc.xyz', 'xyz');
// Error: Unsupported file format: xyz
// Suggestion: Supported formats: .pdf, .docx, .xlsx, .txt, .md, .json

// Parsing error
throw DocumentLoadError.parsingError('./doc.pdf', originalError);
// Error: Failed to parse document: ./doc.pdf
// Suggestion: Check if the file is corrupted or in the correct format

// Missing dependency
throw DocumentLoadError.dependencyMissing('pdf', 'pdf-parse');
// Error: Missing dependency for pdf files: pdf-parse
// Suggestion: Install with: npm install pdf-parse
```

### VectorStoreError

Thrown when vector store operations fail.

**Common scenarios:**
- Document not found
- Duplicate ID
- Invalid document
- Connection error

**Examples:**

```javascript
import { VectorStoreError } from 'quick-rag';

// Document not found
throw VectorStoreError.documentNotFound('doc-123');
// Error: Document with id "doc-123" not found
// Suggestion: Check if the document ID is correct

// Duplicate ID
throw VectorStoreError.duplicateId('doc-123');
// Error: Document with id "doc-123" already exists
// Suggestion: Use a unique ID or update the existing document

// Invalid document
throw VectorStoreError.invalidDocument('text field is required');
// Error: Invalid document: text field is required
// Suggestion: Ensure document has required fields: text

// Connection error
throw VectorStoreError.connectionError('ChromaDB', originalError);
// Error: Failed to connect to ChromaDB
// Suggestion: Check if the vector database is running and accessible
```

### GenerationError

Thrown when LLM generation fails.

**Common scenarios:**
- Model not available
- Context too long
- Streaming not supported

**Examples:**

```javascript
import { GenerationError } from 'quick-rag';

// Model not available
throw GenerationError.modelNotAvailable('granite4:3b');
// Error: Model "granite4:3b" is not available
// Suggestion: Check available models with client.list()

// Context too long
throw GenerationError.contextTooLong(8000, 4096);
// Error: Context length 8000 exceeds model limit 4096
// Suggestion: Reduce the number of retrieved documents or use a larger model

// Streaming not supported
throw GenerationError.streamingNotSupported('BrowserClient');
// Error: Streaming is not supported for BrowserClient
// Suggestion: Use a client that supports streaming
```

### ConfigurationError

Thrown when configuration is invalid.

**Common scenarios:**
- Missing required parameter
- Invalid value
- Incompatible options

**Examples:**

```javascript
import { ConfigurationError } from 'quick-rag';

// Missing required
throw ConfigurationError.missingRequired('embeddingFn');
// Error: Missing required parameter: embeddingFn
// Suggestion: Provide the embeddingFn parameter

// Invalid value
throw ConfigurationError.invalidValue('topK', -1, 'positive integer');
// Error: Invalid value for topK: -1
// Suggestion: Expected positive integer

// Incompatible options
throw ConfigurationError.incompatibleOptions('useBrowser', 'nodeOnly');
// Error: Options useBrowser and nodeOnly are incompatible
// Suggestion: Choose one of the options
```

## Error Handling Patterns

### Pattern 1: Try-Catch with Type Checking

```javascript
import { 
  EmbeddingError, 
  VectorStoreError,
  isRAGError 
} from 'quick-rag';

try {
  await vectorStore.addDocuments(docs);
} catch (error) {
  if (error instanceof EmbeddingError) {
    console.error('Embedding failed:', error.message);
    console.log('Suggestion:', error.metadata.suggestion);
  } else if (error instanceof VectorStoreError) {
    console.error('Vector store error:', error.message);
  } else if (isRAGError(error)) {
    console.error('RAG error:', error.code, error.message);
  } else {
    console.error('Unknown error:', error);
  }
}
```

### Pattern 2: Error Code Handling

```javascript
import { getErrorCode, getErrorMetadata } from 'quick-rag';

try {
  await retriever.getRelevant(query, 5);
} catch (error) {
  const code = getErrorCode(error);
  const metadata = getErrorMetadata(error);

  switch (code) {
    case 'EMBEDDING_ERROR':
      // Handle embedding errors
      console.log('Check Ollama/LM Studio is running');
      break;
    
    case 'RETRIEVAL_ERROR':
      // Handle retrieval errors
      console.log('Try adding more documents');
      break;
    
    case 'VECTOR_STORE_ERROR':
      // Handle store errors
      console.log('Check database connection');
      break;
    
    default:
      console.error('Unknown error:', code);
  }
}
```

### Pattern 3: Graceful Degradation

```javascript
async function robustRetrieval(query, topK = 5) {
  try {
    return await retriever.getRelevant(query, topK);
  } catch (error) {
    if (error instanceof RetrievalError) {
      // Try with fewer results
      if (error.code === 'INVALID_TOPK') {
        const available = error.metadata.available;
        console.log(`Reducing topK from ${topK} to ${available}`);
        return await retriever.getRelevant(query, available);
      }
      
      // Try without filters
      if (error.code === 'FILTER_NO_RESULTS') {
        console.log('No results with filters, trying without...');
        return await retriever.getRelevant(query, topK);
      }
    }
    
    // If can't recover, re-throw
    throw error;
  }
}
```

### Pattern 4: User-Friendly Messages

```javascript
function getUserFriendlyMessage(error) {
  if (!isRAGError(error)) {
    return 'An unexpected error occurred';
  }

  const messages = {
    'EMBEDDING_ERROR': 'Unable to process your request. Please try again.',
    'RETRIEVAL_ERROR': 'No relevant information found. Try rephrasing your question.',
    'DOCUMENT_LOAD_ERROR': 'Unable to load the document. Please check the file.',
    'VECTOR_STORE_ERROR': 'Database error. Please contact support.',
    'GENERATION_ERROR': 'Unable to generate a response. Please try again.',
    'CONFIGURATION_ERROR': 'Invalid configuration. Please check your settings.'
  };

  return messages[error.code] || error.message;
}

// Usage
try {
  await performRAG(query);
} catch (error) {
  const userMessage = getUserFriendlyMessage(error);
  showToUser(userMessage);
  
  // Log technical details
  if (isRAGError(error)) {
    console.error('Technical details:', {
      code: error.code,
      message: error.message,
      metadata: error.metadata,
      timestamp: error.timestamp
    });
  }
}
```

### Pattern 5: Error Logging

```javascript
import { isRAGError } from 'quick-rag';

class ErrorLogger {
  logError(error, context = {}) {
    if (isRAGError(error)) {
      console.error({
        type: 'RAG_ERROR',
        code: error.code,
        message: error.message,
        metadata: error.metadata,
        timestamp: error.timestamp,
        context,
        stack: error.stack
      });
    } else {
      console.error({
        type: 'UNKNOWN_ERROR',
        message: error.message,
        context,
        stack: error.stack
      });
    }
  }
}

const logger = new ErrorLogger();

try {
  await vectorStore.addDocuments(docs);
} catch (error) {
  logger.logError(error, { 
    operation: 'addDocuments',
    documentCount: docs.length 
  });
  throw error;
}
```

## Best Practices

### 1. Always Handle RAG Errors

```javascript
// ❌ Bad - Errors bubble up
await vectorStore.addDocuments(docs);

// ✅ Good - Handle errors explicitly
try {
  await vectorStore.addDocuments(docs);
} catch (error) {
  if (isRAGError(error)) {
    console.error('RAG error:', error.code);
    // Handle gracefully
  }
  throw error;
}
```

### 2. Use Error Metadata

```javascript
try {
  await vectorStore.addDocuments(docs);
} catch (error) {
  if (error instanceof EmbeddingError) {
    // Access helpful metadata
    console.log('Suggestion:', error.metadata.suggestion);
    
    if (error.metadata.modelName) {
      console.log('Failed model:', error.metadata.modelName);
    }
  }
}
```

### 3. Provide Context in Error Logs

```javascript
try {
  await retriever.getRelevant(query, topK);
} catch (error) {
  console.error('Retrieval failed:', {
    query,
    topK,
    error: error.toJSON ? error.toJSON() : error
  });
}
```

### 4. Don't Swallow Errors

```javascript
// ❌ Bad - Silent failure
try {
  await vectorStore.addDocuments(docs);
} catch (error) {
  // Nothing!
}

// ✅ Good - Log and handle
try {
  await vectorStore.addDocuments(docs);
} catch (error) {
  console.error('Failed to add documents:', error);
  // Notify user or retry
  throw error;
}
```

### 5. Validate Early

```javascript
// Validate inputs before expensive operations
function validateQuery(query, topK) {
  if (!query || typeof query !== 'string') {
    throw ConfigurationError.invalidValue('query', query, 'non-empty string');
  }
  
  if (topK <= 0) {
    throw ConfigurationError.invalidValue('topK', topK, 'positive integer');
  }
}

// Use before calling retriever
validateQuery(query, topK);
const results = await retriever.getRelevant(query, topK);
```

## Error Codes Reference

| Code | Error Class | Description |
|------|-------------|-------------|
| `EMBEDDING_ERROR` | EmbeddingError | Embedding operation failed |
| `RETRIEVAL_ERROR` | RetrievalError | Document retrieval failed |
| `DOCUMENT_LOAD_ERROR` | DocumentLoadError | Document loading failed |
| `VECTOR_STORE_ERROR` | VectorStoreError | Vector store operation failed |
| `GENERATION_ERROR` | GenerationError | LLM generation failed |
| `CONFIGURATION_ERROR` | ConfigurationError | Invalid configuration |

## Utility Functions

### isRAGError(error)

Check if an error is a RAG error.

```javascript
if (isRAGError(error)) {
  console.log('This is a RAG error');
}
```

### getErrorCode(error)

Get error code from any error.

```javascript
const code = getErrorCode(error);
console.log('Error code:', code); // 'EMBEDDING_ERROR' or 'UNKNOWN_ERROR'
```

### getErrorMetadata(error)

Extract metadata from any error.

```javascript
const metadata = getErrorMetadata(error);
console.log('Suggestion:', metadata.suggestion);
```

## Examples

See `example/14-error-handling-demo.js` for complete examples.

## Migration from v2.0

v2.0 didn't have structured errors:

```javascript
// v2.0 - Generic errors
try {
  await vectorStore.addDocuments(docs);
} catch (error) {
  console.error(error.message); // Generic message
}
```

v2.1+ has structured errors:

```javascript
// v2.1+ - Structured errors
import { EmbeddingError, isRAGError } from 'quick-rag';

try {
  await vectorStore.addDocuments(docs);
} catch (error) {
  if (error instanceof EmbeddingError) {
    console.error('Code:', error.code);
    console.error('Message:', error.message);
    console.error('Suggestion:', error.metadata.suggestion);
  }
}
```

## Learn More

- [ChromaDB Integration](./CHROMADB.md)
- [Quick RAG Documentation](https://github.com/emredeveloper/quick-rag)
