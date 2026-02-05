/**
 * Example 12: Conversation History & Export Features
 * 
 * WHAT DOES THIS EXAMPLE DO?
 * ===========================
 * This example demonstrates the new conversation history and export features:
 * 
 * 1. 💬 Conversation History
 *    → Track multiple query-response pairs
 *    → Store metadata (timestamp, topK, retrieved docs)
 *    → Manage conversation sessions
 * 
 * 2. 💾 Export Functionality
 *    → Export conversations to JSON
 *    → Include all metadata and context
 *    → Save conversation history
 * 
 * 3. 📚 Document Management
 *    → Add, update, delete documents
 *    → Track document changes
 *    → Manage document metadata
 * 
 * 4. ⚙️ Settings Management
 *    → Change model on the fly
 *    → Adjust topK dynamically
 *    → Test different configurations
 * 
 * 5. 🔄 Multi-Query Session
 *    → Ask multiple questions in sequence
 *    → Build conversation context
 *    → Export complete session
 * 
 * 6. 🎨 Multi-Provider Support
 *    → Works with both Ollama 🦙 and LM Studio 🎨
 *    → Switch providers with USE_LMSTUDIO flag
 *    → Automatic model detection for LM Studio
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

import fs from 'fs/promises';
import path from 'path';

// ═══════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════
// Auto-detect provider or manually set:
// - Set to true to force LM Studio
// - Set to false to force Ollama  
// - Set to 'auto' to auto-detect (tries LM Studio first, falls back to Ollama)
const USE_LMSTUDIO = process.env.USE_LMSTUDIO === 'true' ? true : 
                     process.env.USE_LMSTUDIO === 'false' ? false : 
                     'auto'; // Auto-detect by default

// ═══════════════════════════════════════════════════════════════════
// CONVERSATION HISTORY MANAGER
// ═══════════════════════════════════════════════════════════════════

class ConversationHistory {
  constructor() {
    this.messages = [];
    this.sessionId = `session-${Date.now()}`;
    this.createdAt = new Date().toISOString();
  }

  /**
   * Add a message to conversation history
   */
  addMessage(query, response, retrievedDocs = [], metadata = {}) {
    const message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      query,
      response,
      retrievedDocs: retrievedDocs.map(doc => ({
        id: doc.id,
        text: doc.text.substring(0, 100) + '...', // Truncate for display
        score: doc.score,
        meta: doc.meta
      })),
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        retrievedCount: retrievedDocs.length
      }
    };

    this.messages.push(message);
    return message;
  }

  /**
   * Get all messages
   */
  getMessages() {
    return this.messages;
  }

  /**
   * Get message count
   */
  getMessageCount() {
    return this.messages.length;
  }

  /**
   * Clear conversation history
   */
  clear() {
    this.messages = [];
  }

  /**
   * Export conversation to JSON
   */
  async exportToJSON(filename = null) {
    const exportData = {
      sessionId: this.sessionId,
      createdAt: this.createdAt,
      exportedAt: new Date().toISOString(),
      messageCount: this.messages.length,
      messages: this.messages
    };

    const exportFilename = filename || `conversation-${this.sessionId}.json`;
    const exportPath = path.join(process.cwd(), 'exports', exportFilename);

    // Create exports directory if it doesn't exist
    try {
      await fs.mkdir(path.dirname(exportPath), { recursive: true });
    } catch (e) {
      // Directory already exists
    }

    await fs.writeFile(exportPath, JSON.stringify(exportData, null, 2), 'utf-8');
    return exportPath;
  }

  /**
   * Get conversation summary
   */
  getSummary() {
    return {
      sessionId: this.sessionId,
      messageCount: this.messages.length,
      createdAt: this.createdAt,
      lastMessageAt: this.messages.length > 0 
        ? this.messages[this.messages.length - 1].metadata.timestamp 
        : null,
      totalRetrievedDocs: this.messages.reduce((sum, msg) => sum + msg.retrievedDocs.length, 0),
      averageRetrievedDocs: this.messages.length > 0
        ? (this.messages.reduce((sum, msg) => sum + msg.retrievedDocs.length, 0) / this.messages.length).toFixed(2)
        : 0
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// SETTINGS MANAGER
// ═══════════════════════════════════════════════════════════════════

class SettingsManager {
  constructor(useLMStudio = false) {
    this.useLMStudio = useLMStudio;
    if (useLMStudio) {
      this.settings = {
        model: 'google/gemma-3-4b', // LM Studio model
        embeddingModel: 'text-embedding-qwen3-embedding-0.6b', // LM Studio embedding
        topK: 2,
        enableStreaming: false,
        enableExplainability: false
      };
    } else {
      this.settings = {
        model: 'granite4:3b',
        embeddingModel: 'qwen3-embedding:0.6b',
        topK: 2,
        enableStreaming: false,
        enableExplainability: false
      };
    }
  }

  /**
   * Update settings
   */
  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    return this.settings;
  }

  /**
   * Get settings
   */
  getSettings() {
    return { ...this.settings };
  }

  /**
   * Reset to defaults
   */
  reset() {
    if (this.useLMStudio) {
      this.settings = {
        model: 'google/gemma-3-4b',
        embeddingModel: 'text-embedding-qwen3-embedding-0.6b',
        topK: 2,
        enableStreaming: false,
        enableExplainability: false
      };
    } else {
      this.settings = {
        model: 'granite4:3b',
        embeddingModel: 'qwen3-embedding:0.6b',
        topK: 2,
        enableStreaming: false,
        enableExplainability: false
      };
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// MAIN FUNCTION
// ═══════════════════════════════════════════════════════════════════

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('💬 CONVERSATION HISTORY & EXPORT FEATURES DEMO');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // ─────────────────────────────────────────────────────────────────
    // STEP 1: Initialize RAG System (with auto-detection)
    // ─────────────────────────────────────────────────────────────────
    console.log('📦 STEP 1: Initializing RAG System\n');
    
    let useLMStudio = USE_LMSTUDIO;
    let client;
    let embed;
    let modelName;

    // Auto-detect provider if needed
    if (USE_LMSTUDIO === 'auto') {
      console.log('🔍 Auto-detecting provider...\n');
      console.log('   Trying LM Studio first...\n');
      
      // Try LM Studio first
      try {
        const testClient = new LMStudioRAGClient();
        const models = await testClient.listLoaded();
        if (models && models.length > 0) {
          useLMStudio = true;
          client = testClient;
          console.log('   ✅ LM Studio detected and available!');
          console.log(`   📦 Found ${models.length} loaded model(s)\n`);
        } else {
          throw new Error('No models loaded in LM Studio');
        }
      } catch (err) {
        console.log('   ⚠️  LM Studio not available');
        console.log(`   📝 Reason: ${err.message}`);
        console.log('   🔄 Trying Ollama...\n');
        
        useLMStudio = false;
        try {
          client = new OllamaRAGClient();
          // Test Ollama connection
          await client.list();
          console.log('   ✅ Ollama detected and available!\n');
        } catch (ollamaErr) {
          console.error('\n❌ ERROR: Neither LM Studio nor Ollama is available!');
          console.error('\n💡 SOLUTIONS:');
          console.error('\n   For LM Studio:');
          console.error('   1. Open LM Studio application');
          console.error('   2. Load a model (e.g., google/gemma-3-4b)');
          console.error('   3. Load an embedding model (e.g., text-embedding-qwen3-embedding-0.6b)');
          console.error('   4. Enable local server: Settings → Local Server → Start Server');
          console.error('   5. Make sure server is running on http://localhost:1234\n');
          console.error('   For Ollama:');
          console.error('   1. Install Ollama: https://ollama.ai');
          console.error('   2. Run: ollama serve');
          console.error('   3. Install models: ollama pull granite4:3b && ollama pull qwen3-embedding:0.6b\n');
          console.error('   Or force a provider:');
          console.error('   • USE_LMSTUDIO=true node example/12-conversation-history-and-export.js');
          console.error('   • USE_LMSTUDIO=false node example/12-conversation-history-and-export.js\n');
          return;
        }
      }
    } else {
      useLMStudio = USE_LMSTUDIO === true;
      if (useLMStudio) {
        console.log('🎨 LM Studio mode (forced)\n');
      } else {
        console.log('🦙 Ollama mode (forced)\n');
      }
    }

    const settings = new SettingsManager(useLMStudio);

    if (useLMStudio) {
      console.log('🎨 Using LM Studio\n');
      
      // Use predefined model from settings
      modelName = settings.getSettings().model;
      const embeddingModel = settings.getSettings().embeddingModel;
      
      console.log(`✅ Using LM Studio model: ${modelName}`);
      console.log(`✅ Using embedding model: ${embeddingModel}`);
      console.log(`💡 Make sure these models are loaded in LM Studio:`);
      console.log(`   • LLM Model: ${modelName}`);
      console.log(`   • Embedding Model: ${embeddingModel}`);
      console.log(`💡 Enable local server: Settings → Local Server → Start Server\n`);
      
      embed = createLMStudioRAGEmbedding(client, embeddingModel);
    } else {
      console.log('🦙 Using Ollama\n');
      if (!client) {
        client = new OllamaRAGClient();
      }
      modelName = settings.getSettings().model;
      embed = createOllamaRAGEmbedding(client, settings.getSettings().embeddingModel);
    }

    const currentSettings = settings.getSettings();
    const store = new InMemoryVectorStore(embed);
    const retriever = new Retriever(store, { k: currentSettings.topK });

    console.log(`✅ Client initialized`);
    console.log(`✅ Provider: ${useLMStudio ? 'LM Studio 🎨' : 'Ollama 🦙'}`);
    console.log(`✅ Embedding model: ${currentSettings.embeddingModel}`);
    console.log(`✅ LLM model: ${currentSettings.model || modelName}`);
    console.log(`✅ TopK: ${currentSettings.topK}\n`);

    // ─────────────────────────────────────────────────────────────────
    // STEP 2: Add Documents with Metadata
    // ─────────────────────────────────────────────────────────────────
    console.log('📚 STEP 2: Adding Documents\n');

    const documents = [
      {
        id: 'doc-1',
        text: 'React is a JavaScript library for building user interfaces. It was created by Facebook in 2013.',
        meta: {
          category: 'framework',
          language: 'javascript',
          difficulty: 'beginner',
          year: 2013,
          source: 'official'
        }
      },
      {
        id: 'doc-2',
        text: 'Ollama provides local LLM hosting capabilities. You can run large language models on your own machine.',
        meta: {
          category: 'tool',
          language: 'python',
          difficulty: 'intermediate',
          year: 2023,
          source: 'official'
        }
      },
      {
        id: 'doc-3',
        text: 'RAG (Retrieval-Augmented Generation) combines retrieval with AI generation to provide accurate answers.',
        meta: {
          category: 'technique',
          language: 'general',
          difficulty: 'advanced',
          year: 2020,
          source: 'research'
        }
      },
      {
        id: 'doc-4',
        text: 'JavaScript is a versatile programming language for web development. It runs in browsers and on servers.',
        meta: {
          category: 'language',
          language: 'javascript',
          difficulty: 'beginner',
          year: 1995,
          source: 'official'
        }
      },
      {
        id: 'doc-5',
        text: 'Node.js enables server-side JavaScript execution. It uses the V8 JavaScript engine from Google Chrome.',
        meta: {
          category: 'runtime',
          language: 'javascript',
          difficulty: 'intermediate',
          year: 2009,
          source: 'official'
        }
      }
    ];

    await store.addDocuments(documents);
    console.log(`✅ Added ${documents.length} documents to vector store\n`);

    // ─────────────────────────────────────────────────────────────────
    // STEP 3: Initialize Conversation History
    // ─────────────────────────────────────────────────────────────────
    console.log('💬 STEP 3: Initializing Conversation History\n');

    const conversation = new ConversationHistory();
    console.log(`✅ Conversation session created: ${conversation.sessionId}\n`);

    // ─────────────────────────────────────────────────────────────────
    // STEP 4: Ask Multiple Questions (Conversation Session)
    // ─────────────────────────────────────────────────────────────────
    console.log('🔍 STEP 4: Asking Multiple Questions\n');
    console.log('─'.repeat(70) + '\n');

    const queries = [
      {
        query: 'What is React?',
        topK: 2,
        description: 'First question about React'
      },
      {
        query: 'How does Ollama work?',
        topK: 2,
        description: 'Second question about Ollama'
      },
      {
        query: 'What is RAG?',
        topK: 3,
        description: 'Third question about RAG with more context'
      },
      {
        query: 'Tell me about JavaScript',
        topK: 2,
        description: 'Fourth question about JavaScript'
      }
    ];

    for (let i = 0; i < queries.length; i++) {
      const { query, topK: queryTopK, description } = queries[i];
      
      console.log(`\n📌 Question ${i + 1}/${queries.length}: ${description}`);
      console.log(`❓ Query: "${query}"`);
      console.log(`🎯 TopK: ${queryTopK}\n`);

      // Update retriever with new topK if different
      if (queryTopK !== currentSettings.topK) {
        console.log(`⚙️  Updating topK to ${queryTopK}...`);
        // Note: In a real app, you'd recreate retriever or update it
        // For this example, we'll use the same retriever but request more results
      }

      // Retrieve relevant documents
      const results = await retriever.getRelevant(query, queryTopK);
      console.log(`📄 Retrieved ${results.length} documents:`);
      results.forEach((doc, idx) => {
        console.log(`   ${idx + 1}. [${doc.id}] ${doc.text.substring(0, 60)}... (score: ${doc.score.toFixed(3)})`);
      });

      // Generate answer
      console.log(`\n🤖 Generating answer...`);
      const modelToUse = currentSettings.model || modelName;
      const answer = await generateWithRAG(
        client,
        modelToUse,
        query,
        results
      );
      
      const answerText = typeof answer === 'string' 
        ? answer 
        : answer.response || JSON.stringify(answer);

      console.log(`💡 Answer: ${answerText.substring(0, 200)}${answerText.length > 200 ? '...' : ''}\n`);

      // Add to conversation history
      conversation.addMessage(query, answerText, results, {
        topK: queryTopK,
        model: modelToUse,
        description
      });

      console.log('─'.repeat(70));
    }

    // ─────────────────────────────────────────────────────────────────
    // STEP 5: Display Conversation Summary
    // ─────────────────────────────────────────────────────────────────
    console.log('\n📊 STEP 5: Conversation Summary\n');

    const summary = conversation.getSummary();
    console.log(`Session ID: ${summary.sessionId}`);
    console.log(`Total Messages: ${summary.messageCount}`);
    console.log(`Created At: ${summary.createdAt}`);
    console.log(`Last Message At: ${summary.lastMessageAt}`);
    console.log(`Total Retrieved Docs: ${summary.totalRetrievedDocs}`);
    console.log(`Average Retrieved Docs: ${summary.averageRetrievedDocs}\n`);

    // ─────────────────────────────────────────────────────────────────
    // STEP 6: Display Conversation History
    // ─────────────────────────────────────────────────────────────────
    console.log('💬 STEP 6: Conversation History\n');

    const messages = conversation.getMessages();
    messages.forEach((msg, idx) => {
      console.log(`\n💬 Message ${idx + 1}:`);
      console.log(`   Query: ${msg.query}`);
      console.log(`   Response: ${msg.response.substring(0, 100)}...`);
      console.log(`   Retrieved Docs: ${msg.retrievedDocs.length}`);
      console.log(`   Timestamp: ${msg.metadata.timestamp}`);
      console.log(`   TopK: ${msg.metadata.topK}`);
    });

    // ─────────────────────────────────────────────────────────────────
    // STEP 7: Export Conversation to JSON
    // ─────────────────────────────────────────────────────────────────
    console.log('\n\n💾 STEP 7: Exporting Conversation to JSON\n');

    try {
      const exportPath = await conversation.exportToJSON();
      console.log(`✅ Conversation exported to: ${exportPath}`);
      console.log(`📁 File size: ${(await fs.stat(exportPath)).size} bytes\n`);

      // Display export file contents (first 500 chars)
      const exportContent = await fs.readFile(exportPath, 'utf-8');
      console.log('📄 Export file preview (first 500 characters):');
      console.log('─'.repeat(70));
      console.log(exportContent.substring(0, 500) + '...\n');
    } catch (error) {
      console.log(`⚠️  Export failed: ${error.message}\n`);
    }

    // ─────────────────────────────────────────────────────────────────
    // STEP 8: Document Management (CRUD Operations)
    // ─────────────────────────────────────────────────────────────────
    console.log('📚 STEP 8: Document Management (CRUD Operations)\n');

    // Get all documents
    const allDocs = store.getAllDocuments();
    console.log(`📊 Total documents in store: ${allDocs.length}`);

    // Get specific document
    const doc1 = store.getDocument('doc-1');
    if (doc1) {
      console.log(`✅ Retrieved document doc-1: ${doc1.text.substring(0, 50)}...`);
    }

    // Update document
    console.log('\n🔄 Updating document doc-1...');
    await store.updateDocument('doc-1', 'React is a powerful JavaScript library for building modern user interfaces. It was created by Facebook in 2013 and has become one of the most popular frontend frameworks.', {
      ...doc1.meta,
      updatedAt: new Date().toISOString(),
      version: '2.0'
    });
    console.log('✅ Document updated');

    // Verify update
    const updatedDoc = store.getDocument('doc-1');
    console.log(`📄 Updated document: ${updatedDoc.text.substring(0, 80)}...`);

    // Delete a document
    console.log('\n🗑️  Deleting document doc-5...');
    store.deleteDocument('doc-5');
    console.log('✅ Document deleted');

    // Verify deletion
    const remainingDocs = store.getAllDocuments();
    console.log(`📊 Remaining documents: ${remainingDocs.length}`);

    // ─────────────────────────────────────────────────────────────────
    // STEP 9: Settings Management
    // ─────────────────────────────────────────────────────────────────
    console.log('\n\n⚙️  STEP 9: Settings Management\n');

    console.log('Current settings:');
    console.log(JSON.stringify(settings.getSettings(), null, 2));

    console.log('\n🔄 Updating settings...');
    settings.updateSettings({
      topK: 3,
      enableExplainability: true
    });

    console.log('Updated settings:');
    console.log(JSON.stringify(settings.getSettings(), null, 2));

    // ─────────────────────────────────────────────────────────────────
    // STEP 10: Test with New Settings
    // ─────────────────────────────────────────────────────────────────
    console.log('\n\n🧪 STEP 10: Testing with New Settings\n');

    const newSettings = settings.getSettings();
    console.log(`Testing with topK: ${newSettings.topK}`);

    const testQuery = 'What technologies are mentioned?';
    console.log(`Query: "${testQuery}"\n`);

    const testResults = await retriever.getRelevant(testQuery, newSettings.topK);
    console.log(`📄 Retrieved ${testResults.length} documents with new settings:`);
    testResults.forEach((doc, idx) => {
      console.log(`   ${idx + 1}. [${doc.id}] ${doc.text.substring(0, 60)}... (score: ${doc.score.toFixed(3)})`);
    });

    // ─────────────────────────────────────────────────────────────────
    // FINAL SUMMARY
    // ─────────────────────────────────────────────────────────────────
    console.log('\n\n═══════════════════════════════════════════════════════');
    console.log('✅ CONVERSATION HISTORY & EXPORT DEMO COMPLETED');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('📊 Final Statistics:');
    console.log(`   • Provider: ${useLMStudio ? 'LM Studio 🎨' : 'Ollama 🦙'}`);
    console.log(`   • Model: ${currentSettings.model || modelName}`);
    console.log(`   • Embedding: ${currentSettings.embeddingModel}`);
    console.log(`   • Total conversations: ${conversation.getMessageCount()}`);
    console.log(`   • Total documents: ${store.getAllDocuments().length}`);
    console.log(`   • Session ID: ${conversation.sessionId}`);
    console.log(`   • Export file created: exports/conversation-${conversation.sessionId}.json\n`);

    console.log('🎯 Features Tested:');
    console.log('   ✅ Conversation History Management');
    console.log('   ✅ Multi-query Session');
    console.log('   ✅ Export to JSON');
    console.log('   ✅ Document CRUD Operations');
    console.log('   ✅ Settings Management');
    console.log('   ✅ Dynamic Configuration');
    console.log(`   ✅ Multi-Provider Support (${useLMStudio ? 'LM Studio' : 'Ollama'})`);
    console.log(`   ✅ Auto-Detection: ${USE_LMSTUDIO === 'auto' ? 'Enabled' : 'Disabled'}\n`);

    console.log('💡 Next Steps:');
    console.log('   • Check the exports/ folder for JSON file');
    console.log('   • Import conversation history in your app');
    console.log('   • Use settings manager for dynamic configuration');
    console.log('   • Implement conversation persistence\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the example
main().catch(console.error);

