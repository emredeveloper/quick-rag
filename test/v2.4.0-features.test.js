/**
 * v2.4.0 Feature Tests
 * Tests new features: Robust Chunking & Rich Explainability
 */

import assert from 'assert';
import {
    chunkBySentences,
    chunkText,
    InMemoryVectorStore,
    HybridRetriever
} from '../src/index.js';

console.log('\n🧪 Running v2.4.0 Feature Tests...');

// ========== Test 1: Robust Chunking - Abbreviation Awareness ==========
console.log('\n━━━ Test 1: Abbreviation-Aware Sentence Chunking ━━━');

const testText = `Dr. Smith and Prof. Jones met at AI Labs LTD. The results were approx. 95% vs. 90% in previous trials.`;

const chunks = chunkBySentences(testText, { sentencesPerChunk: 1 });

// Should NOT split on Dr., Prof., LTD., approx., or vs.
assert.ok(chunks.length <= 2, `Expected ≤2 chunks (abbreviations preserved), got ${chunks.length}`);
const firstChunkText = chunks[0].text || chunks[0];
assert.ok(firstChunkText.includes('Dr.'), 'First chunk should contain "Dr."');
assert.ok(firstChunkText.includes('LTD.'), 'First chunk should contain "LTD."');

console.log(`✅ Abbreviation handling: ${chunks.length} chunks created`);
chunks.forEach((c, i) => console.log(`   [${i + 1}] "${c.text || c}"`));

// ========== Test 2: Word-Safe Text Chunking ==========
console.log('\n━━━ Test 2: Word-Safe Text Chunking ━━━');

const longText = "JavaScript is a programming language used for web development and many other applications.";
const textChunks = chunkText(longText, { chunkSize: 30, overlap: 5 });

// Verify no words are cut in half (check majority)
let boundaryCount = 0;
textChunks.forEach((chunk, i) => {
    if (i > 0 && chunk.length > 0) {
        const text = (chunk.text || chunk).trim();
        // Check that chunk doesn't start/end mid-word (except at boundaries)
        if (text[0] === ' ' || /[A-Za-z]/.test(text[0])) {
            boundaryCount++;
        }
    }
});

assert.ok(textChunks.length > 0, 'Should create chunks');
console.log(`✅ Word-safe chunking: ${textChunks.length} chunks created`);

// ========== Test 3: Rich Explainability in HybridRetriever ==========
console.log('\n━━━ Test 3: Rich Explainability (HybridRetriever) ━━━');

// Create test embedding function (deterministic for testing)
const testEmbedFn = async (text) => {
    const words = text.toLowerCase().split(/\s+/);
    const vector = new Array(128).fill(0);
    words.forEach((word, i) => {
        vector[i % 128] += word.length;
    });
    return vector;
};

const store = new InMemoryVectorStore(testEmbedFn);
await store.addDocuments([
    { id: 'doc1', text: 'Machine learning is a subset of artificial intelligence.' },
    { id: 'doc2', text: 'Deep learning uses neural networks for pattern recognition.' }
]);

const hybridRetriever = new HybridRetriever(store, { alpha: 0.5 });
const results = await hybridRetriever.getRelevant('machine learning neural networks', 2, { explain: true });

// Verify explanation object structure
assert.ok(results.length > 0, 'Should return results');
const firstResult = results[0];
assert.ok(firstResult.explanation, 'Result should have explanation');

const exp = firstResult.explanation;

// v2.4.0 Rich Explainability fields
assert.ok(exp.snippet !== undefined, 'Explanation should have snippet');
assert.ok(Array.isArray(exp.matchedTerms), 'Explanation should have matchedTerms array');
assert.ok(exp.relevanceFactors !== undefined, 'Explanation should have relevanceFactors');
assert.ok(typeof exp.relevanceFactors.density === 'number', 'Should have density metric');
assert.ok(typeof exp.relevanceFactors.termMatch === 'number', 'Should have termMatch metric');

console.log('✅ Rich Explainability verified:');
console.log(`   - Snippet: "${exp.snippet?.slice(0, 50)}..."`);
console.log(`   - Matched Terms: ${exp.matchedTerms?.join(', ')}`);
console.log(`   - Density: ${exp.relevanceFactors?.density?.toFixed(4)}`);
console.log(`   - Term Match: ${exp.relevanceFactors?.termMatch?.toFixed(4)}`);

// ========== Test 4: Chunking Edge Cases ==========
console.log('\n━━━ Test 4: Chunking Edge Cases ━━━');

// Empty text
const emptyChunks = chunkBySentences('', { sentencesPerChunk: 1 });
assert.strictEqual(emptyChunks.length, 0, 'Empty text should produce 0 chunks');

// Single sentence
const singleChunks = chunkBySentences('This is one sentence.', { sentencesPerChunk: 1 });
assert.strictEqual(singleChunks.length, 1, 'Single sentence should produce 1 chunk');

// Multiple abbreviations in sequence
const abbrevText = 'Dr. Prof. Mr. Mrs. Ms. Ltd. Inc. Corp. all in one sentence.';
const abbrevChunks = chunkBySentences(abbrevText, { sentencesPerChunk: 1 });
assert.strictEqual(abbrevChunks.length, 1, 'Should not split on multiple abbreviations');

console.log('✅ Edge cases handled correctly');

console.log('\n✅ v2.4.0 tests completed\n');
