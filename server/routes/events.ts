/**
 * Event Routes
 * 
 * API endpoints for event monitoring, history, and management.
 */

import { Router } from 'express';
import { EventBus } from '../events/EventBus';
import { WebhookManager } from '../events/webhooks/WebhookManager';
import { WebSocketBroadcaster } from '../events/websocket/WebSocketBroadcaster';
import { z } from 'zod';
import { createLogger } from '../utils/logger';

const router = Router();
const logger = createLogger('events');

/**
 * Validation schemas
 */
const eventQuerySchema = z.object({
  types: z.string().optional(), // Comma-separated event types
  companyId: z.string().optional(),
  userId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.number().optional(),
});

const webhookRegisterSchema = z.object({
  url: z.string().url(),
  events: z.array(z.string()).min(1),
  secret: z.string().optional(),
});

/**
 * GET /api/events
 * Query event history
 */
router.get('/', async (req, res) => {
  try {
    const query = eventQuerySchema.parse({
      types: req.query.types,
      companyId: req.query.companyId,
      userId: req.query.userId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    });

    const events = await EventBus.getEvents({
      types: query.types ? query.types.split(',') : undefined,
      companyId: query.companyId,
      userId: query.userId,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      limit: query.limit,
    });

    res.json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    logger.error({ error, types: query.types, companyId: query.companyId }, 'Failed to query events');
    res.status(500).json({
      success: false,
      error: 'Failed to query events',
    });
  }
});

/**
 * GET /api/events/stats
 * Get event statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours

    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : new Date();

    const stats = await EventBus.getEventStats(startDate, endDate);

    res.json({
      success: true,
      period: {
        start: startDate,
        end: endDate,
      },
      stats,
      total: Object.values(stats).reduce((sum, count) => sum + count, 0),
    });
  } catch (error) {
    logger.error({ error, startDate, endDate }, 'Failed to get event stats');
    res.status(500).json({
      success: false,
      error: 'Failed to get event stats',
    });
  }
});

/**
 * POST /api/events/replay
 * Replay specific events (admin only)
 */
router.post('/replay', async (req, res) => {
  try {
    // TODO: Add admin permission check
    // if (!req.user?.isAdmin) {
    //   return res.status(403).json({ success: false, error: 'Unauthorized' });
    // }

    const { eventIds } = req.body;

    if (!Array.isArray(eventIds) || eventIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'eventIds must be a non-empty array',
      });
    }

    await EventBus.replayEvents(eventIds);

    res.json({
      success: true,
      message: `Replayed ${eventIds.length} events`,
    });
  } catch (error) {
    logger.error({ error, eventCount: eventIds?.length }, 'Failed to replay events');
    res.status(500).json({
      success: false,
      error: 'Failed to replay events',
    });
  }
});

/**
 * GET /api/events/webhooks
 * Get webhook subscriptions for company
 */
router.get('/webhooks', async (req, res) => {
  try {
    // TODO: Get company ID from authenticated user
    const companyId = req.query.companyId as string || 'demo-company';

    const subscriptions = await WebhookManager.getSubscriptions(companyId);

    res.json({
      success: true,
      count: subscriptions.length,
      subscriptions: subscriptions.map((s) => ({
        id: s.id,
        url: s.url,
        events: s.events,
        active: s.active,
        // Don't expose secret
      })),
    });
  } catch (error) {
    logger.error({ error, companyId }, 'Failed to get webhook subscriptions');
    res.status(500).json({
      success: false,
      error: 'Failed to get webhook subscriptions',
    });
  }
});

/**
 * POST /api/events/webhooks
 * Register new webhook subscription
 */
router.post('/webhooks', async (req, res) => {
  try {
    // TODO: Get company ID from authenticated user
    const companyId = req.body.companyId || 'demo-company';

    const data = webhookRegisterSchema.parse(req.body);

    const subscriptionId = await WebhookManager.register(
      companyId,
      data.url,
      data.events,
      data.secret
    );

    res.json({
      success: true,
      subscriptionId,
      message: 'Webhook registered successfully',
    });
  } catch (error) {
    logger.error({ error, companyId, url: data?.url, eventCount: data?.events?.length }, 'Failed to register webhook');
    res.status(500).json({
      success: false,
      error: 'Failed to register webhook',
    });
  }
});

/**
 * DELETE /api/events/webhooks/:id
 * Unregister webhook subscription
 */
router.delete('/webhooks/:id', async (req, res) => {
  try {
    const subscriptionId = req.params.id;

    await WebhookManager.unregister(subscriptionId);

    res.json({
      success: true,
      message: 'Webhook unregistered successfully',
    });
  } catch (error) {
    logger.error({ error, subscriptionId }, 'Failed to unregister webhook');
    res.status(500).json({
      success: false,
      error: 'Failed to unregister webhook',
    });
  }
});

/**
 * GET /api/events/websocket/stats
 * Get WebSocket connection statistics
 */
router.get('/websocket/stats', (req, res) => {
  try {
    const totalConnections = WebSocketBroadcaster.getConnectionCount();

    res.json({
      success: true,
      totalConnections,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to get WebSocket stats');
    res.status(500).json({
      success: false,
      error: 'Failed to get WebSocket stats',
    });
  }
});

export default router;
