/**
 * Example 11: Real-World Scenario - Smart Retrieval with PDF Documents
 * 
 * This example demonstrates a REAL use case:
 * - Loading data from PDF documents
 * - Documents from different sources (official, blog, forum, research)
 * - Smart retrieval to select the most relevant documents
 * - Customized weights for different scenarios
 */

import {
  OllamaRAGClient,
  createOllamaRAGEmbedding,
  LMStudioRAGClient,
  createLMStudioRAGEmbedding,
  InMemoryVectorStore,
  Retriever,
  generateWithRAG,
  loadPDF,
  loadText,
  loadDirectory,
  SmartRetriever,
  WeightedDecisionEngine,
  DEFAULT_WEIGHTS
} from '../src/index.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ═══════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════
const USE_LMSTUDIO = false; // Set to true to use LM Studio
const PDF_FOLDER = path.join(__dirname, 'PDF'); // PDF folder

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📚 REAL-WORLD SCENARIO: SMART RETRIEVAL WITH PDF DOCUMENTS');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // ─────────────────────────────────────────────────────────────────
  // 1. System Setup
  // ─────────────────────────────────────────────────────────────────
  console.log('🔧 STEP 1: System Setup\n');
  
  let client, embed, modelName;
  if (USE_LMSTUDIO) {
    console.log('   ✓ Using LM Studio');
    client = new LMStudioRAGClient({ baseUrl: 'ws://127.0.0.1:1234' });
    embed = createLMStudioRAGEmbedding(client, 'text-embedding-embeddinggemma-300m');
    modelName = 'lmstudio-model';
  } else {
    console.log('   ✓ Using Ollama');
    client = new OllamaRAGClient();
    embed = createOllamaRAGEmbedding(client, 'nomic-embed-text');
    modelName = 'granite4:3b';
  }

  const store = new InMemoryVectorStore(embed);
  const basicRetriever = new Retriever(store, { k: 10 });
  
  console.log('   ✓ Vector store ready');
  console.log('   ✓ Basic retriever ready\n');

  // ─────────────────────────────────────────────────────────────────
  // 2. Loading PDF Documents
  // ─────────────────────────────────────────────────────────────────
  console.log('📄 STEP 2: Loading Documents\n');
  
  let documents = [];
  let pdfCount = 0;

  try {
    console.log(`   🔍 Checking PDF folder: ${PDF_FOLDER}`);
    
    // Load all documents from PDF folder
    const pdfDocs = await loadDirectory(PDF_FOLDER, {
      recursive: true,
      extensions: ['.pdf', '.txt', '.md']
    });
    
    if (pdfDocs.length > 0) {
      console.log(`   ✓ Found ${pdfDocs.length} PDF/documents\n`);
      
      // Add metadata to each PDF (source, date, quality)
      pdfDocs.forEach((doc, i) => {
        // Extract metadata from filename
        const filename = doc.meta?.source || `document-${i}`;
        
        // Real-world scenario: Simulate different source types
        let sourceType, quality, date;
        
        if (filename.toLowerCase().includes('official') || filename.toLowerCase().includes('documentation')) {
          sourceType = 'official';
          quality = 'high';
          date = '2024-01-15'; // Official documentation might be somewhat old
        } else if (filename.toLowerCase().includes('research') || filename.toLowerCase().includes('paper')) {
          sourceType = 'research';
          quality = 'high';
          date = '2024-06-01'; // Research paper medium recency
        } else if (filename.toLowerCase().includes('blog') || filename.toLowerCase().includes('tutorial')) {
          sourceType = 'blog';
          quality = 'medium';
          date = '2024-10-15'; // Blog posts more recent
        } else if (filename.toLowerCase().includes('forum') || filename.toLowerCase().includes('discussion')) {
          sourceType = 'forum';
          quality = 'low';
          date = '2024-11-01'; // Forum posts very recent
        } else {
          // Default metadata
          sourceType = 'documentation';
          quality = 'high';
          date = '2024-03-20';
        }
        
        doc.meta = {
          ...doc.meta,
          source: sourceType,
          quality: quality,
          date: date,
          filename: filename
        };
        
        console.log(`   ${i + 1}. ${filename}`);
        console.log(`      📍 Source: ${sourceType} (${quality})`);
        console.log(`      📅 Date: ${date}`);
        console.log(`      📏 Length: ${doc.text.length} characters\n`);
      });
      
      documents = pdfDocs;
      pdfCount = pdfDocs.length;
    } else {
      console.log('   ⚠️  No documents found in PDF folder');
      console.log('   📝 Continuing with demo data...\n');
    }
  } catch (error) {
    console.log(`   ⚠️  Could not load PDF: ${error.message}`);
    console.log('   📝 Continuing with demo data...\n');
  }

  // If no PDFs or too few, add demo documents
  if (documents.length < 3) {
    console.log('   📝 Adding demo documents...\n');
    
    const demoDocs = [
      {
        text: `Python 3.12 Official Release Notes
        
Python 3.12 is the latest major release of the Python programming language, released in October 2023.

Major Features:
- Performance improvements: 5-10% faster than Python 3.11
- Better error messages with enhanced tracebacks
- Type parameter syntax (PEP 695)
- Override decorator for methods (PEP 698)
- Buffer protocol improvements
- Linux perf profiler support

New Syntax Features:
The new type parameter syntax makes generic classes and functions easier to define:
def max[T](args: Iterable[T]) -> T:
    ...

Performance Enhancements:
- Comprehensions are now inlined, providing significant speedups
- The immortal objects optimization reduces memory overhead
- Tier 2 adaptive specialization improves loop performance

Security Updates:
- hashlib now defaults to OpenSSL 3.0
- ssl module improvements for modern TLS
- pathlib security enhancements

This release represents a major step forward in Python's evolution.`,
        meta: {
          source: 'official',
          quality: 'high',
          date: '2023-10-15',
          filename: 'python-3.12-official-release-notes.txt',
          topic: 'python',
          version: '3.12'
        }
      },
      {
        text: `Python Tutorial for Beginners - Getting Started

Hey everyone! I just started learning Python last month and I wanted to share my experience.

Why Python?
Python is super easy to learn! The syntax is clean and readable. I tried Java before but it was too complicated.

My First Week:
- Installed Python from python.org
- Learned variables and data types
- Made a simple calculator program
- Really fun!

Cool Things I Built:
1. Calculator app
2. To-do list
3. Simple web scraper (copied from tutorial)

Tips for Beginners:
- Start with basics, don't rush
- Practice every day
- Use online tutorials (YouTube is great!)
- Don't worry about advanced stuff yet

I'm not an expert but Python is definitely beginner-friendly. Check out my blog for more tips!

Update: I heard Python 3.12 is out but I'm still using 3.10. Should I upgrade?`,
        meta: {
          source: 'blog',
          quality: 'medium',
          date: '2024-10-28',
          filename: 'python-beginner-tutorial-blog.txt',
          topic: 'python',
          author: 'beginner'
        }
      },
      {
        text: `Research Paper: Performance Analysis of Python 3.12

Abstract:
This paper presents a comprehensive performance analysis of Python 3.12, comparing it with previous versions 3.11 and 3.10. Our benchmarks demonstrate significant improvements in execution speed and memory efficiency.

Methodology:
We conducted extensive benchmarks using the Python Performance Benchmark Suite, testing across various workloads including:
- Computational intensive tasks
- I/O operations
- Memory-intensive applications
- Web framework performance

Key Findings:
1. Overall Performance: 7.5% average improvement over 3.11
2. Comprehension Inlining: Up to 40% faster in tight loops
3. Memory Usage: 12% reduction in baseline memory footprint
4. Startup Time: 15% faster cold starts

Detailed Analysis:
The immortal objects optimization significantly reduces reference counting overhead. Our measurements show this contributes approximately 3% of the overall performance gain.

The new specialized bytecode opcodes provide targeted optimizations for common patterns. Function calls see a 5-8% speedup in microbenchmarks.

Conclusions:
Python 3.12 represents a substantial engineering achievement. The performance improvements make it suitable for more demanding production workloads while maintaining backward compatibility.

Future Work:
Further investigation into the Tier 2 optimizer shows promise for additional gains in subsequent releases.`,
        meta: {
          source: 'research',
          quality: 'high',
          date: '2024-01-20',
          filename: 'python-3.12-performance-research-paper.txt',
          topic: 'python',
          type: 'research',
          citations: 15
        }
      },
      {
        text: `Forum Discussion: Python Version Confusion

Thread: "Which Python version should I use???"

User1: Hey guys, I'm confused about Python versions. Should I use Python 3.10, 3.11, or wait for 3.12?

User2: Just use whatever is latest bro. Probably 3.12?

User3: I'm still on 2.7 lol, works fine for me

User1: @User3 isn't Python 2 dead?

User4: Yeah don't use Python 2! Use 3.11, it's stable. I heard 3.12 has bugs.

User5: @User4 No bugs in 3.12, I've been using it for a month. It's faster!

User1: But is it compatible with all libraries?

User6: Most popular libraries support 3.12 now. NumPy, pandas, requests all work.

User2: Just install Anaconda, it handles everything for you

User7: Or use pyenv to manage multiple versions

User1: This is getting complicated... Maybe I'll just stick with 3.10?

User8: 3.10 is fine but you're missing out on new features. Just go with 3.11 or 3.12.

Moderator: Locking this thread, too many opinions. Check official docs for version info.`,
        meta: {
          source: 'forum',
          quality: 'low',
          date: '2024-11-04',
          filename: 'python-version-forum-discussion.txt',
          topic: 'python',
          platform: 'reddit'
        }
      },
      {
        text: `Python 3.11 Documentation: What's New

Python 3.11 is a major new release of the Python programming language, released in October 2022.

Summary – Release Highlights:
- Much faster CPython (10-60% faster than 3.10)
- Better error messages with precise error locations
- Exception groups and except*
- Asynchronous comprehensions in asyncio
- TOML configuration file parser in standard library

Performance Improvements:
Python 3.11 is between 10-60% faster than Python 3.10 according to the unified benchmark suite. The average speedup is 25%.

Faster Startup:
CPython 3.11 starts up to 10-15% faster than 3.10.

Enhanced Error Messages:
Fine-grained error locations in tracebacks help developers identify issues faster:

Traceback (most recent call last):
  File "example.py", line 3, in <module>
    print(x["key"]["nested"])
          ~~~~~~~^^^^^^^^
KeyError: 'nested'

Exception Groups:
The new except* syntax allows handling multiple exceptions:

try:
    ...
except* ValueError as e:
    ...
except* KeyError as e:
    ...

Standard Library Additions:
- tomllib: TOML parser
- typing improvements
- asyncio.TaskGroup

This version is recommended for all new projects.`,
        meta: {
          source: 'documentation',
          quality: 'high',
          date: '2022-10-24',
          filename: 'python-3.11-documentation.txt',
          topic: 'python',
          version: '3.11'
        }
      },
      {
        text: `Tech Blog: Latest Python Releases and Updates

Python 3.12 Released with Major Performance Boosts

The Python Software Foundation announced the release of Python 3.12 last month, bringing significant performance improvements and new features to the popular programming language.

Performance Gains:
According to official benchmarks, Python 3.12 is approximately 5-10% faster than its predecessor, Python 3.11, which was already 25% faster than 3.10. These cumulative improvements make Python increasingly competitive for performance-critical applications.

New Features Highlight:
The standout feature is the new type parameter syntax, making generic types much easier to write. The old way required verbose TypeVar declarations, but now you can simply use:

def process[T](items: list[T]) -> T:
    ...

Developer Experience:
Error messages continue to improve, building on 3.11's enhanced tracebacks. The Python team has focused heavily on making debugging easier for newcomers.

Community Response:
The Python community has responded positively to the release. Major frameworks like Django, Flask, and FastAPI have already released compatible versions.

Adoption Timeline:
While Python 3.12 is production-ready, many organizations will likely wait 3-6 months for the ecosystem to fully mature before upgrading critical systems.

Async Improvements:
The asyncio module received several enhancements, making async Python code more efficient and easier to debug.

Looking Ahead:
The Python steering council has outlined ambitious goals for Python 3.13, including continued performance work and potential JIT compilation experiments.

Recommendation:
For new projects, Python 3.12 is recommended. For existing projects, plan migration over the next few months as dependencies update.`,
        meta: {
          source: 'blog',
          quality: 'medium',
          date: '2024-11-01',
          filename: 'tech-blog-python-releases.txt',
          topic: 'python',
          author: 'tech-writer'
        }
      }
    ];
    
    documents = [...documents, ...demoDocs];
    
    demoDocs.forEach((doc, i) => {
      console.log(`   ${pdfCount + i + 1}. ${doc.meta.filename}`);
      console.log(`      📍 Source: ${doc.meta.source} (${doc.meta.quality})`);
      console.log(`      📅 Date: ${doc.meta.date}`);
      console.log(`      📏 Length: ${doc.text.length} characters\n`);
    });
  }

  // Add documents to vector store
  console.log(`   💾 Adding total ${documents.length} documents to vector store...\n`);
  
  for (const doc of documents) {
    await store.addDocuments([doc]);
  }
  
  console.log(`   ✅ Successfully added ${documents.length} documents!\n`);

  // ─────────────────────────────────────────────────────────────────
  // 3. Test Queries
  // ─────────────────────────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🔍 STEP 3: Test Different Query Types');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const testQueries = [
    {
      query: 'What are the latest Python features and performance improvements?',
      scenario: 'NEWS/RECENCY',
      description: 'User wants to learn about the latest features',
      weights: {
        semanticSimilarity: 0.35,
        keywordMatch: 0.15,
        recency: 0.35,          // Recency VERY important
        sourceQuality: 0.10,
        contextRelevance: 0.05
      }
    },
    {
      query: 'Python 3.12 official documentation and specifications',
      scenario: 'OFFICIAL DOCUMENTATION',
      description: 'User looking for reliable, official information',
      weights: {
        semanticSimilarity: 0.35,
        keywordMatch: 0.20,
        recency: 0.10,
        sourceQuality: 0.30,    // Source quality VERY important
        contextRelevance: 0.05
      }
    },
    {
      query: 'Python version comparison and upgrade guide',
      scenario: 'RESEARCH/ANALYSIS',
      description: 'User wants detailed comparison',
      weights: DEFAULT_WEIGHTS  // Balanced approach
    }
  ];

  for (const test of testQueries) {
    console.log(`\n${'─'.repeat(67)}`);
    console.log(`📝 QUERY: "${test.query}"`);
    console.log(`🎯 SCENARIO: ${test.scenario}`);
    console.log(`💭 DESCRIPTION: ${test.description}\n`);

    // Normal retrieval
    console.log('📊 NORMAL Retrieval (Similarity Only):');
    const normalResults = await basicRetriever.getRelevant(test.query, 3);
    normalResults.forEach((doc, i) => {
      console.log(`   ${i + 1}. [${doc.meta.source}] Score: ${doc.score.toFixed(3)}`);
      console.log(`      📅 ${doc.meta.date} | 📄 ${doc.meta.filename}`);
      console.log(`      "${doc.text.substring(0, 80).replace(/\n/g, ' ')}..."\n`);
    });

    // Smart retrieval
    console.log(`\n🧠 SMART Retrieval (${test.scenario}):`);
    console.log('   Weights:', test.weights);
    
    const smartRetriever = new SmartRetriever(basicRetriever, {
      weights: test.weights
    });
    
    const smartResults = await smartRetriever.getRelevant(test.query, 3);
    
    smartResults.results.forEach((doc, i) => {
      console.log(`\n   ${i + 1}. [${doc.meta.source}] Weighted Score: ${doc.weightedScore.toFixed(3)}`);
      console.log(`      📅 ${doc.meta.date} | 📄 ${doc.meta.filename}`);
      console.log(`      "${doc.text.substring(0, 80).replace(/\n/g, ' ')}..."`);
      
      const breakdown = doc.scoreBreakdown;
      console.log(`      ┌─ Detail:`);
      console.log(`      │  Similarity: ${breakdown.semanticSimilarity.contribution.toFixed(3)}`);
      console.log(`      │  Keyword: ${breakdown.keywordMatch.contribution.toFixed(3)}`);
      console.log(`      │  Recency: ${breakdown.recency.contribution.toFixed(3)}`);
      console.log(`      │  Quality: ${breakdown.sourceQuality.contribution.toFixed(3)}`);
      console.log(`      └─ TOTAL: ${doc.weightedScore.toFixed(3)}`);
    });

    // Comparison
    console.log(`\n   📊 Comparison:`);
    console.log(`   ┌────────────────┬──────────────┬─────────────┐`);
    console.log(`   │ Rank           │ NORMAL       │ SMART       │`);
    console.log(`   ├────────────────┼──────────────┼─────────────┤`);
    for (let i = 0; i < 3; i++) {
      const normalSource = normalResults[i].meta.source.padEnd(12);
      const smartSource = smartResults.results[i].meta.source.padEnd(11);
      console.log(`   │ ${i + 1}. rank         │ ${normalSource} │ ${smartSource} │`);
    }
    console.log(`   └────────────────┴──────────────┴─────────────┘`);

    if (smartResults.decisions.suggestions.length > 0) {
      console.log(`\n   💡 System Recommendations:`);
      smartResults.decisions.suggestions.forEach(s => console.log(`      • ${s}`));
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // 4. RAG Answer Generation
  // ─────────────────────────────────────────────────────────────────
  console.log('\n\n═══════════════════════════════════════════════════════════════');
  console.log('🤖 STEP 4: RAG Answer Generation with Smart Retrieval');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const userQuestion = 'What are the main differences between Python 3.11 and 3.12?';
  console.log(`❓ User Question: "${userQuestion}"\n`);

  // Retrieval with balanced weights
  const smartRetriever = new SmartRetriever(basicRetriever, {
    weights: DEFAULT_WEIGHTS,
    enableLearning: true
  });

  console.log('🔍 Performing smart document selection...\n');
  const relevantDocs = await smartRetriever.getRelevant(userQuestion, 3);

  console.log('📚 Selected Documents:');
  relevantDocs.results.forEach((doc, i) => {
    console.log(`   ${i + 1}. [${doc.meta.source}] ${doc.meta.filename}`);
    console.log(`      Score: ${doc.weightedScore.toFixed(3)} | Date: ${doc.meta.date}`);
  });

  if (relevantDocs.decisions.suggestions.length > 0) {
    console.log(`\n💡 System Analysis:`);
    relevantDocs.decisions.suggestions.forEach(s => console.log(`   • ${s}`));
  }

  console.log('\n🤖 LLM generating answer...\n');
  console.log('─'.repeat(67));

  try {
    const answer = await generateWithRAG(
      client,
      modelName,
      userQuestion,
      relevantDocs.results.map(d => d.text),
      {
        systemPrompt: 'You are a helpful Python expert. Provide accurate, well-structured answers based on the given context.',
        template: 'technical'
      }
    );

    console.log(answer.response);
  } catch (error) {
    console.log(`⚠️  LLM could not generate response: ${error.message}`);
    console.log('   However, document selection was successful!');
  }

  console.log('\n─'.repeat(67));

  // Quality metrics
  console.log('\n📊 Answer Quality Indicators:');
  const avgQuality = relevantDocs.results.reduce((sum, d) => 
    sum + d.scoreBreakdown.sourceQuality.score, 0) / relevantDocs.results.length;
  const avgRecency = relevantDocs.results.reduce((sum, d) => 
    sum + d.scoreBreakdown.recency.score, 0) / relevantDocs.results.length;
  const avgSimilarity = relevantDocs.results.reduce((sum, d) => 
    sum + d.scoreBreakdown.semanticSimilarity.score, 0) / relevantDocs.results.length;

  console.log(`   📈 Avg Source Quality: ${avgQuality.toFixed(3)}`);
  console.log(`   📅 Avg Recency: ${avgRecency.toFixed(3)}`);
  console.log(`   🎯 Avg Similarity: ${avgSimilarity.toFixed(3)}`);
  console.log(`   📚 Documents Used: ${relevantDocs.results.length}`);

  // Source distribution
  const sources = {};
  relevantDocs.results.forEach(d => {
    sources[d.meta.source] = (sources[d.meta.source] || 0) + 1;
  });
  console.log('\n   📊 Source Distribution:');
  Object.entries(sources).forEach(([source, count]) => {
    console.log(`      • ${source}: ${count} document(s)`);
  });

  // ─────────────────────────────────────────────────────────────────
  // 5. SUMMARY
  // ─────────────────────────────────────────────────────────────────
  console.log('\n\n═══════════════════════════════════════════════════════════════');
  console.log('📋 SUMMARY AND RESULTS');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('✅ Tested Features:\n');
  console.log('   1️⃣  PDF/Document Loading');
  console.log(`      • Documents loaded: ${documents.length}`);
  console.log(`      • Loaded from PDF: ${pdfCount}`);
  console.log(`      • Demo documents: ${documents.length - pdfCount}\n`);

  console.log('   2️⃣  Different Scenarios');
  console.log('      • News/Recency scenario (recency priority)');
  console.log('      • Official Documentation scenario (quality priority)');
  console.log('      • Research/Analysis scenario (balanced)\n');

  console.log('   3️⃣  Smart Features');
  console.log('      • Multi-criteria scoring (5 factors)');
  console.log('      • Customizable weights');
  console.log('      • Source quality assessment');
  console.log('      • Recency scoring');
  console.log('      • Detailed score breakdown\n');

  console.log('   4️⃣  RAG Integration');
  console.log('      • Smart document selection');
  console.log('      • LLM answer generation');
  console.log('      • Quality metrics\n');

  console.log('🎯 Real-World Advantages:\n');
  console.log('   ✅ Works with PDF and text documents');
  console.log('   ✅ Distinguishes different source types');
  console.log('   ✅ Prioritizes based on scenario');
  console.log('   ✅ Prefers reliable and recent information');
  console.log('   ✅ Transparent and explainable results');
  console.log('   ✅ Flexible and customizable\n');

  console.log('💡 Use Cases:\n');
  console.log('   📰 News platforms → Recency-focused');
  console.log('   📚 Documentation sites → Quality-focused');
  console.log('   🔬 Research platforms → Balanced approach');
  console.log('   💼 Enterprise knowledge base → Reliability-focused');
  console.log('   🎓 Educational platforms → Multi-criteria\n');

  console.log('🚀 Quick RAG - Production-ready Intelligent Retrieval!\n');
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
});
