/**
 * Medical Billing & Insurance System Routes
 * 
 * Comprehensive REST API for managing insurance plans, medical claims,
 * eligibility verification, pre-authorizations, payments, and billing codes.
 * 
 * Features:
 * - Insurance company and plan management
 * - Patient insurance coverage tracking
 * - Eligibility verification and history
 * - Pre-authorization requests and status updates
 * - Medical claim creation and submission
 * - Payment processing and posting
 * - Billing code management (CPT, HCPCS, ICD-10)
 * - Billing analytics and reporting
 * - HIPAA-compliant data handling
 */

import { Router, Request, Response } from "express";
import { z } from "zod";
import { billingService } from "../services/BillingService";
import logger from "../utils/logger";

const router = Router();

// Authentication middleware (assumed to be applied at router level)
const requireAuth = (req: Request, res: Response, next: any) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};

const requireCompanyAccess = (req: Request, res: Response, next: any) => {
  if (!req.user?.companyId) {
    return res.status(403).json({ error: "Company context required" });
  }
  next();
};

// Helper function to get company ID safely
const getCompanyId = (req: Request): string => {
  if (!req.user?.companyId) {
    throw new Error('Company context required');
  }
  return req.user.companyId;
};

// Helper function to get user ID safely
const getUserId = (req: Request): string => {
  if (!req.user?.id) {
    throw new Error('User context required');
  }
  return req.user.id;
};

// Validation schemas
const insuranceCompanySchema = z.object({
  name: z.string().min(1),
  displayName: z.string().optional(),
  payerId: z.string().optional(),
  npi: z.string().optional(),
  address: z.any().optional(),
  phone: z.string().optional(),
  fax: z.string().optional(),
  email: z.string().optional(),
  website: z.string().optional(),
  ediTradingPartnerId: z.string().optional(),
  clearinghouse: z.string().optional(),
  claimSubmissionMethod: z.string().optional(),
  attachmentRequirements: z.array(z.any()).optional()
});

const insurancePlanSchema = z.object({
  insuranceCompanyId: z.string().min(1),
  planName: z.string().min(1),
  planType: z.enum(["hmo", "ppo", "pos", "epo", "medicare", "medicaid", "tricare", "champus", "workers_comp", "auto_insurance", "private_pay", "self_pay"]),
  planId: z.string().optional(),
  groupId: z.string().optional(),
  copaymentAmount: z.number().optional(),
  deductibleAmount: z.number().optional(),
  coinsurancePercentage: z.number().optional(),
  outOfPocketMaximum: z.number().optional(),
  visionCoverage: z.any().optional(),
  examCoverage: z.any().optional(),
  materialsCoverage: z.any().optional(),
  preauthorizationRequired: z.boolean().optional(),
  referralRequired: z.boolean().optional(),
  timelyFilingDays: z.number().optional(),
  effectiveDate: z.coerce.date().optional(),
  terminationDate: z.coerce.date().optional()
});

const patientInsuranceSchema = z.object({
  patientId: z.string().min(1),
  insurancePlanId: z.string().min(1),
  memberId: z.string().min(1),
  subscriberId: z.string().optional(),
  groupNumber: z.string().optional(),
  subscriberFirstName: z.string().optional(),
  subscriberLastName: z.string().optional(),
  subscriberDob: z.coerce.date().optional(),
  subscriberRelationship: z.string().optional(),
  priority: z.number().optional(),
  effectiveDate: z.coerce.date().optional(),
  terminationDate: z.coerce.date().optional()
});

const claimLineItemSchema = z.object({
  serviceDate: z.coerce.date(),
  procedureCode: z.string().optional(),
  diagnosisCode1: z.string().optional(),
  diagnosisCode2: z.string().optional(),
  diagnosisCode3: z.string().optional(),
  diagnosisCode4: z.string().optional(),
  modifier1: z.string().optional(),
  modifier2: z.string().optional(),
  modifier3: z.string().optional(),
  modifier4: z.string().optional(),
  description: z.string().optional(),
  units: z.number().optional(),
  chargeAmount: z.number().min(0),
  appointmentId: z.string().optional()
});

const medicalClaimSchema = z.object({
  patientId: z.string().min(1),
  insurancePlanId: z.string().min(1),
  providerId: z.string().optional(),
  patientAccountNumber: z.string().optional(),
  serviceFromDate: z.coerce.date(),
  serviceToDate: z.coerce.date(),
  dateOfIllness: z.coerce.date().optional(),
  totalCharge: z.number().min(0),
  notes: z.string().optional(),
  attachments: z.array(z.any()).optional(),
  lineItems: z.array(claimLineItemSchema).min(1)
});

const paymentSchema = z.object({
  patientId: z.string().min(1),
  claimId: z.string().optional(),
  paymentType: z.enum(["insurance_payment", "patient_payment", "copayment", "deductible", "coinsurance", "adjustment", "write_off", "refund"]),
  amount: z.number().min(0),
  paymentDate: z.coerce.date(),
  paymentMethod: z.string().optional(),
  referenceNumber: z.string().optional(),
  payerName: z.string().optional(),
  payerType: z.string().optional(),
  appliedToCharges: z.array(z.any()).optional(),
  notes: z.string().optional()
});

const eligibilityVerificationSchema = z.object({
  patientId: z.string().min(1),
  insurancePlanId: z.string().min(1),
  memberId: z.string().min(1),
  verificationDate: z.coerce.date(),
  status: z.enum(["active", "inactive", "terminated", "pending", "unknown", "error"]),
  coverageBeginDate: z.coerce.date().optional(),
  coverageEndDate: z.coerce.date().optional(),
  copaymentAmount: z.number().optional(),
  deductibleAmount: z.number().optional(),
  deductibleMet: z.number().optional(),
  coinsurancePercentage: z.number().optional(),
  visionBenefits: z.any().optional(),
  examBenefits: z.any().optional(),
  materialsBenefits: z.any().optional(),
  responseCode: z.string().optional(),
  responseMessage: z.string().optional()
});

const preauthorizationSchema = z.object({
  patientId: z.string().min(1),
  insurancePlanId: z.string().min(1),
  providerId: z.string().optional(),
  requestDate: z.coerce.date(),
  procedureCode: z.string().optional(),
  diagnosisCode: z.string().optional(),
  description: z.string().optional(),
  appointmentId: z.string().optional()
});

const billingCodeSchema = z.object({
  code: z.string().min(1),
  codeType: z.enum(["cpt", "hcpcs", "icd_10_cm", "icd_10_pcs", "revenue_code", "modifier"]),
  description: z.string().min(1),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  typicalCharge: z.number().optional(),
  medicareAllowance: z.number().optional(),
  effectiveDate: z.coerce.date().optional(),
  terminationDate: z.coerce.date().optional()
});

// ========== INSURANCE COMPANIES ROUTES ==========

/**
 * Add insurance company
 */
router.post('/insurance-companies', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const validated = insuranceCompanySchema.parse(req.body);
    
    const insuranceCompany = await billingService.addInsuranceCompany({
      ...validated,
      companyId: getCompanyId(req)
    });

    res.status(201).json({
      success: true,
      insuranceCompany
    });
  } catch (error) {
    logger.error({ error, body: req.body }, 'Failed to add insurance company');
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to add insurance company',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get insurance companies
 */
router.get('/insurance-companies', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const { activeOnly } = req.query;
    
    const insuranceCompanies = await billingService.getInsuranceCompanies(
      getCompanyId(req),
      activeOnly !== 'false'
    );

    res.json({
      success: true,
      insuranceCompanies
    });
  } catch (error) {
    logger.error({ error }, 'Failed to get insurance companies');
    res.status(500).json({ 
      error: 'Failed to get insurance companies',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ========== INSURANCE PLANS ROUTES ==========

/**
 * Add insurance plan
 */
router.post('/insurance-plans', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const validated = insurancePlanSchema.parse(req.body);
    
    const insurancePlan = await billingService.addInsurancePlan({
      ...validated,
      companyId: getCompanyId(req)
    });

    res.status(201).json({
      success: true,
      insurancePlan
    });
  } catch (error) {
    logger.error({ error, body: req.body }, 'Failed to add insurance plan');
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to add insurance plan',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get insurance plans
 */
router.get('/insurance-plans', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const { insuranceCompanyId } = req.query;
    
    const insurancePlans = await billingService.getInsurancePlans(
      getCompanyId(req),
      insuranceCompanyId as string
    );

    res.json({
      success: true,
      insurancePlans
    });
  } catch (error) {
    logger.error({ error, query: req.query }, 'Failed to get insurance plans');
    res.status(500).json({ 
      error: 'Failed to get insurance plans',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ========== PATIENT INSURANCE ROUTES ==========

/**
 * Add patient insurance coverage
 */
router.post('/patient-insurance', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const validated = patientInsuranceSchema.parse(req.body);
    
    const patientInsurance = await billingService.addPatientInsurance({
      ...validated,
      companyId: getCompanyId(req)
    });

    res.status(201).json({
      success: true,
      patientInsurance
    });
  } catch (error) {
    logger.error({ error, body: req.body }, 'Failed to add patient insurance');
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to add patient insurance',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get patient insurance coverages
 */
router.get('/patient-insurance/:patientId', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    
    const patientInsurance = await billingService.getPatientInsurance(patientId, getCompanyId(req));

    res.json({
      success: true,
      patientInsurance
    });
  } catch (error) {
    logger.error({ error, patientId: req.params.patientId }, 'Failed to get patient insurance');
    res.status(500).json({ 
      error: 'Failed to get patient insurance',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ========== ELIGIBILITY VERIFICATION ROUTES ==========

/**
 * Verify patient eligibility
 */
router.post('/eligibility-verification', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const validated = eligibilityVerificationSchema.parse(req.body);
    
    const eligibility = await billingService.verifyEligibility({
      ...validated,
      companyId: getCompanyId(req),
      verifiedBy: getUserId(req)
    });

    res.status(201).json({
      success: true,
      eligibility
    });
  } catch (error) {
    logger.error({ error, body: req.body }, 'Failed to verify eligibility');
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to verify eligibility',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get eligibility verification history
 */
router.get('/eligibility-verification/:patientId/history', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    
    const eligibilityHistory = await billingService.getEligibilityHistory(patientId, getCompanyId(req));

    res.json({
      success: true,
      eligibilityHistory
    });
  } catch (error) {
    logger.error({ error, patientId: req.params.patientId }, 'Failed to get eligibility history');
    res.status(500).json({ 
      error: 'Failed to get eligibility history',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ========== PRE-AUTHORIZATION ROUTES ==========

/**
 * Request pre-authorization
 */
router.post('/preauthorizations', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const validated = preauthorizationSchema.parse(req.body);
    
    const preauthorization = await billingService.requestPreauthorization({
      ...validated,
      companyId: getCompanyId(req),
      requestedBy: getUserId(req)
    });

    res.status(201).json({
      success: true,
      preauthorization
    });
  } catch (error) {
    logger.error({ error, body: req.body }, 'Failed to request pre-authorization');
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to request pre-authorization',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Update pre-authorization status
 */
router.put('/preauthorizations/:id/status', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      status,
      authorizationNumber,
      approvedUnits,
      approvedAmount,
      effectiveDate,
      expirationDate,
      responseCode,
      denialReason
    } = req.body;
    
    if (!["approved", "denied", "pending", "expired", "cancelled", "not_required"].includes(status)) {
      return res.status(400).json({ error: 'Invalid pre-authorization status' });
    }

    const preauthorization = await billingService.updatePreauthorizationStatus(
      id,
      status,
      authorizationNumber,
      approvedUnits,
      approvedAmount,
      effectiveDate ? new Date(effectiveDate) : undefined,
      expirationDate ? new Date(expirationDate) : undefined,
      responseCode,
      denialReason,
      getCompanyId(req)
    );

    res.json({
      success: true,
      preauthorization
    });
  } catch (error) {
    logger.error({ error, id: req.params.id, body: req.body }, 'Failed to update pre-authorization status');
    
    if (error instanceof Error && error.message === 'Pre-authorization not found') {
      return res.status(404).json({ error: 'Pre-authorization not found' });
    }
    
    res.status(500).json({ 
      error: 'Failed to update pre-authorization status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get pre-authorizations
 */
router.get('/preauthorizations', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const {
      patientId,
      insurancePlanId,
      status,
      dateFrom,
      dateTo
    } = req.query;

    const preauthorizations = await billingService.getPreauthorizations({
      companyId: getCompanyId(req),
      patientId: patientId as string,
      insurancePlanId: insurancePlanId as string,
      status: status as string,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined
    });

    res.json({
      success: true,
      preauthorizations
    });
  } catch (error) {
    logger.error({ error, query: req.query }, 'Failed to get pre-authorizations');
    res.status(500).json({ 
      error: 'Failed to get pre-authorizations',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ========== MEDICAL CLAIMS ROUTES ==========

/**
 * Create medical claim
 */
router.post('/medical-claims', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const validated = medicalClaimSchema.parse(req.body);
    
    const result = await billingService.createMedicalClaim({
      ...validated,
      companyId: getCompanyId(req),
      createdBy: getUserId(req)
    });

    res.status(201).json({
      success: true,
      claim: result.claim,
      lineItems: result.lineItems
    });
  } catch (error) {
    logger.error({ error, body: req.body }, 'Failed to create medical claim');
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to create medical claim',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Submit medical claim
 */
router.post('/medical-claims/:id/submit', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const claim = await billingService.submitClaim(id, getCompanyId(req));

    res.json({
      success: true,
      claim
    });
  } catch (error) {
    logger.error({ error, id: req.params.id }, 'Failed to submit claim');
    
    if (error instanceof Error && error.message === 'Claim not found') {
      return res.status(404).json({ error: 'Claim not found' });
    }
    
    res.status(500).json({ 
      error: 'Failed to submit claim',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Update claim status
 */
router.put('/medical-claims/:id/status', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      status,
      allowedAmount,
      paidAmount,
      patientResponsibility,
      acceptanceDate,
      processedDate,
      paymentDate,
      claimControlNumber,
      trackingNumber
    } = req.body;
    
    if (!["draft", "submitted", "received", "in_review", "approved", "partially_approved", "denied", "paid", "voided", "appealed", "reopened"].includes(status)) {
      return res.status(400).json({ error: 'Invalid claim status' });
    }

    const claim = await billingService.updateClaimStatus(
      id,
      status,
      allowedAmount,
      paidAmount,
      patientResponsibility,
      acceptanceDate ? new Date(acceptanceDate) : undefined,
      processedDate ? new Date(processedDate) : undefined,
      paymentDate ? new Date(paymentDate) : undefined,
      claimControlNumber,
      trackingNumber,
      getCompanyId(req)
    );

    res.json({
      success: true,
      claim
    });
  } catch (error) {
    logger.error({ error, id: req.params.id, body: req.body }, 'Failed to update claim status');
    
    if (error instanceof Error && error.message === 'Claim not found') {
      return res.status(404).json({ error: 'Claim not found' });
    }
    
    res.status(500).json({ 
      error: 'Failed to update claim status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get medical claims
 */
router.get('/medical-claims', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const {
      patientId,
      insurancePlanId,
      status,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20
    } = req.query;

    const result = await billingService.getMedicalClaims({
      companyId: getCompanyId(req),
      patientId: patientId as string,
      insurancePlanId: insurancePlanId as string,
      status: status as string,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error({ error, query: req.query }, 'Failed to get medical claims');
    res.status(500).json({ 
      error: 'Failed to get medical claims',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get claim line items
 */
router.get('/medical-claims/:id/line-items', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const lineItems = await billingService.getClaimLineItems(id, getCompanyId(req));

    res.json({
      success: true,
      lineItems
    });
  } catch (error) {
    logger.error({ error, id: req.params.id }, 'Failed to get claim line items');
    res.status(500).json({ 
      error: 'Failed to get claim line items',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ========== PAYMENTS ROUTES ==========

/**
 * Add payment
 */
router.post('/payments', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const validated = paymentSchema.parse(req.body);
    
    const payment = await billingService.addPayment({
      ...validated,
      companyId: getCompanyId(req),
      createdBy: getUserId(req)
    });

    res.status(201).json({
      success: true,
      payment
    });
  } catch (error) {
    logger.error({ error, body: req.body }, 'Failed to add payment');
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to add payment',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Process payment
 */
router.put('/payments/:id/process', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, processedDate } = req.body;
    
    if (!["pending", "processing", "completed", "failed", "refunded", "voided"].includes(status)) {
      return res.status(400).json({ error: 'Invalid payment status' });
    }

    const payment = await billingService.processPayment(
      id,
      status,
      processedDate ? new Date(processedDate) : undefined,
      getCompanyId(req)
    );

    res.json({
      success: true,
      payment
    });
  } catch (error) {
    logger.error({ error, id: req.params.id, body: req.body }, 'Failed to process payment');
    
    if (error instanceof Error && error.message === 'Payment not found') {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    res.status(500).json({ 
      error: 'Failed to process payment',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get payments
 */
router.get('/payments', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const {
      patientId,
      claimId,
      paymentType,
      status,
      dateFrom,
      dateTo,
      limit = 50
    } = req.query;

    const payments = await billingService.getPayments({
      companyId: getCompanyId(req),
      patientId: patientId as string,
      claimId: claimId as string,
      paymentType: paymentType as string,
      status: status as string,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
      limit: parseInt(limit as string)
    });

    res.json({
      success: true,
      payments
    });
  } catch (error) {
    logger.error({ error, query: req.query }, 'Failed to get payments');
    res.status(500).json({ 
      error: 'Failed to get payments',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ========== BILLING CODES ROUTES ==========

/**
 * Add billing code
 */
router.post('/billing-codes', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const validated = billingCodeSchema.parse(req.body);
    
    const billingCode = await billingService.addBillingCode({
      ...validated,
      companyId: getCompanyId(req)
    });

    res.status(201).json({
      success: true,
      billingCode
    });
  } catch (error) {
    logger.error({ error, body: req.body }, 'Failed to add billing code');
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to add billing code',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get billing codes
 */
router.get('/billing-codes', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const {
      codeType,
      category,
      search
    } = req.query;

    const billingCodes = await billingService.getBillingCodes(
      getCompanyId(req),
      codeType as string,
      category as string,
      search as string
    );

    res.json({
      success: true,
      billingCodes
    });
  } catch (error) {
    logger.error({ error, query: req.query }, 'Failed to get billing codes');
    res.status(500).json({ 
      error: 'Failed to get billing codes',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ========== BILLING ANALYTICS ROUTES ==========

/**
 * Get billing summary
 */
router.get('/analytics/summary', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const {
      dateFrom,
      dateTo
    } = req.query;

    const summary = await billingService.getBillingSummary(
      getCompanyId(req),
      dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo ? new Date(dateTo as string) : undefined
    );

    res.json({
      success: true,
      summary
    });
  } catch (error) {
    logger.error({ error, query: req.query }, 'Failed to get billing summary');
    res.status(500).json({ 
      error: 'Failed to get billing summary',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get patient billing summary
 */
router.get('/patients/:patientId/billing-summary', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    
    const summary = await billingService.getPatientBillingSummary(patientId, getCompanyId(req));

    res.json({
      success: true,
      summary
    });
  } catch (error) {
    logger.error({ error, patientId: req.params.patientId }, 'Failed to get patient billing summary');
    res.status(500).json({ 
      error: 'Failed to get patient billing summary',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
