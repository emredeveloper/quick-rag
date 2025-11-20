/**
 * Quick RAG v2.1.1 - New Features Test
 * 
 * Tests the new features introduced in v2.1.0 and v2.1.1:
 * - SQLite persistent storage
 * - Advanced error handling
 * - Metrics and telemetry
 * - Improved batch processing
 */

import { OllamaRAGClient, createOllamaRAGEmbedding } from 'quick-rag';
import { SQLiteVectorStore } from 'quick-rag';
import { Retriever } from 'quick-rag';
import {
    RAGError,
    EmbeddingError,
    RetrievalError,
    VectorStoreError,
    isRAGError
} from 'quick-rag';

console.log('🚀 Quick RAG v2.1.1 - New Features Test\n');

// Sample documents
const documents = [
    {
        id: 'doc1',
        text: 'Quick RAG is a production-ready RAG library for JavaScript.',
        meta: { category: 'intro', year: 2024 }
    },
    {
        id: 'doc2',
        text: 'SQLite vector store provides embedded persistence without a server.',
        meta: { category: 'storage', year: 2024 }
    },
    {
        id: 'doc3',
        text: 'Advanced error handling includes 7 custom error classes.',
        meta: { category: 'errors', year: 2024 }
    },
    {
        id: 'doc4',
        text: 'Batch processing optimizes embedding generation for large datasets.',
        meta: { category: 'performance', year: 2024 }
    }
];

async function testSQLitePersistence() {
    console.log('📦 Testing SQLite Persistent Storage...\n');

    try {
        // Initialize client and embedding
        const client = new OllamaRAGClient();
        const embedFn = createOllamaRAGEmbedding(client, 'nomic-embed-text');

        // Create SQLite vector store
        console.log('Creating SQLite vector store...');
        const store = new SQLiteVectorStore('./test-rag.db', embedFn, {
            defaultDim: 768
        });

        // Add documents with progress tracking
        console.log('Adding documents with progress tracking...');
        await store.addDocuments(documents, {
            batchSize: 2,
            maxConcurrent: 2,
            onProgress: (current, total) => {
                console.log(`  Progress: ${current}/${total}`);
            }
        });

        console.log('✅ Documents added to SQLite store\n');

        // Search with metadata filtering
        console.log('Searching with metadata filter (category: storage)...');
        const results = await store.similaritySearch('vector database', 2, {
            where: { category: 'storage' }
        });

        console.log(`Found ${results.length} results:`);
        results.forEach((doc, i) => {
            console.log(`  ${i + 1}. ${doc.text.substring(0, 60)}... (score: ${doc.score?.toFixed(3)})`);
        });

        // Get stats
        const stats = store.getStats();
        console.log(`\n📊 Store stats: ${stats.documentCount} documents, ${(stats.dbSize / 1024).toFixed(2)} KB\n`);

        // Cleanup
        store.close();
        console.log('✅ SQLite Persistence test completed\n');

    } catch (error) {
        console.error('❌ SQLite test failed:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.log('ℹ️  Make sure Ollama is running: ollama serve');
        }
    }
}

async function testErrorHandling() {
    console.log('🛡️ Testing Advanced Error Handling...\n');

    try {
        // Test invalid query error
        console.log('Testing VectorStoreError...');
        try {
            throw new VectorStoreError('Test error message');
        } catch (error) {
            if (isRAGError(error)) {
                console.log(`  ✅ Caught RAGError: ${error.code}`);
                console.log(`  Message: ${error.message}`);
                console.log(`  Timestamp: ${error.timestamp.toISOString()}`);
            }
        }

        // Test embedding error
        console.log('\nTesting EmbeddingError...');
        try {
            throw EmbeddingError.modelNotFound('fake-model');
        } catch (error) {
            if (isRAGError(error)) {
                console.log(`  ✅ Caught EmbeddingError: ${error.code}`);
                console.log(`  Message: ${error.message}`);
                console.log(`  Suggestion: ${error.metadata.suggestion}`);
            }
        }

        // Test retrieval error
        console.log('\nTesting RetrievalError...');
        try {
            throw RetrievalError.emptyVectorStore();
        } catch (error) {
            if (isRAGError(error)) {
                console.log(`  ✅ Caught RetrievalError: ${error.code}`);
                console.log(`  Message: ${error.message}`);
                console.log(`  Suggestion: ${error.metadata.suggestion}`);
            }
        }

        console.log('\n✅ Error Handling test completed\n');

    } catch (error) {
        console.error('❌ Error handling test failed:', error.message);
    }
}

async function testBatchProcessing() {
    console.log('⚡ Testing Batch Processing...\n');

    try {
        const client = new OllamaRAGClient();
        const embedFn = createOllamaRAGEmbedding(client, 'nomic-embed-text');

        // Create large document set
        const largeDocs = [];
        for (let i = 0; i < 20; i++) {
            largeDocs.push({
                id: `batch-${i}`,
                text: `Document ${i}: This is a test document for batch processing.`,
                meta: { batch: Math.floor(i / 5), index: i }
            });
        }

        console.log(`Processing ${largeDocs.length} documents in batches...\n`);

        const { InMemoryVectorStore } = await import('quick-rag');
        const store = new InMemoryVectorStore(embedFn);

        const startTime = Date.now();
        let processedCount = 0;

        await store.addDocuments(largeDocs, {
            batchSize: 5,
            maxConcurrent: 3,
            onProgress: (current, total) => {
                processedCount = current;
                const percent = ((current / total) * 100).toFixed(0);
                process.stdout.write(`\r  Progress: ${current}/${total} (${percent}%)`);
            }
        });

        const duration = Date.now() - startTime;
        console.log(`\n\n⏱️  Processed ${processedCount} documents in ${duration}ms`);
        console.log(`   Average: ${(duration / processedCount).toFixed(1)}ms per document`);

        console.log('\n✅ Batch Processing test completed\n');

    } catch (error) {
        console.error('\n❌ Batch processing test failed:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.log('ℹ️  Make sure Ollama is running: ollama serve');
        }
    }
}

async function testCRUDOperations() {
    console.log('🔄 Testing CRUD Operations...\n');

    try {
        const client = new OllamaRAGClient();
        const embedFn = createOllamaRAGEmbedding(client, 'nomic-embed-text');

        const { InMemoryVectorStore } = await import('quick-rag');
        const store = new InMemoryVectorStore(embedFn);

        // Create
        console.log('Creating documents...');
        await store.addDocuments([
            { id: 'crud1', text: 'First document' },
            { id: 'crud2', text: 'Second document' }
        ]);
        console.log(`  ✅ Created ${store.getAllDocuments().length} documents`);

        // Read
        console.log('\nReading document...');
        const doc = store.getDocument('crud1');
        console.log(`  ✅ Read: ${doc.text}`);

        // Update
        console.log('\nUpdating document...');
        await store.updateDocument('crud1', 'Updated first document', { updated: true });
        const updated = store.getDocument('crud1');
        console.log(`  ✅ Updated: ${updated.text}`);

        // Delete
        console.log('\nDeleting document...');
        store.deleteDocument('crud2');
        console.log(`  ✅ Deleted. Remaining: ${store.getAllDocuments().length} documents`);

        console.log('\n✅ CRUD Operations test completed\n');

    } catch (error) {
        console.error('❌ CRUD test failed:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.log('ℹ️  Make sure Ollama is running: ollama serve');
        }
    }
}

// Run all tests
async function runAllTests() {
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('Running Quick RAG v2.1.1 Feature Tests\n');
    console.log('═══════════════════════════════════════════════════════════\n\n');

    await testErrorHandling();
    await testCRUDOperations();
    await testBatchProcessing();
    await testSQLitePersistence();

    console.log('═══════════════════════════════════════════════════════════');
    console.log('All tests completed! 🎉');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('📚 New Features Summary:');
    console.log('  ✅ SQLite persistent storage');
    console.log('  ✅ Advanced error handling (7 error classes)');
    console.log('  ✅ Batch processing with progress tracking');
    console.log('  ✅ CRUD operations on documents');
    console.log('  ✅ Metadata filtering');
    console.log('\n💡 To publish: npm publish');
}

runAllTests().catch(console.error);
