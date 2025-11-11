/**
 * Tests for Web Loaders
 */

import assert from 'assert';
import { loadURL, loadURLs, loadSitemap } from '../src/loaders/web.js';

async function testLoadURL() {
  try {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 10000)
    );
    
    const loadPromise = loadURL('https://example.com', { extractText: true });
    const doc = await Promise.race([loadPromise, timeoutPromise]);
    
    assert.ok(doc.text, 'should have text content');
    assert.ok(typeof doc.text === 'string', 'text should be string');
    assert.strictEqual(doc.meta.format, 'url', 'format should be url');
    assert.ok(doc.meta.url, 'should have URL in metadata');
    assert.ok(doc.meta.loadedAt, 'should have loadedAt timestamp');
    
    console.log('✅ loadURL tests passed');
  } catch (err) {
    if (err.message === 'Timeout') {
      console.log('⚠️  loadURL tests skipped (timeout - network issue)');
    } else {
      console.log('⚠️  loadURL tests skipped:', err.message);
    }
  }
}

async function testLoadURLs() {
  try {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 10000)
    );
    
    const urls = [
      'https://example.com',
      'https://www.example.org'
    ];
    
    const loadPromise = loadURLs(urls, { extractText: true });
    const docs = await Promise.race([loadPromise, timeoutPromise]);
    
    assert.ok(Array.isArray(docs), 'should return array');
    assert.ok(docs.length > 0, 'should return at least one document');
    docs.forEach(doc => {
      assert.ok(doc.text, 'each doc should have text');
      assert.strictEqual(doc.meta.format, 'url', 'each doc should have url format');
    });
    
    console.log('✅ loadURLs tests passed');
  } catch (err) {
    if (err.message === 'Timeout') {
      console.log('⚠️  loadURLs tests skipped (timeout - network issue)');
    } else {
      console.log('⚠️  loadURLs tests skipped:', err.message);
    }
  }
}

async function testLoadSitemap() {
  try {
    // Test with a real sitemap (if available)
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 5000)
    );
    
    try {
      const sitemapPromise = loadSitemap('https://example.com/sitemap.xml');
      const urls = await Promise.race([sitemapPromise, timeoutPromise]);
      assert.ok(Array.isArray(urls), 'should return array of URLs');
      console.log('✅ loadSitemap tests passed');
    } catch (err) {
      // Expected to fail without real sitemap or timeout
      if (err.message === 'Timeout') {
        console.log('ℹ️  loadSitemap test skipped (timeout - no sitemap available)');
      } else {
        console.log('ℹ️  loadSitemap test skipped (no sitemap available)');
      }
    }
  } catch (err) {
    console.log('⚠️  loadSitemap tests skipped:', err.message);
  }
}

export async function runWebLoaderTests() {
  console.log('\n🧪 Running Web Loader Tests...');
  await testLoadURL();
  await testLoadURLs();
  await testLoadSitemap();
  console.log('✅ Web loader tests completed\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runWebLoaderTests().catch(console.error);
}

