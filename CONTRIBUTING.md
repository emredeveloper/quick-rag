# Contributing to Quick RAG

First off, thank you for considering contributing to Quick RAG! 🎉

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Style Guidelines](#style-guidelines)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## How Can I Contribute?

### 🐛 Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/emredeveloper/quick-rag/issues)
2. If not, create a new issue using the bug report template
3. Include:
   - Clear description of the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (Node.js version, OS, etc.)

### 💡 Suggesting Features

1. Check existing feature requests first
2. Open a new issue with the feature request template
3. Describe:
   - The problem you're trying to solve
   - Your proposed solution
   - Alternative solutions considered

### 🔧 Code Contributions

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit with a clear message: `git commit -m 'Add amazing feature'`
6. Push to your fork: `git push origin feature/amazing-feature`
7. Open a Pull Request

## Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Ollama or LM Studio (for integration tests)

### Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/quick-rag.git
cd quick-rag

# Install dependencies
npm install

# Run tests
npm test

# Run integration tests (requires Ollama/LM Studio)
npm run test:integration
```

### Project Structure

```
quick-rag/
├── src/           # Source code
│   ├── search/    # BM25, Hybrid Search, Reranker
│   ├── query/     # Query transformation
│   ├── stores/    # Vector stores (SQLite, etc.)
│   ├── loaders/   # Document loaders
│   ├── errors/    # Custom error classes
│   └── utils/     # Utilities (chunking, logging)
├── test/          # Test files
├── example/       # Example files
└── docs/          # Documentation
```

## Pull Request Process

1. **Update Documentation**: If you're adding features, update README.md and relevant docs
2. **Add Tests**: All new features should have tests
3. **Follow Style Guide**: Ensure your code follows the project style
4. **Update CHANGELOG**: Add your changes to CHANGELOG.md
5. **Request Review**: Tag maintainers for review

### PR Checklist

- [ ] Tests pass (`npm test`)
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] No breaking changes (or clearly documented)

## Style Guidelines

### JavaScript/TypeScript

- Use ES6+ features
- Use `const` and `let`, avoid `var`
- Use async/await over callbacks
- Add JSDoc comments for public APIs

### Commit Messages

Use clear, descriptive commit messages:

```
feat: add BM25 search algorithm
fix: resolve embedding dimension mismatch
docs: update API reference
test: add hybrid search tests
```

### Documentation

- Use clear, concise language
- Include code examples
- Keep examples runnable

## 🙏 Thank You!

Your contributions make Quick RAG better for everyone. Thank you for your time and effort!

---

**Questions?** Open an issue or reach out to the maintainers.
