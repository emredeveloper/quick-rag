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
  constructor(embeddingFn) {
    if (!embeddingFn) throw new Error('embeddingFn required');
    this.embeddingFn = embeddingFn;
    this.items = []; // { id, text, meta, vector }
  }

  async addDocuments(docs) {
    for (const d of docs) {
      const vec = await this.embeddingFn(d.text);
      this.items.push({ id: d.id || String(this.items.length), text: d.text, meta: d.meta || {}, vector: vec });
    }
  }

  // Return top-k nearest documents by cosine similarity
  async similaritySearch(query, k = 3) {
    const qVec = await this.embeddingFn(query);
    const scored = this.items.map(it => ({ score: cosine(qVec, it.vector), doc: it }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, k).map(s => ({ ...s.doc, score: s.score }));
  }
}
