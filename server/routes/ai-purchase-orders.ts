/**
 * Autonomous Purchase Order Routes
 * 
 * REST API for AI-generated purchase orders
 */

import { Express } from "express";
import { db } from "../../db";
import { aiPurchaseOrders, aiPurchaseOrderItems, users, aiNotifications } from "@shared/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { AutonomousPurchasingService } from "../services/AutonomousPurchasingService";
import { createLogger } from "../utils/logger";

const logger = createLogger("AutonomousPORoutes");

/**
 * Helper function to get user info from session (handles both local and Replit auth)
 */
async function getUserInfo(req: any): Promise<{ userId: string; companyId: string } | null> {
  try {
    const userId = req.user?.claims?.sub || req.user?.id;
    
    if (!userId) {
      return null;
    }

    if (req.user.companyId) {
      return { userId, companyId: req.user.companyId };
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        id: true,
        companyId: true,
      },
    });

    if (!user || !user.companyId) {
      return null;
    }

    req.user.id = userId;
    req.user.companyId = user.companyId;

    return { userId, companyId: user.companyId };
  } catch (error) {
    logger.error(error as Error, "Failed to get user info");
    return null;
  }
}

export function registerAutonomousPORoutes(app: Express) {
  const purchasingService = new AutonomousPurchasingService();

  /**
   * GET /api/ai-purchase-orders
   * List AI-generated draft purchase orders
   */
  app.get("/api/ai-purchase-orders", async (req, res) => {
    try {
      const userInfo = await getUserInfo(req);
      
      if (!userInfo) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { userId, companyId } = userInfo;
      const { status = "pending_review", limit = "20", offset = "0" } = req.query;

      const conditions = [eq(aiPurchaseOrders.companyId, companyId)];

      if (status !== "all") {
        const validStatuses = ["draft", "pending_review", "approved", "rejected", "converted"];
        if (validStatuses.includes(status as string)) {
          conditions.push(eq(aiPurchaseOrders.status, status as any));
        }
      }

      const draftPOs = await db
        .select()
        .from(aiPurchaseOrders)
        .where(and(...conditions))
        .orderBy(desc(aiPurchaseOrders.generatedAt))
        .limit(parseInt(limit as string))
        .offset(parseInt(offset as string));

      // Get items for each PO
      const posWithItems = await Promise.all(
        draftPOs.map(async (po) => {
          const items = await db
            .select()
            .from(aiPurchaseOrderItems)
            .where(eq(aiPurchaseOrderItems.aiPoId, po.id));
          
          return {
            ...po,
            items,
          };
        })
      );

      // Get total count
      const totalResult = await db
        .select({ count: db.$count(aiPurchaseOrders.id) })
        .from(aiPurchaseOrders)
        .where(and(...conditions));

      res.json({
        purchaseOrders: posWithItems,
        total: totalResult[0]?.count || 0,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });
    } catch (error) {
      logger.error(error as Error, "Failed to fetch AI purchase orders");
      res.status(500).json({ message: "Failed to fetch purchase orders" });
    }
  });

  /**
   * GET /api/ai-purchase-orders/:id
   * Get a specific draft PO with all details
   */
  app.get("/api/ai-purchase-orders/:id", async (req, res) => {
    try {
      const userInfo = await getUserInfo(req);
      
      if (!userInfo) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { companyId } = userInfo;
      const { id } = req.params;

      const draftPO = await db
        .select()
        .from(aiPurchaseOrders)
        .where(
          and(
            eq(aiPurchaseOrders.id, id),
            eq(aiPurchaseOrders.companyId, companyId)
          )
        )
        .limit(1);

      if (!draftPO || draftPO.length === 0) {
        return res.status(404).json({ message: "Purchase order not found" });
      }

      // Get items
      const items = await db
        .select()
        .from(aiPurchaseOrderItems)
        .where(eq(aiPurchaseOrderItems.aiPoId, id));

      res.json({
        ...draftPO[0],
        items,
      });
    } catch (error) {
      logger.error(error as Error, "Failed to fetch AI purchase order");
      res.status(500).json({ message: "Failed to fetch purchase order" });
    }
  });

  /**
   * POST /api/ai-purchase-orders/generate
   * Manually trigger PO generation (scan inventory and create drafts)
   */
  app.post("/api/ai-purchase-orders/generate", async (req, res) => {
    try {
      const userInfo = await getUserInfo(req);
      
      if (!userInfo) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { userId, companyId } = userInfo;

      logger.info({ companyId, userId }, "Manually generating purchase orders");

      const draftPOs = await purchasingService.generatePurchaseOrders(companyId, userId);

      // Create notifications for each draft PO
      for (const draft of draftPOs) {
        await db.insert(aiNotifications).values({
          companyId,
          userId: null, // Company-wide
          type: "alert",
          priority: "high",
          title: "🛒 AI-Generated Purchase Order Ready for Review",
          message: `${draft.reason}. Estimated total: $${draft.estimatedTotal.toFixed(2)}. ${draft.items.length} item(s) require restocking.`,
          summary: `Draft PO for ${draft.items.length} items - $${draft.estimatedTotal.toFixed(2)}`,
          actionUrl: `/purchase-orders/${draft.id}`,
          actionLabel: "Review Order",
          data: {
            aiPoId: draft.id,
            itemCount: draft.items.length,
            estimatedTotal: draft.estimatedTotal,
          },
          generatedBy: "autonomous_purchasing",
        });
      }

      res.json({
        message: `Generated ${draftPOs.length} draft purchase order(s)`,
        purchaseOrders: draftPOs,
      });
    } catch (error) {
      logger.error(error as Error, "Failed to generate purchase orders");
      res.status(500).json({ 
        message: "Failed to generate purchase orders",
        error: (error as Error).message 
      });
    }
  });

  /**
   * POST /api/ai-purchase-orders/:id/approve
   * Approve a draft PO and convert to official purchase order
   */
  app.post("/api/ai-purchase-orders/:id/approve", async (req, res) => {
    try {
      const userInfo = await getUserInfo(req);
      
      if (!userInfo) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { userId, companyId } = userInfo;
      const { id } = req.params;
      const { notes } = req.body;

      // Verify the PO belongs to this company
      const draftPOResult = await db
        .select()
        .from(aiPurchaseOrders)
        .where(
          and(
            eq(aiPurchaseOrders.id, id),
            eq(aiPurchaseOrders.companyId, companyId)
          )
        )
        .limit(1);

      if (!draftPOResult || draftPOResult.length === 0) {
        return res.status(404).json({ message: "Purchase order not found" });
      }

      const draftPO = draftPOResult[0];

      logger.info({ aiPoId: id, userId }, "Approving AI-generated PO");

      const officialPoId = await purchasingService.approvePurchaseOrder(id, userId, notes);

      // Create success notification
      await db.insert(aiNotifications).values({
        companyId,
        userId: null,
        type: "insight",
        priority: "medium",
        title: "✅ Purchase Order Approved",
        message: `Draft PO has been converted to official purchase order. Items will be ordered from supplier.`,
        actionUrl: `/purchase-orders/${officialPoId}`,
        actionLabel: "View Official PO",
        data: { aiPoId: id, officialPoId },
        generatedBy: "autonomous_purchasing",
      });

      res.json({
        message: "Purchase order approved and converted",
        officialPoId,
      });
    } catch (error) {
      logger.error(error as Error, "Failed to approve purchase order");
      res.status(500).json({ 
        message: "Failed to approve purchase order",
        error: (error as Error).message 
      });
    }
  });

  /**
   * POST /api/ai-purchase-orders/:id/reject
   * Reject a draft PO
   */
  app.post("/api/ai-purchase-orders/:id/reject", async (req, res) => {
    try {
      const userInfo = await getUserInfo(req);
      
      if (!userInfo) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { userId, companyId } = userInfo;
      const { id } = req.params;
      const { notes } = req.body;

      if (!notes) {
        return res.status(400).json({ message: "Rejection notes are required" });
      }

      // Verify the PO belongs to this company
      const draftPOResult = await db
        .select()
        .from(aiPurchaseOrders)
        .where(
          and(
            eq(aiPurchaseOrders.id, id),
            eq(aiPurchaseOrders.companyId, companyId)
          )
        )
        .limit(1);

      if (!draftPOResult || draftPOResult.length === 0) {
        return res.status(404).json({ message: "Purchase order not found" });
      }

      logger.info({ aiPoId: id, userId }, "Rejecting AI-generated PO");

      await purchasingService.rejectPurchaseOrder(id, userId, notes);

      res.json({
        message: "Purchase order rejected",
      });
    } catch (error) {
      logger.error(error as Error, "Failed to reject purchase order");
      res.status(500).json({ 
        message: "Failed to reject purchase order",
        error: (error as Error).message 
      });
    }
  });

  /**
   * GET /api/ai-purchase-orders/stats/summary
   * Get statistics about AI-generated POs
   */
  app.get("/api/ai-purchase-orders/stats/summary", async (req, res) => {
    try {
      const userInfo = await getUserInfo(req);
      
      if (!userInfo) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { companyId } = userInfo;

      // Get counts by status
      const allPOs = await db
        .select({
          status: aiPurchaseOrders.status,
          count: db.$count(aiPurchaseOrders.id),
        })
        .from(aiPurchaseOrders)
        .where(eq(aiPurchaseOrders.companyId, companyId))
        .groupBy(aiPurchaseOrders.status);

      const stats = {
        total: allPOs.reduce((sum, s) => sum + (s.count || 0), 0),
        pendingReview: allPOs.find(s => s.status === 'pending_review')?.count || 0,
        approved: allPOs.find(s => s.status === 'approved')?.count || 0,
        rejected: allPOs.find(s => s.status === 'rejected')?.count || 0,
        converted: allPOs.find(s => s.status === 'converted')?.count || 0,
      };

      res.json(stats);
    } catch (error) {
      logger.error(error as Error, "Failed to fetch PO stats");
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });
}
