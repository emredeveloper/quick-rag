/**
 * Quick RAG v2.0.0 - Multi-Provider Support
 * 
 * Demonstrates: Using both Ollama and LM Studio
 * Run: node v2-auto-detection.js
 */

import {
  OllamaRAGClient,
  LMStudioRAGClient,
  createOllamaRAGEmbedding,
  createLMStudioRAGEmbedding,
  InMemoryVectorStore,
  Retriever,
  generateWithRAG
} from 'quick-rag';

// Example 1: Using Ollama
async function exampleOllama() {
  const client = new OllamaRAGClient();
  const embed = createOllamaRAGEmbedding(client, 'embeddinggemma:latest');
  const store = new InMemoryVectorStore(embed);
  const retriever = new Retriever(store);

  await store.addDocuments([
    { text: 'Quick RAG supports Ollama for local LLM hosting.' }
  ]);

  const query = 'What is Quick RAG?';
  const results = await retriever.getRelevant(query, 1);
  const answer = await generateWithRAG(client, 'granite4:3b', query, results);
  
  console.log('Ollama:', typeof answer === 'string' ? answer : answer.response);
}

// Example 2: Using LM Studio
async function exampleLMStudio() {
  const client = new LMStudioRAGClient();
  const embed = createLMStudioRAGEmbedding(client, 'text-embedding-embeddinggemma-300m');
  const store = new InMemoryVectorStore(embed);
  const retriever = new Retriever(store);

  await store.addDocuments([
    { text: 'Quick RAG supports LM Studio for local LLM hosting.' }
  ]);

  const query = 'What is Quick RAG?';
  const results = await retriever.getRelevant(query, 1);
  const answer = await generateWithRAG(client, 'qwen/qwen3-4b-2507', query, results);
  
  console.log('LM Studio:', typeof answer === 'string' ? answer : answer.response);
}

// Try Ollama first, fallback to LM Studio
async function main() {
  try {
    await exampleOllama();
  } catch {
    try {
      await exampleLMStudio();
    } catch (err) {
      console.error('Neither Ollama nor LM Studio is available');
    }
  }
}

main().catch(console.error);
