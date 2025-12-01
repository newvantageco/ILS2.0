import { Router } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import * as schema from '@shared/schema';
import { isAuthenticated as authenticateUser, requireRole } from '../middleware/auth';
import { setTenantContext } from '../middleware/tenantContext';
import orderTrackingService from '../services/OrderTrackingService';
import { storage } from '../storage';
import { createLogger } from '../utils/logger';

const router = Router();
const logger = createLogger('orderTracking');

// Get detailed order status
// SECURITY: Uses tenant context middleware to ensure tenant isolation
router.get(
  '/api/orders/:orderId/status',
  authenticateUser,
  setTenantContext,
  async (req, res) => {
    try {
      const { orderId } = req.params;
      const companyId = req.tenantId;

      if (!companyId) {
        return res.status(403).json({ error: 'Tenant context required' });
      }

      // Use tenant-aware method instead of _Internal
      const order = await storage.getOrder(orderId, companyId);

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      res.json(order);
    } catch (error) {
      logger.error({ error, orderId: req.params.orderId }, 'Error fetching order status');
      res.status(500).json({ error: 'Failed to fetch order status' });
    }
  }
);

// Update order status (Lab Tech/Engineer only)
// SECURITY: Uses tenant context middleware to ensure tenant isolation
router.post(
  '/api/orders/:orderId/status',
  authenticateUser,
  setTenantContext,
  requireRole(['lab_tech', 'engineer']),
  async (req, res) => {
    try {
      const { orderId } = req.params;
      const { status, details } = req.body;

      // Tenant context is set by middleware, service will use it
      const update = await orderTrackingService.updateOrderStatus(orderId, status, details, req);
      res.json(update);
    } catch (error) {
      logger.error({ error, orderId: req.params.orderId, status: req.body?.status }, 'Error updating order status');
      res.status(500).json({ error: 'Failed to update order status' });
    }
  }
);

// Get order timeline
// SECURITY: Uses tenant context middleware and filters by tenant
router.get(
  '/api/orders/:orderId/timeline',
  authenticateUser,
  setTenantContext,
  async (req, res) => {
    try {
      const { orderId } = req.params;
      const companyId = req.tenantId;

      if (!companyId) {
        return res.status(403).json({ error: 'Tenant context required' });
      }

      // First verify the order belongs to this tenant
      const order = await storage.getOrder(orderId, companyId);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // Now fetch timeline (RLS will also filter if enabled)
      const timeline = await db.select()
        .from(schema.orderTimeline)
        .where(eq(schema.orderTimeline.orderId, orderId))
        .orderBy(schema.orderTimeline.timestamp)
        .execute();

      res.json(timeline);
    } catch (error) {
      logger.error({ error, orderId: req.params.orderId }, 'Error fetching order timeline');
      res.status(500).json({ error: 'Failed to fetch order timeline' });
    }
  }
);

// Subscribe to order updates (WebSocket endpoint handled by OrderTrackingService)

export default router;