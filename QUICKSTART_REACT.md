# 🚀 Quick RAG - React Projesi Kurulum Rehberi

Bu rehber, sıfırdan bir React projesi açıp Quick RAG kütüphanesini kullanmak isteyenler için hazırlanmıştır.

## 📋 Gereksinimler

1. **Node.js 18+** yüklü olmalı
2. **Ollama** kurulu ve çalışıyor olmalı
3. **Gerekli modeller** çekilmiş olmalı

## 🎯 Adım Adım Kurulum

### Adım 1: React Projesi Oluşturun

```bash
npm create vite@latest my-rag-app -- --template react
cd my-rag-app
npm install
```

### Adım 2: Quick RAG ve Bağımlılıkları Yükleyin

```bash
npm install quick-rag express concurrently multer
npm install --save-dev concurrently
```

**Not:** `quick-rag` paketi (v2.0.3+) otomatik olarak `ollama` ve `@lmstudio/sdk` paketlerini yükler.

### Adım 3: Ollama'yı Kurun ve Modelleri Çekin

**Ollama Kurulumu:**
- [ollama.ai](https://ollama.ai) adresinden indirin ve kurun
- Terminal'de kontrol edin: `ollama --version`

**Gerekli Modelleri Çekin:**
```bash
# LLM modeli (soru-cevap için)
ollama pull granite4:3b

# Embedding modeli (doküman arama için)
ollama pull embeddinggemma:latest
```

**Ollama'nın Çalıştığını Kontrol Edin:**
```bash
# Ollama servisini başlatın (eğer çalışmıyorsa)
ollama serve

# Modelleri listeleyin
ollama list
```

### Adım 4: Backend Proxy Server Oluşturun

Proje kök dizininde `server.js` dosyası oluşturun:

```javascript
// server.js
import express from 'express';
import { OllamaRAGClient } from 'quick-rag';
import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS (geliştirme için)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

const upload = multer({ dest: 'uploads/' });

// Ollama client
const client = new OllamaRAGClient({ host: 'http://127.0.0.1:11434' });

// Text generation endpoint
app.post('/api/rag-generate', async (req, res) => {
  try {
    const { model = 'granite4:3b', prompt, stream } = req.body;
    
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      const streamResponse = await client.chat({
        model,
        messages: [{ role: 'user', content: prompt }],
        stream: true
      });
      
      for await (const chunk of streamResponse) {
        const content = chunk.message?.content || '';
        if (content) {
          res.write(JSON.stringify({ response: content }) + '\n');
        }
      }
      res.end();
    } else {
      const response = await client.generate({ model, prompt });
      res.json({ response: response.response || response });
    }
  } catch (e) {
    if (!res.headersSent) {
      res.status(500).json({ error: String(e) });
    }
  }
});

// Embedding endpoint
app.post('/api/embed', async (req, res) => {
  try {
    const { model = 'embeddinggemma', input } = req.body;
    const resp = await client.embed(model, input);
    res.json(resp);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// File upload endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { loadDocument } = await import('quick-rag');
    const result = await loadDocument(req.file.path);
    
    // Cleanup
    await fs.unlink(req.file.path).catch(() => {});
    
    res.json({
      success: true,
      text: result.text,
      filename: req.file.originalname,
      meta: result.meta
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Uploads klasörünü oluştur
(async () => {
  await fs.mkdir('uploads', { recursive: true }).catch(() => {});
})();

app.listen(3001, () => console.log('🚀 Backend Server: http://127.0.0.1:3001'));
```

### Adım 5: Vite Proxy Yapılandırması

`vite.config.js` dosyasını güncelleyin:

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true
      }
    }
  },
  optimizeDeps: {
    exclude: ['quick-rag']
  },
  resolve: {
    dedupe: ['react', 'react-dom']
  }
});
```

### Adım 6: Package.json Scripts Güncelleme

`package.json` dosyasındaki `scripts` bölümünü güncelleyin:

```json
{
  "scripts": {
    "dev": "concurrently \"npm:dev:server\" \"npm:dev:client\"",
    "dev:server": "node server.js",
    "dev:client": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### Adım 7: React Component'te Kullanım

`src/App.jsx` dosyasını güncelleyin:

```jsx
import { useState, useEffect } from 'react';
import { useRAG, initRAG, createBrowserModelClient } from 'quick-rag';

// Örnek dokümanlar
const docs = [
  { id: '1', text: 'React is a JavaScript library for building user interfaces.' },
  { id: '2', text: 'Ollama provides local LLM hosting capabilities.' },
  { id: '3', text: 'RAG combines retrieval with AI generation.' }
];

export default function App() {
  const [rag, setRAG] = useState(null);
  const [query, setQuery] = useState('');
  const [isReady, setIsReady] = useState(false);
  
  const { run, loading, response, docs: results, error } = useRAG({
    retriever: rag?.retriever,
    modelClient: createBrowserModelClient({ endpoint: '/api/rag-generate' }),
    model: 'granite4:3b'
  });

  // RAG sistemini başlat
  useEffect(() => {
    initRAG(docs, {
      baseEmbeddingOptions: {
        useBrowser: true,
        baseUrl: '/api/embed',
        model: 'embeddinggemma'
      }
    }).then(core => {
      setRAG(core);
      setIsReady(true);
    }).catch(err => {
      console.error('RAG initialization failed:', err);
    });
  }, []);

  const handleAsk = async () => {
    if (!query.trim() || loading) return;
    await run(query);
  };

  return (
    <div style={{ padding: 40, maxWidth: 800, margin: '0 auto' }}>
      <h1>🤖 Quick RAG Demo</h1>
      
      {!isReady && (
        <p>⏳ RAG sistemi başlatılıyor...</p>
      )}
      
      {isReady && (
        <>
          <div style={{ marginBottom: 20 }}>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAsk()}
              placeholder="Sorunuzu yazın..."
              style={{ 
                width: '100%', 
                padding: 12, 
                fontSize: 16,
                borderRadius: 8,
                border: '1px solid #ccc'
              }}
            />
            <button
              onClick={handleAsk}
              disabled={loading || !query.trim()}
              style={{
                marginTop: 10,
                padding: '12px 24px',
                fontSize: 16,
                borderRadius: 8,
                border: 'none',
                background: loading ? '#ccc' : '#007bff',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? '⏳ Düşünüyor...' : '🚀 Sor'}
            </button>
          </div>
          
          {error && (
            <div style={{ 
              padding: 12, 
              background: '#fee', 
              borderRadius: 8,
              marginBottom: 20
            }}>
              ❌ Hata: {String(error)}
            </div>
          )}
          
          {results && results.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h3>📚 Bulunan Dokümanlar ({results.length}):</h3>
              {results.map((doc, i) => (
                <div key={i} style={{ 
                  padding: 10, 
                  marginBottom: 8,
                  background: '#f5f5f5',
                  borderRadius: 6
                }}>
                  <strong>#{i + 1}</strong> (Skor: {(doc.score * 100).toFixed(1)}%)<br/>
                  {doc.text}
                </div>
              ))}
            </div>
          )}
          
          {response && (
            <div style={{ 
              padding: 20, 
              background: '#e8f5e9',
              borderRadius: 8
            }}>
              <h3>✨ Cevap:</h3>
              <p style={{ whiteSpace: 'pre-wrap' }}>{response}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

### Adım 8: Uygulamayı Çalıştırın

```bash
npm run dev
```

Bu komut:
- ✅ Backend server'ı başlatır (`http://127.0.0.1:3001`)
- ✅ Frontend dev server'ı başlatır (`http://localhost:5173`)

Tarayıcıda `http://localhost:5173` adresini açın ve kullanmaya başlayın! 🎉

## 🔧 Sorun Giderme

### "Cannot find package 'ollama'" Hatası

```bash
# node_modules'ı temizleyip yeniden yükleyin
rm -rf node_modules package-lock.json
npm install
```

Windows'ta:
```bash
rmdir /s /q node_modules
del package-lock.json
npm install
```

### "Connection refused" Hatası

- Ollama'nın çalıştığından emin olun: `ollama serve`
- Modellerin yüklü olduğunu kontrol edin: `ollama list`
- Port 11434'ün açık olduğunu kontrol edin

### Backend Çalışmıyor

- Port 3001'in boş olduğundan emin olun
- `server.js` dosyasının proje kök dizininde olduğunu kontrol edin
- Terminal'de hata mesajlarını kontrol edin

### Frontend Hataları

- Vite config'in doğru olduğundan emin olun
- Browser console'da hata mesajlarını kontrol edin
- `/api/embed` ve `/api/rag-generate` endpoint'lerinin çalıştığını kontrol edin

## 📚 Daha Fazla Bilgi

- **Tam Dokümantasyon:** [README.md](../README.md)
- **Örnekler:** [quickstart/](../quickstart/) klasörü
- **API Referansı:** README.md içindeki API Reference bölümü

## ✅ Kontrol Listesi

Kurulum tamamlandığında şunları kontrol edin:

- [ ] Node.js 18+ yüklü
- [ ] Ollama kurulu ve çalışıyor
- [ ] `granite4:3b` modeli çekilmiş
- [ ] `embeddinggemma:latest` modeli çekilmiş
- [ ] `quick-rag` paketi yüklü
- [ ] Backend server çalışıyor (port 3001)
- [ ] Frontend dev server çalışıyor (port 5173)
- [ ] Tarayıcıda uygulama açılıyor
- [ ] Soru sorduğunuzda cevap alıyorsunuz

## 🎉 Başarılı!

Artık Quick RAG kütüphanesini React projenizde kullanabilirsiniz!

**Sonraki Adımlar:**
- Doküman yükleme özelliklerini ekleyin
- Streaming response'ları aktif edin
- Metadata filtering kullanın
- Decision Engine ile akıllı arama yapın
- Büyük PDF'ler için batch processing kullanın (v2.0.3+)

## ⚡ Performance Tips (v2.0.3+)

### Büyük Dokümanlar İçin Batch Processing

Büyük PDF'ler yüklerken batch processing kullanın:

```javascript
import { chunkDocuments } from 'quick-rag';

// Büyük PDF'i chunk'lara böl
const chunks = chunkDocuments([largePDF], { 
  chunkSize: 1000, 
  overlap: 100 
});

// Batch processing ile ekle
await store.addDocuments(chunks, {
  batchSize: 20,        // 20 chunk/batch (ayarlanabilir)
  maxConcurrent: 5,     // Max 5 concurrent request
  onProgress: (current, total) => {
    console.log(`Progress: ${current}/${total} (${Math.round(current/total*100)}%)`);
  }
});
```

### Rate Limiting Ayarları

- **Küçük dokümanlar (< 100 chunk)**: `batchSize: 10, maxConcurrent: 5`
- **Orta dokümanlar (100-1000 chunk)**: `batchSize: 20, maxConcurrent: 5`
- **Büyük dokümanlar (> 1000 chunk)**: `batchSize: 30, maxConcurrent: 3`

Daha fazla örnek için `quickstart/` klasörüne bakın!

