/**
 * Demand Forecasting Routes
 * 
 * REST API for AI-powered demand prediction and forecasting
 * Part of Chunk 5: Predictive AI capabilities
 */

import { Express } from "express";
import { db } from "../../db";
import { demandForecasts, seasonalPatterns, forecastAccuracyMetrics, users, products } from "@shared/schema";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import { DemandForecastingService } from "../services/DemandForecastingService";
import { createLogger } from "../utils/logger";

const logger = createLogger("DemandForecastingRoutes");

/**
 * Helper function to get user info from session
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

export function registerDemandForecastingRoutes(app: Express) {
  const forecastingService = new DemandForecastingService((global as any).storage);

  /**
   * POST /api/demand-forecasting/generate
   * Generate new demand forecasts for specified period
   */
  app.post("/api/demand-forecasting/generate", async (req, res) => {
    try {
      const userInfo = await getUserInfo(req);
      
      if (!userInfo) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { companyId } = userInfo;
      const { daysAhead = 14, productId = null } = req.body;

      logger.info({ companyId, daysAhead, productId }, "Generating demand forecasts");

      // Generate forecasts using AI service
      const forecasts = await forecastingService.generateForecast(daysAhead);

      // Store forecasts in database
      const storedForecasts = await Promise.all(
        forecasts.map(async (forecast) => {
          const forecastId = `FC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          const forecastRecord = {
            id: forecastId,
            companyId,
            productId: productId || null,
            forecastDate: new Date(forecast.date),
            predictedDemand: forecast.predictedOrderVolume,
            confidenceInterval: forecast.confidence.toString(),
            forecastMethod: "ai_ml" as const,
            horizon: "week" as const,
            historicalAverage: null,
            trendFactor: (forecast.trend === "increasing" ? "1.10" : forecast.trend === "decreasing" ? "0.90" : "1.00"),
            seasonalityFactor: "1.00", // Will be enhanced later
            actualDemand: null,
            accuracyScore: null,
            modelVersion: "v1.0",
            confidence: forecast.confidence.toString(),
            generatedAt: new Date(),
            updatedAt: new Date(),
          };

          await db.insert(demandForecasts).values(forecastRecord);
          
          return forecastRecord;
        })
      );

      logger.info({ count: storedForecasts.length }, "Forecasts generated and stored");

      res.json({
        success: true,
        forecasts: storedForecasts,
        summary: {
          totalForecasts: storedForecasts.length,
          averageConfidence: storedForecasts.reduce((sum, f) => sum + parseFloat(f.confidence), 0) / storedForecasts.length,
          dateRange: {
            start: storedForecasts[0]?.forecastDate,
            end: storedForecasts[storedForecasts.length - 1]?.forecastDate,
          },
        },
      });
    } catch (error) {
      logger.error(error as Error, "Failed to generate forecasts");
      res.status(500).json({ 
        message: "Failed to generate forecasts",
        error: (error as Error).message 
      });
    }
  });

  /**
   * GET /api/demand-forecasting/forecasts
   * Get demand forecasts for company
   */
  app.get("/api/demand-forecasting/forecasts", async (req, res) => {
    try {
      const userInfo = await getUserInfo(req);
      
      if (!userInfo) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { companyId } = userInfo;
      const { 
        productId = null, 
        startDate = null, 
        endDate = null,
        limit = "30",
        includeActuals = "true"
      } = req.query;

      const conditions = [eq(demandForecasts.companyId, companyId)];

      if (productId) {
        conditions.push(eq(demandForecasts.productId, productId as string));
      }

      if (startDate) {
        conditions.push(gte(demandForecasts.forecastDate, new Date(startDate as string)));
      }

      if (endDate) {
        conditions.push(lte(demandForecasts.forecastDate, new Date(endDate as string)));
      }

      const forecasts = await db
        .select()
        .from(demandForecasts)
        .where(and(...conditions))
        .orderBy(demandForecasts.forecastDate)
        .limit(parseInt(limit as string));

      // Calculate statistics
      const stats = {
        totalForecasts: forecasts.length,
        averagePredictedDemand: forecasts.reduce((sum, f) => sum + f.predictedDemand, 0) / forecasts.length,
        averageConfidence: forecasts.reduce((sum, f) => sum + parseFloat(f.confidence), 0) / forecasts.length,
        forecastsWithActuals: forecasts.filter(f => f.actualDemand !== null).length,
      };

      res.json({
        success: true,
        forecasts,
        stats,
      });
    } catch (error) {
      logger.error(error as Error, "Failed to fetch forecasts");
      res.status(500).json({ 
        message: "Failed to fetch forecasts",
        error: (error as Error).message 
      });
    }
  });

  /**
   * GET /api/demand-forecasting/patterns
   * Get seasonal patterns for company
   */
  app.get("/api/demand-forecasting/patterns", async (req, res) => {
    try {
      const userInfo = await getUserInfo(req);
      
      if (!userInfo) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { companyId } = userInfo;
      const { productId = null, active = "true" } = req.query;

      logger.info({ companyId, productId }, "Fetching seasonal patterns");

      // Analyze patterns using service
      const patterns = await forecastingService.analyzeSeasonalPatterns();

      // Store patterns in database if they don't exist
      for (const pattern of patterns) {
        const patternId = `PAT-${Date.now()}-${pattern.month}`;
        
        await db.insert(seasonalPatterns)
          .values({
            companyId,
            productId: productId as string || null,
            patternType: "seasonal",
            patternName: `Month ${pattern.month + 1} Pattern`,
            peakPeriod: pattern.peakDays.join(","),
            demandMultiplier: pattern.averageVolume.toString(),
            confidence: "75.00",
            observationCount: 30,
            firstObserved: new Date(new Date().setMonth(pattern.month)),
            lastObserved: new Date(),
            isActive: true,
          })
          .onConflictDoNothing();
      }

      // Fetch stored patterns
      const conditions = [eq(seasonalPatterns.companyId, companyId)];
      
      if (productId) {
        conditions.push(eq(seasonalPatterns.productId, productId as string));
      }
      
      if (active === "true") {
        conditions.push(eq(seasonalPatterns.isActive, true));
      }

      const storedPatterns = await db
        .select()
        .from(seasonalPatterns)
        .where(and(...conditions))
        .orderBy(seasonalPatterns.confidence);

      res.json({
        success: true,
        patterns: storedPatterns,
        summary: {
          totalPatterns: storedPatterns.length,
          activePatterns: storedPatterns.filter(p => p.isActive).length,
          averageConfidence: storedPatterns.reduce((sum, p) => sum + parseFloat(p.confidence), 0) / storedPatterns.length,
        },
      });
    } catch (error) {
      logger.error(error as Error, "Failed to fetch patterns");
      res.status(500).json({ 
        message: "Failed to fetch patterns",
        error: (error as Error).message 
      });
    }
  });

  /**
   * PUT /api/demand-forecasting/:forecastId/actual
   * Update actual demand for a forecast (enables accuracy tracking)
   */
  app.put("/api/demand-forecasting/:forecastId/actual", async (req, res) => {
    try {
      const userInfo = await getUserInfo(req);
      
      if (!userInfo) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { companyId } = userInfo;
      const { forecastId } = req.params;
      const { actualDemand } = req.body;

      if (typeof actualDemand !== "number") {
        return res.status(400).json({ message: "actualDemand must be a number" });
      }

      logger.info({ forecastId, actualDemand }, "Updating forecast with actual demand");

      // Fetch the forecast
      const forecast = await db.query.demandForecasts.findFirst({
        where: and(
          eq(demandForecasts.id, forecastId),
          eq(demandForecasts.companyId, companyId)
        ),
      });

      if (!forecast) {
        return res.status(404).json({ message: "Forecast not found" });
      }

      // Calculate accuracy score
      const error = Math.abs(forecast.predictedDemand - actualDemand);
      const percentError = (error / actualDemand) * 100;
      const accuracyScore = Math.max(0, 100 - percentError);

      // Update the forecast
      await db
        .update(demandForecasts)
        .set({
          actualDemand,
          accuracyScore: accuracyScore.toFixed(2),
          updatedAt: new Date(),
        })
        .where(eq(demandForecasts.id, forecastId));

      res.json({
        success: true,
        forecast: {
          id: forecastId,
          predictedDemand: forecast.predictedDemand,
          actualDemand,
          accuracyScore,
          error,
          percentError,
        },
      });
    } catch (error) {
      logger.error(error as Error, "Failed to update forecast");
      res.status(500).json({ 
        message: "Failed to update forecast",
        error: (error as Error).message 
      });
    }
  });

  /**
   * GET /api/demand-forecasting/accuracy
   * Get forecasting accuracy metrics
   */
  app.get("/api/demand-forecasting/accuracy", async (req, res) => {
    try {
      const userInfo = await getUserInfo(req);
      
      if (!userInfo) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { companyId } = userInfo;
      const { productId = null, period = "30" } = req.query;

      logger.info({ companyId, productId, period }, "Fetching accuracy metrics");

      // Get metrics from service
      const metrics = await forecastingService.getMetrics();

      // Fetch forecasts with actuals for detailed analysis
      const conditions = [
        eq(demandForecasts.companyId, companyId),
        sql`${demandForecasts.actualDemand} IS NOT NULL`,
      ];

      if (productId) {
        conditions.push(eq(demandForecasts.productId, productId as string));
      }

      const forecastsWithActuals = await db
        .select()
        .from(demandForecasts)
        .where(and(...conditions))
        .orderBy(desc(demandForecasts.forecastDate))
        .limit(parseInt(period as string));

      // Calculate detailed metrics
      let totalError = 0;
      let totalPercentError = 0;
      let accurateCount = 0; // Within 10%

      forecastsWithActuals.forEach(f => {
        if (f.actualDemand) {
          const error = Math.abs(f.predictedDemand - f.actualDemand);
          const percentError = (error / f.actualDemand) * 100;
          
          totalError += error;
          totalPercentError += percentError;
          
          if (percentError < 10) {
            accurateCount++;
          }
        }
      });

      const count = forecastsWithActuals.length;
      const mae = count > 0 ? totalError / count : 0;
      const mape = count > 0 ? totalPercentError / count : 0;
      const accuracyRate = count > 0 ? (accurateCount / count) * 100 : 0;

      // Store metrics in database
      const metricsId = `MET-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const periodStart = new Date();
      periodStart.setDate(periodStart.getDate() - parseInt(period as string));

      await db.insert(forecastAccuracyMetrics)
        .values({
          companyId,
          productId: productId as string || null,
          periodStart,
          periodEnd: new Date(),
          mape: mape.toFixed(2),
          mae: mae.toFixed(2),
          rmse: metrics.rmse?.toFixed(2) || null,
          totalForecasts: count,
          accurateForecasts: accurateCount,
          forecastMethod: "ai_ml",
        });

      res.json({
        success: true,
        metrics: {
          accuracy: accuracyRate,
          mape,
          mae,
          rmse: metrics.rmse,
          totalForecasts: count,
          accurateForecasts: accurateCount,
          lastUpdated: new Date(),
        },
        recentForecasts: forecastsWithActuals.slice(0, 10).map(f => ({
          date: f.forecastDate,
          predicted: f.predictedDemand,
          actual: f.actualDemand,
          error: f.actualDemand ? Math.abs(f.predictedDemand - f.actualDemand) : null,
          accuracyScore: f.accuracyScore,
        })),
      });
    } catch (error) {
      logger.error(error as Error, "Failed to fetch accuracy metrics");
      res.status(500).json({ 
        message: "Failed to fetch accuracy metrics",
        error: (error as Error).message 
      });
    }
  });

  /**
   * GET /api/demand-forecasting/recommendations
   * Get AI-powered recommendations based on forecasts
   */
  app.get("/api/demand-forecasting/recommendations", async (req, res) => {
    try {
      const userInfo = await getUserInfo(req);
      
      if (!userInfo) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { companyId } = userInfo;
      const { daysAhead = "7" } = req.query;

      logger.info({ companyId, daysAhead }, "Generating recommendations");

      // Get staffing recommendations
      const staffingRecs = await forecastingService.getStaffingRecommendations(parseInt(daysAhead as string));

      // Identify surge periods
      const surges = await forecastingService.identifySurgePeriods(parseInt(daysAhead as string));

      // Detect anomalies
      const anomalies = await forecastingService.detectAnomalies(30);

      res.json({
        success: true,
        recommendations: {
          staffing: staffingRecs,
          surges: surges.map(s => ({
            period: `${s.startDate} to ${s.endDate}`,
            severity: s.severity,
            peakValue: s.peakValue,
            actions: s.recommendations,
          })),
          anomalies: {
            detected: anomalies.summary.totalAnomalies,
            highSeverity: anomalies.summary.highSeverityCount,
            recent: anomalies.anomalies.slice(0, 5).map(a => ({
              date: a.date,
              volume: a.volume,
              severity: a.severity,
              deviation: `${a.deviationPercent.toFixed(1)}%`,
            })),
          },
        },
        summary: {
          upcomingChallenges: surges.length,
          recentAnomalies: anomalies.summary.totalAnomalies,
          staffingOptimized: staffingRecs.length > 0,
          generatedAt: new Date(),
        },
      });
    } catch (error) {
      logger.error(error as Error, "Failed to generate recommendations");
      res.status(500).json({ 
        message: "Failed to generate recommendations",
        error: (error as Error).message 
      });
    }
  });

  /**
   * GET /api/demand-forecasting/surge-periods
   * Identify upcoming surge periods
   */
  app.get("/api/demand-forecasting/surge-periods", async (req, res) => {
    try {
      const userInfo = await getUserInfo(req);
      
      if (!userInfo) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { daysAhead = "30" } = req.query;

      logger.info({ daysAhead }, "Identifying surge periods");

      const surges = await forecastingService.identifySurgePeriods(parseInt(daysAhead as string));

      res.json({
        success: true,
        surges,
        summary: {
          totalSurges: surges.length,
          highSeverity: surges.filter(s => s.severity === "high").length,
          mediumSeverity: surges.filter(s => s.severity === "medium").length,
          lowSeverity: surges.filter(s => s.severity === "low").length,
        },
      });
    } catch (error) {
      logger.error(error as Error, "Failed to identify surge periods");
      res.status(500).json({ 
        message: "Failed to identify surge periods",
        error: (error as Error).message 
      });
    }
  });

  /**
   * GET /api/demand-forecasting/anomalies
   * Detect anomalies in demand patterns
   */
  app.get("/api/demand-forecasting/anomalies", async (req, res) => {
    try {
      const userInfo = await getUserInfo(req);
      
      if (!userInfo) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { daysBack = "30" } = req.query;

      logger.info({ daysBack }, "Detecting anomalies");

      const anomalies = await forecastingService.detectAnomalies(parseInt(daysBack as string));

      res.json({
        success: true,
        ...anomalies,
      });
    } catch (error) {
      logger.error(error as Error, "Failed to detect anomalies");
      res.status(500).json({ 
        message: "Failed to detect anomalies",
        error: (error as Error).message 
      });
    }
  });

  logger.info("Demand forecasting routes registered");
}
