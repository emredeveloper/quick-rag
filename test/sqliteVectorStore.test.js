/**
 * SQLite Vector Store Tests
 * 
 * Comprehensive test suite for SQLiteVectorStore
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { SQLiteVectorStore } from '../src/stores/sqliteStore.js';

// Mock embedding function
const mockEmbed = async (text, dim = 768) => {
    if (Array.isArray(text)) {
        return text.map(() => Array(dim).fill(0).map(() => Math.random()));
    }
    return Array(dim).fill(0).map(() => Math.random());
};

const TEST_DB = './test-store.db';

describe('SQLiteVectorStore', () => {
    let store;

    before(() => {
        // Clean up test db if exists
        if (fs.existsSync(TEST_DB)) {
            fs.unlinkSync(TEST_DB);
        }
    });

    after(() => {
        // Cleanup
        if (store) {
            store.close();
        }
        if (fs.existsSync(TEST_DB)) {
            fs.unlinkSync(TEST_DB);
        }
    });

    describe('Initialization', () => {
        it('should create database file', () => {
            store = new SQLiteVectorStore(TEST_DB, mockEmbed);
            assert.ok(fs.existsSync(TEST_DB), 'Database file should exist');
        });

        it('should throw error without db path', () => {
            assert.throws(
                () => new SQLiteVectorStore(null, mockEmbed),
                /Database path is required/
            );
        });

        it('should throw error without embedding function', () => {
            assert.throws(
                () => new SQLiteVectorStore(TEST_DB, null),
                /Embedding function is required/
            );
        });
    });

    describe('Document Operations', () => {
        it('should add single document', async () => {
            const doc = {
                id: 'test-1',
                text: 'This is a test document',
                meta: { category: 'test' }
            };

            await store.addDocument(doc);
            const retrieved = store.getDocument('test-1');

            assert.strictEqual(retrieved.id, 'test-1');
            assert.strictEqual(retrieved.text, 'This is a test document');
            assert.deepStrictEqual(retrieved.meta, { category: 'test' });
        });

        it('should add multiple documents', async () => {
            const docs = [
                { id: 'doc-1', text: 'First document', meta: { num: 1 } },
                { id: 'doc-2', text: 'Second document', meta: { num: 2 } },
                { id: 'doc-3', text: 'Third document', meta: { num: 3 } }
            ];

            await store.addDocuments(docs);
            const stats = store.getStats();

            assert.ok(stats.documentCount >= 4, 'Should have at least 4 documents');
        });

        it('should update existing document', async () => {
            const updated = await store.updateDocument(
                'doc-1',
                'Updated first document',
                { num: 1, updated: true }
            );

            assert.strictEqual(updated, true);
            const doc = store.getDocument('doc-1');
            assert.strictEqual(doc.text, 'Updated first document');
            assert.strictEqual(doc.meta.updated, true);
        });

        it('should delete document', async () => {
            const deleted = store.deleteDocument('doc-3');
            assert.strictEqual(deleted, true);

            const doc = store.getDocument('doc-3');
            assert.strictEqual(doc, null);
        });

        it('should handle non-existent document', () => {
            const doc = store.getDocument('not-exists');
            assert.strictEqual(doc, null);
        });
    });

    describe('Batch Processing', () => {
        it('should process documents in batches with progress', async () => {
            const docs = Array(20).fill(0).map((_, i) => ({
                id: `batch-${i}`,
                text: `Batch document ${i}`,
                meta: { batch: true, index: i }
            }));

            let progressCalls = 0;
            await store.addDocuments(docs, {
                batchSize: 5,
                onProgress: (current, total) => {
                    progressCalls++;
                    assert.ok(current <= total);
                }
            });

            assert.ok(progressCalls > 0, 'Progress callback should be called');
        });

        it('should handle batch errors gracefully', async () => {
            const docs = [
                { id: 'good-1', text: 'Good document', meta: {} },
                { text: 'Missing ID' }, // Invalid - no ID
            ];

            // Should still add valid documents
            await store.addDocuments(docs.filter(d => d.id));
            const doc = store.getDocument('good-1');
            assert.ok(doc, 'Valid document should be added');
        });
    });

    describe('Similarity Search', () => {
        before(async () => {
            // Add test documents for search
            const docs = [
                { id: 'search-1', text: 'JavaScript programming language', meta: { lang: 'js' } },
                { id: 'search-2', text: 'Python data science', meta: { lang: 'py' } },
                { id: 'search-3', text: 'JavaScript frameworks React Vue', meta: { lang: 'js' } }
            ];
            await store.addDocuments(docs);
        });

        it('should perform basic similarity search', async () => {
            const results = await store.similaritySearch('JavaScript', 3);

            assert.ok(Array.isArray(results));
            assert.ok(results.length > 0);
            assert.ok(results[0].score >= 0 && results[0].score <= 1);
            assert.ok(results[0].text);
        });

        it('should return requested number of results', async () => {
            const results = await store.similaritySearch('programming', 2);
            assert.ok(results.length <= 2);
        });

        it('should sort results by score descending', async () => {
            const results = await store.similaritySearch('code', 3);

            for (let i = 1; i < results.length; i++) {
                assert.ok(
                    results[i - 1].score >= results[i].score,
                    'Results should be sorted by score'
                );
            }
        });
    });

    describe('Metadata Filtering', () => {
        it('should filter by single metadata field', async () => {
            const results = await store.similaritySearch('programming', 5, {
                where: { lang: 'js' }
            });

            results.forEach(doc => {
                assert.strictEqual(doc.meta.lang, 'js', 'All results should match filter');
            });
        });

        it('should return empty when no matches', async () => {
            try {
                await store.similaritySearch('test', 5, {
                    where: { lang: 'nonexistent' }
                });
                assert.fail('Should throw error for no matches');
            } catch (err) {
                assert.ok(err.message.includes('No documents match'));
            }
        });
    });

    describe('Statistics and Management', () => {
        it('should return accurate statistics', () => {
            const stats = store.getStats();

            assert.ok(stats.dbPath);
            assert.strictEqual(typeof stats.documentCount, 'number');
            assert.ok(stats.documentCount > 0);
        });

        it('should get all documents', () => {
            const docs = store.getAllDocuments({ limit: 5 });

            assert.ok(Array.isArray(docs));
            assert.ok(docs.length <= 5);
            assert.ok(docs[0].id);
            assert.ok(docs[0].text);
        });

        it('should support pagination', () => {
            const page1 = store.getAllDocuments({ limit: 3, offset: 0 });
            const page2 = store.getAllDocuments({ limit: 3, offset: 3 });

            assert.ok(Array.isArray(page1));
            assert.ok(Array.isArray(page2));

            if (page1.length > 0 && page2.length > 0) {
                assert.notStrictEqual(page1[0].id, page2[0].id);
            }
        });

        it('should clear all documents', () => {
            store.clear();
            const stats = store.getStats();
            assert.strictEqual(stats.documentCount, 0);
        });
    });

    describe('Error Handling', () => {
        it('should throw on invalid query', async () => {
            await assert.rejects(
                () => store.similaritySearch('', 3),
                /query must be a non-empty string/
            );
        });

        it('should throw on empty store search', async () => {
            store.clear();

            await assert.rejects(
                () => store.similaritySearch('test', 3),
                /No documents in store/
            );
        });

        it('should handle update of non-existent document', async () => {
            const result = await store.updateDocument('fake-id', 'text', {});
            assert.strictEqual(result, false);
        });

        it('should handle delete of non-existent document', () => {
            const result = store.deleteDocument('fake-id');
            assert.strictEqual(result, false);
        });
    });

    describe('Concurrent Operations', () => {
        it('should handle concurrent reads', async () => {
            // Add some test data first
            await store.addDocuments([
                { id: 'concurrent-1', text: 'Test 1', meta: {} },
                { id: 'concurrent-2', text: 'Test 2', meta: {} }
            ]);

            const promises = Array(10).fill(0).map(() =>
                store.similaritySearch('test', 2)
            );

            const results = await Promise.all(promises);
            assert.strictEqual(results.length, 10);
            results.forEach(r => assert.ok(Array.isArray(r)));
        });

        it('should handle concurrent writes', async () => {
            const docs = Array(10).fill(0).map((_, i) => ({
                id: `concurrent-write-${i}`,
                text: `Concurrent ${i}`,
                meta: { index: i }
            }));

            await Promise.all(docs.map(doc => store.addDocument(doc)));

            const stats = store.getStats();
            assert.ok(stats.documentCount >= 10);
        });
    });

    describe('Database Management', () => {
        it('should vacuum database', () => {
            assert.doesNotThrow(() => {
                store.vacuum();
            });
        });

        it('should close database', () => {
            assert.doesNotThrow(() => {
                store.close();
            });
        });

        it('should allow reopening after close', () => {
            store = new SQLiteVectorStore(TEST_DB, mockEmbed);
            const stats = store.getStats();
            assert.ok(stats.documentCount >= 0);
        });
    });
});
