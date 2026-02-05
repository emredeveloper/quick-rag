# Examples

Kurulum:

```bash
cd examples
npm install
```

Calistirma:

```bash
npm run core
npm run init
npm run ollama
npm run lmstudio
npm run prompt
npm run search
npm run cache
npm run conversation
npm run evaluation
npm run decision
npm run loaders
npm run stores
npm run query
```

Provider gerektirenler:

- `npm run ollama` -> `ollama serve`, `qwen3-embedding:0.6b`, `granite4:3b`
- `npm run lmstudio` -> LM Studio server + `text-embedding-embeddinggemma-300m` + `google/gemma-3-4b`
