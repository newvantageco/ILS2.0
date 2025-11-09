/**
 * AI Notifications Routes
 * 
 * REST API for managing proactive insights and AI-generated notifications
 */

import { Express } from "express";
import { db } from "../../db";
import { aiNotifications, users } from "@shared/schema";
import { eq, and, desc, sql, or, isNull, inArray } from "drizzle-orm";
import { ProactiveInsightsService } from "../services/ProactiveInsightsService";
import { createLogger } from "../utils/logger";

const logger = createLogger("AINotificationRoutes");

/**
 * Helper function to get user info from session (handles both local and Replit auth)
 */
async function getUserInfo(req: any): Promise<{ userId: string; companyId: string } | null> {
  try {
    // For local auth: req.user = { claims: { sub: userId }, local: true }
    // For Replit auth: req.user = { claims: { sub: userId }, ... }
    const userId = req.user?.claims?.sub || req.user?.id;
    
    if (!userId) {
      return null;
    }

    // Check if companyId is already on req.user
    if (req.user.companyId) {
      return { userId, companyId: req.user.companyId };
    }

    // Fetch user from database to get companyId
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

    // Cache it on req.user for subsequent calls
    req.user.id = userId;
    req.user.companyId = user.companyId;

    return { userId, companyId: user.companyId };
  } catch (error) {
    logger.error(error as Error, "Failed to get user info");
    return null;
  }
}

export function registerAINotificationRoutes(app: Express) {
  const insightsService = new ProactiveInsightsService();

  /**
   * GET /api/ai-notifications
   * List AI-generated notifications
   */
  app.get("/api/ai-notifications", async (req, res) => {
    try {
      const userInfo = await getUserInfo(req);
      
      if (!userInfo) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { userId, companyId } = userInfo;

      const { limit = "20", offset = "0", unreadOnly = "false" } = req.query;

      const conditions = [
        eq(aiNotifications.companyId, companyId),
        eq(aiNotifications.isDismissed, false),
      ];

      // Filter for current user or company-wide notifications
      conditions.push(
        or(
          eq(aiNotifications.userId, userId),
          isNull(aiNotifications.userId)
        )!
      );

      if (unreadOnly === "true") {
        conditions.push(eq(aiNotifications.isRead, false));
      }

      const notifications = await db
        .select()
        .from(aiNotifications)
        .where(and(...conditions))
        .orderBy(desc(aiNotifications.createdAt))
        .limit(parseInt(limit as string))
        .offset(parseInt(offset as string));

      const total = await db
        .select({ count: sql<number>`count(*)` })
        .from(aiNotifications)
        .where(and(...conditions));

      res.json({
        notifications,
        total: parseInt(total[0]?.count.toString() || "0"),
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });
    } catch (error) {
      logger.error(error as Error, "Failed to fetch AI notifications");
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  /**
   * GET /api/ai-notifications/unread-count
   */
  app.get("/api/ai-notifications/unread-count", async (req, res) => {
    try {
      const userInfo = await getUserInfo(req);
      
      if (!userInfo) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { userId, companyId } = userInfo;

      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(aiNotifications)
        .where(
          and(
            eq(aiNotifications.companyId, companyId),
            eq(aiNotifications.isRead, false),
            eq(aiNotifications.isDismissed, false),
            or(
              eq(aiNotifications.userId, userId),
              isNull(aiNotifications.userId)
            )!
          )
        );

      res.json({ count: parseInt(result[0]?.count.toString() || "0") });
    } catch (error) {
      logger.error(error as Error, "Failed to get unread count");
      res.status(500).json({ message: "Failed to get unread count" });
    }
  });

  /**
   * POST /api/ai-notifications/mark-read
   */
  app.post("/api/ai-notifications/mark-read", async (req, res) => {
    try {
      const userInfo = await getUserInfo(req);
      
      if (!userInfo) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { userId, companyId } = userInfo;
      const { notificationIds } = req.body;

      if (notificationIds === "all") {
        await db
          .update(aiNotifications)
          .set({ 
            isRead: true, 
            readAt: new Date(),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(aiNotifications.companyId, companyId),
              eq(aiNotifications.isRead, false),
              or(
                eq(aiNotifications.userId, userId),
                isNull(aiNotifications.userId)
              )!
            )
          );

        res.json({ message: "All notifications marked as read" });
      } else if (Array.isArray(notificationIds)) {
        await db
          .update(aiNotifications)
          .set({ 
            isRead: true, 
            readAt: new Date(),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(aiNotifications.companyId, companyId),
              inArray(aiNotifications.id, notificationIds)
            )
          );

        res.json({ message: `${notificationIds.length} notification(s) marked as read` });
      } else {
        res.status(400).json({ message: "Invalid notificationIds parameter" });
      }
    } catch (error) {
      logger.error(error as Error, "Failed to mark notifications as read");
      res.status(500).json({ message: "Failed to mark notifications as read" });
    }
  });

  /**
   * POST /api/ai-notifications/generate-briefing
   * Manually trigger daily briefing
   */
  app.post("/api/ai-notifications/generate-briefing", async (req, res) => {
    try {
      const userInfo = await getUserInfo(req);
      
      if (!userInfo) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { userId, companyId } = userInfo;

      logger.info("Generating manual briefing", { 
        companyId,
        userId
      });

      // Generate the briefing
      const briefing = await insightsService.generateDailyBriefing(
        companyId,
        userId
      );

      // Store insights as notifications
      const notificationIds = [];
      for (const insight of briefing.insights) {
        const [notification] = await db
          .insert(aiNotifications)
          .values({
            companyId,
            userId: null,
            type: "insight",
            priority: insight.priority >= 4 ? "high" : 
                     insight.priority >= 3 ? "medium" : "low",
            title: insight.title,
            message: insight.message,
            summary: insight.message.substring(0, 100),
            recommendation: insight.recommendation,
            actionUrl: insight.actionUrl,
            actionLabel: insight.actionUrl ? "View Details" : undefined,
            data: insight.data,
            generatedBy: "proactive_insights",
          })
          .returning();
        
        notificationIds.push(notification.id);
      }

      // Store summary as briefing
      const [summaryNotification] = await db
        .insert(aiNotifications)
        .values({
          companyId,
          userId: null,
          type: "briefing",
          priority: "medium",
          title: "📊 Daily Business Briefing",
          message: briefing.summary,
          summary: briefing.summary.substring(0, 100),
          data: { metrics: briefing.metrics },
          generatedBy: "proactive_insights",
        })
        .returning();

      res.json({
        message: "Daily briefing generated",
        briefing,
        notificationCount: notificationIds.length + 1,
        notifications: [summaryNotification.id, ...notificationIds],
      });
    } catch (error) {
      logger.error(error as Error, "Failed to generate briefing");
      res.status(500).json({ 
        message: "Failed to generate briefing",
        error: (error as Error).message 
      });
    }
  });

  logger.info("AI Notification routes registered");
}
