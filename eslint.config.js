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

      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // JSX Accessibility rules
      'jsx-a11y/anchor-is-valid': 'warn',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
      'jsx-a11y/label-has-associated-control': 'warn',
      'jsx-a11y/img-redundant-alt': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-proptypes': 'error',
      'jsx-a11y/aria-unsupported-elements': 'error',
      'jsx-a11y/role-has-required-aria-props': 'error',
      'jsx-a11y/role-supports-aria-props': 'error',
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
    },
  },

  // Test files configuration
  {
    files: ['**/*.test.{ts,tsx,js,jsx}', 'test/**/*.{ts,tsx,js,jsx}'],
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
      'jest/no-disabled-tests': 'warn',
      'jest/no-focused-tests': 'error',
      'jest/no-identical-title': 'error',
      'jest/prefer-to-have-length': 'warn',
      'jest/valid-expect': 'error',
    },
  },

  // Global rules for all files
  {
    files: ['**/*.{ts,tsx,js,jsx,mjs}'],
    rules: {
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'warn',
    },
  }
);
