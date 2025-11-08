/**
 * Quick RAG - LM Studio Streaming
 * 
 * Shows how to stream responses from LM Studio for better UX
 * 
 * Prerequisites:
 * - LM Studio running with local server enabled (http://localhost:1234)
 * - A model loaded in LM Studio
 */

import { 
  LMStudioRAGClient,
  createLMStudioRAGEmbedding,
  InMemoryVectorStore, 
  Retriever,
  generateWithRAG
} from 'quick-rag';

async function main() {
  console.log('🚀 Quick RAG - LM Studio Streaming\n');

  try {
    // Initialize
    const client = new LMStudioRAGClient();
    const embed = createLMStudioRAGEmbedding(client, 'text-embedding-nomic-embed-text-v1.5');
    const vectorStore = new InMemoryVectorStore(embed);
    const retriever = new Retriever(vectorStore);

    // Add knowledge base
    console.log('📚 Building knowledge base...\n');
    
    await vectorStore.addDocuments([
      {
        text: "Artificial Intelligence (AI) is the simulation of human intelligence by machines. Modern AI includes machine learning, where systems learn from data, and deep learning, which uses neural networks. AI applications range from voice assistants to autonomous vehicles.",
        meta: { category: "AI" }
      },
      {
        text: "Large Language Models (LLMs) are AI systems trained on vast amounts of text data. They can understand and generate human-like text. Examples include GPT-4, Claude, and Llama. LLMs are used for chatbots, content generation, and code assistance.",
        meta: { category: "AI" }
      },
      {
        text: "Retrieval Augmented Generation (RAG) combines language models with information retrieval. Instead of relying only on training data, RAG systems can access external documents in real-time. This reduces hallucinations and keeps responses up-to-date.",
        meta: { category: "AI" }
      }
    ]);

    console.log('✅ Knowledge base ready\n');

    // Example 1: Non-streaming (for comparison)
    console.log('═'.repeat(70));
    console.log('🔍 Example 1: Regular Response (Non-Streaming)');
    console.log('═'.repeat(70) + '\n');

    const query1 = 'What is RAG and why is it useful?';
    console.log(`❓ Question: ${query1}\n`);

    const docs1 = await retriever.getRelevant(query1, 2);
    console.log(`📚 Found ${docs1.length} relevant document(s)\n`);

    console.log('⏳ Waiting for complete response...\n');
    const startTime1 = Date.now();

    const response1 = await generateWithRAG(
      client,
      'qwen/qwen3-4b-2507',
      query1,
      docs1.map(d => d.text),
      {
        systemPrompt: 'You are an AI expert. Explain concepts clearly and concisely.'
      }
    );

    const elapsed1 = Date.now() - startTime1;
    console.log('🤖 Complete Answer:');
    console.log('-'.repeat(70));
    console.log(response1.response);
    console.log('-'.repeat(70));
    console.log(`⏱️  Time: ${(elapsed1 / 1000).toFixed(2)}s\n`);

    // Example 2: Streaming response
    console.log('═'.repeat(70));
    console.log('🔍 Example 2: Streaming Response (Better UX)');
    console.log('═'.repeat(70) + '\n');

    const query2 = 'Explain how Large Language Models work';
    console.log(`❓ Question: ${query2}\n`);

    const docs2 = await retriever.getRelevant(query2, 2);
    console.log(`📚 Found ${docs2.length} relevant document(s)\n`);

    console.log('🌊 Streaming response:\n');
    console.log('-'.repeat(70));

    const startTime2 = Date.now();

    // Use LM Studio client's streaming capability
    const stream = await client.chat({
      model: 'qwen/qwen3-vl-4b',
      messages: [
        {
          role: 'system',
          content: 'You are an AI expert. Explain concepts clearly using the provided context.'
        },
        {
          role: 'user',
          content: `Context:\n${docs2.map(d => d.text).join('\n\n')}\n\nQuestion: ${query2}`
        }
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 500
    });

    let fullResponse = '';
    
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        process.stdout.write(content);
        fullResponse += content;
      }
    }

    const elapsed2 = Date.now() - startTime2;
    console.log('\n' + '-'.repeat(70));
    console.log(`⏱️  Time: ${(elapsed2 / 1000).toFixed(2)}s\n`);

    // Example 3: Streaming with progress indicators
    console.log('═'.repeat(70));
    console.log('🔍 Example 3: Streaming with Token Count');
    console.log('═'.repeat(70) + '\n');

    const query3 = 'What are the main applications of AI?';
    console.log(`❓ Question: ${query3}\n`);

    const docs3 = await retriever.getRelevant(query3, 2);

    console.log('🌊 Streaming with metrics:\n');
    console.log('-'.repeat(70) + '\n');

    const startTime3 = Date.now();

    const stream3 = await client.chat({
      model: 'google/gemma-3-4b',
      messages: [
        {
          role: 'system',
          content: 'You are an AI expert. Provide practical examples and applications.'
        },
        {
          role: 'user',
          content: `Context:\n${docs3.map(d => d.text).join('\n\n')}\n\nQuestion: ${query3}`
        }
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 400
    });

    let tokenCount = 0;
    let responseText = '';

    for await (const chunk of stream3) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        process.stdout.write(content);
        responseText += content;
        tokenCount++;
      }
    }

    const elapsed3 = Date.now() - startTime3;
    const tokensPerSecond = (tokenCount / (elapsed3 / 1000)).toFixed(1);

    console.log('\n\n' + '-'.repeat(70));
    console.log(`📊 Metrics:`);
    console.log(`   • Tokens: ${tokenCount}`);
    console.log(`   • Time: ${(elapsed3 / 1000).toFixed(2)}s`);
    console.log(`   • Speed: ${tokensPerSecond} tokens/second\n`);

    console.log('✅ LM Studio streaming completed!\n');

    console.log('💡 Streaming Benefits:');
    console.log('   • Immediate feedback - users see response forming');
    console.log('   • Better perceived performance');
    console.log('   • Can cancel long responses early');
    console.log('   • More engaging user experience\n');

    console.log('🔧 Streaming vs Non-Streaming:');
    console.log('   • Non-streaming: Wait for full response, then display');
    console.log('   • Streaming: Display tokens as they arrive');
    console.log('   • Both methods produce the same final result\n');

  } catch (error) {
    if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed')) {
      console.error('\n❌ Error: Cannot connect to LM Studio');
      console.error('\n📋 Make sure:');
      console.error('   1. LM Studio is running');
      console.error('   2. Local server is started');
      console.error('   3. A model is loaded\n');
    } else {
      console.error('❌ Error:', error.message);
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
