/**
 * Generate text with RAG (Retrieval-Augmented Generation)
 * 
 * Supports two call signatures:
 * 1. New: generateWithRAG(client, model, query, results)
 * 2. Legacy: generateWithRAG({ retriever, modelClient, model, query, ... })
 */
export async function generateWithRAG(clientOrOptions, model, query, results) {
  // Check if using new API (4 parameters) or legacy API (1 object parameter)
  if (typeof clientOrOptions === 'object' && arguments.length === 1) {
    // Legacy API: { retriever, modelClient, model, query, ... }
    const { retriever, modelClient, model, query, promptTemplate, topK = 3, prepend = '\nContext:\n' } = clientOrOptions;
    
    // 1) fetch top-k docs
    const docs = await retriever.getRelevant(query, topK);

    // 2) build context string
    const context = docs.map((d, i) => `Doc ${i + 1} (score=${(d.score||0).toFixed(3)}):\n${d.text}`).join('\n\n');

    // 3) merge into the prompt
    const prompt = (promptTemplate || ((q, ctx) => `${ctx}\n\nUser: ${q}\nAssistant:`))(query, prepend + context);

    // 4) call model
    const res = await modelClient.generate(model, prompt);
    
    // 5) return docs, response AND prompt
    return { docs, response: res, prompt };
  } else {
    // New API: generateWithRAG(client, model, query, results)
    const client = clientOrOptions;
    const docs = results;
    
    // Build context from results
    const context = docs.map((d, i) => `Doc ${i + 1}:\n${d.text}`).join('\n\n');
    
    // Create prompt
    const prompt = `Context:\n${context}\n\nQuestion: ${query}\n\nAnswer based on the context:`;
    
    // Generate response using client
    let response;
    
    // Check client type and use appropriate API
    if (client.constructor.name === 'OllamaRAGClient') {
      // OllamaRAGClient uses official Ollama SDK format
      const result = await client.chat({
        model,
        messages: [{ role: 'user', content: prompt }]
      });
      response = result.message?.content || result.content || result;
    } else if (client.constructor.name === 'LMStudioRAGClient') {
      // LMStudioRAGClient uses modelPath, prompt, options format
      response = await client.chat(model, prompt, {
        temperature: 0.7,
        maxPredictedTokens: 512
      });
    } else if (client.chat) {
      // Generic chat API
      const result = await client.chat({
        model,
        messages: [{ role: 'user', content: prompt }]
      });
      response = result.message?.content || result.content || result;
    } else if (client.generate) {
      // Fallback to generate API
      const result = await client.generate({ model, prompt });
      response = result.response || result;
    } else {
      throw new Error('Client must have chat() or generate() method');
    }
    
    return { docs, response, prompt };
  }
}
