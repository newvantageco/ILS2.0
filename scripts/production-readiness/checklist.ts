#!/usr/bin/env tsx

/**
 * Production Readiness Checklist
 * Automated verification of production readiness criteria
 */

import axios from 'axios';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface CheckResult {
  name: string;
  category: string;
  status: 'pass' | 'fail' | 'warning' | 'skip';
  message: string;
  required: boolean;
  details?: string;
}

class ProductionReadinessChecker {
  private results: CheckResult[] = [];
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:5000') {
    this.baseUrl = baseUrl;
  }

  /**
   * Run all checks
   */
  async runAllChecks(): Promise<void> {
    console.log('🚀 Running Production Readiness Checks...\n');

    await this.checkEnvironmentVariables();
    await this.checkDependencies();
    await this.checkDatabase();
    await this.checkSecurity();
    await this.checkMonitoring();
    await this.checkBackups();
    await this.checkDocumentation();
    await this.checkInfrastructure();
    await this.checkPerformance();

    this.printResults();
  }

  /**
   * Environment Variables
   */
  private async checkEnvironmentVariables(): Promise<void> {
    const category = 'Environment';

    // NODE_ENV
    this.addResult({
      name: 'NODE_ENV set to production',
      category,
      status: process.env.NODE_ENV === 'production' ? 'pass' : 'fail',
      message: `NODE_ENV is ${process.env.NODE_ENV || 'not set'}`,
      required: true,
    });

    // Database URL
    this.addResult({
      name: 'DATABASE_URL configured',
      category,
      status: process.env.DATABASE_URL ? 'pass' : 'fail',
      message: process.env.DATABASE_URL ? 'DATABASE_URL is set' : 'DATABASE_URL is missing',
      required: true,
    });

    // Session Secret
    const sessionSecret = process.env.SESSION_SECRET;
    this.addResult({
      name: 'SESSION_SECRET is strong',
      category,
      status: sessionSecret && sessionSecret.length >= 32 ? 'pass' : 'fail',
      message: sessionSecret
        ? `SESSION_SECRET length: ${sessionSecret.length} chars`
        : 'SESSION_SECRET is missing',
      required: true,
      details: 'SESSION_SECRET should be at least 32 characters',
    });

    // Redis (optional but recommended)
    this.addResult({
      name: 'Redis configured',
      category,
      status: process.env.REDIS_URL ? 'pass' : 'warning',
      message: process.env.REDIS_URL ? 'Redis is configured' : 'Redis not configured (optional)',
      required: false,
    });

    // Sentry
    this.addResult({
      name: 'Sentry error tracking configured',
      category,
      status: process.env.SENTRY_DSN ? 'pass' : 'warning',
      message: process.env.SENTRY_DSN ? 'Sentry is configured' : 'Sentry not configured',
      required: false,
      details: 'Recommended for production error tracking',
    });

    // Log level
    this.addResult({
      name: 'LOG_LEVEL appropriate for production',
      category,
      status: ['info', 'warn', 'error'].includes(process.env.LOG_LEVEL || 'info') ? 'pass' : 'warning',
      message: `LOG_LEVEL is ${process.env.LOG_LEVEL || 'info'}`,
      required: false,
      details: 'Recommended: info, warn, or error for production',
    });
  }

  /**
   * Dependencies
   */
  private async checkDependencies(): Promise<void> {
    const category = 'Dependencies';

    try {
      // Check for security vulnerabilities
      const auditOutput = execSync('npm audit --json', { encoding: 'utf-8' });
      const audit = JSON.parse(auditOutput);

      const critical = audit.metadata?.vulnerabilities?.critical || 0;
      const high = audit.metadata?.vulnerabilities?.high || 0;

      this.addResult({
        name: 'No critical vulnerabilities',
        category,
        status: critical === 0 ? 'pass' : 'fail',
        message: `${critical} critical vulnerabilities found`,
        required: true,
      });

      this.addResult({
        name: 'No high vulnerabilities',
        category,
        status: high === 0 ? 'pass' : 'warning',
        message: `${high} high vulnerabilities found`,
        required: false,
      });
    } catch (error) {
      this.addResult({
        name: 'Dependency audit',
        category,
        status: 'warning',
        message: 'Could not run npm audit',
        required: false,
      });
    }

    // Check package-lock.json exists
    this.addResult({
      name: 'package-lock.json exists',
      category,
      status: fs.existsSync('package-lock.json') ? 'pass' : 'fail',
      message: fs.existsSync('package-lock.json')
        ? 'Lockfile present'
        : 'Lockfile missing - run npm install',
      required: true,
    });
  }

  /**
   * Database
   */
  private async checkDatabase(): Promise<void> {
    const category = 'Database';

    try {
      const response = await axios.get(`${this.baseUrl}/api/health`, {
        timeout: 5000,
      });

      const dbHealthy = response.data.dependencies?.database === 'healthy';

      this.addResult({
        name: 'Database connectivity',
        category,
        status: dbHealthy ? 'pass' : 'fail',
        message: dbHealthy ? 'Database is reachable' : 'Database connection failed',
        required: true,
      });
    } catch (error) {
      this.addResult({
        name: 'Database connectivity',
        category,
        status: 'fail',
        message: 'Could not check database health',
        required: true,
      });
    }

    // Check for migration files
    const migrationsExist = fs.existsSync('drizzle') || fs.existsSync('migrations');
    this.addResult({
      name: 'Database migrations present',
      category,
      status: migrationsExist ? 'pass' : 'warning',
      message: migrationsExist ? 'Migration files found' : 'No migration files found',
      required: false,
    });
  }

  /**
   * Security
   */
  private async checkSecurity(): Promise<void> {
    const category = 'Security';

    // TLS/HTTPS
    this.addResult({
      name: 'HTTPS enforced',
      category,
      status: this.baseUrl.startsWith('https://') ? 'pass' : 'warning',
      message: this.baseUrl.startsWith('https://')
        ? 'Using HTTPS'
        : 'Not using HTTPS (required for production)',
      required: true,
      details: 'HTTPS must be enforced in production',
    });

    // Security headers
    try {
      const response = await axios.get(`${this.baseUrl}/api/health`);
      const headers = response.headers;

      const securityHeaders = {
        'x-frame-options': headers['x-frame-options'],
        'x-content-type-options': headers['x-content-type-options'],
        'strict-transport-security': headers['strict-transport-security'],
      };

      const hasSecurityHeaders =
        securityHeaders['x-frame-options'] &&
        securityHeaders['x-content-type-options'];

      this.addResult({
        name: 'Security headers configured',
        category,
        status: hasSecurityHeaders ? 'pass' : 'warning',
        message: hasSecurityHeaders
          ? 'Security headers present'
          : 'Some security headers missing',
        required: false,
        details: 'Helmet.js middleware should add security headers',
      });
    } catch (error) {
      this.addResult({
        name: 'Security headers configured',
        category,
        status: 'skip',
        message: 'Could not check security headers',
        required: false,
      });
    }

    // Check for .env file in production
    this.addResult({
      name: 'No .env file in production',
      category,
      status: !fs.existsSync('.env') || process.env.NODE_ENV !== 'production' ? 'pass' : 'warning',
      message: fs.existsSync('.env')
        ? '.env file exists - use environment variables in production'
        : 'No .env file found',
      required: false,
      details: 'Use container/system environment variables instead of .env in production',
    });
  }

  /**
   * Monitoring
   */
  private async checkMonitoring(): Promise<void> {
    const category = 'Monitoring';

    // Health endpoint
    try {
      const response = await axios.get(`${this.baseUrl}/api/health`, {
        timeout: 5000,
      });

      this.addResult({
        name: 'Health check endpoint',
        category,
        status: response.status === 200 ? 'pass' : 'fail',
        message: `Health endpoint returned ${response.status}`,
        required: true,
      });
    } catch (error) {
      this.addResult({
        name: 'Health check endpoint',
        category,
        status: 'fail',
        message: 'Health endpoint not reachable',
        required: true,
      });
    }

    // Logging configured
    this.addResult({
      name: 'Structured logging enabled',
      category,
      status: fs.existsSync('server/utils/logger.ts') ? 'pass' : 'warning',
      message: fs.existsSync('server/utils/logger.ts')
        ? 'Logger utility found'
        : 'Logger utility missing',
      required: false,
    });

    // OpenTelemetry
    this.addResult({
      name: 'Tracing configured',
      category,
      status: process.env.OTEL_ENABLED === 'true' ? 'pass' : 'skip',
      message:
        process.env.OTEL_ENABLED === 'true'
          ? 'OpenTelemetry enabled'
          : 'OpenTelemetry not enabled (optional)',
      required: false,
    });
  }

  /**
   * Backups
   */
  private async checkBackups(): Promise<void> {
    const category = 'Backups';

    // Backup scripts
    const backupScriptExists = fs.existsSync('scripts/backup/backup-database.sh');
    this.addResult({
      name: 'Backup scripts present',
      category,
      status: backupScriptExists ? 'pass' : 'warning',
      message: backupScriptExists ? 'Backup scripts found' : 'No backup scripts found',
      required: false,
    });

    // GitHub Actions backup workflow
    const backupWorkflowExists = fs.existsSync('.github/workflows/database-backup.yml');
    this.addResult({
      name: 'Automated backup workflow',
      category,
      status: backupWorkflowExists ? 'pass' : 'warning',
      message: backupWorkflowExists
        ? 'Backup workflow configured'
        : 'No automated backup workflow',
      required: false,
      details: 'Automated backups recommended for production',
    });
  }

  /**
   * Documentation
   */
  private async checkDocumentation(): Promise<void> {
    const category = 'Documentation';

    const docs = [
      { file: 'README.md', name: 'README' },
      { file: 'docs/DEPLOYMENT_GUIDE.md', name: 'Deployment Guide' },
      { file: 'docs/INFRASTRUCTURE.md', name: 'Infrastructure Guide' },
      { file: 'docs/OBSERVABILITY.md', name: 'Observability Guide' },
    ];

    for (const doc of docs) {
      this.addResult({
        name: `${doc.name} exists`,
        category,
        status: fs.existsSync(doc.file) ? 'pass' : 'warning',
        message: fs.existsSync(doc.file) ? `${doc.name} found` : `${doc.name} missing`,
        required: false,
      });
    }
  }

  /**
   * Infrastructure
   */
  private async checkInfrastructure(): Promise<void> {
    const category = 'Infrastructure';

    // Dockerfile
    this.addResult({
      name: 'Dockerfile present',
      category,
      status: fs.existsSync('Dockerfile') ? 'pass' : 'fail',
      message: fs.existsSync('Dockerfile') ? 'Dockerfile found' : 'Dockerfile missing',
      required: true,
    });

    // Docker Compose
    this.addResult({
      name: 'Docker Compose configuration',
      category,
      status: fs.existsSync('docker-compose.yml') ? 'pass' : 'warning',
      message: fs.existsSync('docker-compose.yml')
        ? 'docker-compose.yml found'
        : 'docker-compose.yml missing',
      required: false,
    });

    // Kubernetes manifests
    const k8sExists = fs.existsSync('kubernetes');
    this.addResult({
      name: 'Kubernetes manifests',
      category,
      status: k8sExists ? 'pass' : 'warning',
      message: k8sExists ? 'Kubernetes configs found' : 'No Kubernetes configs',
      required: false,
    });

    // .dockerignore
    this.addResult({
      name: '.dockerignore present',
      category,
      status: fs.existsSync('.dockerignore') ? 'pass' : 'warning',
      message: fs.existsSync('.dockerignore')
        ? '.dockerignore found'
        : '.dockerignore missing (recommended)',
      required: false,
    });
  }

  /**
   * Performance
   */
  private async checkPerformance(): Promise<void> {
    const category = 'Performance';

    // Build exists
    const buildExists = fs.existsSync('dist');
    this.addResult({
      name: 'Production build exists',
      category,
      status: buildExists ? 'pass' : 'fail',
      message: buildExists ? 'Build directory found' : 'Run npm run build',
      required: true,
    });

    // Check response time
    try {
      const start = Date.now();
      await axios.get(`${this.baseUrl}/api/health`, { timeout: 5000 });
      const duration = Date.now() - start;

      this.addResult({
        name: 'Health check response time',
        category,
        status: duration < 1000 ? 'pass' : 'warning',
        message: `Response time: ${duration}ms`,
        required: false,
        details: 'Should be under 1000ms',
      });
    } catch (error) {
      this.addResult({
        name: 'Health check response time',
        category,
        status: 'skip',
        message: 'Could not measure response time',
        required: false,
      });
    }
  }

  /**
   * Helper methods
   */
  private addResult(result: CheckResult): void {
    this.results.push(result);
  }

  private printResults(): void {
    console.log('\n' + '='.repeat(80));
    console.log('📊 PRODUCTION READINESS REPORT');
    console.log('='.repeat(80) + '\n');

    const categories = [...new Set(this.results.map((r) => r.category))];

    for (const category of categories) {
      console.log(`\n📁 ${category}`);
      console.log('-'.repeat(80));

      const categoryResults = this.results.filter((r) => r.category === category);

      for (const result of categoryResults) {
        const icon = this.getStatusIcon(result.status);
        const required = result.required ? '[REQUIRED]' : '[OPTIONAL]';
        console.log(`${icon} ${result.name} ${required}`);
        console.log(`   ${result.message}`);
        if (result.details) {
          console.log(`   ℹ️  ${result.details}`);
        }
      }
    }

    // Summary
    const passed = this.results.filter((r) => r.status === 'pass').length;
    const failed = this.results.filter((r) => r.status === 'fail').length;
    const warnings = this.results.filter((r) => r.status === 'warning').length;
    const skipped = this.results.filter((r) => r.status === 'skip').length;
    const requiredFailed = this.results.filter((r) => r.status === 'fail' && r.required).length;

    console.log('\n' + '='.repeat(80));
    console.log('📈 SUMMARY');
    console.log('='.repeat(80));
    console.log(`✅ Passed:   ${passed}`);
    console.log(`❌ Failed:   ${failed} (${requiredFailed} required)`);
    console.log(`⚠️  Warnings: ${warnings}`);
    console.log(`⏭️  Skipped:  ${skipped}`);
    console.log(`📊 Total:    ${this.results.length}`);

    // Verdict
    console.log('\n' + '='.repeat(80));
    if (requiredFailed === 0) {
      console.log('✅ PRODUCTION READY - All required checks passed!');
      if (warnings > 0) {
        console.log(`⚠️  Note: ${warnings} optional checks have warnings`);
      }
    } else {
      console.log(`❌ NOT PRODUCTION READY - ${requiredFailed} required check(s) failed`);
      console.log('\nFailed required checks:');
      this.results
        .filter((r) => r.status === 'fail' && r.required)
        .forEach((r) => {
          console.log(`  • ${r.name}: ${r.message}`);
        });
    }
    console.log('='.repeat(80) + '\n');

    // Exit with error if required checks failed
    if (requiredFailed > 0) {
      process.exit(1);
    }
  }

  private getStatusIcon(status: CheckResult['status']): string {
    switch (status) {
      case 'pass':
        return '✅';
      case 'fail':
        return '❌';
      case 'warning':
        return '⚠️ ';
      case 'skip':
        return '⏭️ ';
    }
  }
}

// Run checks
const baseUrl = process.argv[2] || process.env.APP_URL || 'http://localhost:5000';

const checker = new ProductionReadinessChecker(baseUrl);
checker.runAllChecks().catch((error) => {
  console.error('Error running checks:', error);
  process.exit(1);
});
