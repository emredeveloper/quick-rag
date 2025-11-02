export class Retriever {
  constructor(vectorStore, options = {}) {
    this.store = vectorStore;
    this.k = options.k || 3;
  }

  async getRelevant(query) {
    return this.store.similaritySearch(query, this.k);
  }
}
