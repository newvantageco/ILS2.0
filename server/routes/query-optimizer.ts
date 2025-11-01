/**
 * Query Optimizer Routes
 * Monitoring and management endpoints for query optimization
 */

import { Router, Request, Response } from 'express';
import { queryOptimizer } from '../../db/queryOptimizer';

const router = Router();

/**
 * Get query metrics
 * GET /api/query-optimizer/metrics
 */
router.get('/metrics', (req: Request, res: Response) => {
  try {
    const companyId = req.query.companyId as string | undefined;
    const slowOnly = req.query.slowOnly === 'true';
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

    const metrics = queryOptimizer.getMetrics({
      companyId,
      slowOnly,
      limit,
    });

    res.json({
      success: true,
      metrics,
      count: metrics.length,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get aggregate statistics
 * GET /api/query-optimizer/statistics
 */
router.get('/statistics', (req: Request, res: Response) => {
  try {
    const companyId = req.query.companyId as string | undefined;
    const stats = queryOptimizer.getStatistics(companyId);

    res.json({
      success: true,
      statistics: stats,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Analyze query with EXPLAIN
 * POST /api/query-optimizer/explain
 */
router.post('/explain', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const plan = await queryOptimizer.explainQuery(query);

    res.json({
      success: true,
      plan,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get index recommendations
 * GET /api/query-optimizer/indexes
 */
router.get('/indexes', async (req: Request, res: Response) => {
  try {
    const recommendations = await queryOptimizer.analyzeIndexes();

    res.json({
      success: true,
      recommendations,
      count: recommendations.length,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Clear metrics
 * DELETE /api/query-optimizer/metrics
 */
router.delete('/metrics', (req: Request, res: Response) => {
  try {
    queryOptimizer.clearMetrics();

    res.json({
      success: true,
      message: 'Metrics cleared',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Enable/disable optimizer
 * POST /api/query-optimizer/toggle
 */
router.post('/toggle', (req: Request, res: Response) => {
  try {
    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'enabled must be a boolean' });
    }

    queryOptimizer.setEnabled(enabled);

    res.json({
      success: true,
      message: `Query optimizer ${enabled ? 'enabled' : 'disabled'}`,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get health status
 * GET /api/query-optimizer/health
 */
router.get('/health', (req: Request, res: Response) => {
  try {
    const health = queryOptimizer.getHealth();

    res.json({
      success: true,
      health,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
