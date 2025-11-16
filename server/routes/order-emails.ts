/**
 * Order Email Routes
 * 
 * API endpoints for managing automated order journey emails
 */

import { Router, Request, Response } from "express";
import { authenticateUser, AuthenticatedRequest } from "../middleware/auth";
import orderEmailService from "../services/OrderEmailService";
import { db } from "../db";
import { orders } from "../../shared/schema";
import { eq } from "drizzle-orm";
import { createLogger } from "../utils/logger";

const router = Router();
const logger = createLogger('order-emails');

/**
 * Send order confirmation email
 * POST /api/order-emails/confirmation/:orderId
 */
router.post("/confirmation/:orderId", authenticateUser, async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    await orderEmailService.sendOrderConfirmationEmail(orderId);
    res.json({ success: true, message: "Order confirmation email sent" });
  } catch (error: any) {
    logger.error({ error, orderId }, 'Error sending order confirmation email');
    res.status(500).json({ error: error.message });
  }
});

/**
 * Send production started email
 * POST /api/order-emails/production/:orderId
 */
router.post("/production/:orderId", authenticateUser, async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    await orderEmailService.sendProductionStartedEmail(orderId);
    res.json({ success: true, message: "Production started email sent" });
  } catch (error: any) {
    logger.error({ error, orderId }, 'Error sending production email');
    res.status(500).json({ error: error.message });
  }
});

/**
 * Send quality check email
 * POST /api/order-emails/quality-check/:orderId
 */
router.post("/quality-check/:orderId", authenticateUser, async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    await orderEmailService.sendQualityCheckEmail(orderId);
    res.json({ success: true, message: "Quality check email sent" });
  } catch (error: any) {
    logger.error({ error, orderId }, 'Error sending quality check email');
    res.status(500).json({ error: error.message });
  }
});

/**
 * Send ready for collection email
 * POST /api/order-emails/ready/:orderId
 */
router.post("/ready/:orderId", authenticateUser, async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    await orderEmailService.sendReadyForCollectionEmail(orderId);
    res.json({ success: true, message: "Ready for collection email sent" });
  } catch (error: any) {
    logger.error({ error, orderId }, 'Error sending ready for collection email');
    res.status(500).json({ error: error.message });
  }
});

/**
 * Send order completed email
 * POST /api/order-emails/completed/:orderId
 */
router.post("/completed/:orderId", authenticateUser, async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    await orderEmailService.sendOrderCompletedEmail(orderId);
    res.json({ success: true, message: "Order completed email sent" });
  } catch (error: any) {
    logger.error({ error, orderId }, 'Error sending completed email');
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get email history for an order
 * GET /api/order-emails/history/:orderId
 */
router.get("/history/:orderId", authenticateUser, async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const history = await orderEmailService.getOrderEmailHistory(orderId);
    res.json(history);
  } catch (error: any) {
    logger.error({ error, orderId }, 'Error fetching order email history');
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get email statistics for an order
 * GET /api/order-emails/stats/:orderId
 */
router.get("/stats/:orderId", authenticateUser, async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const stats = await orderEmailService.getOrderEmailStats(orderId);
    res.json(stats);
  } catch (error: any) {
    logger.error({ error }, 'Error fetching order email stats');
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update order status (triggers automated email)
 * PATCH /api/order-emails/update-status/:orderId
 */
router.patch("/update-status/:orderId", authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const { orderId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    // Update order status
    await db.update(orders)
      .set({ 
        status: status
      })
      .where(eq(orders.id, orderId));

    // Trigger automated email
    await orderEmailService.sendOrderStatusEmail(orderId, status);

    res.json({ 
      success: true, 
      message: `Order status updated to ${status} and email sent` 
    });
  } catch (error: any) {
    logger.error({ error, orderId, status }, 'Error updating order status');
    res.status(500).json({ error: error.message });
  }
});

export default router;
