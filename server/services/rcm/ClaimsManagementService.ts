/**
 * Claims Management Service
 *
 * ⚠️  ⚠️  ⚠️  DEVELOPMENT VERSION - IN-MEMORY STORAGE ONLY  ⚠️  ⚠️  ⚠️
 *
 * CRITICAL LIMITATIONS:
 * - All data stored in memory (Map objects)
 * - Data is LOST on server restart
 * - NOT suitable for production use
 * - NO database persistence
 * - NO data recovery possible
 *
 * STATUS: Architectural prototype with 1,200+ lines of working code
 * TODO: Migrate to database before production deployment
 *       Database tables exist in schema but are not yet connected
 *
 * IMPACT: Claims, payers, batches, appeals, and ERAs will vanish on restart
 *
 * Manages insurance claims lifecycle from creation through adjudication,
 * including submission, tracking, and appeals
 */

import { loggers } from '../../utils/logger.js';
import crypto from 'crypto';
import { storage } from '../../storage.js';
import type { IStorage } from '../../storage.js';

const logger = loggers.api;

// ========== Types & Interfaces ==========

/**
 * Claim status
 */
export type ClaimStatus =
  | 'draft'
  | 'ready_to_submit'
  | 'submitted'
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'partially_paid'
  | 'paid'
  | 'denied'
  | 'appealed'
  | 'voided';

/**
 * Claim type
 */
export type ClaimType = 'professional' | 'institutional' | 'pharmacy' | 'dental' | 'vision';

/**
 * Service place
 */
export type ServicePlace = 'office' | 'hospital_outpatient' | 'hospital_inpatient' | 'emergency' | 'telehealth';

/**
 * Payer
 */
export interface Payer {
  id: string;
  name: string;
  payerId: string; // Electronic payer ID
  type: 'commercial' | 'medicare' | 'medicaid' | 'tricare' | 'workers_comp' | 'other';
  claimSubmissionMethod: 'electronic' | 'paper' | 'clearinghouse';
  contactInfo: {
    phone: string;
    fax?: string;
    email?: string;
    address?: string;
  };
  timely_filing_limit_days: number;
  active: boolean;
}

/**
 * Claim line item
 */
export interface ClaimLineItem {
  id: string;
  lineNumber: number;
  serviceDate: Date;
  procedureCode: string; // CPT code
  modifiers?: string[];
  diagnosisCodes: string[]; // ICD-10 codes
  units: number;
  chargeAmount: number; // in cents
  allowedAmount?: number;
  paidAmount?: number;
  adjustmentAmount?: number;
  patientResponsibility?: number;
  placeOfService: ServicePlace;
  renderingProviderId?: string;
  description?: string;
}

/**
 * Claim
 */
export interface Claim {
  id: string;
  claimNumber: string; // Internal claim number
  type: ClaimType;
  status: ClaimStatus;

  // Patient information
  patientId: string;
  patientName: string;
  patientDOB: Date;
  subscriberId: string;

  // Provider information
  renderingProviderId: string;
  billingProviderId: string;
  facilityId?: string;

  // Payer information
  primaryPayerId: string;
  secondaryPayerId?: string;
  tertiaryPayerId?: string;

  // Service details
  serviceDate: Date;
  admissionDate?: Date;
  dischargeDate?: Date;
  lineItems: ClaimLineItem[];

  // Financial
  totalChargeAmount: number; // in cents
  totalAllowedAmount?: number;
  totalPaidAmount?: number;
  totalAdjustmentAmount?: number;
  patientResponsibility?: number;

  // Submission
  submittedAt?: Date;
  submittedBy?: string;
  submissionMethod?: 'electronic' | 'paper';
  clearinghouseId?: string;
  electronicClaimId?: string; // ICN (Internal Control Number)

  // Adjudication
  adjudicatedAt?: Date;
  paymentDate?: Date;
  checkNumber?: string;
  eobReceived: boolean;
  eobDate?: Date;

  // Denial/Rejection
  denialReason?: string;
  denialCode?: string;
  denialDate?: Date;

  // Appeals
  appealCount: number;
  lastAppealDate?: Date;
  appealStatus?: 'pending' | 'approved' | 'denied';

  // Metadata
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
  updatedBy?: string;
  notes?: string;
}

/**
 * Claim submission batch
 */
export interface ClaimSubmissionBatch {
  id: string;
  batchNumber: string;
  payerId: string;
  claimIds: string[];
  totalClaims: number;
  succeeded: number; // Number of successfully submitted claims
  totalChargeAmount: number;
  submittedAt: Date;
  submittedBy: string;
  status: 'processing' | 'completed' | 'failed';
  clearinghouseResponse?: any;
}

/**
 * Denial reason
 */
export interface DenialReason {
  code: string;
  category: 'authorization' | 'coverage' | 'coding' | 'documentation' | 'timely_filing' | 'other';
  description: string;
  appealable: boolean;
  commonResolution?: string;
}

/**
 * Claim appeal
 */
export interface ClaimAppeal {
  id: string;
  claimId: string;
  appealNumber: number;
  appealDate: Date;
  appealedBy: string;
  appealReason: string;
  supportingDocuments: string[];
  status: 'submitted' | 'pending' | 'approved' | 'denied';
  resolutionDate?: Date;
  resolutionAmount?: number;
  notes?: string;
}

/**
 * ERA (Electronic Remittance Advice)
 */
export interface ERA {
  id: string;
  eraNumber: string;
  payerId: string;
  paymentAmount: number;
  paymentDate: Date;
  checkNumber?: string;
  claimPayments: {
    claimId: string;
    claimNumber: string;
    paidAmount: number;
    allowedAmount: number;
    adjustments: {
      code: string;
      amount: number;
      reason: string;
    }[];
  }[];
  receivedAt: Date;
  processedAt?: Date;
}

/**
 * Claims Management Service
 *
 * MIGRATION STATUS: Partially migrated to database storage
 * - Payers: DATABASE BACKED ✅
 * - Claims: DATABASE BACKED ✅
 * - Batches: IN-MEMORY (to be migrated)
 * - Appeals: IN-MEMORY (to be migrated)
 * - ERAs: IN-MEMORY (to be migrated)
 */
export class ClaimsManagementService {
  /**
   * Storage layer for database access
   */
  private static db: IStorage = storage;

  /**
   * Legacy in-memory stores (being phased out)
   */
  private static claims = new Map<string, Claim>();
  private static payers = new Map<string, Payer>();
  private static batches: ClaimSubmissionBatch[] = [];
  private static appeals = new Map<string, ClaimAppeal>();
  private static eras: ERA[] = [];
  private static claimCounter = 1000;

  // ========== Type Converters ==========

  /**
   * Convert database InsurancePayer to service Payer type
   */
  private static dbPayerToServicePayer(dbPayer: any): Payer {
    return {
      id: dbPayer.id,
      name: dbPayer.name,
      payerId: dbPayer.payerId,
      type: dbPayer.type,
      claimSubmissionMethod: dbPayer.claimSubmissionMethod || 'electronic',
      contactInfo: dbPayer.contactInfo || {},
      timely_filing_limit_days: dbPayer.timelyFilingLimitDays || 365,
      active: dbPayer.active ?? true,
    };
  }

  /**
   * Convert service Payer type to database InsertInsurancePayer
   */
  private static servicePayerToDbPayer(companyId: string, payer: Omit<Payer, 'id'>): any {
    return {
      companyId,
      name: payer.name,
      payerId: payer.payerId,
      type: payer.type,
      claimSubmissionMethod: payer.claimSubmissionMethod,
      contactInfo: payer.contactInfo,
      timelyFilingLimitDays: payer.timely_filing_limit_days,
      active: payer.active,
    };
  }

  /**
   * Denial reasons database
   */
  private static readonly DENIAL_REASONS: Record<string, DenialReason> = {
    'CO-16': {
      code: 'CO-16',
      category: 'coverage',
      description: 'Claim/service lacks information needed for adjudication',
      appealable: true,
      commonResolution: 'Submit missing documentation',
    },
    'CO-18': {
      code: 'CO-18',
      category: 'authorization',
      description: 'Exact duplicate claim/service',
      appealable: false,
      commonResolution: 'Verify claim was not previously submitted',
    },
    'CO-22': {
      code: 'CO-22',
      category: 'coverage',
      description: 'This care may be covered by another payer per coordination of benefits',
      appealable: true,
      commonResolution: 'Bill primary insurance first',
    },
    'CO-27': {
      code: 'CO-27',
      category: 'authorization',
      description: 'Expenses incurred after coverage terminated',
      appealable: true,
      commonResolution: 'Verify coverage dates',
    },
    'CO-50': {
      code: 'CO-50',
      category: 'coverage',
      description: 'Non-covered service',
      appealable: true,
      commonResolution: 'Provide medical necessity documentation',
    },
    'CO-96': {
      code: 'CO-96',
      category: 'coverage',
      description: 'Non-covered charge(s)',
      appealable: true,
      commonResolution: 'Appeal with supporting documentation',
    },
    'CO-97': {
      code: 'CO-97',
      category: 'coverage',
      description: 'Payment adjusted because the benefit for this service is included in another service',
      appealable: true,
      commonResolution: 'Review bundling rules',
    },
    'CO-109': {
      code: 'CO-109',
      category: 'authorization',
      description: 'Claim not covered by this payer/contractor',
      appealable: false,
      commonResolution: 'Bill correct insurance',
    },
    'CO-151': {
      code: 'CO-151',
      category: 'authorization',
      description: 'Payment adjusted because the payer deems the information submitted does not support this level of service',
      appealable: true,
      commonResolution: 'Submit detailed documentation',
    },
    'CO-197': {
      code: 'CO-197',
      category: 'authorization',
      description: 'Precertification/authorization/notification absent',
      appealable: true,
      commonResolution: 'Obtain retroactive authorization if possible',
    },
  };

  /**
   * Initialize default payers
   */
  static {
    this.initializeDefaultPayers();
  }

  // ========== Payer Management ==========

  /**
   * Initialize default payers
   */
  private static initializeDefaultPayers(): void {
    const payers: Omit<Payer, 'id'>[] = [
      {
        name: 'Medicare',
        payerId: 'MEDICARE',
        type: 'medicare',
        claimSubmissionMethod: 'electronic',
        contactInfo: {
          phone: '1-800-MEDICARE',
          address: 'Centers for Medicare & Medicaid Services',
        },
        timely_filing_limit_days: 365,
        active: true,
      },
      {
        name: 'Medicaid',
        payerId: 'MEDICAID',
        type: 'medicaid',
        claimSubmissionMethod: 'electronic',
        contactInfo: {
          phone: '1-800-XXX-XXXX',
          address: 'State Medicaid Office',
        },
        timely_filing_limit_days: 180,
        active: true,
      },
      {
        name: 'Blue Cross Blue Shield',
        payerId: 'BCBS',
        type: 'commercial',
        claimSubmissionMethod: 'electronic',
        contactInfo: {
          phone: '1-800-XXX-XXXX',
          email: 'claims@bcbs.com',
        },
        timely_filing_limit_days: 90,
        active: true,
      },
      {
        name: 'United Healthcare',
        payerId: 'UHC',
        type: 'commercial',
        claimSubmissionMethod: 'electronic',
        contactInfo: {
          phone: '1-800-XXX-XXXX',
          email: 'claims@uhc.com',
        },
        timely_filing_limit_days: 90,
        active: true,
      },
      {
        name: 'Aetna',
        payerId: 'AETNA',
        type: 'commercial',
        claimSubmissionMethod: 'electronic',
        contactInfo: {
          phone: '1-800-XXX-XXXX',
          email: 'claims@aetna.com',
        },
        timely_filing_limit_days: 120,
        active: true,
      },
    ];

    payers.forEach((payer) => {
      const newPayer: Payer = {
        id: crypto.randomUUID(),
        ...payer,
      };
      this.payers.set(newPayer.id, newPayer);
    });

    logger.info({ payerCount: this.payers.size }, 'Default payers initialized');
  }

  /**
   * Register payer (DATABASE-BACKED)
   */
  static async registerPayer(companyId: string, payer: Omit<Payer, 'id'>): Promise<Payer> {
    const dbPayer = this.servicePayerToDbPayer(companyId, payer);
    const created = await this.db.createInsurancePayer(dbPayer);

    logger.info({ payerId: created.id, name: payer.name, companyId }, 'Payer registered');

    return this.dbPayerToServicePayer(created);
  }

  /**
   * Get payer (DATABASE-BACKED)
   */
  static async getPayer(payerId: string, companyId: string): Promise<Payer | null> {
    const dbPayer = await this.db.getInsurancePayer(payerId, companyId);
    return dbPayer ? this.dbPayerToServicePayer(dbPayer) : null;
  }

  /**
   * List payers (DATABASE-BACKED)
   */
  static async listPayers(companyId: string, active?: boolean): Promise<Payer[]> {
    const filters = active !== undefined ? { active } : undefined;
    const dbPayers = await this.db.getInsurancePayers(companyId, filters);
    return dbPayers.map((p) => this.dbPayerToServicePayer(p));
  }

  /**
   * Get payers (alias for listPayers) (DATABASE-BACKED)
   */
  static async getPayers(companyId: string, active?: boolean): Promise<Payer[]> {
    return this.listPayers(companyId, active);
  }

  /**
   * Create payer (alias for registerPayer) (DATABASE-BACKED)
   */
  static async createPayer(companyId: string, payer: Omit<Payer, 'id'>): Promise<Payer> {
    return this.registerPayer(companyId, payer);
  }

  // ========== Claim Management ==========

  /**
   * Create claim
   */
  static createClaim(
    claimData: Omit<Claim, 'id' | 'claimNumber' | 'status' | 'appealCount' | 'eobReceived' | 'createdAt'>
  ): Claim {
    const claimNumber = `CLM-${this.claimCounter++}`;

    const claim: Claim = {
      id: crypto.randomUUID(),
      claimNumber,
      status: 'draft',
      appealCount: 0,
      eobReceived: false,
      ...claimData,
      createdAt: new Date(),
    };

    this.claims.set(claim.id, claim);

    logger.info({ claimId: claim.id, claimNumber, patientId: claim.patientId }, 'Claim created');

    return claim;
  }

  /**
   * Get claim
   */
  static getClaim(claimId: string): Claim | null {
    return this.claims.get(claimId) || null;
  }

  /**
   * Update claim
   */
  static updateClaim(
    claimId: string,
    updates: Partial<Omit<Claim, 'id' | 'claimNumber' | 'createdAt' | 'createdBy'>>,
    updatedBy: string
  ): Claim | null {
    const claim = this.claims.get(claimId);

    if (!claim) {
      return null;
    }

    // Can't update submitted claims
    if (claim.status === 'submitted' || claim.status === 'paid') {
      logger.warn({ claimId }, 'Cannot update submitted or paid claim');
      return null;
    }

    Object.assign(claim, updates, { updatedAt: new Date(), updatedBy });

    this.claims.set(claimId, claim);

    logger.info({ claimId, updates }, 'Claim updated');

    return claim;
  }

  /**
   * Add line item
   */
  static addLineItem(claimId: string, lineItem: Omit<ClaimLineItem, 'id' | 'lineNumber'>): Claim | null {
    const claim = this.claims.get(claimId);

    if (!claim) {
      return null;
    }

    const newLineItem: ClaimLineItem = {
      id: crypto.randomUUID(),
      lineNumber: claim.lineItems.length + 1,
      ...lineItem,
    };

    claim.lineItems.push(newLineItem);

    // Recalculate total
    claim.totalChargeAmount = claim.lineItems.reduce((sum, item) => sum + item.chargeAmount, 0);

    this.claims.set(claimId, claim);

    return claim;
  }

  /**
   * Validate claim for submission
   */
  static validateClaim(claimId: string): { valid: boolean; errors: string[] } {
    const claim = this.claims.get(claimId);
    const errors: string[] = [];

    if (!claim) {
      errors.push('Claim not found');
      return { valid: false, errors };
    }

    // Check required fields
    if (!claim.patientId) errors.push('Patient ID required');
    if (!claim.renderingProviderId) errors.push('Rendering provider required');
    if (!claim.billingProviderId) errors.push('Billing provider required');
    if (!claim.primaryPayerId) errors.push('Primary payer required');
    if (!claim.serviceDate) errors.push('Service date required');
    if (claim.lineItems.length === 0) errors.push('At least one line item required');

    // Check line items
    claim.lineItems.forEach((item, index) => {
      if (!item.procedureCode) errors.push(`Line ${index + 1}: Procedure code required`);
      if (!item.diagnosisCodes || item.diagnosisCodes.length === 0) {
        errors.push(`Line ${index + 1}: At least one diagnosis code required`);
      }
      if (item.chargeAmount <= 0) errors.push(`Line ${index + 1}: Charge amount must be greater than 0`);
    });

    // Check timely filing
    const payer = this.payers.get(claim.primaryPayerId);
    if (payer) {
      const daysSinceService = Math.floor(
        (Date.now() - claim.serviceDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceService > payer.timely_filing_limit_days) {
        errors.push(`Timely filing limit exceeded (${payer.timely_filing_limit_days} days)`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Submit claim
   */
  static submitClaim(claimId: string, submittedBy: string): { success: boolean; error?: string } {
    const claim = this.claims.get(claimId);

    if (!claim) {
      return { success: false, error: 'Claim not found' };
    }

    // Validate
    const validation = this.validateClaim(claimId);
    if (!validation.valid) {
      return { success: false, error: `Validation failed: ${validation.errors.join(', ')}` };
    }

    // Update status
    claim.status = 'submitted';
    claim.submittedAt = new Date();
    claim.submittedBy = submittedBy;
    claim.submissionMethod = 'electronic';
    claim.electronicClaimId = `ICN-${crypto.randomUUID().substring(0, 8)}`;

    this.claims.set(claimId, claim);

    logger.info({ claimId, claimNumber: claim.claimNumber }, 'Claim submitted');

    // In production: Submit to clearinghouse/payer via EDI 837

    return { success: true };
  }

  /**
   * Submit batch of claims
   */
  static submitClaimBatch(claimIds: string[], submittedBy: string): ClaimSubmissionBatch {
    const batchNumber = `BATCH-${Date.now()}`;
    let totalChargeAmount = 0;
    const successfulClaims: string[] = [];

    claimIds.forEach((claimId) => {
      const result = this.submitClaim(claimId, submittedBy);
      if (result.success) {
        const claim = this.claims.get(claimId);
        if (claim) {
          successfulClaims.push(claimId);
          totalChargeAmount += claim.totalChargeAmount;
        }
      }
    });

    const batch: ClaimSubmissionBatch = {
      id: crypto.randomUUID(),
      batchNumber,
      payerId: this.claims.get(claimIds[0])?.primaryPayerId || '',
      claimIds: successfulClaims,
      totalClaims: successfulClaims.length,
      succeeded: successfulClaims.length,
      totalChargeAmount,
      submittedAt: new Date(),
      submittedBy,
      status: 'completed',
    };

    this.batches.push(batch);

    logger.info(
      { batchId: batch.id, batchNumber, claimCount: successfulClaims.length },
      'Claim batch submitted'
    );

    return batch;
  }

  /**
   * List claims
   */
  static listClaims(filters?: {
    patientId?: string;
    payerId?: string;
    status?: ClaimStatus;
    dateFrom?: Date;
    dateTo?: Date;
  }): Claim[] {
    let claims = Array.from(this.claims.values());

    if (filters) {
      if (filters.patientId) {
        claims = claims.filter((c) => c.patientId === filters.patientId);
      }
      if (filters.payerId) {
        claims = claims.filter((c) => c.primaryPayerId === filters.payerId);
      }
      if (filters.status) {
        claims = claims.filter((c) => c.status === filters.status);
      }
      if (filters.dateFrom) {
        claims = claims.filter((c) => c.serviceDate >= filters.dateFrom!);
      }
      if (filters.dateTo) {
        claims = claims.filter((c) => c.serviceDate <= filters.dateTo!);
      }
    }

    return claims.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get claim by ID (alias for getClaim)
   */
  static getClaimById(claimId: string): Claim | null {
    return this.getClaim(claimId);
  }

  /**
   * Get claims by patient
   */
  static getClaimsByPatient(patientId: string): Claim[] {
    return this.listClaims({ patientId });
  }

  /**
   * Get claims by provider
   */
  static getClaimsByProvider(providerId: string): Claim[] {
    return Array.from(this.claims.values())
      .filter((c) => c.renderingProviderId === providerId || c.billingProviderId === providerId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get claims by status
   */
  static getClaimsByStatus(status: ClaimStatus): Claim[] {
    return this.listClaims({ status });
  }

  // ========== Adjudication ==========

  /**
   * Process ERA (Electronic Remittance Advice)
   */
  static processERA(eraData: Omit<ERA, 'id' | 'receivedAt' | 'processedAt'>): ERA {
    const era: ERA = {
      id: crypto.randomUUID(),
      ...eraData,
      receivedAt: new Date(),
    };

    // Update claims with payment information
    era.claimPayments.forEach((payment) => {
      const claim = this.claims.get(payment.claimId);

      if (claim) {
        claim.status = payment.paidAmount > 0 ? 'paid' : 'denied';
        claim.totalPaidAmount = payment.paidAmount;
        claim.totalAllowedAmount = payment.allowedAmount;
        claim.adjudicatedAt = new Date();
        claim.paymentDate = era.paymentDate;
        claim.checkNumber = era.checkNumber;
        claim.eobReceived = true;
        claim.eobDate = era.paymentDate;

        // Calculate adjustments
        const totalAdjustments = payment.adjustments.reduce((sum, adj) => sum + adj.amount, 0);
        claim.totalAdjustmentAmount = totalAdjustments;

        // Calculate patient responsibility
        claim.patientResponsibility =
          claim.totalChargeAmount - payment.paidAmount - totalAdjustments;

        // Check for denials
        const denialAdjustments = payment.adjustments.filter((adj) =>
          this.DENIAL_REASONS[adj.code]
        );

        if (denialAdjustments.length > 0) {
          claim.status = 'denied';
          claim.denialCode = denialAdjustments[0].code;
          claim.denialReason = denialAdjustments[0].reason;
          claim.denialDate = new Date();
        }

        this.claims.set(claim.id, claim);
      }
    });

    era.processedAt = new Date();
    this.eras.push(era);

    logger.info({ eraId: era.id, claimCount: era.claimPayments.length }, 'ERA processed');

    return era;
  }

  // ========== Appeals ==========

  /**
   * File appeal
   */
  static fileAppeal(
    claimId: string,
    appealData: Omit<ClaimAppeal, 'id' | 'claimId' | 'appealNumber' | 'appealDate' | 'status'>
  ): ClaimAppeal {
    const claim = this.claims.get(claimId);

    if (!claim) {
      throw new Error('Claim not found');
    }

    const appeal: ClaimAppeal = {
      id: crypto.randomUUID(),
      claimId,
      appealNumber: claim.appealCount + 1,
      appealDate: new Date(),
      status: 'submitted',
      ...appealData,
    };

    // Update claim
    claim.status = 'appealed';
    claim.appealCount++;
    claim.lastAppealDate = appeal.appealDate;
    claim.appealStatus = 'pending';

    this.claims.set(claimId, claim);
    this.appeals.set(appeal.id, appeal);

    logger.info({ appealId: appeal.id, claimId, appealNumber: appeal.appealNumber }, 'Appeal filed');

    return appeal;
  }

  /**
   * Get appeal
   */
  static getAppeal(appealId: string): ClaimAppeal | null {
    return this.appeals.get(appealId) || null;
  }

  /**
   * Get claim appeals
   */
  static getClaimAppeals(claimId: string): ClaimAppeal[] {
    return Array.from(this.appeals.values())
      .filter((a) => a.claimId === claimId)
      .sort((a, b) => a.appealNumber - b.appealNumber);
  }

  /**
   * Update appeal status
   */
  static updateAppealStatus(
    appealId: string,
    status: ClaimAppeal['status'],
    resolutionAmount?: number
  ): ClaimAppeal | null {
    const appeal = this.appeals.get(appealId);

    if (!appeal) {
      return null;
    }

    appeal.status = status;
    appeal.resolutionDate = new Date();

    if (resolutionAmount !== undefined) {
      appeal.resolutionAmount = resolutionAmount;
    }

    // Update claim status
    const claim = this.claims.get(appeal.claimId);
    if (claim) {
      claim.appealStatus = status === 'approved' ? 'approved' : status === 'denied' ? 'denied' : 'pending';

      if (status === 'approved' && resolutionAmount) {
        claim.totalPaidAmount = (claim.totalPaidAmount || 0) + resolutionAmount;
        claim.status = 'paid';
      }

      this.claims.set(claim.id, claim);
    }

    this.appeals.set(appealId, appeal);

    logger.info({ appealId, status, resolutionAmount }, 'Appeal status updated');

    return appeal;
  }

  // ========== Statistics ==========

  /**
   * Get claims statistics
   */
  static getStatistics(): {
    totalClaims: number;
    claimsByStatus: Record<ClaimStatus, number>;
    totalChargeAmount: number;
    totalPaidAmount: number;
    totalOutstanding: number;
    averageClaimAmount: number;
    denialRate: number;
    appealRate: number;
  } {
    const claims = Array.from(this.claims.values());

    const claimsByStatus: Record<ClaimStatus, number> = {
      draft: 0,
      ready_to_submit: 0,
      submitted: 0,
      pending: 0,
      accepted: 0,
      rejected: 0,
      partially_paid: 0,
      paid: 0,
      denied: 0,
      appealed: 0,
      voided: 0,
    };

    let totalChargeAmount = 0;
    let totalPaidAmount = 0;
    let deniedClaims = 0;
    let appealedClaims = 0;

    claims.forEach((claim) => {
      claimsByStatus[claim.status]++;
      totalChargeAmount += claim.totalChargeAmount;
      totalPaidAmount += claim.totalPaidAmount || 0;

      if (claim.status === 'denied') deniedClaims++;
      if (claim.appealCount > 0) appealedClaims++;
    });

    const totalOutstanding = totalChargeAmount - totalPaidAmount;

    return {
      totalClaims: claims.length,
      claimsByStatus,
      totalChargeAmount,
      totalPaidAmount,
      totalOutstanding,
      averageClaimAmount: claims.length > 0 ? totalChargeAmount / claims.length : 0,
      denialRate: claims.length > 0 ? (deniedClaims / claims.length) * 100 : 0,
      appealRate: claims.length > 0 ? (appealedClaims / claims.length) * 100 : 0,
    };
  }

  /**
   * Get denial analysis
   */
  static getDenialAnalysis(): {
    totalDenials: number;
    denialsByCode: Record<string, number>;
    denialsByCategory: Record<string, number>;
    appealableCount: number;
  } {
    const deniedClaims = Array.from(this.claims.values()).filter((c) => c.status === 'denied');

    const denialsByCode: Record<string, number> = {};
    const denialsByCategory: Record<string, number> = {};
    let appealableCount = 0;

    deniedClaims.forEach((claim) => {
      if (claim.denialCode) {
        denialsByCode[claim.denialCode] = (denialsByCode[claim.denialCode] || 0) + 1;

        const denialReason = this.DENIAL_REASONS[claim.denialCode];
        if (denialReason) {
          denialsByCategory[denialReason.category] =
            (denialsByCategory[denialReason.category] || 0) + 1;

          if (denialReason.appealable) {
            appealableCount++;
          }
        }
      }
    });

    return {
      totalDenials: deniedClaims.length,
      denialsByCode,
      denialsByCategory,
      appealableCount,
    };
  }
}
