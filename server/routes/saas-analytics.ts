/**
 * SaaS Analytics Routes
 * 
 * Provides API endpoints for:
 * - Customer health scores
 * - Churn predictions
 * - Feature usage analytics
 * - Billing and MRR reports
 * - Cohort analysis
 */

import express from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { isAuthenticated } from '../replitAuth';
import { CustomerHealthService } from '../services/SaaS/CustomerHealthService';
import { ChurnPredictionService } from '../services/SaaS/ChurnPredictionService';
import { FeatureUsageService } from '../services/SaaS/FeatureUsageService';
import { BillingService } from '../services/SaaS/BillingService';
import { CohortAnalysisService } from '../services/SaaS/CohortAnalysisService';
import logger from '../utils/logger';

const router = express.Router();

/**
 * GET /api/saas/health/:companyId
 * Get customer health score for a company
 */
router.get('/health/:companyId', isAuthenticated, asyncHandler(async (req, res) => {
  const { companyId } = req.params;
  
  logger.info(`[SaaS] Getting health score for company: ${companyId}`);
  
  const healthScore = await CustomerHealthService.calculateHealthScore(companyId);
  
  res.json({
    success: true,
    data: healthScore,
  });
}));

/**
 * GET /api/saas/health/segmentation
 * Get customer segmentation by health status
 */
router.get('/health/segmentation', isAuthenticated, asyncHandler(async (req, res) => {
  logger.info('[SaaS] Getting health segmentation');
  
  const segmentation = await CustomerHealthService.getHealthSegmentation();
  
  res.json({
    success: true,
    data: segmentation,
  });
}));

/**
 * GET /api/saas/churn/:companyId
 * Get churn prediction for a company
 */
router.get('/churn/:companyId', isAuthenticated, asyncHandler(async (req, res) => {
  const { companyId } = req.params;
  
  logger.info(`[SaaS] Getting churn prediction for company: ${companyId}`);
  
  const churnPrediction = await ChurnPredictionService.calculateChurnRisk(companyId);
  
  res.json({
    success: true,
    data: churnPrediction,
  });
}));

/**
 * GET /api/saas/churn/report
 * Get overall churn report across all companies
 */
router.get('/churn/report', isAuthenticated, asyncHandler(async (req, res) => {
  logger.info('[SaaS] Generating churn report');
  
  const report = await ChurnPredictionService.generateChurnReport();
  
  res.json({
    success: true,
    data: report,
  });
}));

/**
 * GET /api/saas/features/:companyId
 * Get feature usage for a company
 */
router.get('/features/:companyId', isAuthenticated, asyncHandler(async (req, res) => {
  const { companyId } = req.params;
  
  logger.info(`[SaaS] Getting feature usage for company: ${companyId}`);
  
  const featureUsage = await FeatureUsageService.getCompanyFeatureUsage(companyId);
  
  res.json({
    success: true,
    data: featureUsage,
  });
}));

/**
 * POST /api/saas/features/track
 * Track a feature usage event
 */
router.post('/features/track', isAuthenticated, asyncHandler(async (req, res) => {
  const { companyId, userId, featureName, metadata } = req.body;
  
  if (!companyId || !userId || !featureName) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: companyId, userId, featureName',
    });
  }
  
  await FeatureUsageService.trackFeatureUsage(companyId, userId, featureName, metadata);
  
  res.json({
    success: true,
    message: 'Feature usage tracked',
  });
}));

/**
 * GET /api/saas/features/adoption/report
 * Generate feature adoption report
 */
router.get('/features/adoption/report', isAuthenticated, asyncHandler(async (req, res) => {
  logger.info('[SaaS] Generating feature adoption report');
  
  const report = await FeatureUsageService.generateAdoptionReport();
  
  res.json({
    success: true,
    data: report,
  });
}));

/**
 * GET /api/saas/billing/mrr/:companyId
 * Get MRR for a company
 */
router.get('/billing/mrr/:companyId', isAuthenticated, asyncHandler(async (req, res) => {
  const { companyId } = req.params;
  const { month } = req.query;
  
  logger.info(`[SaaS] Getting MRR for company: ${companyId}, month: ${month}`);
  
  const mrr = await BillingService.calculateMonthlyRecurringRevenue(companyId, month as string);
  
  res.json({
    success: true,
    data: mrr,
  });
}));

/**
 * GET /api/saas/billing/report/:month
 * Generate billing report for a month
 */
router.get('/billing/report/:month', isAuthenticated, asyncHandler(async (req, res) => {
  const { month } = req.params;
  
  logger.info(`[SaaS] Generating billing report for month: ${month}`);
  
  const report = await BillingService.generateBillingReport(month);
  
  res.json({
    success: true,
    data: report,
  });
}));

/**
 * POST /api/saas/billing/invoice
 * Generate invoice for a subscription
 */
router.post('/billing/invoice', isAuthenticated, asyncHandler(async (req, res) => {
  const { companyId, subscriptionId, amount, taxRate } = req.body;
  
  if (!companyId || !subscriptionId || !amount) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: companyId, subscriptionId, amount',
    });
  }
  
  const invoice = await BillingService.generateInvoice(companyId, subscriptionId, amount, taxRate);
  
  res.json({
    success: true,
    data: invoice,
  });
}));

/**
 * POST /api/saas/billing/proration
 * Calculate proration for plan change
 */
router.post('/billing/proration', isAuthenticated, asyncHandler(async (req, res) => {
  const { currentPlan, newPlan, daysRemaining, totalDays } = req.body;
  
  if (!currentPlan || !newPlan || daysRemaining === undefined || !totalDays) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields',
    });
  }
  
  const proration = await BillingService.calculateProration(
    currentPlan,
    newPlan,
    daysRemaining,
    totalDays
  );
  
  res.json({
    success: true,
    data: proration,
  });
}));

/**
 * GET /api/saas/cohorts/dashboard/:companyId
 * Get cohort analysis dashboard
 */
router.get('/cohorts/dashboard/:companyId', isAuthenticated, asyncHandler(async (req, res) => {
  const { companyId } = req.params;
  
  logger.info(`[SaaS] Getting cohort dashboard for company: ${companyId}`);
  
  const dashboard = await CohortAnalysisService.generateCohortDashboard(companyId);
  
  res.json({
    success: true,
    data: dashboard,
  });
}));

/**
 * GET /api/saas/cohorts/retention/report
 * Generate retention report
 */
router.get('/cohorts/retention/report', isAuthenticated, asyncHandler(async (req, res) => {
  logger.info('[SaaS] Generating retention report');
  
  const report = await CohortAnalysisService.generateRetentionReport();
  
  res.json({
    success: true,
    data: report,
  });
}));

/**
 * GET /api/saas/dashboard/:companyId
 * Get complete SaaS dashboard data for a company
 */
router.get('/dashboard/:companyId', isAuthenticated, asyncHandler(async (req, res) => {
  const { companyId } = req.params;
  
  logger.info(`[SaaS] Getting complete dashboard for company: ${companyId}`);
  
  const [healthScore, churnPrediction, featureUsage, mrr] = await Promise.all([
    CustomerHealthService.calculateHealthScore(companyId),
    ChurnPredictionService.calculateChurnRisk(companyId),
    FeatureUsageService.getCompanyFeatureUsage(companyId),
    BillingService.calculateMonthlyRecurringRevenue(companyId),
  ]);
  
  res.json({
    success: true,
    data: {
      health: healthScore,
      churn: churnPrediction,
      features: featureUsage,
      billing: mrr,
      generatedAt: new Date(),
    },
  });
}));

export function registerSaaSRoutes(app: express.Application) {
  app.use('/api/saas', router);
  logger.info('SaaS Analytics routes registered');
}

export default router;
