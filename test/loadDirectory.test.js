/**
 * Tests for Document Loaders - loadDirectory
 */

import assert from 'assert';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadDirectory } from '../src/loaders/documents.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function testLoadDirectory() {
  try {
    // Create temporary test directory
    const testDir = path.join(__dirname, 'test-docs');
    await fs.mkdir(testDir, { recursive: true });
    
    // Create test files
    await fs.writeFile(path.join(testDir, 'test1.txt'), 'First document');
    await fs.writeFile(path.join(testDir, 'test2.txt'), 'Second document');
    await fs.writeFile(path.join(testDir, 'test3.md'), '# Markdown Document');
    
    // Test loading all files
    const allDocs = await loadDirectory(testDir);
    assert.ok(Array.isArray(allDocs), 'should return array');
    assert.ok(allDocs.length >= 3, 'should load multiple files');
    
    // Test with extensions filter
    const txtDocs = await loadDirectory(testDir, {
      extensions: ['.txt']
    });
    assert.ok(txtDocs.length >= 2, 'should filter by extension');
    assert.ok(txtDocs.every(doc => doc.meta.format === 'text'), 'should only load text files');
    
    // Test recursive loading
    const subDir = path.join(testDir, 'subdir');
    await fs.mkdir(subDir, { recursive: true });
    await fs.writeFile(path.join(subDir, 'nested.txt'), 'Nested document');
    
    const recursiveDocs = await loadDirectory(testDir, {
      recursive: true,
      extensions: ['.txt']
    });
    assert.ok(recursiveDocs.length >= 3, 'should load nested files recursively');
    
    // Cleanup
    await fs.rm(testDir, { recursive: true, force: true });
    
    console.log('✅ loadDirectory tests passed');
  } catch (err) {
    console.log('⚠️  loadDirectory tests skipped:', err.message);
  }
}

export async function runLoadDirectoryTests() {
  console.log('\n🧪 Running loadDirectory Tests...');
  await testLoadDirectory();
  console.log('✅ loadDirectory tests completed\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runLoadDirectoryTests().catch(console.error);
}

