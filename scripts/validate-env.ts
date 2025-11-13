#!/usr/bin/env tsx

/**
 * Environment Variable Validation Script
 *
 * Validates that all required environment variables are set for Railway deployment.
 * Run this before deploying to catch configuration issues early.
 *
 * Usage:
 *   npx tsx scripts/validate-env.ts
 *   npm run validate:env
 */

import * as dotenv from 'dotenv';

// Load .env file if it exists (for local testing)
dotenv.config();

interface EnvVar {
  name: string;
  required: boolean;
  description: string;
  validator?: (value: string) => boolean;
  errorMessage?: string;
}

const ENV_VARS: EnvVar[] = [
  // Core Application
  {
    name: 'NODE_ENV',
    required: true,
    description: 'Environment mode (development, production)',
    validator: (val) => ['development', 'production', 'test'].includes(val),
    errorMessage: 'Must be one of: development, production, test'
  },
  {
    name: 'PORT',
    required: false,
    description: 'Application port (Railway auto-assigns)',
    validator: (val) => !isNaN(parseInt(val)) && parseInt(val) > 0 && parseInt(val) < 65536,
    errorMessage: 'Must be a valid port number (1-65535)'
  },
  {
    name: 'HOST',
    required: false,
    description: 'Host to bind to (default: 0.0.0.0)'
  },
  {
    name: 'APP_URL',
    required: true,
    description: 'Full application URL (e.g., https://app.yourdomain.com)',
    validator: (val) => val.startsWith('http://') || val.startsWith('https://'),
    errorMessage: 'Must be a valid URL starting with http:// or https://'
  },

  // Database
  {
    name: 'DATABASE_URL',
    required: true,
    description: 'PostgreSQL connection string',
    validator: (val) => val.startsWith('postgres://') || val.startsWith('postgresql://'),
    errorMessage: 'Must be a valid PostgreSQL connection string'
  },

  // Security & Sessions
  {
    name: 'SESSION_SECRET',
    required: true,
    description: 'Session encryption key (256-bit recommended)',
    validator: (val) => val.length >= 32,
    errorMessage: 'Must be at least 32 characters long'
  },
  {
    name: 'ADMIN_SETUP_KEY',
    required: false,
    description: 'Admin account setup key'
  },

  // Redis (Optional but Recommended)
  {
    name: 'REDIS_URL',
    required: false,
    description: 'Redis connection URL (for sessions & job queues)'
  },
  {
    name: 'REDIS_HOST',
    required: false,
    description: 'Redis hostname'
  },
  {
    name: 'REDIS_PORT',
    required: false,
    description: 'Redis port'
  },
  {
    name: 'REDIS_PASSWORD',
    required: false,
    description: 'Redis password'
  },

  // Email (Resend)
  {
    name: 'RESEND_API_KEY',
    required: false,
    description: 'Resend API key for email sending',
    validator: (val) => val.startsWith('re_'),
    errorMessage: 'Must be a valid Resend API key (starts with re_)'
  },
  {
    name: 'MAIL_FROM',
    required: false,
    description: 'Default sender email address'
  },

  // Payments (Stripe)
  {
    name: 'STRIPE_SECRET_KEY',
    required: false,
    description: 'Stripe secret key (use live keys for production)',
    validator: (val) => {
      const isProduction = process.env.NODE_ENV === 'production';
      if (isProduction && !val.startsWith('sk_live_')) {
        return false;
      }
      return val.startsWith('sk_test_') || val.startsWith('sk_live_');
    },
    errorMessage: 'Production must use live keys (sk_live_), development can use test keys (sk_test_)'
  },
  {
    name: 'STRIPE_PUBLISHABLE_KEY',
    required: false,
    description: 'Stripe publishable key',
    validator: (val) => val.startsWith('pk_test_') || val.startsWith('pk_live_'),
    errorMessage: 'Must be a valid Stripe publishable key'
  },
  {
    name: 'STRIPE_WEBHOOK_SECRET',
    required: false,
    description: 'Stripe webhook endpoint secret',
    validator: (val) => val.startsWith('whsec_'),
    errorMessage: 'Must be a valid Stripe webhook secret (starts with whsec_)'
  },

  // AI Services (Optional)
  {
    name: 'OPENAI_API_KEY',
    required: false,
    description: 'OpenAI API key',
    validator: (val) => val.startsWith('sk-'),
    errorMessage: 'Must be a valid OpenAI API key (starts with sk-)'
  },
  {
    name: 'ANTHROPIC_API_KEY',
    required: false,
    description: 'Anthropic Claude API key',
    validator: (val) => val.startsWith('sk-ant-'),
    errorMessage: 'Must be a valid Anthropic API key (starts with sk-ant-)'
  },

  // Storage (Optional - AWS S3)
  {
    name: 'STORAGE_PROVIDER',
    required: false,
    description: 'Storage backend (local, s3, cloudflare-r2, azure-blob)',
    validator: (val) => ['local', 's3', 'cloudflare-r2', 'azure-blob'].includes(val),
    errorMessage: 'Must be one of: local, s3, cloudflare-r2, azure-blob'
  },
  {
    name: 'AWS_REGION',
    required: false,
    description: 'AWS region (required if STORAGE_PROVIDER=s3)'
  },
  {
    name: 'AWS_ACCESS_KEY_ID',
    required: false,
    description: 'AWS access key (required if STORAGE_PROVIDER=s3)'
  },
  {
    name: 'AWS_SECRET_ACCESS_KEY',
    required: false,
    description: 'AWS secret key (required if STORAGE_PROVIDER=s3)'
  },
  {
    name: 'AWS_S3_BUCKET',
    required: false,
    description: 'S3 bucket name (required if STORAGE_PROVIDER=s3)'
  },

  // Master User (Optional)
  {
    name: 'MASTER_USER_EMAIL',
    required: false,
    description: 'Master admin email (auto-provisioned)',
    validator: (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
    errorMessage: 'Must be a valid email address'
  },
  {
    name: 'MASTER_USER_PASSWORD',
    required: false,
    description: 'Master admin password (min 12 characters)',
    validator: (val) => val.length >= 12,
    errorMessage: 'Must be at least 12 characters long'
  }
];

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  info: string[];
}

function validateEnvironment(): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    info: []
  };

  console.log('🔍 Validating environment variables...\n');

  for (const envVar of ENV_VARS) {
    const value = process.env[envVar.name];

    if (!value || value.trim() === '') {
      if (envVar.required) {
        result.valid = false;
        result.errors.push(`❌ ${envVar.name} is REQUIRED but not set\n   ${envVar.description}`);
      } else {
        result.warnings.push(`⚠️  ${envVar.name} is not set (optional)\n   ${envVar.description}`);
      }
      continue;
    }

    // Validate value if validator function is provided
    if (envVar.validator) {
      if (!envVar.validator(value)) {
        result.valid = false;
        result.errors.push(
          `❌ ${envVar.name} has invalid value\n   ${envVar.errorMessage || 'Validation failed'}`
        );
        continue;
      }
    }

    result.info.push(`✅ ${envVar.name} is set`);
  }

  // Additional conditional validations
  if (process.env.STORAGE_PROVIDER === 's3') {
    const s3Vars = ['AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_S3_BUCKET'];
    for (const varName of s3Vars) {
      if (!process.env[varName]) {
        result.valid = false;
        result.errors.push(`❌ ${varName} is required when STORAGE_PROVIDER=s3`);
      }
    }
  }

  if (process.env.MASTER_USER_EMAIL && !process.env.MASTER_USER_PASSWORD) {
    result.valid = false;
    result.errors.push('❌ MASTER_USER_PASSWORD is required when MASTER_USER_EMAIL is set');
  }

  return result;
}

function printResults(result: ValidationResult) {
  if (result.errors.length > 0) {
    console.log('\n🚨 ERRORS (Must fix before deployment):\n');
    result.errors.forEach(error => console.log(error + '\n'));
  }

  if (result.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS (Recommended to fix):\n');
    result.warnings.forEach(warning => console.log(warning + '\n'));
  }

  if (result.info.length > 0 && process.env.VERBOSE === 'true') {
    console.log('\n✅ VALID VARIABLES:\n');
    result.info.forEach(info => console.log(info));
  }

  console.log('\n' + '='.repeat(60));

  if (result.valid) {
    console.log('✅ Environment validation PASSED');
    console.log('🚀 Ready for Railway deployment!');
  } else {
    console.log('❌ Environment validation FAILED');
    console.log('⚠️  Fix the errors above before deploying');
  }

  console.log('='.repeat(60) + '\n');
}

// Main execution
const result = validateEnvironment();
printResults(result);

// Exit with error code if validation failed
if (!result.valid) {
  process.exit(1);
}

process.exit(0);
