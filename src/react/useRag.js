import { useState, useCallback } from 'react';

// useRAG hook: accepts { retriever, modelClient, model, promptTemplate }
// returns { run, loading, error, response, docs }
export function useRAG({ retriever, modelClient, model, promptTemplate }) {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [response, setResponse] = useState(null);
	const [docs, setDocs] = useState([]);

	const run = useCallback(async (query, options = {}) => {
		setLoading(true);
		setError(null);
		try {
			const { generateWithRAG } = await import('../rag.js');
			const out = await generateWithRAG({ retriever, modelClient, model, query, promptTemplate, ...options });
			setDocs(out.docs || []);
			setResponse(out.response || null);
			setLoading(false);
			return out;
		} catch (err) {
			setError(err);
			setLoading(false);
			throw err;
		}
	}, [retriever, modelClient, model, promptTemplate]);

	return { run, loading, error, response, docs };
}

export default useRAG;
