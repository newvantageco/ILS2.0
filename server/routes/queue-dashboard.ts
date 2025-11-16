/**
 * Queue Dashboard
 * Visual monitoring dashboard for job queues using Bull Board
 * Access at: /admin/queues
 */

import { Router } from 'express';
import { queueService } from '../services/QueueService';
import { createLogger } from '../utils/logger';

const router = Router();
const logger = createLogger('queue-dashboard');

// Optional Bull Board - gracefully handles if not installed
let createBullBoard: any;
let BullMQAdapter: any;
let ExpressAdapter: any;

try {
  const bullBoard = require('@bull-board/express');
  const bullMQAdapter = require('@bull-board/api/bullMQAdapter');
  const api = require('@bull-board/api');
  
  createBullBoard = api.createBullBoard;
  BullMQAdapter = bullMQAdapter.BullMQAdapter;
  ExpressAdapter = bullBoard.ExpressAdapter;
} catch (e) {
  logger.warn('@bull-board packages not installed. Queue dashboard unavailable.');
}

/**
 * Initialize Bull Board dashboard
 */
export function initializeQueueDashboard(): Router {
  if (!createBullBoard || !BullMQAdapter || !ExpressAdapter) {
    logger.info('Queue dashboard unavailable - @bull-board packages not installed');
    logger.info('Install with: npm install @bull-board/express @bull-board/api @bull-board/ui');
    
    // Return empty router
    const emptyRouter = Router();
    emptyRouter.get('/', (req, res) => {
      res.status(503).json({
        error: 'Queue dashboard not available',
        message: 'Install @bull-board packages to enable dashboard',
      });
    });
    return emptyRouter;
  }

  // Get all queues from service
  const queues = (queueService as any).queues;


  if (!queues || queues.size === 0) {
    logger.warn('No queues available for dashboard');
    const emptyRouter = Router();
    emptyRouter.get('/', (req, res) => {
      res.status(503).json({
        error: 'No queues available',
        message: 'Job queues are not initialized',
      });
    });
    return emptyRouter;
  }

  // Create Bull Board
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  const queueAdapters = Array.from(queues.values()).map(
    (queue: any) => new BullMQAdapter(queue)
  );

  createBullBoard({
    queues: queueAdapters,
    serverAdapter,
  });

  logger.info('Queue dashboard initialized at /admin/queues');

  return serverAdapter.getRouter();
}

/**
 * API routes for queue monitoring
 */

// Get all queue statistics
router.get('/api/queues/stats', async (req, res) => {
  try {
    const stats = await queueService.getAllQueueStats();
    res.json({ success: true, stats });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific queue statistics
router.get('/api/queues/:queueType/stats', async (req, res) => {
  try {
    const queueType = req.params.queueType as any;
    const stats = await queueService.getQueueStats(queueType);
    res.json({ success: true, stats });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get job status
router.get('/api/queues/:queueType/jobs/:jobId', async (req, res) => {
  try {
    const queueType = req.params.queueType as any;
    const jobId = req.params.jobId;
    const status = await queueService.getJobStatus(queueType, jobId);
    
    if (!status) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    res.json({ success: true, job: status });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel job
router.delete('/api/queues/:queueType/jobs/:jobId', async (req, res) => {
  try {
    const queueType = req.params.queueType as any;
    const jobId = req.params.jobId;
    const cancelled = await queueService.cancelJob(queueType, jobId);
    
    if (!cancelled) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    res.json({ success: true, message: 'Job cancelled' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Pause queue
router.post('/api/queues/:queueType/pause', async (req, res) => {
  try {
    const queueType = req.params.queueType as any;
    await queueService.pauseQueue(queueType);
    res.json({ success: true, message: `Queue '${queueType}' paused` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Resume queue
router.post('/api/queues/:queueType/resume', async (req, res) => {
  try {
    const queueType = req.params.queueType as any;
    await queueService.resumeQueue(queueType);
    res.json({ success: true, message: `Queue '${queueType}' resumed` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Clean queue
router.post('/api/queues/:queueType/clean', async (req, res) => {
  try {
    const queueType = req.params.queueType as any;
    const grace = parseInt(req.body.grace || '86400000'); // 24 hours
    const status = req.body.status || 'completed';
    
    const cleaned = await queueService.cleanQueue(queueType, grace, status);
    res.json({ 
      success: true, 
      message: `Cleaned ${cleaned} jobs from '${queueType}' queue` 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get health
router.get('/api/queues/health', (req, res) => {
  try {
    const health = queueService.getHealth();
    res.json({ success: true, health });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
