import {
  ConversationManager,
  getContextLimit,
  extractiveSummarize
} from 'quick-rag';

const cm = new ConversationManager({
  maxTokens: getContextLimit('llama3'),
  autoSummarize: false,
  systemPrompt: 'You are a concise assistant.'
});

cm.addUserMessage('RAG nedir?');
cm.addAssistantMessage('RAG, retrieval ve generation birlesimidir.');
cm.addUserMessage('Ne zaman kullanmaliyim?');
cm.addAssistantMessage('Bilgi tabanindan dogru cevap cekmek istediginde.');

const context = cm.getContext();
const summary = extractiveSummarize(cm.messages.map((m) => m.content).join('\n'), { maxSentences: 2 });

console.log('context messages:', context.length);
console.log('summary:', summary);
