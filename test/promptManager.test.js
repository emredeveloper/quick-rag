/**
 * Tests for PromptManager
 */

import assert from 'assert';
import {
  PromptManager,
  PromptTemplates,
  createPromptManager,
  getTemplate
} from '../src/promptManager.js';

async function testPromptTemplates() {
  // Test all built-in templates exist
  const templateNames = ['default', 'conversational', 'technical', 'academic', 
    'code', 'concise', 'detailed', 'qa', 'instructional', 'creative'];
  
  templateNames.forEach(name => {
    assert.ok(PromptTemplates[name], `should have ${name} template`);
    assert.ok(typeof PromptTemplates[name] === 'function', `${name} should be a function`);
    
    const result = PromptTemplates[name]('test query', 'test context');
    assert.ok(typeof result === 'string', `${name} should return string`);
    assert.ok(result.length > 0, `${name} should return non-empty string`);
  });
  
  console.log('✅ PromptTemplates tests passed');
}

async function testPromptManager() {
  // Test basic creation
  const pm = new PromptManager();
  assert.ok(pm.systemPrompt === '', 'should have empty system prompt by default');
  assert.ok(pm.template === 'default', 'should use default template');
  
  // Test with options
  const pm2 = new PromptManager({
    systemPrompt: 'You are a helpful assistant.',
    template: 'conversational',
    variables: { name: 'Quick RAG' }
  });
  assert.strictEqual(pm2.systemPrompt, 'You are a helpful assistant.');
  assert.strictEqual(pm2.template, 'conversational');
  assert.strictEqual(pm2.customVariables.name, 'Quick RAG');
  
  // Test generate
  const docs = [
    { text: 'Document 1', score: 0.8 },
    { text: 'Document 2', score: 0.7 }
  ];
  
  const prompt = pm2.generate('What is RAG?', docs);
  assert.ok(typeof prompt === 'string', 'should generate string prompt');
  assert.ok(prompt.includes('What is RAG?'), 'should include query');
  assert.ok(prompt.includes('Document 1'), 'should include context');
  assert.ok(prompt.includes('You are a helpful assistant'), 'should include system prompt');
  
  // Test setSystemPrompt
  pm2.setSystemPrompt('New system prompt');
  assert.strictEqual(pm2.systemPrompt, 'New system prompt');
  
  // Test setTemplate
  pm2.setTemplate('technical');
  assert.strictEqual(pm2.template, 'technical');
  
  // Test setVariables
  pm2.setVariables({ version: '2.0.0' });
  assert.strictEqual(pm2.customVariables.version, '2.0.0');
  assert.strictEqual(pm2.customVariables.name, 'Quick RAG', 'should preserve existing variables');
  
  // Test clone
  const cloned = pm2.clone({ template: 'academic' });
  assert.strictEqual(cloned.systemPrompt, 'New system prompt', 'should clone system prompt');
  assert.strictEqual(cloned.template, 'academic', 'should override template');
  assert.strictEqual(cloned.customVariables.version, '2.0.0', 'should clone variables');
  
  // Test context formatting options
  const pm3 = new PromptManager({ template: 'default' });
  const promptWithScores = pm3.generate('test', docs, {
    context: { includeScores: true }
  });
  assert.ok(promptWithScores.includes('score:'), 'should include scores when requested');
  
  const promptWithMeta = pm3.generate('test', [
    { text: 'Doc', meta: { source: 'web' } }
  ], {
    context: { includeMetadata: true }
  });
  assert.ok(promptWithMeta.includes('source=web'), 'should include metadata when requested');
  
  console.log('✅ PromptManager tests passed');
}

async function testCreatePromptManager() {
  const pm = createPromptManager({
    systemPrompt: 'Test',
    template: 'conversational'
  });
  
  assert.ok(pm instanceof PromptManager, 'should return PromptManager instance');
  assert.strictEqual(pm.systemPrompt, 'Test');
  assert.strictEqual(pm.template, 'conversational');
  
  console.log('✅ createPromptManager tests passed');
}

async function testGetTemplate() {
  const defaultTemplate = getTemplate('default');
  assert.ok(typeof defaultTemplate === 'function', 'should return function');
  
  const nonExistent = getTemplate('nonexistent');
  assert.ok(typeof nonExistent === 'function', 'should return default template for non-existent name');
  assert.strictEqual(nonExistent, PromptTemplates.default, 'should return default template');
  
  console.log('✅ getTemplate tests passed');
}

export async function runPromptManagerTests() {
  console.log('\n🧪 Running PromptManager Tests...');
  await testPromptTemplates();
  await testPromptManager();
  await testCreatePromptManager();
  await testGetTemplate();
  console.log('✅ PromptManager tests completed\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runPromptManagerTests().catch(console.error);
}

