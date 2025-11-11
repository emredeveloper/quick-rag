// Windows-compatible test runner for integration tests
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

process.env.RUN_INTEGRATION_TESTS = 'true';

const testFile = join(__dirname, 'run-tests.js');
const child = spawn('node', [testFile], {
  stdio: 'inherit',
  env: { ...process.env, RUN_INTEGRATION_TESTS: 'true' },
  shell: true
});

child.on('exit', (code) => {
  process.exit(code || 0);
});

