export class Retriever {
  constructor(vectorStore, options = {}) {
    this.store = vectorStore;
    this.k = options.k || 3;
  }

  async getRelevant(query, topK) {
    // Use provided topK or fall back to instance default
    const k = topK !== undefined ? topK : this.k;
    return this.store.similaritySearch(query, k);
  }
}
