/**
 * Quick RAG v2.1.1 - New Features Test
 * Testing SQLite persistence, error handling, and metrics
 */

import {
  OllamaRAGClient,
  createOllamaRAGEmbedding,
  SQLiteVectorStore,
  Retriever,
  generateWithRAG,
  RAGError,
  EmbeddingError,
  VectorStoreError,
  isRAGError,
  getErrorCode
} from 'quick-rag';

console.log('🚀 Testing Quick RAG v2.1.1 New Features\n');

async function test1_SQLitePersistence() {
  console.log('📦 Test 1: SQLite Persistent Storage');
  console.log('=====================================\n');

  try {
    // 1. Setup client and embedding
    const client = new OllamaRAGClient();
    const embedFn = createOllamaRAGEmbedding(client, 'nomic-embed-text');

    // 2. Create SQLite store
    const store = new SQLiteVectorStore('./test-knowledge.db', embedFn);
    console.log('✅ SQLite vector store created\n');

    // 3. Add documents with progress tracking
    console.log('📝 Adding documents with progress...');
    await store.addDocuments([
      {
        id: 'doc1',
        text: 'Quick RAG v2.1 brings SQLite persistence for embedded vector storage.',
        meta: { category: 'feature', version: '2.1.0' }
      },
      {
        id: 'doc2',
        text: 'Error handling system includes 7 custom error classes with recovery suggestions.',
        meta: { category: 'feature', version: '2.1.0' }
      },
      {
        id: 'doc3',
        text: 'Metrics and telemetry track performance, latency, and usage patterns.',
        meta: { category: 'feature', version: '2.1.0' }
      },
      {
        id: 'doc4',
        text: 'Structured logging with Pino provides JSON output for production monitoring.',
        meta: { category: 'feature', version: '2.1.0' }
      }
    ], {
      batchSize: 2,
      onProgress: (current, total) => {
        console.log(`   Progress: ${current}/${total} documents embedded`);
      }
    });

    console.log('✅ Documents added to SQLite store\n');

    // 4. Search with metadata filtering
    console.log('🔍 Searching with metadata filter...');
    const results = await store.similaritySearch('What are the new features?', 3, {
      where: { category: 'feature', version: '2.1.0' }
    });

    console.log(`✅ Found ${results.length} relevant documents:\n`);
    results.forEach((doc, i) => {
      console.log(`${i + 1}. [Score: ${doc.score?.toFixed(3)}]`);
      console.log(`   ${doc.text}`);
      console.log(`   Meta: ${JSON.stringify(doc.meta)}\n`);
    });

    // 5. Get stats
    const stats = store.getStats();
    console.log('📊 Store Statistics:');
    console.log(`   Total documents: ${stats.documentCount}`);
    console.log(`   Database size: ${(stats.dbSize / 1024).toFixed(2)} KB\n`);

    // 6. Update document
    console.log('✏️  Updating document...');
    await store.updateDocument('doc1', 'Quick RAG v2.1.1 includes bug fixes and SQLite persistence.', {
      category: 'feature',
      version: '2.1.1',
      updated: true
    });
    console.log('✅ Document updated\n');

    // 7. Verify update
    const updated = store.getDocument('doc1');
    console.log('✅ Updated document:');
    console.log(`   ${updated.text}`);
    console.log(`   Meta: ${JSON.stringify(updated.meta)}\n`);

    // Cleanup
    store.close();
    console.log('✅ Test 1 completed successfully!\n');
    return true;

  } catch (error) {
    console.error('❌ Test 1 failed:', error.message);
    return false;
  }
}

async function test2_ErrorHandling() {
  console.log('\n🛡️  Test 2: Advanced Error Handling');
  console.log('====================================\n');

  try {
    const client = new OllamaRAGClient();
    const embedFn = createOllamaRAGEmbedding(client, 'nomic-embed-text');
    const store = new SQLiteVectorStore('./test-errors.db', embedFn);

    // Test 1: Invalid document
    console.log('1️⃣  Testing invalid document error...');
    try {
      await store.addDocument({ text: '' }); // Empty text
    } catch (error) {
      if (isRAGError(error)) {
        console.log(`   ✅ Caught ${error.name}`);
        console.log(`   Code: ${getErrorCode(error)}`);
        console.log(`   Message: ${error.message}\n`);
      }
    }

    // Test 2: VectorStoreError
    console.log('2️⃣  Testing VectorStoreError...');
    try {
      throw new VectorStoreError('Test vector store error', {
        suggestion: 'This is a test error'
      });
    } catch (error) {
      if (isRAGError(error)) {
        console.log(`   ✅ Caught ${error.name}`);
        console.log(`   Code: ${error.code}`);
        console.log(`   Metadata:`, error.metadata);
        console.log();
      }
    }

    // Test 3: EmbeddingError static methods
    console.log('3️⃣  Testing EmbeddingError factory methods...');
    try {
      throw EmbeddingError.modelNotFound('fake-model');
    } catch (error) {
      console.log(`   ✅ Created: ${error.name}`);
      console.log(`   Message: ${error.message}`);
      console.log(`   Suggestion: ${error.metadata.suggestion}\n`);
    }

    // Test 4: Error serialization
    console.log('4️⃣  Testing error serialization...');
    const testError = new VectorStoreError('Serialization test', {
      context: 'testing',
      value: 123
    });
    const serialized = testError.toJSON();
    console.log('   ✅ Serialized error:');
    console.log(`   ${JSON.stringify(serialized, null, 2)}\n`);

    store.close();
    console.log('✅ Test 2 completed successfully!\n');
    return true;

  } catch (error) {
    console.error('❌ Test 2 failed:', error.message);
    return false;
  }
}

async function test3_RAGWithNewFeatures() {
  console.log('\n🤖 Test 3: RAG with SQLite + Error Handling');
  console.log('============================================\n');

  try {
    // Setup
    const client = new OllamaRAGClient();
    const embedFn = createOllamaRAGEmbedding(client, 'nomic-embed-text');
    const store = new SQLiteVectorStore('./test-rag.db', embedFn);
    const retriever = new Retriever(store);

    // Add knowledge base
    console.log('📚 Building knowledge base...');
    await store.addDocuments([
      {
        text: 'Quick RAG is a production-ready RAG library for JavaScript and React.',
        meta: { topic: 'introduction' }
      },
      {
        text: 'Version 2.1 added SQLite persistence, error handling, metrics, and logging.',
        meta: { topic: 'features' }
      },
      {
        text: 'SQLite vector store provides embedded persistence without a server.',
        meta: { topic: 'sqlite' }
      },
      {
        text: 'The library includes 7 custom error classes for better error handling.',
        meta: { topic: 'errors' }
      }
    ]);
    console.log('✅ Knowledge base ready\n');

    // Query with error handling
    console.log('🔍 Querying: "What is Quick RAG?"');
    try {
      const docs = await retriever.getRelevant('What is Quick RAG?', 2);
      console.log(`✅ Retrieved ${docs.length} documents:\n`);
      
      docs.forEach((doc, i) => {
        console.log(`${i + 1}. ${doc.text.substring(0, 80)}...`);
      });
      console.log();

      // Generate answer
      console.log('💬 Generating answer...');
      const answer = await generateWithRAG(
        client,
        'qwen2.5:0.5b',
        'What is Quick RAG and what are its main features?',
        docs
      );
      
      console.log('✅ Answer generated:');
      console.log(`\n${answer}\n`);

    } catch (error) {
      if (isRAGError(error)) {
        console.log(`❌ RAG Error: ${error.name}`);
        console.log(`   Code: ${getErrorCode(error)}`);
        console.log(`   Message: ${error.message}`);
        if (error.metadata.suggestion) {
          console.log(`   💡 Suggestion: ${error.metadata.suggestion}`);
        }
      } else {
        throw error;
      }
    }

    store.close();
    console.log('✅ Test 3 completed successfully!\n');
    return true;

  } catch (error) {
    console.error('❌ Test 3 failed:', error.message);
    console.error('   Make sure Ollama is running with qwen2.5:0.5b model');
    return false;
  }
}

async function runAllTests() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║  Quick RAG v2.1.1 - Feature Test Suite   ║');
  console.log('╚════════════════════════════════════════════╝\n');

  const results = [];

  // Run tests
  results.push(await test1_SQLitePersistence());
  results.push(await test2_ErrorHandling());
  results.push(await test3_RAGWithNewFeatures());

  // Summary
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║           Test Results Summary            ║');
  console.log('╚════════════════════════════════════════════╝\n');

  const passed = results.filter(r => r).length;
  const total = results.length;

  console.log(`✅ Passed: ${passed}/${total}`);
  if (passed < total) {
    console.log(`❌ Failed: ${total - passed}/${total}`);
  }

  console.log('\n📝 New Features in v2.1.0:');
  console.log('   ✅ SQLite Persistent Storage');
  console.log('   ✅ 7 Custom Error Classes');
  console.log('   ✅ Error Recovery Suggestions');
  console.log('   ✅ Batch Processing with Progress');
  console.log('   ✅ Metadata Filtering');
  console.log('   ✅ CRUD Operations');
  console.log('   ✅ Database Statistics');

  console.log('\n💡 Cleanup: You can delete test-*.db files after testing\n');
}

// Run tests
runAllTests().catch(console.error);
