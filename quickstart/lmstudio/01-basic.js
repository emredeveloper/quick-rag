/**
 * Quick RAG - LM Studio Basic Usage
 * 
 * Shows how to use quick-rag with LM Studio instead of Ollama
 * 
 * Prerequisites:
 * 1. Download and install LM Studio from https://lmstudio.ai/
 * 2. Download a model (e.g., Llama 3.2, Mistral, Phi-3)
 * 3. Start LM Studio's local server:
 *    - Click "Local Server" tab
 *    - Select your model
 *    - Click "Start Server" (default: http://localhost:1234)
 */

import { 
  LMStudioRAGClient,
  createLMStudioRAGEmbedding,
  InMemoryVectorStore, 
  Retriever,
  generateWithRAG
} from 'quick-rag';

async function main() {
  console.log('🚀 Quick RAG - LM Studio Basic Usage\n');
  console.log('📋 This example shows the same functionality as 01-basic-usage.js');
  console.log('   but using LM Studio instead of Ollama\n');

  try {
    // Initialize LM Studio client
    // Default base URL is http://localhost:1234/v1
    const client = new LMStudioRAGClient();
    console.log('✅ Connected to LM Studio at http://localhost:1234\n');

    // Create embedding function using LM Studio's embedding model
    // You can use any embedding model loaded in LM Studio:
    // - text-embedding-nomic-embed-text-v1.5
    // - text-embedding-embeddinggemma-300m
    // - text-embedding-qwen3-embedding-0.6b
    const embed = createLMStudioRAGEmbedding(client, 'text-embedding-nomic-embed-text-v1.5');

    // Create vector store and retriever
    const vectorStore = new InMemoryVectorStore(embed);
    const retriever = new Retriever(vectorStore);

    // Add documents to the knowledge base
    console.log('📚 Adding documents to knowledge base...\n');
    
    const documents = [
      {
        text: "The sky appears blue because of a phenomenon called Rayleigh scattering. Sunlight contains all colors of the rainbow, but blue light has a shorter wavelength and gets scattered more easily by air molecules.",
        meta: { topic: "science", subject: "physics" }
      },
      {
        text: "The first successful moon landing occurred on July 20, 1969, when Apollo 11 astronauts Neil Armstrong and Buzz Aldrin became the first humans to walk on the Moon's surface.",
        meta: { topic: "history", subject: "space exploration" }
      },
      {
        text: "JavaScript is a high-level, interpreted programming language. It was originally created to make web pages interactive, but now it's used for servers (Node.js), mobile apps, and even desktop applications.",
        meta: { topic: "technology", subject: "programming" }
      }
    ];

    await vectorStore.addDocuments(documents);
    console.log(`✅ Added ${documents.length} documents\n`);

    // Query 1: Basic RAG query
    console.log('═'.repeat(70));
    console.log('🔍 Example 1: Basic RAG Query');
    console.log('═'.repeat(70) + '\n');

    const query1 = 'Why is the sky blue?';
    console.log(`❓ Question: ${query1}\n`);

    // Retrieve relevant documents
    const relevantDocs = await retriever.getRelevant(query1, 2);
    console.log(`📚 Retrieved ${relevantDocs.length} relevant document(s)\n`);

    relevantDocs.forEach((doc, i) => {
      console.log(`   ${i + 1}. Score: ${doc.score.toFixed(3)} | Topic: ${doc.meta.topic}`);
      console.log(`      "${doc.text.substring(0, 80)}..."\n`);
    });

    // Generate answer using RAG
    // Note: You need to specify the model name that's loaded in LM Studio
    // Common model names: 'llama-3.2-3b', 'mistral-7b', 'phi-3-mini'
    // Or just use the default 'lm-studio-model'
    const response1 = await generateWithRAG(
      client,
      'qwen/qwen3-vl-4b', // LM Studio will use whichever model is loaded
      query1,
      relevantDocs.map(d => d.text),
      {
        maxTokens: 200,
        temperature: 0.7
      }
    );

    console.log('🤖 LM Studio Answer:');
    console.log('-'.repeat(70));
    console.log(response1.response);
    console.log('-'.repeat(70) + '\n');

    // Query 2: Using different prompt template
    console.log('═'.repeat(70));
    console.log('🔍 Example 2: Custom Prompt Template');
    console.log('═'.repeat(70) + '\n');

    const query2 = 'Tell me about the moon landing';
    console.log(`❓ Question: ${query2}\n`);

    const relevantDocs2 = await retriever.getRelevant(query2, 1);

    const response2 = await generateWithRAG(
      client,
      'google/gemma-3-4b',
      query2,
      relevantDocs2.map(d => d.text),
      {
        systemPrompt: 'You are a history teacher. Provide concise, educational answers.',
        template: 'concise',
        maxTokens: 150,
        temperature: 0.7
      }
    );

    console.log('🤖 LM Studio Answer (Concise):');
    console.log('-'.repeat(70));
    console.log(response2.response);
    console.log('-'.repeat(70) + '\n');

    // Query 3: Metadata filtering
    console.log('═'.repeat(70));
    console.log('🔍 Example 3: Metadata Filtering');
    console.log('═'.repeat(70) + '\n');

    const query3 = 'Explain programming languages';
    console.log(`❓ Question: ${query3}\n`);

    const relevantDocs3 = await retriever.getRelevant(query3, 5, {
      filter: (meta) => meta.topic === 'technology'
    });

    console.log(`📚 Retrieved ${relevantDocs3.length} document(s) with filter: topic === 'technology'\n`);

    if (relevantDocs3.length === 0) {
      console.log('⚠️  No documents found matching the filter. Skipping query.\n');
    } else {
      const response3 = await generateWithRAG(
        client,
        'google/gemma-3n-e4b',
        query3,
        relevantDocs3.map(d => d.text),
        {
          template: 'detailed',
          maxTokens: 300,
          temperature: 0.7
        }
      );

      console.log('🤖 LM Studio Answer (Filtered):');
      console.log('-'.repeat(70));
      console.log(response3.response);
      console.log('-'.repeat(70) + '\n');
    }

    console.log('✅ LM Studio basic usage completed successfully!\n');
    
    console.log('💡 Key Differences from Ollama:');
    console.log('   • Default URL: http://localhost:1234 (vs Ollama\'s :11434)');
    console.log('   • Model name: Use "lm-studio-model" or your specific model name');
    console.log('   • LM Studio has a GUI - easier to manage models');
    console.log('   • Both use OpenAI-compatible API format\n');

    console.log('🔧 Configuration Options:');
    console.log('   const client = new LMStudioRAGClient({');
    console.log('     baseURL: "http://localhost:1234/v1", // Custom port');
    console.log('     apiKey: "your-key" // If using API key');
    console.log('   });');
    console.log('   ');
    console.log('   // Specify embedding model (check available models in LM Studio)');
    console.log('   const embed = createLMStudioRAGEmbedding(');
    console.log('     client, ');
    console.log('     "text-embedding-nomic-embed-text-v1.5"');
    console.log('   );\n');

  } catch (error) {
    if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed')) {
      console.error('\n❌ Error: Cannot connect to LM Studio\n');
      console.error('📋 Troubleshooting:');
      console.error('   1. Make sure LM Studio is running');
      console.error('   2. Go to "Local Server" tab in LM Studio');
      console.error('   3. Load a model (e.g., Llama 3.2, Mistral)');
      console.error('   4. Click "Start Server"');
      console.error('   5. Verify server is running at http://localhost:1234');
      console.error('\n   Download LM Studio: https://lmstudio.ai/\n');
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
