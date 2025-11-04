/**
 * Platform AI API Routes
 * 
 * Endpoints for Python ML-powered analytics, predictions, and benchmarking
 */

import type { Express, Request, Response } from "express";
import { isAuthenticated } from "../replitAuth";
import { PlatformAIService } from "../services/PlatformAIService";
import { db } from "../../db";

let platformAIService: PlatformAIService;

export function registerPlatformAIRoutes(app: Express): void {
  // Initialize service
  platformAIService = new PlatformAIService(db);

  /**
   * GET /api/platform-ai/sales
   * 
   * Get AI-powered sales trend analysis and predictions
   */
  app.get("/api/platform-ai/sales", isAuthenticated, async (req: any, res: Response) => {
    try {
      const { startDate, endDate, companyId } = req.query;
      
      const effectiveCompanyId = companyId || req.user.claims.companyId || req.user.claims.sub;
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          error: "Missing required parameters",
          message: "startDate and endDate are required",
        });
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      const analysis = await platformAIService.analyzeSalesTrends(
        effectiveCompanyId,
        start,
        end
      );

      res.json(analysis);
    } catch (error: any) {
      console.error("Sales analysis error:", error);
      res.status(500).json({
        error: "Failed to analyze sales trends",
        message: error.message,
      });
    }
  });

  /**
   * GET /api/platform-ai/inventory
   * 
   * Get AI-powered inventory performance analysis
   */
  app.get("/api/platform-ai/inventory", isAuthenticated, async (req: any, res: Response) => {
    try {
      const { startDate, endDate, companyId } = req.query;
      
      const effectiveCompanyId = companyId || req.user.claims.companyId || req.user.claims.sub;
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          error: "Missing required parameters",
          message: "startDate and endDate are required",
        });
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      const analysis = await platformAIService.analyzeInventoryPerformance(
        effectiveCompanyId,
        start,
        end
      );

      res.json(analysis);
    } catch (error: any) {
      console.error("Inventory analysis error:", error);
      res.status(500).json({
        error: "Failed to analyze inventory performance",
        message: error.message,
      });
    }
  });

  /**
   * GET /api/platform-ai/bookings
   * 
   * Get AI-powered booking pattern analysis
   */
  app.get("/api/platform-ai/bookings", isAuthenticated, async (req: any, res: Response) => {
    try {
      const { startDate, endDate, companyId } = req.query;
      
      const effectiveCompanyId = companyId || req.user.claims.companyId || req.user.claims.sub;
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          error: "Missing required parameters",
          message: "startDate and endDate are required",
        });
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      const analysis = await platformAIService.analyzeBookingPatterns(
        effectiveCompanyId,
        start,
        end
      );

      res.json(analysis);
    } catch (error: any) {
      console.error("Booking analysis error:", error);
      res.status(500).json({
        error: "Failed to analyze booking patterns",
        message: error.message,
      });
    }
  });

  /**
   * GET /api/platform-ai/comparative
   * 
   * Get comparative analysis against platform benchmarks
   */
  app.get("/api/platform-ai/comparative", isAuthenticated, async (req: any, res: Response) => {
    try {
      const { startDate, endDate, companyId } = req.query;
      
      const effectiveCompanyId = companyId || req.user.claims.companyId || req.user.claims.sub;
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          error: "Missing required parameters",
          message: "startDate and endDate are required",
        });
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      const analysis = await platformAIService.generateComparativeInsights(
        effectiveCompanyId,
        start,
        end
      );

      res.json(analysis);
    } catch (error: any) {
      console.error("Comparative analysis error:", error);
      res.status(500).json({
        error: "Failed to generate comparative insights",
        message: error.message,
      });
    }
  });

  /**
   * GET /api/platform-ai/comprehensive
   * 
   * Get comprehensive AI insights across all areas
   */
  app.get("/api/platform-ai/comprehensive", isAuthenticated, async (req: any, res: Response) => {
    try {
      const { startDate, endDate, companyId } = req.query;
      
      const effectiveCompanyId = companyId || req.user.claims.companyId || req.user.claims.sub;
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          error: "Missing required parameters",
          message: "startDate and endDate are required",
        });
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      const insights = await platformAIService.getComprehensiveInsights(
        effectiveCompanyId,
        start,
        end
      );

      res.json(insights);
    } catch (error: any) {
      console.error("Comprehensive insights error:", error);
      res.status(500).json({
        error: "Failed to generate comprehensive insights",
        message: error.message,
      });
    }
  });

  /**
   * POST /api/platform-ai/clear-cache
   * 
   * Clear the AI insights cache
   */
  app.post("/api/platform-ai/clear-cache", isAuthenticated, async (req: any, res: Response) => {
    try {
      // Only allow platform admins to clear cache
      const userRole = req.user.claims.role;
      if (userRole !== 'platform_admin' && userRole !== 'admin') {
        return res.status(403).json({
          error: "Insufficient permissions",
          message: "Only platform admins can clear the cache",
        });
      }

      platformAIService.clearCache();

      res.json({
        success: true,
        message: "AI insights cache cleared successfully",
      });
    } catch (error: any) {
      console.error("Cache clear error:", error);
      res.status(500).json({
        error: "Failed to clear cache",
        message: error.message,
      });
    }
  });

  /**
   * GET /api/platform-ai/platform-summary
   * 
   * Get platform-wide AI insights (platform admin only)
   */
  app.get("/api/platform-ai/platform-summary", isAuthenticated, async (req: any, res: Response) => {
    try {
      // Check if user is platform admin
      const userRole = req.user.claims.role;
      if (userRole !== 'platform_admin') {
        return res.status(403).json({
          error: "Insufficient permissions",
          message: "Only platform admins can access platform-wide insights",
        });
      }

      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          error: "Missing required parameters",
          message: "startDate and endDate are required",
        });
      }

      // TODO: Implement platform-wide analysis aggregation
      // This would analyze all companies and provide aggregated insights

      res.json({
        status: "coming_soon",
        message: "Platform-wide AI insights aggregation is under development",
        available_endpoints: [
          "/api/platform-ai/sales",
          "/api/platform-ai/inventory",
          "/api/platform-ai/bookings",
          "/api/platform-ai/comparative",
          "/api/platform-ai/comprehensive"
        ]
      });
    } catch (error: any) {
      console.error("Platform summary error:", error);
      res.status(500).json({
        error: "Failed to generate platform summary",
        message: error.message,
      });
    }
  });
}
