/**
 * Generate text with RAG (Retrieval-Augmented Generation)
 */

import { GenerationError } from './errors/index.js';
import { logger } from './utils/logger.js';
import { metrics } from './utils/metrics.js';

/**
 * @typedef {Object} RAGOptions
 * @property {string} [systemPrompt] - System instructions
 * @property {string|Function} [template] - Prompt template
 * @property {import('./promptManager').PromptManager} [promptManager]
 * @property {Object} [context] - Context formatting options
 * @property {boolean} [context.includeScores]
 * @property {boolean} [context.includeMetadata]
 */

/**
 * @typedef {Object} RAGResult
 * @property {string} response - Generated text
 * @property {import('./vectorStore').Document[]} docs - Retrieved documents
 * @property {string} prompt - Final prompt used
 */

/**
 * Generate response using RAG
 * 
 * @param {Object|any} clientOrOptions - Model client or legacy options object
 * @param {string} [model] - Model name
 * @param {string} [query] - User query
 * @param {import('./vectorStore').Document[]} [results] - Retrieved documents
 * @param {RAGOptions} [options] - Generation options
 * @returns {Promise<RAGResult>}
 */
export async function generateWithRAG(clientOrOptions, model, query, results, options = {}) {
  const start = Date.now();

  // Handle legacy signature: generateWithRAG({ retriever, modelClient, ... })
  if (typeof clientOrOptions === 'object' && arguments.length === 1) {
    return _handleLegacyRAG(clientOrOptions);
  }

  const client = clientOrOptions;
  const docs = results;

  try {
    // 1. Build Prompt
    let prompt;
    if (options.promptManager) {
      prompt = options.promptManager.generate(query, docs, options);
    } else {
      prompt = _buildDefaultPrompt(query, docs, options);
    }

    // 2. Generate Response
    let response;

    if (client.constructor.name === 'OllamaRAGClient') {
      const result = await client.chat({
        model,
        messages: [{ role: 'user', content: prompt }]
      });
      response = result.message?.content || result.content || result;
    } else if (client.constructor.name === 'LMStudioRAGClient') {
      response = await client.chat(model, prompt, {
        temperature: 0.7,
        maxPredictedTokens: 512
      });
    } else if (client.chat) {
      const result = await client.chat({
        model,
        messages: [{ role: 'user', content: prompt }]
      });
      response = result.message?.content || result.content || result;
    } else if (client.generate) {
      const result = await client.generate({ model, prompt });
      response = result.response || result;
    } else {
      throw new GenerationError('Client must have chat() or generate() method');
    }

    // 3. Record Metrics
    metrics.recordGeneration(model, prompt.length, response.length, Date.now() - start);

    return { docs, response, prompt };

  } catch (error) {
    logger.error({ error, query, model }, 'RAG generation failed');
    throw new GenerationError(`RAG generation failed: ${error.message}`, {
      originalError: error
    });
  }
}

/**
 * Build default prompt from docs
 * @private
 */
function _buildDefaultPrompt(query, docs, options) {
  const includeScores = options.context?.includeScores || false;
  const includeMetadata = options.context?.includeMetadata || false;

  const context = docs.map((d, i) => {
    const text = typeof d === 'string' ? d : d.text;
    let docStr = `Doc ${i + 1}`;

    if (includeScores && typeof d === 'object' && d.score !== undefined) {
      docStr += ` (score: ${d.score.toFixed(3)})`;
    }

    if (includeMetadata && typeof d === 'object' && d.meta) {
      const metaStr = Object.entries(d.meta)
        .map(([k, v]) => `${k}=${v}`)
        .join(', ');
      docStr += ` [${metaStr}]`;
    }

    docStr += `:\n${text}`;
    return docStr;
  }).join('\n\n');

  let prompt;
  if (options.template) {
    // Handle template function or string
    const templateFn = typeof options.template === 'function'
      ? options.template
      : (q, c) => `Context:\n${c}\n\nQuestion: ${q}\n\nAnswer:`; // Simple fallback
    prompt = templateFn(query, context);
  } else {
    prompt = `Context:\n${context}\n\nQuestion: ${query}\n\nAnswer based on the context:`;
  }

  if (options.systemPrompt) {
    prompt = `${options.systemPrompt}\n\n${prompt}`;
  }

  return prompt;
}

/**
 * Handle legacy API signature
 * @private
 */
async function _handleLegacyRAG(options) {
  const { retriever, modelClient, model, query, promptTemplate, topK = 3, prepend = '\nContext:\n' } = options;

  const docs = await retriever.getRelevant(query, topK);
  const context = docs.map((d, i) => `Doc ${i + 1} (score=${(d.score || 0).toFixed(3)}):\n${d.text}`).join('\n\n');
  const prompt = (promptTemplate || ((q, ctx) => `${ctx}\n\nUser: ${q}\nAssistant:`))(query, prepend + context);

  const res = await modelClient.generate(model, prompt);

  return { docs, response: res, prompt };
}
