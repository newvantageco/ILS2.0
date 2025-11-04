/**
 * Business Intelligence Dashboard Routes
 * 
 * Comprehensive BI endpoints for:
 * - Practice Pulse Dashboard
 * - Financial & Sales Performance
 * - Operational & Staff Efficiency
 * - Patient & Clinical Insights
 * - Platform Admin Multi-Tenant Views
 */

import type { Express, Request, Response } from "express";
import { isAuthenticated } from "../replitAuth";
import { BiAnalyticsService } from "../services/BiAnalyticsService";
import { db } from "../../db";
import { z } from "zod";

const dateRangeSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  companyId: z.string().optional(),
});

let biService: BiAnalyticsService;

export function registerBiRoutes(app: Express): void {
  // Initialize service
  biService = new BiAnalyticsService(db);

  /**
   * GET /api/bi/practice-pulse
   * 
   * Practice Pulse Dashboard - Main KPI overview
   * 
   * Query params:
   * ?startDate=2025-01-01&endDate=2025-01-31&companyId=xxx
   */
  app.get("/api/bi/practice-pulse", isAuthenticated, async (req: any, res: Response) => {
    try {
      const { startDate, endDate, companyId } = req.query;
      
      const effectiveCompanyId = companyId || req.user.claims.companyId || req.user.claims.sub;
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          error: "Missing required parameters",
          message: "startDate and endDate are required",
        });
      }

      const dateRange = {
        start: new Date(startDate as string),
        end: new Date(endDate as string),
      };

      const dashboard = await biService.getPracticePulseDashboard(effectiveCompanyId, dateRange);

      res.status(200).json({
        success: true,
        data: dashboard,
        dateRange: {
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString(),
        },
      });
    } catch (error: any) {
      console.error("Error getting Practice Pulse dashboard:", error);
      res.status(500).json({
        error: "Practice Pulse dashboard retrieval failed",
        message: error.message || "Failed to get Practice Pulse dashboard",
      });
    }
  });

  /**
   * GET /api/bi/financial
   * 
   * Financial & Sales Performance Dashboard
   * 
   * Query params:
   * ?startDate=2025-01-01&endDate=2025-01-31&companyId=xxx
   */
  app.get("/api/bi/financial", isAuthenticated, async (req: any, res: Response) => {
    try {
      const { startDate, endDate, companyId } = req.query;
      
      const effectiveCompanyId = companyId || req.user.claims.companyId || req.user.claims.sub;
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          error: "Missing required parameters",
          message: "startDate and endDate are required",
        });
      }

      const dateRange = {
        start: new Date(startDate as string),
        end: new Date(endDate as string),
      };

      const dashboard = await biService.getFinancialDashboard(effectiveCompanyId, dateRange);

      res.status(200).json({
        success: true,
        data: dashboard,
        dateRange: {
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString(),
        },
      });
    } catch (error: any) {
      console.error("Error getting Financial dashboard:", error);
      res.status(500).json({
        error: "Financial dashboard retrieval failed",
        message: error.message || "Failed to get Financial dashboard",
      });
    }
  });

  /**
   * GET /api/bi/operational
   * 
   * Operational & Staff Efficiency Dashboard
   * 
   * Query params:
   * ?startDate=2025-01-01&endDate=2025-01-31&companyId=xxx
   */
  app.get("/api/bi/operational", isAuthenticated, async (req: any, res: Response) => {
    try {
      const { startDate, endDate, companyId } = req.query;
      
      const effectiveCompanyId = companyId || req.user.claims.companyId || req.user.claims.sub;
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          error: "Missing required parameters",
          message: "startDate and endDate are required",
        });
      }

      const dateRange = {
        start: new Date(startDate as string),
        end: new Date(endDate as string),
      };

      const dashboard = await biService.getOperationalDashboard(effectiveCompanyId, dateRange);

      res.status(200).json({
        success: true,
        data: dashboard,
        dateRange: {
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString(),
        },
      });
    } catch (error: any) {
      console.error("Error getting Operational dashboard:", error);
      res.status(500).json({
        error: "Operational dashboard retrieval failed",
        message: error.message || "Failed to get Operational dashboard",
      });
    }
  });

  /**
   * GET /api/bi/patient
   * 
   * Patient & Clinical Insights Dashboard
   * 
   * Query params:
   * ?startDate=2025-01-01&endDate=2025-01-31&companyId=xxx
   */
  app.get("/api/bi/patient", isAuthenticated, async (req: any, res: Response) => {
    try {
      const { startDate, endDate, companyId } = req.query;
      
      const effectiveCompanyId = companyId || req.user.claims.companyId || req.user.claims.sub;
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          error: "Missing required parameters",
          message: "startDate and endDate are required",
        });
      }

      const dateRange = {
        start: new Date(startDate as string),
        end: new Date(endDate as string),
      };

      const dashboard = await biService.getPatientDashboard(effectiveCompanyId, dateRange);

      res.status(200).json({
        success: true,
        data: dashboard,
        dateRange: {
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString(),
        },
      });
    } catch (error: any) {
      console.error("Error getting Patient dashboard:", error);
      res.status(500).json({
        error: "Patient dashboard retrieval failed",
        message: error.message || "Failed to get Patient dashboard",
      });
    }
  });

  /**
   * GET /api/bi/platform-comparison
   * 
   * Platform Admin View - Compare all practices
   * Requires platform_admin role
   * 
   * Query params:
   * ?startDate=2025-01-01&endDate=2025-01-31
   */
  app.get("/api/bi/platform-comparison", isAuthenticated, async (req: any, res: Response) => {
    try {
      // Check if user is platform admin
      const userRole = req.user.claims.role || req.user.role;
      if (userRole !== 'platform_admin') {
        return res.status(403).json({
          error: "Unauthorized",
          message: "This endpoint requires platform admin privileges",
        });
      }

      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          error: "Missing required parameters",
          message: "startDate and endDate are required",
        });
      }

      const dateRange = {
        start: new Date(startDate as string),
        end: new Date(endDate as string),
      };

      const comparison = await biService.getPlatformComparison(dateRange);

      res.status(200).json({
        success: true,
        data: comparison,
        dateRange: {
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString(),
        },
      });
    } catch (error: any) {
      console.error("Error getting platform comparison:", error);
      res.status(500).json({
        error: "Platform comparison retrieval failed",
        message: error.message || "Failed to get platform comparison",
      });
    }
  });

  /**
   * GET /api/bi/alerts
   * 
   * Get active KPI alerts for a practice
   * 
   * Query params:
   * ?companyId=xxx
   */
  app.get("/api/bi/alerts", isAuthenticated, async (req: any, res: Response) => {
    try {
      const { companyId } = req.query;
      
      const effectiveCompanyId = companyId || req.user.claims.companyId || req.user.claims.sub;

      const alerts = await biService.getActiveAlerts(effectiveCompanyId);

      res.status(200).json({
        success: true,
        data: alerts,
      });
    } catch (error: any) {
      console.error("Error getting KPI alerts:", error);
      res.status(500).json({
        error: "KPI alerts retrieval failed",
        message: error.message || "Failed to get KPI alerts",
      });
    }
  });

  /**
   * GET /api/bi/summary
   * 
   * Get all dashboards in one call (for overview page)
   * 
   * Query params:
   * ?startDate=2025-01-01&endDate=2025-01-31&companyId=xxx
   */
  app.get("/api/bi/summary", isAuthenticated, async (req: any, res: Response) => {
    try {
      const { startDate, endDate, companyId } = req.query;
      
      const effectiveCompanyId = companyId || req.user.claims.companyId || req.user.claims.sub;
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          error: "Missing required parameters",
          message: "startDate and endDate are required",
        });
      }

      const dateRange = {
        start: new Date(startDate as string),
        end: new Date(endDate as string),
      };

      // Fetch all dashboards in parallel
      const [practicePulse, financial, operational, patient, alerts] = await Promise.all([
        biService.getPracticePulseDashboard(effectiveCompanyId, dateRange),
        biService.getFinancialDashboard(effectiveCompanyId, dateRange),
        biService.getOperationalDashboard(effectiveCompanyId, dateRange),
        biService.getPatientDashboard(effectiveCompanyId, dateRange),
        biService.getActiveAlerts(effectiveCompanyId),
      ]);

      res.status(200).json({
        success: true,
        data: {
          practicePulse,
          financial,
          operational,
          patient,
          alerts,
        },
        dateRange: {
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString(),
        },
      });
    } catch (error: any) {
      console.error("Error getting BI summary:", error);
      res.status(500).json({
        error: "BI summary retrieval failed",
        message: error.message || "Failed to get BI summary",
      });
    }
  });

  /**
   * GET /api/bi/health
   * 
   * Health check endpoint for BI service
   */
  app.get("/api/bi/health", async (req: any, res: Response) => {
    res.status(200).json({
      success: true,
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "bi-analytics",
    });
  });

  /**
   * POST /api/bi/alerts/:alertId/acknowledge
   * 
   * Acknowledge a KPI alert
   */
  app.post("/api/bi/alerts/:alertId/acknowledge", isAuthenticated, async (req: any, res: Response) => {
    try {
      const { alertId } = req.params;
      const userId = req.user.claims.sub || req.user.id;

      // TODO: Implement alert acknowledgement
      // await biService.acknowledgeAlert(alertId, userId);

      res.status(200).json({
        success: true,
        message: "Alert acknowledged successfully",
      });
    } catch (error: any) {
      console.error("Error acknowledging alert:", error);
      res.status(500).json({
        error: "Alert acknowledgement failed",
        message: error.message || "Failed to acknowledge alert",
      });
    }
  });

  /**
   * GET /api/bi/export/:dashboardType
   * 
   * Export dashboard data as CSV/PDF
   * 
   * Query params:
   * ?startDate=2025-01-01&endDate=2025-01-31&companyId=xxx&format=csv|pdf
   */
  app.get("/api/bi/export/:dashboardType", isAuthenticated, async (req: any, res: Response) => {
    try {
      const { dashboardType } = req.params;
      const { startDate, endDate, companyId, format } = req.query;
      
      const effectiveCompanyId = companyId || req.user.claims.companyId || req.user.claims.sub;
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          error: "Missing required parameters",
          message: "startDate and endDate are required",
        });
      }

      const dateRange = {
        start: new Date(startDate as string),
        end: new Date(endDate as string),
      };

      // TODO: Implement export functionality
      // For now, return the data as JSON
      let data;
      switch (dashboardType) {
        case 'practice-pulse':
          data = await biService.getPracticePulseDashboard(effectiveCompanyId, dateRange);
          break;
        case 'financial':
          data = await biService.getFinancialDashboard(effectiveCompanyId, dateRange);
          break;
        case 'operational':
          data = await biService.getOperationalDashboard(effectiveCompanyId, dateRange);
          break;
        case 'patient':
          data = await biService.getPatientDashboard(effectiveCompanyId, dateRange);
          break;
        default:
          return res.status(400).json({
            error: "Invalid dashboard type",
            message: "Dashboard type must be one of: practice-pulse, financial, operational, patient",
          });
      }

      res.status(200).json({
        success: true,
        data,
        meta: {
          exportFormat: format || 'json',
          exportDate: new Date().toISOString(),
          dashboardType,
          dateRange,
        },
      });
    } catch (error: any) {
      console.error("Error exporting dashboard:", error);
      res.status(500).json({
        error: "Dashboard export failed",
        message: error.message || "Failed to export dashboard",
      });
    }
  });
}

// Export service instance for scheduled jobs
export function getBiService() {
  return biService;
}
