/**
 * Metrics Dashboard Routes
 * 
 * Routes for real-time KPI tracking and performance metrics:
 * - Dashboard overview
 * - Production KPIs
 * - Cost metrics
 * - Revenue analytics
 * - Real-time snapshots
 * 
 * GET /api/metrics/dashboard - Get comprehensive dashboard metrics
 * GET /api/metrics/production - Get production KPIs
 * GET /api/metrics/costs - Get cost analysis
 * GET /api/metrics/revenue - Get revenue analytics
 * GET /api/metrics/realtime - Get real-time snapshot
 */

import type { Express, Request, Response } from "express";
import { authenticateHybrid } from "../middleware/auth-hybrid";
import { MetricsDashboardService } from "../services/MetricsDashboardService";
import { storage } from "../storage";
import { createLogger } from "../utils/logger";

const logger = createLogger('metrics');
let metricsDashboardService: MetricsDashboardService;

export function registerMetricsRoutes(app: Express): void {
  // Initialize service
  metricsDashboardService = new MetricsDashboardService(storage);

  /**
   * GET /api/metrics/dashboard
   * 
   * Get comprehensive dashboard metrics
   * 
   * Query params:
   * ?timeRange=last7days|last30days|last90days|thisMonth
   * ?organizationId=org-id
   */
  app.get("/api/metrics/dashboard", authenticateHybrid, async (req: any, res: Response) => {
    try {
      const timeRange = (req.query.timeRange as string) || "last30days";
      const organizationId = req.query.organizationId as string || req.user.claims.sub;

      const metrics = await metricsDashboardService.getDashboardMetrics(
        organizationId,
        timeRange
      );

      res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error: any) {
      logger.error({ error, timeRange, organizationId }, 'Error getting dashboard metrics');
      res.status(500).json({
        error: "Dashboard metrics retrieval failed",
        message: error.message || "Failed to get dashboard metrics",
      });
    }
  });

  /**
   * GET /api/metrics/production
   * 
   * Get production KPIs and efficiency metrics
   */
  app.get("/api/metrics/production", authenticateHybrid, async (req: any, res: Response) => {
    try {
      const kpis = await metricsDashboardService.getProductionKPIs();

      res.status(200).json({
        success: true,
        data: kpis,
      });
    } catch (error: any) {
      logger.error({ error }, 'Error getting production KPIs');
      res.status(500).json({
        error: "Production KPIs retrieval failed",
        message: error.message || "Failed to get production KPIs",
      });
    }
  });

  /**
   * GET /api/metrics/costs
   * 
   * Get cost metrics and analysis
   */
  app.get("/api/metrics/costs", authenticateHybrid, async (req: any, res: Response) => {
    try {
      const costs = await metricsDashboardService.getCostMetrics();

      res.status(200).json({
        success: true,
        data: costs,
      });
    } catch (error: any) {
      logger.error({ error }, 'Error getting cost metrics');
      res.status(500).json({
        error: "Cost metrics retrieval failed",
        message: error.message || "Failed to get cost metrics",
      });
    }
  });

  /**
   * GET /api/metrics/revenue
   * 
   * Get revenue analytics and forecasts
   */
  app.get("/api/metrics/revenue", authenticateHybrid, async (req: any, res: Response) => {
    try {
      const revenue = await metricsDashboardService.getRevenueAnalytics();

      res.status(200).json({
        success: true,
        data: revenue,
      });
    } catch (error: any) {
      logger.error({ error }, 'Error getting revenue analytics');
      res.status(500).json({
        error: "Revenue analytics retrieval failed",
        message: error.message || "Failed to get revenue analytics",
      });
    }
  });

  /**
   * GET /api/metrics/realtime
   * 
   * Get real-time snapshot of current metrics
   */
  app.get("/api/metrics/realtime", authenticateHybrid, async (req: any, res: Response) => {
    try {
      const snapshot = await metricsDashboardService.getRealtimeSnapshot();

      res.status(200).json({
        success: true,
        data: snapshot,
      });
    } catch (error: any) {
      logger.error({ error }, 'Error getting realtime snapshot');
      res.status(500).json({
        error: "Realtime snapshot retrieval failed",
        message: error.message || "Failed to get realtime snapshot",
      });
    }
  });

  /**
   * GET /api/metrics/overview
   * 
   * Get high-level overview metrics (lightweight endpoint for frequent polling)
   */
  app.get("/api/metrics/overview", authenticateHybrid, async (req: any, res: Response) => {
    try {
      const organizationId = req.query.organizationId as string || req.user.claims.sub;
      
      const metrics = await metricsDashboardService.getDashboardMetrics(
        organizationId,
        "last7days"
      );

      // Return just the overview section for lightweight response
      res.status(200).json({
        success: true,
        data: {
          overview: metrics.overview,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      logger.error({ error, organizationId }, 'Error getting overview');
      res.status(500).json({
        error: "Overview retrieval failed",
        message: error.message || "Failed to get overview",
      });
    }
  });

  /**
   * GET /api/metrics/health
   * 
   * Health check endpoint for monitoring
   */
  app.get("/api/metrics/health", async (req: any, res: Response) => {
    res.status(200).json({
      success: true,
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "metrics-dashboard",
    });
  });
}

// Export service instance for WebSocket integration
export function getMetricsDashboardService() {
  return metricsDashboardService;
}
