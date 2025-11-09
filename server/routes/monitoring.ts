/**
 * Monitoring and Health Check Routes
 * Provides performance metrics, health status, and system information
 */

import express from 'express';
import { authenticateUser } from '../middleware/auth';
import {
  getPerformanceStats,
  getMetricsWindow,
  getSystemHealth,
  getMemoryUsage,
  getPrometheusMetrics,
  clearOldMetrics,
} from '../middleware/performance';

const router = express.Router();

/**
 * @openapi
 * /api/monitoring/health:
 *   get:
 *     summary: System health check
 *     description: Returns overall system health status
 *     tags: [Monitoring]
 *     responses:
 *       200:
 *         description: System health status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, degraded, unhealthy]
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 memory:
 *                   type: object
 *                 performance:
 *                   type: object
 */
router.get('/health', (req, res) => {
  try {
    const health = getSystemHealth();
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * @openapi
 * /api/monitoring/metrics:
 *   get:
 *     summary: Performance metrics
 *     description: Returns detailed performance statistics (admin only)
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Performance metrics
 */
router.get('/metrics', authenticateUser, (req, res) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'platform_admin' && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const stats = getPerformanceStats();
    res.json({
      timestamp: new Date().toISOString(),
      metrics: stats,
    });
  } catch (error) {
    console.error('Failed to get metrics:', error);
    res.status(500).json({ error: 'Failed to retrieve metrics' });
  }
});

/**
 * @openapi
 * /api/monitoring/metrics/recent:
 *   get:
 *     summary: Recent performance metrics
 *     description: Returns metrics for recent time window (admin only)
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: minutes
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Time window in minutes
 *     responses:
 *       200:
 *         description: Recent metrics
 */
router.get('/metrics/recent', authenticateUser, (req, res) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'platform_admin' && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const minutes = parseInt(req.query.minutes as string) || 5;
    const metrics = getMetricsWindow(minutes);

    res.json({
      timestamp: new Date().toISOString(),
      timeWindow: `${minutes} minutes`,
      metrics,
    });
  } catch (error) {
    console.error('Failed to get recent metrics:', error);
    res.status(500).json({ error: 'Failed to retrieve recent metrics' });
  }
});

/**
 * @openapi
 * /api/monitoring/memory:
 *   get:
 *     summary: Memory usage
 *     description: Returns current memory usage (admin only)
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Memory usage statistics
 */
router.get('/memory', authenticateUser, (req, res) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'platform_admin' && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const memory = getMemoryUsage();
    res.json({
      timestamp: new Date().toISOString(),
      memory,
    });
  } catch (error) {
    console.error('Failed to get memory usage:', error);
    res.status(500).json({ error: 'Failed to retrieve memory usage' });
  }
});

/**
 * @openapi
 * /api/monitoring/prometheus:
 *   get:
 *     summary: Prometheus metrics
 *     description: Returns metrics in Prometheus format
 *     tags: [Monitoring]
 *     responses:
 *       200:
 *         description: Prometheus metrics
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */
router.get('/prometheus', (req, res) => {
  try {
    const metrics = getPrometheusMetrics();
    res.set('Content-Type', 'text/plain');
    res.send(metrics);
  } catch (error) {
    console.error('Failed to generate Prometheus metrics:', error);
    res.status(500).send('# Error generating metrics');
  }
});

/**
 * @openapi
 * /api/monitoring/cleanup:
 *   post:
 *     summary: Cleanup old metrics
 *     description: Remove metrics older than specified hours (admin only)
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               hoursAgo:
 *                 type: integer
 *                 default: 24
 *     responses:
 *       200:
 *         description: Cleanup successful
 */
router.post('/cleanup', authenticateUser, (req, res) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'platform_admin' && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const hoursAgo = parseInt(req.body.hoursAgo) || 24;
    clearOldMetrics(hoursAgo);

    res.json({
      success: true,
      message: `Cleaned up metrics older than ${hoursAgo} hours`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to cleanup metrics:', error);
    res.status(500).json({ error: 'Failed to cleanup metrics' });
  }
});

/**
 * Readiness probe for Kubernetes/container orchestration
 */
router.get('/ready', (req, res) => {
  // Check if application is ready to serve traffic
  // Add checks for database connectivity, etc.
  res.status(200).json({
    ready: true,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Liveness probe for Kubernetes/container orchestration
 */
router.get('/alive', (req, res) => {
  // Simple alive check
  res.status(200).json({
    alive: true,
    timestamp: new Date().toISOString(),
  });
});

export default router;
