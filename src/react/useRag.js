import { useState, useCallback } from 'react';

// useRAG hook: accepts { retriever, modelClient, model, promptTemplate }
// returns { run, loading, error, response, docs }
export function useRAG({ retriever, modelClient, model, promptTemplate }) {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [response, setResponse] = useState(null);
	const [streaming, setStreaming] = useState(false);
	const [docs, setDocs] = useState([]);

	const run = useCallback(async (query, options = {}) => {
		setLoading(true);
		setError(null);
		try {
			const { generateWithRAG } = await import('../rag.js');
			
			// Get relevant documents first
			const topK = options.topK || 3;
			const relevantDocs = await retriever.getRelevant(query, topK);
			setDocs(relevantDocs);
			
			// Build prompt
			const context = relevantDocs.map(d => d.text).join('\n\n');
			const defaultTemplate = (docs, q) => 
				`Context:\n${docs.map(d => d.text).join('\n\n')}\n\nQuestion: ${q}\n\nAnswer based on the context:`;
			const template = promptTemplate || defaultTemplate;
			const prompt = template(relevantDocs, query);
			
			// If streaming requested, use official SDK streaming API
			if (options.stream) {
				setStreaming(true);
				setResponse('');
				let acc = '';
				
				// Detect client type and use appropriate streaming API
				const clientName = modelClient.constructor.name;
				
				if (clientName === 'OllamaRAGClient' || clientName === 'OllamaClient') {
					// Use Ollama official SDK streaming
					const streamResponse = await modelClient.chat({
						model,
						messages: [{ role: 'user', content: prompt }],
						stream: true
					});
					
					for await (const chunk of streamResponse) {
						const content = chunk.message?.content || '';
						acc += content;
						setResponse(acc);
						if (typeof options.onDelta === 'function') options.onDelta(content, acc);
					}
				} else if (clientName === 'LMStudioRAGClient' || clientName === 'LMStudioClient') {
					// LM Studio streaming support
					const streamResponse = await modelClient.chat(model, prompt, {
						...options,
						stream: true
					});
					
					if (typeof streamResponse === 'string') {
						acc = streamResponse;
						setResponse(acc);
					} else if (streamResponse[Symbol.asyncIterator]) {
						for await (const chunk of streamResponse) {
							const content = typeof chunk === 'string' ? chunk : (chunk.content || '');
							acc += content;
							setResponse(acc);
							if (typeof options.onDelta === 'function') options.onDelta(content, acc);
						}
					}
				} else if (typeof modelClient?.generateStream === 'function') {
					// Legacy streaming support
					for await (const chunk of modelClient.generateStream(model, prompt)) {
						acc += String(chunk);
						setResponse(acc);
						if (typeof options.onDelta === 'function') options.onDelta(String(chunk), acc);
					}
				}
				
				setStreaming(false);
				setLoading(false);
				return { docs: relevantDocs, response: acc };
			} else {
				// Non-streaming mode
				const out = await generateWithRAG({ retriever, modelClient, model, query, promptTemplate, ...options });
				setDocs(out.docs || []);
				setResponse(out.response || null);
				setLoading(false);
				return out;
			}
		} catch (err) {
			// Normalize common errors into user-friendly messages
			let friendly = err;
			try {
				const message = String(err && (err.message || err)) || 'Unknown error';
				if (message.includes('Failed to fetch') || message.includes('ECONNREFUSED')) {
					friendly = new Error('Cannot reach proxy. Ensure /api/rag-generate and /api/embed are running.');
				} else if (message.includes('404')) {
					friendly = new Error('Proxy endpoint not found (404). Did you add /api/embed and /api/rag-generate?');
				} else if (message.includes('node:fs') || message.includes('fs.promises')) {
					friendly = new Error('Bundler pulled server code into client. Use browser entry and useBrowser:true.');
				}
			} catch {}
			setError(friendly);
			setLoading(false);
			throw friendly;
		}
	}, [retriever, modelClient, model, promptTemplate]);

	return { run, loading, error, response, docs, streaming };
}

export default useRAG;
