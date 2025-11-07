/**
 * NHS Exemption Service
 *
 * Manages NHS patient exemptions for free/reduced-cost sight tests and glasses.
 * Handles exemption verification, evidence tracking, and expiry management.
 *
 * Exemption Categories:
 *
 * AGE-BASED:
 * - Under 16
 * - 16-18 in full-time education
 * - 60+
 *
 * INCOME-BASED:
 * - Income Support
 * - Jobseeker's Allowance
 * - Pension Credit Guarantee Credit
 * - Universal Credit (income < £435/month or £935 if child)
 * - HC2 certificate (full help)
 * - HC3 certificate (partial help)
 * - War Pension Exemption Certificate
 *
 * MEDICAL:
 * - Diabetes
 * - Glaucoma (or risk of glaucoma)
 * - Registered blind or partially sighted
 * - Family history of glaucoma (40+)
 */

import { db } from "../db/index.js";
import { nhsPatientExemptions, patients } from "../../shared/schema.js";
import { eq, and, or, gte, lte, desc } from "drizzle-orm";

export interface CreateExemptionData {
  companyId: string;
  patientId: string;
  exemptionReason: string;
  evidenceType?: string;
  evidenceNumber?: string;
  evidenceDocumentUrl?: string;
  validFrom: string;
  validUntil?: string;
  isLifelong?: boolean;
  notes?: string;
}

export interface VerifyExemptionData {
  exemptionId: string;
  verifiedBy: string;
}

export class NhsExemptionService {
  /**
   * Check if patient has valid exemption
   */
  static async checkExemption(patientId: string, companyId: string) {
    const today = new Date().toISOString().split("T")[0];

    // Get active exemptions
    const exemptions = await db
      .select()
      .from(nhsPatientExemptions)
      .where(
        and(
          eq(nhsPatientExemptions.patientId, patientId),
          eq(nhsPatientExemptions.companyId, companyId),
          eq(nhsPatientExemptions.isActive, true)
        )
      );

    // Filter valid exemptions
    const validExemptions = exemptions.filter((exemption) => {
      // Lifelong exemptions are always valid
      if (exemption.isLifelong) return true;

      // Check if still within validity period
      if (!exemption.validUntil) return true;

      return new Date(exemption.validUntil) >= new Date(today);
    });

    return {
      hasValidExemption: validExemptions.length > 0,
      exemptions: validExemptions,
      primaryExemption: validExemptions[0] || null,
    };
  }

  /**
   * Auto-detect exemptions based on patient data
   */
  static async autoDetectExemptions(patientId: string, companyId: string) {
    // Get patient
    const [patient] = await db
      .select()
      .from(patients)
      .where(and(eq(patients.id, patientId), eq(patients.companyId, companyId)))
      .limit(1);

    if (!patient) {
      throw new Error("Patient not found");
    }

    const detectedExemptions: string[] = [];

    // Age-based exemptions
    if (patient.dateOfBirth) {
      const age = this.calculateAge(patient.dateOfBirth);

      if (age < 16) {
        detectedExemptions.push("age_under_16");
      } else if (age >= 60) {
        detectedExemptions.push("age_60_plus");
      }
    }

    // Medical conditions (if stored in patient record)
    // This would typically be extracted from medical history
    const medicalHistory = patient.medicalHistory as any;
    if (medicalHistory) {
      if (medicalHistory.diabetes) {
        detectedExemptions.push("diabetes");
      }
      if (medicalHistory.glaucoma) {
        detectedExemptions.push("glaucoma");
      }
      if (medicalHistory.registeredBlind) {
        detectedExemptions.push("registered_blind");
      }
    }

    return {
      patientId,
      detectedExemptions,
      requiresManualVerification: detectedExemptions.length === 0,
    };
  }

  /**
   * Create exemption record
   */
  static async createExemption(data: CreateExemptionData) {
    const {
      companyId,
      patientId,
      exemptionReason,
      evidenceType,
      evidenceNumber,
      evidenceDocumentUrl,
      validFrom,
      validUntil,
      isLifelong,
      notes,
    } = data;

    // Validate exemption reason
    this.validateExemptionReason(exemptionReason as any);

    // Create exemption
    const [exemption] = await db
      .insert(nhsPatientExemptions)
      .values({
        companyId,
        patientId,
        exemptionReason: exemptionReason as any,
        evidenceType,
        evidenceNumber,
        evidenceDocumentUrl,
        validFrom,
        validUntil,
        isLifelong: isLifelong || false,
        notes,
        isActive: true,
      })
      .returning();

    return exemption;
  }

  /**
   * Verify exemption
   */
  static async verifyExemption(data: VerifyExemptionData) {
    const { exemptionId, verifiedBy } = data;

    const [exemption] = await db
      .update(nhsPatientExemptions)
      .set({
        verifiedBy,
        verifiedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(nhsPatientExemptions.id, exemptionId))
      .returning();

    return exemption;
  }

  /**
   * Get patient exemptions
   */
  static async getPatientExemptions(patientId: string, companyId: string) {
    const exemptions = await db
      .select()
      .from(nhsPatientExemptions)
      .where(
        and(
          eq(nhsPatientExemptions.patientId, patientId),
          eq(nhsPatientExemptions.companyId, companyId)
        )
      )
      .orderBy(desc(nhsPatientExemptions.validFrom));

    return exemptions;
  }

  /**
   * Get active exemptions
   */
  static async getActiveExemptions(companyId: string) {
    const exemptions = await db
      .select()
      .from(nhsPatientExemptions)
      .where(
        and(
          eq(nhsPatientExemptions.companyId, companyId),
          eq(nhsPatientExemptions.isActive, true)
        )
      )
      .orderBy(desc(nhsPatientExemptions.validFrom));

    return exemptions;
  }

  /**
   * Mark expired exemptions
   */
  static async markExpiredExemptions(companyId: string) {
    const today = new Date().toISOString().split("T")[0];

    const expiredExemptions = await db
      .update(nhsPatientExemptions)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(nhsPatientExemptions.companyId, companyId),
          eq(nhsPatientExemptions.isActive, true),
          eq(nhsPatientExemptions.isLifelong, false),
          lte(nhsPatientExemptions.validUntil, today)
        )
      )
      .returning();

    return expiredExemptions;
  }

  /**
   * Deactivate exemption
   */
  static async deactivateExemption(exemptionId: string, companyId: string, reason: string) {
    const [exemption] = await db
      .update(nhsPatientExemptions)
      .set({
        isActive: false,
        notes: reason,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(nhsPatientExemptions.id, exemptionId),
          eq(nhsPatientExemptions.companyId, companyId)
        )
      )
      .returning();

    return exemption;
  }

  /**
   * Get exemptions expiring soon
   */
  static async getExpiringExemptions(companyId: string, daysAhead: number = 30) {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + daysAhead);

    const todayStr = today.toISOString().split("T")[0];
    const futureDateStr = futureDate.toISOString().split("T")[0];

    const exemptions = await db
      .select()
      .from(nhsPatientExemptions)
      .where(
        and(
          eq(nhsPatientExemptions.companyId, companyId),
          eq(nhsPatientExemptions.isActive, true),
          eq(nhsPatientExemptions.isLifelong, false),
          gte(nhsPatientExemptions.validUntil, todayStr),
          lte(nhsPatientExemptions.validUntil, futureDateStr)
        )
      )
      .orderBy(nhsPatientExemptions.validUntil);

    return exemptions;
  }

  /**
   * Get exemption statistics
   */
  static async getExemptionStatistics(companyId: string) {
    const exemptions = await db
      .select()
      .from(nhsPatientExemptions)
      .where(eq(nhsPatientExemptions.companyId, companyId));

    const activeExemptions = exemptions.filter((e) => e.isActive);

    const stats = {
      totalExemptions: exemptions.length,
      activeExemptions: activeExemptions.length,
      inactiveExemptions: exemptions.length - activeExemptions.length,

      byReason: {
        age_under_16: activeExemptions.filter((e) => e.exemptionReason === "age_under_16").length,
        age_16_18_education: activeExemptions.filter(
          (e) => e.exemptionReason === "age_16_18_education"
        ).length,
        age_60_plus: activeExemptions.filter((e) => e.exemptionReason === "age_60_plus").length,
        income_support: activeExemptions.filter((e) => e.exemptionReason === "income_support")
          .length,
        jobseekers_allowance: activeExemptions.filter(
          (e) => e.exemptionReason === "jobseekers_allowance"
        ).length,
        pension_credit: activeExemptions.filter((e) => e.exemptionReason === "pension_credit")
          .length,
        universal_credit: activeExemptions.filter((e) => e.exemptionReason === "universal_credit")
          .length,
        hc2_certificate: activeExemptions.filter((e) => e.exemptionReason === "hc2_certificate")
          .length,
        hc3_certificate: activeExemptions.filter((e) => e.exemptionReason === "hc3_certificate")
          .length,
        diabetes: activeExemptions.filter((e) => e.exemptionReason === "diabetes").length,
        glaucoma: activeExemptions.filter((e) => e.exemptionReason === "glaucoma").length,
        registered_blind: activeExemptions.filter((e) => e.exemptionReason === "registered_blind")
          .length,
      },

      verifiedExemptions: activeExemptions.filter((e) => e.verifiedAt).length,
      unverifiedExemptions: activeExemptions.filter((e) => !e.verifiedAt).length,

      lifelongExemptions: activeExemptions.filter((e) => e.isLifelong).length,
      temporaryExemptions: activeExemptions.filter((e) => !e.isLifelong).length,
    };

    return stats;
  }

  /**
   * Validate exemption reason
   */
  private static validateExemptionReason(reason: string) {
    const validReasons = [
      "age_under_16",
      "age_16_18_education",
      "age_60_plus",
      "income_support",
      "jobseekers_allowance",
      "pension_credit",
      "universal_credit",
      "hc2_certificate",
      "hc3_certificate",
      "war_pension",
      "diabetes",
      "glaucoma",
      "registered_blind",
      "family_history_glaucoma",
    ];

    if (!validReasons.includes(reason)) {
      throw new Error(`Invalid exemption reason: ${reason}`);
    }
  }

  /**
   * Calculate patient age
   */
  private static calculateAge(dateOfBirth: string): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  /**
   * Get evidence requirements for exemption type
   */
  static getEvidenceRequirements(exemptionReason: string) {
    const requirements: Record<string, any> = {
      age_under_16: {
        required: true,
        type: "Birth certificate or passport",
        description: "Proof of age (under 16)",
      },
      age_16_18_education: {
        required: true,
        type: "Student ID or college letter",
        description: "Proof of full-time education",
      },
      age_60_plus: {
        required: false,
        type: "ID with date of birth",
        description: "Age verification (optional if DOB on record)",
      },
      income_support: {
        required: true,
        type: "Award letter",
        description: "Income Support award letter",
      },
      jobseekers_allowance: {
        required: true,
        type: "Award letter",
        description: "JSA award letter",
      },
      pension_credit: {
        required: true,
        type: "Award letter",
        description: "Pension Credit Guarantee Credit award letter",
      },
      universal_credit: {
        required: true,
        type: "Award letter",
        description: "Universal Credit award letter showing income",
      },
      hc2_certificate: {
        required: true,
        type: "HC2 certificate number",
        description: "Valid HC2 certificate (full help with health costs)",
      },
      hc3_certificate: {
        required: true,
        type: "HC3 certificate number",
        description: "Valid HC3 certificate (partial help with health costs)",
      },
      war_pension: {
        required: true,
        type: "War Pension Exemption Certificate",
        description: "Valid WPEC",
      },
      diabetes: {
        required: true,
        type: "Medical records or diagnosis letter",
        description: "Documented diabetes diagnosis",
      },
      glaucoma: {
        required: true,
        type: "Medical records or diagnosis letter",
        description: "Documented glaucoma or ocular hypertension diagnosis",
      },
      registered_blind: {
        required: true,
        type: "CVI (Certificate of Vision Impairment)",
        description: "Registered blind or partially sighted",
      },
      family_history_glaucoma: {
        required: false,
        type: "Family history documentation",
        description: "Parent, sibling, or child with glaucoma (patient must be 40+)",
      },
    };

    return requirements[exemptionReason] || { required: false, type: "Unknown", description: "" };
  }
}
