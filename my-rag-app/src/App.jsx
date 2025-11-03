import { useEffect, useState } from 'react';
import { useRAG, initRAG, createBrowserModelClient } from 'js-rag-local-llm';

const docs = [
  { id: '1', text: 'React is a JavaScript library for building user interfaces.' },
  { id: '2', text: 'Ollama provides local LLM hosting.' },
  { id: '3', text: 'RAG uses retrieval to augment model responses.' }
];

export default function App() {
  const [{ retriever }, setCore] = useState({});
  const [query, setQuery] = useState('');
  const [setupError, setSetupError] = useState(null);
  const { run, loading, error, response, docs: retrieved } = useRAG({
    retriever,
    modelClient: createBrowserModelClient(),
    model: 'granite4:tiny-h'
  });

  // Initialize RAG (browser-friendly embedding via proxy)
  useEffect(() => {
    (async () => {
      try {
        const core = await initRAG(docs, {
          baseEmbeddingOptions: {
            useBrowser: true,
            baseUrl: '/api/embed',
            model: 'embeddinggemma'
          }
        });
        setCore(core);
      } catch (e) {
        setSetupError(e);
        console.error('initRAG failed:', e);
      }
    })();
  }, []);

  const onAsk = async () => {
    if (!query) return;
    await run(query).catch(err => console.error('generate failed:', err));
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'start center', paddingTop: 64, background: '#0b1020' }}>
      <div style={{ width: 'min(820px, 92vw)' }}>
        <h2 style={{ color: 'white', margin: 0, marginBottom: 16 }}>RAG Demo</h2>

        {setupError && (
          <div style={{ background: '#2b1a1a', color: '#ffb4b4', padding: 12, borderRadius: 12, marginBottom: 12 }}>
            {String(setupError)}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Ask something..."
            onKeyDown={e => { if (e.key === 'Enter') onAsk(); }}
            style={{
              flex: 1,
              padding: '14px 16px',
              borderRadius: 12,
              border: '1px solid #26304a',
              background: '#0f1630',
              color: '#e5ecff',
              outline: 'none'
            }}
          />
          <button
            onClick={onAsk}
            disabled={loading}
            style={{
              padding: '12px 18px',
              borderRadius: 12,
              border: '1px solid #3464ff',
              background: loading ? '#1f2a52' : '#3464ff',
              color: 'white',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Asking…' : 'Ask'}
          </button>
        </div>

        {error && (
          <div style={{ background: '#2b1a1a', color: '#ffb4b4', padding: 12, borderRadius: 12, marginTop: 12 }}>
            {String(error)}
          </div>
        )}

        {!!retrieved?.length && (
          <div style={{ marginTop: 20, background: '#0f1630', border: '1px solid #26304a', borderRadius: 12, padding: 16 }}>
            <h4 style={{ color: '#9db0ff', marginTop: 0 }}>Retrieved</h4>
            <ul style={{ color: '#d7e2ff' }}>{retrieved.map(d => <li key={d.id}>[{d.id}] {d.text}</li>)}</ul>
          </div>
        )}

        {response && (
          <div style={{ marginTop: 20, background: '#0f1630', border: '1px solid #26304a', borderRadius: 12, padding: 16 }}>
            <h4 style={{ color: '#9db0ff', marginTop: 0 }}>Answer</h4>
            <pre style={{ color: '#d7e2ff', whiteSpace: 'pre-wrap' }}>{response}</pre>
          </div>
        )}
      </div>
    </div>
  );
}