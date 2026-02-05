import {
  loadText,
  loadJSON,
  loadMarkdown,
  loadURL
} from 'quick-rag';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const txt = await loadText(join(__dirname, 'sample.txt'));
const json = await loadJSON(join(__dirname, 'sample.json'));
const md = await loadMarkdown(join(__dirname, 'sample.md'));

console.log('text chars:', txt.text.length);
console.log('json keys:', Object.keys(json.data || {}).length);
console.log('markdown chars:', md.text.length);

try {
  const urlDoc = await loadURL('https://example.com');
  console.log('url chars:', urlDoc.text.length);
} catch (err) {
  console.log('url load skipped:', err.message);
}
