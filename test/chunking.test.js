/**
 * Tests for Chunking Utilities
 */

import assert from 'assert';
import { 
  chunkText, 
  chunkBySentences, 
  chunkDocuments, 
  chunkMarkdown 
} from '../src/utils/chunking.js';

async function testChunkText() {
  // Test 1: Small text (no chunking needed)
  const small = 'Short text';
  const smallChunks = chunkText(small, { chunkSize: 100 });
  assert.strictEqual(smallChunks.length, 1, 'small text should return 1 chunk');
  assert.strictEqual(smallChunks[0], small, 'small text should be unchanged');

  // Test 2: Large text with paragraphs
  const large = 'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.'.repeat(10);
  const largeChunks = chunkText(large, { chunkSize: 100, overlap: 20 });
  assert(largeChunks.length > 1, 'large text should create multiple chunks');
  assert(largeChunks.every(c => c.length <= 100 + 50), 'chunks should respect size limit (with tolerance)');

  // Test 3: Empty/invalid input
  assert.deepStrictEqual(chunkText(''), [], 'empty string should return empty array');
  assert.deepStrictEqual(chunkText(null), [], 'null should return empty array');

  console.log('✅ chunkText tests passed');
}

async function testChunkBySentences() {
  const text = 'First sentence. Second sentence. Third sentence. Fourth sentence. Fifth sentence. Sixth sentence.';
  
  const chunks = chunkBySentences(text, { sentencesPerChunk: 2, overlapSentences: 1 });
  assert(chunks.length >= 2, 'should create multiple chunks');
  assert(chunks.every(c => c.includes('.')), 'each chunk should contain complete sentences');

  console.log('✅ chunkBySentences tests passed');
}

async function testChunkDocuments() {
  const docs = [
    { id: 'doc1', text: 'Short doc', meta: { source: 'web' } },
    { id: 'doc2', text: 'A'.repeat(1000), meta: { source: 'book' } }
  ];

  const chunks = chunkDocuments(docs, { chunkSize: 200, overlap: 20 });
  
  assert(chunks.length > docs.length, 'should create more chunks than original docs');
  assert(chunks.every(c => c.meta), 'all chunks should preserve metadata');
  assert(chunks.some(c => c.meta.chunkIndex !== undefined), 'chunks should have chunk metadata');

  console.log('✅ chunkDocuments tests passed');
}

async function testChunkMarkdown() {
  const markdown = `# Title

## Section 1
Some text here.

\`\`\`javascript
const code = 'block';
// This should stay together
\`\`\`

## Section 2
More text.`;

  const chunks = chunkMarkdown(markdown, { chunkSize: 100, overlap: 20 });
  
  assert(chunks.length >= 1, 'should create at least one chunk');
  assert(chunks.some(c => c.includes('```')), 'should preserve code blocks');

  console.log('✅ chunkMarkdown tests passed');
}

export async function runChunkingTests() {
  console.log('\n🧪 Running Chunking Tests...');
  await testChunkText();
  await testChunkBySentences();
  await testChunkDocuments();
  await testChunkMarkdown();
  console.log('✅ Chunking tests completed\n');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runChunkingTests().catch(console.error);
}
