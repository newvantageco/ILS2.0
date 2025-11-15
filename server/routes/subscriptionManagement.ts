/**
 * Subscription Management & Reporting Routes
 * 
 * Endpoints for:
 * - Plan upgrades/downgrades
 * - Trial-to-paid conversions
 * - Pause/resume subscriptions
 * - Generate reports (executive, detailed, board, forecast)
 * - Export reports (PDF, CSV, JSON)
 */

import { Router } from 'express';
import { authenticateUser } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { SubscriptionManagementService } from '../services/SaaS/SubscriptionManagementService.js';
import { SaaSReportingService } from '../services/SaaS/SaaSReportingService.js';
import { NotFoundError, UnauthorizedError, BadRequestError } from '../utils/ApiError.js';

const router = Router();

// ============================================================================
// SUBSCRIPTION MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * POST /api/saas/subscriptions/:companyId/upgrade
 * Upgrade subscription to higher tier
 */
router.post(
  '/subscriptions/:companyId/upgrade',
  authenticateUser,
  asyncHandler(async (req, res) => {
    const { companyId } = req.params;
    const { currentPlanId, newPlanId, prorationMode = 'immediate' } = req.body;

    // Authorization: User must be in the company or be platform admin
    if (
      req.user!.companyId !== companyId &&
      req.user!.role !== 'platform_admin'
    ) {
      throw new UnauthorizedError();
    }

    // Validate input
    if (!currentPlanId || !newPlanId) {
      throw new BadRequestError('currentPlanId and newPlanId are required');
    }

    const result = await SubscriptionManagementService.upgradeSubscription({
      companyId,
      currentPlanId,
      newPlanId,
      prorationMode: prorationMode as 'immediate' | 'next_billing_cycle',
    });

    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * POST /api/saas/subscriptions/:companyId/downgrade
 * Downgrade subscription to lower tier
 */
router.post(
  '/subscriptions/:companyId/downgrade',
  authenticateUser,
  asyncHandler(async (req, res) => {
    const { companyId } = req.params;
    const { currentPlanId, newPlanId, reason, prorationMode = 'immediate' } = req.body;

    // Authorization
    if (
      req.user!.companyId !== companyId &&
      req.user!.role !== 'platform_admin'
    ) {
      throw new UnauthorizedError();
    }

    // Validate input
    if (!currentPlanId || !newPlanId) {
      throw new BadRequestError('currentPlanId and newPlanId are required');
    }

    const result = await SubscriptionManagementService.downgradeSubscription({
      companyId,
      currentPlanId,
      newPlanId,
      reason,
      prorationMode: prorationMode as 'immediate' | 'next_billing_cycle',
    });

    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * POST /api/saas/subscriptions/:companyId/convert-trial
 * Convert trial subscription to paid
 */
router.post(
  '/subscriptions/:companyId/convert-trial',
  authenticateUser,
  asyncHandler(async (req, res) => {
    const { companyId } = req.params;
    const { planId, billingInterval = 'monthly' } = req.body;

    // Authorization
    if (
      req.user!.companyId !== companyId &&
      req.user!.role !== 'platform_admin'
    ) {
      throw new UnauthorizedError();
    }

    // Validate input
    if (!planId) {
      throw new BadRequestError('planId is required');
    }

    if (!['monthly', 'annual'].includes(billingInterval)) {
      throw new BadRequestError('billingInterval must be "monthly" or "annual"');
    }

    const result = await SubscriptionManagementService.convertTrialToPaid({
      companyId,
      planId,
      billingInterval: billingInterval as 'monthly' | 'annual',
    });

    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * POST /api/saas/subscriptions/:companyId/pause
 * Pause an active subscription
 */
router.post(
  '/subscriptions/:companyId/pause',
  authenticateUser,
  asyncHandler(async (req, res) => {
    const { companyId } = req.params;
    const { pauseEndDate, reason } = req.body;

    // Authorization
    if (
      req.user!.companyId !== companyId &&
      req.user!.role !== 'platform_admin'
    ) {
      throw new UnauthorizedError();
    }

    await SubscriptionManagementService.pauseSubscription({
      companyId,
      pauseEndDate,
      reason,
    });

    res.json({
      success: true,
      message: 'Subscription paused successfully',
    });
  })
);

/**
 * POST /api/saas/subscriptions/:companyId/resume
 * Resume a paused subscription
 */
router.post(
  '/subscriptions/:companyId/resume',
  authenticateUser,
  asyncHandler(async (req, res) => {
    const { companyId } = req.params;

    // Authorization
    if (
      req.user!.companyId !== companyId &&
      req.user!.role !== 'platform_admin'
    ) {
      throw new UnauthorizedError();
    }

    await SubscriptionManagementService.resumeSubscription(companyId);

    res.json({
      success: true,
      message: 'Subscription resumed successfully',
    });
  })
);

/**
 * POST /api/saas/subscriptions/:companyId/schedule-renewal
 * Schedule subscription renewal
 */
router.post(
  '/subscriptions/:companyId/schedule-renewal',
  authenticateUser,
  asyncHandler(async (req, res) => {
    const { companyId } = req.params;
    const { renewalDate, autoRenew = true } = req.body;

    // Authorization
    if (
      req.user!.companyId !== companyId &&
      req.user!.role !== 'platform_admin'
    ) {
      throw new UnauthorizedError();
    }

    // Validate input
    if (!renewalDate) {
      throw new BadRequestError('renewalDate is required (ISO date format)');
    }

    await SubscriptionManagementService.scheduleRenewal({
      companyId,
      renewalDate,
      autoRenew,
    });

    res.json({
      success: true,
      message: 'Renewal scheduled successfully',
    });
  })
);

// ============================================================================
// REPORTING ENDPOINTS
// ============================================================================

/**
 * GET /api/saas/reports/executive
 * Generate executive-level report
 * Query params: companyId, startDate, endDate, format (pdf|csv|json)
 */
router.get(
  '/reports/executive',
  authenticateUser,
  asyncHandler(async (req, res) => {
    const { companyId, startDate, endDate, format = 'json' } = req.query;

    // Authorization: Can only view own company report or platform-wide if admin
    if (
      companyId &&
      req.user!.companyId !== companyId &&
      req.user!.role !== 'platform_admin'
    ) {
      throw new UnauthorizedError();
    }

    // Validate dates
    if (!startDate || !endDate) {
      throw new BadRequestError('startDate and endDate are required');
    }

    const report = await SaaSReportingService.generateExecutiveReport({
      companyId: companyId as string | undefined,
      reportType: 'executive',
      startDate: startDate as string,
      endDate: endDate as string,
      format: format as 'pdf' | 'csv' | 'json',
    });

    // Return based on format
    if (format === 'json') {
      res.json({ success: true, data: report });
    } else if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="executive-report.csv"');
      res.send('Company,MRR,ARR,NRR,Churn Rate\n'); // CSV header
    } else if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="executive-report.pdf"');
      // In production, would use PDFKit to generate PDF
      res.send(JSON.stringify(report));
    }
  })
);

/**
 * GET /api/saas/reports/detailed
 * Generate detailed customer-level report
 * Query params: companyId, startDate, endDate, format (csv|json)
 */
router.get(
  '/reports/detailed',
  authenticateUser,
  asyncHandler(async (req, res) => {
    const { companyId, startDate, endDate, format = 'json' } = req.query;

    // Authorization
    if (
      companyId &&
      req.user!.companyId !== companyId &&
      req.user!.role !== 'platform_admin'
    ) {
      throw new UnauthorizedError();
    }

    // Validate dates
    if (!startDate || !endDate) {
      throw new BadRequestError('startDate and endDate are required');
    }

    const report = await SaaSReportingService.generateDetailedReport({
      companyId: companyId as string | undefined,
      reportType: 'detailed',
      startDate: startDate as string,
      endDate: endDate as string,
      format: format as 'pdf' | 'csv' | 'json',
    });

    // Return based on format
    if (format === 'csv') {
      const csv = await SaaSReportingService.generateDetailedReportAsCSV(report);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="detailed-report.csv"');
      res.send(csv);
    } else {
      res.json({ success: true, data: report });
    }
  })
);

/**
 * GET /api/saas/reports/board
 * Generate board-level strategic report
 * Query params: companyId, startDate, endDate, format (pdf|json)
 */
router.get(
  '/reports/board',
  authenticateUser,
  asyncHandler(async (req, res) => {
    const { companyId, startDate, endDate, format = 'json' } = req.query;

    // Authorization: Only platform admin or company admin can access
    if (req.user!.role !== 'platform_admin' && req.user!.role !== 'company_admin') {
      throw new UnauthorizedError();
    }

    if (
      companyId &&
      req.user!.companyId !== companyId &&
      req.user!.role !== 'platform_admin'
    ) {
      throw new UnauthorizedError();
    }

    // Validate dates
    if (!startDate || !endDate) {
      throw new BadRequestError('startDate and endDate are required');
    }

    const report = await SaaSReportingService.generateBoardReport({
      companyId: companyId as string | undefined,
      reportType: 'board',
      startDate: startDate as string,
      endDate: endDate as string,
      format: format as 'pdf' | 'csv' | 'json',
    });

    if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="board-report.pdf"');
      // In production, would use PDFKit
      res.send(JSON.stringify(report));
    } else {
      res.json({ success: true, data: report });
    }
  })
);

/**
 * GET /api/saas/reports/forecast
 * Generate revenue forecast report
 * Query params: companyId, startDate, endDate
 */
router.get(
  '/reports/forecast',
  authenticateUser,
  asyncHandler(async (req, res) => {
    const { companyId, startDate, endDate } = req.query;

    // Authorization
    if (
      companyId &&
      req.user!.companyId !== companyId &&
      req.user!.role !== 'platform_admin'
    ) {
      throw new UnauthorizedError();
    }

    // Validate dates
    if (!startDate || !endDate) {
      throw new BadRequestError('startDate and endDate are required');
    }

    const report = await SaaSReportingService.generateForecastReport({
      companyId: companyId as string | undefined,
      reportType: 'forecast',
      startDate: startDate as string,
      endDate: endDate as string,
      format: 'json',
    });

    res.json({ success: true, data: report });
  })
);

export default router;
