#!/usr/bin/env node
/**
 * Railway Environment Validation Script
 * 
 * Validates that all required environment variables are set for Railway deployment.
 * Run before deployment to catch configuration issues early.
 * 
 * Usage: npx tsx scripts/validate-railway-env.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const REQUIRED_VARS = [
  'DATABASE_URL',
  'SESSION_SECRET',
  'NODE_ENV',
];

const RECOMMENDED_VARS = [
  'CORS_ORIGIN',
  'APP_URL',
  'REDIS_URL',
  'RESEND_API_KEY',
];

const OPTIONAL_VARS = [
  'STRIPE_SECRET_KEY',
  'STRIPE_PUBLISHABLE_KEY',
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'MASTER_USER_EMAIL',
  'MASTER_USER_PASSWORD',
];

interface ValidationResult {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
}

const results: ValidationResult[] = [];

function validateRequired(name: string): void {
  if (!process.env[name]) {
    results.push({
      name,
      status: 'fail',
      message: `Missing required environment variable: ${name}`,
    });
  } else {
    results.push({
      name,
      status: 'pass',
      message: `✅ ${name} is set`,
    });
  }
}

function validateRecommended(name: string): void {
  if (!process.env[name]) {
    results.push({
      name,
      status: 'warn',
      message: `Missing recommended environment variable: ${name}`,
    });
  } else {
    results.push({
      name,
      status: 'pass',
      message: `✅ ${name} is set`,
    });
  }
}

function validateOptional(name: string): void {
  if (!process.env[name]) {
    results.push({
      name,
      status: 'warn',
      message: `Optional environment variable not set: ${name}`,
    });
  } else {
    results.push({
      name,
      status: 'pass',
      message: `✅ ${name} is set`,
    });
  }
}

function validateSessionSecret(): void {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    return; // Already reported by validateRequired
  }
  
  const meetsMinLength = secret.length >= 32;
  const meetsMinChars = /[a-zA-Z0-9!@#$%^&*]/.test(secret);
  
  if (meetsMinLength && meetsMinChars) {
    results.push({
      name: 'SESSION_SECRET_VALIDATION',
      status: 'pass',
      message: `✅ SESSION_SECRET is secure (${secret.length} chars)`,
    });
  } else {
    results.push({
      name: 'SESSION_SECRET_VALIDATION',
      status: 'fail',
      message: `SESSION_SECRET must be at least 32 characters with alphanumeric + special chars. Current: ${secret.length} chars`,
    });
  }
}

function validateNodeEnv(): void {
  const env = process.env.NODE_ENV;
  if (!env || !['production', 'development', 'test'].includes(env)) {
    results.push({
      name: 'NODE_ENV_VALIDATION',
      status: 'fail',
      message: `NODE_ENV must be one of: production, development, test. Current: ${env}`,
    });
  } else {
    results.push({
      name: 'NODE_ENV_VALIDATION',
      status: 'pass',
      message: `✅ NODE_ENV is valid: ${env}`,
    });
  }
}

function validateDatabaseUrl(): void {
  const url = process.env.DATABASE_URL;
  if (!url) {
    return; // Already reported by validateRequired
  }
  
  try {
    const urlObj = new URL(url);
    const isNeon = url.includes('neon.tech') || url.includes('pg.railway.app');
    const protocol = urlObj.protocol;
    
    if (protocol !== 'postgresql:' && protocol !== 'postgres:') {
      results.push({
        name: 'DATABASE_URL_VALIDATION',
        status: 'fail',
        message: `DATABASE_URL must use postgresql:// protocol. Current: ${protocol}`,
      });
    } else {
      const type = isNeon ? 'Neon' : 'PostgreSQL';
      results.push({
        name: 'DATABASE_URL_VALIDATION',
        status: 'pass',
        message: `✅ DATABASE_URL is valid ${type} connection`,
      });
    }
  } catch (e) {
    results.push({
      name: 'DATABASE_URL_VALIDATION',
      status: 'fail',
      message: `DATABASE_URL is not a valid URL: ${(e as Error).message}`,
    });
  }
}

function validateRedisUrl(): void {
  const url = process.env.REDIS_URL;
  if (!url) {
    results.push({
      name: 'REDIS_URL_VALIDATION',
      status: 'warn',
      message: `REDIS_URL not set. Background jobs will use immediate execution fallback.`,
    });
    return;
  }
  
  try {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol;
    
    if (protocol !== 'redis:' && protocol !== 'rediss:') {
      results.push({
        name: 'REDIS_URL_VALIDATION',
        status: 'fail',
        message: `REDIS_URL must use redis:// or rediss:// protocol. Current: ${protocol}`,
      });
    } else {
      const isTLS = protocol === 'rediss:';
      results.push({
        name: 'REDIS_URL_VALIDATION',
        status: 'pass',
        message: `✅ REDIS_URL is valid${isTLS ? ' (with TLS)' : ''}`,
      });
    }
  } catch (e) {
    results.push({
      name: 'REDIS_URL_VALIDATION',
      status: 'fail',
      message: `REDIS_URL is not a valid URL: ${(e as Error).message}`,
    });
  }
}

function validatePort(): void {
  const port = process.env.PORT;
  if (port) {
    const portNum = parseInt(port, 10);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      results.push({
        name: 'PORT_VALIDATION',
        status: 'fail',
        message: `PORT must be a number between 1 and 65535. Current: ${port}`,
      });
    } else {
      results.push({
        name: 'PORT_VALIDATION',
        status: 'pass',
        message: `✅ PORT is valid: ${port}`,
      });
    }
  } else {
    results.push({
      name: 'PORT_VALIDATION',
      status: 'warn',
      message: `PORT not set. Railway will auto-assign.`,
    });
  }
}

function validateMasterUser(): void {
  const email = process.env.MASTER_USER_EMAIL;
  const password = process.env.MASTER_USER_PASSWORD;
  
  if (!email && !password) {
    results.push({
      name: 'MASTER_USER',
      status: 'warn',
      message: `Master user not configured. You'll need to create admin account manually.`,
    });
    return;
  }
  
  if (email && !password) {
    results.push({
      name: 'MASTER_USER',
      status: 'fail',
      message: `MASTER_USER_EMAIL set but MASTER_USER_PASSWORD missing.`,
    });
    return;
  }
  
  if (!email && password) {
    results.push({
      name: 'MASTER_USER',
      status: 'fail',
      message: `MASTER_USER_PASSWORD set but MASTER_USER_EMAIL missing.`,
    });
    return;
  }
  
  if (email && password) {
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const validPassword = password.length >= 12;
    
    if (!validEmail) {
      results.push({
        name: 'MASTER_USER_EMAIL_VALIDATION',
        status: 'fail',
        message: `MASTER_USER_EMAIL is not a valid email: ${email}`,
      });
    } else if (!validPassword) {
      results.push({
        name: 'MASTER_USER_PASSWORD_VALIDATION',
        status: 'fail',
        message: `MASTER_USER_PASSWORD must be at least 12 characters. Current: ${password.length}`,
      });
    } else {
      results.push({
        name: 'MASTER_USER',
        status: 'pass',
        message: `✅ Master user will be provisioned on startup`,
      });
    }
  }
}

// Run validations
console.log('\n🔍 Railway Environment Validation\n');
console.log('=' .repeat(60));

REQUIRED_VARS.forEach(validateRequired);
RECOMMENDED_VARS.forEach(validateRecommended);
OPTIONAL_VARS.forEach(validateOptional);

// Additional validations
validateSessionSecret();
validateNodeEnv();
validateDatabaseUrl();
validateRedisUrl();
validatePort();
validateMasterUser();

// Print results
const grouped = {
  pass: results.filter(r => r.status === 'pass'),
  warn: results.filter(r => r.status === 'warn'),
  fail: results.filter(r => r.status === 'fail'),
};

if (grouped.pass.length > 0) {
  console.log('\n✅ PASSED:');
  grouped.pass.forEach(r => console.log(`   ${r.message}`));
}

if (grouped.warn.length > 0) {
  console.log('\n⚠️  WARNINGS:');
  grouped.warn.forEach(r => console.log(`   ${r.message}`));
}

if (grouped.fail.length > 0) {
  console.log('\n❌ FAILED:');
  grouped.fail.forEach(r => console.log(`   ${r.message}`));
}

console.log('\n' + '='.repeat(60));
console.log(`\nSummary: ${grouped.pass.length} passed, ${grouped.warn.length} warnings, ${grouped.fail.length} failed\n`);

// Exit with appropriate code
if (grouped.fail.length > 0) {
  console.error('❌ Validation failed. Fix errors before deploying.\n');
  process.exit(1);
} else if (grouped.warn.length > 0) {
  console.warn('⚠️  Validation complete with warnings. Review above before deploying.\n');
  process.exit(0);
} else {
  console.log('✅ All validations passed! Ready for deployment.\n');
  process.exit(0);
}
