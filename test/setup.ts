import '@testing-library/jest-dom';

// Global test setup goes here
beforeAll(() => {
  // Setup any test environment variables
  process.env.NODE_ENV = 'test';
});

afterAll(() => {
  // Cleanup after all tests
});

// Reset any mocks between tests
afterEach(() => {
  jest.clearAllMocks();
});