// server.js
import express from 'express';
import { OllamaRAGClient, loadDocument } from 'quick-rag';
import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';

const app = express();
// Increase body parser limit for large documents and prompts (50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS middleware for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit for large documents
});

// Text generate with streaming support
app.post('/api/rag-generate', async (req, res) => {
  try {
    const { model, prompt, stream } = req.body || {};
    const client = new OllamaRAGClient({ host: 'http://127.0.0.1:11434' });
    
    // Check if streaming is requested
    if (stream) {
      // Set headers for streaming
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      try {
        // Use chat with streaming (OllamaRAGClient has chat method)
        const streamResponse = await client.chat({
          model: model || 'granite4:tiny-h',
          messages: [{ role: 'user', content: prompt }],
          stream: true
        });
        
        // Stream responses
        for await (const chunk of streamResponse) {
          const content = chunk.message?.content || '';
          if (content) {
            res.write(JSON.stringify({ response: content }) + '\n');
          }
        }
        res.end();
      } catch (e) {
        res.write(JSON.stringify({ error: String(e) }) + '\n');
        res.end();
      }
    } else {
      // Non-streaming mode - use generate
      const response = await client.generate({
        model: model || 'granite4:tiny-h',
        prompt: prompt
      });

      // OllamaRAGClient.generate returns { response: string, ... }
      let text = '';
      if (response?.response) {
        text = response.response;
      } else if (typeof response === 'string') {
        text = response;
      } else if (response?.text) {
        text = response.text;
      } else {
        text = String(response);
      }

      res.json({ response: text.trim() });
    }
  } catch (e) {
    if (!res.headersSent) {
      res.status(500).json({ error: String(e) });
    }
  }
});

// Embeddings endpoint - supports both single and batch embedding
app.post('/api/embed', async (req, res) => {
  try {
    const { model = 'embeddinggemma', input } = req.body || {};
    
    if (!input) {
      return res.status(400).json({ error: 'Input is required' });
    }
    
    const client = new OllamaRAGClient({ host: 'http://127.0.0.1:11434' });
    
    // Ollama supports batch embedding - pass array directly
    const resp = await client.embed(model, input);
    
    // OllamaRAGClient.embed returns { embeddings: [...] } for both single and batch
    res.json(resp);
  } catch (e) {
    console.error('Embedding error:', e);
    res.status(500).json({ 
      error: e.message || 'Embedding failed',
      details: String(e)
    });
  }
});

// File upload endpoint with PDF, Word, Excel support
app.post('/api/upload', upload.single('file'), async (req, res) => {
  let filePath = null;
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    const fileName = req.file.originalname;
    
    let text = '';
    let meta = {
      filename: fileName,
      uploadedAt: new Date().toISOString(),
      type: req.file.mimetype,
      size: req.file.size,
      format: fileExtension.replace('.', '')
    };

    try {
      // Use loadDocument from quick-rag for supported formats
      if (['.pdf', '.docx', '.doc', '.xlsx', '.xls', '.txt', '.md', '.json'].includes(fileExtension)) {
        const result = await loadDocument(filePath, { meta });
        text = result.text;
        meta = { ...meta, ...result.meta };
      } else {
        // Fallback: try to read as text
        text = await fs.readFile(filePath, 'utf-8');
      }
    } catch (loadError) {
      console.error('Error loading document:', loadError);
      // If loadDocument fails, try reading as plain text
      try {
        text = await fs.readFile(filePath, 'utf-8');
      } catch (readError) {
        throw new Error(`Failed to process file: ${loadError.message}. Please ensure required dependencies are installed (pdf-parse, mammoth, xlsx).`);
      }
    }

    // Clean up uploaded file
    try {
      await fs.unlink(filePath);
    } catch (unlinkError) {
      console.warn('Failed to delete temporary file:', unlinkError);
    }

    res.json({
      success: true,
      text: text,
      filename: fileName,
      size: req.file.size,
      type: req.file.mimetype,
      meta: meta
    });
  } catch (e) {
    // Clean up on error
    if (filePath) {
      try {
        await fs.unlink(filePath);
      } catch (unlinkError) {
        console.warn('Failed to delete temporary file on error:', unlinkError);
      }
    }
    console.error('Upload error:', e);
    res.status(500).json({ 
      error: e.message || 'File upload failed',
      details: String(e)
    });
  }
});

// Create uploads directory if it doesn't exist
(async () => {
  try {
    await fs.mkdir('uploads', { recursive: true });
  } catch (e) {
    // Directory already exists
  }
})();

app.listen(3001, () => console.log('🚀 API proxy http://127.0.0.1:3001'));