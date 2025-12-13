/**
 * Context Window Utilities
 * 
 * Helpers for managing context window limits and token counting.
 * @since v2.3.0
 */

/**
 * Token counter implementations
 */
export const tokenCounters = {
    /**
     * Simple character-based approximation (~4 chars per token)
     * @param {string} text 
     * @returns {number}
     */
    simple(text) {
        return Math.ceil(text.length / 4);
    },

    /**
     * Word-based approximation (~0.75 tokens per word)
     * More accurate for English text
     * @param {string} text 
     * @returns {number}
     */
    wordBased(text) {
        const words = text.trim().split(/\s+/).length;
        return Math.ceil(words * 1.33);
    },

    /**
     * GPT-style approximation using whitespace and punctuation
     * @param {string} text 
     * @returns {number}
     */
    gptApprox(text) {
        // Split by whitespace and punctuation, count resulting tokens
        const tokens = text.split(/[\s\.,!?;:'"()\[\]{}]+/).filter(Boolean);
        // Add back punctuation as separate tokens
        const punctuation = (text.match(/[\.,!?;:'"()\[\]{}]+/g) || []).length;
        return tokens.length + punctuation;
    }
};

/**
 * Context window size limits for common models
 */
export const modelContextLimits = {
    // OpenAI
    'gpt-4': 8192,
    'gpt-4-32k': 32768,
    'gpt-4-turbo': 128000,
    'gpt-4o': 128000,
    'gpt-3.5-turbo': 16385,

    // Anthropic
    'claude-3-opus': 200000,
    'claude-3-sonnet': 200000,
    'claude-3-haiku': 200000,
    'claude-2': 100000,

    // Ollama/Open Source
    'llama3': 8192,
    'llama3:70b': 8192,
    'llama2': 4096,
    'mistral': 8192,
    'mixtral': 32768,
    'codellama': 16384,
    'phi3': 4096,
    'gemma': 8192,
    'qwen2': 32768,

    // LM Studio common models
    'default': 4096
};

/**
 * Get context limit for a model
 * @param {string} model - Model name
 * @returns {number} Context window size
 */
export function getContextLimit(model) {
    const normalizedModel = model.toLowerCase().replace(/[:-]/g, '');
    
    // Check exact match first
    if (modelContextLimits[model]) {
        return modelContextLimits[model];
    }

    // Check partial matches
    for (const [key, limit] of Object.entries(modelContextLimits)) {
        if (normalizedModel.includes(key.replace(/[:-]/g, ''))) {
            return limit;
        }
    }

    return modelContextLimits.default;
}

/**
 * Context Window Manager
 * 
 * Manages content to fit within token limits
 */
export class ContextWindow {
    /**
     * @param {Object} options
     * @param {number} [options.maxTokens=4096] - Maximum tokens
     * @param {number} [options.reservedTokens=512] - Reserved for response
     * @param {Function} [options.tokenCounter] - Token counting function
     */
    constructor(options = {}) {
        this.maxTokens = options.maxTokens || 4096;
        this.reservedTokens = options.reservedTokens || 512;
        this.tokenCounter = options.tokenCounter || tokenCounters.simple;
    }

    /**
     * Available tokens for content
     * @returns {number}
     */
    get availableTokens() {
        return this.maxTokens - this.reservedTokens;
    }

    /**
     * Count tokens in text
     * @param {string} text 
     * @returns {number}
     */
    countTokens(text) {
        return this.tokenCounter(text);
    }

    /**
     * Check if content fits in window
     * @param {string|string[]} content - Content to check
     * @returns {boolean}
     */
    fits(content) {
        const texts = Array.isArray(content) ? content : [content];
        const totalTokens = texts.reduce((sum, t) => sum + this.countTokens(t), 0);
        return totalTokens <= this.availableTokens;
    }

    /**
     * Truncate text to fit within token limit
     * @param {string} text - Text to truncate
     * @param {number} [maxTokens] - Override max tokens
     * @returns {string} Truncated text
     */
    truncate(text, maxTokens) {
        const limit = maxTokens || this.availableTokens;
        const tokens = this.countTokens(text);

        if (tokens <= limit) {
            return text;
        }

        // Estimate character limit
        const ratio = limit / tokens;
        const charLimit = Math.floor(text.length * ratio * 0.95); // 5% buffer

        return text.substring(0, charLimit) + '...';
    }

    /**
     * Fit multiple items into context window
     * @param {Array<{content: string, priority?: number}>} items - Items to fit
     * @returns {string[]} Items that fit
     */
    fitItems(items) {
        // Sort by priority (higher = more important)
        const sorted = [...items].sort((a, b) => (b.priority || 0) - (a.priority || 0));

        const result = [];
        let usedTokens = 0;

        for (const item of sorted) {
            const itemTokens = this.countTokens(item.content);
            
            if (usedTokens + itemTokens <= this.availableTokens) {
                result.push(item.content);
                usedTokens += itemTokens;
            }
        }

        return result;
    }

    /**
     * Build context from messages with token limit
     * @param {Array<{role: string, content: string}>} messages 
     * @param {Object} [options]
     * @returns {Array<{role: string, content: string}>}
     */
    buildContext(messages, options = {}) {
        const systemFirst = options.systemFirst !== false;
        const result = [];
        let usedTokens = 0;

        // Separate system messages
        const systemMessages = messages.filter(m => m.role === 'system');
        const otherMessages = messages.filter(m => m.role !== 'system');

        // Add system messages first if configured
        if (systemFirst) {
            for (const msg of systemMessages) {
                const tokens = this.countTokens(msg.content);
                if (usedTokens + tokens <= this.availableTokens) {
                    result.push(msg);
                    usedTokens += tokens;
                }
            }
        }

        // Add other messages from most recent
        for (let i = otherMessages.length - 1; i >= 0; i--) {
            const msg = otherMessages[i];
            const tokens = this.countTokens(msg.content);

            if (usedTokens + tokens <= this.availableTokens) {
                result.unshift(msg);
                usedTokens += tokens;
            } else {
                break;
            }
        }

        // Re-add system messages at beginning if they were pushed down
        if (systemFirst && result[0]?.role !== 'system') {
            const sysInResult = result.filter(m => m.role === 'system');
            const others = result.filter(m => m.role !== 'system');
            return [...sysInResult, ...others];
        }

        return result;
    }

    /**
     * Get utilization info
     * @param {string|string[]} content 
     * @returns {Object}
     */
    getUtilization(content) {
        const texts = Array.isArray(content) ? content : [content];
        const usedTokens = texts.reduce((sum, t) => sum + this.countTokens(t), 0);

        return {
            usedTokens,
            availableTokens: this.availableTokens,
            maxTokens: this.maxTokens,
            reservedTokens: this.reservedTokens,
            utilization: Math.round((usedTokens / this.availableTokens) * 100) / 100,
            remaining: this.availableTokens - usedTokens,
            fits: usedTokens <= this.availableTokens
        };
    }
}

export default ContextWindow;
