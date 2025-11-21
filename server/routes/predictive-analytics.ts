/**
 * Predictive Analytics Routes
 * API endpoints for ML-powered predictions and forecasts
 */

import { Router, Response } from 'express';
import { z } from 'zod';
import { isAuthenticated, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { ValidationError } from '../utils/ApiError';
import { predictiveAnalyticsService } from '../services/analytics/PredictiveAnalyticsService';
import logger from '../utils/logger';

const router = Router();

// Validation schemas
const patientRiskSchema = z.object({
  patientId: z.string(),
});

const noShowPredictionSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

const revenueForecastSchema = z.object({
  periodType: z.enum(['week', 'month', 'quarter']),
  periodsAhead: z.number().int().min(1).max(12).default(3),
});

const inventoryForecastSchema = z.object({
  lookAheadDays: z.number().int().min(7).max(90).default(30),
});

/**
 * POST /api/predictive-analytics/patient-risk
 * Calculate risk scores for a patient
 */
router.post(
  '/patient-risk',
  isAuthenticated,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const validationResult = patientRiskSchema.safeParse(req.body);

    if (!validationResult.success) {
      throw new ValidationError('Invalid request data', validationResult.error.errors);
    }

    const { patientId } = validationResult.data;
    const companyId = req.user!.companyId!;

    const riskProfile = await predictiveAnalyticsService.calculatePatientRiskScores(
      patientId,
      companyId
    );

    logger.info('Patient risk profile calculated', {
      patientId,
      companyId,
      overallRisk: riskProfile.overallRisk,
    });

    res.json({
      success: true,
      riskProfile,
    });
  })
);

/**
 * GET /api/predictive-analytics/high-risk-patients
 * Get all high-risk patients for proactive care
 */
router.get(
  '/high-risk-patients',
  isAuthenticated,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const companyId = req.user!.companyId!;

    // TODO: Implement batch risk calculation for all patients
    // For now, return empty array with structure

    logger.info('High-risk patients requested', { companyId });

    res.json({
      success: true,
      highRiskPatients: [],
      message: 'Feature requires batch processing - implement with background job',
    });
  })
);

/**
 * POST /api/predictive-analytics/no-show-predictions
 * Predict no-shows for upcoming appointments
 */
router.post(
  '/no-show-predictions',
  isAuthenticated,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const validationResult = noShowPredictionSchema.safeParse(req.body);

    if (!validationResult.success) {
      throw new ValidationError('Invalid date range', validationResult.error.errors);
    }

    const { startDate, endDate } = validationResult.data;
    const companyId = req.user!.companyId!;

    const predictions = await predictiveAnalyticsService.predictNoShows(
      companyId,
      new Date(startDate),
      new Date(endDate)
    );

    const highRiskCount = predictions.filter(p => p.riskLevel === 'high').length;
    const mediumRiskCount = predictions.filter(p => p.riskLevel === 'medium').length;

    logger.info('No-show predictions generated', {
      companyId,
      totalPredictions: predictions.length,
      highRisk: highRiskCount,
      mediumRisk: mediumRiskCount,
    });

    res.json({
      success: true,
      predictions,
      summary: {
        total: predictions.length,
        highRisk: highRiskCount,
        mediumRisk: mediumRiskCount,
        lowRisk: predictions.length - highRiskCount - mediumRiskCount,
      },
    });
  })
);

/**
 * POST /api/predictive-analytics/revenue-forecast
 * Forecast revenue for upcoming periods
 */
router.post(
  '/revenue-forecast',
  isAuthenticated,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const validationResult = revenueForecastSchema.safeParse(req.body);

    if (!validationResult.success) {
      throw new ValidationError('Invalid forecast parameters', validationResult.error.errors);
    }

    const { periodType, periodsAhead } = validationResult.data;
    const companyId = req.user!.companyId!;

    const projections = await predictiveAnalyticsService.forecastRevenue(
      companyId,
      periodType,
      periodsAhead
    );

    logger.info('Revenue forecast generated', {
      companyId,
      periodType,
      periodsAhead,
      firstProjection: projections[0]?.projectedRevenue,
    });

    res.json({
      success: true,
      projections,
      metadata: {
        periodType,
        periodsAhead,
        generatedAt: new Date().toISOString(),
      },
    });
  })
);

/**
 * POST /api/predictive-analytics/inventory-forecast
 * Predict inventory needs and stockouts
 */
router.post(
  '/inventory-forecast',
  isAuthenticated,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const validationResult = inventoryForecastSchema.safeParse(req.body);

    if (!validationResult.success) {
      throw new ValidationError('Invalid forecast parameters', validationResult.error.errors);
    }

    const { lookAheadDays } = validationResult.data;
    const companyId = req.user!.companyId!;

    const forecasts = await predictiveAnalyticsService.forecastInventoryDemand(
      companyId,
      lookAheadDays
    );

    const urgentCount = forecasts.filter(f => f.daysUntilStockout < 7).length;
    const totalReorderValue = forecasts.reduce((sum, f) => sum + f.reorderQuantity, 0);

    logger.info('Inventory forecast generated', {
      companyId,
      lookAheadDays,
      reorderItems: forecasts.length,
      urgentItems: urgentCount,
    });

    res.json({
      success: true,
      forecasts,
      summary: {
        totalItems: forecasts.length,
        urgentReorders: urgentCount,
        totalReorderQuantity: totalReorderValue,
      },
    });
  })
);

/**
 * GET /api/predictive-analytics/dashboard
 * Get all predictions for main dashboard
 */
router.get(
  '/dashboard',
  isAuthenticated,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const companyId = req.user!.companyId!;

    // Get predictions for next 7 days
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);

    const [noShowPredictions, revenueForecast, inventoryForecast] = await Promise.all([
      predictiveAnalyticsService.predictNoShows(companyId, startDate, endDate),
      predictiveAnalyticsService.forecastRevenue(companyId, 'week', 4),
      predictiveAnalyticsService.forecastInventoryDemand(companyId, 30),
    ]);

    // Calculate summary metrics
    const highRiskNoShows = noShowPredictions.filter(p => p.riskLevel === 'high').length;
    const urgentInventory = inventoryForecast.filter(f => f.daysUntilStockout < 7).length;

    logger.info('Predictive dashboard data fetched', {
      companyId,
      noShowPredictions: noShowPredictions.length,
      highRiskNoShows,
      urgentInventory,
    });

    res.json({
      success: true,
      dashboard: {
        noShowPredictions: {
          total: noShowPredictions.length,
          highRisk: highRiskNoShows,
          predictions: noShowPredictions.slice(0, 10), // Top 10
        },
        revenueForecast: {
          projections: revenueForecast,
        },
        inventoryForecast: {
          total: inventoryForecast.length,
          urgent: urgentInventory,
          forecasts: inventoryForecast.slice(0, 10), // Top 10 urgent
        },
      },
      generatedAt: new Date().toISOString(),
    });
  })
);

export default router;
