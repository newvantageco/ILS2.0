import { afterAll, afterEach, beforeAll, jest } from '@jest/globals';

process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgres://user:password@localhost:5432/test';
}

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