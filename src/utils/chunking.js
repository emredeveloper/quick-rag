/**
 * Text Chunking Utilities
 * Split long documents into smaller chunks for better retrieval
 */

/**
 * Split text into chunks with overlap
 * @param {string} text - Text to split
 * @param {Object} options - Chunking options
 * @param {number} options.chunkSize - Maximum characters per chunk (default: 500)
 * @param {number} options.overlap - Overlapping characters between chunks (default: 50)
 * @param {string|RegExp} options.separator - Text separator (default: '\n\n')
 * @returns {string[]} Array of text chunks
 */
export function chunkText(text, options = {}) {
  const {
    chunkSize = 500,
    overlap = 50,
    separator = '\n\n'
  } = options;

  if (!text || typeof text !== 'string') {
    return [];
  }

  // If text is smaller than chunk size, return as-is
  if (text.length <= chunkSize) {
    return [text];
  }

  // Split by separator first (paragraphs, sentences, etc.)
  const segments = text.split(separator).filter(s => s.trim().length > 0);
  const chunks = [];
  let currentChunk = '';

  for (const segment of segments) {
    // If single segment is larger than chunk size, split it
    if (segment.length > chunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }

      // Split large segment by character limit with overlap
      // IMPROVEMENT: Avoid splitting words in the middle
      let start = 0;
      while (start < segment.length) {
        let end = start + chunkSize;
        if (end < segment.length) {
          // Look for last space within the chunk to avoid splitting words
          const lastSpace = segment.lastIndexOf(' ', end);
          if (lastSpace > start + (chunkSize * 0.8)) {
            end = lastSpace;
          }
        }

        const chunk = segment.slice(start, end).trim();
        if (chunk) chunks.push(chunk);

        // Safety: ensure we always make progress
        const nextStart = end - overlap;
        if (nextStart <= start) {
          // If we're not making progress, force advance by at least 1
          start = start + Math.max(1, chunkSize);
        } else {
          start = nextStart;
        }

        if (end >= segment.length) break;
      }
      continue;
    }

    // Try to add segment to current chunk
    if (currentChunk.length + segment.length + separator.length <= chunkSize) {
      currentChunk += (currentChunk ? separator : '') + segment;
    } else {
      // Current chunk is full, start new one
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = segment;
    }
  }

  // Add remaining chunk
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Split text by sentences with smart overlap
 * @param {string} text - Text to split
 * @param {Object} options - Options
 * @param {number} options.sentencesPerChunk - Sentences per chunk (default: 5)
 * @param {number} options.overlapSentences - Overlapping sentences (default: 1)
 * @returns {string[]} Array of text chunks
 */
export function chunkBySentences(text, options = {}) {
  let {
    sentencesPerChunk = 5,
    overlapSentences = 1
  } = options;

  // Ensure overlap is valid
  if (overlapSentences >= sentencesPerChunk) {
    overlapSentences = Math.max(0, sentencesPerChunk - 1);
  }
  const step = Math.max(1, sentencesPerChunk - overlapSentences);

  if (!text || typeof text !== 'string') {
    return [];
  }

  // Common abbreviations to avoid splitting on
  const abbreviations = ['mr', 'mrs', 'ms', 'dr', 'prof', 'inc', 'ltd', 'corp', 'jr', 'sr', 'st', 'dept', 'vs', 'etc', 'vol', 'fig', 'approx'];
  const abbrRegex = new RegExp(`\\b(${abbreviations.join('|')})\\.`, 'gi');

  // Split into sentences (handles common abbreviations)
  const sentences = text
    .replace(abbrRegex, '$1《DOT》') // Temporarily replace dots in abbreviations
    .replace(/([.!?])\s+/g, '$1|')
    .split('|')
    .map(s => s.trim().replace(/《DOT》/g, '.'))
    .filter(s => s.length > 0);

  if (sentences.length <= sentencesPerChunk) {
    return [text];
  }

  const chunks = [];
  for (let i = 0; i < sentences.length; i += step) {
    const chunk = sentences.slice(i, i + sentencesPerChunk).join(' ');
    chunks.push(chunk);

    // Break if we've reached the end
    if (i + sentencesPerChunk >= sentences.length) {
      break;
    }
  }

  return chunks;
}

/**
 * Chunk documents with metadata preservation
 * @param {Array<{text: string, meta?: object}>} docs - Documents to chunk
 * @param {Object} options - Chunking options (same as chunkText)
 * @returns {Array<{text: string, meta: object}>} Chunked documents with preserved metadata
 */
export function chunkDocuments(docs, options = {}) {
  const chunks = [];

  docs.forEach((doc, docIndex) => {
    const textChunks = chunkText(doc.text, options);

    textChunks.forEach((chunk, chunkIndex) => {
      chunks.push({
        text: chunk,
        meta: {
          ...doc.meta,
          sourceDocIndex: docIndex,
          chunkIndex,
          totalChunks: textChunks.length,
          originalId: doc.id
        },
        id: doc.id ? `${doc.id}_chunk_${chunkIndex}` : undefined
      });
    });
  });

  return chunks;
}

/**
 * Smart chunking with markdown awareness
 * Preserves markdown structure and code blocks
 * @param {string} markdown - Markdown text
 * @param {Object} options - Chunking options
 * @returns {string[]} Array of markdown chunks
 */
export function chunkMarkdown(markdown, options = {}) {
  const { chunkSize = 1000, overlap = 100 } = options;

  if (!markdown || markdown.length <= chunkSize) {
    return [markdown];
  }

  const chunks = [];
  const lines = markdown.split('\n');
  let currentChunk = '';
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track code blocks
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
    }

    // Check if adding this line would exceed chunk size
    if (!inCodeBlock && currentChunk.length + line.length + 1 > chunkSize && currentChunk) {
      chunks.push(currentChunk.trim());

      // Add overlap (last few lines)
      const overlapLines = currentChunk.split('\n').slice(-Math.floor(overlap / 50));
      currentChunk = overlapLines.join('\n') + '\n';
    }

    currentChunk += line + '\n';
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}
