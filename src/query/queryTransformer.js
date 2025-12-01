/**
 * Query Transformer Module
 * 
 * Advanced query transformation techniques for improved retrieval:
 * 1. HyDE (Hypothetical Document Embeddings) - Generate hypothetical answer and search with it
 * 2. Query Expansion - Add related terms to query
 * 3. Query Decomposition - Break complex queries into sub-queries
 * 4. Multi-Query - Generate multiple query variations
 * 
 * These techniques can improve recall by 10-30% on complex queries.
 * 
 * Pure JavaScript implementation - requires LLM client for advanced features.
 */

/**
 * HyDE (Hypothetical Document Embeddings) Query Transformer
 * 
 * Instead of searching with the query directly, HyDE:
 * 1. Generates a hypothetical answer to the query using an LLM
 * 2. Uses that hypothetical answer to search (it's closer to actual documents)
 * 
 * This bridges the gap between query space and document space.
 */
export class HyDETransformer {
    /**
     * @param {Object} llmClient - LLM client (OllamaRAGClient or LMStudioRAGClient)
     * @param {Object} options - Options
     * @param {string} [options.model] - Model to use for generation
     * @param {string} [options.template] - Custom prompt template
     * @param {number} [options.maxTokens=256] - Max tokens for hypothetical doc
     */
    constructor(llmClient, options = {}) {
        if (!llmClient) {
            throw new Error('LLM client is required for HyDE');
        }
        
        this.llmClient = llmClient;
        this.model = options.model;
        this.maxTokens = options.maxTokens ?? 256;
        
        // Default HyDE prompt template
        this.template = options.template || `Write a short, factual paragraph that would answer this question. Be specific and informative.

Question: {query}

Answer:`;
    }

    /**
     * Generate a hypothetical document for the query
     * @param {string} query - Original query
     * @returns {Promise<string>} Hypothetical document
     */
    async generateHypotheticalDoc(query) {
        const prompt = this.template.replace('{query}', query);
        
        try {
            let response;
            
            // Handle different client types
            if (this.llmClient.chat) {
                // LMStudioRAGClient or similar
                response = await this.llmClient.chat(this.model, prompt, {
                    maxPredictedTokens: this.maxTokens,
                    temperature: 0.7
                });
            } else if (this.llmClient.generate) {
                // OllamaRAGClient
                const result = await this.llmClient.generate({
                    model: this.model,
                    prompt,
                    options: {
                        num_predict: this.maxTokens,
                        temperature: 0.7
                    }
                });
                response = result.response || result;
            } else {
                throw new Error('LLM client must have chat() or generate() method');
            }
            
            return typeof response === 'string' ? response : response.response || response.message?.content || '';
        } catch (error) {
            console.warn('HyDE generation failed, using original query:', error.message);
            return query; // Fallback to original query
        }
    }

    /**
     * Transform query using HyDE
     * @param {string} query - Original query
     * @param {Object} options - Options
     * @param {boolean} [options.combineWithOriginal=true] - Combine hypothetical with original
     * @returns {Promise<{original: string, transformed: string, hypotheticalDoc: string}>}
     */
    async transform(query, options = {}) {
        const combineWithOriginal = options.combineWithOriginal ?? true;
        
        const hypotheticalDoc = await this.generateHypotheticalDoc(query);
        
        // Combine original query with hypothetical document for better results
        const transformed = combineWithOriginal 
            ? `${query}\n\n${hypotheticalDoc}`
            : hypotheticalDoc;
        
        return {
            original: query,
            transformed,
            hypotheticalDoc
        };
    }
}

/**
 * Query Expansion
 * Expands queries with related terms using simple heuristics
 * No LLM required for basic expansion
 */
export class QueryExpander {
    constructor() {
        // Common synonyms and related terms
        this.synonyms = new Map([
            ['ai', ['artificial intelligence', 'machine learning', 'ml']],
            ['ml', ['machine learning', 'ai', 'deep learning']],
            ['js', ['javascript', 'node', 'nodejs']],
            ['javascript', ['js', 'ecmascript', 'node']],
            ['python', ['py', 'python3']],
            ['api', ['endpoint', 'rest', 'interface']],
            ['db', ['database', 'sql', 'storage']],
            ['database', ['db', 'sql', 'storage', 'data store']],
            ['error', ['exception', 'bug', 'issue', 'problem']],
            ['function', ['method', 'func', 'procedure']],
            ['create', ['make', 'generate', 'build', 'new']],
            ['delete', ['remove', 'drop', 'destroy']],
            ['update', ['modify', 'change', 'edit']],
            ['get', ['fetch', 'retrieve', 'read', 'find']],
            ['fast', ['quick', 'efficient', 'performance']],
            ['rag', ['retrieval augmented generation', 'retrieval']],
            ['llm', ['large language model', 'language model', 'gpt']],
            ['vector', ['embedding', 'dense', 'semantic']],
            ['search', ['find', 'query', 'lookup', 'retrieve']]
        ]);
    }

    /**
     * Add custom synonyms
     * @param {string} term - Base term
     * @param {string[]} synonyms - Related terms
     */
    addSynonyms(term, synonyms) {
        const existing = this.synonyms.get(term.toLowerCase()) || [];
        this.synonyms.set(term.toLowerCase(), [...new Set([...existing, ...synonyms])]);
    }

    /**
     * Expand a query with related terms
     * @param {string} query - Original query
     * @param {Object} options - Options
     * @param {number} [options.maxExpansions=3] - Max terms to add per word
     * @returns {{original: string, expanded: string, addedTerms: string[]}}
     */
    expand(query, options = {}) {
        const maxExpansions = options.maxExpansions ?? 3;
        const words = query.toLowerCase().split(/\s+/);
        const addedTerms = [];
        
        for (const word of words) {
            const synonymList = this.synonyms.get(word);
            if (synonymList) {
                const toAdd = synonymList.slice(0, maxExpansions);
                addedTerms.push(...toAdd);
            }
        }
        
        // Remove duplicates and terms already in query
        const uniqueTerms = [...new Set(addedTerms)]
            .filter(term => !query.toLowerCase().includes(term.toLowerCase()));
        
        const expanded = uniqueTerms.length > 0 
            ? `${query} ${uniqueTerms.join(' ')}`
            : query;
        
        return {
            original: query,
            expanded,
            addedTerms: uniqueTerms
        };
    }
}

/**
 * Query Decomposer
 * Breaks complex queries into simpler sub-queries
 */
export class QueryDecomposer {
    /**
     * @param {Object} llmClient - Optional LLM client for advanced decomposition
     * @param {Object} options - Options
     */
    constructor(llmClient = null, options = {}) {
        this.llmClient = llmClient;
        this.model = options.model;
        
        // Pattern-based decomposition rules
        this.patterns = [
            // "X and Y" pattern
            { regex: /(.+?)\s+and\s+(.+)/i, type: 'conjunction' },
            // "X or Y" pattern  
            { regex: /(.+?)\s+or\s+(.+)/i, type: 'disjunction' },
            // "Compare X with Y" pattern
            { regex: /compare\s+(.+?)\s+(?:with|to|and)\s+(.+)/i, type: 'comparison' },
            // "What is X and how does Y" pattern
            { regex: /what\s+is\s+(.+?)\s+and\s+how\s+(.+)/i, type: 'definition_process' },
            // "How to X and Y" pattern
            { regex: /how\s+to\s+(.+?)\s+and\s+(.+)/i, type: 'process_multi' }
        ];
    }

    /**
     * Decompose a query using pattern matching
     * @param {string} query - Complex query
     * @returns {{original: string, subQueries: string[], type: string}}
     */
    decompose(query) {
        // Try each pattern
        for (const pattern of this.patterns) {
            const match = query.match(pattern.regex);
            if (match) {
                const subQueries = this._processMatch(match, pattern.type, query);
                if (subQueries.length > 1) {
                    return {
                        original: query,
                        subQueries,
                        type: pattern.type
                    };
                }
            }
        }
        
        // No decomposition needed
        return {
            original: query,
            subQueries: [query],
            type: 'simple'
        };
    }

    /**
     * Process pattern match
     * @private
     */
    _processMatch(match, type, original) {
        switch (type) {
            case 'conjunction':
            case 'disjunction':
                return [match[1].trim(), match[2].trim()];
            
            case 'comparison':
                return [
                    `What is ${match[1].trim()}`,
                    `What is ${match[2].trim()}`,
                    original // Keep original for comparison context
                ];
            
            case 'definition_process':
                return [
                    `What is ${match[1].trim()}`,
                    `How ${match[2].trim()}`
                ];
            
            case 'process_multi':
                return [
                    `How to ${match[1].trim()}`,
                    `How to ${match[2].trim()}`
                ];
            
            default:
                return [original];
        }
    }

    /**
     * Advanced decomposition using LLM
     * @param {string} query - Complex query
     * @returns {Promise<{original: string, subQueries: string[], type: string}>}
     */
    async decomposeWithLLM(query) {
        if (!this.llmClient) {
            return this.decompose(query); // Fallback to pattern matching
        }

        const prompt = `Break down this complex question into 2-4 simpler, focused sub-questions that together would help answer the original question. Return only the sub-questions, one per line.

Question: ${query}

Sub-questions:`;

        try {
            let response;
            
            if (this.llmClient.chat) {
                response = await this.llmClient.chat(this.model, prompt, {
                    maxPredictedTokens: 200,
                    temperature: 0.3
                });
            } else if (this.llmClient.generate) {
                const result = await this.llmClient.generate({
                    model: this.model,
                    prompt,
                    options: { num_predict: 200, temperature: 0.3 }
                });
                response = result.response || result;
            }
            
            const text = typeof response === 'string' ? response : response.response || '';
            const subQueries = text
                .split('\n')
                .map(line => line.replace(/^\d+[\.\)]\s*/, '').trim())
                .filter(line => line.length > 5 && line.length < 200);
            
            if (subQueries.length > 1) {
                return {
                    original: query,
                    subQueries,
                    type: 'llm_decomposed'
                };
            }
        } catch (error) {
            console.warn('LLM decomposition failed:', error.message);
        }
        
        return this.decompose(query); // Fallback
    }
}

/**
 * Multi-Query Generator
 * Generates multiple query variations for better recall
 */
export class MultiQueryGenerator {
    /**
     * @param {Object} llmClient - Optional LLM client
     * @param {Object} options - Options
     */
    constructor(llmClient = null, options = {}) {
        this.llmClient = llmClient;
        this.model = options.model;
    }

    /**
     * Generate query variations using simple transformations
     * @param {string} query - Original query
     * @returns {{original: string, variations: string[]}}
     */
    generateVariations(query) {
        const variations = [query];
        
        // Question form variations
        if (!query.includes('?')) {
            if (query.toLowerCase().startsWith('how')) {
                variations.push(query + '?');
            }
            if (!query.toLowerCase().startsWith('what') && 
                !query.toLowerCase().startsWith('how') &&
                !query.toLowerCase().startsWith('why')) {
                variations.push(`What is ${query}?`);
                variations.push(`How does ${query} work?`);
            }
        }
        
        // Keyword extraction - keep key terms
        const words = query.split(/\s+/).filter(w => w.length > 3);
        if (words.length >= 3) {
            // Just the key terms
            variations.push(words.slice(0, 4).join(' '));
        }
        
        // Remove common filler words
        const fillerWords = ['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being'];
        const withoutFillers = query
            .split(/\s+/)
            .filter(w => !fillerWords.includes(w.toLowerCase()))
            .join(' ');
        if (withoutFillers !== query && withoutFillers.length > 5) {
            variations.push(withoutFillers);
        }
        
        return {
            original: query,
            variations: [...new Set(variations)]
        };
    }

    /**
     * Generate variations using LLM
     * @param {string} query - Original query
     * @param {number} [count=3] - Number of variations
     * @returns {Promise<{original: string, variations: string[]}>}
     */
    async generateWithLLM(query, count = 3) {
        if (!this.llmClient) {
            return this.generateVariations(query);
        }

        const prompt = `Generate ${count} different ways to ask this same question. Each variation should capture the same intent but use different words. Return only the variations, one per line.

Original question: ${query}

Variations:`;

        try {
            let response;
            
            if (this.llmClient.chat) {
                response = await this.llmClient.chat(this.model, prompt, {
                    maxPredictedTokens: 200,
                    temperature: 0.7
                });
            } else if (this.llmClient.generate) {
                const result = await this.llmClient.generate({
                    model: this.model,
                    prompt,
                    options: { num_predict: 200, temperature: 0.7 }
                });
                response = result.response || result;
            }
            
            const text = typeof response === 'string' ? response : response.response || '';
            const variations = text
                .split('\n')
                .map(line => line.replace(/^\d+[\.\)]\s*/, '').trim())
                .filter(line => line.length > 5 && line.length < 200);
            
            return {
                original: query,
                variations: [query, ...variations]
            };
        } catch (error) {
            console.warn('LLM query generation failed:', error.message);
            return this.generateVariations(query);
        }
    }
}

/**
 * Combined Query Transformer
 * Combines multiple transformation techniques
 */
export class QueryTransformer {
    /**
     * @param {Object} options - Options
     * @param {Object} [options.llmClient] - LLM client for advanced transformations
     * @param {string} [options.model] - Model to use
     * @param {boolean} [options.enableHyDE=false] - Enable HyDE (requires LLM)
     * @param {boolean} [options.enableExpansion=true] - Enable query expansion
     * @param {boolean} [options.enableDecomposition=true] - Enable decomposition
     * @param {boolean} [options.enableMultiQuery=true] - Enable multi-query
     */
    constructor(options = {}) {
        this.llmClient = options.llmClient;
        this.model = options.model;
        
        this.enableHyDE = options.enableHyDE ?? false;
        this.enableExpansion = options.enableExpansion ?? true;
        this.enableDecomposition = options.enableDecomposition ?? true;
        this.enableMultiQuery = options.enableMultiQuery ?? true;
        
        // Initialize transformers
        if (this.enableHyDE && this.llmClient) {
            this.hyde = new HyDETransformer(this.llmClient, { model: this.model });
        }
        
        if (this.enableExpansion) {
            this.expander = new QueryExpander();
        }
        
        if (this.enableDecomposition) {
            this.decomposer = new QueryDecomposer(this.llmClient, { model: this.model });
        }
        
        if (this.enableMultiQuery) {
            this.multiQuery = new MultiQueryGenerator(this.llmClient, { model: this.model });
        }
    }

    /**
     * Transform a query using all enabled techniques
     * @param {string} query - Original query
     * @param {Object} options - Options
     * @returns {Promise<Object>} Transformation results
     */
    async transform(query, options = {}) {
        const results = {
            original: query,
            queries: [query],
            transformations: {}
        };
        
        // 1. Query Expansion (fast, no LLM)
        if (this.enableExpansion) {
            const expanded = this.expander.expand(query);
            results.transformations.expansion = expanded;
            if (expanded.addedTerms.length > 0) {
                results.queries.push(expanded.expanded);
            }
        }
        
        // 2. Query Decomposition
        if (this.enableDecomposition) {
            const decomposed = options.useLLM 
                ? await this.decomposer.decomposeWithLLM(query)
                : this.decomposer.decompose(query);
            
            results.transformations.decomposition = decomposed;
            if (decomposed.subQueries.length > 1) {
                results.queries.push(...decomposed.subQueries);
            }
        }
        
        // 3. Multi-Query
        if (this.enableMultiQuery) {
            const multiQ = options.useLLM 
                ? await this.multiQuery.generateWithLLM(query)
                : this.multiQuery.generateVariations(query);
            
            results.transformations.multiQuery = multiQ;
            results.queries.push(...multiQ.variations);
        }
        
        // 4. HyDE (requires LLM)
        if (this.enableHyDE && this.hyde) {
            const hydeResult = await this.hyde.transform(query);
            results.transformations.hyde = hydeResult;
            results.queries.push(hydeResult.transformed);
        }
        
        // Remove duplicates
        results.queries = [...new Set(results.queries)];
        
        return results;
    }
}

// Export individual transformers
export default QueryTransformer;
