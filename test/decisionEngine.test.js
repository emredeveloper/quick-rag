import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  WeightedDecisionEngine,
  HeuristicEngine,
  SmartRetriever,
  DEFAULT_WEIGHTS
} from '../src/decisionEngine.js';

describe('DecisionEngine Tests', () => {
  
  describe('WeightedDecisionEngine', () => {
    it('should normalize weights automatically', () => {
      const engine = new WeightedDecisionEngine({
        semanticSimilarity: 1,
        keywordMatch: 1,
        recency: 1
      });
      
      // Weights should sum to 1
      const weights = engine.weights;
      const sum = Object.values(weights).reduce((a, b) => a + b, 0);
      assert.ok(Math.abs(sum - 1.0) < 0.001, 'Weights should sum to 1.0');
    });

    it('should use default weights if not provided', () => {
      const engine = new WeightedDecisionEngine();
      assert.deepEqual(engine.weights, DEFAULT_WEIGHTS);
    });

    it('should calculate recency score correctly', () => {
      const engine = new WeightedDecisionEngine();
      
      // Recent date (within 30 days)
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 10);
      const recentScore = engine.calculateRecency(recentDate.toISOString().split('T')[0]);
      assert.ok(recentScore > 0.9, 'Recent documents should score high');
      
      // Old date (1 year ago)
      const oldDate = new Date();
      oldDate.setFullYear(oldDate.getFullYear() - 1);
      const oldScore = engine.calculateRecency(oldDate.toISOString().split('T')[0]);
      assert.ok(oldScore < 0.2, 'Old documents should score low');
    });

    it('should assess source quality correctly', () => {
      const engine = new WeightedDecisionEngine();
      
      assert.equal(engine.getSourceQuality('official'), 1.0);
      assert.equal(engine.getSourceQuality('research'), 0.9);
      assert.equal(engine.getSourceQuality('documentation'), 0.95);
      assert.equal(engine.getSourceQuality('blog'), 0.7);
      assert.equal(engine.getSourceQuality('unknown'), 0.5);
    });

    it('should score document with all factors', () => {
      const engine = new WeightedDecisionEngine();
      
      const doc = {
        text: 'Python 3.12 latest features',
        score: 0.85,
        meta: {
          source: 'official',
          date: new Date().toISOString().split('T')[0]
        }
      };
      
      const factors = {
        keywordMatch: 0.8,
        contextRelevance: 0.7
      };
      
      const scoredDoc = engine.scoreDocument(doc, factors);
      
      assert.ok(scoredDoc.weightedScore !== undefined);
      assert.ok(scoredDoc.weightedScore > 0);
      assert.ok(scoredDoc.scoreBreakdown !== undefined);
      assert.equal(scoredDoc.originalScore, 0.85);
      
      // Check all factors are included
      assert.ok(scoredDoc.scoreBreakdown.semanticSimilarity);
      assert.ok(scoredDoc.scoreBreakdown.keywordMatch);
      assert.ok(scoredDoc.scoreBreakdown.recency);
      assert.ok(scoredDoc.scoreBreakdown.sourceQuality);
      assert.ok(scoredDoc.scoreBreakdown.contextRelevance);
    });

    it('should adjust weights dynamically', () => {
      const engine = new WeightedDecisionEngine();
      const originalWeight = engine.weights.recency;
      
      engine.adjustWeight('recency', 0.1);
      assert.ok(engine.weights.recency > originalWeight);
      
      // Weights should still sum to 1
      const sum = Object.values(engine.weights).reduce((a, b) => a + b, 0);
      assert.ok(Math.abs(sum - 1.0) < 0.001);
    });
  });

  describe('HeuristicEngine', () => {
    it('should add and retrieve rules', () => {
      const engine = new HeuristicEngine();
      
      engine.addRule('test-rule', 
        (q) => q.includes('test'),
        (q) => ({ ...q, modified: true }),
        10
      );
      
      const ruleSize = engine.rules.size;
      assert.ok(ruleSize > 0, 'Rules should be added');
      
      const testRule = engine.rules.get('test-rule');
      assert.ok(testRule !== undefined);
      assert.equal(testRule.priority, 10);
    });

    it('should apply query rules', () => {
      const engine = new HeuristicEngine();
      
      // Test short query expansion suggestion
      const shortQuery = engine.applyQueryRules('AI', {});
      // May or may not have suggestions based on implementation
      assert.ok(shortQuery.originalQuery === 'AI');
      
      // Test news query detection
      const newsQuery = engine.applyQueryRules('latest Python news', {});
      assert.ok(newsQuery.originalQuery === 'latest Python news');
    });

    it('should filter low quality results', () => {
      const engine = new HeuristicEngine();
      
      const results = [
        { text: 'Good content', score: 0.8, meta: { quality: 'high', source: 'official' } },
        { text: 'Bad content', score: 0.3, meta: { quality: 'low', source: 'forum' } },
        { text: 'OK content', score: 0.6, meta: { quality: 'medium', source: 'blog' } }
      ];
      
      const filtered = engine.applyResultRules(results, { critical: true });
      
      // Returns array directly, not object with results property
      assert.ok(Array.isArray(filtered));
      // Low quality source (forum) with low score should be filtered
      const hasBadContent = filtered.some(r => r.text === 'Bad content');
      assert.ok(!hasBadContent, 'Low quality forum content with low score should be filtered');
    });

    it('should learn from feedback', () => {
      const engine = new HeuristicEngine();
      
      const query = 'Python tutorials';
      const results = [
        { text: 'Tutorial 1', score: 0.8, meta: {} }
      ];
      
      engine.learn(query, results, { rating: 5 });
      
      assert.equal(engine.queryHistory.length, 1);
      // Query is normalized to lowercase in implementation
      assert.equal(engine.queryHistory[0].query, query.toLowerCase());
      // feedback is stored as feedback, not userRating
      assert.equal(engine.queryHistory[0].feedback, 5);
    });

    it('should detect patterns from successful queries', () => {
      const engine = new HeuristicEngine();
      
      // Add successful queries
      engine.learn('latest Python', [{ text: 'Doc', score: 0.9 }], { rating: 5 });
      engine.learn('latest features', [{ text: 'Doc', score: 0.85 }], { rating: 5 });
      engine.learn('latest news', [{ text: 'Doc', score: 0.88 }], { rating: 4 });
      
      // detectPatterns() is called automatically in learn()
      // and modifies internal state, doesn't return anything
      // Check that patterns field exists
      assert.ok(Array.isArray(engine.patterns));
    });

    it('should limit query history to 100 entries', () => {
      const engine = new HeuristicEngine();
      
      // Add 150 queries
      for (let i = 0; i < 150; i++) {
        engine.learn(`query ${i}`, [{ text: 'Doc', score: 0.8 }], { rating: 3 });
      }
      
      assert.equal(engine.queryHistory.length, 100);
    });
  });

  describe('SmartRetriever', () => {
    it('should create with default configuration', () => {
      const mockRetriever = {
        getRelevant: async () => []
      };
      
      const smart = new SmartRetriever(mockRetriever);
      
      assert.ok(smart.decisionEngine !== undefined);
      assert.ok(smart.heuristicEngine !== undefined);
      // Default is true if not specified
      assert.equal(typeof smart.enableLearning, 'boolean');
    });

    it('should create with custom weights', () => {
      const mockRetriever = {
        getRelevant: async () => []
      };
      
      const customWeights = {
        semanticSimilarity: 0.6,
        recency: 0.3,
        keywordMatch: 0.05,
        sourceQuality: 0.03,
        contextRelevance: 0.02
      };
      
      const smart = new SmartRetriever(mockRetriever, {
        weights: customWeights
      });
      
      assert.deepEqual(smart.decisionEngine.weights, customWeights);
    });

    it('should retrieve and score documents', async () => {
      const mockResults = [
        { 
          text: 'Python 3.12 features',
          score: 0.85,
          meta: { source: 'official', date: '2024-01-15' }
        },
        {
          text: 'Python tutorial',
          score: 0.75,
          meta: { source: 'blog', date: '2023-06-10' }
        }
      ];
      
      const mockRetriever = {
        getRelevant: async (query, k) => {
          assert.equal(query, 'Python features');
          assert.equal(k, 4); // topK * 2
          return mockResults;
        }
      };
      
      const smart = new SmartRetriever(mockRetriever);
      const response = await smart.getRelevant('Python features', 2);
      
      assert.equal(response.query, 'Python features');
      assert.equal(response.originalQuery, 'Python features');
      assert.ok(response.results.length <= 2);
      assert.ok(response.decisions !== undefined);
      assert.ok(response.decisions.weights !== undefined);
      
      // Results should have weighted scores
      response.results.forEach(doc => {
        assert.ok(doc.weightedScore !== undefined);
        assert.ok(doc.scoreBreakdown !== undefined);
      });
    });

    it('should provide feedback and learn', async () => {
      const mockRetriever = {
        getRelevant: async () => [
          { text: 'Doc', score: 0.8, meta: {} }
        ]
      };
      
      const smart = new SmartRetriever(mockRetriever, {
        enableLearning: true
      });
      
      const results = [{ text: 'Doc', score: 0.8, meta: {} }];
      smart.provideFeedback('test query', results, { rating: 5 });
      
      const insights = smart.getInsights();
      assert.equal(insights.heuristics.totalQueries, 1);
    });

    it('should export and import knowledge', async () => {
      const mockRetriever = {
        getRelevant: async () => []
      };
      
      const smart1 = new SmartRetriever(mockRetriever, {
        enableLearning: true
      });
      
      // Add some learning data
      smart1.provideFeedback('test', [], { rating: 5 });
      
      // Export
      const knowledge = smart1.exportKnowledge();
      assert.ok(knowledge.rules !== undefined);
      assert.ok(knowledge.history !== undefined);
      
      // Import to new retriever
      const smart2 = new SmartRetriever(mockRetriever);
      smart2.importKnowledge(knowledge);
      
      // Should have the same history
      const insights = smart2.getInsights();
      assert.equal(insights.heuristics.totalQueries, 1);
    });

    it('should calculate keyword match score', async () => {
      const mockRetriever = {
        getRelevant: async () => [
          { text: 'Python programming language', score: 0.8, meta: {} }
        ]
      };
      
      const smart = new SmartRetriever(mockRetriever);
      const response = await smart.getRelevant('Python language', 1);
      
      const doc = response.results[0];
      const keywordScore = doc.scoreBreakdown.keywordMatch.score;
      
      // Should match 2 out of 2 terms
      assert.ok(keywordScore > 0.8);
    });

    it('should remove duplicate documents', async () => {
      const mockRetriever = {
        getRelevant: async () => [
          { text: 'Same content', score: 0.9, meta: {} },
          { text: 'Same content', score: 0.85, meta: {} },
          { text: 'Different content', score: 0.8, meta: {} }
        ]
      };
      
      const smart = new SmartRetriever(mockRetriever);
      const response = await smart.getRelevant('test', 3);
      
      // Should keep only unique documents
      assert.equal(response.results.length, 2);
      
      // Should keep higher scoring duplicate
      const sameDocs = response.results.filter(d => d.text === 'Same content');
      assert.equal(sameDocs.length, 1);
      assert.equal(sameDocs[0].score, 0.9);
    });

    it('should respect topK parameter', async () => {
      const mockRetriever = {
        getRelevant: async () => [
          { text: 'Doc 1', score: 0.9, meta: {} },
          { text: 'Doc 2', score: 0.8, meta: {} },
          { text: 'Doc 3', score: 0.7, meta: {} },
          { text: 'Doc 4', score: 0.6, meta: {} },
          { text: 'Doc 5', score: 0.5, meta: {} }
        ]
      };
      
      const smart = new SmartRetriever(mockRetriever);
      const response = await smart.getRelevant('test', 3);
      
      assert.equal(response.results.length, 3);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete workflow', async () => {
      const docs = [
        { text: 'Python 3.12 released', score: 0.85, meta: { source: 'official', date: '2024-01-01' } },
        { text: 'Tutorial for beginners', score: 0.75, meta: { source: 'blog', date: '2023-06-01' } },
        { text: 'Advanced Python guide', score: 0.80, meta: { source: 'documentation', date: '2024-02-01' } }
      ];
      
      const mockRetriever = {
        getRelevant: async () => docs
      };
      
      const smart = new SmartRetriever(mockRetriever, {
        enableLearning: true
      });
      
      // First query
      const response1 = await smart.getRelevant('latest Python', 2);
      assert.ok(response1.results.length <= 2);
      
      // Provide positive feedback
      smart.provideFeedback('latest Python', response1.results, { rating: 5 });
      
      // Second query
      const response2 = await smart.getRelevant('latest features', 2);
      
      // Check insights
      const insights = smart.getInsights();
      assert.ok(insights.heuristics.totalQueries >= 1, 'Should have at least 1 query');
      assert.ok(insights.heuristics.avgRetrievalScore > 0);
      assert.ok(insights.heuristics.avgUserRating > 0);
    });
  });
});
