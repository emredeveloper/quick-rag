import { InMemoryVectorStore } from '../src/vectorStore.js';
import { Retriever } from '../src/retriever.js';
import dummyEmbedding from '../src/embeddings/dummyEmbedding.js';
import OllamaClient from '../src/ollamaClient.js';
import { createOllamaEmbedding } from '../src/embeddings/ollamaEmbedding.js';
import readline from 'readline';

async function main() {
  // If OLLAMA_TEST=1, use Ollama's `embeddinggemma` model for embeddings, otherwise use the dummy.
  const useOllama = process.env.OLLAMA_TEST === '1';
  const embeddingFn = useOllama ? createOllamaEmbedding({}) : dummyEmbedding;
  const store = new InMemoryVectorStore(embeddingFn);
  await store.addDocuments([
    { id: '1', text: 'React is a JavaScript library for building user interfaces.' },
    { id: '2', text: 'Ollama provides local LLM hosting.' },
    { id: '3', text: 'RAG uses retrieval to augment model responses.' }
  ]);

  const retriever = new Retriever(store, { k: 2 });
  // get query from CLI args or stdin
  const cliArg = process.argv.slice(2).join(' ').trim();
  const query = cliArg || await (async () => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = await new Promise(resolve => rl.question('Enter your prompt: ', a => { rl.close(); resolve(a); }));
    return answer.trim();
  })();
  if (!query) {
    console.error('No prompt provided. Exit.');
    process.exit(1);
  }
  const docs = await retriever.getRelevant(query);

  console.log('Retrieved docs:');
  console.log(docs.map(d => ({ id: d.id, score: d.score, text: d.text })));

  const context = docs.map((d, i) => `Doc ${i + 1} (score=${(d.score || 0).toFixed(3)}):\n${d.text}`).join('\n\n');
  const prompt = `Context:\n${context}\n\nUser: ${query}\nAssistant:`;

  console.log('\n--- Prompt to model ---\n');
  console.log(prompt);

  if (useOllama) {
    console.log('\nCalling local Ollama (model: granite4:tiny-h)...');
    const client = new OllamaClient();
    try {
      // default main model recommendation: 'granite4:tiny-h'
      const modelName = process.env.OLLAMA_MODEL || 'granite4:tiny-h';
      const raw = await client.generate(modelName, prompt);

      // If the API returned a streaming/text blob containing multiple JSON objects
      // (one per line), parse each JSON object and concatenate the `response` fields
      // to produce a readable final response.
      const aggregate = (() => {
        if (!raw) return { text: '', parts: [] };
        // If it's already an object with `response` and `done`, handle simply
        if (typeof raw === 'object' && raw.response) return { text: String(raw.response), parts: [raw] };
        if (typeof raw === 'string') {
          const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
          const parts = [];
          for (const l of lines) {
            try {
              const obj = JSON.parse(l);
              parts.push(obj);
            } catch (e) {
              // ignore non-json lines
            }
          }
          const text = parts.map(p => (p.response || '')).join('');
          return { text, parts };
        }
        return { text: String(raw), parts: [] };
      })();

      console.log('Model response (concise):');
      console.log(aggregate.text);

      // Simple automatic evaluation
      const avgDocScore = docs.reduce((s, d) => s + (d.score || 0), 0) / (docs.length || 1);
      const queryWords = Array.from(new Set(query.toLowerCase().split(/\W+/).filter(Boolean)));
      const responseWords = aggregate.text.toLowerCase().split(/\W+/).filter(Boolean);
      const overlapCount = queryWords.filter(w => responseWords.includes(w)).length;
      const overlapRatio = queryWords.length ? overlapCount / queryWords.length : 0;

      const autoEval = {
        avgDocScore: Number(avgDocScore.toFixed(3)),
        overlapRatio: Number(overlapRatio.toFixed(3)),
        pass: overlapRatio > 0.2 || avgDocScore > 0.4,
      };

      console.log('\nAutomatic evaluation:');
      console.log(autoEval);

      if (aggregate.parts && aggregate.parts.length) {
        const last = aggregate.parts[aggregate.parts.length - 1];
        console.log('\nModel metadata (last chunk):');
        console.log({ model: last.model, done: last.done, done_reason: last.done_reason });
      }

      // Optional model-based evaluation (enable with OLLAMA_EVAL=1)
      if (process.env.OLLAMA_EVAL === '1') {
        try {
          const evalPrompt = `You are an evaluator. User question: ${query}\n\nContext:\n${docs.map((d, i) => `Doc ${i+1}: ${d.text}`).join('\n')}\n\nAssistant response:\n${aggregate.text}\n\nPlease rate the assistant response on a scale 1-5 for relevance and correctness, return only JSON: {"score":<1-5>,"note":"brief note"}`;
          const evalModel = process.env.OLLAMA_EVAL_MODEL || (process.env.OLLAMA_MODEL || 'granite4:tiny-h');
          const evalRaw = await client.generate(evalModel, evalPrompt);
          // try to parse evalRaw similarly
          let evalText = '';
          if (typeof evalRaw === 'string') {
            // try to find JSON in lines
            const lines = evalRaw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
            for (const l of lines) {
              try { const j = JSON.parse(l); evalText = JSON.stringify(j); break; } catch {};
            }
            if (!evalText) evalText = lines.join(' ');
          } else if (evalRaw && evalRaw.response) {
            evalText = String(evalRaw.response);
          } else if (typeof evalRaw === 'object') {
            evalText = JSON.stringify(evalRaw);
          } else {
            evalText = String(evalRaw);
          }
          console.log('\nModel-based evaluation:');
          console.log(evalText);
        } catch (errEval) {
          console.error('Model-based evaluation failed:', errEval && errEval.message ? errEval.message : errEval);
        }
      }
    } catch (err) {
      console.error('Ollama call failed:', err && err.message ? err.message : err);
    }
  } else {
    console.log('\nSkipped actual model call. To enable set environment variable OLLAMA_TEST=1 and ensure a local Ollama server is running.');
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
