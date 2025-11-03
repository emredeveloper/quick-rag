import { useEffect, useState } from 'react';
import { useRAG, initRAG, createBrowserModelClient } from 'js-rag-local-llm';

const initialDocs = [
  { id: '1', text: 'React is a JavaScript library for building user interfaces.' },
  { id: '2', text: 'Ollama provides local LLM hosting capabilities.' },
  { id: '3', text: 'RAG uses retrieval to augment model responses.' },
  { id: '4', text: 'JavaScript is a versatile programming language for web development.' },
  { id: '5', text: 'Node.js enables server-side JavaScript execution.' }
];

export default function App() {
  const [{ retriever, store }, setCore] = useState({});
  const [query, setQuery] = useState('');
  const [topK, setTopK] = useState(2);
  const [setupError, setSetupError] = useState(null);
  const [newDocText, setNewDocText] = useState('');
  const [allDocs, setAllDocs] = useState([]);
  
  // v0.6.0 feature: streaming support
  const { run, loading, error, response, docs: retrieved, streaming } = useRAG({
    retriever,
    modelClient: createBrowserModelClient(),
    model: 'granite4:tiny-h'
  });

  // Initialize RAG with v0.6.0 batch embedding
  useEffect(() => {
    (async () => {
      try {
        const core = await initRAG(initialDocs, {
          baseEmbeddingOptions: {
            useBrowser: true,
            baseUrl: '/api/embed',
            model: 'embeddinggemma'
          }
        });
        setCore(core);
        // v0.6.0 feature: getAllDocuments
        const docs = core.store.getAllDocuments();
        setAllDocs(docs);
      } catch (e) {
        setSetupError(e);
        console.error('initRAG failed:', e);
      }
    })();
  }, []);

  // v0.6.0 feature: dynamic topK parameter
  const onAsk = async () => {
    if (!query) return;
    await run(query, { topK }).catch(err => console.error('generate failed:', err));
  };

  // v0.6.0 feature: CRUD - Add new document
  const onAddDocument = async () => {
    if (!newDocText || !store) return;
    try {
      const newId = String(Date.now());
      await store.addDocument({ id: newId, text: newDocText });
      const docs = store.getAllDocuments();
      setAllDocs(docs);
      setNewDocText('');
    } catch (e) {
      console.error('Add document failed:', e);
    }
  };

  // v0.6.0 feature: CRUD - Delete document
  const onDeleteDocument = (docId) => {
    if (!store) return;
    try {
      store.deleteDocument(docId);
      const docs = store.getAllDocuments();
      setAllDocs(docs);
    } catch (e) {
      console.error('Delete document failed:', e);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'start center', paddingTop: 64, background: '#0b1020' }}>
      <div style={{ width: 'min(820px, 92vw)' }}>
        <h2 style={{ color: 'white', margin: 0, marginBottom: 8 }}>🚀 RAG v0.6.0 Demo</h2>
        <p style={{ color: '#9db0ff', marginTop: 0, marginBottom: 24, fontSize: 14 }}>
          Test new features: Dynamic topK, Streaming, CRUD operations, Batch embedding
        </p>

        {setupError && (
          <div style={{ background: '#2b1a1a', color: '#ffb4b4', padding: 12, borderRadius: 12, marginBottom: 12 }}>
            {String(setupError)}
          </div>
        )}

        {/* Document Manager - v0.6.0 CRUD */}
        <div style={{ background: '#0f1630', border: '1px solid #26304a', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <h4 style={{ color: '#9db0ff', marginTop: 0, marginBottom: 12 }}>📚 Document Store ({allDocs.length} docs)</h4>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input
              value={newDocText}
              onChange={e => setNewDocText(e.target.value)}
              placeholder="Add new document..."
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid #26304a',
                background: '#0b1020',
                color: '#e5ecff',
                outline: 'none',
                fontSize: 13
              }}
            />
            <button
              onClick={onAddDocument}
              disabled={!newDocText || !store}
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                border: '1px solid #2ea043',
                background: newDocText && store ? '#2ea043' : '#1f2a52',
                color: 'white',
                cursor: newDocText && store ? 'pointer' : 'not-allowed',
                fontSize: 13
              }}
            >
              Add
            </button>
          </div>
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {allDocs.map(doc => (
              <div key={doc.id} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '8px 12px',
                background: '#0b1020',
                borderRadius: 6,
                marginBottom: 6,
                fontSize: 13
              }}>
                <span style={{ color: '#d7e2ff', flex: 1 }}>
                  <strong style={{ color: '#9db0ff' }}>[{doc.id}]</strong> {doc.text.substring(0, 60)}{doc.text.length > 60 ? '...' : ''}
                </span>
                <button
                  onClick={() => onDeleteDocument(doc.id)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 4,
                    border: '1px solid #da3633',
                    background: '#2b1a1a',
                    color: '#ffb4b4',
                    cursor: 'pointer',
                    fontSize: 12
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Query Section with topK control */}
        <div style={{ background: '#0f1630', border: '1px solid #26304a', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <h4 style={{ color: '#9db0ff', marginTop: 0, marginBottom: 12 }}>🔍 Query with Dynamic topK</h4>
          
          <div style={{ marginBottom: 12 }}>
            <label style={{ color: '#9db0ff', fontSize: 13, display: 'block', marginBottom: 6 }}>
              Top K Results: {topK}
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={topK}
              onChange={e => setTopK(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Ask something..."
              onKeyDown={e => { if (e.key === 'Enter' && !loading) onAsk(); }}
              style={{
                flex: 1,
                padding: '14px 16px',
                borderRadius: 8,
                border: '1px solid #26304a',
                background: '#0b1020',
                color: '#e5ecff',
                outline: 'none'
              }}
            />
            <button
              onClick={onAsk}
              disabled={loading || !query}
              style={{
                padding: '12px 18px',
                borderRadius: 8,
                border: '1px solid #3464ff',
                background: loading ? '#1f2a52' : '#3464ff',
                color: 'white',
                cursor: loading || !query ? 'not-allowed' : 'pointer',
                minWidth: 80
              }}
            >
              {loading ? 'Asking…' : 'Ask'}
            </button>
          </div>
          
          {streaming && (
            <div style={{ marginTop: 12, color: '#ffa657', fontSize: 13 }}>
              ⚡ Streaming response...
            </div>
          )}
        </div>

        {error && (
          <div style={{ background: '#2b1a1a', color: '#ffb4b4', padding: 12, borderRadius: 12, marginBottom: 16 }}>
            {String(error)}
          </div>
        )}

        {!!retrieved?.length && (
          <div style={{ background: '#0f1630', border: '1px solid #26304a', borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <h4 style={{ color: '#9db0ff', marginTop: 0 }}>📄 Retrieved Documents (top {retrieved.length})</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {retrieved.map((d, idx) => (
                <div key={d.id} style={{ 
                  background: '#0b1020', 
                  padding: '10px 14px', 
                  borderRadius: 6,
                  borderLeft: '3px solid #3464ff'
                }}>
                  <div style={{ color: '#9db0ff', fontSize: 12, marginBottom: 4 }}>
                    #{idx + 1} - Document [{d.id}] - Score: {d.score?.toFixed(4) || 'N/A'}
                  </div>
                  <div style={{ color: '#d7e2ff', fontSize: 14 }}>{d.text}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {response && (
          <div style={{ background: '#0f1630', border: '1px solid #26304a', borderRadius: 12, padding: 16 }}>
            <h4 style={{ color: '#9db0ff', marginTop: 0 }}>✨ AI Answer</h4>
            <pre style={{ color: '#d7e2ff', whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'system-ui' }}>
              {response}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}