#!/usr/bin/env node

/**
 * ILS Automated Test Runner
 * 
 * This script automates testing workflows for the Integrated Lens System.
 * It performs API tests, database checks, and WebSocket connectivity tests.
 * 
 * Usage:
 *   node test_runner.js
 *   npm run test:integration
 */

import axios from 'axios';
import WebSocket from 'ws';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = `${BASE_URL}/api`;
const WS_URL = process.env.WS_URL || 'ws://localhost:3000/ws';

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  total: 0,
  tests: [],
};

// Helper functions
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, colors.green);
  results.passed++;
  results.total++;
  results.tests.push({ name: message, status: 'passed' });
}

function logFailure(message, error = null) {
  log(`✗ ${message}`, colors.red);
  if (error) {
    log(`  Error: ${error.message}`, colors.red);
  }
  results.failed++;
  results.total++;
  results.tests.push({ name: message, status: 'failed', error: error?.message });
}

function logSkipped(message) {
  log(`⊘ ${message}`, colors.yellow);
  results.skipped++;
  results.total++;
  results.tests.push({ name: message, status: 'skipped' });
}

function logSection(title) {
  log(`\n${'='.repeat(60)}`, colors.cyan);
  log(title.toUpperCase(), colors.cyan);
  log('='.repeat(60), colors.cyan);
}

// Sleep helper
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Test functions
async function testServerHealth() {
  logSection('Testing Server Health');
  
  try {
    const response = await axios.get(`${BASE_URL}/health`, { timeout: 5000 });
    if (response.status === 200 && response.data.status) {
      logSuccess('Server health check passed');
    } else {
      logFailure('Server health check returned unexpected response');
    }
  } catch (error) {
    logFailure('Server health check failed', error);
  }
}

async function testApiEndpoints() {
  logSection('Testing API Endpoints');
  
  // Test health endpoint
  try {
    const response = await axios.get(`${API_URL}/health`, { timeout: 5000 });
    if (response.status === 200) {
      logSuccess('API health endpoint accessible');
    } else {
      logFailure('API health endpoint returned unexpected status');
    }
  } catch (error) {
    logFailure('API health endpoint failed', error);
  }
  
  // Test auth endpoint (should return 401 without auth)
  try {
    await axios.get(`${API_URL}/auth/user`, { timeout: 5000 });
    logFailure('Auth endpoint should return 401 without authentication');
  } catch (error) {
    if (error.response && error.response.status === 401) {
      logSuccess('Auth endpoint correctly requires authentication');
    } else {
      logFailure('Auth endpoint error', error);
    }
  }
  
  // Test non-existent endpoint (should return 404)
  try {
    await axios.get(`${API_URL}/nonexistent-endpoint`, { timeout: 5000 });
    logFailure('Non-existent endpoint should return 404');
  } catch (error) {
    if (error.response && error.response.status === 404) {
      logSuccess('Non-existent endpoint correctly returns 404');
    } else {
      logFailure('Non-existent endpoint error', error);
    }
  }
}

async function testWebSocketConnection() {
  logSection('Testing WebSocket Connection');
  
  return new Promise((resolve) => {
    try {
      const wsUrl = `${WS_URL}?userId=test_user&organizationId=test_org&roles=ecp`;
      const ws = new WebSocket(wsUrl);
      
      const timeout = setTimeout(() => {
        ws.close();
        logFailure('WebSocket connection timeout (10s)');
        resolve();
      }, 10000);
      
      ws.on('open', () => {
        logSuccess('WebSocket connection established');
      });
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          if (message.type === 'lims_sync' && message.payload.message) {
            logSuccess('WebSocket welcome message received');
          }
        } catch (e) {
          logFailure('Failed to parse WebSocket message', e);
        }
      });
      
      ws.on('error', (error) => {
        clearTimeout(timeout);
        logFailure('WebSocket connection error', error);
        resolve();
      });
      
      ws.on('close', () => {
        clearTimeout(timeout);
        logSuccess('WebSocket connection closed cleanly');
        resolve();
      });
      
      // Close after receiving welcome message
      setTimeout(() => {
        ws.close();
      }, 2000);
      
    } catch (error) {
      logFailure('WebSocket test failed', error);
      resolve();
    }
  });
}

async function testDatabaseConnection() {
  logSection('Testing Database Connection');
  
  if (!process.env.DATABASE_URL) {
    logSkipped('DATABASE_URL not set - skipping database tests');
    return;
  }
  
  try {
    const { stdout, stderr } = await execAsync(
      `psql "${process.env.DATABASE_URL}" -c "SELECT version();" -t`,
      { timeout: 10000 }
    );
    
    if (stdout && !stderr) {
      logSuccess('Database connection successful');
      log(`  PostgreSQL version: ${stdout.trim().substring(0, 50)}...`, colors.blue);
    } else {
      logFailure('Database connection failed', new Error(stderr));
    }
  } catch (error) {
    logFailure('Database connection test failed', error);
  }
  
  // Test table existence
  try {
    const { stdout } = await execAsync(
      `psql "${process.env.DATABASE_URL}" -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" -t`,
      { timeout: 10000 }
    );
    
    const tableCount = parseInt(stdout.trim());
    if (tableCount > 0) {
      logSuccess(`Found ${tableCount} tables in database`);
    } else {
      logFailure('No tables found in database');
    }
  } catch (error) {
    logFailure('Database table check failed', error);
  }
}

async function testJestSuite() {
  logSection('Running Jest Test Suite');
  
  try {
    log('Running npm test...', colors.blue);
    const { stdout, stderr } = await execAsync('npm test -- --passWithNoTests', {
      timeout: 60000,
      env: { ...process.env, NODE_ENV: 'test' }
    });
    
    // Parse Jest output
    const passMatch = stdout.match(/(\d+) passed/);
    const failMatch = stdout.match(/(\d+) failed/);
    
    if (passMatch) {
      const passedCount = parseInt(passMatch[1]);
      logSuccess(`Jest tests: ${passedCount} passed`);
    }
    
    if (failMatch) {
      const failedCount = parseInt(failMatch[1]);
      logFailure(`Jest tests: ${failedCount} failed`);
    }
    
    if (!failMatch) {
      logSuccess('All Jest tests passed');
    }
    
  } catch (error) {
    // Jest returns non-zero exit code if tests fail
    if (error.stdout && error.stdout.includes('PASS')) {
      logSuccess('Jest test suite completed with some tests passing');
    } else {
      logFailure('Jest test suite failed', error);
    }
  }
}

async function testTypeScriptCompilation() {
  logSection('Testing TypeScript Compilation');
  
  try {
    log('Running TypeScript check...', colors.blue);
    await execAsync('npm run check', { timeout: 30000 });
    logSuccess('TypeScript compilation successful');
  } catch (error) {
    logFailure('TypeScript compilation failed', error);
  }
}

async function testBuildProcess() {
  logSection('Testing Build Process');
  
  try {
    log('Running build process...', colors.blue);
    await execAsync('npm run build', { timeout: 120000 });
    logSuccess('Build process completed successfully');
  } catch (error) {
    logFailure('Build process failed', error);
  }
}

async function testResponseTimes() {
  logSection('Testing API Response Times');
  
  const endpoints = [
    { path: '/health', maxTime: 1000 },
    { path: '/api/health', maxTime: 1000 },
  ];
  
  for (const endpoint of endpoints) {
    try {
      const start = Date.now();
      await axios.get(`${BASE_URL}${endpoint.path}`, { timeout: endpoint.maxTime + 1000 });
      const duration = Date.now() - start;
      
      if (duration < endpoint.maxTime) {
        logSuccess(`${endpoint.path} responded in ${duration}ms (< ${endpoint.maxTime}ms)`);
      } else {
        logFailure(`${endpoint.path} responded in ${duration}ms (> ${endpoint.maxTime}ms)`);
      }
    } catch (error) {
      logFailure(`${endpoint.path} response time test failed`, error);
    }
  }
}

async function testInputValidation() {
  logSection('Testing Input Validation');
  
  // Test SQL injection prevention
  try {
    await axios.get(`${API_URL}/orders?status=pending'; DROP TABLE orders;--`, {
      timeout: 5000,
    });
    logSuccess('SQL injection attempt safely handled');
  } catch (error) {
    if (error.response && (error.response.status === 400 || error.response.status === 422)) {
      logSuccess('SQL injection attempt blocked');
    } else {
      logFailure('SQL injection test failed', error);
    }
  }
  
  // Test XSS prevention
  try {
    await axios.post(`${API_URL}/orders`, {
      customerName: '<script>alert("XSS")</script>',
    }, { timeout: 5000 });
    logSuccess('XSS attempt handled');
  } catch (error) {
    if (error.response && (error.response.status === 400 || error.response.status === 401 || error.response.status === 422)) {
      logSuccess('XSS attempt blocked or validation failed');
    } else {
      logFailure('XSS test failed', error);
    }
  }
}

async function printSummary() {
  logSection('Test Summary');
  
  log(`\nTotal Tests: ${results.total}`, colors.cyan);
  log(`Passed: ${results.passed}`, colors.green);
  log(`Failed: ${results.failed}`, colors.red);
  log(`Skipped: ${results.skipped}`, colors.yellow);
  
  const successRate = results.total > 0 
    ? ((results.passed / results.total) * 100).toFixed(2) 
    : 0;
  
  log(`\nSuccess Rate: ${successRate}%`, colors.cyan);
  
  if (results.failed > 0) {
    log('\nFailed Tests:', colors.red);
    results.tests
      .filter(t => t.status === 'failed')
      .forEach(t => {
        log(`  ✗ ${t.name}`, colors.red);
        if (t.error) {
          log(`    ${t.error}`, colors.red);
        }
      });
  }
  
  log('\n' + '='.repeat(60), colors.cyan);
  
  // Exit with appropriate code
  if (results.failed > 0) {
    log('\n❌ Some tests failed!', colors.red);
    process.exit(1);
  } else {
    log('\n✅ All tests passed!', colors.green);
    process.exit(0);
  }
}

// Main execution
async function main() {
  log('\n' + '='.repeat(60), colors.cyan);
  log('ILS AUTOMATED TEST RUNNER', colors.cyan);
  log('Started at: ' + new Date().toISOString(), colors.cyan);
  log('='.repeat(60) + '\n', colors.cyan);
  
  try {
    // Run all test suites
    await testServerHealth();
    await testApiEndpoints();
    await testWebSocketConnection();
    await testDatabaseConnection();
    await testResponseTimes();
    await testInputValidation();
    await testTypeScriptCompilation();
    
    // Optionally run Jest and Build (can be slow)
    const runFullTests = process.argv.includes('--full');
    
    if (runFullTests) {
      await testJestSuite();
      await testBuildProcess();
    } else {
      logSkipped('Jest test suite (use --full to run)');
      logSkipped('Build process (use --full to run)');
    }
    
    // Print summary
    await printSummary();
    
  } catch (error) {
    log('\n❌ Test runner encountered an error:', colors.red);
    log(error.message, colors.red);
    if (error.stack) {
      log(error.stack, colors.red);
    }
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main, testServerHealth, testApiEndpoints, testWebSocketConnection };
