/**
 * Web Loaders
 * Load content from URLs and web pages
 */

/**
 * Load content from URL
 * @param {string} url - URL to fetch
 * @param {Object} options - Options
 * @param {Object} options.headers - Custom headers
 * @param {boolean} options.extractText - Extract text from HTML (default: true)
 * @returns {Promise<{text: string, meta: Object}>}
 */
export async function loadURL(url, options = {}) {
  const { headers = {}, extractText = true } = options;

  let fetchModule;
  if (typeof fetch === 'undefined') {
    // Node.js < 18 - use node-fetch
    fetchModule = (await import('node-fetch')).default;
  } else {
    fetchModule = fetch;
  }

  const response = await fetchModule(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Quick-RAG Document Loader)',
      ...headers
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type') || '';
  let text = await response.text();

  // Extract text from HTML if enabled
  if (extractText && contentType.includes('text/html')) {
    text = extractTextFromHTML(text);
  }

  return {
    text,
    meta: {
      url,
      contentType,
      format: 'url',
      loadedAt: new Date().toISOString(),
      ...options.meta
    }
  };
}

/**
 * Simple HTML to text converter
 * Removes scripts, styles, and HTML tags
 * @param {string} html - HTML content
 * @returns {string} Plain text
 */
function extractTextFromHTML(html) {
  // Remove script and style tags
  let text = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, ' ');

  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&[a-z]+;/gi, '');

  // Clean up whitespace
  text = text
    .replace(/\n\s*\n/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();

  return text;
}

/**
 * Load multiple URLs
 * @param {string[]} urls - Array of URLs
 * @param {Object} options - Options (same as loadURL)
 * @returns {Promise<Array<{text: string, meta: Object}>>}
 */
export async function loadURLs(urls, options = {}) {
  const results = await Promise.allSettled(
    urls.map(url => loadURL(url, options))
  );

  return results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value);
}

/**
 * Load sitemap and extract URLs
 * @param {string} sitemapURL - Sitemap URL (usually /sitemap.xml)
 * @param {Object} options - Options
 * @returns {Promise<string[]>} Array of URLs from sitemap
 */
export async function loadSitemap(sitemapURL, options = {}) {
  const { text } = await loadURL(sitemapURL, { extractText: false });
  
  // Extract URLs from sitemap XML
  const urlMatches = text.matchAll(/<loc>(.*?)<\/loc>/g);
  const urls = [...urlMatches].map(match => match[1]);

  return urls;
}
