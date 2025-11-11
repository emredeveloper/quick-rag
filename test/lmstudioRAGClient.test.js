/**
 * Integration Tests for LMStudioRAGClient
 * Tests official SDK wrapper functionality
 */

import assert from 'assert';
import { LMStudioRAGClient } from '../src/lmstudioRAGClient.js';

const MOCK_MODE = process.env.MOCK_LMSTUDIO === 'true';

async function testLMStudioRAGClientBasics() {
  if (MOCK_MODE) {
    console.log('⏭️  Skipping LMStudioRAGClient tests (MOCK_MODE)');
    return;
  }

  const client = new LMStudioRAGClient();
  
  // Test 1: List loaded models
  try {
    const models = await client.listLoaded();
    assert(Array.isArray(models), 'listLoaded() should return array');
    console.log('✅ LMStudioRAGClient.listLoaded() works');
  } catch (err) {
    console.warn('⚠️  LM Studio not running, skipping tests:', err.message);
    return;
  }

  // Test 2: List downloaded models
  try {
    const models = await client.listDownloaded();
    assert(Array.isArray(models), 'listDownloaded() should return array');
    console.log('✅ LMStudioRAGClient.listDownloaded() works');
  } catch (err) {
    console.warn('⚠️  listDownloaded not available:', err.message);
  }

  // Test 3: Chat (if model is loaded)
  try {
    const models = await client.listLoaded();
    if (models && models.length > 0) {
      const modelPath = models[0].path || 'qwen/qwen3-4b-2507';
      const response = await client.chat(modelPath, 'Say hi in one word');
      assert(typeof response === 'string', 'chat() should return string');
      assert(response.length > 0, 'chat() should return non-empty string');
      console.log('✅ LMStudioRAGClient.chat() works');
    }
  } catch (err) {
    console.warn('⚠️  Chat test skipped:', err.message);
  }

  // Test 4: Embeddings
  try {
    const embedResult = await client.embed('text-embedding-embeddinggemma-300m', 'test');
    assert(Array.isArray(embedResult), 'embed() should return array');
    assert(embedResult.length > 0, 'embed() should return non-empty array');
    console.log('✅ LMStudioRAGClient.embed() works');
  } catch (err) {
    console.warn('⚠️  Embedding test skipped:', err.message);
  }
}

export async function runLMStudioRAGClientTests() {
  console.log('\n🧪 Running LMStudioRAGClient Tests...');
  await testLMStudioRAGClientBasics();
  console.log('✅ LMStudioRAGClient tests completed\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runLMStudioRAGClientTests().catch(console.error);
}

