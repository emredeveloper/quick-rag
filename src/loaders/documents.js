/**
 * Document Loaders
 * Load and parse various document formats (PDF, Word, Excel, etc.)
 * These are optional dependencies - install only what you need
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * Load PDF document
 * Requires: npm install pdf-parse
 * @param {string} filePath - Path to PDF file
 * @param {Object} options - Options
 * @returns {Promise<{text: string, meta: Object}>}
 */
export async function loadPDF(filePath, options = {}) {
  try {
    // Dynamic import to avoid bundling in browser
    const pdfParse = (await import('pdf-parse')).default;
    
    const buffer = await fs.readFile(filePath);
    const data = await pdfParse(buffer);

    return {
      text: data.text,
      meta: {
        fileName: path.basename(filePath),
        filePath,
        format: 'pdf',
        pages: data.numpages,
        info: data.info,
        ...options.meta
      }
    };
  } catch (err) {
    if (err.code === 'ERR_MODULE_NOT_FOUND') {
      throw new Error('PDF support requires: npm install pdf-parse');
    }
    throw err;
  }
}

/**
 * Load Word document (.docx)
 * Requires: npm install mammoth
 * @param {string} filePath - Path to Word file
 * @param {Object} options - Options
 * @returns {Promise<{text: string, meta: Object}>}
 */
export async function loadWord(filePath, options = {}) {
  try {
    const mammoth = await import('mammoth');
    
    const buffer = await fs.readFile(filePath);
    const result = await mammoth.extractRawText({ buffer });

    return {
      text: result.value,
      meta: {
        fileName: path.basename(filePath),
        filePath,
        format: 'docx',
        messages: result.messages,
        ...options.meta
      }
    };
  } catch (err) {
    if (err.code === 'ERR_MODULE_NOT_FOUND') {
      throw new Error('Word support requires: npm install mammoth');
    }
    throw err;
  }
}

/**
 * Load Excel document (.xlsx, .xls)
 * Requires: npm install xlsx
 * @param {string} filePath - Path to Excel file
 * @param {Object} options - Options
 * @param {string} options.sheetName - Specific sheet to load (default: first sheet)
 * @param {boolean} options.allSheets - Load all sheets (default: false)
 * @returns {Promise<{text: string, meta: Object, sheets?: Object}>}
 */
export async function loadExcel(filePath, options = {}) {
  try {
    const XLSX = await import('xlsx');
    
    const buffer = await fs.readFile(filePath);
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    let text = '';
    let sheetsData = {};

    if (options.allSheets) {
      // Load all sheets
      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const sheetText = XLSX.utils.sheet_to_csv(sheet);
        text += `\n\n=== Sheet: ${sheetName} ===\n${sheetText}`;
        sheetsData[sheetName] = XLSX.utils.sheet_to_json(sheet);
      });
    } else {
      // Load specific sheet or first sheet
      const sheetName = options.sheetName || workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      text = XLSX.utils.sheet_to_csv(sheet);
      sheetsData[sheetName] = XLSX.utils.sheet_to_json(sheet);
    }

    return {
      text: text.trim(),
      meta: {
        fileName: path.basename(filePath),
        filePath,
        format: 'excel',
        sheetNames: workbook.SheetNames,
        ...options.meta
      },
      sheets: sheetsData
    };
  } catch (err) {
    if (err.code === 'ERR_MODULE_NOT_FOUND') {
      throw new Error('Excel support requires: npm install xlsx');
    }
    throw err;
  }
}

/**
 * Load plain text file
 * @param {string} filePath - Path to text file
 * @param {Object} options - Options
 * @param {string} options.encoding - File encoding (default: 'utf-8')
 * @returns {Promise<{text: string, meta: Object}>}
 */
export async function loadText(filePath, options = {}) {
  const encoding = options.encoding || 'utf-8';
  const text = await fs.readFile(filePath, encoding);

  return {
    text,
    meta: {
      fileName: path.basename(filePath),
      filePath,
      format: 'text',
      encoding,
      ...options.meta
    }
  };
}

/**
 * Load JSON file
 * @param {string} filePath - Path to JSON file
 * @param {Object} options - Options
 * @param {string} options.textField - Field to extract as text (default: stringify all)
 * @returns {Promise<{text: string, meta: Object, data: Object}>}
 */
export async function loadJSON(filePath, options = {}) {
  const content = await fs.readFile(filePath, 'utf-8');
  const data = JSON.parse(content);

  let text;
  if (options.textField && data[options.textField]) {
    text = String(data[options.textField]);
  } else {
    text = JSON.stringify(data, null, 2);
  }

  return {
    text,
    data,
    meta: {
      fileName: path.basename(filePath),
      filePath,
      format: 'json',
      ...options.meta
    }
  };
}

/**
 * Load Markdown file
 * @param {string} filePath - Path to Markdown file
 * @param {Object} options - Options
 * @param {boolean} options.stripMarkdown - Remove markdown syntax (default: false)
 * @returns {Promise<{text: string, meta: Object}>}
 */
export async function loadMarkdown(filePath, options = {}) {
  let text = await fs.readFile(filePath, 'utf-8');

  if (options.stripMarkdown) {
    // Basic markdown stripping
    text = text
      .replace(/^#+\s+/gm, '') // Headers
      .replace(/\*\*(.+?)\*\*/g, '$1') // Bold
      .replace(/\*(.+?)\*/g, '$1') // Italic
      .replace(/`(.+?)`/g, '$1') // Inline code
      .replace(/```[\s\S]*?```/g, '') // Code blocks
      .replace(/\[(.+?)\]\(.+?\)/g, '$1'); // Links
  }

  return {
    text,
    meta: {
      fileName: path.basename(filePath),
      filePath,
      format: 'markdown',
      ...options.meta
    }
  };
}

/**
 * Auto-detect file type and load document
 * @param {string} filePath - Path to document
 * @param {Object} options - Options passed to specific loader
 * @returns {Promise<{text: string, meta: Object}>}
 */
export async function loadDocument(filePath, options = {}) {
  const ext = path.extname(filePath).toLowerCase();

  switch (ext) {
    case '.pdf':
      return loadPDF(filePath, options);
    case '.docx':
    case '.doc':
      return loadWord(filePath, options);
    case '.xlsx':
    case '.xls':
      return loadExcel(filePath, options);
    case '.json':
      return loadJSON(filePath, options);
    case '.md':
    case '.markdown':
      return loadMarkdown(filePath, options);
    case '.txt':
    case '.text':
      return loadText(filePath, options);
    default:
      // Try as plain text
      try {
        return await loadText(filePath, options);
      } catch {
        throw new Error(`Unsupported file format: ${ext}`);
      }
  }
}

/**
 * Load multiple documents from a directory
 * @param {string} dirPath - Directory path
 * @param {Object} options - Options
 * @param {string[]} options.extensions - File extensions to include (default: all supported)
 * @param {boolean} options.recursive - Search subdirectories (default: false)
 * @returns {Promise<Array<{text: string, meta: Object}>>}
 */
export async function loadDirectory(dirPath, options = {}) {
  const {
    extensions = ['.pdf', '.docx', '.doc', '.xlsx', '.xls', '.txt', '.md', '.json'],
    recursive = false
  } = options;

  const documents = [];
  
  async function scanDir(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory() && recursive) {
        await scanDir(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (extensions.includes(ext)) {
          try {
            const doc = await loadDocument(fullPath, options);
            documents.push(doc);
          } catch (err) {
            console.warn(`Failed to load ${fullPath}:`, err.message);
          }
        }
      }
    }
  }

  await scanDir(dirPath);
  return documents;
}
