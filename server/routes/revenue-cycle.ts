/**
 * Revenue Cycle Management Routes
 * API endpoints for automated billing and claims management
 */

import { Router, Response } from 'express';
import { z } from 'zod';
import { isAuthenticated, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { ValidationError } from '../utils/ApiError';
import { revenueCycleService } from '../services/billing/RevenueCycleService';
import logger from '../utils/logger';

const router = Router();

// Validation schemas
const verifyEligibilitySchema = z.object({
  patientId: z.string(),
  insuranceProvider: z.string(),
  policyNumber: z.string(),
});

const autoCodeSchema = z.object({
  clinicalNote: z.string().min(10),
});

const scrubClaimSchema = z.object({
  patientId: z.string(),
  providerId: z.string(),
  serviceDate: z.string().datetime(),
  diagnosisCodes: z.array(z.string()),
  procedureCodes: z.array(z.object({
    code: z.string(),
    description: z.string(),
    quantity: z.number().int().positive(),
    charge: z.number().positive(),
  })),
});

const submitClaimSchema = scrubClaimSchema.extend({
  id: z.string(),
  totalCharge: z.number().positive(),
  insurancePortion: z.number(),
  patientPortion: z.number(),
});

const analyzeDenialSchema = z.object({
  claimId: z.string(),
  denialCode: z.string(),
  denialReason: z.string(),
});

/**
 * POST /api/revenue-cycle/verify-eligibility
 * Verify insurance eligibility in real-time
 */
router.post(
  '/verify-eligibility',
  isAuthenticated,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const validationResult = verifyEligibilitySchema.safeParse(req.body);

    if (!validationResult.success) {
      throw new ValidationError('Invalid request data', validationResult.error.errors);
    }

    const { patientId, insuranceProvider, policyNumber } = validationResult.data;

    const eligibility = await revenueCycleService.verifyEligibility(
      patientId,
      insuranceProvider,
      policyNumber
    );

    logger.info('Insurance eligibility verified', {
      patientId,
      isActive: eligibility.isActive,
    });

    res.json({
      success: true,
      eligibility,
    });
  })
);

/**
 * POST /api/revenue-cycle/auto-code
 * Auto-code procedures from clinical notes
 */
router.post(
  '/auto-code',
  isAuthenticated,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const validationResult = autoCodeSchema.safeParse(req.body);

    if (!validationResult.success) {
      throw new ValidationError('Invalid clinical note', validationResult.error.errors);
    }

    const { clinicalNote } = validationResult.data;

    const codes = await revenueCycleService.autoCodeProcedures(clinicalNote);

    logger.info('Procedures auto-coded', {
      userId: req.user!.id,
      codesFound: codes.length,
    });

    res.json({
      success: true,
      codes,
      metadata: {
        codesFound: codes.length,
        averageConfidence: codes.reduce((sum, c) => sum + c.confidence, 0) / (codes.length || 1),
      },
    });
  })
);

/**
 * POST /api/revenue-cycle/scrub-claim
 * Validate claim before submission
 */
router.post(
  '/scrub-claim',
  isAuthenticated,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const validationResult = scrubClaimSchema.safeParse(req.body);

    if (!validationResult.success) {
      throw new ValidationError('Invalid claim data', validationResult.error.errors);
    }

    const claimData = validationResult.data;

    const scrubResult = await revenueCycleService.scrubClaim(claimData);

    logger.info('Claim scrubbed', {
      userId: req.user!.id,
      isValid: scrubResult.isValid,
      errorCount: scrubResult.errors.length,
      confidence: scrubResult.confidence,
    });

    res.json({
      success: true,
      result: scrubResult,
    });
  })
);

/**
 * POST /api/revenue-cycle/submit-claim
 * Submit claim electronically
 */
router.post(
  '/submit-claim',
  isAuthenticated,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const validationResult = submitClaimSchema.safeParse(req.body);

    if (!validationResult.success) {
      throw new ValidationError('Invalid claim data', validationResult.error.errors);
    }

    const claimData = {
      ...validationResult.data,
      serviceDate: new Date(validationResult.data.serviceDate),
      status: 'ready' as const,
      errors: [],
    };

    const result = await revenueCycleService.submitClaim(claimData);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
      });
    }

    logger.info('Claim submitted', {
      userId: req.user!.id,
      claimId: result.claimId,
      confirmationNumber: result.confirmationNumber,
    });

    res.json({
      success: true,
      claimId: result.claimId,
      confirmationNumber: result.confirmationNumber,
    });
  })
);

/**
 * GET /api/revenue-cycle/claim-status/:claimId
 * Track claim status
 */
router.get(
  '/claim-status/:claimId',
  isAuthenticated,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { claimId } = req.params;

    const status = await revenueCycleService.trackClaimStatus(claimId);

    logger.info('Claim status retrieved', {
      userId: req.user!.id,
      claimId,
      status: status.status,
    });

    res.json({
      success: true,
      claimId,
      ...status,
    });
  })
);

/**
 * POST /api/revenue-cycle/analyze-denial
 * Analyze denial and get appeal strategy
 */
router.post(
  '/analyze-denial',
  isAuthenticated,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const validationResult = analyzeDenialSchema.safeParse(req.body);

    if (!validationResult.success) {
      throw new ValidationError('Invalid denial data', validationResult.error.errors);
    }

    const { claimId, denialCode, denialReason } = validationResult.data;

    const analysis = await revenueCycleService.analyzeDenial(
      claimId,
      denialCode,
      denialReason
    );

    logger.info('Denial analyzed', {
      userId: req.user!.id,
      claimId,
      category: analysis.category,
      appealWorthiness: analysis.appealWorthiness,
    });

    res.json({
      success: true,
      analysis,
    });
  })
);

/**
 * GET /api/revenue-cycle/metrics
 * Get RCM performance metrics
 */
router.get(
  '/metrics',
  isAuthenticated,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const companyId = req.user!.companyId!;
    
    // Default to last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const metrics = await revenueCycleService.calculateMetrics(
      companyId,
      startDate,
      endDate
    );

    logger.info('RCM metrics retrieved', {
      userId: req.user!.id,
      companyId,
      denialRate: metrics.denialRate,
    });

    res.json({
      success: true,
      metrics,
      period: {
        startDate,
        endDate,
      },
    });
  })
);

export default router;
