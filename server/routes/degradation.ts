/**
 * Graceful Degradation Routes
 * Management endpoints for circuit breakers and feature flags
 */

import { Router, Request, Response } from 'express';
import { circuitBreaker } from '../middleware/circuitBreaker';
import { featureFlagsService } from '../services/FeatureFlagsService';

const router = Router();

// ===================================
// Circuit Breaker Routes
// ===================================

/**
 * Get all circuit stats
 * GET /api/degradation/circuits
 */
router.get('/circuits', (req: Request, res: Response) => {
  try {
    const stats = circuitBreaker.getAllStats();
    res.json({ success: true, circuits: stats });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get specific circuit stats
 * GET /api/degradation/circuits/:name
 */
router.get('/circuits/:name', (req: Request, res: Response) => {
  try {
    const stats = circuitBreaker.getStats(req.params.name);
    
    if (!stats) {
      return res.status(404).json({ error: 'Circuit not found' });
    }
    
    res.json({ success: true, circuit: stats });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Reset circuit
 * POST /api/degradation/circuits/:name/reset
 */
router.post('/circuits/:name/reset', (req: Request, res: Response) => {
  try {
    circuitBreaker.reset(req.params.name);
    res.json({ success: true, message: `Circuit '${req.params.name}' reset` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Reset all circuits
 * POST /api/degradation/circuits/reset-all
 */
router.post('/circuits/reset-all', (req: Request, res: Response) => {
  try {
    circuitBreaker.resetAll();
    res.json({ success: true, message: 'All circuits reset' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Force open circuit
 * POST /api/degradation/circuits/:name/open
 */
router.post('/circuits/:name/open', (req: Request, res: Response) => {
  try {
    circuitBreaker.forceOpen(req.params.name);
    res.json({ success: true, message: `Circuit '${req.params.name}' opened` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Force close circuit
 * POST /api/degradation/circuits/:name/close
 */
router.post('/circuits/:name/close', (req: Request, res: Response) => {
  try {
    circuitBreaker.forceClose(req.params.name);
    res.json({ success: true, message: `Circuit '${req.params.name}' closed` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ===================================
// Feature Flags Routes
// ===================================

/**
 * Get all feature flags
 * GET /api/degradation/features
 */
router.get('/features', (req: Request, res: Response) => {
  try {
    const flags = featureFlagsService.getAllFlags();
    res.json({ success: true, flags });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get specific feature flag
 * GET /api/degradation/features/:key
 */
router.get('/features/:key', (req: Request, res: Response) => {
  try {
    const flag = featureFlagsService.getFlag(req.params.key);
    
    if (!flag) {
      return res.status(404).json({ error: 'Feature flag not found' });
    }
    
    res.json({ success: true, flag });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Check if feature is enabled
 * GET /api/degradation/features/:key/check?targetId=xxx
 */
router.get('/features/:key/check', async (req: Request, res: Response) => {
  try {
    const targetId = req.query.targetId as string | undefined;
    const result = await featureFlagsService.checkFeature(req.params.key, targetId);
    
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get flags for target (company/user)
 * GET /api/degradation/features/target/:targetId
 */
router.get('/features/target/:targetId', async (req: Request, res: Response) => {
  try {
    const flags = await featureFlagsService.getFlagsForTarget(req.params.targetId);
    res.json({ success: true, flags });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Enable feature flag
 * POST /api/degradation/features/:key/enable
 */
router.post('/features/:key/enable', (req: Request, res: Response) => {
  try {
    featureFlagsService.enable(req.params.key);
    res.json({ success: true, message: `Feature '${req.params.key}' enabled` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Disable feature flag
 * POST /api/degradation/features/:key/disable
 */
router.post('/features/:key/disable', (req: Request, res: Response) => {
  try {
    featureFlagsService.disable(req.params.key);
    res.json({ success: true, message: `Feature '${req.params.key}' disabled` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Set rollout percentage
 * POST /api/degradation/features/:key/rollout
 * Body: { percentage: 50 }
 */
router.post('/features/:key/rollout', (req: Request, res: Response) => {
  try {
    const { percentage } = req.body;
    
    if (typeof percentage !== 'number' || percentage < 0 || percentage > 100) {
      return res.status(400).json({ error: 'Invalid percentage (must be 0-100)' });
    }
    
    featureFlagsService.setRollout(req.params.key, percentage);
    res.json({ success: true, message: `Feature '${req.params.key}' rollout set to ${percentage}%` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Add to allow list
 * POST /api/degradation/features/:key/allow
 * Body: { targetId: "company-123" }
 */
router.post('/features/:key/allow', (req: Request, res: Response) => {
  try {
    const { targetId } = req.body;
    
    if (!targetId) {
      return res.status(400).json({ error: 'targetId is required' });
    }
    
    featureFlagsService.addToAllowList(req.params.key, targetId);
    res.json({ success: true, message: `Added ${targetId} to allow list` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Remove from allow list
 * DELETE /api/degradation/features/:key/allow/:targetId
 */
router.delete('/features/:key/allow/:targetId', (req: Request, res: Response) => {
  try {
    featureFlagsService.removeFromAllowList(req.params.key, req.params.targetId);
    res.json({ success: true, message: `Removed ${req.params.targetId} from allow list` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Add to block list
 * POST /api/degradation/features/:key/block
 * Body: { targetId: "company-123" }
 */
router.post('/features/:key/block', (req: Request, res: Response) => {
  try {
    const { targetId } = req.body;
    
    if (!targetId) {
      return res.status(400).json({ error: 'targetId is required' });
    }
    
    featureFlagsService.addToBlockList(req.params.key, targetId);
    res.json({ success: true, message: `Added ${targetId} to block list` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Remove from block list
 * DELETE /api/degradation/features/:key/block/:targetId
 */
router.delete('/features/:key/block/:targetId', (req: Request, res: Response) => {
  try {
    featureFlagsService.removeFromBlockList(req.params.key, req.params.targetId);
    res.json({ success: true, message: `Removed ${req.params.targetId} from block list` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Export feature flags
 * GET /api/degradation/features/export
 */
router.get('/features/export', (req: Request, res: Response) => {
  try {
    const json = featureFlagsService.exportFlags();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="feature-flags.json"');
    res.send(json);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Import feature flags
 * POST /api/degradation/features/import
 * Body: JSON string of flags
 */
router.post('/features/import', (req: Request, res: Response) => {
  try {
    const json = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    featureFlagsService.importFlags(json);
    res.json({ success: true, message: 'Feature flags imported' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get health status
 * GET /api/degradation/health
 */
router.get('/health', (req: Request, res: Response) => {
  try {
    const circuits = circuitBreaker.getAllStats();
    const features = featureFlagsService.getHealth();

    // Check for open circuits
    const openCircuits = Object.entries(circuits).filter(
      ([_, stats]) => stats.state === 'open'
    ).map(([name]) => name);

    const healthy = openCircuits.length === 0;

    res.json({
      success: true,
      healthy,
      circuits: {
        total: Object.keys(circuits).length,
        open: openCircuits.length,
        openCircuits,
      },
      features,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
