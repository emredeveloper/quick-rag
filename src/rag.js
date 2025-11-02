// Simple RAG orchestration: retrieve context, then call model with a prompt
export async function generateWithRAG({ retriever, modelClient, model, query, promptTemplate, topK = 3, prepend = '\nContext:\n' }) {
  // 1) fetch top-k docs
  const docs = await retriever.getRelevant(query);

  // 2) build context string
  const context = docs.map((d, i) => `Doc ${i + 1} (score=${(d.score||0).toFixed(3)}):\n${d.text}`).join('\n\n');

  // 3) merge into the prompt
  const prompt = (promptTemplate || ((q, ctx) => `${ctx}\n\nUser: ${q}\nAssistant:`))(query, prepend + context);

  // 4) call model
  const res = await modelClient.generate(model, prompt);
  return { docs, response: res };
}
