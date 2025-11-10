#!/usr/bin/env node

/**
 * Development Server Launcher
 * Starts both Node.js and Python services together
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(color, prefix, message) {
  console.log(`${color}[${prefix}]${colors.reset} ${message}`);
}

// Cleanup function
const processes = [];
function cleanup() {
  log(colors.yellow, 'SHUTDOWN', 'Stopping all services...');
  processes.forEach(proc => {
    try {
      proc.kill();
    } catch (e) {
      // Ignore errors during cleanup
    }
  });
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Start Python service
log(colors.cyan, 'PYTHON', 'Starting Python Analytics Service on port 8000...');
const pythonExecutable = join(__dirname, '.venv', 'bin', 'python');
const pythonService = spawn(pythonExecutable, ['main.py'], {
  cwd: join(__dirname, 'python-service'),
  env: { ...process.env, PYTHONUNBUFFERED: '1', PORT: '8000' },
  stdio: ['ignore', 'pipe', 'pipe']
});

processes.push(pythonService);

pythonService.stdout.on('data', (data) => {
  const lines = data.toString().split('\n').filter(l => l.trim());
  lines.forEach(line => log(colors.cyan, 'PYTHON', line));
});

pythonService.stderr.on('data', (data) => {
  const lines = data.toString().split('\n').filter(l => l.trim());
  lines.forEach(line => log(colors.yellow, 'PYTHON', line));
});

pythonService.on('error', (error) => {
  log(colors.red, 'PYTHON', `Failed to start: ${error.message}`);
  log(colors.yellow, 'PYTHON', 'Continuing without Python service...');
});

pythonService.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    log(colors.red, 'PYTHON', `Exited with code ${code}`);
  }
});

// Wait a bit for Python to start, then start Node
setTimeout(() => {
  log(colors.green, 'NODE', 'Starting Node.js Development Server on port 3000...');
  
  const nodeServer = spawn('npm', ['run', 'dev:node'], {
    cwd: __dirname,
    env: { ...process.env, FORCE_COLOR: '1' },
    stdio: 'inherit',
    shell: true
  });

  processes.push(nodeServer);

  nodeServer.on('exit', (code) => {
    log(colors.yellow, 'NODE', `Server stopped with code ${code}`);
    cleanup();
  });
}, 2000);

console.log(`
╔═══════════════════════════════════════════════════════════╗
║   Integrated Lens System - Development Environment       ║
╚═══════════════════════════════════════════════════════════╝

  Services starting...
  
  Frontend:        http://localhost:3000
  Backend API:     http://localhost:3000/api
  Python Service:  http://localhost:8000
  
  Press Ctrl+C to stop all services
`);
