/**
 * Generate text with RAG (Retrieval-Augmented Generation)
 */

import { GenerationError } from './errors/index.js';
import { logger } from './utils/logger.js';
import { metrics } from './utils/metrics.js';
import { Document } from './stores/abstractStore.js';
import type { PromptManager } from './promptManager.js';

export interface RAGOptions {
    systemPrompt?: string;
    template?: string | ((query: string, context: string) => string);
    promptManager?: PromptManager;
    context?: {
        includeScores?: boolean;
        includeMetadata?: boolean;
    };
}

export interface RAGResult {
    response: string;
    docs: Document[];
    prompt: string;
}

/**
 * Generate response using RAG
 */
export async function generateWithRAG(
    clientOrOptions: any,
    model?: string,
    query?: string,
    results?: Document[],
    options: RAGOptions = {}
): Promise<RAGResult> {
    const start = Date.now();

    // Handle legacy signature: generateWithRAG({ retriever, modelClient, ... })
    if (typeof clientOrOptions === 'object' && arguments.length === 1) {
        return _handleLegacyRAG(clientOrOptions);
    }

    const client = clientOrOptions;
    const docs = results || [];

    try {
        // 1. Build Prompt
        let prompt: string;
        if (options.promptManager) {
            prompt = options.promptManager.generate(query, docs, options);
        } else {
            prompt = _buildDefaultPrompt(query || '', docs, options);
        }

        // 2. Generate Response
        let response: string;

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
        metrics.recordGeneration(model || 'unknown', prompt.length, response.length, Date.now() - start);

        return { docs, response, prompt };

    } catch (error: any) {
        logger.error({ error, query, model }, 'RAG generation failed');
        throw new GenerationError(`RAG generation failed: ${error.message}`, {
            originalError: error
        });
    }
}

/**
 * Build default prompt from docs
 */
function _buildDefaultPrompt(query: string, docs: Document[], options: RAGOptions): string {
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

    let prompt: string;
    if (options.template) {
        // Handle template function or string
        const templateFn = typeof options.template === 'function'
            ? options.template
            : (q: string, c: string) => `Context:\n${c}\n\nQuestion: ${q}\n\nAnswer:`; // Simple fallback
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
 */
async function _handleLegacyRAG(options: any): Promise<RAGResult> {
    const { retriever, modelClient, model, query, promptTemplate, topK = 3, prepend = '\nContext:\n' } = options;

    const docs = await retriever.getRelevant(query, topK);
    const context = docs.map((d: any, i: number) => `Doc ${i + 1} (score=${(d.score || 0).toFixed(3)}):\n${d.text}`).join('\n\n');
    const prompt = (promptTemplate || ((q: string, ctx: string) => `${ctx}\n\nUser: ${q}\nAssistant:`))(query, prepend + context);

    const res = await modelClient.generate(model, prompt);

    return { docs, response: res, prompt };
}
