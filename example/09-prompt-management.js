/**
 * Example 9: Dynamic Prompt Management
 * 
 * Demonstrates the intelligent prompt system with:
 * - Multiple built-in templates
 * - Custom system prompts
 * - Context formatting options
 * - Variable interpolation
 * - Reusable prompt managers
 */

import {
  OllamaRAGClient,
  createOllamaRAGEmbedding,
  InMemoryVectorStore,
  Retriever,
  generateWithRAG,
  PromptManager,
  PromptTemplates,
  createPromptManager
} from '../src/index.js';

async function main() {
  console.log('🎯 Dynamic Prompt Management Example\n');
  
  // Setup RAG system
  console.log('⚙️  Setting up RAG system...');
  const client = new OllamaRAGClient();
  const embed = createOllamaRAGEmbedding(client, 'qwen3-embedding:0.6b');
  const store = new InMemoryVectorStore(embed);
  const retriever = new Retriever(store, { k: 2 });

  // Add documents
  const docs = [
    {
      text: 'Python is a high-level programming language known for its simplicity and readability. It is widely used in data science, web development, and AI.',
      meta: { topic: 'programming', language: 'python', difficulty: 'beginner' }
    },
    {
      text: 'Machine learning is a subset of AI that enables systems to learn from data without explicit programming. Popular frameworks include TensorFlow and PyTorch.',
      meta: { topic: 'ai', category: 'ml', difficulty: 'intermediate' }
    },
    {
      text: 'REST APIs use HTTP methods (GET, POST, PUT, DELETE) for communication. They are stateless and widely used in web services.',
      meta: { topic: 'web', category: 'api', difficulty: 'intermediate' }
    }
  ];

  for (const doc of docs) {
    await store.addDocuments([doc]);
  }
  console.log(`✅ Added ${docs.length} documents\n`);

  const query = 'What is Python used for?';

  // ═══════════════════════════════════════════════════════════════
  console.log('═══════════════════════════════════════════════════════');
  console.log('Example 1: Built-in Templates');
  console.log('═══════════════════════════════════════════════════════\n');

  const relevantDocs = await retriever.getRelevant(query, 2, { explain: true });

  // Test different templates
  const templates = ['default', 'conversational', 'technical', 'concise'];
  
  for (const template of templates) {
    console.log(`\n📝 Template: "${template}"`);
    console.log('─'.repeat(50));
    
    const result = await generateWithRAG(
      client,
      'granite4:3b',
      query,
      relevantDocs.map(d => d.text),
      { template }
    );
    
    console.log(`Response: ${result.response.substring(0, 150)}...`);
  }

  // ═══════════════════════════════════════════════════════════════
  console.log('\n\n═══════════════════════════════════════════════════════');
  console.log('Example 2: System Prompt');
  console.log('═══════════════════════════════════════════════════════\n');

  const systemPrompt = 'You are a friendly programming tutor. Explain concepts simply with examples.';
  
  const result2 = await generateWithRAG(
    client,
    'granite4:3b',
    query,
    relevantDocs.map(d => d.text),
    { 
      systemPrompt,
      template: 'conversational'
    }
  );
  
  console.log('🤖 With System Prompt:');
  console.log(`"${systemPrompt}"`);
  console.log(`\nResponse: ${result2.response}`);

  // ═══════════════════════════════════════════════════════════════
  console.log('\n\n═══════════════════════════════════════════════════════');
  console.log('Example 3: Context Formatting Options');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('🔍 Including Scores and Metadata:\n');
  
  const result3 = await generateWithRAG(
    client,
    'granite4:3b',
    query,
    relevantDocs, // Pass full objects with scores
    { 
      context: {
        includeScores: true,
        includeMetadata: true
      }
    }
  );
  
  console.log('Generated Prompt Preview:');
  console.log(result3.prompt.substring(0, 300) + '...\n');
  console.log(`Response: ${result3.response.substring(0, 200)}...`);

  // ═══════════════════════════════════════════════════════════════
  console.log('\n\n═══════════════════════════════════════════════════════');
  console.log('Example 4: PromptManager (Advanced)');
  console.log('═══════════════════════════════════════════════════════\n');

  // Create a reusable prompt manager
  const promptMgr = createPromptManager({
    systemPrompt: 'You are an expert software engineer with 10 years of experience.',
    template: 'technical',
    variables: {
      company: 'TechCorp',
      version: 'v2.0'
    }
  });

  // Add custom context formatter
  promptMgr.addContextFormatter('numbered', (context, docs) => {
    return docs.map((doc, i) => `${i + 1}. ${doc.text}`).join('\n');
  });

  console.log('📦 PromptManager Configuration:');
  console.log(`  • System Prompt: "${promptMgr.systemPrompt.substring(0, 50)}..."`);
  console.log(`  • Template: ${promptMgr.template}`);
  console.log(`  • Variables: ${JSON.stringify(promptMgr.customVariables)}\n`);

  const result4 = await generateWithRAG(
    client,
    'granite4:3b',
    'How can Python help in my project?',
    relevantDocs,
    { 
      promptManager: promptMgr,
      context: {
        formatter: 'numbered'
      }
    }
  );
  
  console.log('Response:', result4.response);

  // ═══════════════════════════════════════════════════════════════
  console.log('\n\n═══════════════════════════════════════════════════════');
  console.log('Example 5: Custom Template Function');
  console.log('═══════════════════════════════════════════════════════\n');

  // Define custom template
  const customTemplate = (query, context) => `
╔══════════════════════════════════════╗
║        KNOWLEDGE BASE QUERY          ║
╚══════════════════════════════════════╝

📚 Available Information:
${context}

❓ User Question:
${query}

💡 Expert Analysis:
Provide a detailed, professional response based solely on the information above.
`;

  const result5 = await generateWithRAG(
    client,
    'granite4:3b',
    query,
    relevantDocs.map(d => d.text),
    { 
      template: customTemplate
    }
  );
  
  console.log('Custom Template Preview:');
  console.log(result5.prompt.substring(0, 250) + '...\n');
  console.log(`Response: ${result5.response.substring(0, 200)}...`);

  // ═══════════════════════════════════════════════════════════════
  console.log('\n\n═══════════════════════════════════════════════════════');
  console.log('Example 6: Clone and Modify');
  console.log('═══════════════════════════════════════════════════════\n');

  // Clone existing manager with modifications
  const promptMgr2 = promptMgr.clone({
    template: 'conversational',
    variables: { company: 'StartupCo' }
  });

  console.log('🔄 Cloned Manager:');
  console.log(`  Original template: ${promptMgr.template}`);
  console.log(`  New template: ${promptMgr2.template}`);
  console.log(`  Original variables:`, promptMgr.customVariables);
  console.log(`  New variables:`, promptMgr2.customVariables);

  // ═══════════════════════════════════════════════════════════════
  console.log('\n\n═══════════════════════════════════════════════════════');
  console.log('📊 SUMMARY');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('✨ Available Features:');
  console.log('  1. Built-in Templates:');
  console.log('     • default, conversational, technical, academic');
  console.log('     • code, concise, detailed, qa, instructional, creative');
  console.log('');
  console.log('  2. System Prompts:');
  console.log('     • Global instructions for all responses');
  console.log('     • Role definition and constraints');
  console.log('');
  console.log('  3. Context Formatting:');
  console.log('     • Include/exclude scores and metadata');
  console.log('     • Custom formatters');
  console.log('     • Length limits');
  console.log('');
  console.log('  4. PromptManager:');
  console.log('     • Reusable configurations');
  console.log('     • Variable interpolation');
  console.log('     • Cloning and modification');
  console.log('');
  console.log('  5. Custom Templates:');
  console.log('     • Full control over prompt structure');
  console.log('     • Function-based templates');
  console.log('');
  console.log('💡 Use Cases:');
  console.log('  • Different response styles per feature');
  console.log('  • Role-based assistants (tutor, expert, etc.)');
  console.log('  • Multi-tenant applications');
  console.log('  • A/B testing prompt effectiveness');
  console.log('  • Domain-specific formatting');
  console.log('');
  console.log('🎯 No other RAG library has this level of prompt flexibility!\n');
}

main().catch(console.error);
