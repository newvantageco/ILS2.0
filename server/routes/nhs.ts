/**
 * NHS/PCSE API Routes
 *
 * Endpoints for NHS claims, vouchers, exemptions, and practitioners.
 *
 * Routes:
 * - POST   /api/nhs/claims/create
 * - POST   /api/nhs/claims/:id/submit
 * - GET    /api/nhs/claims/:id
 * - GET    /api/nhs/claims
 * - GET    /api/nhs/claims/patient/:patientId
 * - GET    /api/nhs/claims/summary
 * - POST   /api/nhs/claims/batch-submit
 * - DELETE /api/nhs/claims/:id
 *
 * - POST   /api/nhs/vouchers/check-eligibility
 * - POST   /api/nhs/vouchers/calculate
 * - POST   /api/nhs/vouchers/create
 * - POST   /api/nhs/vouchers/:id/redeem
 * - GET    /api/nhs/vouchers/:id
 * - GET    /api/nhs/vouchers/patient/:patientId
 * - GET    /api/nhs/vouchers/statistics
 *
 * - POST   /api/nhs/exemptions/check
 * - POST   /api/nhs/exemptions/auto-detect
 * - POST   /api/nhs/exemptions/create
 * - POST   /api/nhs/exemptions/:id/verify
 * - GET    /api/nhs/exemptions/patient/:patientId
 * - GET    /api/nhs/exemptions/expiring
 * - GET    /api/nhs/exemptions/statistics
 */

import express, { Request, Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { NhsClaimsService } from "../services/NhsClaimsService.js";
import { NhsVoucherService } from "../services/NhsVoucherService.js";
import { NhsExemptionService } from "../services/NhsExemptionService.js";
import {
  createNhsClaimSchema,
  createNhsVoucherSchema,
} from "../../shared/schema.js";
import { createLogger } from "../utils/logger.js";

// Type definitions for authenticated requests
interface AuthenticatedUser {
  id: string;
  companyId: string;
  claims?: {
    sub?: string;
  };
}

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

const router = express.Router();
const logger = createLogger('nhs');

// ============== NHS CLAIMS ROUTES ==============

/**
 * POST /api/nhs/claims/create
 * Create a new NHS GOS claim
 */
router.post("/claims/create", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const companyId = user.companyId;

    // Validate request body
    const validatedData = createNhsClaimSchema.parse({
      ...req.body,
      companyId,
    });

    const claim = await NhsClaimsService.createClaim(validatedData);

    res.json(claim);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error({ error: errorMessage }, 'Create NHS claim error');
    res.status(400).json({ error: error.message || "Failed to create claim" });
  }
});

/**
 * POST /api/nhs/claims/:id/submit
 * Submit claim to PCSE
 */
router.post("/claims/:id/submit", requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as AuthenticatedRequest).user;

    const claim = await NhsClaimsService.submitClaim({
      claimId: id,
      submittedBy: user.id,
    });

    res.json(claim);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error({ error: errorMessage, claimId: req.params.id }, 'Submit NHS claim error');
    res.status(400).json({ error: error.message || "Failed to submit claim" });
  }
});

/**
 * GET /api/nhs/claims/:id
 * Get claim by ID
 */
router.get("/claims/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as AuthenticatedRequest).user;
    const companyId = user.companyId;

    const claim = await NhsClaimsService.getClaimById(id, companyId);

    if (!claim) {
      return res.status(404).json({ error: "Claim not found" });
    }

    res.json(claim);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error({ error: errorMessage, claimId: req.params.id }, 'Get NHS claim error');
    res.status(500).json({ error: error.message || "Failed to get claim" });
  }
});

/**
 * GET /api/nhs/claims
 * Get company claims with filters
 */
router.get("/claims", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const companyId = user.companyId;

    const { status, startDate, endDate, limit, offset } = req.query;

    const claims = await NhsClaimsService.getCompanyClaims(companyId, {
      status: status as string,
      startDate: startDate as string,
      endDate: endDate as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });

    res.json(claims);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error({ error: errorMessage }, 'Get NHS claims error');
    res.status(500).json({ error: error.message || "Failed to get claims" });
  }
});

/**
 * GET /api/nhs/claims/patient/:patientId
 * Get patient claims
 */
router.get("/claims/patient/:patientId", requireAuth, async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const user = (req as AuthenticatedRequest).user;
    const companyId = user.companyId;

    const claims = await NhsClaimsService.getPatientClaims(patientId, companyId);

    res.json(claims);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error({ error: errorMessage, patientId: req.params.patientId }, 'Get patient claims error');
    res.status(500).json({ error: error.message || "Failed to get patient claims" });
  }
});

/**
 * GET /api/nhs/claims/summary
 * Get claims summary statistics
 */
router.get("/claims/summary", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const companyId = user.companyId;

    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: "Start date and end date are required" });
    }

    const summary = await NhsClaimsService.getClaimsSummary(
      companyId,
      startDate as string,
      endDate as string
    );

    res.json(summary);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error({ error: errorMessage }, 'Get claims summary error');
    res.status(500).json({ error: error.message || "Failed to get claims summary" });
  }
});

/**
 * POST /api/nhs/claims/batch-submit
 * Submit multiple claims at once
 */
router.post("/claims/batch-submit", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const companyId = user.companyId;
    const { claimIds } = req.body;

    if (!Array.isArray(claimIds) || claimIds.length === 0) {
      return res.status(400).json({ error: "Claim IDs array is required" });
    }

    const results = await NhsClaimsService.batchSubmitClaims(claimIds, user.id, companyId);

    res.json(results);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const claimIds = req.body.claimIds;
    logger.error({ error: errorMessage, claimCount: claimIds?.length }, 'Batch submit claims error');
    res.status(500).json({ error: error.message || "Failed to batch submit claims" });
  }
});

/**
 * DELETE /api/nhs/claims/:id
 * Delete draft claim (soft delete for healthcare compliance)
 */
router.delete("/claims/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as AuthenticatedRequest).user;
    const companyId = user.companyId;
    const userId = user.id || user.claims?.sub;

    await NhsClaimsService.deleteClaim(id, companyId, userId);

    res.json({
      message: "Claim deleted successfully",
      note: "Data has been soft-deleted and can be recovered if needed"
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error({ error: errorMessage, claimId: req.params.id }, 'Delete claim error');
    res.status(400).json({ error: error.message || "Failed to delete claim" });
  }
});

// ============== NHS VOUCHERS ROUTES ==============

/**
 * POST /api/nhs/vouchers/check-eligibility
 * Check if patient is eligible for NHS voucher
 */
router.post("/vouchers/check-eligibility", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const companyId = user.companyId;

    const { patientId, dateOfBirth, isStudent } = req.body;

    const eligibility = await NhsVoucherService.checkEligibility({
      patientId,
      companyId,
      dateOfBirth,
      isStudent,
    });

    res.json(eligibility);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error({ error: errorMessage, patientId: req.body.patientId }, 'Check voucher eligibility error');
    res.status(500).json({ error: error.message || "Failed to check eligibility" });
  }
});

/**
 * POST /api/nhs/vouchers/calculate
 * Calculate appropriate voucher type for prescription
 */
router.post("/vouchers/calculate", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const companyId = user.companyId;

    const { prescriptionId, patientId, exemptionReason, requiresTint, requiresMedicalTint } =
      req.body;

    const calculation = await NhsVoucherService.calculateVoucherType({
      prescriptionId,
      companyId,
      patientId,
      exemptionReason,
      requiresTint,
      requiresMedicalTint,
    });

    res.json(calculation);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const { prescriptionId, patientId } = req.body;
    logger.error({ error: errorMessage, prescriptionId, patientId }, 'Calculate voucher error');
    res.status(500).json({ error: error.message || "Failed to calculate voucher" });
  }
});

/**
 * POST /api/nhs/vouchers/create
 * Create NHS voucher
 */
router.post("/vouchers/create", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const companyId = user.companyId;

    const validatedData = createNhsVoucherSchema.parse({
      ...req.body,
      companyId,
    });

    const voucher = await NhsVoucherService.createVoucher(validatedData);

    res.json(voucher);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error({ error: errorMessage }, 'Create voucher error');
    res.status(400).json({ error: error.message || "Failed to create voucher" });
  }
});

/**
 * POST /api/nhs/vouchers/:id/redeem
 * Redeem voucher
 */
router.post("/vouchers/:id/redeem", requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as AuthenticatedRequest).user;
    const companyId = user.companyId;

    const { redeemedAmount, patientContribution, hasComplexSupplement, supplementAmount, supplementReason } = req.body;

    const voucher = await NhsVoucherService.redeemVoucher(id, companyId, {
      redeemedAmount,
      patientContribution,
      hasComplexSupplement,
      supplementAmount,
      supplementReason,
    });

    res.json(voucher);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error({ error: errorMessage, voucherId: req.params.id }, 'Redeem voucher error');
    res.status(400).json({ error: error.message || "Failed to redeem voucher" });
  }
});

/**
 * GET /api/nhs/vouchers/:id
 * Get voucher by ID
 */
router.get("/vouchers/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as AuthenticatedRequest).user;
    const companyId = user.companyId;

    const voucher = await NhsVoucherService.getVoucherById(id, companyId);

    if (!voucher) {
      return res.status(404).json({ error: "Voucher not found" });
    }

    res.json(voucher);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error({ error: errorMessage, voucherId: req.params.id }, 'Get voucher error');
    res.status(500).json({ error: error.message || "Failed to get voucher" });
  }
});

/**
 * GET /api/nhs/vouchers/patient/:patientId
 * Get patient vouchers
 */
router.get("/vouchers/patient/:patientId", requireAuth, async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const user = (req as AuthenticatedRequest).user;
    const companyId = user.companyId;

    const vouchers = await NhsVoucherService.getPatientVouchers(patientId, companyId);

    res.json(vouchers);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error({ error: errorMessage, patientId: req.params.patientId }, 'Get patient vouchers error');
    res.status(500).json({ error: error.message || "Failed to get patient vouchers" });
  }
});

/**
 * GET /api/nhs/vouchers/statistics
 * Get voucher statistics
 */
router.get("/vouchers/statistics", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const companyId = user.companyId;

    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: "Start date and end date are required" });
    }

    const statistics = await NhsVoucherService.getVoucherStatistics(
      companyId,
      startDate as string,
      endDate as string
    );

    res.json(statistics);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error({ error: errorMessage }, 'Get voucher statistics error');
    res.status(500).json({ error: error.message || "Failed to get voucher statistics" });
  }
});

// ============== NHS EXEMPTIONS ROUTES ==============

/**
 * POST /api/nhs/exemptions/check
 * Check if patient has valid exemption
 */
router.post("/exemptions/check", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const companyId = user.companyId;

    const { patientId } = req.body;

    const exemption = await NhsExemptionService.checkExemption(patientId, companyId);

    res.json(exemption);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error({ error: errorMessage, patientId: req.body.patientId }, 'Check exemption error');
    res.status(500).json({ error: error.message || "Failed to check exemption" });
  }
});

/**
 * POST /api/nhs/exemptions/auto-detect
 * Auto-detect exemptions based on patient data
 */
router.post("/exemptions/auto-detect", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const companyId = user.companyId;

    const { patientId } = req.body;

    const detected = await NhsExemptionService.autoDetectExemptions(patientId, companyId);

    res.json(detected);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error({ error: errorMessage, patientId: req.body.patientId }, 'Auto-detect exemptions error');
    res.status(500).json({ error: error.message || "Failed to auto-detect exemptions" });
  }
});

/**
 * POST /api/nhs/exemptions/create
 * Create exemption record
 */
router.post("/exemptions/create", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const companyId = user.companyId;

    const exemption = await NhsExemptionService.createExemption({
      ...req.body,
      companyId,
    });

    res.json(exemption);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error({ error: errorMessage }, 'Create exemption error');
    res.status(400).json({ error: error.message || "Failed to create exemption" });
  }
});

/**
 * POST /api/nhs/exemptions/:id/verify
 * Verify exemption
 */
router.post("/exemptions/:id/verify", requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as AuthenticatedRequest).user;

    const exemption = await NhsExemptionService.verifyExemption({
      exemptionId: id,
      verifiedBy: user.id,
    });

    res.json(exemption);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error({ error: errorMessage, exemptionId: req.params.id }, 'Verify exemption error');
    res.status(500).json({ error: error.message || "Failed to verify exemption" });
  }
});

/**
 * GET /api/nhs/exemptions/patient/:patientId
 * Get patient exemptions
 */
router.get("/exemptions/patient/:patientId", requireAuth, async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const user = (req as AuthenticatedRequest).user;
    const companyId = user.companyId;

    const exemptions = await NhsExemptionService.getPatientExemptions(patientId, companyId);

    res.json(exemptions);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error({ error: errorMessage, patientId: req.params.patientId }, 'Get patient exemptions error');
    res.status(500).json({ error: error.message || "Failed to get patient exemptions" });
  }
});

/**
 * GET /api/nhs/exemptions/expiring
 * Get exemptions expiring soon
 */
router.get("/exemptions/expiring", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const companyId = user.companyId;

    const { days } = req.query;
    const daysAhead = days ? parseInt(days as string) : 30;

    const exemptions = await NhsExemptionService.getExpiringExemptions(companyId, daysAhead);

    res.json(exemptions);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const days = req.query.days;
    const daysAhead = days ? parseInt(days as string) : 30;
    logger.error({ error: errorMessage, daysAhead }, 'Get expiring exemptions error');
    res.status(500).json({ error: error.message || "Failed to get expiring exemptions" });
  }
});

/**
 * GET /api/nhs/exemptions/statistics
 * Get exemption statistics
 */
router.get("/exemptions/statistics", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const companyId = user.companyId;

    const statistics = await NhsExemptionService.getExemptionStatistics(companyId);

    res.json(statistics);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error({ error: errorMessage }, 'Get exemption statistics error');
    res.status(500).json({ error: error.message || "Failed to get exemption statistics" });
  }
});

export default router;
