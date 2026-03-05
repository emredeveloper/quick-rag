import assert from 'node:assert/strict';
import { createBrowserModelClient } from '../src/browserModelClient.js';
import { initRAG } from '../src/initRag.js';
import { SmartRetriever } from '../src/decisionEngine.js';
import { HybridRetriever } from '../src/search/hybridSearch.js';
import { InMemoryVectorStore } from '../src/vectorStore.js';
import { ConversationManager } from '../src/conversation/ConversationManager.js';

async function main() {
  const browserClient = createBrowserModelClient();
  assert.equal(typeof browserClient.generate, 'function');
  assert.equal(typeof browserClient.generateStream, 'function');

  const fakeEmbedding = async (text) => {
    const len = text.length || 1;
    return [len, text.includes('alpha') ? 1 : 0, text.includes('beta') ? 1 : 0];
  };

  const docs = [
    { id: '1', text: 'alpha document' },
    { id: '2', text: 'beta document' }
  ];

  const { retriever } = await initRAG(docs, {
    baseEmbeddingOptions: { createEmbedding: fakeEmbedding }
  });

  const smart = new SmartRetriever(retriever);
  const smartResults = await smart.getRelevant('alpha', 1);
  assert.ok(Array.isArray(smartResults));
  assert.equal(typeof smartResults.decisions, 'object');
  assert.equal(smartResults.results, smartResults);

  const store = new InMemoryVectorStore(fakeEmbedding);
  const hybridDocs = Array.from({ length: 105 }, (_, i) => ({
    id: String(i + 1),
    text: `alpha hybrid document ${i + 1}`
  }));
  await store.addDocuments(hybridDocs);
  const hybrid = new HybridRetriever(store);
  await hybrid.syncBM25();
  assert.equal(hybrid.bm25.documents.length, 105);

  let summarizeCalls = 0;
  const conversation = new ConversationManager({
    maxTokens: 20,
    reservedTokens: 0,
    autoSummarize: true,
    summarizer: async () => {
      summarizeCalls += 1;
      await new Promise(resolve => setTimeout(resolve, 10));
      return 'summary';
    }
  });

  for (let i = 0; i < 6; i++) {
    conversation.addUserMessage(`message ${i}`);
  }

  await conversation._summaryPromise;
  assert.ok(summarizeCalls >= 1);
  assert.ok(conversation.messages.length >= 4);

  console.log('Core tests passed');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
