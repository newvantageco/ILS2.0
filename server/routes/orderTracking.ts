import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import * as schema from '@shared/schema';
import { authenticateUser, requireRole } from '../middleware/auth';
import orderTrackingService from '../services/OrderTrackingService';
import { storage } from '../storage';

const router = Router();

// Get detailed order status
router.get(
  '/api/orders/:orderId/status',
  authenticateUser,
  async (req, res) => {
    try {
      const { orderId } = req.params;

      const order = await storage.getOrder(orderId);

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      res.json(order);
    } catch (error) {
      console.error('Error fetching order status:', error);
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

  const update = await orderTrackingService.updateOrderStatus(orderId, status, details);
      res.json(update);
    } catch (error) {
      console.error('Error updating order status:', error);
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
      console.error('Error fetching order timeline:', error);
      res.status(500).json({ error: 'Failed to fetch order timeline' });
    }
  }
);

// Subscribe to order updates (WebSocket endpoint handled by OrderTrackingService)

export default router;