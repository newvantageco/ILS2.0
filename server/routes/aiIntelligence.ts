/**
 * AI Intelligence Routes
 * 
 * Routes for advanced AI/ML features:
 * - Demand forecasting
 * - Anomaly detection
 * - Bottleneck prevention
 * 
 * POST /api/ai/forecast/generate - Generate demand forecast
 * GET /api/ai/forecast/staffing - Get staffing recommendations
 * GET /api/ai/forecast/surge - Identify surge periods
 * 
 * GET /api/ai/anomalies/quality - Detect quality anomalies
 * GET /api/ai/anomalies/equipment - Predict equipment failures
 * GET /api/ai/anomalies/process - Monitor process deviations
 * GET /api/ai/anomalies/alerts - Get active alerts
 * 
 * GET /api/ai/bottlenecks - Identify current bottlenecks
 * POST /api/ai/bottlenecks/optimize - Get optimization recommendations
 * GET /api/ai/bottlenecks/utilization - Get station utilization
 * GET /api/ai/bottlenecks/predict - Predict future bottlenecks
 */

import type { Express, Request, Response } from "express";
import { isAuthenticated } from "../replitAuth";
import { DemandForecastingService } from "../services/DemandForecastingService";
import { AnomalyDetectionService } from "../services/AnomalyDetectionService";
import { BottleneckPreventionService } from "../services/BottleneckPreventionService";
import { BusinessIntelligenceService } from "../services/BusinessIntelligenceService";
import { storage } from "../storage";

let demandForecastingService: DemandForecastingService;
let anomalyDetectionService: AnomalyDetectionService;
let bottleneckPreventionService: BottleneckPreventionService;
let businessIntelligenceService: BusinessIntelligenceService;

export function registerAiIntelligenceRoutes(app: Express): void {
  // Initialize services
  demandForecastingService = new DemandForecastingService(storage);
  anomalyDetectionService = new AnomalyDetectionService(storage);
  bottleneckPreventionService = new BottleneckPreventionService(storage);
  businessIntelligenceService = new BusinessIntelligenceService(storage);

  // ============== DEMAND FORECASTING ==============

  /**
   * POST /api/ai/forecast/generate
   * 
   * Generate demand forecast for specified time period
   * 
   * Request body:
   * {
   *   daysAhead: number (1-30)
   * }
   */
  app.post("/api/ai/forecast/generate", isAuthenticated, async (req: any, res: Response) => {
    try {
      const { daysAhead = 7 } = req.body;

      if (daysAhead < 1 || daysAhead > 30) {
        return res.status(400).json({
          error: "Invalid daysAhead parameter. Must be between 1 and 30",
        });
      }

      const forecast = await demandForecastingService.generateForecast(daysAhead);

      res.status(200).json({
        success: true,
        data: forecast,
      });
    } catch (error: any) {
      console.error("Error generating forecast:", error);
      res.status(500).json({
        error: "Forecast generation failed",
        message: error.message || "Failed to generate forecast",
      });
    }
  });

  /**
   * GET /api/ai/forecast/staffing
   * 
   * Get staffing recommendations based on forecasted demand
   * 
   * Query params:
   * ?daysAhead=7
   */
  app.get("/api/ai/forecast/staffing", isAuthenticated, async (req: any, res: Response) => {
    try {
      const daysAhead = parseInt(req.query.daysAhead as string) || 7;

      if (daysAhead < 1 || daysAhead > 30) {
        return res.status(400).json({
          error: "Invalid daysAhead parameter. Must be between 1 and 30",
        });
      }

      const recommendations = await demandForecastingService.getStaffingRecommendations(daysAhead);

      res.status(200).json({
        success: true,
        data: recommendations,
      });
    } catch (error: any) {
      console.error("Error getting staffing recommendations:", error);
      res.status(500).json({
        error: "Staffing recommendations failed",
        message: error.message || "Failed to get staffing recommendations",
      });
    }
  });

  /**
   * GET /api/ai/forecast/surge
   * 
   * Identify surge periods in forecasted demand
   * 
   * Query params:
   * ?daysAhead=30
   */
  app.get("/api/ai/forecast/surge", isAuthenticated, async (req: any, res: Response) => {
    try {
      const daysAhead = parseInt(req.query.daysAhead as string) || 30;

      if (daysAhead < 1 || daysAhead > 30) {
        return res.status(400).json({
          error: "Invalid daysAhead parameter. Must be between 1 and 30",
        });
      }

      const surgePeriods = await demandForecastingService.identifySurgePeriods(daysAhead);

      res.status(200).json({
        success: true,
        data: surgePeriods,
      });
    } catch (error: any) {
      console.error("Error identifying surge periods:", error);
      res.status(500).json({
        error: "Surge identification failed",
        message: error.message || "Failed to identify surge periods",
      });
    }
  });

  /**
   * GET /api/ai/forecast/patterns
   * 
   * Analyze seasonal patterns in order data
   */
  app.get("/api/ai/forecast/patterns", isAuthenticated, async (req: any, res: Response) => {
    try {
      const patterns = await demandForecastingService.analyzeSeasonalPatterns();

      res.status(200).json({
        success: true,
        data: patterns,
      });
    } catch (error: any) {
      console.error("Error analyzing patterns:", error);
      res.status(500).json({
        error: "Pattern analysis failed",
        message: error.message || "Failed to analyze patterns",
      });
    }
  });

  /**
   * GET /api/ai/forecast/metrics
   * 
   * Get forecast accuracy metrics
   */
  app.get("/api/ai/forecast/metrics", isAuthenticated, async (req: any, res: Response) => {
    try {
      const metrics = await demandForecastingService.getMetrics();

      res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error: any) {
      console.error("Error getting forecast metrics:", error);
      res.status(500).json({
        error: "Metrics retrieval failed",
        message: error.message || "Failed to get metrics",
      });
    }
  });

  /**
   * GET /api/ai/forecast/anomalies
   * 
   * Detect anomalies in order patterns with advanced ML analysis
   * 
   * Query params:
   * ?daysBack=30
   */
  app.get("/api/ai/forecast/anomalies", isAuthenticated, async (req: any, res: Response) => {
    try {
      const daysBack = parseInt(req.query.daysBack as string) || 30;

      const anomalies = await demandForecastingService.detectAnomalies(daysBack);

      res.status(200).json({
        success: true,
        data: anomalies,
      });
    } catch (error: any) {
      console.error("Error detecting anomalies:", error);
      res.status(500).json({
        error: "Anomaly detection failed",
        message: error.message || "Failed to detect anomalies",
      });
    }
  });

  /**
   * POST /api/ai/forecast/anomaly-check
   * 
   * Real-time anomaly detection for current volume
   * 
   * Request body:
   * {
   *   currentVolume: number
   * }
   */
  app.post("/api/ai/forecast/anomaly-check", isAuthenticated, async (req: any, res: Response) => {
    try {
      const { currentVolume } = req.body;

      if (typeof currentVolume !== 'number') {
        return res.status(400).json({
          error: "Invalid currentVolume parameter. Must be a number",
        });
      }

      const result = await demandForecastingService.detectRealtimeAnomaly(currentVolume);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("Error checking real-time anomaly:", error);
      res.status(500).json({
        error: "Real-time anomaly check failed",
        message: error.message || "Failed to check anomaly",
      });
    }
  });

  // ============== BUSINESS INTELLIGENCE ==============

  /**
   * GET /api/ai/business-intelligence/dashboard
   * 
   * Get comprehensive business intelligence dashboard
   * 
   * Query params:
   * ?period=month (week, month, quarter)
   */
  app.get("/api/ai/business-intelligence/dashboard", isAuthenticated, async (req: any, res: Response) => {
    try {
      const period = (req.query.period as 'week' | 'month' | 'quarter') || 'month';

      const dashboard = await businessIntelligenceService.generateDashboard(period);

      res.status(200).json({
        success: true,
        data: dashboard,
      });
    } catch (error: any) {
      console.error("Error generating business intelligence dashboard:", error);
      res.status(500).json({
        error: "Dashboard generation failed",
        message: error.message || "Failed to generate dashboard",
      });
    }
  });

  /**
   * GET /api/ai/business-intelligence/insights
   * 
   * Get AI-powered business insights (included in dashboard)
   */
  app.get("/api/ai/business-intelligence/insights", isAuthenticated, async (req: any, res: Response) => {
    try {
      const period = (req.query.period as 'week' | 'month' | 'quarter') || 'month';
      
      // Get full dashboard and extract insights
      const dashboard = await businessIntelligenceService.generateDashboard(period);

      res.status(200).json({
        success: true,
        data: dashboard.insights,
      });
    } catch (error: any) {
      console.error("Error generating insights:", error);
      res.status(500).json({
        error: "Insights generation failed",
        message: error.message || "Failed to generate insights",
      });
    }
  });

  /**
   * GET /api/ai/business-intelligence/opportunities
   * 
   * Identify business opportunities (included in dashboard)
   */
  app.get("/api/ai/business-intelligence/opportunities", isAuthenticated, async (req: any, res: Response) => {
    try {
      const period = (req.query.period as 'week' | 'month' | 'quarter') || 'month';
      
      // Get full dashboard and extract opportunities
      const dashboard = await businessIntelligenceService.generateDashboard(period);

      res.status(200).json({
        success: true,
        data: dashboard.opportunities,
      });
    } catch (error: any) {
      console.error("Error identifying opportunities:", error);
      res.status(500).json({
        error: "Opportunity identification failed",
        message: error.message || "Failed to identify opportunities",
      });
    }
  });

  /**
   * GET /api/ai/business-intelligence/alerts
   * 
   * Get business alerts that require attention (included in dashboard)
   */
  app.get("/api/ai/business-intelligence/alerts", isAuthenticated, async (req: any, res: Response) => {
    try {
      const period = (req.query.period as 'week' | 'month' | 'quarter') || 'week';
      
      // Get full dashboard and extract alerts
      const dashboard = await businessIntelligenceService.generateDashboard(period);

      res.status(200).json({
        success: true,
        data: dashboard.alerts,
      });
    } catch (error: any) {
      console.error("Error getting business alerts:", error);
      res.status(500).json({
        error: "Alert retrieval failed",
        message: error.message || "Failed to get alerts",
      });
    }
  });

  // ============== ANOMALY DETECTION ==============

  /**
   * GET /api/ai/anomalies/quality
   * 
   * Detect quality anomalies in production
   * 
   * Query params:
   * ?lookbackHours=24
   */
  app.get("/api/ai/anomalies/quality", isAuthenticated, async (req: any, res: Response) => {
    try {
      const orderId = req.query.orderId as string;
      
      if (!orderId) {
        return res.status(400).json({
          error: "Missing orderId parameter",
        });
      }

      const anomalies = await anomalyDetectionService.detectQualityAnomalies(orderId);

      res.status(200).json({
        success: true,
        data: anomalies,
      });
    } catch (error: any) {
      console.error("Error detecting quality anomalies:", error);
      res.status(500).json({
        error: "Quality anomaly detection failed",
        message: error.message || "Failed to detect quality anomalies",
      });
    }
  });

  /**
   * GET /api/ai/anomalies/equipment
   * 
   * Predict equipment failures
   * 
   * Query params:
   * ?equipmentId=edger-001
   */
  app.get("/api/ai/anomalies/equipment", isAuthenticated, async (req: any, res: Response) => {
    try {
      const equipmentId = req.query.equipmentId as string;

      if (!equipmentId) {
        return res.status(400).json({
          error: "Missing equipmentId parameter",
        });
      }

      const prediction = await anomalyDetectionService.predictEquipmentFailure(equipmentId);

      res.status(200).json({
        success: true,
        data: prediction,
      });
    } catch (error: any) {
      console.error("Error predicting equipment failure:", error);
      res.status(500).json({
        error: "Equipment failure prediction failed",
        message: error.message || "Failed to predict equipment failure",
      });
    }
  });

  /**
   * GET /api/ai/anomalies/process
   * 
   * Monitor process deviations
   * 
   * Query params:
   * ?processId=coating-station-1
   */
  app.get("/api/ai/anomalies/process", isAuthenticated, async (req: any, res: Response) => {
    try {
      const processId = req.query.processId as string;

      if (!processId) {
        return res.status(400).json({
          error: "Missing processId parameter",
        });
      }

      const deviations = await anomalyDetectionService.monitorProcessDeviations(processId);

      res.status(200).json({
        success: true,
        data: deviations,
      });
    } catch (error: any) {
      console.error("Error monitoring process deviations:", error);
      res.status(500).json({
        error: "Process deviation monitoring failed",
        message: error.message || "Failed to monitor process deviations",
      });
    }
  });

  /**
   * GET /api/ai/anomalies/alerts
   * 
   * Get active anomaly alerts
   * 
   * Query params:
   * ?severity=high&since=2025-10-01T00:00:00Z
   */
  app.get("/api/ai/anomalies/alerts", isAuthenticated, async (req: any, res: Response) => {
    try {
      const severity = req.query.severity as string | undefined;
      const since = req.query.since ? new Date(req.query.since as string) : undefined;

      const alerts = await anomalyDetectionService.getActiveAlerts({
        severity: severity as "low" | "medium" | "high" | "critical",
        since,
      });

      res.status(200).json({
        success: true,
        data: alerts,
      });
    } catch (error: any) {
      console.error("Error getting alerts:", error);
      res.status(500).json({
        error: "Alert retrieval failed",
        message: error.message || "Failed to get alerts",
      });
    }
  });

  /**
   * GET /api/ai/anomalies/metrics
   * 
   * Get anomaly detection metrics
   */
  app.get("/api/ai/anomalies/metrics", isAuthenticated, async (req: any, res: Response) => {
    try {
      const metrics = await anomalyDetectionService.getMetrics();

      res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error: any) {
      console.error("Error getting anomaly metrics:", error);
      res.status(500).json({
        error: "Metrics retrieval failed",
        message: error.message || "Failed to get metrics",
      });
    }
  });

  // ============== BOTTLENECK PREVENTION ==============

  /**
   * GET /api/ai/bottlenecks
   * 
   * Identify current bottlenecks in production
   */
  app.get("/api/ai/bottlenecks", isAuthenticated, async (req: any, res: Response) => {
    try {
      const bottlenecks = await bottleneckPreventionService.identifyBottlenecks();

      res.status(200).json({
        success: true,
        data: bottlenecks,
      });
    } catch (error: any) {
      console.error("Error identifying bottlenecks:", error);
      res.status(500).json({
        error: "Bottleneck identification failed",
        message: error.message || "Failed to identify bottlenecks",
      });
    }
  });

  /**
   * POST /api/ai/bottlenecks/optimize
   * 
   * Get workflow optimization recommendations
   * 
   * Request body:
   * {
   *   targetUtilization?: number (0-1)
   * }
   */
  app.post("/api/ai/bottlenecks/optimize", isAuthenticated, async (req: any, res: Response) => {
    try {
      const { targetUtilization = 0.85 } = req.body;

      if (targetUtilization < 0 || targetUtilization > 1) {
        return res.status(400).json({
          error: "Invalid targetUtilization. Must be between 0 and 1",
        });
      }

      const recommendations = await bottleneckPreventionService.optimizeWorkflow(
        targetUtilization
      );

      res.status(200).json({
        success: true,
        data: recommendations,
      });
    } catch (error: any) {
      console.error("Error optimizing workflow:", error);
      res.status(500).json({
        error: "Workflow optimization failed",
        message: error.message || "Failed to optimize workflow",
      });
    }
  });

  /**
   * GET /api/ai/bottlenecks/utilization
   * 
   * Get current station utilization metrics
   */
  app.get("/api/ai/bottlenecks/utilization", isAuthenticated, async (req: any, res: Response) => {
    try {
      const utilization = await bottleneckPreventionService.getUtilizationMetrics();

      res.status(200).json({
        success: true,
        data: utilization,
      });
    } catch (error: any) {
      console.error("Error getting utilization metrics:", error);
      res.status(500).json({
        error: "Utilization metrics retrieval failed",
        message: error.message || "Failed to get utilization metrics",
      });
    }
  });

  /**
   * GET /api/ai/bottlenecks/predict
   * 
   * Predict future bottlenecks
   * 
   * Query params:
   * ?hoursAhead=24
   */
  app.get("/api/ai/bottlenecks/predict", isAuthenticated, async (req: any, res: Response) => {
    try {
      const hoursAhead = parseInt(req.query.hoursAhead as string) || 24;

      const predictions = await bottleneckPreventionService.predictBottlenecks(hoursAhead);

      res.status(200).json({
        success: true,
        data: predictions,
      });
    } catch (error: any) {
      console.error("Error predicting bottlenecks:", error);
      res.status(500).json({
        error: "Bottleneck prediction failed",
        message: error.message || "Failed to predict bottlenecks",
      });
    }
  });

  /**
   * POST /api/ai/bottlenecks/rebalance
   * 
   * Get staff rebalancing recommendations
   * 
   * Request body:
   * {
   *   bottleneckId: string
   * }
   */
  app.post("/api/ai/bottlenecks/rebalance", isAuthenticated, async (req: any, res: Response) => {
    try {
      const { bottleneckId } = req.body;
      
      if (!bottleneckId) {
        return res.status(400).json({
          error: "Missing bottleneckId in request body",
        });
      }

      const recommendations = await bottleneckPreventionService.recommendReallocation(bottleneckId);

      res.status(200).json({
        success: true,
        data: recommendations,
      });
    } catch (error: any) {
      console.error("Error getting rebalancing recommendations:", error);
      res.status(500).json({
        error: "Rebalancing recommendations failed",
        message: error.message || "Failed to get rebalancing recommendations",
      });
    }
  });

}

// Export service instances for WebSocket integration
export function getAiIntelligenceServices() {
  return {
    demandForecastingService,
    anomalyDetectionService,
    bottleneckPreventionService,
    businessIntelligenceService,
  };
}
