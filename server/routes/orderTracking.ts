import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import * as schema from '@shared/schema';
import { isAuthenticated as authenticateUser, requireRole } from '../middleware/auth';
import orderTrackingService from '../services/OrderTrackingService';
import { storage } from '../storage';
import { createLogger } from '../utils/logger';

const router = Router();
const logger = createLogger('orderTracking');

// Get detailed order status
router.get(
  '/api/orders/:orderId/status',
  authenticateUser,
  async (req, res) => {
    try {
      const { orderId } = req.params;

      const order = await storage.getOrderById_Internal(orderId);

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      res.json(order);
    } catch (error) {
      logger.error({ error, orderId }, 'Error fetching order status');
      res.status(500).json({ error: 'Failed to fetch order status' });
    }
  }
);

// Update order status (Lab Tech/Engineer only)
router.post(
  '/api/orders/:orderId/status',
  authenticateUser,
  requireRole(['lab_tech', 'engineer']),
  async (req, res) => {
    try {
      const { orderId } = req.params;
      const { status, details } = req.body;

      const update = await orderTrackingService.updateOrderStatus(orderId, status, details, req);
      res.json(update);
    } catch (error) {
      logger.error({ error, orderId, status }, 'Error updating order status');
      res.status(500).json({ error: 'Failed to update order status' });
    }
  }
);

// Get order timeline
router.get(
  '/api/orders/:orderId/timeline',
  authenticateUser,
  async (req, res) => {
    try {
      const { orderId } = req.params;

      const timeline = await db.select()
        .from(schema.orderTimeline)
        .where(eq(schema.orderTimeline.orderId, orderId))
        .orderBy(schema.orderTimeline.timestamp)
        .execute();

      res.json(timeline);
    } catch (error) {
      logger.error({ error, orderId }, 'Error fetching order timeline');
      res.status(500).json({ error: 'Failed to fetch order timeline' });
    }
  }
);

// Subscribe to order updates (WebSocket endpoint handled by OrderTrackingService)

export default router;