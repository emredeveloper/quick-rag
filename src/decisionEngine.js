/**
 * Decision Engine - Weighted Decision Making & Heuristic Reasoning
 * 
 * This module provides:
 * 1. Weighted scoring for document ranking
 * 2. Heuristic rules for query optimization
 * 3. Adaptive learning from retrieval patterns
 */

/**
 * Default weights for different scoring factors
 */
export const DEFAULT_WEIGHTS = {
  semanticSimilarity: 0.5,    // Cosine similarity from embeddings
  keywordMatch: 0.2,          // Term frequency match
  recency: 0.15,              // Document freshness
  sourceQuality: 0.1,         // Source reliability
  contextRelevance: 0.05      // Context-specific relevance
};

/**
 * Weighted Decision Engine
 * Makes decisions based on multiple weighted criteria
 */
export class WeightedDecisionEngine {
  constructor(weights = DEFAULT_WEIGHTS) {
    this.weights = { ...DEFAULT_WEIGHTS, ...weights };
    this.normalizeWeights();
  }

  /**
   * Ensure weights sum to 1.0
   * @private
   */
  normalizeWeights() {
    const sum = Object.values(this.weights).reduce((a, b) => a + b, 0);
    if (Math.abs(sum - 1.0) > 0.01) {
      Object.keys(this.weights).forEach(key => {
        this.weights[key] /= sum;
      });
    }
  }

  /**
   * Calculate weighted score for a document
   * @param {Object} doc - Document with text, score, meta
   * @param {Object} factors - Additional scoring factors
   * @returns {Object} Scored document with breakdown
   */
  scoreDocument(doc, factors = {}) {
    const scores = {
      semanticSimilarity: doc.score || 0,
      keywordMatch: factors.keywordMatch || 0,
      recency: this.calculateRecency(doc.meta?.date),
      sourceQuality: this.getSourceQuality(doc.meta?.source),
      contextRelevance: factors.contextRelevance || 0
    };

    // Calculate weighted total
    let weightedScore = 0;
    const breakdown = {};

    Object.keys(this.weights).forEach(key => {
      const contribution = scores[key] * this.weights[key];
      weightedScore += contribution;
      breakdown[key] = {
        score: scores[key],
        weight: this.weights[key],
        contribution: contribution
      };
    });

    return {
      ...doc,
      weightedScore,
      scoreBreakdown: breakdown,
      originalScore: doc.score
    };
  }

  /**
   * Calculate recency score (0-1) based on document date
   * @private
   */
  calculateRecency(dateStr) {
    if (!dateStr) return 0.5; // Neutral if no date

    try {
      const docDate = new Date(dateStr);
      const now = new Date();
      const daysDiff = (now - docDate) / (1000 * 60 * 60 * 24);

      // Exponential decay: newer = better
      // 0 days = 1.0, 30 days = 0.75, 180 days = 0.25, 365+ days = ~0.1
      return Math.max(0.1, Math.exp(-daysDiff / 180));
    } catch {
      return 0.5;
    }
  }

  /**
   * Get source quality score based on predefined rules
   * @private
   */
  getSourceQuality(source) {
    if (!source) return 0.5;

    // Heuristic rules for source quality
    const qualityRules = {
      'official': 1.0,
      'documentation': 0.95,
      'research': 0.9,
      'blog': 0.7,
      'tutorial': 0.75,
      'forum': 0.6,
      'social': 0.5,
      'unknown': 0.5
    };

    const lowerSource = source.toLowerCase();
    for (const [type, quality] of Object.entries(qualityRules)) {
      if (lowerSource.includes(type)) {
        return quality;
      }
    }

    return qualityRules.unknown;
  }

  /**
   * Update weights dynamically based on feedback
   * @param {string} factor - Factor to adjust
   * @param {number} adjustment - Positive or negative adjustment
   */
  adjustWeight(factor, adjustment) {
    if (this.weights[factor] !== undefined) {
      this.weights[factor] = Math.max(0, Math.min(1, this.weights[factor] + adjustment));
      this.normalizeWeights();
    }
  }

  /**
   * Get current weights
   */
  getWeights() {
    return { ...this.weights };
  }

  /**
   * Set custom weights
   */
  setWeights(weights) {
    this.weights = { ...this.weights, ...weights };
    this.normalizeWeights();
  }
}

/**
 * Heuristic Reasoning Engine
 * Applies learned rules and patterns to improve retrieval
 */
export class HeuristicEngine {
  constructor() {
    this.rules = new Map();
    this.patterns = [];
    this.queryHistory = [];
    this.maxHistorySize = 100;
  }

  /**
   * Add a heuristic rule
   * @param {string} name - Rule name
   * @param {Function} condition - Function that returns true if rule applies
   * @param {Function} action - Function that modifies query/results
   * @param {number} priority - Rule priority (higher = earlier)
   */
  addRule(name, condition, action, priority = 0) {
    this.rules.set(name, { condition, action, priority });
  }

  /**
   * Apply heuristic rules to a query
   * @param {string} query - Original query
   * @param {Object} context - Additional context
   * @returns {Object} Modified query and suggestions
   */
  applyQueryRules(query, context = {}) {
    const modifications = {
      originalQuery: query,
      modifiedQuery: query,
      suggestions: [],
      appliedRules: []
    };

    // Sort rules by priority
    const sortedRules = Array.from(this.rules.entries())
      .sort((a, b) => b[1].priority - a[1].priority);

    // Apply matching rules
    for (const [name, rule] of sortedRules) {
      if (rule.condition(query, context)) {
        const result = rule.action(modifications.modifiedQuery, context);
        modifications.modifiedQuery = result.query || modifications.modifiedQuery;
        if (result.suggestion) {
          modifications.suggestions.push(result.suggestion);
        }
        modifications.appliedRules.push(name);
      }
    }

    return modifications;
  }

  /**
   * Apply heuristic rules to results
   * @param {Array} results - Retrieved documents
   * @param {Object} context - Query context
   * @returns {Array} Modified results
   */
  applyResultRules(results, context = {}) {
    let modifiedResults = [...results];

    // Rule: Remove duplicates based on content similarity
    modifiedResults = this.removeDuplicates(modifiedResults);

    // Rule: Boost results matching recent patterns
    modifiedResults = this.boostByPatterns(modifiedResults, context);

    // Rule: Penalize low-quality sources in critical queries
    if (context.critical) {
      modifiedResults = this.filterLowQuality(modifiedResults);
    }

    return modifiedResults;
  }

  /**
   * Learn from successful retrieval
   * @param {string} query - Query that worked well
   * @param {Array} results - Successful results
   * @param {Object} feedback - User feedback
   */
  learn(query, results, feedback = {}) {
    const pattern = {
      query: query.toLowerCase(),
      timestamp: Date.now(),
      resultCount: results.length,
      avgScore: results.reduce((sum, r) => sum + (r.score || 0), 0) / results.length,
      feedback: feedback.rating || 0,
      queryLength: query.split(' ').length,
      hasFilters: feedback.hasFilters || false
    };

    this.queryHistory.push(pattern);

    // Keep history size manageable
    if (this.queryHistory.length > this.maxHistorySize) {
      this.queryHistory.shift();
    }

    // Detect patterns
    this.detectPatterns();
  }

  /**
   * Detect common patterns from history
   * @private
   */
  detectPatterns() {
    // Pattern: Short queries need expansion
    const shortQueries = this.queryHistory.filter(p => p.queryLength <= 2 && p.avgScore < 0.6);
    if (shortQueries.length > 5) {
      this.addRule('expand-short-queries', 
        (q) => q.split(' ').length <= 2,
        (q) => ({ 
          query: q, 
          suggestion: 'Consider adding more specific terms to improve results' 
        }),
        10
      );
    }

    // Pattern: Certain terms always improve results
    const highRatedQueries = this.queryHistory.filter(p => p.feedback >= 4);
    if (highRatedQueries.length > 10) {
      // Extract common terms
      const termFreq = new Map();
      highRatedQueries.forEach(p => {
        p.query.split(' ').forEach(term => {
          termFreq.set(term, (termFreq.get(term) || 0) + 1);
        });
      });

      // Store successful patterns
      this.patterns = Array.from(termFreq.entries())
        .filter(([_, count]) => count >= 3)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([term, _]) => term);
    }
  }

  /**
   * Remove duplicate documents
   * @private
   */
  removeDuplicates(results) {
    const seen = new Set();
    return results.filter(doc => {
      // Use first 100 chars as fingerprint
      const fingerprint = doc.text.substring(0, 100).toLowerCase().trim();
      if (seen.has(fingerprint)) {
        return false;
      }
      seen.add(fingerprint);
      return true;
    });
  }

  /**
   * Boost results matching successful patterns
   * @private
   */
  boostByPatterns(results, context) {
    if (this.patterns.length === 0) return results;

    return results.map(doc => {
      const text = doc.text.toLowerCase();
      const patternMatches = this.patterns.filter(p => text.includes(p)).length;
      
      if (patternMatches > 0) {
        return {
          ...doc,
          score: Math.min(1.0, (doc.score || 0) + (patternMatches * 0.05)),
          boosted: true,
          boostReason: `Matches ${patternMatches} successful pattern(s)`
        };
      }
      
      return doc;
    });
  }

  /**
   * Filter out low-quality sources
   * @private
   */
  filterLowQuality(results, threshold = 0.6) {
    return results.filter(doc => {
      const source = doc.meta?.source?.toLowerCase() || '';
      const lowQualitySources = ['social', 'forum', 'comment'];
      const isLowQuality = lowQualitySources.some(q => source.includes(q));
      
      if (isLowQuality && (doc.score || 0) < threshold) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * Get learning insights
   */
  getInsights() {
    if (this.queryHistory.length === 0) {
      return { message: 'No data yet' };
    }

    const avgQueryLength = this.queryHistory.reduce((sum, p) => sum + p.queryLength, 0) / this.queryHistory.length;
    const avgScore = this.queryHistory.reduce((sum, p) => sum + p.avgScore, 0) / this.queryHistory.length;
    const avgFeedback = this.queryHistory.filter(p => p.feedback > 0).reduce((sum, p) => sum + p.feedback, 0) / 
                       (this.queryHistory.filter(p => p.feedback > 0).length || 1);

    return {
      totalQueries: this.queryHistory.length,
      avgQueryLength: avgQueryLength.toFixed(2),
      avgRetrievalScore: avgScore.toFixed(3),
      avgUserRating: avgFeedback.toFixed(2),
      detectedPatterns: this.patterns.length,
      activeRules: this.rules.size,
      successfulPatterns: this.patterns
    };
  }

  /**
   * Export learned knowledge
   */
  exportKnowledge() {
    return {
      rules: Array.from(this.rules.keys()),
      patterns: this.patterns,
      history: this.queryHistory.slice(-20) // Last 20 queries
    };
  }

  /**
   * Import learned knowledge
   */
  importKnowledge(knowledge) {
    if (knowledge.patterns) {
      this.patterns = knowledge.patterns;
    }
    if (knowledge.history) {
      this.queryHistory = knowledge.history;
    }
  }
}

/**
 * Smart Retriever with Decision Engine & Heuristics
 * Combines weighted decision making and heuristic reasoning
 */
export class SmartRetriever {
  constructor(retriever, options = {}) {
    this.retriever = retriever;
    this.decisionEngine = new WeightedDecisionEngine(options.weights);
    this.heuristicEngine = new HeuristicEngine();
    this.enableLearning = options.enableLearning !== false;
    
    // Register default heuristic rules
    this.registerDefaultRules();
  }

  /**
   * Register built-in heuristic rules
   * @private
   */
  registerDefaultRules() {
    // Rule: Expand very short queries
    this.heuristicEngine.addRule(
      'expand-short-query',
      (query) => query.split(' ').length === 1,
      (query) => ({
        query,
        suggestion: 'Single-word queries may return broad results. Consider adding more context.'
      }),
      5
    );

    // Rule: Suggest filters for technical queries
    this.heuristicEngine.addRule(
      'suggest-technical-filters',
      (query) => /\b(code|api|function|error|bug)\b/i.test(query),
      (query, context) => ({
        query,
        suggestion: 'Technical query detected. Consider filtering by source:documentation or source:official'
      }),
      3
    );

    // Rule: Boost recent docs for time-sensitive queries
    this.heuristicEngine.addRule(
      'boost-recent-for-news',
      (query) => /\b(latest|new|recent|current|today)\b/i.test(query),
      (query, context) => {
        if (context.weights) {
          context.weights.recency = 0.4; // Boost recency weight
          context.weights.semanticSimilarity = 0.35;
        }
        return {
          query,
          suggestion: 'Time-sensitive query detected. Prioritizing recent documents.'
        };
      },
      8
    );
  }

  /**
   * Smart retrieval with weighted scoring and heuristics
   * @param {string} query - Search query
   * @param {number} topK - Number of results
   * @param {Object} options - Retrieval options
   */
  async getRelevant(query, topK, options = {}) {
    // 1. Apply heuristic rules to query
    const queryMods = this.heuristicEngine.applyQueryRules(query, options);
    const effectiveQuery = queryMods.modifiedQuery;

    // 2. Get initial results
    let results = await this.retriever.getRelevant(effectiveQuery, topK * 2, {
      ...options,
      explain: true // Always get explanations for scoring
    });

    // 3. Calculate keyword matches for weighted scoring
    const queryTerms = effectiveQuery.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    results = results.map(doc => {
      const docText = doc.text.toLowerCase();
      const matches = queryTerms.filter(term => docText.includes(term)).length;
      return {
        ...doc,
        keywordMatch: matches / queryTerms.length
      };
    });

    // 4. Apply weighted decision making
    const weights = options.weights || this.decisionEngine.getWeights();
    if (queryMods.appliedRules.includes('boost-recent-for-news') && options.weights) {
      this.decisionEngine.setWeights(options.weights);
    }

    results = results.map(doc => 
      this.decisionEngine.scoreDocument(doc, {
        keywordMatch: doc.keywordMatch,
        contextRelevance: options.contextRelevance || 0.5
      })
    );

    // 5. Re-rank by weighted score
    results.sort((a, b) => b.weightedScore - a.weightedScore);

    // 6. Apply heuristic rules to results
    results = this.heuristicEngine.applyResultRules(results, options);

    // 7. Take top K
    results = results.slice(0, topK);

    // 8. Add metadata about decision process
    const response = {
      query: effectiveQuery,
      originalQuery: query,
      results,
      decisions: {
        appliedRules: queryMods.appliedRules,
        suggestions: queryMods.suggestions,
        weights: this.decisionEngine.getWeights(),
        resultsModified: results.some(r => r.boosted)
      }
    };

    return response;
  }

  /**
   * Provide feedback for learning
   * @param {string} query - Query that was executed
   * @param {Array} results - Results that were returned
   * @param {Object} feedback - User feedback
   */
  provideFeedback(query, results, feedback = {}) {
    if (this.enableLearning) {
      this.heuristicEngine.learn(query, results, feedback);
    }
  }

  /**
   * Get learning insights
   */
  getInsights() {
    return {
      heuristics: this.heuristicEngine.getInsights(),
      weights: this.decisionEngine.getWeights()
    };
  }

  /**
   * Export learned knowledge
   */
  exportKnowledge() {
    return this.heuristicEngine.exportKnowledge();
  }

  /**
   * Import learned knowledge
   */
  importKnowledge(knowledge) {
    this.heuristicEngine.importKnowledge(knowledge);
  }
}

// Convenience factory function
export function createSmartRetriever(retriever, options = {}) {
  return new SmartRetriever(retriever, options);
}

export default {
  WeightedDecisionEngine,
  HeuristicEngine,
  SmartRetriever,
  createSmartRetriever,
  DEFAULT_WEIGHTS
};
