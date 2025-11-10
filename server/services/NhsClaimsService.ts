/**
 * NHS Claims Service
 *
 * Handles GOS (General Ophthalmic Services) claims for NHS sight tests.
 * Manages claim creation, submission to PCSE, status tracking, and payment reconciliation.
 *
 * GOS Claim Types:
 * - GOS 1: Standard NHS sight test (£23.19)
 * - GOS 2: NHS sight test for under 16 or full-time education (£23.19)
 * - GOS 3: Complex NHS sight test (£43.80)
 * - GOS 4: Domiciliary NHS sight test (£59.05)
 *
 * Claim Workflow:
 * 1. Draft - Created but not submitted
 * 2. Submitted - Sent to PCSE
 * 3. Accepted - PCSE accepted claim
 * 4. Paid - Payment received
 * 5. Rejected - PCSE rejected (with reason)
 * 6. Queried - PCSE has questions
 */

import { db } from "../../db/index.js";
import { nhsClaims, nhsPractitioners, nhsPatientExemptions, nhsPayments } from "../../shared/schema.js";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import crypto from "crypto";

// GOS claim amounts (as of 2024)
const GOS_CLAIM_AMOUNTS = {
  GOS1: 23.19,
  GOS2: 23.19,
  GOS3: 43.80,
  GOS4: 59.05,
};

export interface CreateClaimData {
  companyId: string;
  patientId: string;
  examinationId?: string;
  practitionerId: string;
  claimType: "GOS1" | "GOS2" | "GOS3" | "GOS4";
  testDate: string; // ISO date
  patientNhsNumber?: string;
  patientExemptionReason?: string;
  patientExemptionEvidence?: string;
  prescriptionIssued: boolean;
  referralMade: boolean;
  referralUrgency?: "routine" | "urgent" | "emergency";
  clinicalNotes?: string;
}

export interface SubmitClaimData {
  claimId: string;
  submittedBy: string;
}

export class NhsClaimsService {
  /**
   * Generate unique claim number
   * Format: NHS-{COMPANY_ID_PREFIX}-{YYYYMMDD}-{SEQUENCE}
   */
  private static async generateClaimNumber(companyId: string): Promise<string> {
    const date = new Date().toISOString().split("T")[0].replace(/-/g, "");
    const prefix = companyId.substring(0, 6).toUpperCase();
    const sequence = Math.floor(Math.random() * 9999)
      .toString()
      .padStart(4, "0");

    return `NHS-${prefix}-${date}-${sequence}`;
  }

  /**
   * Create a new NHS GOS claim
   */
  static async createClaim(data: CreateClaimData) {
    const {
      companyId,
      patientId,
      examinationId,
      practitionerId,
      claimType,
      testDate,
      patientNhsNumber,
      patientExemptionReason,
      patientExemptionEvidence,
      prescriptionIssued,
      referralMade,
      referralUrgency,
      clinicalNotes,
    } = data;

    // Verify practitioner exists and is active
    const [practitioner] = await db
      .select()
      .from(nhsPractitioners)
      .where(
        and(
          eq(nhsPractitioners.id, practitionerId),
          eq(nhsPractitioners.companyId, companyId),
          eq(nhsPractitioners.isActive, true)
        )
      )
      .limit(1);

    if (!practitioner) {
      throw new Error("NHS practitioner not found or inactive");
    }

    // Check GOC registration expiry
    const gocExpiry = new Date(practitioner.gocExpiryDate);
    if (gocExpiry < new Date()) {
      throw new Error("Practitioner GOC registration has expired");
    }

    // Generate claim number
    const claimNumber = await this.generateClaimNumber(companyId);

    // Get claim amount
    const claimAmount = GOS_CLAIM_AMOUNTS[claimType];

    // Create claim
    const [claim] = await db
      .insert(nhsClaims)
      .values({
        companyId,
        patientId,
        examinationId,
        practitionerId,
        claimType,
        claimNumber,
        claimDate: new Date().toISOString().split("T")[0],
        testDate,
        patientNhsNumber,
        patientExemptionReason: patientExemptionReason as any,
        patientExemptionEvidence,
        prescriptionIssued,
        referralMade,
        referralUrgency,
        clinicalNotes,
        claimAmount: claimAmount.toString(),
        status: "draft",
      })
      .returning();

    return claim;
  }

  /**
   * Submit claim to PCSE
   * In production, this would call PCSE API or generate XML file for email submission
   */
  static async submitClaim(data: SubmitClaimData) {
    const { claimId, submittedBy } = data;

    // Get claim
    const [claim] = await db
      .select()
      .from(nhsClaims)
      .where(eq(nhsClaims.id, claimId))
      .limit(1);

    if (!claim) {
      throw new Error("Claim not found");
    }

    if (claim.status !== "draft") {
      throw new Error(`Cannot submit claim with status: ${claim.status}`);
    }

    // Validation checks
    await this.validateClaim(claim);

    // Generate PCSE reference
    const pcseReference = `PCSE-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;

    // Update claim status
    const [updatedClaim] = await db
      .update(nhsClaims)
      .set({
        status: "submitted",
        submittedAt: new Date(),
        submittedBy,
        pcseReference,
        pcseStatus: "pending",
        updatedAt: new Date(),
      })
      .where(eq(nhsClaims.id, claimId))
      .returning();

    // TODO: In production, implement actual PCSE submission
    // Options:
    // 1. PCSE API call (if available)
    // 2. Generate XML file for email submission
    // 3. Export to NHS Portal format

    return updatedClaim;
  }

  /**
   * Validate claim before submission
   */
  private static async validateClaim(claim: any) {
    const errors: string[] = [];

    // Check patient NHS number (required for most claims)
    if (!claim.patientNhsNumber && claim.claimType !== "GOS4") {
      errors.push("Patient NHS number is required");
    }

    // Validate NHS number format (10 digits)
    if (claim.patientNhsNumber && !/^\d{10}$/.test(claim.patientNhsNumber)) {
      errors.push("Invalid NHS number format (must be 10 digits)");
    }

    // Check exemption evidence if exemption claimed
    if (claim.patientExemptionReason && !claim.patientExemptionEvidence) {
      errors.push("Exemption evidence is required when claiming exemption");
    }

    // Check test date is not in future
    const testDate = new Date(claim.testDate);
    if (testDate > new Date()) {
      errors.push("Test date cannot be in the future");
    }

    // Check test date is within claim period (usually 3 months)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    if (testDate < threeMonthsAgo) {
      errors.push("Test date is too old (must be within 3 months)");
    }

    if (errors.length > 0) {
      throw new Error(`Claim validation failed: ${errors.join(", ")}`);
    }
  }

  /**
   * Update claim status (after PCSE response)
   */
  static async updateClaimStatus(
    claimId: string,
    status: "accepted" | "rejected" | "paid" | "queried",
    data: {
      pcseStatus?: string;
      pcseResponse?: any;
      rejectionReason?: string;
      paidAmount?: number;
      paidAt?: Date;
      paymentReference?: string;
    }
  ) {
    const [updatedClaim] = await db
      .update(nhsClaims)
      .set({
        status,
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(nhsClaims.id, claimId))
      .returning();

    return updatedClaim;
  }

  /**
   * Get claim by ID
   */
  static async getClaimById(claimId: string, companyId: string) {
    const [claim] = await db
      .select()
      .from(nhsClaims)
      .where(and(eq(nhsClaims.id, claimId), eq(nhsClaims.companyId, companyId)))
      .limit(1);

    return claim;
  }

  /**
   * Get claims for a company
   */
  static async getCompanyClaims(
    companyId: string,
    options?: {
      status?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    }
  ) {
    const { status, startDate, endDate, limit = 50, offset = 0 } = options || {};

    // Build where conditions
    const conditions: any[] = [eq(nhsClaims.companyId, companyId)];

    if (status) {
      conditions.push(eq(nhsClaims.status, status as any));
    }

    if (startDate) {
      conditions.push(gte(nhsClaims.claimDate, startDate));
    }

    if (endDate) {
      conditions.push(lte(nhsClaims.claimDate, endDate));
    }

    const claims = await db
      .select()
      .from(nhsClaims)
      .where(and(...conditions))
      .orderBy(desc(nhsClaims.claimDate))
      .limit(limit)
      .offset(offset);

    return claims;
  }

  /**
   * Get claims for a patient
   */
  static async getPatientClaims(patientId: string, companyId: string) {
    const claims = await db
      .select()
      .from(nhsClaims)
      .where(and(eq(nhsClaims.patientId, patientId), eq(nhsClaims.companyId, companyId)))
      .orderBy(desc(nhsClaims.testDate));

    return claims;
  }

  /**
   * Get claims summary statistics
   */
  static async getClaimsSummary(companyId: string, periodStart: string, periodEnd: string) {
    const claims = await db
      .select()
      .from(nhsClaims)
      .where(
        and(
          eq(nhsClaims.companyId, companyId),
          gte(nhsClaims.claimDate, periodStart),
          lte(nhsClaims.claimDate, periodEnd)
        )
      );

    const summary = {
      totalClaims: claims.length,
      draftClaims: claims.filter((c: any) => c.status === "draft").length,
      submittedClaims: claims.filter((c: any) => c.status === "submitted").length,
      acceptedClaims: claims.filter((c: any) => c.status === "accepted").length,
      paidClaims: claims.filter((c: any) => c.status === "paid").length,
      rejectedClaims: claims.filter((c: any) => c.status === "rejected").length,
      queriedClaims: claims.filter((c: any) => c.status === "queried").length,

      totalClaimAmount: claims.reduce(
        (sum: any, c: any) => sum + parseFloat(c.claimAmount),
        0
      ),
      totalPaidAmount: claims.reduce(
        (sum: any, c: any) => sum + (c.paidAmount ? parseFloat(c.paidAmount) : 0),
        0
      ),

      claimsByType: {
        GOS1: claims.filter((c: any) => c.claimType === "GOS1").length,
        GOS2: claims.filter((c: any) => c.claimType === "GOS2").length,
        GOS3: claims.filter((c: any) => c.claimType === "GOS3").length,
        GOS4: claims.filter((c: any) => c.claimType === "GOS4").length,
      },

      averageClaimAmount:
        claims.length > 0
          ? claims.reduce((sum: any, c: any) => sum + parseFloat(c.claimAmount), 0) / claims.length
          : 0,

      averageProcessingTime: this.calculateAverageProcessingTime(claims),
    };

    return summary;
  }

  /**
   * Calculate average processing time (submission to payment)
   */
  private static calculateAverageProcessingTime(claims: any[]): number {
    const paidClaims = claims.filter((c) => c.status === "paid" && c.submittedAt && c.paidAt);

    if (paidClaims.length === 0) return 0;

    const totalDays = paidClaims.reduce((sum, c) => {
      const submitted = new Date(c.submittedAt);
      const paid = new Date(c.paidAt);
      const days = Math.floor((paid.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24));
      return sum + days;
    }, 0);

    return Math.round(totalDays / paidClaims.length);
  }

  /**
   * Delete claim (only if draft)
   */
  static async deleteClaim(claimId: string, companyId: string) {
    const [claim] = await db
      .select()
      .from(nhsClaims)
      .where(and(eq(nhsClaims.id, claimId), eq(nhsClaims.companyId, companyId)))
      .limit(1);

    if (!claim) {
      throw new Error("Claim not found");
    }

    if (claim.status !== "draft") {
      throw new Error("Cannot delete claim that has been submitted");
    }

    await db.delete(nhsClaims).where(eq(nhsClaims.id, claimId));
  }

  /**
   * Batch submit multiple claims
   */
  static async batchSubmitClaims(claimIds: string[], submittedBy: string, companyId: string) {
    const results = {
      successful: [] as string[],
      failed: [] as { claimId: string; error: string }[],
    };

    for (const claimId of claimIds) {
      try {
        // Verify claim belongs to company
        const [claim] = await db
          .select()
          .from(nhsClaims)
          .where(and(eq(nhsClaims.id, claimId), eq(nhsClaims.companyId, companyId)))
          .limit(1);

        if (!claim) {
          results.failed.push({ claimId, error: "Claim not found" });
          continue;
        }

        await this.submitClaim({ claimId, submittedBy });
        results.successful.push(claimId);
      } catch (error: any) {
        results.failed.push({ claimId, error: error.message });
      }
    }

    return results;
  }

  /**
   * Reconcile payment with claims
   */
  static async reconcilePayment(
    paymentId: string,
    claimIds: string[],
    reconciledBy: string
  ) {
    // Update claims with payment reference
    const payment = await db
      .select()
      .from(nhsPayments)
      .where(eq(nhsPayments.id, paymentId))
      .limit(1);

    if (!payment.length) {
      throw new Error("Payment not found");
    }

    const [paymentRecord] = payment;

    for (const claimId of claimIds) {
      await db
        .update(nhsClaims)
        .set({
          status: "paid",
          paidAt: paymentRecord.paymentDate,
          paymentReference: paymentRecord.paymentReference,
          paidAmount: "0", // Will be calculated
          updatedAt: new Date(),
        })
        .where(eq(nhsClaims.id, claimId));
    }

    // Update payment as reconciled
    await db
      .update(nhsPayments)
      .set({
        isReconciled: true,
        reconciledAt: new Date(),
        reconciledBy,
        updatedAt: new Date(),
      })
      .where(eq(nhsPayments.id, paymentId));

    return { success: true, reconciledClaims: claimIds.length };
  }
}
