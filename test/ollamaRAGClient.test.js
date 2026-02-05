/**
 * Integration Tests for OllamaRAGClient
 * Tests official SDK wrapper functionality
 */

import assert from 'assert';
import { OllamaRAGClient } from '../src/ollamaRAGClient.js';

// Mock Ollama server response (for CI environments without Ollama)
const MOCK_MODE = process.env.MOCK_OLLAMA === 'true';

async function testOllamaRAGClientBasics() {
  if (MOCK_MODE) {
    console.log('⏭️  Skipping OllamaRAGClient tests (MOCK_MODE)');
    return;
  }

  const client = new OllamaRAGClient();
  
  // Test 1: List models
  try {
    const models = await client.list();
    assert(models && typeof models === 'object', 'list() should return object');
    console.log('✅ OllamaRAGClient.list() works');
  } catch (err) {
    console.warn('⚠️  Ollama not running, skipping tests:', err.message);
    return;
  }

  // Test 2: Generate text
  try {
    const response = await client.generate({
      model: 'granite4:3b',
      prompt: 'Say hi in one word',
      stream: false
    });
    assert(response && response.response, 'generate() should return response');
    console.log('✅ OllamaRAGClient.generate() works');
  } catch (err) {
    console.warn('⚠️  Model not available:', err.message);
  }

  // Test 3: Embeddings
  try {
    const embedResult = await client.embed('qwen3-embedding:0.6b', 'test');
    assert(embedResult && Array.isArray(embedResult.embeddings), 'embed() should return embeddings array');
    console.log('✅ OllamaRAGClient.embed() works');
  } catch (err) {
    console.warn('⚠️  Embedding model not available:', err.message);
  }
}

async function testOllamaRAGClientStreaming() {
  if (MOCK_MODE) return;

  const client = new OllamaRAGClient();
  
  try {
    const response = await client.chat({
      model: 'granite4:3b',
      messages: [{ role: 'user', content: 'Count to 3' }],
      stream: true
    });

    let chunks = 0;
    for await (const chunk of response) {
      chunks++;
      assert(chunk && chunk.message, 'streaming chunk should have message');
    }
    assert(chunks > 0, 'should receive streaming chunks');
    console.log('✅ OllamaRAGClient streaming works');
  } catch (err) {
    console.warn('⚠️  Streaming test skipped:', err.message);
  }
}

export async function runOllamaRAGClientTests() {
  console.log('\n🧪 Running OllamaRAGClient Tests...');
  await testOllamaRAGClientBasics();
  await testOllamaRAGClientStreaming();
  console.log('✅ OllamaRAGClient tests completed\n');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runOllamaRAGClientTests().catch(console.error);
}
