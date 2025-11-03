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
  }

  // addDocuments(docs, opts = { dim })
  // If opts.dim provided, request embeddings at that dimension (if embeddingFn supports it).
  async addDocuments(docs, opts = {}) {
    const dim = opts.dim || this.defaultDim;
    
    // Batch embedding for better performance
    const embedPromises = docs.map(d => this.embeddingFn(d.text, dim));
    const vectors = await Promise.all(embedPromises);
    
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
