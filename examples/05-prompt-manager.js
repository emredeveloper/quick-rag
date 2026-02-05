import {
  PromptManager,
  PromptTemplates,
  generateWithRAG
} from 'quick-rag';

const docs = [
  { id: '1', text: 'RAG = Retrieval-Augmented Generation.' },
  { id: '2', text: 'Retriever finds documents before generation.' }
];

const promptManager = new PromptManager({
  template: 'concise',
  systemPrompt: 'Answer in Turkish, short and direct.'
});

const fakeClient = {
  async generate({ prompt }) {
    return { response: `FAKE_MODEL_OUTPUT\n${prompt.slice(0, 120)}...` };
  }
};

const out1 = await generateWithRAG(fakeClient, 'demo', 'RAG nedir?', docs, { promptManager });
console.log('promptManager output:\n', out1.response);

const out2 = await generateWithRAG(fakeClient, 'demo', 'RAG nedir?', docs, {
  template: PromptTemplates.technical,
  systemPrompt: 'Only bullet points.'
});
console.log('\ntechnical template output:\n', out2.response);
