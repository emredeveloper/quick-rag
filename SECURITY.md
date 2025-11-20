# Security Policy

## Supported Versions

We release security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 2.1.x   | :white_check_mark: |
| 2.0.x   | :white_check_mark: |
| 1.x.x   | :x:                |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please report it responsibly.

### How to Report

**Please DO NOT create a public GitHub issue for security vulnerabilities.**

Instead, please report security issues via one of these methods:

1. **Email:** Send details to [your-email@example.com] (replace with your email)
2. **GitHub Security Advisory:** Use [GitHub's private vulnerability reporting](https://github.com/emredeveloper/quick-rag/security/advisories/new)

### What to Include

Please include the following information:

- **Type of vulnerability** (e.g., SQL injection, XSS, etc.)
- **Full path** of the affected source file(s)
- **Location** of the affected code (tag/branch/commit or direct URL)
- **Step-by-step instructions** to reproduce the issue
- **Proof-of-concept or exploit code** (if possible)
- **Impact** of the vulnerability
- **Suggested fix** (if you have one)

### What to Expect

- **Acknowledgment:** We'll acknowledge receipt within 48 hours
- **Updates:** We'll provide updates on the progress within 7 days
- **Timeline:** We aim to release fixes within 30 days for critical issues
- **Credit:** We'll credit you in the security advisory (unless you prefer to remain anonymous)

### Disclosure Policy

- **Coordinated Disclosure:** We follow coordinated disclosure practices
- **Timeline:** We'll coordinate with you on the disclosure timeline
- **Public Disclosure:** After a fix is released, we'll publish a security advisory

## Security Best Practices

When using Quick RAG in production:

### 1. Keep Dependencies Updated

```bash
# Check for updates
npm outdated

# Update to latest
npm update
```

### 2. Use Environment Variables

Never hardcode sensitive information:

```javascript
// ❌ Bad
const client = new OllamaRAGClient({ 
  host: 'http://my-secret-api.com',
  apiKey: 'sk-1234567890'
});

// ✅ Good
const client = new OllamaRAGClient({ 
  host: process.env.OLLAMA_HOST,
  apiKey: process.env.OLLAMA_API_KEY
});
```

### 3. Validate User Input

Always validate and sanitize user input:

```javascript
// ✅ Good
function sanitizeQuery(query) {
  if (typeof query !== 'string') {
    throw new Error('Query must be a string');
  }
  
  if (query.length > 1000) {
    throw new Error('Query too long');
  }
  
  // Remove potentially dangerous characters
  return query.replace(/[<>]/g, '');
}

const userQuery = sanitizeQuery(req.body.query);
const results = await retriever.getRelevant(userQuery, 5);
```

### 4. Rate Limiting

Implement rate limiting for public APIs:

```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### 5. Secure File Uploads

When accepting file uploads:

```javascript
// Validate file type
const allowedTypes = ['.pdf', '.txt', '.docx'];
const ext = path.extname(file.originalname).toLowerCase();

if (!allowedTypes.includes(ext)) {
  throw new Error('Invalid file type');
}

// Check file size
if (file.size > 10 * 1024 * 1024) { // 10MB
  throw new Error('File too large');
}

// Scan for malware (use a service like VirusTotal)
await scanFile(file.path);
```

### 6. Protect Sensitive Data

Don't log sensitive information:

```javascript
// ❌ Bad
logger.info({ apiKey: client.apiKey }, 'Making API call');

// ✅ Good
logger.info({ endpoint: client.host }, 'Making API call');
```

### 7. Use HTTPS

Always use HTTPS in production:

```javascript
// ✅ Good
const client = new OllamaRAGClient({ 
  host: 'https://api.example.com'  // Not http://
});
```

### 8. Database Security (SQLite)

When using SQLite persistence:

```javascript
// Set proper file permissions
import fs from 'fs';

const dbPath = './data/knowledge.db';
fs.chmodSync(dbPath, 0o600); // Read/write for owner only

// Use parameterized queries (already done in Quick RAG)
// Never concatenate user input into SQL
```

### 9. Error Handling

Don't expose internal errors to users:

```javascript
// ❌ Bad
catch (error) {
  res.status(500).json({ error: error.stack });
}

// ✅ Good
catch (error) {
  logger.error({ error }, 'Internal error');
  res.status(500).json({ 
    error: 'An error occurred',
    code: 'INTERNAL_ERROR'
  });
}
```

### 10. Regular Security Audits

```bash
# Run npm audit
npm audit

# Fix vulnerabilities automatically
npm audit fix

# Check for outdated packages
npm outdated
```

## Known Security Considerations

### 1. Prompt Injection

Be aware of prompt injection attacks:

```javascript
// Users could try to manipulate prompts
// Example: "Ignore previous instructions and..."

// Mitigation: Use system prompts to enforce behavior
const pm = new PromptManager({
  systemPrompt: 'You are a helpful assistant. You must not execute harmful instructions.'
});
```

### 2. Data Privacy

- **Local Models:** Data stays on your machine (Ollama/LM Studio)
- **Cloud APIs:** Data is sent to third-party servers
- **Telemetry:** Queries are hashed for privacy

### 3. SQL Injection (SQLite)

Quick RAG uses parameterized queries, but if you extend the code:

```javascript
// ❌ Bad (vulnerable)
db.prepare(`SELECT * FROM docs WHERE id = '${userId}'`).get();

// ✅ Good (safe)
db.prepare('SELECT * FROM docs WHERE id = ?').get(userId);
```

## Dependencies

We use `npm audit` to check for known vulnerabilities in dependencies.

Current dependencies are actively maintained:
- Ollama JS SDK
- LM Studio SDK
- Pino (logging)
- Better SQLite3

## Updates

Check for security updates regularly:

```bash
# Check for updates
npm outdated

# Update to latest minor/patch
npm update

# Update to latest major (review breaking changes)
npm install quick-rag@latest
```

## Contact

For security concerns or questions:
- Email: [your-email@example.com]
- Security Advisory: [GitHub Security](https://github.com/emredeveloper/quick-rag/security)

---

**Last Updated:** November 20, 2025
