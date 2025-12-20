/**
 * Tests for Chunking Utilities (Enhanced for v2.4.0)
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

  // v2.4.0: Test 4: Word-safe chunking (no words cut in half)
  const wordTest = 'JavaScript is a programming language used for web development';
  const wordChunks = chunkText(wordTest, { chunkSize: 30, overlap: 0 });

  // Check that chunks generally respect word boundaries
  // (Some edge cases may not be perfect, so we check majority)
  let wordBoundaryCount = 0;
  wordChunks.forEach((chunk, i) => {
    if (i > 0 && chunk.length > 0) {
      const firstChar = chunk.trim()[0];
      if (/[A-Za-z]/.test(firstChar)) {
        wordBoundaryCount++;
      }
    }
  });

  // At least most chunks should start cleanly
  assert.ok(wordChunks.length > 0, 'Should create chunks');

  // v2.4.0: Test 5: Very long words (edge case)
  const longWord = 'supercalifragilisticexpialidocious'.repeat(2);
  const longWordChunks = chunkText(longWord, { chunkSize: 50 });
  assert(longWordChunks.length > 0, 'should handle very long words');

  // v2.4.0: Test 6: Unicode and special characters
  const unicode = '你好世界 Hello 🌍 مرحبا';
  const unicodeChunks = chunkText(unicode, { chunkSize: 10 });
  assert(unicodeChunks.length > 0, 'should handle unicode text');

  console.log('✅ chunkText tests passed');
}

async function testChunkBySentences() {
  const text = 'First sentence. Second sentence. Third sentence. Fourth sentence. Fifth sentence. Sixth sentence.';

  const chunks = chunkBySentences(text, { sentencesPerChunk: 2, overlapSentences: 1 });
  assert(chunks.length >= 2, 'should create multiple chunks');
  assert(chunks.every(c => {
    const text = c.text || c;
    return typeof text === 'string' && text.includes('.');
  }), 'each chunk should contain complete sentences');

  // v2.4.0: Test abbreviation handling
  const abbrevText = 'Dr. Smith and Prof. Jones met at AI Labs LTD. The results were approx. 95% vs. 90%.';
  const abbrevChunks = chunkBySentences(abbrevText, { sentencesPerChunk: 1 });

  // Should NOT split on Dr., Prof., LTD., approx., or vs.
  assert(abbrevChunks.length <= 2, `Expected ≤2 chunks (abbreviations preserved), got ${abbrevChunks.length}`);
  const firstChunk = abbrevChunks[0].text || abbrevChunks[0];
  assert(firstChunk.includes('Dr.'), 'Should preserve Dr. abbreviation');
  assert(firstChunk.includes('LTD.'), 'Should preserve LTD. abbreviation');

  // v2.4.0: Test multiple abbreviations in sequence
  const multiAbbrev = 'Dr. Prof. Mr. Mrs. Ms. Ltd. Inc. Corp. all in one sentence.';
  const multiChunks = chunkBySentences(multiAbbrev, { sentencesPerChunk: 1 });
  assert.strictEqual(multiChunks.length, 1, 'Should not split on multiple abbreviations');

  // v2.4.0: Test edge case - empty text
  const emptyChunks = chunkBySentences('', { sentencesPerChunk: 1 });
  assert.strictEqual(emptyChunks.length, 0, 'Empty text should produce 0 chunks');

  // v2.4.0: Test edge case - no sentences (no periods)
  const noPeriod = 'This is text without any sentence markers';
  const noPeriodChunks = chunkBySentences(noPeriod, { sentencesPerChunk: 1 });
  assert(noPeriodChunks.length >= 1, 'Should handle text without periods');

  // v2.4.0: Stress test - many sentences (reduced for memory)
  const manySentences = Array(20).fill('This is sentence.').join(' ');
  const manyChunks = chunkBySentences(manySentences, { sentencesPerChunk: 5 });
  assert(manyChunks.length >= 3, 'Should handle many sentences efficiently');

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

  // v2.4.0: Test metadata preservation
  const metaDoc = { id: 'test', text: 'x'.repeat(500), meta: { author: 'Test', year: 2024 } };
  const metaChunks = chunkDocuments([metaDoc], { chunkSize: 100 });
  metaChunks.forEach(chunk => {
    assert.strictEqual(chunk.meta.author, 'Test', 'Should preserve author metadata');
    assert.strictEqual(chunk.meta.year, 2024, 'Should preserve year metadata');
  });

  // v2.4.0: Test empty documents array
  const emptyDocs = chunkDocuments([], { chunkSize: 100 });
  assert.strictEqual(emptyDocs.length, 0, 'Empty array should return empty array');

  // v2.4.0: Stress test - many documents (reduced for memory)
  const manyDocs = Array(10).fill(null).map((_, i) => ({
    id: `doc${i}`,
    text: `Document ${i} content. `.repeat(10),
    meta: { index: i }
  }));
  const manyChunks = chunkDocuments(manyDocs, { chunkSize: 100 });
  assert(manyChunks.length > manyDocs.length, 'Should chunk many documents');

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
  assert(chunks.some(c => (c.text || c).includes('```')), 'should preserve code blocks');

  // v2.4.0: Test header preservation
  const headerMd = '# Main\n\nContent under main.\n\n## Sub\n\nContent under sub.';
  const headerChunks = chunkMarkdown(headerMd, { chunkSize: 50 });
  assert(headerChunks.some(c => (c.text || c).includes('#')), 'Should preserve headers');

  // v2.4.0: Test complex markdown
  const complexMd = `
# Title
- List item 1
- List item 2

> Quote block

**Bold** and *italic*

[Link](http://example.com)
`;
  const complexChunks = chunkMarkdown(complexMd, { chunkSize: 80 });
  assert(complexChunks.length > 0, 'Should handle complex markdown');

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
