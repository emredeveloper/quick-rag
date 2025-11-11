// Very small in-memory vector store for prototyping.
// Requires a user-supplied embedding function: async (text) => number[]

function dot(a, b) {
  return a.reduce((s, v, i) => s + v * b[i], 0);
}

function norm(a) {
  return Math.sqrt(dot(a, a));
}

function cosine(a, b) {
  const n = norm(a) * norm(b);
  return n === 0 ? 0 : dot(a, b) / n;
}

export class InMemoryVectorStore {
  constructor(embeddingFn, options = {}) {
    if (!embeddingFn) throw new Error('embeddingFn required');
    this.embeddingFn = embeddingFn;
    this.items = []; // { id, text, meta, vector, dim }
    this.defaultDim = options.defaultDim || 768;
    this.autoChunkThreshold = options.autoChunkThreshold || 10000; // Auto-chunk documents > 10KB
    this.chunkSize = options.chunkSize || 1000;
    this.chunkOverlap = options.chunkOverlap || 100;
  }

  // addDocuments(docs, opts = { dim, onProgress, chunkDocuments, batchSize, maxConcurrent })
  // If opts.dim provided, request embeddings at that dimension (if embeddingFn supports it).
  // If opts.onProgress provided, called with (current, total, currentDoc) for progress tracking
  // If opts.chunkDocuments provided and document is large, will auto-chunk before embedding
  async addDocuments(docs, opts = {}) {
    const dim = opts.dim || this.defaultDim;
    const onProgress = opts.onProgress;
    const autoChunk = opts.autoChunk !== false; // Default: true
    const batchSize = opts.batchSize || 10; // Process embeddings in batches
    const maxConcurrent = opts.maxConcurrent || 5; // Max concurrent requests
    
    // Check if any document needs chunking
    const needsChunking = autoChunk && docs.some(d => d.text && d.text.length > this.autoChunkThreshold);
    
    if (needsChunking && typeof opts.chunkDocuments === 'function') {
      // Use provided chunking function
      const allChunks = [];
      for (let i = 0; i < docs.length; i++) {
        const doc = docs[i];
        if (doc.text && doc.text.length > this.autoChunkThreshold) {
          const chunks = opts.chunkDocuments([doc], {
            chunkSize: this.chunkSize,
            overlap: this.chunkOverlap
          });
          allChunks.push(...chunks);
        } else {
          allChunks.push(doc);
        }
      }
      
      // Process chunks with progress
      return this.addDocuments(allChunks, { ...opts, autoChunk: false });
    }
    
    // Batch embedding for better performance
    const totalDocs = docs.length;
    const vectors = [];
    
    // Process in batches to avoid overwhelming the server
    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = docs.slice(i, i + batchSize);
      const batchTexts = batch.map(d => d.text);
      
      // Check if embedding function supports batch (array input)
      let batchVectors;
      try {
        // Try batch embedding first (if supported)
        const batchResult = await this.embeddingFn(batchTexts, dim);
        if (Array.isArray(batchResult) && Array.isArray(batchResult[0])) {
          // Batch result: array of vectors
          batchVectors = batchResult;
        } else {
          // Single result or unexpected format, fall back to individual
          batchVectors = await Promise.all(
            batch.map((d, idx) => {
              const promise = this.embeddingFn(d.text, dim);
              if (onProgress) {
                promise.then(() => {
                  onProgress(i + idx + 1, totalDocs, d);
                });
              }
              return promise;
            })
          );
        }
      } catch (error) {
        // If batch fails, fall back to individual requests with rate limiting
        const semaphore = { count: 0 };
        const queue = [];
        
        for (let j = 0; j < batch.length; j++) {
          const doc = batch[j];
          const promise = (async () => {
            // Wait if too many concurrent requests
            while (semaphore.count >= maxConcurrent) {
              await new Promise(resolve => setTimeout(resolve, 50));
            }
            
            semaphore.count++;
            try {
              const vec = await this.embeddingFn(doc.text, dim);
              if (onProgress) {
                onProgress(i + j + 1, totalDocs, doc);
              }
              return vec;
            } finally {
              semaphore.count--;
            }
          })();
          queue.push(promise);
        }
        
        batchVectors = await Promise.all(queue);
      }
      
      vectors.push(...batchVectors);
      
      // Update progress for batch
      if (onProgress && i + batch.length <= totalDocs) {
        onProgress(Math.min(i + batch.length, totalDocs), totalDocs);
      }
      
      // Small delay between batches to prevent overwhelming
      if (i + batchSize < docs.length) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
    
    docs.forEach((d, idx) => {
      this.items.push({ 
        id: d.id || String(this.items.length), 
        text: d.text, 
        meta: d.meta || {}, 
        vector: vectors[idx], 
        dim 
      });
    });
  }

  // Add a single document (convenience method)
  // Supports onProgress callback: (current, total) => void
  async addDocument(doc, opts = {}) {
    return this.addDocuments([doc], opts);
  }

  // Return top-k nearest documents by cosine similarity. Accepts queryDim to control query embedding size.
  async similaritySearch(query, k = 3, queryDim) {
    const dim = queryDim || this.defaultDim;
    const qVec = await this.embeddingFn(query, dim);
    const scored = this.items.map(it => ({ score: cosine(qVec, it.vector), doc: it }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, k).map(s => ({ ...s.doc, score: s.score }));
  }

  // Delete a document by id
  deleteDocument(id) {
    const index = this.items.findIndex(item => item.id === id);
    if (index !== -1) {
      this.items.splice(index, 1);
      return true;
    }
    return false;
  }

  // Update a document by id (re-embeds the text)
  async updateDocument(id, newText, newMeta) {
    const index = this.items.findIndex(item => item.id === id);
    if (index === -1) return false;
    
    const item = this.items[index];
    const dim = item.dim || this.defaultDim;
    const vec = await this.embeddingFn(newText, dim);
    
    this.items[index] = {
      ...item,
      text: newText,
      meta: newMeta !== undefined ? newMeta : item.meta,
      vector: vec
    };
    return true;
  }

  // Get document by id
  getDocument(id) {
    return this.items.find(item => item.id === id);
  }

  // Get all documents
  getAllDocuments() {
    return [...this.items];
  }

  // Clear all documents
  clear() {
    this.items = [];
  }
}
