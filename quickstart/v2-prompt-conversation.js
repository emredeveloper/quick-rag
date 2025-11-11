/**
 * Quick RAG v2.0.0 - Prompt Management
 * 
 * Demonstrates: Dynamic Prompts with built-in templates
 * Run: node v2-prompt-conversation.js
 */

import {
  OllamaRAGClient,
  createOllamaRAGEmbedding,
  InMemoryVectorStore,
  Retriever,
  generateWithRAG,
  PromptManager
} from 'quick-rag';

const client = new OllamaRAGClient();
const embed = createOllamaRAGEmbedding(client, 'embeddinggemma:latest');
const store = new InMemoryVectorStore(embed);
const retriever = new Retriever(store);

const docs = [
  { id: '1', text: 'React is a JavaScript library for building user interfaces.' },
  { id: '2', text: 'Ollama provides local LLM hosting.' },
  { id: '3', text: 'RAG combines retrieval with generation.' }
];

async function main() {
  await store.addDocuments(docs);

  // Feature 1: Built-in prompt templates
  console.log('🎨 Prompt Templates:\n');
  const templates = ['default', 'conversational', 'technical'];
  
  for (const template of templates) {
    const query = 'What is React?';
    const results = await retriever.getRelevant(query, 1);
    const answer = await generateWithRAG(client, 'granite4:3b', query, results, { template });
    const response = typeof answer === 'string' ? answer : answer.response;
    
    console.log(`${template}: ${response.substring(0, 80)}...\n`);
  }

  // Feature 2: Custom Prompt Manager
  console.log('🎯 Custom Prompt Manager:\n');
  const customPM = new PromptManager({
    systemPrompt: 'You are a helpful tutor.',
    template: 'instructional'
  });
  
  const query = 'How does RAG work?';
  const results = await retriever.getRelevant(query, 1);
  const answer = await generateWithRAG(client, 'granite4:3b', query, results, { promptManager: customPM });
  const response = typeof answer === 'string' ? answer : answer.response;
  console.log(`Custom: ${response.substring(0, 80)}...`);
}

main().catch(console.error);
