/**
 * SaaS Metrics API Routes
 * 
 * Endpoints for tracking and retrieving SaaS-specific business metrics:
 * - MRR, ARR, CAC, CLV calculations
 * - Customer health scores
 * - Churn predictions and risk analysis
 * - Feature usage and adoption tracking
 * - Cohort analysis and retention curves
 * - Billing and revenue metrics
 */

import { Router } from 'express';
import { authenticateUser } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import SaaSMetricsService from '../services/SaaS/SaaSMetricsService';
import ChurnPredictionService from '../services/SaaS/ChurnPredictionService';
import FeatureUsageService from '../services/SaaS/FeatureUsageService';
import CustomerHealthService from '../services/SaaS/CustomerHealthService';
import CohortAnalysisService from '../services/SaaS/CohortAnalysisService';
import BillingService from '../services/SaaS/BillingService';

const router = Router();

// ============ SaaS Metrics ==============

/**
 * GET /api/saas/metrics/summary
 * Get comprehensive SaaS health metrics for a company
 */
router.get(
  '/metrics/summary',
  authenticateUser,
  asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;

    const metrics = await SaaSMetricsService.getComprehensiveSaaSMetrics(companyId);
    const healthStatus = await SaaSMetricsService.getSaaSHealthStatus(companyId);

    res.json({
      success: true,
      data: {
        metrics,
        healthStatus,
      },
    });
  })
);

/**
 * GET /api/saas/metrics/mrr
 * Get Monthly Recurring Revenue
 */
router.get(
  '/metrics/mrr',
  authenticateUser,
  asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const month = req.query.month as string | undefined;

    const mrr = await SaaSMetricsService.calculateMRR(companyId);

    res.json({
      success: true,
      data: mrr,
    });
  })
);

/**
 * GET /api/saas/metrics/cac
 * Get Customer Acquisition Cost
 */
router.get(
  '/metrics/cac',
  authenticateUser,
  asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const period = (req.query.period as 'month' | 'quarter' | 'year') || 'month';

    const cac = await SaaSMetricsService.calculateCAC(companyId, period);

    res.json({
      success: true,
      data: cac,
    });
  })
);

/**
 * GET /api/saas/metrics/clv
 * Get Customer Lifetime Value
 */
router.get(
  '/metrics/clv',
  authenticateUser,
  asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;

    const clv = await SaaSMetricsService.calculateCLV(companyId);

    res.json({
      success: true,
      data: clv,
    });
  })
);

/**
 * GET /api/saas/metrics/churn
 * Get churn metrics
 */
router.get(
  '/metrics/churn',
  authenticateUser,
  asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;

    const churn = await SaaSMetricsService.calculateChurn(companyId);

    res.json({
      success: true,
      data: churn,
    });
  })
);

/**
 * GET /api/saas/metrics/nrr
 * Get Net Revenue Retention
 */
router.get(
  '/metrics/nrr',
  authenticateUser,
  asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;

    const nrr = await SaaSMetricsService.calculateNRR(companyId);

    res.json({
      success: true,
      data: nrr,
    });
  })
);

// ============ Customer Health ==============

/**
 * GET /api/saas/health/score/:companyId
 * Get customer health score
 */
router.get(
  '/health/score/:companyId',
  authenticateUser,
  asyncHandler(async (req, res) => {
    const targetCompanyId = req.params.companyId;
    // TODO: Verify user has permission to view this company's data

    const healthScore = await CustomerHealthService.calculateHealthScore(targetCompanyId);

    res.json({
      success: true,
      data: healthScore,
    });
  })
);

/**
 * GET /api/saas/health/segmentation
 * Get customer health segmentation
 */
router.get(
  '/health/segmentation',
  authenticateUser,
  asyncHandler(async (req, res) => {
    const segmentation = await CustomerHealthService.getHealthSegmentation();

    res.json({
      success: true,
      data: segmentation,
    });
  })
);

// ============ Churn Prediction ==============

/**
 * GET /api/saas/churn/risk
 * Get churn risk prediction for company
 */
router.get(
  '/churn/risk',
  authenticateUser,
  asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;

    const prediction = await ChurnPredictionService.calculateChurnRisk(companyId);

    res.json({
      success: true,
      data: prediction,
    });
  })
);

/**
 * GET /api/saas/churn/report
 * Get churn report for all companies (admin only)
 */
router.get(
  '/churn/report',
  authenticateUser,
  asyncHandler(async (req, res) => {
    // TODO: Verify admin role
    const report = await ChurnPredictionService.generateChurnReport();

    res.json({
      success: true,
      data: report,
    });
  })
);

// ============ Feature Usage ==============

/**
 * POST /api/saas/features/track
 * Track feature usage event
 */
router.post(
  '/features/track',
  authenticateUser,
  asyncHandler(async (req, res) => {
    const { featureName, metadata } = req.body;
    const companyId = req.user.companyId;
    const userId = req.user.id;

    await FeatureUsageService.trackFeatureUsage(companyId, userId, featureName, metadata);

    res.json({
      success: true,
      message: 'Feature usage tracked',
    });
  })
);

/**
 * GET /api/saas/features/usage
 * Get company feature usage
 */
router.get(
  '/features/usage',
  authenticateUser,
  asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;

    const usage = await FeatureUsageService.getCompanyFeatureUsage(companyId);

    res.json({
      success: true,
      data: usage,
    });
  })
);

/**
 * GET /api/saas/features/adoption-report
 * Get adoption report
 */
router.get(
  '/features/adoption-report',
  authenticateUser,
  asyncHandler(async (req, res) => {
    // TODO: Verify admin role
    const report = await FeatureUsageService.generateAdoptionReport();

    res.json({
      success: true,
      data: report,
    });
  })
);

// ============ Cohort Analysis ==============

/**
 * GET /api/saas/cohorts/dashboard
 * Get cohort analysis dashboard
 */
router.get(
  '/cohorts/dashboard',
  authenticateUser,
  asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;

    const dashboard = await CohortAnalysisService.generateCohortDashboard(companyId);

    res.json({
      success: true,
      data: dashboard,
    });
  })
);

/**
 * GET /api/saas/cohorts/retention-by-tier
 * Get retention analysis by pricing tier
 */
router.get(
  '/cohorts/retention-by-tier',
  authenticateUser,
  asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;

    const retention = await CohortAnalysisService.analyzeRetentionByTier(companyId);

    res.json({
      success: true,
      data: retention,
    });
  })
);

/**
 * GET /api/saas/cohorts/retention-by-source
 * Get retention by acquisition source
 */
router.get(
  '/cohorts/retention-by-source',
  authenticateUser,
  asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const source = (req.query.source as string) || 'all';

    const retention = await CohortAnalysisService.analyzeRetentionBySource(
      companyId,
      source
    );

    res.json({
      success: true,
      data: retention,
    });
  })
);

// ============ Billing ==============

/**
 * GET /api/saas/billing/mrr
 * Get MRR for accounting
 */
router.get(
  '/billing/mrr',
  authenticateUser,
  asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const month = (req.query.month as string) || new Date().toISOString().substring(0, 7);

    const mrr = await BillingService.calculateMonthlyRecurringRevenue(companyId, month);

    res.json({
      success: true,
      data: mrr,
    });
  })
);

/**
 * GET /api/saas/billing/report
 * Get billing report
 */
router.get(
  '/billing/report',
  authenticateUser,
  asyncHandler(async (req, res) => {
    const month = (req.query.month as string) || new Date().toISOString().substring(0, 7);

    // TODO: Verify admin role
    const report = await BillingService.generateBillingReport(month);

    res.json({
      success: true,
      data: report,
    });
  })
);

export const saasMetricsRouter = router;
