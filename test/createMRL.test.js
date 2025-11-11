/**
 * Tests for createMRL
 */

import assert from 'assert';
import { createMRL } from '../src/embeddings/mrl.js';

async function testCreateMRL() {
  // Create a mock base embedding function
  const baseEmbedding = async (text, dim = 768) => {
    const vec = new Array(dim).fill(0);
    for (let i = 0; i < text.length; i++) {
      vec[i % dim] = (vec[i % dim] || 0) + text.charCodeAt(i) / 1000;
    }
    const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
    return vec.map(v => v / norm);
  };
  
  // Create MRL embedding
  const mrlEmbedding = createMRL(baseEmbedding, 768);
  
  // Test full dimension
  const fullVec = await mrlEmbedding('test', 768);
  assert.strictEqual(fullVec.length, 768, 'should return full dimension vector');
  
  // Test reduced dimension
  const reducedVec = await mrlEmbedding('test', 128);
  assert.strictEqual(reducedVec.length, 128, 'should return reduced dimension vector');
  
  // Test normalization
  const norm = Math.sqrt(reducedVec.reduce((s, v) => s + v * v, 0));
  assert.ok(Math.abs(norm - 1.0) < 0.001, 'should normalize vectors');
  
  // Test very small dimension
  const tinyVec = await mrlEmbedding('test', 32);
  assert.strictEqual(tinyVec.length, 32, 'should handle very small dimensions');
  
  console.log('✅ createMRL tests passed');
}

export async function runCreateMRLTests() {
  console.log('\n🧪 Running createMRL Tests...');
  await testCreateMRL();
  console.log('✅ createMRL tests completed\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCreateMRLTests().catch(console.error);
}

