/**
 * SQLite Vector Store Example - No Server Required!
 * 
 * This example demonstrates embedded persistence using SQLite
 * 
 * Prerequisites:
 * 1. Install better-sqlite3: npm install better-sqlite3
 * 2. Make sure Ollama is running with qwen3-embedding:0.6b model
 * 
 * No ChromaDB server needed! 🎉
 */

import {
    OllamaRAGClient,
    createOllamaRAGEmbedding,
    SQLiteVectorStore,
    Retriever,
    generateWithRAG
} from 'quick-rag';

async function main() {
    console.log('🚀 SQLite Vector Store Example (No Server!)\n');

    // 1. Initialize Ollama client
    console.log('1️⃣ Initializing Ollama client...');
    const ollamaClient = new OllamaRAGClient({
        host: 'http://127.0.0.1:11434'
    });

    // 2. Create embedding function
    console.log('2️⃣ Creating embedding function...');
    const embed = createOllamaRAGEmbedding(ollamaClient, 'qwen3-embedding:0.6b');

    // 3. Create SQLite vector store (creates ./my-vectors.db file)
    console.log('3️⃣ Creating SQLite vector store...');
    const vectorStore = new SQLiteVectorStore('./my-vectors.db', embed, {
        defaultDim: 512 // qwen3-embedding:0.6b dimension
    });

    console.log('   ✅ Database created: ./my-vectors.db\n');

    // 4. Add documents with progress tracking
    console.log('4️⃣ Adding documents with progress tracking...');
    const documents = [
        {
            id: 'js-1',
            text: 'JavaScript is a versatile programming language used for web development.',
            meta: { category: 'programming', language: 'JavaScript', difficulty: 'beginner' }
        },
        {
            id: 'py-1',
            text: 'Python is popular for data science and machine learning.',
            meta: { category: 'programming', language: 'Python', difficulty: 'beginner' }
        },
        {
            id: 'ts-1',
            text: 'TypeScript adds static typing to JavaScript.',
            meta: { category: 'programming', language: 'TypeScript', difficulty: 'intermediate' }
        },
        {
            id: 'react-1',
            text: 'React is a JavaScript library for building user interfaces.',
            meta: { category: 'framework', language: 'JavaScript', difficulty: 'intermediate' }
        },
        {
            id: 'node-1',
            text: 'Node.js allows JavaScript to run on the server.',
            meta: { category: 'runtime', language: 'JavaScript', difficulty: 'intermediate' }
        }
    ];

    await vectorStore.addDocuments(documents, {
        batchSize: 2,
        onProgress: (current, total) => {
            console.log(`   Progress: ${current}/${total} documents embedded`);
        }
    });

    console.log('   ✅ All documents added!\n');

    // 5. Get statistics
    console.log('5️⃣ Database Statistics:');
    const stats = vectorStore.getStats();
    console.log(`   Database: ${stats.dbPath}`);
    console.log(`   Documents: ${stats.documentCount}\n`);

    // 6. Basic similarity search
    console.log('6️⃣ Basic Similarity Search:');
    const query1 = 'What is JavaScript?';
    console.log(`   Query: "${query1}"`);

    const results1 = await vectorStore.similaritySearch(query1, 3);
    console.log('   Results:');
    results1.forEach((doc, idx) => {
        console.log(`   ${idx + 1}. [Score: ${doc.score.toFixed(3)}] ${doc.text}`);
        console.log(`      Category: ${doc.meta.category}, Difficulty: ${doc.meta.difficulty}`);
    });
    console.log('');

    // 7. Search with metadata filtering
    console.log('7️⃣ Search with Metadata Filtering:');
    const query2 = 'programming languages';
    console.log(`   Query: "${query2}"`);
    console.log(`   Filter: category = "programming"`);

    const results2 = await vectorStore.similaritySearch(query2, 3, {
        where: { category: 'programming' }
    });

    console.log('   Results:');
    results2.forEach((doc, idx) => {
        console.log(`   ${idx + 1}. [Score: ${doc.score.toFixed(3)}] ${doc.text.substring(0, 50)}...`);
        console.log(`      Language: ${doc.meta.language}`);
    });
    console.log('');

    // 8. Update a document
    console.log('8️⃣ Updating a document...');
    const updated = await vectorStore.updateDocument(
        'js-1',
        'JavaScript is a powerful, versatile programming language used for web, mobile, and server development.',
        { category: 'programming', language: 'JavaScript', difficulty: 'beginner', updated: true }
    );
    console.log(`   Document updated: ${updated}\n`);

    // 9. Get specific document
    console.log('9️⃣ Getting specific document:');
    const doc = vectorStore.getDocument('ts-1');
    if (doc) {
        console.log(`   ID: ${doc.id}`);
        console.log(`   Text: ${doc.text}`);
        console.log(`   Metadata:`, doc.meta);
    }
    console.log('');

    // 10. Use with Retriever for RAG
    console.log('🔟 Full RAG Pipeline:');
    const retriever = new Retriever(vectorStore);

    const ragQuery = 'Tell me about TypeScript and its benefits';
    console.log(`   Query: "${ragQuery}"`);

    const ragResults = await retriever.getRelevant(ragQuery, 2);
    console.log('   Retrieved documents:');
    ragResults.forEach((doc, idx) => {
        console.log(`   ${idx + 1}. ${doc.text}`);
    });

    // Generate answer
    const answer = await generateWithRAG(
        ollamaClient,
        'granite4:3b',
        ragQuery,
        ragResults
    );

    console.log('\n   🤖 AI Answer:');
    console.log(`   ${answer}\n`);

    // 11. Delete a document
    console.log('1️⃣1️⃣ Deleting a document...');
    const deleted = vectorStore.deleteDocument('node-1');
    console.log(`   Document deleted: ${deleted}`);

    const statsAfter = vectorStore.getStats();
    console.log(`   Documents remaining: ${statsAfter.documentCount}\n`);

    // 12. Demonstrate persistence
    console.log('1️⃣2️⃣ Persistence Demonstration:');
    console.log('   ✅ All data is saved in ./my-vectors.db file');
    console.log('   ✅ Restart your app and data will still be there');
    console.log('   ✅ No server needed - just a single SQLite file!');
    console.log('   ✅ Perfect for local applications');
    console.log('');

    // 13. Close database (optional - good practice)
    vectorStore.close();
    console.log('1️⃣3️⃣ Database connection closed.\n');

    console.log('🎉 Example completed successfully!');
    console.log('\n💡 Key Benefits of SQLite Store:');
    console.log('   • No server required (embedded)');
    console.log('   • Single file storage');
    console.log('   • Fast and reliable');
    console.log('   • Perfect for local apps');
    console.log('   • Easy backup (just copy the .db file)');
    console.log('   • Metadata filtering with SQL');
}

// Run the example
main().catch(error => {
    console.error('❌ Error:', error.message);
    if (error.code) {
        console.error('   Error code:', error.code);
    }
    if (error.metadata) {
        console.error('   Metadata:', error.metadata);
    }
    process.exit(1);
});
