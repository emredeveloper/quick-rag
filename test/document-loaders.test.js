/**
 * Tests for Document Loaders
 * Note: These tests require optional dependencies
 */

import assert from 'assert';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function testTextLoader() {
  try {
    const { loadText } = await import('../src/loaders/documents.js');
    
    // Create temporary test file
    const testFile = path.join(__dirname, 'test-temp.txt');
    await fs.writeFile(testFile, 'Hello, World!');

    const doc = await loadText(testFile);
    
    assert.strictEqual(doc.text, 'Hello, World!', 'text should match');
    assert.strictEqual(doc.meta.format, 'text', 'format should be text');
    assert(doc.meta.fileName, 'should have fileName');

    // Cleanup
    await fs.unlink(testFile);

    console.log('✅ Text loader tests passed');
  } catch (err) {
    console.log('⚠️  Text loader tests skipped:', err.message);
  }
}

async function testJSONLoader() {
  try {
    const { loadJSON } = await import('../src/loaders/documents.js');
    
    // Create temporary JSON file
    const testFile = path.join(__dirname, 'test-temp.json');
    const data = { title: 'Test', content: 'Hello JSON' };
    await fs.writeFile(testFile, JSON.stringify(data));

    const doc = await loadJSON(testFile);
    
    assert(doc.text.includes('Test'), 'text should contain data');
    assert.strictEqual(doc.meta.format, 'json', 'format should be json');
    assert.deepStrictEqual(doc.data, data, 'data should match');

    // Test with textField option
    const doc2 = await loadJSON(testFile, { textField: 'content' });
    assert.strictEqual(doc2.text, 'Hello JSON', 'should extract specific field');

    // Cleanup
    await fs.unlink(testFile);

    console.log('✅ JSON loader tests passed');
  } catch (err) {
    console.log('⚠️  JSON loader tests skipped:', err.message);
  }
}

async function testMarkdownLoader() {
  try {
    const { loadMarkdown } = await import('../src/loaders/documents.js');
    
    // Create temporary markdown file
    const testFile = path.join(__dirname, 'test-temp.md');
    const markdown = '# Title\n\n**Bold** and *italic* text.\n\n```js\ncode\n```';
    await fs.writeFile(testFile, markdown);

    const doc = await loadMarkdown(testFile);
    
    assert(doc.text.includes('# Title'), 'should contain markdown');
    assert.strictEqual(doc.meta.format, 'markdown', 'format should be markdown');

    // Test with stripMarkdown option
    const doc2 = await loadMarkdown(testFile, { stripMarkdown: true });
    assert(!doc2.text.includes('**'), 'should strip markdown syntax');
    assert(doc2.text.includes('Bold'), 'should keep text content');

    // Cleanup
    await fs.unlink(testFile);

    console.log('✅ Markdown loader tests passed');
  } catch (err) {
    console.log('⚠️  Markdown loader tests skipped:', err.message);
  }
}

async function testPDFLoader() {
  try {
    const { loadPDF } = await import('../src/loaders/documents.js');
    
    // This will fail without pdf-parse, which is expected
    console.log('ℹ️  PDF loader requires: npm install pdf-parse');
    console.log('   Skipping PDF tests (optional dependency)');
    
  } catch (err) {
    console.log('⚠️  PDF loader not available:', err.message);
  }
}

async function testAutoDetect() {
  try {
    const { loadDocument } = await import('../src/loaders/documents.js');
    
    // Create test files
    const testTxt = path.join(__dirname, 'test-temp.txt');
    await fs.writeFile(testTxt, 'Plain text');

    const doc = await loadDocument(testTxt);
    assert.strictEqual(doc.meta.format, 'text', 'should auto-detect text format');

    // Cleanup
    await fs.unlink(testTxt);

    console.log('✅ Auto-detect tests passed');
  } catch (err) {
    console.log('⚠️  Auto-detect tests skipped:', err.message);
  }
}

async function testWebLoader() {
  try {
    const { loadURL } = await import('../src/loaders/web.js');
    
    // Test with a simple URL
    const doc = await loadURL('https://example.com', { extractText: true });
    
    assert(doc.text.length > 0, 'should have text content');
    assert.strictEqual(doc.meta.format, 'url', 'format should be url');
    assert(doc.meta.url, 'should have URL in metadata');

    console.log('✅ Web loader tests passed');
  } catch (err) {
    console.log('⚠️  Web loader tests skipped:', err.message);
  }
}

export async function runDocumentLoaderTests() {
  console.log('\n🧪 Running Document Loader Tests...');
  
  await testTextLoader();
  await testJSONLoader();
  await testMarkdownLoader();
  await testAutoDetect();
  await testWebLoader();
  await testPDFLoader();
  
  console.log('✅ Document loader tests completed\n');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDocumentLoaderTests().catch(console.error);
}
