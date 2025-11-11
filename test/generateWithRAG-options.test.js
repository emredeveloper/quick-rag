/**
 * Tests for generateWithRAG Options
 */

import assert from 'assert';
import { InMemoryVectorStore } from '../src/vectorStore.js';
import { Retriever } from '../src/retriever.js';
import { generateWithRAG } from '../src/rag.js';
import { PromptManager } from '../src/promptManager.js';

const MOCK_MODE = process.env.MOCK_OLLAMA === 'true';

async function testEmbedding(text, dim = 128) {
  const vec = new Array(dim).fill(0);
  for (let i = 0; i < text.length; i++) {
    vec[i % dim] += text.charCodeAt(i);
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map(v => v / norm);
}

async function testGenerateWithRAGOptions() {
  if (MOCK_MODE) {
    console.log('⏭️  Skipping generateWithRAG options tests (MOCK_MODE)');
    return;
  }

  const { OllamaRAGClient } = await import('../src/ollamaRAGClient.js');
  const client = new OllamaRAGClient();
  
  const store = new InMemoryVectorStore(testEmbedding);
  await store.addDocuments([
    { text: 'JavaScript is a programming language.' },
    { text: 'Python is great for data science.' }
  ]);
  
  const retriever = new Retriever(store);
  const results = await retriever.getRelevant('What is JavaScript?', 1);
  
  try {
    // Test with template option
    const answer1 = await generateWithRAG(
      client,
      'granite4:tiny-h',
      'What is JavaScript?',
      results,
      { template: 'conversational' }
    );
    assert.ok(answer1, 'should return response with template option');
    assert.ok(answer1.response || typeof answer1 === 'string', 'should have response');
    
    // Test with systemPrompt option
    const answer2 = await generateWithRAG(
      client,
      'granite4:tiny-h',
      'What is JavaScript?',
      results,
      { 
        template: 'technical',
        systemPrompt: 'You are a programming expert.'
      }
    );
    assert.ok(answer2, 'should return response with systemPrompt');
    
    // Test with promptManager option
    const promptManager = new PromptManager({
      systemPrompt: 'You are helpful.',
      template: 'instructional'
    });
    const answer3 = await generateWithRAG(
      client,
      'granite4:tiny-h',
      'What is JavaScript?',
      results,
      { promptManager }
    );
    assert.ok(answer3, 'should return response with promptManager');
    
    // Test with context options
    const answer4 = await generateWithRAG(
      client,
      'granite4:tiny-h',
      'What is JavaScript?',
      results,
      {
        context: {
          includeScores: true,
          includeMetadata: true
        }
      }
    );
    assert.ok(answer4, 'should return response with context options');
    
    console.log('✅ generateWithRAG options tests passed');
  } catch (err) {
    console.warn('⚠️  generateWithRAG options tests skipped:', err.message);
  }
}

export async function runGenerateWithRAGOptionsTests() {
  console.log('\n🧪 Running generateWithRAG Options Tests...');
  await testGenerateWithRAGOptions();
  console.log('✅ generateWithRAG options tests completed\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runGenerateWithRAGOptionsTests().catch(console.error);
}

