/**
 * Billing & Insurance Service
 * 
 * Comprehensive service for managing insurance plans, medical claims,
 * eligibility verification, pre-authorizations, payments, and billing codes.
 * 
 * Features:
 * - Insurance company and plan management
 * - Eligibility verification and tracking
 * - Pre-authorization request processing
 * - Medical claim creation and submission
 * - Payment processing and posting
 * - Billing code management (CPT, HCPCS, ICD-10)
 * - Patient insurance coverage tracking
 * - HIPAA-compliant billing workflows
 * - Multi-tenant data isolation
 */

import { db } from "../db";
import { eq, and, desc, asc, ilike, gte, lte, inArray, sum } from "drizzle-orm";
import * as schema from "@shared/schema";
import logger from "../utils/logger";
import { z } from "zod";

// Types for billing operations
export interface InsuranceCompanyData {
  name: string;
  displayName?: string;
  payerId?: string;
  npi?: string;
  address?: any;
  phone?: string;
  fax?: string;
  email?: string;
  website?: string;
  ediTradingPartnerId?: string;
  clearinghouse?: string;
  claimSubmissionMethod?: string;
  attachmentRequirements?: any[];
}

export interface InsurancePlanData {
  insuranceCompanyId: string;
  planName: string;
  planType: "hmo" | "ppo" | "pos" | "epo" | "medicare" | "medicaid" | "tricare" | "champus" | "workers_comp" | "auto_insurance" | "private_pay" | "self_pay";
  planId?: string;
  groupId?: string;
  copaymentAmount?: number;
  deductibleAmount?: number;
  coinsurancePercentage?: number;
  outOfPocketMaximum?: number;
  visionCoverage?: any;
  examCoverage?: any;
  materialsCoverage?: any;
  preauthorizationRequired?: boolean;
  referralRequired?: boolean;
  timelyFilingDays?: number;
  effectiveDate?: Date;
  terminationDate?: Date;
}

export interface PatientInsuranceData {
  patientId: string;
  insurancePlanId: string;
  memberId: string;
  subscriberId?: string;
  groupNumber?: string;
  subscriberFirstName?: string;
  subscriberLastName?: string;
  subscriberDob?: Date;
  subscriberRelationship?: string;
  priority?: number;
  effectiveDate?: Date;
  terminationDate?: Date;
}

export interface MedicalClaimData {
  patientId: string;
  insurancePlanId: string;
  providerId?: string;
  patientAccountNumber?: string;
  serviceFromDate: Date;
  serviceToDate: Date;
  dateOfIllness?: Date;
  totalCharge: number;
  notes?: string;
  attachments?: any[];
  lineItems: Omit<ClaimLineItemData, 'claimId' | 'lineNumber'>[];
}

export interface ClaimLineItemData {
  serviceDate: Date;
  procedureCode?: string;
  diagnosisCode1?: string;
  diagnosisCode2?: string;
  diagnosisCode3?: string;
  diagnosisCode4?: string;
  modifier1?: string;
  modifier2?: string;
  modifier3?: string;
  modifier4?: string;
  description?: string;
  units?: number;
  chargeAmount: number;
  appointmentId?: string;
}

export interface PaymentData {
  patientId: string;
  claimId?: string;
  paymentType: "insurance_payment" | "patient_payment" | "copayment" | "deductible" | "coinsurance" | "adjustment" | "write_off" | "refund";
  amount: number;
  paymentDate: Date;
  paymentMethod?: string;
  referenceNumber?: string;
  payerName?: string;
  payerType?: string;
  appliedToCharges?: any[];
  notes?: string;
}

export interface EligibilityVerificationData {
  patientId: string;
  insurancePlanId: string;
  memberId: string;
  verificationDate: Date;
  coverageBeginDate?: Date;
  coverageEndDate?: Date;
  copaymentAmount?: number;
  deductibleAmount?: number;
  deductibleMet?: number;
  coinsurancePercentage?: number;
  visionBenefits?: any;
  examBenefits?: any;
  materialsBenefits?: any;
}

export interface PreauthorizationData {
  patientId: string;
  insurancePlanId: string;
  providerId?: string;
  requestDate: Date;
  procedureCode?: string;
  diagnosisCode?: string;
  description?: string;
  appointmentId?: string;
}

export interface BillingSearchParams {
  companyId: string;
  patientId?: string;
  insurancePlanId?: string;
  claimId?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  page?: number;
  limit?: number;
}

export class BillingService {
  /**
   * ========== INSURANCE COMPANIES MANAGEMENT ==========
   */

  /**
   * Add insurance company
   */
  async addInsuranceCompany(data: InsuranceCompanyData & { companyId: string }): Promise<schema.InsuranceCompany> {
    try {
      const insuranceCompanyData = {
        ...data,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const [insuranceCompany] = await db
        .insert(schema.insuranceCompanies)
        .values(insuranceCompanyData)
        .returning();

      logger.info({
        insuranceCompanyId: insuranceCompany.id,
        name: insuranceCompany.name,
        payerId: insuranceCompany.payerId
      }, 'Insurance company added');

      return insuranceCompany;
    } catch (error) {
      logger.error({ error, data }, 'Failed to add insurance company');
      throw error;
    }
  }

  /**
   * Get insurance companies
   */
  async getInsuranceCompanies(companyId: string, activeOnly: boolean = true): Promise<schema.InsuranceCompany[]> {
    try {
      const conditions = [eq(schema.insuranceCompanies.companyId, companyId)];
      
      if (activeOnly) {
        conditions.push(eq(schema.insuranceCompanies.isActive, true));
      }

      const insuranceCompanies = await db
        .select()
        .from(schema.insuranceCompanies)
        .where(and(...conditions))
        .order_by(asc(schema.insuranceCompanies.name));

      return insuranceCompanies;
    } catch (error) {
      logger.error({ error, companyId }, 'Failed to get insurance companies');
      throw error;
    }
  }

  /**
   * ========== INSURANCE PLANS MANAGEMENT ==========
   */

  /**
   * Add insurance plan
   */
  async addInsurancePlan(data: InsurancePlanData & { companyId: string }): Promise<schema.InsurancePlan> {
    try {
      const insurancePlanData = {
        ...data,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const [insurancePlan] = await db
        .insert(schema.insurancePlans)
        .values(insurancePlanData)
        .returning();

      logger.info({
        insurancePlanId: insurancePlan.id,
        planName: insurancePlan.planName,
        planType: insurancePlan.planType
      }, 'Insurance plan added');

      return insurancePlan;
    } catch (error) {
      logger.error({ error, data }, 'Failed to add insurance plan');
      throw error;
    }
  }

  /**
   * Get insurance plans
   */
  async getInsurancePlans(companyId: string, insuranceCompanyId?: string): Promise<schema.InsurancePlan[]> {
    try {
      const conditions = [eq(schema.insurancePlans.companyId, companyId)];
      
      if (insuranceCompanyId) {
        conditions.push(eq(schema.insurancePlans.insuranceCompanyId, insuranceCompanyId));
      }

      conditions.push(eq(schema.insurancePlans.isActive, true));

      const insurancePlans = await db
        .select()
        .from(schema.insurancePlans)
        .where(and(...conditions))
        .order_by(asc(schema.insurancePlans.planName));

      return insurancePlans;
    } catch (error) {
      logger.error({ error, companyId, insuranceCompanyId }, 'Failed to get insurance plans');
      throw error;
    }
  }

  /**
   * ========== PATIENT INSURANCE MANAGEMENT ==========
   */

  /**
   * Add patient insurance coverage
   */
  async addPatientInsurance(data: PatientInsuranceData & { companyId: string }): Promise<schema.PatientInsurance> {
    try {
      const patientInsuranceData = {
        ...data,
        status: "active" as const,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const [patientInsurance] = await db
        .insert(schema.patientInsurance)
        .values(patientInsuranceData)
        .returning();

      logger.info({
        patientInsuranceId: patientInsurance.id,
        patientId: patientInsurance.patientId,
        insurancePlanId: patientInsurance.insurancePlanId,
        memberId: patientInsurance.memberId
      }, 'Patient insurance added');

      return patientInsurance;
    } catch (error) {
      logger.error({ error, data }, 'Failed to add patient insurance');
      throw error;
    }
  }

  /**
   * Get patient insurance coverages
   */
  async getPatientInsurance(patientId: string, companyId: string): Promise<schema.PatientInsurance[]> {
    try {
      const patientInsurance = await db
        .select()
        .from(schema.patientInsurance)
        .where(and(
          eq(schema.patientInsurance.companyId, companyId),
          eq(schema.patientInsurance.patientId, patientId),
          eq(schema.patientInsurance.status, "active")
        ))
        .order_by(asc(schema.patientInsurance.priority));

      return patientInsurance;
    } catch (error) {
      logger.error({ error, patientId, companyId }, 'Failed to get patient insurance');
      throw error;
    }
  }

  /**
   * ========== ELIGIBILITY VERIFICATION ==========
   */

  /**
   * Verify patient eligibility
   */
  async verifyEligibility(data: EligibilityVerificationData & { 
    companyId: string; 
    verifiedBy: string;
    status: "active" | "inactive" | "terminated" | "pending" | "unknown" | "error";
    responseCode?: string;
    responseMessage?: string;
  }): Promise<schema.EligibilityVerification> {
    try {
      const eligibilityData = {
        ...data,
        verificationDate: new Date(),
        createdAt: new Date()
      };

      const [eligibility] = await db
        .insert(schema.eligibilityVerifications)
        .values(eligibilityData)
        .returning();

      logger.info({
        eligibilityId: eligibility.id,
        patientId: eligibility.patientId,
        insurancePlanId: eligibility.insurancePlanId,
        status: eligibility.status
      }, 'Eligibility verification completed');

      return eligibility;
    } catch (error) {
      logger.error({ error, data }, 'Failed to verify eligibility');
      throw error;
    }
  }

  /**
   * Get eligibility verification history
   */
  async getEligibilityHistory(patientId: string, companyId: string): Promise<schema.EligibilityVerification[]> {
    try {
      const eligibilityVerifications = await db
        .select()
        .from(schema.eligibilityVerifications)
        .where(and(
          eq(schema.eligibilityVerifications.companyId, companyId),
          eq(schema.eligibilityVerifications.patientId, patientId)
        ))
        .order_by(desc(schema.eligibilityVerifications.verificationDate));

      return eligibilityVerifications;
    } catch (error) {
      logger.error({ error, patientId, companyId }, 'Failed to get eligibility history');
      throw error;
    }
  }

  /**
   * ========== PRE-AUTHORIZATION MANAGEMENT ==========
   */

  /**
   * Request pre-authorization
   */
  async requestPreauthorization(data: PreauthorizationData & { 
    companyId: string; 
    requestedBy: string;
  }): Promise<schema.Preauthorization> {
    try {
      const preauthorizationData = {
        ...data,
        status: "pending" as const,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const [preauthorization] = await db
        .insert(schema.preauthorizations)
        .values(preauthorizationData)
        .returning();

      logger.info({
        preauthorizationId: preauthorization.id,
        patientId: preauthorization.patientId,
        insurancePlanId: preauthorization.insurancePlanId,
        procedureCode: preauthorization.procedureCode
      }, 'Pre-authorization requested');

      return preauthorization;
    } catch (error) {
      logger.error({ error, data }, 'Failed to request pre-authorization');
      throw error;
    }
  }

  /**
   * Update pre-authorization status
   */
  async updatePreauthorizationStatus(
    id: string,
    status: "approved" | "denied" | "pending" | "expired" | "cancelled" | "not_required",
    authorizationNumber?: string,
    approvedUnits?: number,
    approvedAmount?: number,
    effectiveDate?: Date,
    expirationDate?: Date,
    responseCode?: string,
    denialReason?: string,
    companyId: string
  ): Promise<schema.Preauthorization> {
    try {
      const updateData: any = {
        status,
        updatedAt: new Date()
      };

      if (authorizationNumber) updateData.authorizationNumber = authorizationNumber;
      if (approvedUnits !== undefined) updateData.approvedUnits = approvedUnits;
      if (approvedAmount !== undefined) updateData.approvedAmount = approvedAmount;
      if (effectiveDate) updateData.effectiveDate = effectiveDate;
      if (expirationDate) updateData.expirationDate = expirationDate;
      if (responseCode) updateData.responseCode = responseCode;
      if (denialReason) updateData.denialReason = denialReason;

      const [preauthorization] = await db
        .update(schema.preauthorizations)
        .set(updateData)
        .where(and(
          eq(schema.preauthorizations.id, id),
          eq(schema.preauthorizations.companyId, companyId)
        ))
        .returning();

      if (!preauthorization) {
        throw new Error('Pre-authorization not found');
      }

      logger.info({
        preauthorizationId: id,
        newStatus: status,
        authorizationNumber
      }, 'Pre-authorization status updated');

      return preauthorization;
    } catch (error) {
      logger.error({ error, id, status }, 'Failed to update pre-authorization status');
      throw error;
    }
  }

  /**
   * Get pre-authorizations
   */
  async getPreauthorizations(params: BillingSearchParams & { status?: string }): Promise<schema.Preauthorization[]> {
    try {
      const {
        companyId,
        patientId,
        insurancePlanId,
        status,
        dateFrom,
        dateTo
      } = params;

      const conditions = [eq(schema.preauthorizations.companyId, companyId)];

      if (patientId) {
        conditions.push(eq(schema.preauthorizations.patientId, patientId));
      }

      if (insurancePlanId) {
        conditions.push(eq(schema.preauthorizations.insurancePlanId, insurancePlanId));
      }

      if (status) {
        conditions.push(eq(schema.preauthorizations.status, status));
      }

      if (dateFrom) {
        conditions.push(gte(schema.preauthorizations.requestDate, dateFrom));
      }

      if (dateTo) {
        conditions.push(lte(schema.preauthorizations.requestDate, dateTo));
      }

      const preauthorizations = await db
        .select()
        .from(schema.preauthorizations)
        .where(and(...conditions))
        .order_by(desc(schema.preauthorizations.requestDate));

      return preauthorizations;
    } catch (error) {
      logger.error({ error, params }, 'Failed to get pre-authorizations');
      throw error;
    }
  }

  /**
   * ========== MEDICAL CLAIMS MANAGEMENT ==========
   */

  /**
   * Create medical claim
   */
  async createMedicalClaim(data: MedicalClaimData & { 
    companyId: string; 
    createdBy: string;
  }): Promise<{
    claim: schema.MedicalClaim;
    lineItems: schema.ClaimLineItem[];
  }> {
    try {
      // Generate unique claim number
      const claimNumber = await this.generateClaimNumber(data.companyId);

      const claimData = {
        ...data,
        claimNumber,
        status: "draft" as const,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Create claim
      const [claim] = await db
        .insert(schema.medicalClaims)
        .values(claimData)
        .returning();

      // Create line items
      const lineItemsData = data.lineItems.map((item, index) => ({
        ...item,
        companyId: data.companyId,
        claimId: claim.id,
        lineNumber: index + 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      const lineItems = await db
        .insert(schema.claimLineItems)
        .values(lineItemsData)
        .returning();

      logger.info({
        claimId: claim.id,
        claimNumber: claim.claimNumber,
        patientId: claim.patientId,
        totalCharge: claim.totalCharge,
        lineItemCount: lineItems.length
      }, 'Medical claim created');

      return { claim, lineItems };
    } catch (error) {
      logger.error({ error, data }, 'Failed to create medical claim');
      throw error;
    }
  }

  /**
   * Submit medical claim
   */
  async submitClaim(claimId: string, companyId: string): Promise<schema.MedicalClaim> {
    try {
      const [claim] = await db
        .update(schema.medicalClaims)
        .set({
          status: "submitted",
          submissionDate: new Date(),
          updatedAt: new Date()
        })
        .where(and(
          eq(schema.medicalClaims.id, claimId),
          eq(schema.medicalClaims.companyId, companyId)
        ))
        .returning();

      if (!claim) {
        throw new Error('Claim not found');
      }

      logger.info({
        claimId,
        claimNumber: claim.claimNumber,
        submissionDate: claim.submissionDate
      }, 'Medical claim submitted');

      return claim;
    } catch (error) {
      logger.error({ error, claimId }, 'Failed to submit claim');
      throw error;
    }
  }

  /**
   * Update claim status
   */
  async updateClaimStatus(
    claimId: string,
    status: "draft" | "submitted" | "received" | "in_review" | "approved" | "partially_approved" | "denied" | "paid" | "voided" | "appealed" | "reopened",
    allowedAmount?: number,
    paidAmount?: number,
    patientResponsibility?: number,
    acceptanceDate?: Date,
    processedDate?: Date,
    paymentDate?: Date,
    claimControlNumber?: string,
    trackingNumber?: string,
    companyId: string
  ): Promise<schema.MedicalClaim> {
    try {
      const updateData: any = {
        status,
        updatedAt: new Date()
      };

      if (allowedAmount !== undefined) updateData.allowedAmount = allowedAmount;
      if (paidAmount !== undefined) updateData.paidAmount = paidAmount;
      if (patientResponsibility !== undefined) updateData.patientResponsibility = patientResponsibility;
      if (acceptanceDate) updateData.acceptanceDate = acceptanceDate;
      if (processedDate) updateData.processedDate = processedDate;
      if (paymentDate) updateData.paymentDate = paymentDate;
      if (claimControlNumber) updateData.claimControlNumber = claimControlNumber;
      if (trackingNumber) updateData.trackingNumber = trackingNumber;

      const [claim] = await db
        .update(schema.medicalClaims)
        .set(updateData)
        .where(and(
          eq(schema.medicalClaims.id, claimId),
          eq(schema.medicalClaims.companyId, companyId)
        ))
        .returning();

      if (!claim) {
        throw new Error('Claim not found');
      }

      logger.info({
        claimId,
        newStatus: status,
        allowedAmount,
        paidAmount
      }, 'Claim status updated');

      return claim;
    } catch (error) {
      logger.error({ error, claimId, status }, 'Failed to update claim status');
      throw error;
    }
  }

  /**
   * Get medical claims
   */
  async getMedicalClaims(params: BillingSearchParams): Promise<{
    claims: schema.MedicalClaim[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const {
        companyId,
        patientId,
        insurancePlanId,
        status,
        dateFrom,
        dateTo,
        page = 1,
        limit = 20
      } = params;

      const conditions = [eq(schema.medicalClaims.companyId, companyId)];

      if (patientId) {
        conditions.push(eq(schema.medicalClaims.patientId, patientId));
      }

      if (insurancePlanId) {
        conditions.push(eq(schema.medicalClaims.insurancePlanId, insurancePlanId));
      }

      if (status) {
        conditions.push(eq(schema.medicalClaims.status, status));
      }

      if (dateFrom) {
        conditions.push(gte(schema.medicalClaims.serviceFromDate, dateFrom));
      }

      if (dateTo) {
        conditions.push(lte(schema.medicalClaims.serviceFromDate, dateTo));
      }

      // Get total count
      const [{ count }] = await db
        .select({ count: schema.medicalClaims.id })
        .from(schema.medicalClaims)
        .where(and(...conditions));

      // Get paginated results
      const claims = await db
        .select()
        .from(schema.medicalClaims)
        .where(and(...conditions))
        .order_by(desc(schema.medicalClaims.createdAt))
        .limit(limit)
        .offset((page - 1) * limit);

      const total = Number(count);
      const totalPages = Math.ceil(total / limit);

      return {
        claims,
        total,
        page,
        totalPages
      };
    } catch (error) {
      logger.error({ error, params }, 'Failed to get medical claims');
      throw error;
    }
  }

  /**
   * Get claim line items
   */
  async getClaimLineItems(claimId: string, companyId: string): Promise<schema.ClaimLineItem[]> {
    try {
      const lineItems = await db
        .select()
        .from(schema.claimLineItems)
        .where(and(
          eq(schema.claimLineItems.companyId, companyId),
          eq(schema.claimLineItems.claimId, claimId)
        ))
        .order_by(asc(schema.claimLineItems.lineNumber));

      return lineItems;
    } catch (error) {
      logger.error({ error, claimId, companyId }, 'Failed to get claim line items');
      throw error;
    }
  }

  /**
   * ========== PAYMENTS MANAGEMENT ==========
   */

  /**
   * Add payment
   */
  async addPayment(data: PaymentData & { 
    companyId: string; 
    createdBy: string;
  }): Promise<schema.Payment> {
    try {
      const paymentData = {
        ...data,
        status: "pending" as const,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const [payment] = await db
        .insert(schema.payments)
        .values(paymentData)
        .returning();

      logger.info({
        paymentId: payment.id,
        patientId: payment.patientId,
        claimId: payment.claimId,
        paymentType: payment.paymentType,
        amount: payment.amount
      }, 'Payment added');

      return payment;
    } catch (error) {
      logger.error({ error, data }, 'Failed to add payment');
      throw error;
    }
  }

  /**
   * Process payment
   */
  async processPayment(
    paymentId: string,
    status: "pending" | "processing" | "completed" | "failed" | "refunded" | "voided",
    processedDate?: Date,
    companyId: string
  ): Promise<schema.Payment> {
    try {
      const updateData: any = {
        status,
        updatedAt: new Date()
      };

      if (processedDate) {
        updateData.processedDate = processedDate;
      } else if (status === "completed") {
        updateData.processedDate = new Date();
      }

      const [payment] = await db
        .update(schema.payments)
        .set(updateData)
        .where(and(
          eq(schema.payments.id, paymentId),
          eq(schema.payments.companyId, companyId)
        ))
        .returning();

      if (!payment) {
        throw new Error('Payment not found');
      }

      logger.info({
        paymentId,
        newStatus: status,
        processedDate: payment.processedDate
      }, 'Payment processed');

      return payment;
    } catch (error) {
      logger.error({ error, paymentId, status }, 'Failed to process payment');
      throw error;
    }
  }

  /**
   * Get payments
   */
  async getPayments(params: BillingSearchParams & { paymentType?: string }): Promise<schema.Payment[]> {
    try {
      const {
        companyId,
        patientId,
        claimId,
        paymentType,
        status,
        dateFrom,
        dateTo
      } = params;

      const conditions = [eq(schema.payments.companyId, companyId)];

      if (patientId) {
        conditions.push(eq(schema.payments.patientId, patientId));
      }

      if (claimId) {
        conditions.push(eq(schema.payments.claimId, claimId));
      }

      if (paymentType) {
        conditions.push(eq(schema.payments.paymentType, paymentType));
      }

      if (status) {
        conditions.push(eq(schema.payments.status, status));
      }

      if (dateFrom) {
        conditions.push(gte(schema.payments.paymentDate, dateFrom));
      }

      if (dateTo) {
        conditions.push(lte(schema.payments.paymentDate, dateTo));
      }

      const payments = await db
        .select()
        .from(schema.payments)
        .where(and(...conditions))
        .order_by(desc(schema.payments.paymentDate));

      return payments;
    } catch (error) {
      logger.error({ error, params }, 'Failed to get payments');
      throw error;
    }
  }

  /**
   * ========== BILLING CODES MANAGEMENT ==========
   */

  /**
   * Add billing code
   */
  async addBillingCode(data: {
    code: string;
    codeType: "cpt" | "hcpcs" | "icd_10_cm" | "icd_10_pcs" | "revenue_code" | "modifier";
    description: string;
    category?: string;
    subcategory?: string;
    typicalCharge?: number;
    medicareAllowance?: number;
    effectiveDate?: Date;
    terminationDate?: Date;
  } & { companyId: string }): Promise<schema.BillingCode> {
    try {
      const billingCodeData = {
        ...data,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const [billingCode] = await db
        .insert(schema.billingCodes)
        .values(billingCodeData)
        .returning();

      logger.info({
        billingCodeId: billingCode.id,
        code: billingCode.code,
        codeType: billingCode.codeType,
        description: billingCode.description
      }, 'Billing code added');

      return billingCode;
    } catch (error) {
      logger.error({ error, data }, 'Failed to add billing code');
      throw error;
    }
  }

  /**
   * Get billing codes
   */
  async getBillingCodes(
    companyId: string,
    codeType?: string,
    category?: string,
    search?: string
  ): Promise<schema.BillingCode[]> {
    try {
      const conditions = [
        eq(schema.billingCodes.companyId, companyId),
        eq(schema.billingCodes.isActive, true)
      ];

      if (codeType) {
        conditions.push(eq(schema.billingCodes.codeType, codeType));
      }

      if (category) {
        conditions.push(eq(schema.billingCodes.category, category));
      }

      if (search) {
        conditions.push(
          ilike(schema.billingCodes.code, `%${search}%`)
        );
      }

      const billingCodes = await db
        .select()
        .from(schema.billingCodes)
        .where(and(...conditions))
        .order_by(asc(schema.billingCodes.code));

      return billingCodes;
    } catch (error) {
      logger.error({ error, companyId, codeType, category }, 'Failed to get billing codes');
      throw error;
    }
  }

  /**
   * ========== BILLING ANALYTICS ==========
   */

  /**
   * Get billing summary
   */
  async getBillingSummary(companyId: string, dateFrom?: Date, dateTo?: Date): Promise<{
    totalClaims: number;
    submittedClaims: number;
    paidClaims: number;
    deniedClaims: number;
    totalCharges: number;
    totalPaid: number;
    totalPatientResponsibility: number;
    averageClaimAmount: number;
    paymentBreakdown: Record<string, number>;
  }> {
    try {
      const conditions = [eq(schema.medicalClaims.companyId, companyId)];
      
      if (dateFrom) {
        conditions.push(gte(schema.medicalClaims.serviceFromDate, dateFrom));
      }
      
      if (dateTo) {
        conditions.push(lte(schema.medicalClaims.serviceFromDate, dateTo));
      }

      // Get claim statistics
      const claimStats = await db
        .select({
          total: count(schema.medicalClaims.id),
          submitted: count(schema.medicalClaims.id).where(eq(schema.medicalClaims.status, 'submitted')),
          paid: count(schema.medicalClaims.id).where(eq(schema.medicalClaims.status, 'paid')),
          denied: count(schema.medicalClaims.id).where(eq(schema.medicalClaims.status, 'denied')),
          totalCharges: sum(schema.medicalClaims.totalCharge),
          totalPaid: sum(schema.medicalClaims.paidAmount),
          patientResponsibility: sum(schema.medicalClaims.patientResponsibility)
        })
        .from(schema.medicalClaims)
        .where(and(...conditions));

      // Get payment breakdown
      const paymentBreakdown = await db
        .select({
          paymentType: schema.payments.paymentType,
          total: sum(schema.payments.amount)
        })
        .from(schema.payments)
        .where(and(
          eq(schema.payments.companyId, companyId),
          eq(schema.payments.status, 'completed'),
          dateFrom ? gte(schema.payments.paymentDate, dateFrom) : undefined,
          dateTo ? lte(schema.payments.paymentDate, dateTo) : undefined
        ))
        .groupBy(schema.payments.paymentType);

      const stats = claimStats[0];
      const breakdown = paymentBreakdown.reduce((acc, item) => {
        acc[item.paymentType] = Number(item.total);
        return acc;
      }, {} as Record<string, number>);

      return {
        totalClaims: Number(stats.total),
        submittedClaims: Number(stats.submitted),
        paidClaims: Number(stats.paid),
        deniedClaims: Number(stats.denied),
        totalCharges: Number(stats.totalCharges),
        totalPaid: Number(stats.totalPaid),
        totalPatientResponsibility: Number(stats.patientResponsibility),
        averageClaimAmount: stats.total ? Number(stats.totalCharges) / Number(stats.total) : 0,
        paymentBreakdown: breakdown
      };
    } catch (error) {
      logger.error({ error, companyId, dateFrom, dateTo }, 'Failed to get billing summary');
      throw error;
    }
  }

  /**
   * ========== UTILITY METHODS ==========
   */

  /**
   * Generate unique claim number
   */
  private async generateClaimNumber(companyId: string): Promise<string> {
    try {
      const year = new Date().getFullYear();
      const prefix = `CLM${year}`;
      
      // Get the highest claim number for this year and company
      const existingClaims = await db
        .select({ claimNumber: schema.medicalClaims.claimNumber })
        .from(schema.medicalClaims)
        .where(and(
          eq(schema.medicalClaims.companyId, companyId),
          ilike(schema.medicalClaims.claimNumber, `${prefix}%`)
        ))
        .order_by(desc(schema.medicalClaims.claimNumber))
        .limit(1);

      let sequence = 1;
      if (existingClaims.length > 0) {
        const lastClaimNumber = existingClaims[0].claimNumber;
        const lastSequence = parseInt(lastClaimNumber.replace(prefix, ''));
        sequence = lastSequence + 1;
      }

      return `${prefix}${sequence.toString().padStart(8, '0')}`;
    } catch (error) {
      logger.error({ error, companyId }, 'Failed to generate claim number');
      throw error;
    }
  }

  /**
   * Get comprehensive patient billing summary
   */
  async getPatientBillingSummary(patientId: string, companyId: string): Promise<{
    patient: any;
    insuranceCoverages: schema.PatientInsurance[];
    activeClaims: schema.MedicalClaim[];
    recentPayments: schema.Payment[];
    outstandingBalance: number;
    totalCharges: number;
    totalPaid: number;
  }> {
    try {
      const [
        insuranceCoverages,
        activeClaims,
        recentPayments,
        billingSummary
      ] = await Promise.all([
        this.getPatientInsurance(patientId, companyId),
        this.getMedicalClaims({ companyId, patientId, status: 'submitted' }),
        this.getPayments({ companyId, patientId, limit: 10 }),
        this.getBillingSummary(companyId)
      ]);

      // Calculate patient-specific totals
      const patientClaims = await this.getMedicalClaims({ companyId, patientId });
      const patientPayments = await this.getPayments({ companyId, patientId });

      const totalCharges = patientClaims.reduce((sum, claim) => sum + Number(claim.totalCharge), 0);
      const totalPaid = patientPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
      const outstandingBalance = totalCharges - totalPaid;

      return {
        patient: { id: patientId }, // Would typically fetch patient details
        insuranceCoverages,
        activeClaims: activeClaims.claims,
        recentPayments,
        outstandingBalance,
        totalCharges,
        totalPaid
      };
    } catch (error) {
      logger.error({ error, patientId, companyId }, 'Failed to get patient billing summary');
      throw error;
    }
  }
}

// Helper function for count with conditions
function count(column: any) {
  return column;
}

export const billingService = new BillingService();
export default billingService;
