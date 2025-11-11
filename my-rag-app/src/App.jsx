import { useEffect, useState, useRef } from 'react';
import { useRAG, initRAG, createBrowserModelClient, chunkDocuments } from 'quick-rag';

const initialDocs = [
  { 
    id: '1', 
    text: 'React is a JavaScript library for building user interfaces.',
    meta: { category: 'framework', language: 'javascript', difficulty: 'beginner', year: 2013, source: 'official' }
  },
  { 
    id: '2', 
    text: 'Ollama provides local LLM hosting capabilities.',
    meta: { category: 'tool', language: 'python', difficulty: 'intermediate', year: 2023, source: 'official' }
  },
  { 
    id: '3', 
    text: 'RAG uses retrieval to augment model responses.',
    meta: { category: 'technique', language: 'general', difficulty: 'advanced', year: 2020, source: 'research' }
  },
  { 
    id: '4', 
    text: 'JavaScript is a versatile programming language for web development.',
    meta: { category: 'language', language: 'javascript', difficulty: 'beginner', year: 1995, source: 'official' }
  },
  { 
    id: '5', 
    text: 'Node.js enables server-side JavaScript execution.',
    meta: { category: 'runtime', language: 'javascript', difficulty: 'intermediate', year: 2009, source: 'official' }
  }
];

export default function App() {
  const [retriever, setRetriever] = useState(null);
  const [store, setStore] = useState(null);
  const [query, setQuery] = useState('');
  const [topK, setTopK] = useState(2);
  const [setupError, setSetupError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [newDocText, setNewDocText] = useState('');
  const [allDocs, setAllDocs] = useState([]);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [darkMode, setDarkMode] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [model, setModel] = useState('granite4:tiny-h');
  const [enableStreaming, setEnableStreaming] = useState(true);
  const [streamingResponse, setStreamingResponse] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [analytics, setAnalytics] = useState({
    totalQueries: 0,
    totalDocs: 0,
    avgResponseTime: 0,
    totalTokens: 0,
    queriesByDay: []
  });
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const importInputRef = useRef(null);
  
  // v0.6.0 feature: streaming support
  const { run, loading, error, response, docs: retrieved, streaming } = useRAG({
    retriever,
    modelClient: createBrowserModelClient(),
    model: model
  });

  // Initialize RAG with v0.6.0 batch embedding
  useEffect(() => {
    (async () => {
      setIsInitializing(true);
      try {
        const core = await initRAG(initialDocs, {
          baseEmbeddingOptions: {
            useBrowser: true,
            baseUrl: '/api/embed',
            model: 'embeddinggemma'
          }
        });
        setRetriever(core.retriever);
        setStore(core.store);
        // v0.6.0 feature: getAllDocuments
        const docs = core.store.getAllDocuments();
        setAllDocs(docs);
        setIsInitializing(false);
      } catch (e) {
        setSetupError(e);
        setIsInitializing(false);
        console.error('initRAG failed:', e);
      }
    })();
  }, []);

  // Store current query before asking
  const [currentQuery, setCurrentQuery] = useState('');

  // Scroll to bottom when new message is added
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationHistory, response]);

  // v0.6.0 feature: dynamic topK parameter with streaming
  const onAsk = async () => {
    if (!query || loading) return;
    const question = query;
    setCurrentQuery(question);
    setQuery(''); // Clear input immediately
    setStreamingResponse(''); // Clear streaming response
    
    const startTime = Date.now();
    
    try {
      if (enableStreaming) {
        // Streaming mode with onDelta callback
        await run(question, { 
          topK,
          stream: true,
          onDelta: (chunk, accumulated) => {
            setStreamingResponse(accumulated);
            // Auto-scroll during streaming
            setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
          }
        });
      } else {
        // Non-streaming mode
        await run(question, { topK });
      }
      
      // Update analytics
      const responseTime = Date.now() - startTime;
      setAnalytics(prev => ({
        ...prev,
        totalQueries: prev.totalQueries + 1,
        avgResponseTime: prev.totalQueries > 0 
          ? (prev.avgResponseTime * prev.totalQueries + responseTime) / (prev.totalQueries + 1)
          : responseTime,
        queriesByDay: [...prev.queriesByDay, {
          date: new Date().toISOString().split('T')[0],
          time: responseTime
        }]
      }));
    } catch (err) {
      console.error('generate failed:', err);
    }
  };

  // Save conversation when response is received (streaming or non-streaming)
  useEffect(() => {
    const finalResponse = enableStreaming && streamingResponse ? streamingResponse : response;
    if (finalResponse && currentQuery && !conversationHistory.some(msg => 
      msg.query === currentQuery && msg.response === finalResponse
    )) {
      const newMessage = {
        id: Date.now(),
        query: currentQuery,
        response: finalResponse,
        retrievedDocs: retrieved || [],
        timestamp: new Date().toISOString(),
        topK: topK,
        streaming: enableStreaming
      };
      setConversationHistory(prev => [...prev, newMessage]);
      setCurrentQuery(''); // Clear after saving
      setStreamingResponse(''); // Clear streaming response
    }
  }, [response, streamingResponse, currentQuery, retrieved, topK, enableStreaming]);

  // Copy to clipboard
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Clear conversation history
  const clearHistory = () => {
    if (confirm('Are you sure you want to delete all conversation history?')) {
      setConversationHistory([]);
    }
  };

  // Export conversation as JSON
  const exportConversation = () => {
    const exportData = {
      sessionId: `session-${Date.now()}`,
      createdAt: conversationHistory[0]?.timestamp || new Date().toISOString(),
      exportedAt: new Date().toISOString(),
      messageCount: conversationHistory.length,
      messages: conversationHistory,
      analytics: analytics
    };
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rag-conversation-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import conversation from JSON
  const importConversation = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Validate JSON structure
      if (!data.messages || !Array.isArray(data.messages)) {
        throw new Error('Invalid conversation format. Messages array not found.');
      }

      // Import conversation history
      if (data.messages && data.messages.length > 0) {
        setConversationHistory(data.messages);
      }

      // Import analytics if available
      if (data.analytics) {
        setAnalytics(data.analytics);
      }

      // Reset file input
      if (importInputRef.current) {
        importInputRef.current.value = '';
      }

      alert(`✅ Conversation loaded! ${data.messages.length} messages imported.`);
    } catch (e) {
      console.error('Import failed:', e);
      alert('❌ Error loading conversation: ' + e.message);
    }
  };

  // Filter documents based on search and metadata
  const filteredDocs = allDocs.filter(doc => {
    // Text search
    if (searchQuery && !doc.text.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Category filter
    if (filterCategory && doc.meta?.category !== filterCategory) {
      return false;
    }
    
    // Language filter
    if (filterLanguage && doc.meta?.language !== filterLanguage) {
      return false;
    }
    
    return true;
  });

  // Get unique categories and languages for filters
  const categories = [...new Set(allDocs.map(doc => doc.meta?.category).filter(Boolean))];
  const languages = [...new Set(allDocs.map(doc => doc.meta?.language).filter(Boolean))];

  // Handle file upload with progress and embedding
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !store || isInitializing) {
      if (isInitializing) {
        alert('⚠️ RAG system is initializing. Please wait a moment.');
      } else if (!store) {
        alert('⚠️ RAG system is not ready yet. Please wait a moment.');
      }
      return;
    }

    setUploading(true);
    setUploadProgress(`Uploading ${file.name}...`);

    try {
      const formData = new FormData();
      formData.append('file', file);

      setUploadProgress(`Processing ${file.name}...`);
      
      // Add timeout for upload (5 minutes)
      const uploadController = new AbortController();
      const uploadTimeout = setTimeout(() => {
        uploadController.abort();
      }, 5 * 60 * 1000);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        signal: uploadController.signal
      }).catch(err => {
        if (err.name === 'AbortError') {
          throw new Error('Upload timeout - file is too large or processing is taking too long');
        }
        throw err;
      });
      
      clearTimeout(uploadTimeout);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.text || result.text.trim().length === 0) {
        throw new Error('File appears to be empty or could not be processed');
      }

      const textLength = result.text.length;
      const isLargeDocument = textLength > 10000; // 10KB+ is considered large
      
      // For large documents, chunk them before adding
      if (isLargeDocument) {
        setUploadProgress(`Chunking document (${Math.round(textLength / 1024)}KB)...`);
        
        // Chunk the document
        const chunks = chunkDocuments([{
          id: `upload-${Date.now()}`,
          text: result.text,
          meta: {
            filename: result.filename,
            uploadedAt: new Date().toISOString(),
            type: result.type || file.type,
            size: result.size || file.size,
            format: result.meta?.format || file.name.split('.').pop(),
            ...result.meta
          }
        }], {
          chunkSize: 1000, // 1000 characters per chunk
          overlap: 100     // 100 characters overlap
        });
        
        setUploadProgress(`Adding ${chunks.length} chunks to RAG system...`);
        
        // Use new onProgress callback feature with batch processing
        await store.addDocuments(chunks, {
          batchSize: 20, // Process 20 chunks at a time
          maxConcurrent: 5, // Max 5 concurrent requests
          onProgress: (current, total) => {
            if (current % 10 === 0 || current === total) {
              setUploadProgress(`Adding chunks... ${current}/${total} (${Math.round(current / total * 100)}%)`);
            }
          }
        });
        
        setUploadProgress(`✅ Successfully uploaded: ${result.filename} (${chunks.length} chunks, ${Math.round(textLength / 1024)}KB)`);
      } else {
        // Small document - add directly with progress
      setUploadProgress(`Adding document to RAG system...`);
      const newId = `upload-${Date.now()}`;
      
        // Add timeout for embedding (2 minutes) using Promise.race
        const embeddingPromise = store.addDocument({ 
        id: newId, 
        text: result.text,
        meta: { 
          filename: result.filename,
          uploadedAt: new Date().toISOString(),
          type: result.type || file.type,
          size: result.size || file.size,
          format: result.meta?.format || file.name.split('.').pop(),
          ...result.meta
        }
        }, {
          onProgress: (current, total) => {
            setUploadProgress(`Embedding document... ${current}/${total}`);
          }
        });
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Embedding timeout - document embedding is taking too long')), 2 * 60 * 1000)
        );
        
        await Promise.race([embeddingPromise, timeoutPromise]);
        setUploadProgress(`✅ Successfully uploaded: ${result.filename} (${Math.round(textLength / 1024)}KB text)`);
      }
      
      // Refresh document list
      const docs = store.getAllDocuments();
      setAllDocs(docs);
      
      // Update analytics
      setAnalytics(prev => ({
        ...prev,
        totalDocs: docs.length
      }));
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Clear progress message after 3 seconds
      setTimeout(() => {
        setUploadProgress('');
        setUploading(false);
      }, 3000);
    } catch (e) {
      console.error('File upload failed:', e);
      setUploadProgress(`❌ Error: ${e.message}`);
      alert('❌ Error uploading file: ' + e.message);
      setUploading(false);
      
      // Reset file input on error
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // v0.6.0 feature: CRUD - Add new document
  const onAddDocument = async () => {
    if (!newDocText || !store || isInitializing) {
      if (isInitializing) {
        alert('⚠️ RAG system is initializing. Please wait a moment.');
      } else if (!store) {
        alert('⚠️ RAG system is not ready yet. Please wait a moment.');
      }
      return;
    }
    try {
      const newId = String(Date.now());
      await store.addDocument({ id: newId, text: newDocText });
      const docs = store.getAllDocuments();
      setAllDocs(docs);
      setNewDocText('');
      
      // Update analytics
      setAnalytics(prev => ({
        ...prev,
        totalDocs: docs.length
      }));
    } catch (e) {
      console.error('Add document failed:', e);
      alert('❌ Error adding document: ' + e.message);
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

  const bgColor = darkMode ? '#0b1020' : '#ffffff';
  const cardBg = darkMode ? '#0f1630' : '#f5f5f5';
  const textColor = darkMode ? '#e5ecff' : '#1a1a1a';
  const borderColor = darkMode ? '#26304a' : '#e0e0e0';
  const accentColor = darkMode ? '#9db0ff' : '#3464ff';

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: bgColor,
      transition: 'background 0.3s ease',
      padding: '20px'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: '16px',
          background: cardBg,
          borderRadius: '12px',
          border: `1px solid ${borderColor}`
        }}>
          <div>
            <h1 style={{ color: textColor, margin: 0, marginBottom: 4, fontSize: '24px' }}>
              🚀 Quick RAG Chat
            </h1>
            <p style={{ color: accentColor, margin: 0, fontSize: '13px' }}>
              AI-powered document retrieval and generation
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={() => setDarkMode(!darkMode)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: `1px solid ${borderColor}`,
                background: cardBg,
                color: textColor,
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: `1px solid ${borderColor}`,
                background: cardBg,
                color: textColor,
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              📊 Analytics
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: `1px solid ${borderColor}`,
                background: cardBg,
                color: textColor,
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ⚙️ Settings
            </button>
          </div>
        </div>

        {/* Analytics Dashboard */}
        {showAnalytics && (
          <div style={{ 
            background: cardBg, 
            border: `1px solid ${borderColor}`, 
            borderRadius: '12px', 
            padding: '20px',
            marginBottom: '16px'
          }}>
            <h3 style={{ color: textColor, marginTop: 0, marginBottom: '16px' }}>📊 Analytics Dashboard</h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '16px',
              marginBottom: '16px'
            }}>
              <div style={{ 
                padding: '16px', 
                background: darkMode ? '#0b1020' : '#ffffff',
                borderRadius: '8px',
                border: `1px solid ${borderColor}`
              }}>
                <div style={{ color: accentColor, fontSize: '12px', marginBottom: '4px' }}>Total Queries</div>
                <div style={{ color: textColor, fontSize: '24px', fontWeight: 'bold' }}>{analytics.totalQueries}</div>
              </div>
              <div style={{ 
                padding: '16px', 
                background: darkMode ? '#0b1020' : '#ffffff',
                borderRadius: '8px',
                border: `1px solid ${borderColor}`
              }}>
                <div style={{ color: accentColor, fontSize: '12px', marginBottom: '4px' }}>Total Documents</div>
                <div style={{ color: textColor, fontSize: '24px', fontWeight: 'bold' }}>{allDocs.length}</div>
              </div>
              <div style={{ 
                padding: '16px', 
                background: darkMode ? '#0b1020' : '#ffffff',
                borderRadius: '8px',
                border: `1px solid ${borderColor}`
              }}>
                <div style={{ color: accentColor, fontSize: '12px', marginBottom: '4px' }}>Avg Response Time</div>
                <div style={{ color: textColor, fontSize: '24px', fontWeight: 'bold' }}>
                  {analytics.avgResponseTime > 0 ? `${Math.round(analytics.avgResponseTime)}ms` : 'N/A'}
                </div>
              </div>
              <div style={{ 
                padding: '16px', 
                background: darkMode ? '#0b1020' : '#ffffff',
                borderRadius: '8px',
                border: `1px solid ${borderColor}`
              }}>
                <div style={{ color: accentColor, fontSize: '12px', marginBottom: '4px' }}>Conversation Messages</div>
                <div style={{ color: textColor, fontSize: '24px', fontWeight: 'bold' }}>{conversationHistory.length}</div>
              </div>
            </div>
            {analytics.queriesByDay.length > 0 && (
              <div style={{ 
                padding: '16px', 
                background: darkMode ? '#0b1020' : '#ffffff',
                borderRadius: '8px',
                border: `1px solid ${borderColor}`,
                marginTop: '16px'
              }}>
                <div style={{ color: accentColor, fontSize: '14px', marginBottom: '12px', fontWeight: 'bold' }}>
                  Recent Queries
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {analytics.queriesByDay.slice(-5).reverse().map((q, idx) => (
                    <div key={idx} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      padding: '8px',
                      background: darkMode ? '#0f1630' : '#f5f5f5',
                      borderRadius: '6px'
                    }}>
                      <span style={{ color: textColor, fontSize: '12px' }}>{q.date}</span>
                      <span style={{ color: accentColor, fontSize: '12px' }}>{q.time}ms</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Settings Panel */}
        {showSettings && (
          <div style={{ 
            background: cardBg, 
            border: `1px solid ${borderColor}`, 
            borderRadius: '12px', 
            padding: '20px',
            marginBottom: '16px'
          }}>
            <h3 style={{ color: textColor, marginTop: 0, marginBottom: '16px' }}>⚙️ Settings</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ color: accentColor, fontSize: '14px', display: 'block', marginBottom: '6px' }}>
                  Model:
                </label>
                <input
                  type="text"
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${borderColor}`,
                    background: darkMode ? '#0b1020' : '#ffffff',
                    color: textColor,
                    outline: 'none',
                    fontSize: '14px'
                  }}
                  placeholder="granite4:tiny-h"
                />
              </div>
              <div>
                <label style={{ color: accentColor, fontSize: '14px', display: 'block', marginBottom: '6px' }}>
                  Top K: {topK}
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={topK}
                  onChange={e => setTopK(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ 
                  color: accentColor, 
                  fontSize: '14px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={enableStreaming}
                    onChange={e => setEnableStreaming(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  Enable Streaming Responses (Real-time)
                </label>
                <p style={{ color: accentColor, fontSize: '12px', margin: '4px 0 0 24px' }}>
                  Show responses token by token in real-time
                </p>
              </div>
            </div>
          </div>
        )}

        {setupError && (
          <div style={{ 
            background: darkMode ? '#2b1a1a' : '#ffe0e0', 
            color: darkMode ? '#ffb4b4' : '#d32f2f', 
            padding: '12px', 
            borderRadius: '12px',
            border: `1px solid ${borderColor}`
          }}>
            {String(setupError)}
          </div>
        )}

        {/* Main Content Area - Two Column Layout */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '20px'
        }}>
          {/* Left Column - Documents */}
          <div style={{ 
            background: cardBg, 
            border: `1px solid ${borderColor}`, 
            borderRadius: '12px', 
            padding: '16px',
            maxHeight: '600px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ color: accentColor, margin: 0 }}>📚 Documents ({filteredDocs.length}/{allDocs.length})</h4>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                disabled={uploading || isInitializing || !store}
                style={{ display: 'none' }}
                accept=".txt,.md,.json,.pdf,.docx,.doc,.xlsx,.xls"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || isInitializing || !store}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${borderColor}`,
                  background: (uploading || isInitializing || !store) ? (darkMode ? '#1f2a52' : '#e0e0e0') : (darkMode ? '#0b1020' : '#ffffff'),
                  color: (uploading || isInitializing || !store) ? '#666' : textColor,
                  cursor: (uploading || isInitializing || !store) ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                  position: 'relative'
                }}
                title={isInitializing ? 'RAG system initializing...' : !store ? 'RAG system not ready' : uploading ? 'Uploading...' : 'Upload document (PDF, Word, Excel, Text)'}
              >
                {isInitializing ? '⏳' : uploading ? '⏳' : '📁'} {isInitializing ? 'Initializing...' : uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
            
            {/* Initialization Status */}
            {isInitializing && (
              <div style={{ 
                padding: '8px 12px',
                marginBottom: '12px',
                borderRadius: '6px',
                background: darkMode ? '#1a1f3a' : '#e3f2fd',
                color: accentColor,
                fontSize: '12px',
                border: `1px solid ${borderColor}`
              }}>
                ⏳ Initializing RAG system... Please wait.
              </div>
            )}
            
            {/* Upload Progress */}
            {uploadProgress && (
              <div style={{ 
                padding: '8px 12px',
                marginBottom: '12px',
                borderRadius: '6px',
                background: uploadProgress.includes('✅') 
                  ? (darkMode ? '#1a2f1a' : '#e8f5e9')
                  : uploadProgress.includes('❌')
                  ? (darkMode ? '#2b1a1a' : '#ffebee')
                  : (darkMode ? '#1a1f3a' : '#e3f2fd'),
                color: uploadProgress.includes('✅') 
                  ? '#4caf50'
                  : uploadProgress.includes('❌')
                  ? '#da3633'
                  : accentColor,
                fontSize: '12px',
                border: `1px solid ${borderColor}`
              }}>
                {uploadProgress}
              </div>
            )}
            
            {/* Search and Filter */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="🔍 Search documents..."
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${borderColor}`,
                  background: darkMode ? '#0b1020' : '#ffffff',
                  color: textColor,
                  outline: 'none',
                  fontSize: '13px'
                }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  value={filterCategory}
                  onChange={e => setFilterCategory(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${borderColor}`,
                    background: darkMode ? '#0b1020' : '#ffffff',
                    color: textColor,
                    outline: 'none',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <select
                  value={filterLanguage}
                  onChange={e => setFilterLanguage(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${borderColor}`,
                    background: darkMode ? '#0b1020' : '#ffffff',
                    color: textColor,
                    outline: 'none',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">All Languages</option>
                  {languages.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
                {(searchQuery || filterCategory || filterLanguage) && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setFilterCategory('');
                      setFilterLanguage('');
                    }}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: `1px solid ${borderColor}`,
                      background: darkMode ? '#2b1a1a' : '#ffebee',
                      color: '#da3633',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input
                value={newDocText}
                onChange={e => setNewDocText(e.target.value)}
                placeholder="Add new document..."
                onKeyDown={e => { if (e.key === 'Enter') onAddDocument(); }}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${borderColor}`,
                  background: darkMode ? '#0b1020' : '#ffffff',
                  color: textColor,
                  outline: 'none',
                  fontSize: '13px'
                }}
              />
              <button
                onClick={onAddDocument}
                disabled={!newDocText || isInitializing || !store}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid #2ea043',
                  background: (newDocText && !isInitializing && store) ? '#2ea043' : (darkMode ? '#1f2a52' : '#e0e0e0'),
                  color: 'white',
                  cursor: (newDocText && !isInitializing && store) ? 'pointer' : 'not-allowed',
                  fontSize: '13px'
                }}
                title={isInitializing ? 'RAG system initializing...' : !store ? 'RAG system not ready' : !newDocText ? 'Enter text to add' : 'Add document'}
              >
                {isInitializing ? '⏳' : '➕'} {isInitializing ? 'Initializing...' : 'Add'}
              </button>
            </div>
            <div style={{ 
              flex: 1, 
              overflowY: 'auto',
              maxHeight: '300px'
            }}>
              {filteredDocs.length === 0 ? (
                <p style={{ color: accentColor, fontSize: '13px', textAlign: 'center', marginTop: '20px' }}>
                  {allDocs.length === 0 ? 'No documents yet' : 'No documents match the filter'}
                </p>
              ) : (
                filteredDocs.map(doc => (
                  <div key={doc.id} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    padding: '8px 12px',
                    background: darkMode ? '#0b1020' : '#ffffff',
                    borderRadius: '6px',
                    marginBottom: '6px',
                    fontSize: '13px',
                    border: `1px solid ${borderColor}`
                  }}>
                    <span style={{ color: textColor, flex: 1 }}>
                      {doc.meta?.filename ? (
                        <div>
                          <strong style={{ color: accentColor }}>📄 {doc.meta.filename}</strong>
                          <div style={{ fontSize: '11px', color: accentColor, marginTop: '2px' }}>
                            {doc.meta.format && <span>📋 {doc.meta.format.toUpperCase()}</span>}
                            {doc.meta.size && <span style={{ marginLeft: '8px' }}>💾 {Math.round(doc.meta.size / 1024)}KB</span>}
                          </div>
                          <div style={{ fontSize: '12px', color: textColor, marginTop: '4px', opacity: 0.8 }}>
                            {doc.text.substring(0, 60)}{doc.text.length > 60 ? '...' : ''}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <strong style={{ color: accentColor }}>[{doc.id}]</strong> {doc.text.substring(0, 50)}{doc.text.length > 50 ? '...' : ''}
                          {doc.meta && (
                            <div style={{ fontSize: '11px', color: accentColor, marginTop: '4px' }}>
                              {doc.meta.category && <span>🏷️ {doc.meta.category}</span>}
                              {doc.meta.language && <span style={{ marginLeft: '8px' }}>🌐 {doc.meta.language}</span>}
                            </div>
                          )}
                        </div>
                      )}
                    </span>
                    <button
                      onClick={() => onDeleteDocument(doc.id)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: '1px solid #da3633',
                        background: darkMode ? '#2b1a1a' : '#ffebee',
                        color: '#da3633',
                        cursor: 'pointer',
                        fontSize: '12px',
                        marginLeft: '8px',
                        flexShrink: 0
                      }}
                      title="Delete document"
                    >
                      🗑️
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column - Chat */}
          <div style={{ 
            background: cardBg, 
            border: `1px solid ${borderColor}`, 
            borderRadius: '12px', 
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '600px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ color: accentColor, margin: 0 }}>💬 Chat</h4>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  ref={importInputRef}
                  type="file"
                  onChange={importConversation}
                  style={{ display: 'none' }}
                  accept=".json"
                />
                <button
                  onClick={() => importInputRef.current?.click()}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${borderColor}`,
                    background: darkMode ? '#0b1020' : '#ffffff',
                    color: textColor,
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  📥 Import
                </button>
                {conversationHistory.length > 0 && (
                  <>
                    <button
                      onClick={exportConversation}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: `1px solid ${borderColor}`,
                        background: darkMode ? '#0b1020' : '#ffffff',
                        color: textColor,
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      💾 Export
                    </button>
                    <button
                      onClick={clearHistory}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid #da3633',
                        background: darkMode ? '#2b1a1a' : '#ffebee',
                        color: '#da3633',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      🗑️ Clear
                    </button>
                  </>
                )}
              </div>
            </div>
            
            {/* Conversation History */}
            <div style={{ 
              flex: 1, 
              overflowY: 'auto',
              marginBottom: '12px',
              padding: '8px',
              background: darkMode ? '#0b1020' : '#ffffff',
              borderRadius: '8px',
              minHeight: '300px',
              maxHeight: '400px'
            }}>
              {conversationHistory.length === 0 ? (
                <p style={{ color: accentColor, fontSize: '13px', textAlign: 'center', marginTop: '40px' }}>
                  No conversation history. Start by asking a question!
                </p>
              ) : (
                conversationHistory.map((msg, idx) => (
                  <div key={msg.id} style={{ marginBottom: '16px' }}>
                    {/* User Query */}
                    <div style={{ 
                      marginBottom: '8px',
                      padding: '10px',
                      background: darkMode ? '#1a1f3a' : '#e3f2fd',
                      borderRadius: '8px',
                      borderLeft: `3px solid ${accentColor}`
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '4px'
                      }}>
                        <span style={{ color: accentColor, fontSize: '12px', fontWeight: 'bold' }}>
                          👤 Question
                        </span>
                        <button
                          onClick={() => copyToClipboard(msg.query)}
                          style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            border: 'none',
                            background: 'transparent',
                            color: accentColor,
                            cursor: 'pointer',
                            fontSize: '11px'
                          }}
                        >
                          📋
                        </button>
                      </div>
                      <p style={{ color: textColor, margin: 0, fontSize: '14px' }}>{msg.query}</p>
                    </div>
                    
                    {/* AI Response */}
                    <div style={{ 
                      padding: '10px',
                      background: darkMode ? '#1a2f1a' : '#e8f5e9',
                      borderRadius: '8px',
                      borderLeft: '3px solid #4caf50'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '4px'
                      }}>
                        <span style={{ color: '#4caf50', fontSize: '12px', fontWeight: 'bold' }}>
                          🤖 AI Response
                        </span>
                        <button
                          onClick={() => copyToClipboard(msg.response)}
                          style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            border: 'none',
                            background: 'transparent',
                            color: '#4caf50',
                            cursor: 'pointer',
                            fontSize: '11px'
                          }}
                        >
                          📋
                        </button>
                      </div>
                      <p style={{ color: textColor, margin: 0, fontSize: '14px', whiteSpace: 'pre-wrap' }}>
                        {msg.response}
                      </p>
                      {msg.retrievedDocs && msg.retrievedDocs.length > 0 && (
                        <div style={{ 
                          marginTop: '8px', 
                          paddingTop: '8px', 
                          borderTop: `1px solid ${borderColor}`,
                          fontSize: '11px',
                          color: accentColor
                        }}>
                          📄 {msg.retrievedDocs.length} documents used
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              {/* Streaming Response Display */}
              {loading && currentQuery && (enableStreaming && streamingResponse ? (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ 
                    marginBottom: '8px',
                    padding: '10px',
                    background: darkMode ? '#1a1f3a' : '#e3f2fd',
                    borderRadius: '8px',
                    borderLeft: `3px solid ${accentColor}`
                  }}>
                    <span style={{ color: accentColor, fontSize: '12px', fontWeight: 'bold' }}>
                      👤 Question
                    </span>
                    <p style={{ color: textColor, margin: '4px 0 0 0', fontSize: '14px' }}>{currentQuery}</p>
                  </div>
                  <div style={{ 
                    padding: '10px',
                    background: darkMode ? '#1a2f1a' : '#e8f5e9',
                    borderRadius: '8px',
                    borderLeft: '3px solid #4caf50'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '4px'
                    }}>
                      <span style={{ color: '#4caf50', fontSize: '12px', fontWeight: 'bold' }}>
                        🤖 AI Response {streaming && '⚡ Streaming...'}
                      </span>
                    </div>
                    <p style={{ color: textColor, margin: 0, fontSize: '14px', whiteSpace: 'pre-wrap' }}>
                      {streamingResponse}
                      <span style={{ 
                        animation: 'blink 1s infinite',
                        marginLeft: '2px'
                      }}>▊</span>
                    </p>
                  </div>
                </div>
              ) : (
                <div style={{ 
                  padding: '10px',
                  background: darkMode ? '#1a2f1a' : '#e8f5e9',
                  borderRadius: '8px',
                  color: accentColor,
                  fontSize: '14px'
                }}>
                  🤔 Thinking...
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            
            {/* Query Input */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Ask a question..."
                onKeyDown={e => { if (e.key === 'Enter' && !loading) onAsk(); }}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: `1px solid ${borderColor}`,
                  background: darkMode ? '#0b1020' : '#ffffff',
                  color: textColor,
                  outline: 'none',
                  fontSize: '14px'
                }}
              />
              <button
                onClick={onAsk}
                disabled={loading || !query}
                style={{
                  padding: '12px 20px',
                  borderRadius: '8px',
                  border: '1px solid #3464ff',
                  background: loading || !query ? (darkMode ? '#1f2a52' : '#e0e0e0') : '#3464ff',
                  color: 'white',
                  cursor: loading || !query ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                {loading ? '⏳' : '🚀'}
              </button>
            </div>
            
            {streaming && (
              <div style={{ marginTop: '8px', color: '#ffa657', fontSize: '12px', textAlign: 'center' }}>
                ⚡ Live response streaming...
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div style={{ 
            background: darkMode ? '#2b1a1a' : '#ffebee', 
            color: darkMode ? '#ffb4b4' : '#d32f2f', 
            padding: '12px', 
            borderRadius: '12px',
            border: `1px solid ${borderColor}`
          }}>
            ❌ Error: {String(error)}
          </div>
        )}

      </div>
    </div>
  );
}