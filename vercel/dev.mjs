/**
 * Dev server for Next.js app
 * Runs on port 3001
 */
import { createServer as createHttpServer } from 'http';
import { createNextApp } from 'next/dist/server/lib/start-server.js';
import { getRequestHandler } from 'next/dist/server/lib/utils.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3001;
const appDir = __dirname;

console.log('Starting Next.js dev server on port', PORT);
console.log('Visit http://localhost:' + PORT);

// For development, just run 'next dev' using spawn
import { spawn } from 'child_process';
const proc = spawn('node', [path.join(__dirname, 'node_modules/.bin/next'), 'dev', '-p', PORT.toString()], {
  stdio: 'inherit',
  cwd: __dirname
});

proc.on('exit', (code) => {
  process.exit(code);
});
