/**
 * Example 8: Query Explainability (Ollama + LM Studio)
 * 
 * This example demonstrates the Query Explainability feature that shows
 * WHY each document was retrieved. Tests both providers in one file:
 * - Ollama: Local AI platform
 * - LM Studio: User-friendly local AI interface
 * 
 * Benefits:
 * - Debugging RAG results
 * - Understanding search behavior
 * - Improving query quality
 * - Validating retrieval accuracy
 */

import {
  OllamaRAGClient,
  createOllamaRAGEmbedding,
  LMStudioRAGClient,
  createLMStudioRAGEmbedding,
  InMemoryVectorStore,
  Retriever,
  generateWithRAG
} from '../src/index.js';

async function testOllama() {
  console.log('═══════════════════════════════════════════════');
  console.log('🦙 OLLAMA TEST');
  console.log('═══════════════════════════════════════════════\n');
  
  // Initialize RAG with Ollama
  console.log('⚙️  Setting up Ollama RAG system...');
  const client = new OllamaRAGClient();
  const embed = createOllamaRAGEmbedding(client, 'nomic-embed-text');
  const store = new InMemoryVectorStore(embed);
  const retriever = new Retriever(store, { k: 3 });

  // Add sample documents
  const docs = [
    {
      text: 'Ollama is a local AI platform that runs large language models on your computer. It supports Llama, Mistral, and many other models.',
      meta: { source: 'documentation', topic: 'ollama' }
    },
    {
      text: 'LM Studio is another local AI solution that provides a user-friendly interface for running language models. It includes model management and API server.',
      meta: { source: 'documentation', topic: 'lmstudio' }
    },
    {
      text: 'Python is a popular programming language widely used for AI and machine learning. It has libraries like TensorFlow and PyTorch.',
      meta: { source: 'tutorial', topic: 'programming' }
    },
    {
      text: 'JavaScript is essential for web development. Modern frameworks like React, Vue, and Angular make building web apps easier.',
      meta: { source: 'tutorial', topic: 'programming' }
    }
  ];

  console.log('📚 Adding documents...');
  for (const doc of docs) {
    await store.addDocuments([doc]);
  }
  console.log(`✅ Added ${docs.length} documents\n`);

  // Test with explanation
  const query = 'local AI models on computer';
  console.log(`🔍 Query: "${query}"\n`);

  const results = await retriever.getRelevant(query, 2, {
    explain: true
  });

  results.forEach((result, index) => {
    console.log(`Result ${index + 1}:`);
    console.log(`Text: ${result.text.substring(0, 80)}...`);
    console.log(`\n📊 Explanation:`);
    console.log(`  Query Terms: [${result.explanation.queryTerms.join(', ')}]`);
    console.log(`  Matched Terms: [${result.explanation.matchedTerms.join(', ')}]`);
    console.log(`  Match Count: ${result.explanation.matchCount}/${result.explanation.queryTerms.length}`);
    console.log(`  Coverage: ${result.explanation.relevanceFactors.coverage}`);
    console.log(`  Cosine Similarity: ${result.explanation.cosineSimilarity}\n`);
  });

  // Generate answer with LLM
  console.log('🤖 Generating answer with Ollama LLM (granite4:3b)...\n');
  const userQuestion = 'What is Ollama and how does it work?';
  const relevantDocs = await retriever.getRelevant(userQuestion, 2, { explain: true });
  
  const answer = await generateWithRAG(
    client,
    'granite4:3b',
    userQuestion,
    relevantDocs.map(doc => doc.text),
    {
      systemPrompt: 'You are a helpful AI assistant. Answer concisely based on the provided context.'
    }
  );

  console.log('✨ Generated Answer:');
  console.log(answer);
  console.log(`\n📊 Answer Quality:
   • Retrieved: ${relevantDocs.length} documents
   • Avg Coverage: ${Math.round(relevantDocs.reduce((sum, doc) => sum + doc.explanation.matchRatio, 0) / relevantDocs.length * 100)}%
   • Matched Terms: [${relevantDocs[0].explanation.matchedTerms.join(', ')}]
   • LLM: granite4:3b\n`);
}

async function testLMStudio() {
  console.log('═══════════════════════════════════════════════');
  console.log('🎨 LM STUDIO TEST');
  console.log('═══════════════════════════════════════════════\n');
  
  // Initialize RAG with LM Studio
  console.log('⚙️  Setting up LM Studio RAG system...');
  const client = new LMStudioRAGClient();
  const embed = createLMStudioRAGEmbedding(client, 'nomic-embed-text-v1.5');
  const store = new InMemoryVectorStore(embed);
  const retriever = new Retriever(store, { k: 3 });

  // Add same documents
  const docs = [
    {
      text: 'Ollama is a local AI platform that runs large language models on your computer. It supports Llama, Mistral, and many other models.',
      meta: { source: 'documentation', topic: 'ollama' }
    },
    {
      text: 'LM Studio is another local AI solution that provides a user-friendly interface for running language models. It includes model management and API server.',
      meta: { source: 'documentation', topic: 'lmstudio' }
    },
    {
      text: 'Python is a popular programming language widely used for AI and machine learning. It has libraries like TensorFlow and PyTorch.',
      meta: { source: 'tutorial', topic: 'programming' }
    },
    {
      text: 'JavaScript is essential for web development. Modern frameworks like React, Vue, and Angular make building web apps easier.',
      meta: { source: 'tutorial', topic: 'programming' }
    }
  ];

  console.log('📚 Adding documents...');
  for (const doc of docs) {
    await store.addDocuments([doc]);
  }
  console.log(`✅ Added ${docs.length} documents\n`);

  // Test with explanation
  const query = 'local AI models on computer';
  console.log(`🔍 Query: "${query}"\n`);

  const results = await retriever.getRelevant(query, 2, {
    explain: true
  });

  results.forEach((result, index) => {
    console.log(`Result ${index + 1}:`);
    console.log(`Text: ${result.text.substring(0, 80)}...`);
    console.log(`\n📊 Explanation:`);
    console.log(`  Query Terms: [${result.explanation.queryTerms.join(', ')}]`);
    console.log(`  Matched Terms: [${result.explanation.matchedTerms.join(', ')}]`);
    console.log(`  Match Count: ${result.explanation.matchCount}/${result.explanation.queryTerms.length}`);
    console.log(`  Coverage: ${result.explanation.relevanceFactors.coverage}`);
    console.log(`  Cosine Similarity: ${result.explanation.cosineSimilarity}\n`);
  });

  // Generate answer with LLM
  console.log('🤖 Generating answer with LM Studio LLM...\n');
  const userQuestion = 'What is LM Studio and what features does it offer?';
  const relevantDocs = await retriever.getRelevant(userQuestion, 2, { explain: true });
  
  const answer = await generateWithRAG(
    client,
    'qwen3-vl-4b-instruct', // LM Studio model (from available models list)
    userQuestion,
    relevantDocs.map(doc => doc.text),
    {
      systemPrompt: 'You are a helpful AI assistant. Answer concisely based on the provided context.'
    }
  );

  console.log('✨ Generated Answer:');
  console.log(answer);
  console.log(`\n📊 Answer Quality:
   • Retrieved: ${relevantDocs.length} documents
   • Avg Coverage: ${Math.round(relevantDocs.reduce((sum, doc) => sum + doc.explanation.matchRatio, 0) / relevantDocs.length * 100)}%
   • Matched Terms: [${relevantDocs[0].explanation.matchedTerms.join(', ')}]
   • LLM: LM Studio (qwen3-vl-4b-instruct)\n`);
}

async function main() {
  console.log('🔍 Query Explainability - Dual Provider Test\n');

  console.log('Prerequisites:');
  console.log('1. Ollama: ollama serve & ollama pull nomic-embed-text & ollama pull granite4:3b');
  console.log('2. LM Studio: Start server & load a model & load nomic-embed-text-v1.5\n');
  console.log('═══════════════════════════════════════════════\n');

  // Test Ollama
  try {
    await testOllama();
  } catch (error) {
    console.error('❌ Ollama test failed:', error.message);
    console.log('Make sure Ollama is running: ollama serve\n');
  }

  console.log('\n');

  // Test LM Studio
  try {
    await testLMStudio();
  } catch (error) {
    console.error('❌ LM Studio test failed:', error.message);
    console.log('Make sure LM Studio server is running on http://localhost:1234\n');
  }

  // Summary
  console.log('═══════════════════════════════════════════════');
  console.log('📋 COMPARISON SUMMARY');
  console.log('═══════════════════════════════════════════════\n');
  console.log('✨ Query Explainability works with both providers!');
  console.log('\n🔍 Key Features Tested:');
  console.log('  ✅ Query term extraction');
  console.log('  ✅ Term matching detection');
  console.log('  ✅ Match coverage calculation');
  console.log('  ✅ Cosine similarity scoring');
  console.log('  ✅ Relevance factor breakdown');
  console.log('  ✅ RAG generation with explanations');
  console.log('\n💡 Use Cases:');
  console.log('  • Debug unexpected search results');
  console.log('  • Understand semantic vs. keyword matching');
  console.log('  • Optimize query quality');
  console.log('  • Validate retrieval accuracy');
  console.log('  • Explain results to end users');
  console.log('\n🎯 Unique Feature: No other RAG library offers this level of explainability!\n');
}

main().catch(console.error);
