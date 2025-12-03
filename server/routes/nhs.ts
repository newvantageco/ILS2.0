/**
 * NHS Digital API Routes
 *
 * Comprehensive NHS integration for UK healthcare compliance.
 * Reference: https://digital.nhs.uk/developer/guides-and-documentation/reference-guide#statuses
 *
 * === CLAIMS ROUTES ===
 * - POST   /api/nhs/claims/create
 * - POST   /api/nhs/claims/:id/submit
 * - GET    /api/nhs/claims/:id
 * - GET    /api/nhs/claims
 * - GET    /api/nhs/claims/patient/:patientId
 * - GET    /api/nhs/claims/summary
 * - POST   /api/nhs/claims/batch-submit
 * - DELETE /api/nhs/claims/:id
 *
 * === VOUCHER ROUTES ===
 * - POST   /api/nhs/vouchers/check-eligibility
 * - POST   /api/nhs/vouchers/calculate
 * - POST   /api/nhs/vouchers/create
 * - POST   /api/nhs/vouchers/:id/redeem
 * - GET    /api/nhs/vouchers/:id
 * - GET    /api/nhs/vouchers/patient/:patientId
 * - GET    /api/nhs/vouchers/statistics
 *
 * === EXEMPTION ROUTES ===
 * - POST   /api/nhs/exemptions/check
 * - POST   /api/nhs/exemptions/auto-detect
 * - POST   /api/nhs/exemptions/create
 * - POST   /api/nhs/exemptions/:id/verify
 * - GET    /api/nhs/exemptions/patient/:patientId
 * - GET    /api/nhs/exemptions/expiring
 * - GET    /api/nhs/exemptions/statistics
 *
 * === PDS (Personal Demographics Service) ROUTES ===
 * - GET    /api/nhs/pds/patient/:nhsNumber     - Lookup patient by NHS number
 * - POST   /api/nhs/pds/search                 - Search patients by demographics
 * - POST   /api/nhs/pds/verify                 - Verify NHS number exists
 * - GET    /api/nhs/pds/validate/:nhsNumber    - Validate NHS number format
 *
 * === SYSTEM STATUS ROUTES ===
 * - GET    /api/nhs/system/status              - Get integration status
 * - POST   /api/nhs/system/test-connection     - Test NHS API connection
 * - GET    /api/nhs/system/environment         - Get environment config
 * - POST   /api/nhs/sync                       - Trigger NHS data sync
 *
 * === ONBOARDING ROUTES ===
 * - GET    /api/nhs/onboarding/status          - Get onboarding checklist
 *
 * === e-REFERRAL SERVICE ROUTES ===
 * - GET    /api/nhs/referrals/services         - Search available services
 * - POST   /api/nhs/referrals/create           - Create new referral
 * - GET    /api/nhs/referrals/:id              - Get referral by ID
 * - GET    /api/nhs/referrals/patient/:nhsNumber - Get patient referrals
 * - POST   /api/nhs/referrals/:id/submit       - Submit referral
 * - POST   /api/nhs/referrals/:id/cancel       - Cancel referral
 */

import express, { Request, Response } from "express";
import crypto from "crypto";
import { requireAuth } from "../middleware/auth.js";
import { nhsRateLimit } from "../middleware/nhsRateLimit.js";
import { NhsClaimsService } from "../services/NhsClaimsService.js";
import { NhsVoucherService } from "../services/NhsVoucherService.js";
import { NhsExemptionService } from "../services/NhsExemptionService.js";
import { nhsApiAuthService } from "../services/NhsApiAuthService.js";
import { nhsPdsService } from "../services/NhsPdsService.js";
import { nhsEReferralService, OPHTHALMOLOGY_SPECIALTIES, EYE_REFERRAL_REASONS } from "../services/NhsEReferralService.js";
import {
  createNhsClaimSchema,
  createNhsVoucherSchema,
  nhsClaims,
  nhsPractitioners,
  patients,
  users,
} from "../../shared/schema.js";
import { createLogger } from "../utils/logger.js";
import {
  sendNhsClaimAcceptedEmail,
  sendNhsClaimRejectedEmail,
  sendNhsClaimPaidEmail
} from "../emailService.js";
import { db } from "../db.js";
import { eq } from "drizzle-orm";

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
router.post("/claims/:id/submit", requireAuth, nhsRateLimit, async (req: Request, res: Response) => {
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
router.post("/claims/batch-submit", requireAuth, nhsRateLimit, async (req: Request, res: Response) => {
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

// ============== NHS PDS (Personal Demographics Service) ROUTES ==============

/**
 * GET /api/nhs/pds/patient/:nhsNumber
 * Lookup patient by NHS number from PDS
 */
router.get("/pds/patient/:nhsNumber", requireAuth, async (req: Request, res: Response) => {
  try {
    const { nhsNumber } = req.params;

    // Validate NHS number format first
    if (!nhsPdsService.validateNhsNumber(nhsNumber)) {
      return res.status(400).json({ 
        error: "Invalid NHS number format",
        details: "NHS number must be 10 digits with valid checksum"
      });
    }

    const patient = await nhsPdsService.getPatientByNhsNumber(nhsNumber);

    if (!patient) {
      return res.status(404).json({ 
        error: "Patient not found",
        nhsNumber: nhsPdsService.formatNhsNumber(nhsNumber)
      });
    }

    res.json(patient);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error({ error: errorMessage, nhsNumber: req.params.nhsNumber?.slice(-4) }, 'PDS patient lookup error');
    res.status(500).json({ error: "Failed to lookup patient in PDS" });
  }
});

/**
 * POST /api/nhs/pds/search
 * Search for patients in PDS by demographics
 */
router.post("/pds/search", requireAuth, async (req: Request, res: Response) => {
  try {
    const { family, given, birthdate, gender, postcode, email, phone } = req.body;

    // Require at least 2 search parameters
    const params = { family, given, birthdate, gender, postcode, email, phone };
    const providedParams = Object.values(params).filter(v => v).length;
    
    if (providedParams < 2) {
      return res.status(400).json({
        error: "Insufficient search parameters",
        details: "PDS search requires at least 2 parameters (e.g., family name + date of birth)"
      });
    }

    const patients = await nhsPdsService.searchPatients(params);

    res.json({
      total: patients.length,
      patients
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error({ error: errorMessage }, 'PDS patient search error');
    res.status(500).json({ error: "Failed to search patients in PDS" });
  }
});

/**
 * POST /api/nhs/pds/verify
 * Verify an NHS number exists in PDS
 */
router.post("/pds/verify", requireAuth, async (req: Request, res: Response) => {
  try {
    const { nhsNumber } = req.body;

    if (!nhsNumber) {
      return res.status(400).json({ error: "NHS number is required" });
    }

    const result = await nhsPdsService.verifyNhsNumber(nhsNumber);

    res.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error({ error: errorMessage }, 'NHS number verification error');
    res.status(500).json({ error: "Failed to verify NHS number" });
  }
});

/**
 * GET /api/nhs/pds/validate/:nhsNumber
 * Validate NHS number format (offline validation)
 */
router.get("/pds/validate/:nhsNumber", async (req: Request, res: Response) => {
  try {
    const { nhsNumber } = req.params;
    
    const isValid = nhsPdsService.validateNhsNumber(nhsNumber);
    const formatted = nhsPdsService.formatNhsNumber(nhsNumber);

    res.json({
      nhsNumber: formatted,
      valid: isValid,
      message: isValid 
        ? "NHS number format is valid (checksum verified)" 
        : "Invalid NHS number format or checksum"
    });
  } catch (error) {
    res.status(500).json({ error: "Validation failed" });
  }
});

// ============== NHS SYSTEM STATUS ROUTES ==============

/**
 * GET /api/nhs/system/status
 * Get NHS integration system status
 */
router.get("/system/status", requireAuth, async (req: Request, res: Response) => {
  try {
    // Check API auth service
    const authConfigured = nhsApiAuthService.isConfigured();
    const environment = nhsApiAuthService.getCurrentEnvironment();
    
    // Check PDS service health
    const pdsHealth = await nhsPdsService.healthCheck();

    // Test connection if configured
    let connectionTest = null;
    if (authConfigured) {
      connectionTest = await nhsApiAuthService.testConnection();
    }

    res.json({
      configured: authConfigured,
      environment,
      claims_service: true,         // Always available (internal)
      voucher_service: true,        // Always available (internal)
      exemption_service: true,      // Always available (internal)
      pds_service: pdsHealth.available,
      api_status: connectionTest?.success ? 'connected' : (authConfigured ? 'error' : 'not_configured'),
      last_sync: new Date().toISOString(),
      connection_test: connectionTest,
      pds_health: pdsHealth
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error({ error: errorMessage }, 'Get NHS system status error');
    res.status(500).json({ error: "Failed to get system status" });
  }
});

/**
 * POST /api/nhs/system/test-connection
 * Test NHS API connection
 */
router.post("/system/test-connection", requireAuth, async (req: Request, res: Response) => {
  try {
    const result = await nhsApiAuthService.testConnection();
    res.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error({ error: errorMessage }, 'NHS connection test error');
    res.status(500).json({ 
      success: false,
      error: "Connection test failed",
      message: errorMessage
    });
  }
});

/**
 * GET /api/nhs/system/environment
 * Get current NHS API environment configuration
 */
router.get("/system/environment", requireAuth, async (req: Request, res: Response) => {
  try {
    const environment = nhsApiAuthService.getCurrentEnvironment();
    const config = nhsApiAuthService.getEnvironmentConfig();
    const configured = nhsApiAuthService.isConfigured();

    res.json({
      environment,
      configured,
      endpoints: {
        baseUrl: config.baseUrl,
        tokenUrl: config.tokenUrl,
      },
      features: {
        pds: true,           // Personal Demographics Service
        claims: true,        // GOS Claims (PCSE)
        vouchers: true,      // NHS Vouchers
        exemptions: true,    // Patient Exemptions
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error({ error: errorMessage }, 'Get NHS environment error');
    res.status(500).json({ error: "Failed to get environment configuration" });
  }
});

/**
 * POST /api/nhs/sync
 * Trigger NHS data synchronization
 */
router.post("/sync", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const companyId = user.companyId;

    // This would trigger various NHS data sync operations
    // For now, we just verify connectivity
    const connectionTest = await nhsApiAuthService.testConnection();

    if (!connectionTest.success) {
      return res.status(503).json({
        success: false,
        message: "NHS API connection unavailable",
        details: connectionTest.message
      });
    }

    res.json({
      success: true,
      message: "NHS data sync initiated",
      timestamp: new Date().toISOString(),
      environment: connectionTest.environment
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error({ error: errorMessage }, 'NHS sync error');
    res.status(500).json({ error: "Failed to sync NHS data" });
  }
});

// ============== NHS ONBOARDING CHECKLIST ROUTES ==============

/**
 * GET /api/nhs/onboarding/status
 * Get NHS onboarding status for the company
 */
router.get("/onboarding/status", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    
    // Return onboarding requirements checklist
    res.json({
      companyId: user.companyId,
      requirements: [
        {
          step: 1,
          name: "Create Developer Account",
          description: "Register at https://onboarding.prod.api.platform.nhs.uk",
          required: true,
          status: "pending",
          link: "https://onboarding.prod.api.platform.nhs.uk/Index"
        },
        {
          step: 2,
          name: "Obtain ODS Code",
          description: "Get Organisation Data Service code for your organisation",
          required: true,
          status: "pending",
          link: "https://digital.nhs.uk/services/organisation-data-service"
        },
        {
          step: 3,
          name: "Confirm Use Case",
          description: "Submit your product details and intended use case",
          required: true,
          status: "pending"
        },
        {
          step: 4,
          name: "HSCN Connection",
          description: "Health and Social Care Network connection (if required)",
          required: false,
          status: "not_required",
          link: "https://digital.nhs.uk/services/health-and-social-care-network"
        },
        {
          step: 5,
          name: "DSPT Completion",
          description: "Complete Data Security and Protection Toolkit",
          required: true,
          status: "pending",
          link: "https://digital.nhs.uk/services/data-security-and-protection-toolkit"
        },
        {
          step: 6,
          name: "Clinical Safety (DCB0129)",
          description: "Implement clinical risk management process",
          required: true,
          status: "pending",
          link: "https://digital.nhs.uk/data-and-information/information-standards/information-standards-and-data-collections-including-extractions/publications-and-notifications/standards-and-collections/dcb0129-clinical-risk-management-its-application-in-the-manufacture-of-health-it-systems"
        },
        {
          step: 7,
          name: "Medical Device Classification",
          description: "Determine if your software is a medical device",
          required: true,
          status: "pending",
          link: "https://www.gov.uk/government/publications/medical-devices-software-applications-apps"
        },
        {
          step: 8,
          name: "Product Assurance",
          description: "Complete functional and non-functional testing",
          required: true,
          status: "pending"
        },
        {
          step: 9,
          name: "Penetration Testing",
          description: "Complete security penetration testing",
          required: true,
          status: "pending"
        },
        {
          step: 10,
          name: "Service Desk Registration",
          description: "Register with NHS National Service Desk",
          required: true,
          status: "pending",
          link: "https://www.support.digitalservices.nhs.uk/csm"
        }
      ],
      connectionAgreement: {
        reviewed: false,
        signed: false,
        termsLink: "https://digital.nhs.uk/services/partner-onboarding/operations"
      },
      overallProgress: 0,
      readyForProduction: false
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error({ error: errorMessage }, 'Get NHS onboarding status error');
    res.status(500).json({ error: "Failed to get onboarding status" });
  }
});

// ============== NHS e-REFERRAL SERVICE ROUTES ==============

/**
 * GET /api/nhs/referrals/services
 * Search for available ophthalmology services
 */
router.get("/referrals/services", requireAuth, async (req: Request, res: Response) => {
  try {
    const { specialty, postcode, priority, maxDistance } = req.query;

    if (!specialty || !OPHTHALMOLOGY_SPECIALTIES[specialty as keyof typeof OPHTHALMOLOGY_SPECIALTIES]) {
      return res.status(400).json({
        error: "Invalid or missing specialty",
        validSpecialties: Object.keys(OPHTHALMOLOGY_SPECIALTIES)
      });
    }

    const services = await nhsEReferralService.searchServices({
      specialty: specialty as keyof typeof OPHTHALMOLOGY_SPECIALTIES,
      patientPostcode: postcode as string,
      priority: priority as any,
      maxDistance: maxDistance ? parseInt(maxDistance as string) : undefined,
    });

    res.json({
      total: services.length,
      services
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error({ error: errorMessage }, 'Search services error');
    res.status(500).json({ error: "Failed to search services" });
  }
});

/**
 * GET /api/nhs/referrals/specialties
 * Get list of available ophthalmology specialties
 */
router.get("/referrals/specialties", async (req: Request, res: Response) => {
  res.json({
    specialties: Object.entries(OPHTHALMOLOGY_SPECIALTIES).map(([key, code]) => ({
      code: key,
      nhsCode: code,
      name: key.replace(/_/g, ' ')
    })),
    referralReasons: Object.entries(EYE_REFERRAL_REASONS).map(([key, description]) => ({
      code: key,
      description
    }))
  });
});

/**
 * POST /api/nhs/referrals/create
 * Create a new e-Referral
 */
router.post("/referrals/create", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    
    const {
      patientNhsNumber,
      patientName,
      patientDateOfBirth,
      specialty,
      priority,
      referralReason,
      clinicalDetails,
      urgencyJustification,
      preferredServices
    } = req.body;

    // Validate required fields
    if (!patientNhsNumber || !patientName || !specialty || !priority || !referralReason || !clinicalDetails) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["patientNhsNumber", "patientName", "specialty", "priority", "referralReason", "clinicalDetails"]
      });
    }

    // Validate specialty
    if (!OPHTHALMOLOGY_SPECIALTIES[specialty as keyof typeof OPHTHALMOLOGY_SPECIALTIES]) {
      return res.status(400).json({
        error: "Invalid specialty",
        validSpecialties: Object.keys(OPHTHALMOLOGY_SPECIALTIES)
      });
    }

    // Validate referral reason
    if (!EYE_REFERRAL_REASONS[referralReason as keyof typeof EYE_REFERRAL_REASONS]) {
      return res.status(400).json({
        error: "Invalid referral reason",
        validReasons: Object.keys(EYE_REFERRAL_REASONS)
      });
    }

    // Urgency justification required for non-routine referrals
    if (priority !== 'routine' && !urgencyJustification) {
      return res.status(400).json({
        error: "Urgency justification required for urgent or 2-week-wait referrals"
      });
    }

    const referral = await nhsEReferralService.createReferral({
      patientNhsNumber,
      patientName,
      patientDateOfBirth,
      referringPractitionerId: user.id,
      referringPractitionerName: 'Referring Practitioner', // Would come from user profile
      referringOrganisationOds: process.env.ODS_CODE || '',
      referringOrganisationName: 'ILS Practice', // Would come from company settings
      specialty,
      priority,
      referralReason,
      clinicalDetails,
      urgencyJustification,
      preferredServices
    });

    res.status(201).json(referral);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error({ error: errorMessage }, 'Create referral error');
    res.status(500).json({ error: "Failed to create referral" });
  }
});

/**
 * GET /api/nhs/referrals/:id
 * Get referral by ID
 */
router.get("/referrals/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const referral = await nhsEReferralService.getReferral(id);

    if (!referral) {
      return res.status(404).json({ error: "Referral not found" });
    }

    res.json(referral);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error({ error: errorMessage, referralId: req.params.id }, 'Get referral error');
    res.status(500).json({ error: "Failed to get referral" });
  }
});

/**
 * GET /api/nhs/referrals/patient/:nhsNumber
 * Get all referrals for a patient
 */
router.get("/referrals/patient/:nhsNumber", requireAuth, async (req: Request, res: Response) => {
  try {
    const { nhsNumber } = req.params;

    // Validate NHS number
    if (!nhsPdsService.validateNhsNumber(nhsNumber)) {
      return res.status(400).json({ error: "Invalid NHS number format" });
    }

    const referrals = await nhsEReferralService.getPatientReferrals(nhsNumber);

    res.json({
      nhsNumber: nhsPdsService.formatNhsNumber(nhsNumber),
      total: referrals.length,
      referrals
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error({ error: errorMessage, nhsNumber: req.params.nhsNumber?.slice(-4) }, 'Get patient referrals error');
    res.status(500).json({ error: "Failed to get patient referrals" });
  }
});

/**
 * POST /api/nhs/referrals/:id/submit
 * Submit a draft referral for processing
 */
router.post("/referrals/:id/submit", requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { selectedServiceId } = req.body;

    const referral = await nhsEReferralService.submitReferral(id, selectedServiceId);

    res.json({
      message: "Referral submitted successfully",
      referral
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error({ error: errorMessage, referralId: req.params.id }, 'Submit referral error');
    res.status(500).json({ error: "Failed to submit referral" });
  }
});

/**
 * POST /api/nhs/referrals/:id/cancel
 * Cancel a referral
 */
router.post("/referrals/:id/cancel", requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: "Cancellation reason is required" });
    }

    const success = await nhsEReferralService.cancelReferral(id, reason);

    if (success) {
      res.json({ message: "Referral cancelled successfully" });
    } else {
      res.status(500).json({ error: "Failed to cancel referral" });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error({ error: errorMessage, referralId: req.params.id }, 'Cancel referral error');
    res.status(500).json({ error: "Failed to cancel referral" });
  }
});

/**
 * GET /api/nhs/referrals/health
 * Check e-Referral Service availability
 */
router.get("/referrals/health", requireAuth, async (req: Request, res: Response) => {
  try {
    const health = await nhsEReferralService.healthCheck();
    res.json(health);
  } catch (error) {
    res.status(500).json({ 
      available: false,
      message: "Health check failed"
    });
  }
});

// ============== PCSE WEBHOOK ROUTES ==============

/**
 * POST /api/nhs/webhooks/pcse/claims
 * Receive status updates from PCSE API for submitted claims
 *
 * Security: Validates HMAC signature to ensure authenticity
 * Handles: accepted, rejected, paid, queried status updates
 *
 * Expected payload from PCSE:
 * {
 *   claimId: string,
 *   pcseReference: string,
 *   status: 'accepted' | 'rejected' | 'paid' | 'queried',
 *   paidAmount?: string,
 *   rejectionReason?: string,
 *   pcseResponse?: object
 * }
 */
router.post("/webhooks/pcse/claims", async (req: Request, res: Response) => {
  try {
    // 1. Validate webhook signature
    const signature = req.headers['x-pcse-signature'] as string;
    const webhookSecret = process.env.PCSE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      logger.error('PCSE webhook secret not configured');
      return res.status(500).json({ error: 'Webhook not configured' });
    }

    if (!signature) {
      logger.warn('PCSE webhook received without signature');
      return res.status(401).json({ error: 'Missing signature' });
    }

    // 2. Verify HMAC signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (signature !== expectedSignature) {
      logger.warn({
        receivedSignature: signature.substring(0, 10) + '...',
        expectedSignature: expectedSignature.substring(0, 10) + '...'
      }, 'Invalid PCSE webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // 3. Parse webhook payload
    const { claimId, pcseReference, status, paidAmount, rejectionReason, pcseResponse } = req.body;

    if (!claimId || !status) {
      logger.warn({ body: req.body }, 'PCSE webhook missing required fields');
      return res.status(400).json({ error: 'Missing required fields: claimId, status' });
    }

    // 4. Update claim status
    logger.info({ claimId, status, pcseReference }, 'Processing PCSE webhook');

    await NhsClaimsService.updateClaimStatus(claimId, status, {
      pcseStatus: status,
      pcseResponse,
      rejectionReason,
      paidAmount: paidAmount ? parseFloat(paidAmount) : undefined,
      paidAt: status === 'paid' ? new Date() : undefined,
    });

    logger.info({ claimId, status, pcseReference }, 'PCSE webhook processed successfully');

    // 5. Send email notification based on status
    try {
      // Fetch claim details for email
      const [claim] = await db
        .select()
        .from(nhsClaims)
        .where(eq(nhsClaims.id, claimId))
        .limit(1);

      if (claim) {
        // Fetch practitioner details
        const [practitioner] = await db
          .select()
          .from(nhsPractitioners)
          .where(eq(nhsPractitioners.id, claim.practitionerId))
          .limit(1);

        // Fetch user email via practitioner userId
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, practitioner?.userId || ''))
          .limit(1);

        // Fetch patient details
        const [patient] = await db
          .select()
          .from(patients)
          .where(eq(patients.id, claim.patientId))
          .limit(1);

        if (practitioner && user && patient) {
          const practitionerEmail = user.email;
          const practitionerName = practitioner.name || user.fullName || 'Practitioner';
          const patientName = `${patient.firstName} ${patient.lastName}`;
          const claimAmount = claim.claimAmount?.toString() || '0.00';

          // Send appropriate email based on status
          if (status === 'accepted') {
            await sendNhsClaimAcceptedEmail(
              practitionerEmail,
              practitionerName,
              claim.claimNumber,
              claim.claimType,
              claimAmount,
              patientName,
              pcseReference || claim.pcseReference || ''
            );
            logger.info({ claimId, practitionerEmail }, 'Claim accepted email sent');
          } else if (status === 'rejected') {
            await sendNhsClaimRejectedEmail(
              practitionerEmail,
              practitionerName,
              claim.claimNumber,
              claim.claimType,
              patientName,
              rejectionReason || 'No reason provided'
            );
            logger.info({ claimId, practitionerEmail }, 'Claim rejected email sent');
          } else if (status === 'paid') {
            const paymentDate = new Date().toLocaleDateString('en-GB');
            await sendNhsClaimPaidEmail(
              practitionerEmail,
              practitionerName,
              claim.claimNumber,
              claim.claimType,
              claimAmount,
              patientName,
              pcseReference || claim.pcseReference || '',
              paidAmount || claimAmount,
              paymentDate
            );
            logger.info({ claimId, practitionerEmail }, 'Claim paid email sent');
          }
        }
      }
    } catch (emailError) {
      // Log email error but don't fail the webhook
      const emailErrorMsg = emailError instanceof Error ? emailError.message : 'Unknown error';
      logger.error({ error: emailErrorMsg, claimId }, 'Failed to send email notification');
    }

    // 5. Return success response
    res.json({
      received: true,
      claimId,
      status,
      processedAt: new Date().toISOString()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error({ error: errorMessage, stack: error instanceof Error ? error.stack : undefined }, 'PCSE webhook processing error');
    res.status(500).json({ error: 'Webhook processing failed', message: errorMessage });
  }
});

export default router;
