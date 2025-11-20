# Metrics and Telemetry Guide

Quick RAG v2.1.0+ includes comprehensive metrics collection and telemetry for monitoring production systems.

## Table of Contents

- [Overview](#overview)
- [Metrics Collection](#metrics-collection)
- [Structured Logging](#structured-logging)
- [Telemetry](#telemetry)
- [Production Monitoring](#production-monitoring)
- [Best Practices](#best-practices)

---

## Overview

Quick RAG provides three complementary systems for observability:

1. **Metrics** - Performance measurements (latency, throughput)
2. **Logging** - Structured log output with Pino
3. **Telemetry** - Event tracking and usage patterns

All three systems are optional and can be enabled/disabled independently.

---

## Metrics Collection

### Basic Usage

```javascript
import { metrics } from 'quick-rag';

// Metrics are automatically collected during operations
await store.addDocuments(docs);
const results = await retriever.getRelevant('query', 5);

// Get summary statistics
const summary = metrics.getSummary();
console.log(summary);
```

**Example Output:**
```javascript
{
  uptime: 125000,  // milliseconds
  queries: {
    total: 42,
    avgDuration: 234.5,
    avgTopScore: 0.856
  },
  embeddings: {
    total: 150,
    avgDuration: 45.2,
    totalDocs: 1500,
    avgThroughput: 33.1  // docs per second
  },
  retrievals: {
    total: 42,
    avgDuration: 12.3,
    avgResultsReturned: 4.8
  },
  generations: {
    total: 38,
    avgDuration: 1250.6,
    avgTokensPerSecond: 28.4
  },
  errors: {
    total: 3,
    byOperation: {
      'embedding': 2,
      'retrieval': 1
    }
  }
}
```

### Recording Custom Metrics

```javascript
import { metrics } from 'quick-rag';

// Record query metrics
metrics.recordQuery('What is JavaScript?', results, 125);

// Record embedding metrics
metrics.recordEmbedding(
  100,    // document count
  768,    // dimension
  450     // duration (ms)
);

// Record retrieval metrics
metrics.recordRetrieval('query', 5, 5, 12);

// Record generation metrics
metrics.recordGeneration(
  'granite4:tiny-h',  // model
  1500,               // prompt length
  350,                // response length
  1250                // duration (ms)
);

// Record errors
metrics.recordError('embedding', error, {
  model: 'embeddinggemma',
  docCount: 100
});
```

### Detailed Metrics

```javascript
// Get all raw metrics
const allMetrics = metrics.getMetrics();

console.log(allMetrics.queries);
// [
//   {
//     timestamp: 1700000000000,
//     query: 'What is JavaScript?',
//     resultCount: 5,
//     topScore: 0.856,
//     duration: 125
//   },
//   ...
// ]

console.log(allMetrics.embeddings);
// [
//   {
//     timestamp: 1700000000000,
//     docCount: 100,
//     dimension: 768,
//     duration: 450,
//     throughput: 222.2  // docs per second
//   },
//   ...
// ]
```

### Resetting Metrics

```javascript
// Clear all metrics
metrics.reset();

// Or create a new collector
import { MetricsCollector } from 'quick-rag';
const customMetrics = new MetricsCollector();
```

### Export Metrics

```javascript
// Export to JSON for analysis
const summary = metrics.getSummary();
fs.writeFileSync('metrics.json', JSON.stringify(summary, null, 2));

// Export raw data
const raw = metrics.getMetrics();
fs.writeFileSync('metrics-raw.json', JSON.stringify(raw, null, 2));
```

---

## Structured Logging

Quick RAG uses [Pino](https://github.com/pinojs/pino) for fast, structured JSON logging.

### Installation

```bash
npm install pino pino-pretty
```

### Basic Usage

```javascript
import { logger, createComponentLogger, logPerformance, logError } from 'quick-rag';

// Basic logging
logger.info('Starting RAG query');
logger.debug({ query: 'JavaScript' }, 'Processing query');
logger.warn({ docCount: 0 }, 'No documents in store');
logger.error({ error: err }, 'Failed to embed document');

// Component-specific logger
const embedLogger = createComponentLogger('embedding', { 
  model: 'embeddinggemma' 
});
embedLogger.info('Generating embeddings');

// Log performance
logPerformance('embedding', 450, { 
  docCount: 100, 
  dimension: 768 
});

// Log errors with context
try {
  await store.addDocuments(docs);
} catch (error) {
  logError(error, 'addDocuments', { 
    docCount: docs.length 
  });
}
```

### Configure Logger

```javascript
import { createLogger } from 'quick-rag';

const customLogger = createLogger({
  level: 'debug',              // trace, debug, info, warn, error, fatal
  logFile: './logs/app.log',   // Optional file output
  pretty: true                 // Pretty print (disable in production)
});

// Use custom logger
customLogger.info('Custom log');
```

### Environment Variables

Control logging via environment variables:

```bash
# Set log level
LOG_LEVEL=debug node app.js

# Disable pretty printing
NODE_ENV=production node app.js
```

### Log Levels

- `trace` - Very detailed debugging
- `debug` - Debugging information
- `info` - General information (default)
- `warn` - Warnings
- `error` - Errors
- `fatal` - Fatal errors

### Production Logging

```javascript
import { createLogger } from 'quick-rag';

const logger = createLogger({
  level: 'info',
  logFile: './logs/production.log',
  pretty: false  // JSON output for log aggregation
});

// Logs are written as JSON for parsing by tools like:
// - Elasticsearch
// - Datadog
// - CloudWatch
// - Splunk
```

**Example JSON Log:**
```json
{
  "level": 30,
  "time": 1700000000000,
  "app": "quick-rag",
  "component": "embedding",
  "model": "embeddinggemma",
  "msg": "Generating embeddings"
}
```

---

## Telemetry

Track user interactions and usage patterns.

### Basic Usage

```javascript
import { telemetry, EventType } from 'quick-rag';

// Track events automatically during operations
await store.addDocuments(docs);
const results = await retriever.getRelevant('query', 5);

// Or track manually
telemetry.track(EventType.RAG_QUERY, {
  model: 'granite4:tiny-h',
  resultCount: 5,
  duration: 125
});
```

### Event Types

```javascript
import { EventType } from 'quick-rag';

// Available event types
EventType.RAG_QUERY         // RAG query executed
EventType.DOCUMENT_ADD      // Documents added
EventType.DOCUMENT_UPDATE   // Document updated
EventType.DOCUMENT_DELETE   // Document deleted
EventType.EMBEDDING_CREATE  // Embeddings created
EventType.SEARCH_EXECUTE    // Search executed
EventType.ERROR_OCCURRED    // Error occurred
EventType.MODEL_LOAD        // Model loaded
```

### Track Custom Events

```javascript
import { telemetry } from 'quick-rag';

// Track query
telemetry.trackQuery(
  'What is JavaScript?',
  'granite4:tiny-h',
  5,      // result count
  125     // duration (ms)
);

// Track document operations
telemetry.trackDocumentOp(EventType.DOCUMENT_ADD, 100);
telemetry.trackDocumentOp(EventType.DOCUMENT_UPDATE, 5);

// Track errors
telemetry.trackError(error, {
  operation: 'embedding',
  model: 'embeddinggemma'
});

// Track custom events
telemetry.track('custom.event', {
  feature: 'smart-retrieval',
  enabled: true
});
```

### Query Event Data

```javascript
// Get events by type
const queries = telemetry.getEventsByType(EventType.RAG_QUERY);
console.log(`Total queries: ${queries.length}`);

// Get session summary
const summary = telemetry.getSessionSummary();
console.log(summary);
```

**Example Session Summary:**
```javascript
{
  sessionId: 'a1b2c3d4-e5f6-7890',
  duration: 125000,  // milliseconds
  totalEvents: 250,
  eventCounts: {
    'rag.query': 42,
    'document.add': 150,
    'search.execute': 45,
    'error.occurred': 3
  },
  startTime: 1700000000000,
  endTime: 1700125000000
}
```

### Export Telemetry

```javascript
// Export all events
const events = telemetry.getAllEvents();
fs.writeFileSync('telemetry.json', JSON.stringify(events, null, 2));

// Export session summary
const summary = telemetry.getSessionSummary();
fs.writeFileSync('session.json', JSON.stringify(summary, null, 2));
```

### Privacy

Telemetry automatically hashes sensitive data:

```javascript
// Query text is hashed for privacy
telemetry.trackQuery('sensitive query', 'model', 5, 100);

// Stored as:
// { query: 'a8f3d2e1...', model: 'model', ... }
```

---

## Production Monitoring

### Complete Example

```javascript
import {
  OllamaRAGClient,
  createOllamaRAGEmbedding,
  InMemoryVectorStore,
  Retriever,
  generateWithRAG,
  metrics,
  telemetry,
  createLogger
} from 'quick-rag';

// 1. Setup logging
const logger = createLogger({
  level: 'info',
  logFile: './logs/production.log',
  pretty: false
});

// 2. Setup RAG
const client = new OllamaRAGClient();
const embedFn = createOllamaRAGEmbedding(client, 'embeddinggemma');
const store = new InMemoryVectorStore(embedFn);
const retriever = new Retriever(store);

// 3. Monitor operations
async function query(userQuery) {
  const start = Date.now();
  
  try {
    // Retrieve documents
    const docs = await retriever.getRelevant(userQuery, 5);
    
    // Generate response
    const response = await generateWithRAG(
      client,
      'granite4:tiny-h',
      userQuery,
      docs
    );
    
    // Log success
    const duration = Date.now() - start;
    logger.info({
      query: userQuery,
      docCount: docs.length,
      duration
    }, 'Query completed successfully');
    
    // Track telemetry
    telemetry.trackQuery(userQuery, 'granite4:tiny-h', docs.length, duration);
    
    return response;
    
  } catch (error) {
    // Log error
    logger.error({
      query: userQuery,
      error: error.message,
      code: error.code
    }, 'Query failed');
    
    // Track error
    telemetry.trackError(error, { query: userQuery });
    metrics.recordError('query', error);
    
    throw error;
  }
}

// 4. Periodic metrics reporting
setInterval(() => {
  const summary = metrics.getSummary();
  logger.info({ metrics: summary }, 'Metrics summary');
  
  const telemetrySummary = telemetry.getSessionSummary();
  logger.info({ telemetry: telemetrySummary }, 'Telemetry summary');
}, 60000); // Every minute
```

### Dashboard Integration

Export metrics to monitoring dashboards:

```javascript
import express from 'express';
import { metrics, telemetry } from 'quick-rag';

const app = express();

// Metrics endpoint (Prometheus format)
app.get('/metrics', (req, res) => {
  const summary = metrics.getSummary();
  
  // Convert to Prometheus format
  res.type('text/plain');
  res.send(`
# HELP rag_queries_total Total number of RAG queries
# TYPE rag_queries_total counter
rag_queries_total ${summary.queries.total}

# HELP rag_query_duration_avg Average query duration in ms
# TYPE rag_query_duration_avg gauge
rag_query_duration_avg ${summary.queries.avgDuration}

# HELP rag_errors_total Total number of errors
# TYPE rag_errors_total counter
rag_errors_total ${summary.errors.total}
  `);
});

// Health check
app.get('/health', (req, res) => {
  const summary = metrics.getSummary();
  const errorRate = summary.errors.total / summary.queries.total;
  
  res.json({
    status: errorRate < 0.05 ? 'healthy' : 'degraded',
    uptime: summary.uptime,
    queries: summary.queries.total,
    errors: summary.errors.total,
    errorRate
  });
});

app.listen(3000);
```

### Alerts

Set up alerts based on metrics:

```javascript
import { metrics } from 'quick-rag';

function checkHealth() {
  const summary = metrics.getSummary();
  
  // Check error rate
  const errorRate = summary.errors.total / summary.queries.total;
  if (errorRate > 0.05) {
    console.error('⚠️ High error rate:', errorRate);
    // Send alert to Slack, PagerDuty, etc.
  }
  
  // Check latency
  if (summary.queries.avgDuration > 500) {
    console.warn('⚠️ High query latency:', summary.queries.avgDuration);
  }
  
  // Check throughput
  if (summary.embeddings.avgThroughput < 10) {
    console.warn('⚠️ Low embedding throughput:', summary.embeddings.avgThroughput);
  }
}

setInterval(checkHealth, 60000); // Every minute
```

---

## Best Practices

### 1. Enable Appropriate Logging Levels

```javascript
// Development
const logger = createLogger({ level: 'debug', pretty: true });

// Production
const logger = createLogger({ level: 'info', pretty: false, logFile: './logs/app.log' });
```

### 2. Monitor Key Metrics

Focus on these critical metrics:

- **Query Duration** - Response time
- **Error Rate** - Percentage of failed operations
- **Throughput** - Operations per second
- **Top Score** - Search quality

### 3. Export Regularly

```javascript
// Export metrics every hour
setInterval(() => {
  const summary = metrics.getSummary();
  fs.writeFileSync(
    `./metrics/metrics-${Date.now()}.json`,
    JSON.stringify(summary, null, 2)
  );
}, 3600000);
```

### 4. Respect Privacy

- Telemetry hashes queries automatically
- Don't log sensitive user data
- Allow users to opt-out of telemetry

```javascript
// Optional: Disable telemetry
process.env.DISABLE_TELEMETRY = 'true';
```

### 5. Monitor Resource Usage

```javascript
import os from 'os';
import { logger } from 'quick-rag';

setInterval(() => {
  logger.info({
    memory: process.memoryUsage(),
    cpu: os.loadavg(),
    uptime: process.uptime()
  }, 'System metrics');
}, 300000); // Every 5 minutes
```

### 6. Set Up Alerts

Create alerts for:
- Error rate > 5%
- Average query duration > 500ms
- Memory usage > 80%
- Disk space < 20%

### 7. Use Structured Logging

Always include context in logs:

```javascript
// ❌ Bad
logger.info('Query completed');

// ✅ Good
logger.info({
  query: userQuery,
  duration: 125,
  docCount: 5,
  model: 'granite4:tiny-h'
}, 'Query completed');
```

### 8. Clean Up Old Logs

```javascript
import fs from 'fs';
import path from 'path';

function cleanOldLogs(logDir, daysToKeep = 30) {
  const files = fs.readdirSync(logDir);
  const now = Date.now();
  
  files.forEach(file => {
    const filePath = path.join(logDir, file);
    const stats = fs.statSync(filePath);
    const age = (now - stats.mtimeMs) / (1000 * 60 * 60 * 24);
    
    if (age > daysToKeep) {
      fs.unlinkSync(filePath);
      logger.info({ file }, 'Deleted old log file');
    }
  });
}

// Run daily
setInterval(() => cleanOldLogs('./logs'), 86400000);
```

---

## Example: Full Monitoring Setup

```javascript
import {
  OllamaRAGClient,
  createOllamaRAGEmbedding,
  InMemoryVectorStore,
  Retriever,
  metrics,
  telemetry,
  createLogger
} from 'quick-rag';
import express from 'express';

// Logger
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  logFile: './logs/production.log',
  pretty: false
});

// RAG Setup
const client = new OllamaRAGClient();
const embedFn = createOllamaRAGEmbedding(client, 'embeddinggemma');
const store = new InMemoryVectorStore(embedFn);
const retriever = new Retriever(store);

// Monitoring endpoints
const app = express();

app.get('/metrics', (req, res) => {
  res.json(metrics.getSummary());
});

app.get('/telemetry', (req, res) => {
  res.json(telemetry.getSessionSummary());
});

app.get('/health', (req, res) => {
  const summary = metrics.getSummary();
  const errorRate = summary.errors.total / (summary.queries.total || 1);
  
  res.json({
    status: errorRate < 0.05 ? 'healthy' : 'degraded',
    metrics: summary
  });
});

app.listen(3000, () => {
  logger.info({ port: 3000 }, 'Monitoring server started');
});

// Periodic reporting
setInterval(() => {
  const summary = metrics.getSummary();
  logger.info({ metrics: summary }, 'Periodic metrics report');
}, 300000); // Every 5 minutes

// Error alerts
function checkAlerts() {
  const summary = metrics.getSummary();
  const errorRate = summary.errors.total / (summary.queries.total || 1);
  
  if (errorRate > 0.05) {
    logger.error({ errorRate }, 'ALERT: High error rate');
    // Send to alerting service
  }
}

setInterval(checkAlerts, 60000); // Every minute
```

---

## Next Steps

- See [ERROR_HANDLING.md](./ERROR_HANDLING.md) for error management
- See [API_REFERENCE.md](./API_REFERENCE.md) for complete API documentation
- Check [/example](../example) for complete working examples

---

**Last Updated:** v2.1.0 (November 20, 2025)
