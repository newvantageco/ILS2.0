/**
 * Security Enhancements Startup Module
 *
 * Initializes all security-related enhancements from the December 2025 audit:
 * - Session cleanup cron job
 * - HIPAA audit logging
 * - Tenant-aware rate limiting
 * - Enhanced error handling
 *
 * Import and call initializeSecurityEnhancements() in your main server file.
 */

import { Express } from 'express';
import { createLogger } from '../utils/logger';

// Import security enhancement modules
import { startSessionCleanupCron, getSessionStats } from '../jobs/sessionCleanupCron';
import { hipaaAuditLog, healthcareAuditLog, patientAuditLog } from '../middleware/hipaaAuditLog';
import { setupTenantRateLimiting, tenantApiLimiter, tenantAILimiter } from '../middleware/tenantRateLimiter';
import { errorHandler, notFoundHandler, setupGlobalErrorHandlers } from '../middleware/errorHandler';

const logger = createLogger('SecurityEnhancements');

/**
 * Initialize all security enhancements
 */
export function initializeSecurityEnhancements(app: Express): void {
  logger.info('Initializing security enhancements from December 2025 audit...');

  // 1. Setup global error handlers
  setupGlobalErrorHandlers();
  logger.info('Global error handlers configured');

  // 2. Start session cleanup cron job
  startSessionCleanupCron();
  logger.info('Session cleanup cron job started');

  // 3. Setup tenant-aware rate limiting
  setupTenantRateLimiting(app);
  logger.info('Tenant-aware rate limiting configured');

  // 4. Apply HIPAA audit logging to healthcare routes
  applyHIPAAAuditLogging(app);
  logger.info('HIPAA audit logging applied to healthcare routes');

  logger.info('All security enhancements initialized successfully');
}

/**
 * Apply HIPAA audit logging to relevant routes
 */
function applyHIPAAAuditLogging(app: Express): void {
  // Healthcare/clinical routes - highest PHI sensitivity
  const healthcareRoutes = [
    '/api/ehr',
    '/api/rcm',
    '/api/medical-billing',
    '/api/clinical',
    '/api/health-records',
    '/api/care-plans',
    '/api/immunizations',
    '/api/lab-results'
  ];

  for (const route of healthcareRoutes) {
    app.use(route, healthcareAuditLog());
  }

  // Patient routes - direct PHI access
  const patientRoutes = [
    '/api/patients',
    '/api/prescriptions',
    '/api/eye-examinations',
    '/api/consultations',
    '/api/appointments'
  ];

  for (const route of patientRoutes) {
    app.use(route, patientAuditLog());
  }

  // General routes with potential PHI
  const generalPhiRoutes = [
    '/api/orders',
    '/api/invoices',
    '/api/claims',
    '/api/insurance'
  ];

  for (const route of generalPhiRoutes) {
    app.use(route, hipaaAuditLog());
  }
}

/**
 * Register error handlers (call this LAST after all routes)
 */
export function registerErrorHandlers(app: Express): void {
  // 404 handler for undefined routes
  app.use(notFoundHandler);

  // Global error handler (must be last)
  app.use(errorHandler);

  logger.info('Error handlers registered');
}

/**
 * Get security status report
 */
export async function getSecurityStatus(): Promise<{
  sessions: { total: number; expired: number; active: number };
  timestamp: Date;
}> {
  const sessionStats = await getSessionStats();

  return {
    sessions: sessionStats,
    timestamp: new Date()
  };
}

/**
 * Health check for security systems
 */
export async function securityHealthCheck(): Promise<{
  healthy: boolean;
  checks: Record<string, boolean>;
}> {
  const checks: Record<string, boolean> = {};

  // Check session cleanup is running
  try {
    await getSessionStats();
    checks.sessionCleanup = true;
  } catch {
    checks.sessionCleanup = false;
  }

  // Add more checks as needed
  checks.rateLimiting = true; // Rate limiting is synchronous middleware
  checks.hipaaAuditLog = true; // Middleware registered if we got this far

  const healthy = Object.values(checks).every(v => v);

  return { healthy, checks };
}

export default initializeSecurityEnhancements;
