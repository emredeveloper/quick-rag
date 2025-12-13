/**
 * Conversation Summarizer Utilities
 * 
 * Helpers for summarizing conversation history.
 * @since v2.3.0
 */

/**
 * Create a summarizer function using a model client
 * 
 * @param {Object} client - Model client (Ollama, LMStudio, etc.)
 * @param {Object} [options] - Summarizer options
 * @param {string} [options.model] - Model to use for summarization
 * @param {string} [options.prompt] - Custom summarization prompt
 * @returns {Function} Summarizer function
 * 
 * @example
 * import { OllamaRAGClient } from 'quick-rag';
 * import { createSummarizer } from 'quick-rag/conversation';
 * 
 * const client = new OllamaRAGClient();
 * const summarize = createSummarizer(client, { model: 'llama3' });
 * 
 * const summary = await summarize(conversationHistory);
 */
export function createSummarizer(client, options = {}) {
    const model = options.model || 'llama3';
    const defaultPrompt = `Summarize the following conversation concisely. 
Focus on key points, decisions made, and important information exchanged.
Keep the summary under 200 words.

Conversation:
{history}

Summary:`;

    const prompt = options.prompt || defaultPrompt;

    return async function summarize(history) {
        const fullPrompt = prompt.replace('{history}', history);

        // Use client.generate or client.chat depending on client type
        if (client.generate) {
            const response = await client.generate(fullPrompt, { model });
            return response.response || response;
        } else if (client.chat) {
            const response = await client.chat([
                { role: 'user', content: fullPrompt }
            ], { model });
            return response.message?.content || response;
        } else {
            throw new Error('Client must have generate() or chat() method');
        }
    };
}

/**
 * Simple extractive summarizer (no LLM required)
 * 
 * Extracts key sentences based on importance scoring.
 * 
 * @param {string} text - Text to summarize
 * @param {Object} [options] - Options
 * @param {number} [options.maxSentences=5] - Maximum sentences in summary
 * @param {number} [options.maxLength=500] - Maximum characters
 * @returns {string} Summary
 */
export function extractiveSummarize(text, options = {}) {
    const maxSentences = options.maxSentences || 5;
    const maxLength = options.maxLength || 500;

    // Split into sentences
    const sentences = text
        .split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 10);

    if (sentences.length <= maxSentences) {
        return sentences.join('. ') + '.';
    }

    // Score sentences by importance
    const scoredSentences = sentences.map((sentence, index) => {
        let score = 0;

        // Position score (first and last sentences often important)
        if (index === 0) score += 2;
        if (index === sentences.length - 1) score += 1;

        // Length score (medium-length sentences preferred)
        const words = sentence.split(/\s+/).length;
        if (words >= 10 && words <= 30) score += 1;

        // Keyword score
        const importantWords = ['important', 'key', 'main', 'summary', 'conclusion', 
            'result', 'decided', 'agreed', 'finally', 'therefore', 'however'];
        const hasImportant = importantWords.some(w => 
            sentence.toLowerCase().includes(w)
        );
        if (hasImportant) score += 2;

        // Question/action indicators
        if (sentence.includes('?')) score += 1;
        if (/^(we|i|you|they)\s+(will|should|must|need)/i.test(sentence)) score += 1;

        return { sentence, score, index };
    });

    // Sort by score, take top sentences
    const topSentences = scoredSentences
        .sort((a, b) => b.score - a.score)
        .slice(0, maxSentences)
        .sort((a, b) => a.index - b.index) // Restore original order
        .map(s => s.sentence);

    let summary = topSentences.join('. ') + '.';

    // Truncate if too long
    if (summary.length > maxLength) {
        summary = summary.substring(0, maxLength - 3) + '...';
    }

    return summary;
}

/**
 * Summarize conversation by roles
 * 
 * Creates a structured summary separating user queries and assistant responses.
 * 
 * @param {Array<{role: string, content: string}>} messages - Messages to summarize
 * @param {Object} [options] - Options
 * @returns {string} Structured summary
 */
export function summarizeByRoles(messages, options = {}) {
    const userMessages = messages
        .filter(m => m.role === 'user')
        .map(m => m.content);

    const assistantMessages = messages
        .filter(m => m.role === 'assistant')
        .map(m => m.content);

    const parts = [];

    if (userMessages.length > 0) {
        const userSummary = extractiveSummarize(
            userMessages.join(' '),
            { maxSentences: 3, maxLength: 200 }
        );
        parts.push(`User discussed: ${userSummary}`);
    }

    if (assistantMessages.length > 0) {
        const assistantSummary = extractiveSummarize(
            assistantMessages.join(' '),
            { maxSentences: 3, maxLength: 200 }
        );
        parts.push(`Assistant provided: ${assistantSummary}`);
    }

    return parts.join('\n\n');
}

/**
 * Progressive summarizer that maintains running summary
 */
export class ProgressiveSummarizer {
    /**
     * @param {Object} options
     * @param {Function} [options.summarizer] - LLM summarizer function
     * @param {number} [options.maxHistoryLength=2000] - Max chars before summarizing
     */
    constructor(options = {}) {
        this.summarizer = options.summarizer || null;
        this.maxHistoryLength = options.maxHistoryLength || 2000;
        this.currentSummary = '';
        this.pendingHistory = '';
    }

    /**
     * Add text to pending history
     * @param {string} text 
     */
    addText(text) {
        this.pendingHistory += '\n' + text;
    }

    /**
     * Add message to pending history
     * @param {string} role 
     * @param {string} content 
     */
    addMessage(role, content) {
        this.addText(`${role.toUpperCase()}: ${content}`);
    }

    /**
     * Check if summarization is needed
     * @returns {boolean}
     */
    needsSummarization() {
        return this.pendingHistory.length > this.maxHistoryLength;
    }

    /**
     * Perform summarization if needed
     * @returns {Promise<string|null>} New summary or null
     */
    async summarizeIfNeeded() {
        if (!this.needsSummarization()) {
            return null;
        }

        return this.summarize();
    }

    /**
     * Force summarization
     * @returns {Promise<string>}
     */
    async summarize() {
        const textToSummarize = this.currentSummary 
            ? `Previous summary: ${this.currentSummary}\n\nNew content: ${this.pendingHistory}`
            : this.pendingHistory;

        if (this.summarizer) {
            this.currentSummary = await this.summarizer(textToSummarize);
        } else {
            this.currentSummary = extractiveSummarize(textToSummarize, {
                maxSentences: 5,
                maxLength: 400
            });
        }

        this.pendingHistory = '';
        return this.currentSummary;
    }

    /**
     * Get current full context
     * @returns {string}
     */
    getContext() {
        const parts = [];
        
        if (this.currentSummary) {
            parts.push(`[Previous context summary]\n${this.currentSummary}`);
        }
        
        if (this.pendingHistory.trim()) {
            parts.push(`[Recent history]\n${this.pendingHistory.trim()}`);
        }

        return parts.join('\n\n');
    }

    /**
     * Reset summarizer state
     */
    reset() {
        this.currentSummary = '';
        this.pendingHistory = '';
    }
}

export default {
    createSummarizer,
    extractiveSummarize,
    summarizeByRoles,
    ProgressiveSummarizer
};
