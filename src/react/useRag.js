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
			// If streaming requested and client supports it, stream chunks
			if (options.stream && typeof modelClient?.generateStream === 'function') {
				setStreaming(true);
				setResponse('');
				const out = await generateWithRAG({ retriever, modelClient, model, query, promptTemplate, ...options, topK: options.topK });
				setDocs(out.docs || []);
				let acc = '';
				// Use the prompt returned by generateWithRAG
				for await (const chunk of modelClient.generateStream(model, out.prompt)) {
					acc += String(chunk);
					setResponse(acc);
					if (typeof options.onDelta === 'function') options.onDelta(String(chunk), acc);
				}
				setStreaming(false);
				setLoading(false);
				return { docs: out.docs || [], response: acc };
			} else {
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
