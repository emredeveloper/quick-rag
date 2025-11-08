# Quick RAG ⚡# Quick RAG ⚡



[![npm version](https://img.shields.io/npm/v/quick-rag.svg)](https://www.npmjs.com/package/quick-rag)[![npm version](https://img.shields.io/npm/v/quick-rag.svg)](https://www.npmjs.com/package/quick-rag)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)



**Production-ready RAG (Retrieval-Augmented Generation) for JavaScript****Production-ready RAG (Retrieval-Augmented Generation) for JavaScript & React**



Built on official [Ollama](https://github.com/ollama/ollama-js) & [LM Studio](https://github.com/lmstudio-ai/lmstudio-js) SDKs.Built on official [Ollama](https://github.com/ollama/ollama-js) & [LM Studio](https://github.com/lmstudio-ai/lmstudio-js) SDKs.



## ✨ Features## ✨ Key Features



- 🎯 **Official SDKs** - Built on `ollama` and `@lmstudio/sdk`- 🎯 **Official SDKs** - Built on `ollama` and `@lmstudio/sdk`

- ⚡ **Fast** - Parallel batch embedding (5x faster)- ⚡ **Fast** - Parallel batch embedding (5x faster)

- 📄 **Document Loaders** - PDF, Word, Excel, PowerPoint, Text, Markdown, URLs- 📄 **Document Loaders** - PDF, Word, Excel, PowerPoint, Text, Markdown, URLs

- 🏷️ **Smart Filtering** - Object and function-based filters- 🏷️ **Smart Filtering** - Object-based and function-based metadata filters

- 🔍 **Query Explainability** - See WHY documents were retrieved- 🔍 **Query Explainability** - See WHY documents were retrieved

- 🎨 **Dynamic Prompts** - 10 built-in templates + customization- 🎨 **Dynamic Prompts** - 10 built-in templates + full customization

- 🧠 **Decision Engine** - Multi-criteria scoring- 🧠 **Decision Engine** - Multi-criteria scoring with weighted factors

- 🌊 **Streaming** - Real-time responses- 🌊 **Streaming Support** - Real-time AI responses

- 💪 **TypeScript** - Full type safety- 💪 **TypeScript** - Full type safety

- 🔧 **Zero Config** - Works with React, Next.js, Vite, Node.js- 🔧 **Zero Config** - Works with React, Next.js, Vite, Node.js



## 📦 Installation## 📦 Installation



```bash```bash

npm install quick-ragnpm install quick-rag

``````



**Prerequisites:****Prerequisites:**

- [Ollama](https://ollama.ai) OR [LM Studio](https://lmstudio.ai)- [Ollama](https://ollama.ai) OR [LM Studio](https://lmstudio.ai) installed

- Models: `ollama pull granite4:3b nomic-embed-text`- Models: `ollama pull granite4:3b` and `ollama pull nomic-embed-text`



## 🆕 What's New in v1.1.8## � What's New in v1.1.8



- ✅ **Function-based Filters** - `filter: (meta) => meta.year === 2024`- ✅ **Function-based Filters** - Advanced filtering with custom logic: `filter: (meta) => meta.year === 2024`

- ✅ **PowerPoint Support** - Load .pptx files- ✅ **PowerPoint Support** - Load .pptx and .ppt files with `officeparser`

- ✅ **Organized Examples** - Separated Ollama/LM Studio folders- ✅ **Organized Examples** - Separated Ollama and LM Studio examples into folders

- ✅ **Advanced Filtering** - 6 new filtering scenarios- ✅ **LM Studio Examples** - 3 new examples showing LM Studio integration

- ✅ **Advanced Filtering Example** - 6 different filtering scenarios demonstrated

---

---

## 🚀 Quick Start

## � Quick Start

### Ollama Example

### Basic Usage (Ollama)

```javascript

import { ```javascript

  OllamaRAGClient,import { SmartRetriever, DEFAULT_WEIGHTS } from 'quick-rag';

  createOllamaRAGEmbedding,

  InMemoryVectorStore,// Create smart retriever with default weights

  Retriever,const smartRetriever = new SmartRetriever(basicRetriever);

  generateWithRAG

} from 'quick-rag';// Or customize weights for your use case

const smartRetriever = new SmartRetriever(basicRetriever, {

// Initialize  weights: {

const client = new OllamaRAGClient();    semanticSimilarity: 0.35,

const embed = createOllamaRAGEmbedding(client, 'nomic-embed-text');    keywordMatch: 0.20,

const store = new InMemoryVectorStore(embed);    recency: 0.30,         // Higher for news sites

const retriever = new Retriever(store);    sourceQuality: 0.10,

    contextRelevance: 0.05

// Add documents  }

await store.addDocuments([});

  { text: 'The sky appears blue due to Rayleigh scattering.' },

  { text: 'JavaScript is the language of the web.' }// Get results with decision transparency

]);const response = await smartRetriever.getRelevant('latest AI news', 3);



// Query// See scoring breakdown for each document

const docs = await retriever.getRelevant('Why is the sky blue?', 2);console.log(response.results[0]);

// {

// Generate answer//   text: "...",

const result = await generateWithRAG(//   weightedScore: 0.742,

  client,//   scoreBreakdown: {

  'granite4:3b',//     semanticSimilarity: { score: 0.85, weight: 0.35, contribution: 0.298 },

  'Why is the sky blue?',//     keywordMatch: { score: 0.67, weight: 0.20, contribution: 0.134 },

  docs.map(d => d.text)//     recency: { score: 0.95, weight: 0.30, contribution: 0.285 },

);//     sourceQuality: { score: 0.90, weight: 0.10, contribution: 0.090 },

//     contextRelevance: { score: 1.00, weight: 0.05, contribution: 0.050 }

console.log(result.response);//   }

```// }



### LM Studio Example// Decision context shows WHY these results

console.log(response.decisions);

```javascript// {

import { //   weights: { ... },

  LMStudioRAGClient,//   appliedRules: ["boost-recent-for-news"],

  createLMStudioRAGEmbedding,//   suggestions: [

  // ... same as above//     "Time-sensitive query detected. Prioritizing recent documents.",

} from 'quick-rag';//     "Consider using filters if you need older historical content."

//   ]

const client = new LMStudioRAGClient();// }

const embed = createLMStudioRAGEmbedding(client, 'text-embedding-nomic-embed-text-v1.5');```

// ... rest is the same!

```#### Heuristic Reasoning



**Switching providers is just 2 lines!****Pattern-based optimization that learns:**



---```javascript

// Enable learning mode

## 📚 Examplesconst smartRetriever = new SmartRetriever(basicRetriever, {

  enableLearning: true,

Check out [`quickstart/`](quickstart/) folder:  enableHeuristics: true

});

### Ollama Examples (quickstart/ollama/)

1. **01-basic-usage.js** - Get started in 5 minutes// Add custom rules

2. **02-document-loading.js** - Load multiple documentssmartRetriever.heuristicEngine.addRule(

3. **03-streaming.js** - Real-time responses  'boost-documentation',

4. **04-metadata-filtering.js** - Filter by metadata  (query, context) => query.includes('documentation'),

5. **05-decision-engine.js** - Multi-criteria scoring  (query, context) => {

6. **06-pdf-real-world.js** - Real PDF documents    context.adjustWeight('sourceQuality', 0.15);  // Increase quality weight

7. **07-pdf-with-decision-engine.js** - Advanced PDF retrieval    return { adjusted: true, reason: 'Documentation query prioritizes quality' };

8. **08-multiple-document-types.js** - PDF, Word, Excel, PowerPoint  },

9. **09-multiformat-decision-engine.js** - All features combined  5  // Priority

);

### LM Studio Examples (quickstart/lmstudio/)

1. **01-basic.js** - LM Studio basics// Provide feedback to enable learning

2. **02-streaming.js** - Streaming with LM StudiosmartRetriever.provideFeedback(query, results, {

3. **03-documents.js** - Multi-format documents  rating: 5,           // 1-5 rating

  hasFilters: true,    // User applied filters

**Run examples:**  comment: 'Perfect results!'

```bash});

cd quickstart

npm install// System learns successful patterns

npm run ollama:01    # Run Ollama example 1const insights = smartRetriever.getInsights();

npm run lmstudio:01  # Run LM Studio example 1console.log(insights.heuristics.successfulPatterns);

```// ["latest", "documentation", "official release"]



---// Export learned knowledge

const knowledge = smartRetriever.exportKnowledge();

## 🏷️ Advanced Filtering

// Import to another instance

### Object-based (Simple)newRetriever.importKnowledge(knowledge);

```

```javascript

const results = await retriever.getRelevant('programming', 5, {#### Scenario Customization

  filters: { 

    category: 'tech',**Different weights for different use cases:**

    difficulty: 'beginner'

  }```javascript

});// News Platform - Recency Priority

```const newsRetriever = new SmartRetriever(basicRetriever, {

  weights: {

### Function-based (Advanced)    semanticSimilarity: 0.30,

    keywordMatch: 0.20,

```javascript    recency: 0.40,         // 🔥 High recency

const results = await retriever.getRelevant('latest news', 5, {    sourceQuality: 0.05,

  filter: (meta) => {    contextRelevance: 0.05

    return meta.year === 2024 &&   }

           meta.tags.includes('AI') &&});

           meta.difficulty !== 'beginner';

  }// Documentation Site - Quality Priority  

});const docsRetriever = new SmartRetriever(basicRetriever, {

```  weights: {

    semanticSimilarity: 0.35,

### Combined    keywordMatch: 0.20,

    recency: 0.10,

```javascript    sourceQuality: 0.30,   // 🔥 High quality

const results = await retriever.getRelevant('recent articles', 5, {    contextRelevance: 0.05

  filters: { category: 'tech' },  // Object filter  }

  filter: (meta) => meta.year >= 2024,  // Function filter});

  minScore: 0.5  // Minimum similarity

});// Research Platform - Balanced

```const researchRetriever = new SmartRetriever(basicRetriever, {

  weights: DEFAULT_WEIGHTS  // Balanced approach

See [`example/06-advanced-filtering.js`](example/06-advanced-filtering.js) for more scenarios.});

```

---

#### Real-World Example

## 📄 Document Loading

See `example/11-decision-engine-pdf-real-world.js` for a complete example with:

```javascript- PDF document loading

import { loadDocument, loadDirectory } from 'quick-rag';- Multiple source types (official, blog, research, forum)

- 3 different scenarios (news, documentation, research)

// Single file (auto-detects type)- RAG generation with quality metrics

const doc = await loadDocument('./file.pdf');- Decision transparency and explanations



// Directory (filters by extension)**Benefits:**

const docs = await loadDirectory('./docs', {- ✅ More accurate retrieval than pure similarity

  extensions: ['.pdf', '.docx', '.xlsx', '.pptx']- ✅ Adapts to different content types automatically

});- ✅ Learns from user interactions

- ✅ Fully explainable decisions

// Add to vector store- ✅ Customizable for any use case

await store.addDocuments(docs);- ✅ Production-ready with proven patterns

```

### 🔍 Query Explainability (v1.1.0)

**Supported formats:****Understand WHY documents were retrieved** - A first-of-its-kind feature!

- 📕 PDF (`.pdf`) - requires `pdf-parse`

- 📘 Word (`.docx`) - requires `mammoth````javascript

- 📊 Excel (`.xlsx`, `.xls`) - requires `xlsx`const results = await retriever.getRelevant('What is Ollama?', 3, {

- 📽️ PowerPoint (`.pptx`, `.ppt`) - requires `officeparser`  explain: true

- 📝 Text (`.txt`)});

- 📋 Markdown (`.md`)

- 🌐 URLs (with `loadFromWeb`)// Each result includes detailed explanation:

console.log(results[0].explanation);

**Install optional loaders:**// {

```bash//   queryTerms: ["ollama", "local", "ai"],

npm install pdf-parse mammoth xlsx officeparser//   matchedTerms: ["ollama", "local"],

```//   matchCount: 2,

//   matchRatio: 0.67,

---//   cosineSimilarity: 0.856,

//   relevanceFactors: {

## 🧠 Decision Engine//     termMatches: 2,

//     semanticSimilarity: 0.856,

Multi-criteria scoring beyond simple similarity://     coverage: "67%"

//   }

```javascript// }

import { SmartRetriever } from 'quick-rag';```



const smartRetriever = new SmartRetriever(retriever, {**Use cases:** Debug searches, optimize queries, validate accuracy, explain to users

  weights: {

    semanticSimilarity: 0.40,  // 40%### 🎨 Dynamic Prompt Management (v1.1.0)

    keywordMatch: 0.25,        // 25%**10 built-in templates + full customization**

    recency: 0.20,             // 20%

    sourceQuality: 0.10,       // 10%```javascript

    contextRelevance: 0.05     // 5%// Quick template selection

  }await generateWithRAG(client, model, query, docs, {

});  template: 'conversational'  // or: technical, academic, code, etc.

});

const response = await smartRetriever.getRelevant('latest AI news', 3);

// System prompts for role definition

// See scoring breakdownawait generateWithRAG(client, model, query, docs, {

console.log(response.results[0].scoreBreakdown);  systemPrompt: 'You are a helpful programming tutor',

// {  template: 'instructional'

//   semanticSimilarity: { score: 0.85, contribution: 0.34 },});

//   keywordMatch: { score: 0.70, contribution: 0.175 },

//   recency: { score: 0.95, contribution: 0.19 },// Advanced: Reusable PromptManager

//   ...import { createPromptManager } from 'quick-rag';

// }

```const promptMgr = createPromptManager({

  systemPrompt: 'You are an expert engineer',

**Benefits:**  template: 'technical'

- ✅ More accurate than pure similarity});

- ✅ Prioritize recent content

- ✅ Boost trusted sourcesawait generateWithRAG(client, model, query, docs, {

- ✅ Full transparency  promptManager: promptMgr

});

See [`example/10-decision-engine-simple.js`](example/10-decision-engine-simple.js)```



---**Templates:** `default`, `conversational`, `technical`, `academic`, `code`, `concise`, `detailed`, `qa`, `instructional`, `creative`



## 🎨 Prompt Templates---



```javascript## 🚀 Quick Start

await generateWithRAG(client, model, query, docs, {

  template: 'technical'  // technical, academic, conversational, etc.### Option 1: With Official Ollama SDK (Recommended)

});

```javascript

// Custom system promptimport { 

await generateWithRAG(client, model, query, docs, {  OllamaRAGClient, 

  systemPrompt: 'You are a coding tutor',  createOllamaRAGEmbedding,

  template: 'instructional'  InMemoryVectorStore, 

});  Retriever 

```} from 'quick-rag';



**Available templates:**// 1. Initialize client (official SDK)

`default`, `conversational`, `technical`, `academic`, `code`, `concise`, `detailed`, `qa`, `instructional`, `creative`const client = new OllamaRAGClient({

  host: 'http://127.0.0.1:11434'

---});



## 🔍 Query Explainability// 2. Setup embedding

const embed = createOllamaRAGEmbedding(client, 'embeddinggemma');

```javascript

const results = await retriever.getRelevant('machine learning', 3, {// 3. Create vector store

  explain: trueconst vectorStore = new InMemoryVectorStore(embed);

});const retriever = new Retriever(vectorStore);



console.log(results[0].explanation);// 4. Add documents

// {await vectorStore.addDocument({ 

//   whyRetrieved: "Contains key terms: 'machine', 'learning', 'model'",  text: 'Ollama provides local LLM hosting.' 

//   confidence: "high",});

//   relevanceFactors: {

//     termMatches: 3,// 5. Query with streaming (official SDK feature!)

//     semanticSimilarity: 0.87const results = await retriever.getRelevant('What is Ollama?', 2);

//   }const context = results.map(d => d.text).join('\n');

// }

```const response = await client.chat({

  model: 'granite4:tiny-h',

---  messages: [{ 

    role: 'user', 

## 🌐 React Hook    content: `Context: ${context}\n\nQuestion: What is Ollama?` 

  }],

```jsx  stream: true, // Official SDK streaming!

import { useRag } from 'quick-rag/react';});



function ChatBot() {// Stream response

  const { query, response, loading } = useRag({for await (const part of response) {

    clientType: 'ollama',  process.stdout.write(part.message?.content || '');

    model: 'granite4:3b',}

    embeddingModel: 'nomic-embed-text'```

  });

---

  const handleSubmit = async (e) => {

    e.preventDefault();### Option 2: React with Vite

    await query(userInput);

  };**Step 1:** Create your project



  return (```bash

    <div>npm create vite@latest my-rag-app -- --template react

      {loading ? 'Thinking...' : response}cd my-rag-app

    </div>npm install quick-rag express concurrently

  );```

}

```**Step 2:** Create backend proxy (`server.js` in project root)



---```javascript

import express from 'express';

## 📖 API Referenceimport { OllamaRAGClient } from 'quick-rag';



### Core Classesconst app = express();

app.use(express.json());

- `OllamaRAGClient` - Ollama client with RAG features

- `LMStudioRAGClient` - LM Studio client with RAG featuresconst client = new OllamaRAGClient({ host: 'http://127.0.0.1:11434' });

- `InMemoryVectorStore` - Vector storage

- `Retriever` - Document retrievalapp.post('/api/generate', async (req, res) => {

- `SmartRetriever` - Advanced retrieval with Decision Engine  const { model = 'granite4:tiny-h', messages } = req.body;

  const response = await client.chat({ model, messages, stream: false });

### Functions  res.json({ response: response.message.content });

});

- `createOllamaRAGEmbedding(client, model)` - Create Ollama embedding

- `createLMStudioRAGEmbedding(client, model)` - Create LM Studio embeddingapp.post('/api/embed', async (req, res) => {

- `generateWithRAG(client, model, query, docs, options)` - Generate answer  const { model = 'embeddinggemma', input } = req.body;

- `loadDocument(path)` - Load single document  const response = await client.embed(model, input);

- `loadDirectory(path, options)` - Load multiple documents  res.json(response);

- `loadFromWeb(url)` - Load from URL});



[Full API documentation →](https://github.com/emredeveloper/quick-rag/wiki)app.listen(3001, () => console.log('🚀 Server: http://127.0.0.1:3001'));

```

---

**Step 3:** Configure Vite proxy (`vite.config.js`)

## 🤝 Contributing

```javascript

Contributions welcome! Please read our [Contributing Guide](CONTRIBUTING.md).import { defineConfig } from 'vite';

import react from '@vitejs/plugin-react';

## 📄 License

export default defineConfig({

MIT © [emredeveloper](https://github.com/emredeveloper)  plugins: [react()],

  server: {

## 🔗 Links    proxy: {

      '/api': {

- [NPM Package](https://www.npmjs.com/package/quick-rag)        target: 'http://127.0.0.1:3001',

- [GitHub Repository](https://github.com/emredeveloper/quick-rag)        changeOrigin: true

- [Examples](quickstart/)      }

- [Changelog](CHANGELOG.md)    }

- [Issues](https://github.com/emredeveloper/quick-rag/issues)  }

});

---```



**Made with ❤️ for the JavaScript & AI community****Step 4:** Update `package.json` scripts


```json
{
  "scripts": {
    "dev": "concurrently \"npm:server\" \"npm:client\"",
    "server": "node server.js",
    "client": "vite"
  }
}
```

**Step 5:** Use in your React component (`src/App.jsx`)

```jsx
import { useState, useEffect } from 'react';
import { useRAG, initRAG, createBrowserModelClient } from 'quick-rag';

const docs = [
  { id: '1', text: 'React is a JavaScript library for building user interfaces.' },
  { id: '2', text: 'Ollama provides local LLM hosting.' },
  { id: '3', text: 'RAG combines retrieval with AI generation.' }
];

export default function App() {
  const [rag, setRAG] = useState(null);
  const [query, setQuery] = useState('');
  
  const { run, loading, response, docs: results } = useRAG({
    retriever: rag?.retriever,
    modelClient: createBrowserModelClient(),
    model: 'granite4:tiny-h'
  });

  useEffect(() => {
    initRAG(docs, {
      baseEmbeddingOptions: {
        useBrowser: true,
        baseUrl: '/api/embed',
        model: 'embeddinggemma'
      }
    }).then(core => setRAG(core));
  }, []);

  return (
    <div style={{ padding: 40 }}>
      <h1>🤖 RAG Demo</h1>
      <input 
        value={query} 
        onChange={e => setQuery(e.target.value)}
        placeholder="Ask something..."
        style={{ width: 300, padding: 10 }}
      />
      <button onClick={() => run(query)} disabled={loading}>
        {loading ? 'Thinking...' : 'Ask AI'}
      </button>
      
      {results && (
        <div>
          <h3>📚 Retrieved:</h3>
          {results.map(d => <p key={d.id}>{d.text}</p>)}
        </div>
      )}
      
      {response && (
        <div>
          <h3>✨ Answer:</h3>
          <p>{response}</p>
        </div>
      )}
    </div>
  );
}
```

**Step 6:** Run your app

```bash
npm run dev
```

Open `http://localhost:5173` 🎉

---

### Option 2: Next.js (Pages Router)

**Step 1:** Create API routes

```javascript
// pages/api/generate.js
import { OllamaClient } from 'quick-rag';

export default async function handler(req, res) {
  const client = new OllamaClient();
  const { model = 'granite4:tiny-h', prompt } = req.body;
  const response = await client.generate(model, prompt);
  res.json({ response });
}
```

```javascript
// pages/api/embed.js
import { OllamaClient } from 'quick-rag';

export default async function handler(req, res) {
  const client = new OllamaClient();
  const { model = 'embeddinggemma', input } = req.body;
  const response = await client.embed(model, input);
  res.json(response);
}
```

**Step 2:** Use in your page (same React component as above)

---

### Option 3: Vanilla JavaScript (Node.js)

**Simple approach with official Ollama SDK:**

```javascript
import { 
  OllamaRAGClient, 
  createOllamaRAGEmbedding, 
  InMemoryVectorStore, 
  Retriever 
} from 'quick-rag';

// 1. Initialize client
const client = new OllamaRAGClient();

// 2. Setup embedding
const embed = createOllamaRAGEmbedding(client, 'embeddinggemma');

// 3. Create vector store and retriever
const vectorStore = new InMemoryVectorStore(embed);
const retriever = new Retriever(vectorStore);

// 4. Add documents
await vectorStore.addDocuments([
  { text: 'JavaScript is a programming language.' },
  { text: 'Python is great for data science.' },
  { text: 'Rust is a systems programming language.' }
]);

// 5. Query
const query = 'What is JavaScript?';
const results = await retriever.getRelevant(query, 2);

// 6. Generate answer
const context = results.map(d => d.text).join('\n');
const response = await client.chat({
  model: 'granite4:tiny-h',
  messages: [{ 
    role: 'user', 
    content: `Context:\n${context}\n\nQuestion: ${query}\n\nAnswer:` 
  }]
});

// Clean output
console.log('📚 Retrieved:', results.map(d => d.text));
console.log('🤖 Answer:', response.message.content);
```

**Output:**
```
📚 Retrieved: [
  'JavaScript is a programming language.',
  'Python is great for data science.'
]
🤖 Answer: JavaScript is a programming language that allows developers 
to write code and implement functionality in web browsers...
```

---

### Option 4: LM Studio 🎨

Use LM Studio instead of Ollama with OpenAI-compatible API:

```javascript
import { 
  LMStudioRAGClient, 
  createLMStudioRAGEmbedding, 
  InMemoryVectorStore, 
  Retriever, 
  generateWithRAG 
} from 'quick-rag';

// 1. Initialize LM Studio client
const client = new LMStudioRAGClient();

// 2. Setup embedding (use your embedding model from LM Studio)
const embed = createLMStudioRAGEmbedding(client, 'nomic-embed-text-v1.5');

// 3. Create vector store and retriever
const vectorStore = new InMemoryVectorStore(embed);
const retriever = new Retriever(vectorStore);

// 4. Add documents
await vectorStore.addDocuments([
  { text: 'LM Studio is a desktop app for running LLMs locally.' },
  { text: 'It provides an OpenAI-compatible API.' },
  { text: 'You can use models like Llama, Mistral, and more.' }
]);

// 5. Query with RAG
const results = await retriever.getRelevant('What is LM Studio?', 2);
const answer = await generateWithRAG(
  client,
  'qwen/qwen3-4b-2507', // or your model name
  'What is LM Studio?',
  results
);

console.log('Answer:', answer);
```

**Prerequisites for LM Studio:**

1. Download and install [LM Studio](https://lmstudio.ai)
2. Download a language model (e.g., Llama 3.2, Mistral)
3. Download an embedding model (e.g., nomic-embed-text)
4. Start the local server: `Developer > Local Server` (default: `http://localhost:1234`)

**For React projects:** Import from `'quick-rag/react'` to use hooks:

```javascript
import { useRAG } from 'quick-rag/react';
// or
import { useRAG } from 'quick-rag'; // Also works in React projects
```

---

## 📖 API Reference

### React Hook: `useRAG`

```javascript
const { run, loading, response, docs, streaming, error } = useRAG({
  retriever,        // Retriever instance
  modelClient,      // Model client (OllamaClient or BrowserModelClient)
  model            // Model name (e.g., 'granite4:tiny-h')
});

// Ask a question
await run('What is React?');

// With options
await run('What is React?', {
  topK: 5,           // Number of documents to retrieve
  stream: true,      // Enable streaming
  onDelta: (chunk, fullText) => console.log(chunk)
});
```

### Core Functions

**Initialize RAG**

```javascript
const { retriever, store, mrl } = await initRAG(documents, {
  defaultDim: 128,              // Embedding dimension
  k: 2,                         // Default number of results
  mrlBaseDim: 768,             // Base embedding dimension
  baseEmbeddingOptions: {
    useBrowser: true,           // Use browser-safe fetch
    baseUrl: '/api/embed',      // Embedding endpoint
    model: 'embeddinggemma'    // Embedding model
  }
});
```

**Generate with RAG**

```javascript
const result = await generateWithRAG({
  retriever,
  modelClient,
  model,
  query: 'Your question',
  topK: 3              // Optional: override default k
});

// Returns: { docs, response, prompt }
```

### VectorStore API

```javascript
const store = new InMemoryVectorStore(embeddingFn, { defaultDim: 128 });

// Add documents
await store.addDocument({ id: '1', text: 'Document text' });
await store.addDocuments([{ id: '1', text: '...' }], { dim: 128 });

// Query
const results = await store.similaritySearch('query', k, queryDim);

// CRUD
const doc = store.getDocument('id');
const all = store.getAllDocuments();
await store.updateDocument('id', 'new text', { meta: 'data' });
store.deleteDocument('id');
store.clear();
```

### Model Clients

**Browser (with proxy)**

```javascript
const client = createBrowserModelClient({
  endpoint: '/api/generate'  // Your proxy endpoint
});
```

**Node.js (direct)**

```javascript
const client = new OllamaClient({
  baseUrl: 'http://127.0.0.1:11434/api'
});
```

---

## 💡 Examples

### CRUD Operations

```javascript
// Add document dynamically
await store.addDocument({ 
  id: 'new-doc', 
  text: 'TypeScript adds types to JavaScript.' 
});

// Update existing
await store.updateDocument('1', 'React 19 is the latest version.', {
  version: '19',
  updated: Date.now()
});

// Delete
store.deleteDocument('2');

// Query all
const allDocs = store.getAllDocuments();
console.log(`Total documents: ${allDocs.length}`);
```

### Dynamic Retrieval

```javascript
// Ask with different topK values
const result1 = await run('What is JavaScript?', { topK: 1 }); // Get 1 doc
const result2 = await run('What is JavaScript?', { topK: 5 }); // Get 5 docs
```

### Streaming Responses

```javascript
await run('Explain React hooks', {
  stream: true,
  onDelta: (chunk, fullText) => {
    console.log('New chunk:', chunk);
    // Update UI in real-time
  }
});
```

### Custom Embedding Models

```javascript
// Use different embedding models
const rag = await initRAG(docs, {
  baseEmbeddingOptions: {
    useBrowser: true,
    baseUrl: '/api/embed',
    model: 'nomic-embed-text'  // or 'mxbai-embed-large', etc.
  }
});
```

**More examples:** Check the [`example/`](./example) folder for complete demos.

---

## 📄 Document Loaders (v0.7.4+)

Load documents from various formats and use them with RAG!

### Supported Formats

| Format | Function | Requires |
|--------|----------|----------|
| PDF | `loadPDF()` | `npm install pdf-parse` |
| Word (.docx) | `loadWord()` | `npm install mammoth` |
| Excel (.xlsx) | `loadExcel()` | `npm install xlsx` |
| Text (.txt) | `loadText()` | Built-in ✅ |
| JSON | `loadJSON()` | Built-in ✅ |
| Markdown | `loadMarkdown()` | Built-in ✅ |
| Web URLs | `loadURL()` | Built-in ✅ |

### Quick Start

**Load PDF:**
```javascript
import { loadPDF, chunkDocuments } from 'quick-rag';

// Load PDF
const pdf = await loadPDF('./document.pdf');
console.log(`Loaded ${pdf.meta.pages} pages`);

// Chunk and add to RAG
const chunks = chunkDocuments([pdf], { 
  chunkSize: 500, 
  overlap: 50 
});
await store.addDocuments(chunks);
```

**Load from URL:**
```javascript
import { loadURL } from 'quick-rag';

const doc = await loadURL('https://example.com', {
  extractText: true  // Convert HTML to plain text
});
await store.addDocuments([doc]);
```

**Load Directory:**
```javascript
import { loadDirectory } from 'quick-rag';

// Load all supported documents from a folder
const docs = await loadDirectory('./documents', {
  extensions: ['.pdf', '.docx', '.txt', '.md'],
  recursive: true
});

console.log(`Loaded ${docs.length} documents`);

// Chunk and add to vector store
const chunks = chunkDocuments(docs, { chunkSize: 500 });
await store.addDocuments(chunks);
```

**Auto-Detect Format:**
```javascript
import { loadDocument } from 'quick-rag';

// Automatically detects file type
const doc = await loadDocument('./file.pdf');
// Works with: .pdf, .docx, .xlsx, .txt, .md, .json
```

### Installation

```bash
# Core package (includes text, JSON, markdown, URL loaders)
npm install quick-rag

# Optional: PDF support
npm install pdf-parse

# Optional: Word support
npm install mammoth

# Optional: Excel support
npm install xlsx

# Or install all at once:
npm install quick-rag pdf-parse mammoth xlsx
```

### Complete Example

```javascript
import {
  loadPDF,
  loadDirectory,
  chunkDocuments,
  InMemoryVectorStore,
  Retriever,
  OllamaRAGClient,
  createOllamaRAGEmbedding,
  generateWithRAG
} from 'quick-rag';

// Load documents
const pdf = await loadPDF('./research.pdf');
const docs = await loadDirectory('./articles');

// Combine and chunk
const allDocs = [pdf, ...docs];
const chunks = chunkDocuments(allDocs, { 
  chunkSize: 500,
  overlap: 50 
});

// Setup RAG
const client = new OllamaRAGClient();
const embed = createOllamaRAGEmbedding(client, 'embeddinggemma');
const store = new InMemoryVectorStore(embed);
const retriever = new Retriever(store);

// Add to vector store
await store.addDocuments(chunks);

// Query
const results = await retriever.getRelevant('What is the main topic?', 3);
const answer = await generateWithRAG(client, 'granite4:tiny-h', 
  'What is the main topic?', results);

console.log(answer);
```

**See full example:** [`example/advanced/document-loading-example.js`](./example/advanced/document-loading-example.js)

---

## ❓ Troubleshooting

| Problem | Solution |
|---------|----------|
| 🚫 **CORS errors** | Use a proxy server (Express/Next.js API routes) |
| 🔌 **Connection refused** | Ensure Ollama is running: `ollama serve` |
| 📦 **Models not found** | Pull models: `ollama pull granite4:tiny-h && ollama pull embeddinggemma` |
| 🌐 **404 on `/api/embed`** | Check your proxy configuration in `vite.config.js` or API routes |
| 💻 **Windows IPv6 issues** | Use `127.0.0.1` instead of `localhost` |
| 📦 **Module not found** | Check imports: use `'quick-rag'` not `'quick-rag/...'` |

> **Note:** v0.6.5+ automatically detects and uses the correct API (generate or chat) for any model.

---

## 📚 Learn More

- **Examples:** [`/example`](./example) folder with working demos
- **Changelog:** [`CHANGELOG.md`](./CHANGELOG.md) - version history
- **Ollama Models:** [ollama.ai/library](https://ollama.ai/library)
- **Issues:** [GitHub Issues](https://github.com/emredeveloper/rag-js-local/issues)

---

## 📄 License

MIT © [Emre Developer](https://github.com/emredeveloper)

---

**Made with ❤️ for the JavaScript & AI community**
