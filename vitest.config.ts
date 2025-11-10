import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()] as any, // Type assertion to fix Vite version mismatch
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.vitest.ts'],
    include: [
      'test/components/**/*.{test,spec}.{ts,tsx}',
      'test/unit/**/*.{test,spec}.{ts,tsx}',
      'client/src/**/*.{test,spec}.{ts,tsx}',
    ],
    exclude: [
      'node_modules',
      'dist',
      'build',
      'test/e2e/**',
      'test/unit/example.test.ts', // Jest-based test
      'test/integration/api.test.ts', // Jest-based test
      'test/EquipmentDiscoveryService.test.ts', // Old test files
      'test/NotificationService.test.ts',
      'test/PDFGenerationService.test.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@shared': path.resolve(__dirname, './shared'),
    },
  },
});
