import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Building Quick RAG...');

// 1. Clean dist
if (fs.existsSync('dist')) {
    console.log('🧹 Cleaning dist...');
    fs.rmSync('dist', { recursive: true, force: true });
}
fs.mkdirSync('dist');

// 2. Compile TypeScript (if any .ts files exist)
// Currently we are using JSDoc + checkJs, so we just copy files
// But we'll run tsc to generate declarations
try {
    console.log('📝 Generating type declarations...');
    execSync('npx tsc --emitDeclarationOnly', { stdio: 'inherit' });
} catch (e) {
    console.warn('⚠️ Type generation warning (non-fatal)');
}

// 3. Copy Source Files
console.log('📦 Copying source files...');

function copyDir(src, dest) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

copyDir('src', 'dist');

console.log('✅ Build complete!');
