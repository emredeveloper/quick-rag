/**
 * Dynamic Prompt Manager
 * Provides intelligent prompt templates and customization options
 */

/**
 * Built-in prompt templates for different use cases
 */
export const PromptTemplates = {
  // Default RAG template
  default: (query, context) => 
    `Context:\n${context}\n\nQuestion: ${query}\n\nAnswer based on the context:`,

  // Conversational style
  conversational: (query, context) =>
    `Here's some relevant information:\n\n${context}\n\n` +
    `User: ${query}\n\n` +
    `Assistant: Based on the information provided, `,

  // Technical documentation style
  technical: (query, context) =>
    `# Technical Documentation\n\n` +
    `## Relevant Information\n${context}\n\n` +
    `## Query\n${query}\n\n` +
    `## Answer\nProvide a technical, accurate response:`,

  // Academic/Research style
  academic: (query, context) =>
    `**Reference Material:**\n${context}\n\n` +
    `**Research Question:** ${query}\n\n` +
    `**Analysis:** Provide a scholarly, well-reasoned response with citations where applicable:`,

  // Code-focused style
  code: (query, context) =>
    `Code Examples and Documentation:\n\`\`\`\n${context}\n\`\`\`\n\n` +
    `Question: ${query}\n\n` +
    `Provide a code-focused answer with examples:`,

  // Concise/Brief style
  concise: (query, context) =>
    `Info: ${context}\n\nQ: ${query}\nA (be brief):`,

  // Detailed/Comprehensive style
  detailed: (query, context) =>
    `Background Information:\n${context}\n\n` +
    `Question: ${query}\n\n` +
    `Provide a comprehensive, detailed answer covering all relevant aspects:`,

  // Question & Answer style
  qa: (query, context) =>
    `Context Information:\n${context}\n\n` +
    `Q: ${query}\n` +
    `A:`,

  // Step-by-step instruction style
  instructional: (query, context) =>
    `Reference Materials:\n${context}\n\n` +
    `Task: ${query}\n\n` +
    `Provide step-by-step instructions:`,

  // Creative writing style
  creative: (query, context) =>
    `Inspiration:\n${context}\n\n` +
    `Prompt: ${query}\n\n` +
    `Write a creative response:`,
};

/**
 * Prompt Manager class for dynamic prompt handling
 */
export class PromptManager {
  constructor(options = {}) {
    this.systemPrompt = options.systemPrompt || '';
    this.template = options.template || 'default';
    this.customVariables = options.variables || {};
    this.contextFormatters = options.contextFormatters || {};
  }

  /**
   * Set system prompt (applied to all generations)
   * @param {string} prompt - System-level instruction
   */
  setSystemPrompt(prompt) {
    this.systemPrompt = prompt;
    return this;
  }

  /**
   * Set template style
   * @param {string|function} template - Template name or custom function
   */
  setTemplate(template) {
    this.template = template;
    return this;
  }

  /**
   * Add custom variables for template interpolation
   * @param {object} variables - Key-value pairs
   */
  setVariables(variables) {
    this.customVariables = { ...this.customVariables, ...variables };
    return this;
  }

  /**
   * Add custom context formatter
   * @param {string} name - Formatter name
   * @param {function} formatter - Function to format context
   */
  addContextFormatter(name, formatter) {
    this.contextFormatters[name] = formatter;
    return this;
  }

  /**
   * Format context with scores and metadata
   * @private
   */
  _formatContext(docs, options = {}) {
    const {
      includeScores = false,
      includeMetadata = false,
      maxLength = null,
      formatter = null
    } = options;

    let formatted = docs.map((doc, i) => {
      const text = typeof doc === 'string' ? doc : doc.text;
      let docStr = `Doc ${i + 1}`;
      
      if (includeScores && doc.score !== undefined) {
        docStr += ` (score: ${doc.score.toFixed(3)})`;
      }
      
      if (includeMetadata && doc.meta) {
        const metaStr = Object.entries(doc.meta)
          .map(([k, v]) => `${k}=${v}`)
          .join(', ');
        docStr += ` [${metaStr}]`;
      }
      
      docStr += `:\n${text}`;
      return docStr;
    }).join('\n\n');

    // Apply custom formatter if provided
    if (formatter && this.contextFormatters[formatter]) {
      formatted = this.contextFormatters[formatter](formatted, docs);
    }

    // Truncate if needed
    if (maxLength && formatted.length > maxLength) {
      formatted = formatted.substring(0, maxLength) + '\n...(truncated)';
    }

    return formatted;
  }

  /**
   * Generate prompt from query and documents
   * @param {string} query - User query
   * @param {Array} docs - Retrieved documents
   * @param {object} options - Generation options
   */
  generate(query, docs, options = {}) {
    // Format context
    const context = this._formatContext(docs, options.context || {});

    // Get template function
    let templateFn;
    if (typeof this.template === 'function') {
      templateFn = this.template;
    } else if (typeof this.template === 'string' && PromptTemplates[this.template]) {
      templateFn = PromptTemplates[this.template];
    } else {
      templateFn = PromptTemplates.default;
    }

    // Generate base prompt
    let prompt = templateFn(query, context);

    // Apply custom variables
    if (Object.keys(this.customVariables).length > 0) {
      for (const [key, value] of Object.entries(this.customVariables)) {
        prompt = prompt.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
      }
    }

    // Prepend system prompt if set
    if (this.systemPrompt) {
      prompt = `${this.systemPrompt}\n\n${prompt}`;
    }

    return prompt;
  }

  /**
   * Create a new prompt manager with different settings
   * @param {object} options - Options to override
   */
  clone(options = {}) {
    return new PromptManager({
      systemPrompt: options.systemPrompt || this.systemPrompt,
      template: options.template || this.template,
      variables: { ...this.customVariables, ...(options.variables || {}) },
      contextFormatters: { ...this.contextFormatters, ...(options.contextFormatters || {}) }
    });
  }
}

/**
 * Convenience function to create a prompt manager
 * @param {object} options - Manager options
 */
export function createPromptManager(options) {
  return new PromptManager(options);
}

/**
 * Quick helper to get a template by name
 * @param {string} name - Template name
 */
export function getTemplate(name) {
  return PromptTemplates[name] || PromptTemplates.default;
}

export default PromptManager;
