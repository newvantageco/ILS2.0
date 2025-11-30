import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import jestPlugin from 'eslint-plugin-jest';
import globals from 'globals';

export default tseslint.config(
  // Global ignores (replaces .eslintignore)
  {
    ignores: [
      'node_modules/',
      'dist/',
      'build/',
      'coverage/',
      'playwright-report/',
      'test-results/',
      '.nyc_output/',
      '*.log',
      'vite.config.ts.timestamp-*',
      'package-lock.json',
      'archive/',
      'attached_assets/',
      '.backup/',
      '**/public/service-worker.js',
      '**/public/shopify-widgets/**',
      'client/shopify-widgets/**',
    ],
  },

  // Base ESLint recommended rules
  js.configs.recommended,

  // TypeScript configuration
  ...tseslint.configs.recommended,

  // React configuration
  {
    files: ['**/*.{jsx,tsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'jsx-a11y': jsxA11yPlugin,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // React rules
      ...reactPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/display-name': 'off', // Too strict for forwardRef and memo patterns
      'react/no-unknown-property': ['error', { ignore: ['cmdk-input-wrapper'] }], // Allow cmdk custom attrs

      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'off', // Common source of false positives

      // JSX Accessibility rules - turned off for now, enable in dedicated a11y pass
      'jsx-a11y/anchor-is-valid': 'off',
      'jsx-a11y/click-events-have-key-events': 'off',
      'jsx-a11y/no-static-element-interactions': 'off',
      'jsx-a11y/label-has-associated-control': 'off',
      'jsx-a11y/img-redundant-alt': 'off',
      'jsx-a11y/aria-props': 'off',
      'jsx-a11y/aria-proptypes': 'off',
      'jsx-a11y/aria-unsupported-elements': 'off',
      'jsx-a11y/role-has-required-aria-props': 'off',
      'jsx-a11y/role-supports-aria-props': 'off',
    },
  },

  // Server-side TypeScript configuration
  {
    files: ['server/**/*.ts', 'shared/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // Allow require for dynamic imports of native modules
      '@typescript-eslint/no-require-imports': 'off',
      // Allow namespaces in server code for legacy patterns
      '@typescript-eslint/no-namespace': 'off',
      // Allow Function type for event handlers and callbacks
      '@typescript-eslint/no-unsafe-function-type': 'off',
    },
  },

  // Database and packages configuration
  {
    files: ['db/**/*.ts', 'packages/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-namespace': 'off',
    },
  },

  // Service worker configuration
  {
    files: ['**/service-worker.js', '**/sw.js'],
    languageOptions: {
      globals: {
        ...globals.serviceworker,
        caches: 'readonly',
        clients: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
    },
  },

  // Scripts configuration
  {
    files: ['scripts/**/*.{js,mjs,ts}', '*.config.{js,mjs,ts}', '*.mjs'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },

  // k6 load test configuration
  {
    files: ['**/load-test.js', '**/load-test.mjs'],
    languageOptions: {
      globals: {
        __ENV: 'readonly',
        open: 'readonly',
        sleep: 'readonly',
        check: 'readonly',
        group: 'readonly',
        fail: 'readonly',
      },
    },
    rules: {
      'no-undef': 'off', // k6 has special runtime
      'no-dupe-keys': 'warn', // Allow for threshold definitions
    },
  },

  // Test files configuration
  {
    files: ['**/*.test.{ts,tsx,js,jsx}', 'test/**/*.{ts,tsx,js,jsx,mjs}'],
    plugins: {
      jest: jestPlugin,
    },
    languageOptions: {
      globals: {
        ...globals.jest,
        ...globals.node,
      },
    },
    rules: {
      ...jestPlugin.configs.recommended.rules,
      'jest/no-disabled-tests': 'off', // Allow intentionally skipped tests
      'jest/no-focused-tests': 'error',
      'jest/no-identical-title': 'off', // Allow similar titles in different contexts
      'jest/prefer-to-have-length': 'off', // Style preference
      'jest/valid-expect': 'error',
      'jest/no-export': 'off', // Allow exports in test utilities
      'jest/expect-expect': 'off', // Allow setup/teardown tests without assertions
      '@typescript-eslint/no-require-imports': 'off',
    },
  },

  // Example files configuration
  {
    files: ['examples/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'no-console': 'off',
    },
  },

  // Types declaration files
  {
    files: ['types/**/*.d.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // Global rules for all files
  {
    files: ['**/*.{ts,tsx,js,jsx,mjs}'],
    rules: {
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off', // Too many legacy uses - consider enabling gradually
      '@typescript-eslint/no-unused-vars': 'off', // Many API patterns require unused params
      '@typescript-eslint/no-unsafe-function-type': 'off', // Common pattern in event handlers
      '@typescript-eslint/no-namespace': 'off', // Legacy pattern, not harmful
      'no-console': 'off', // Intentional logging throughout codebase
      'no-case-declarations': 'off', // Common pattern, wrap in blocks if needed
      'no-async-promise-executor': 'off', // Pattern used in some places
    },
  }
);
