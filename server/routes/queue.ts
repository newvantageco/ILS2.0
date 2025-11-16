import type { Express } from "express";
import { getQueueStats } from "../queue/helpers";
import { getQueueHealth } from "../queue/config";
import { createLogger } from "../utils/logger";

const logger = createLogger('queue');

/**
 * Queue Monitoring Routes
 * Admin-only endpoints for monitoring background job queues
 */
export function registerQueueRoutes(app: Express) {
  
  /**
   * GET /api/queue/stats
   * Get queue statistics (job counts by status)
   */
  app.get("/api/queue/stats", async (req, res) => {
    try {
      // Check if user is admin (platform_admin or company_admin)
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const user = req.user as any;
      if (!user.role || !['platform_admin', 'admin', 'company_admin'].includes(user.role)) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const stats = await getQueueStats();
      res.json(stats);
    } catch (error) {
      logger.error({ error }, 'Error fetching queue stats');
      res.status(500).json({
        error: "Failed to fetch queue statistics",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  /**
   * GET /api/queue/health
   * Get detailed queue health information
   */
  app.get("/api/queue/health", async (req, res) => {
    try {
      // Check if user is admin
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const user = req.user as any;
      if (!user.role || !['platform_admin', 'admin', 'company_admin'].includes(user.role)) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const health = await getQueueHealth();
      res.json(health);
    } catch (error) {
      logger.error({ error }, 'Error fetching queue health');
      res.status(500).json({
        error: "Failed to fetch queue health",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  /**
   * GET /api/queue/info
   * Get general queue system information
   */
  app.get("/api/queue/info", async (req, res) => {
    try {
      // Check if user is admin
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const user = req.user as any;
      if (!user.role || !['platform_admin', 'admin', 'company_admin'].includes(user.role)) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const health = await getQueueHealth();
      const stats = await getQueueStats();

      const info = {
        system: {
          redis: health.redis,
          status: health.redis ? 'operational' : 'fallback',
          mode: health.redis ? 'queue-based' : 'immediate-execution',
        },
        queues: {
          email: {
            enabled: true,
            description: 'Order confirmations, shipment notifications, marketplace emails',
            concurrency: 5,
            rateLimit: '100 per minute',
          },
          pdf: {
            enabled: true,
            description: 'Invoice, receipt, lab ticket generation',
            concurrency: 3,
            rateLimit: '20 per minute',
          },
          notification: {
            enabled: true,
            description: 'In-app notifications',
            concurrency: 10,
            rateLimit: '200 per minute',
          },
          ai: {
            enabled: true,
            description: 'Daily briefings, forecasts, insights, chat responses',
            concurrency: 2,
            rateLimit: '10 per minute',
          },
        },
        stats: health.redis ? stats : { message: 'Redis not available - stats unavailable' },
      };

      res.json(info);
    } catch (error) {
      logger.error({ error }, 'Error fetching queue info');
      res.status(500).json({
        error: "Failed to fetch queue information",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
}
