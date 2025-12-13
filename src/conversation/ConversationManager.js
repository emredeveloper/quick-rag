/**
 * Conversation Manager - Manage conversation history and context
 * 
 * Provides context window management, automatic summarization,
 * and conversation persistence.
 * @since v2.3.0
 */

import { randomUUID } from 'crypto';

/**
 * @typedef {Object} Message
 * @property {string} id - Unique message ID
 * @property {'user'|'assistant'|'system'} role - Message role
 * @property {string} content - Message content
 * @property {number} timestamp - Creation timestamp
 * @property {Object} [metadata] - Additional metadata
 * @property {number} [tokenCount] - Estimated token count
 */

/**
 * @typedef {Object} ConversationManagerOptions
 * @property {string} [id] - Conversation ID
 * @property {number} [maxTokens=4096] - Maximum context window tokens
 * @property {number} [reservedTokens=512] - Tokens reserved for response
 * @property {boolean} [autoSummarize=false] - Auto-summarize when limit reached
 * @property {string} [systemPrompt] - System prompt to include
 * @property {Function} [tokenCounter] - Custom token counting function
 * @property {Function} [summarizer] - Custom summarization function
 */

/**
 * Conversation Manager
 * 
 * @example
 * const conversation = new ConversationManager({
 *   maxTokens: 4096,
 *   autoSummarize: true
 * });
 * 
 * conversation.addMessage('user', 'Hello!');
 * conversation.addMessage('assistant', 'Hi! How can I help?');
 * 
 * const context = conversation.getContext();
 */
export class ConversationManager {
    /**
     * @param {ConversationManagerOptions} options
     */
    constructor(options = {}) {
        this.id = options.id || randomUUID();
        this.maxTokens = options.maxTokens || 4096;
        this.reservedTokens = options.reservedTokens || 512;
        this.autoSummarize = options.autoSummarize || false;
        this.systemPrompt = options.systemPrompt || null;

        /** @type {Message[]} */
        this.messages = [];

        /** @type {string|null} */
        this.summary = null;

        // Custom functions
        this.tokenCounter = options.tokenCounter || this._defaultTokenCounter;
        this.summarizerFn = options.summarizer || null;

        // Metadata
        this.metadata = {
            createdAt: Date.now(),
            updatedAt: Date.now(),
            messageCount: 0,
            totalTokens: 0
        };
    }

    /**
     * Add a message to the conversation
     * @param {'user'|'assistant'|'system'} role - Message role
     * @param {string} content - Message content
     * @param {Object} [metadata] - Additional metadata
     * @returns {Message} Added message
     */
    addMessage(role, content, metadata = {}) {
        const tokenCount = this.tokenCounter(content);

        const message = {
            id: randomUUID(),
            role,
            content,
            timestamp: Date.now(),
            metadata,
            tokenCount
        };

        this.messages.push(message);
        this.metadata.messageCount++;
        this.metadata.totalTokens += tokenCount;
        this.metadata.updatedAt = Date.now();

        // Auto-summarize if enabled and over limit
        if (this.autoSummarize && this._isOverLimit()) {
            this._autoSummarize();
        }

        return message;
    }

    /**
     * Add a user message
     * @param {string} content - Message content
     * @param {Object} [metadata] - Additional metadata
     * @returns {Message}
     */
    addUserMessage(content, metadata = {}) {
        return this.addMessage('user', content, metadata);
    }

    /**
     * Add an assistant message
     * @param {string} content - Message content
     * @param {Object} [metadata] - Additional metadata
     * @returns {Message}
     */
    addAssistantMessage(content, metadata = {}) {
        return this.addMessage('assistant', metadata);
    }

    /**
     * Add a system message
     * @param {string} content - Message content
     * @returns {Message}
     */
    addSystemMessage(content) {
        return this.addMessage('system', content);
    }

    /**
     * Get conversation context formatted for LLM
     * @param {Object} [options] - Context options
     * @param {number} [options.maxTokens] - Override max tokens
     * @param {boolean} [options.includeSystem=true] - Include system prompt
     * @returns {Array<{role: string, content: string}>}
     */
    getContext(options = {}) {
        const maxTokens = options.maxTokens || (this.maxTokens - this.reservedTokens);
        const includeSystem = options.includeSystem !== false;

        const context = [];
        let tokenCount = 0;

        // Add system prompt first
        if (includeSystem && this.systemPrompt) {
            const systemTokens = this.tokenCounter(this.systemPrompt);
            context.push({ role: 'system', content: this.systemPrompt });
            tokenCount += systemTokens;
        }

        // Add summary if exists
        if (this.summary) {
            const summaryTokens = this.tokenCounter(this.summary);
            if (tokenCount + summaryTokens <= maxTokens) {
                context.push({ 
                    role: 'system', 
                    content: `Previous conversation summary:\n${this.summary}` 
                });
                tokenCount += summaryTokens;
            }
        }

        // Add messages from most recent, respecting token limit
        const recentMessages = [];
        for (let i = this.messages.length - 1; i >= 0; i--) {
            const msg = this.messages[i];
            if (tokenCount + msg.tokenCount > maxTokens) break;
            
            recentMessages.unshift({ role: msg.role, content: msg.content });
            tokenCount += msg.tokenCount;
        }

        context.push(...recentMessages);
        return context;
    }

    /**
     * Get messages as formatted string
     * @param {Object} [options] - Format options
     * @returns {string}
     */
    getFormattedHistory(options = {}) {
        const separator = options.separator || '\n\n';
        const rolePrefix = options.rolePrefix !== false;

        return this.messages
            .map(msg => {
                const prefix = rolePrefix ? `${msg.role.toUpperCase()}: ` : '';
                return `${prefix}${msg.content}`;
            })
            .join(separator);
    }

    /**
     * Get last N messages
     * @param {number} n - Number of messages
     * @returns {Message[]}
     */
    getLastMessages(n) {
        return this.messages.slice(-n);
    }

    /**
     * Get message by ID
     * @param {string} id - Message ID
     * @returns {Message|null}
     */
    getMessage(id) {
        return this.messages.find(m => m.id === id) || null;
    }

    /**
     * Update a message
     * @param {string} id - Message ID
     * @param {string} newContent - New content
     * @returns {boolean}
     */
    updateMessage(id, newContent) {
        const message = this.getMessage(id);
        if (!message) return false;

        const oldTokens = message.tokenCount;
        const newTokens = this.tokenCounter(newContent);

        message.content = newContent;
        message.tokenCount = newTokens;
        message.metadata.updatedAt = Date.now();

        this.metadata.totalTokens += (newTokens - oldTokens);
        this.metadata.updatedAt = Date.now();

        return true;
    }

    /**
     * Delete a message
     * @param {string} id - Message ID
     * @returns {boolean}
     */
    deleteMessage(id) {
        const index = this.messages.findIndex(m => m.id === id);
        if (index === -1) return false;

        const message = this.messages[index];
        this.metadata.totalTokens -= message.tokenCount;
        this.metadata.messageCount--;
        this.metadata.updatedAt = Date.now();

        this.messages.splice(index, 1);
        return true;
    }

    /**
     * Clear all messages
     * @param {boolean} [keepSummary=false] - Keep existing summary
     */
    clear(keepSummary = false) {
        this.messages = [];
        this.metadata.messageCount = 0;
        this.metadata.totalTokens = 0;
        this.metadata.updatedAt = Date.now();

        if (!keepSummary) {
            this.summary = null;
        }
    }

    /**
     * Set system prompt
     * @param {string} prompt - System prompt
     */
    setSystemPrompt(prompt) {
        this.systemPrompt = prompt;
        this.metadata.updatedAt = Date.now();
    }

    /**
     * Manually set summary
     * @param {string} summary - Conversation summary
     */
    setSummary(summary) {
        this.summary = summary;
        this.metadata.updatedAt = Date.now();
    }

    /**
     * Summarize conversation using provided function
     * @param {Function} [summarizer] - Summarization function
     * @returns {Promise<string>} Summary
     */
    async summarize(summarizer) {
        const fn = summarizer || this.summarizerFn;
        if (!fn) {
            throw new Error('No summarizer function provided');
        }

        const history = this.getFormattedHistory();
        this.summary = await fn(history);
        this.metadata.updatedAt = Date.now();

        return this.summary;
    }

    /**
     * Get current token usage
     * @returns {Object}
     */
    getTokenUsage() {
        const contextTokens = this._calculateContextTokens();
        const availableTokens = this.maxTokens - this.reservedTokens;

        return {
            total: this.metadata.totalTokens,
            contextWindow: contextTokens,
            maxTokens: this.maxTokens,
            reservedTokens: this.reservedTokens,
            availableTokens,
            utilization: Math.round((contextTokens / availableTokens) * 100) / 100,
            isOverLimit: this._isOverLimit()
        };
    }

    /**
     * Get conversation statistics
     * @returns {Object}
     */
    getStats() {
        const userMessages = this.messages.filter(m => m.role === 'user').length;
        const assistantMessages = this.messages.filter(m => m.role === 'assistant').length;

        return {
            id: this.id,
            messageCount: this.metadata.messageCount,
            userMessages,
            assistantMessages,
            totalTokens: this.metadata.totalTokens,
            hasSummary: !!this.summary,
            hasSystemPrompt: !!this.systemPrompt,
            ...this.getTokenUsage(),
            createdAt: new Date(this.metadata.createdAt).toISOString(),
            updatedAt: new Date(this.metadata.updatedAt).toISOString()
        };
    }

    /**
     * Fork conversation (create a copy)
     * @returns {ConversationManager}
     */
    fork() {
        const forked = new ConversationManager({
            maxTokens: this.maxTokens,
            reservedTokens: this.reservedTokens,
            autoSummarize: this.autoSummarize,
            systemPrompt: this.systemPrompt,
            tokenCounter: this.tokenCounter,
            summarizer: this.summarizerFn
        });

        forked.messages = JSON.parse(JSON.stringify(this.messages));
        forked.summary = this.summary;
        forked.metadata = { ...this.metadata, createdAt: Date.now() };

        return forked;
    }

    /**
     * Export conversation to JSON
     * @returns {Object}
     */
    toJSON() {
        return {
            id: this.id,
            messages: this.messages,
            summary: this.summary,
            systemPrompt: this.systemPrompt,
            metadata: this.metadata,
            config: {
                maxTokens: this.maxTokens,
                reservedTokens: this.reservedTokens,
                autoSummarize: this.autoSummarize
            }
        };
    }

    /**
     * Import conversation from JSON
     * @param {Object} data - Exported conversation data
     * @param {Object} [options] - Additional options
     * @returns {ConversationManager}
     */
    static fromJSON(data, options = {}) {
        const manager = new ConversationManager({
            id: data.id,
            maxTokens: data.config?.maxTokens,
            reservedTokens: data.config?.reservedTokens,
            autoSummarize: data.config?.autoSummarize,
            systemPrompt: data.systemPrompt,
            ...options
        });

        manager.messages = data.messages || [];
        manager.summary = data.summary || null;
        manager.metadata = data.metadata || manager.metadata;

        return manager;
    }

    /**
     * Default token counter (approximate)
     * @private
     */
    _defaultTokenCounter(text) {
        // Rough approximation: ~4 characters per token
        return Math.ceil(text.length / 4);
    }

    /**
     * Calculate context tokens
     * @private
     */
    _calculateContextTokens() {
        let tokens = 0;

        if (this.systemPrompt) {
            tokens += this.tokenCounter(this.systemPrompt);
        }

        if (this.summary) {
            tokens += this.tokenCounter(this.summary);
        }

        tokens += this.metadata.totalTokens;
        return tokens;
    }

    /**
     * Check if over token limit
     * @private
     */
    _isOverLimit() {
        const contextTokens = this._calculateContextTokens();
        return contextTokens > (this.maxTokens - this.reservedTokens);
    }

    /**
     * Auto-summarize old messages
     * @private
     */
    async _autoSummarize() {
        if (!this.summarizerFn) return;

        // Keep last few messages, summarize the rest
        const keepCount = 4;
        if (this.messages.length <= keepCount) return;

        const toSummarize = this.messages.slice(0, -keepCount);
        const toKeep = this.messages.slice(-keepCount);

        // Create summary of old messages
        const oldHistory = toSummarize
            .map(m => `${m.role.toUpperCase()}: ${m.content}`)
            .join('\n');

        const existingSummary = this.summary 
            ? `Previous summary: ${this.summary}\n\nNew messages:\n` 
            : '';

        try {
            this.summary = await this.summarizerFn(existingSummary + oldHistory);
            
            // Update messages and metadata
            this.messages = toKeep;
            this.metadata.totalTokens = toKeep.reduce((sum, m) => sum + m.tokenCount, 0);
            this.metadata.updatedAt = Date.now();
        } catch (error) {
            console.error('Auto-summarization failed:', error);
        }
    }
}

export default ConversationManager;
