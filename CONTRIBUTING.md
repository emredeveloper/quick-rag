# Contributing to Quick RAG

Thank you for your interest in contributing to Quick RAG! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Documentation](#documentation)
- [Submitting Changes](#submitting-changes)
- [Release Process](#release-process)

---

## Code of Conduct

### Our Standards

- Be respectful and inclusive
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards others

### Unacceptable Behavior

- Harassment, discrimination, or hate speech
- Trolling, insulting, or derogatory comments
- Publishing others' private information
- Other unprofessional conduct

---

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm 8+
- Git
- Ollama or LM Studio (for testing)

### Fork and Clone

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/YOUR_USERNAME/quick-rag.git
cd quick-rag

# Add upstream remote
git remote add upstream https://github.com/emredeveloper/quick-rag.git
```

### Install Dependencies

```bash
npm install
```

### Run Tests

```bash
npm test
```

---

## Development Setup

### Environment Setup

```bash
# Install Ollama models for testing
ollama pull granite4:tiny-h
ollama pull embeddinggemma

# Or use LM Studio
# Download and start LM Studio with a model
```

### Project Commands

```bash
# Run all tests
npm test

# Run specific test file
node test/vectorStore-crud.test.js

# Build the project
npm run build

# Watch mode (if available)
npm run dev
```

---

## Project Structure

```
quick-rag/
├── src/
│   ├── index.js              # Main exports
│   ├── index.d.ts            # TypeScript definitions
│   ├── ollamaRAGClient.js    # Ollama client wrapper
│   ├── lmstudioRAGClient.js  # LM Studio client wrapper
│   ├── vectorStore.js        # In-memory vector store
│   ├── retriever.js          # Document retrieval
│   ├── rag.js/ts             # RAG generation
│   ├── promptManager.js      # Prompt templates
│   ├── decisionEngine.js     # Smart retrieval
│   ├── embeddings/           # Embedding functions
│   ├── loaders/              # Document loaders
│   ├── stores/               # Vector store implementations
│   │   ├── abstractStore.ts  # Base class
│   │   ├── sqliteStore.js/ts # SQLite persistence
│   ├── errors/               # Error classes
│   ├── utils/                # Utilities
│   │   ├── chunking.js       # Text chunking
│   │   ├── logger.ts         # Structured logging
│   │   ├── metrics.js/ts     # Metrics collection
│   │   ├── telemetry.js/ts   # Event tracking
│   └── react/                # React hooks
├── test/                     # Test files
├── example/                  # Example scripts
├── docs/                     # Documentation
└── package.json
```

---

## Making Changes

### Branch Naming

Use descriptive branch names:

```bash
# Features
git checkout -b feature/add-chromadb-support

# Bug fixes
git checkout -b fix/embedding-dimension-mismatch

# Documentation
git checkout -b docs/improve-api-reference

# Refactoring
git checkout -b refactor/simplify-retriever
```

### Coding Standards

**JavaScript/TypeScript:**

- Use ESNext features
- Follow existing code style
- Use meaningful variable names
- Add JSDoc comments for public APIs
- Use async/await (not callbacks)

**Example:**

```javascript
/**
 * Retrieve relevant documents for a query
 * 
 * @param {string} query - The search query
 * @param {number} k - Number of results to return
 * @param {GetRelevantOptions} options - Search options
 * @returns {Promise<Document[]>} Relevant documents
 */
async function getRelevant(query, k = 3, options = {}) {
  // Validate input
  if (!query || typeof query !== 'string') {
    throw new Error('Query must be a non-empty string');
  }
  
  // Implementation
  const results = await this.vectorStore.similaritySearch(query, k);
  
  // Apply filters if provided
  if (options.filters) {
    return this._applyFilters(results, options.filters);
  }
  
  return results;
}
```

### Commit Messages

Use conventional commits:

```bash
# Format
<type>(<scope>): <subject>

# Examples
feat(sqlite): add batch insert support
fix(retriever): handle empty document store
docs(api): add examples for SmartRetriever
test(vectorStore): add edge case tests
refactor(rag): simplify prompt generation
perf(embeddings): optimize batch processing
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `test` - Adding tests
- `refactor` - Code refactoring
- `perf` - Performance improvement
- `chore` - Maintenance tasks
- `ci` - CI/CD changes

---

## Testing

### Test Structure

Place tests in `test/` directory:

```javascript
// test/myFeature.test.js
import assert from 'assert';
import { MyFeature } from '../src/myFeature.js';

console.log('🧪 Testing MyFeature...\n');

async function test_basic_functionality() {
  console.log('Testing basic functionality...');
  const feature = new MyFeature();
  const result = await feature.doSomething();
  assert.strictEqual(result, 'expected');
  console.log('✅ Basic functionality works');
}

async function test_edge_cases() {
  console.log('Testing edge cases...');
  const feature = new MyFeature();
  
  try {
    await feature.doSomething(null);
    assert.fail('Should have thrown error');
  } catch (error) {
    assert(error.message.includes('invalid input'));
  }
  
  console.log('✅ Edge cases handled');
}

async function runTests() {
  try {
    await test_basic_functionality();
    await test_edge_cases();
    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

runTests();
```

### Test Coverage

Ensure your changes include tests for:

- ✅ Happy path (normal usage)
- ✅ Edge cases (empty input, null, undefined)
- ✅ Error cases (invalid input, network errors)
- ✅ Boundary conditions (max/min values)
- ✅ Integration with existing features

### Running Tests

```bash
# Run all tests
npm test

# Run specific test
node test/myFeature.test.js

# Run integration tests
node test/run-integration.js
```

---

## Documentation

### Code Documentation

Add JSDoc comments for all public APIs:

```javascript
/**
 * Vector store for in-memory document storage
 * 
 * @class
 * @param {EmbeddingFunction} embeddingFn - Function to generate embeddings
 * @param {VectorStoreOptions} options - Configuration options
 * 
 * @example
 * const embedFn = createOllamaRAGEmbedding(client, 'embeddinggemma');
 * const store = new InMemoryVectorStore(embedFn, { defaultDim: 768 });
 * await store.addDocuments([{ text: 'Hello' }]);
 */
class InMemoryVectorStore {
  // ...
}
```

### README Updates

Update `README.md` for:

- New features
- API changes
- Installation requirements
- Usage examples

### API Documentation

Update `docs/API_REFERENCE.md` for:

- New classes, methods, or functions
- Changed signatures
- New options or parameters
- Deprecations

### Example Code

Add examples in `example/` directory:

```javascript
// example/my-feature-example.js
import { MyFeature } from 'quick-rag';

console.log('🚀 MyFeature Example\n');

async function main() {
  // 1. Setup
  const feature = new MyFeature();
  
  // 2. Basic usage
  const result = await feature.doSomething();
  console.log('Result:', result);
  
  // 3. Advanced usage
  const advanced = await feature.doAdvancedThing({
    option1: true,
    option2: 'value'
  });
  console.log('Advanced:', advanced);
}

main().catch(console.error);
```

---

## Submitting Changes

### Before Submitting

**Checklist:**

- [ ] Code follows project style
- [ ] Tests added and passing
- [ ] Documentation updated
- [ ] No TypeScript errors
- [ ] Commit messages follow convention
- [ ] Branch is up to date with main

```bash
# Update your branch
git fetch upstream
git rebase upstream/main

# Run tests
npm test

# Check for errors
npm run build
```

### Pull Request Process

1. **Create Pull Request**

   - Use a clear, descriptive title
   - Reference related issues
   - Describe your changes
   - List breaking changes (if any)

2. **PR Template**

   ```markdown
   ## Description
   Brief description of changes
   
   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update
   
   ## Related Issues
   Fixes #123
   
   ## Testing
   - [ ] Added tests for changes
   - [ ] All tests passing
   
   ## Documentation
   - [ ] Updated README
   - [ ] Updated API docs
   - [ ] Added examples
   
   ## Breaking Changes
   None / List any breaking changes
   ```

3. **Code Review**

   - Address reviewer feedback
   - Keep discussion professional
   - Update PR based on feedback

4. **Merging**

   - Maintainers will merge approved PRs
   - Squash commits if requested
   - Delete branch after merge

---

## Release Process

### Versioning

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** - Breaking changes
- **MINOR** - New features (backward compatible)
- **PATCH** - Bug fixes

### Release Checklist

**For Maintainers:**

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Run all tests
4. Build the project
5. Tag release
6. Publish to npm
7. Create GitHub release

```bash
# Update version
npm version patch  # or minor, major

# Build
npm run build

# Publish
npm publish

# Tag and push
git push origin main --tags
```

---

## Questions?

- 💬 Open a [Discussion](https://github.com/emredeveloper/quick-rag/discussions)
- 🐛 Report a [Bug](https://github.com/emredeveloper/quick-rag/issues)
- 💡 Request a [Feature](https://github.com/emredeveloper/quick-rag/issues)

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to Quick RAG! 🎉**
