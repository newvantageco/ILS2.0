export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  // Only run server/unit/integration tests with Jest. Component tests use Vitest.
  // Only run integration and server tests with Jest. Unit/component tests use Vitest.
    // Only run integration tests with Jest. Unit and server tests are executed with Vitest in this repo.
    testMatch: ['<rootDir>/test/integration/**/*.test.ts'],
    // Ignore specific integration/unit tests that are authored for Vitest.
    testPathIgnorePatterns: ['<rootDir>/test/integration/orderSubmission.integration.test.ts', '<rootDir>/test/integration/redisStreams.integration.test.ts'],
  moduleNameMapper: {
    // In Jest we want @/ to resolve to server code (server tests use '@/services/...').
    '^@/(.*)$': '<rootDir>/server/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1',
    '^(\.{1,2}/.*)\.js$': '$1',
    // Fix drizzle-orm module resolution
    '^drizzle-orm/(.*)$': '<rootDir>/node_modules/drizzle-orm/$1'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(zod|drizzle-orm|@neondatabase)/)'
  ],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        allowJs: true,
        target: 'es2020',
        strict: true,
        esModuleInterop: true,
        module: 'commonjs',
        moduleResolution: 'node',
        types: ['jest', 'node'],
        baseUrl: '.',
        paths: {
          '@/*': ['client/src/*'],
          '@shared/*': ['shared/*']
        }
      }
    }]
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node']
};