import { afterAll, afterEach, beforeAll, jest } from '@jest/globals';
import dotenv from 'dotenv';
import path from 'path';

// Load test environment variables first
const envPath = path.resolve(process.cwd(), '.env.test');
dotenv.config({ path: envPath });

// Set default test environment
process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL not set, using default test database');
  process.env.DATABASE_URL = 'postgresql://localhost:5432/ils_test';
}

// Increase timeout for slow tests
jest.setTimeout(30000);

// Mock console methods to reduce noise in test output (but keep errors visible)
const originalError = console.error;
const originalWarn = console.warn;

global.console = {
  ...console,
  error: (...args: any[]) => {
    // Allow critical database errors through
    if (args[0]?.includes?.('DATABASE_URL') || args[0]?.includes?.('FATAL')) {
      originalError(...args);
    }
  },
  warn: jest.fn(),
  log: jest.fn(),
};

// Global test setup goes here
beforeAll(() => {
  // Additional per-suite setup can be added here as needed
});

afterAll(() => {
  // Cleanup after all tests
});

// Reset any mocks between tests
afterEach(() => {
  jest.clearAllMocks();
});