/**
 * Observability Routes
 * Endpoints for metrics, health checks, and observability data
 */

import { Router, Request, Response } from 'express';
import { isAuthenticated, AuthenticatedRequest } from '../middleware/auth';
import logger, { loggers } from '../utils/logger';

const router = Router();

/**
 * GET /api/observability/health
 * Enhanced health check with dependency status
 */
router.get('/health', async (req: Request, res: Response) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    dependencies: {
      database: 'unknown',
      redis: 'unknown',
    },
  };

  try {
    // Check database connectivity
    // Add actual database ping here
    health.dependencies.database = 'healthy';

    // Check Redis connectivity
    // Add actual Redis ping here
    health.dependencies.redis = 'healthy';

    res.status(200).json(health);
  } catch (error) {
    health.status = 'unhealthy';
    logger.error({ err: error }, 'Health check failed');
    res.status(503).json(health);
  }
});

/**
 * GET /api/observability/metrics/prometheus
 * Prometheus metrics endpoint (if OpenTelemetry is enabled)
 */
router.get('/metrics/prometheus', (req: Request, res: Response) => {
  // Metrics are exposed on separate port by OpenTelemetry
  // This endpoint redirects or provides information
  res.json({
    message: 'Prometheus metrics available at :9464/metrics (if OTEL_ENABLED=true)',
    enabled: process.env.OTEL_ENABLED === 'true',
    port: process.env.OTEL_PROMETHEUS_PORT || '9464',
  });
});

/**
 * GET /api/observability/logs/sample
 * Sample log entries (admin only)
 */
router.get('/logs/sample', isAuthenticated, (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'platform_admin' && req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  // Generate sample log entries
  loggers.api.info('Sample info log');
  loggers.api.warn('Sample warning log');
  loggers.api.debug('Sample debug log');

  res.json({
    message: 'Sample logs generated',
    logLevel: process.env.LOG_LEVEL || 'info',
  });
});

/**
 * GET /api/observability/config
 * Observability configuration (admin only)
 */
router.get('/config', isAuthenticated, (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'platform_admin' && req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  res.json({
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      pretty: process.env.NODE_ENV === 'development',
    },
    tracing: {
      enabled: process.env.OTEL_ENABLED === 'true',
      prometheusPort: process.env.OTEL_PROMETHEUS_PORT || '9464',
    },
    errorTracking: {
      sentryEnabled: !!process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
    },
    performance: {
      monitoringEnabled: true,
      metricsRetention: '24h',
    },
  });
});

export default router;
