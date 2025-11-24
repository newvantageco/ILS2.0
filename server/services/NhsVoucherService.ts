/**
 * NHS Voucher Service
 *
 * Handles NHS optical vouchers for glasses and contact lenses.
 * Manages voucher eligibility checking, calculation, issuance, and redemption.
 *
 * NHS Voucher Types (2024 values):
 * - A: Single vision - £39.30
 * - B: Single vision (high power/prism) - £64.25
 * - C: Bifocal - £66.25
 * - D: Bifocal (high power/prism) - £91.20
 * - E: Tinted/photochromic - £65.45
 * - F: Small frame - Additional £7.60
 * - G: Prism-controlled bifocals - £91.20
 * - H: Tinted (medical condition) - £189.70
 *
 * Eligibility Criteria:
 * - Under 16
 * - 16-18 in full-time education
 * - 60+
 * - Receiving benefits (UC, JSA, etc.)
 * - HC2 certificate holder
 * - Diabetes, glaucoma, or registered blind
 */

import { db } from "../../db/index.js";
import { nhsVouchers, nhsPatientExemptions, prescriptions } from "../../shared/schema.js";
import { eq, and, gte, lte, desc } from "drizzle-orm";

// NHS voucher values (as of 2024)
const VOUCHER_VALUES = {
  A: 39.30,
  B: 64.25,
  C: 66.25,
  D: 91.20,
  E: 65.45,
  F: 7.60, // Supplement
  G: 91.20,
  H: 189.70,
};

// Thresholds for high power (Type B/D)
const HIGH_POWER_THRESHOLDS = {
  sphere: 10.0, // ±10.00D
  cylinder: 6.0, // ±6.00D
  prism: 3.0, // Total prism 3Δ or more
};

export interface VoucherEligibilityCheck {
  patientId: string;
  companyId: string;
  dateOfBirth?: string;
  isStudent?: boolean;
}

export interface VoucherCalculation {
  prescriptionId: string;
  companyId: string;
  patientId: string;
  exemptionReason: string;
  requiresTint?: boolean;
  requiresMedicalTint?: boolean;
}

export interface CreateVoucherData {
  companyId: string;
  patientId: string;
  prescriptionId?: string;
  claimId?: string;
  voucherType: "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H";
  exemptionReason: string;
  exemptionEvidence?: string;
  sphereOD?: number;
  sphereOS?: number;
  cylinderOD?: number;
  cylinderOS?: number;
  prismRequired?: boolean;
  tintRequired?: boolean;
}

export class NhsVoucherService {
  /**
   * Check if patient is eligible for NHS voucher
   */
  static async checkEligibility(data: VoucherEligibilityCheck) {
    const { patientId, companyId, dateOfBirth, isStudent } = data;

    const eligibilityReasons: string[] = [];

    // Check age-based eligibility
    if (dateOfBirth) {
      const age = this.calculateAge(dateOfBirth);

      if (age < 16) {
        eligibilityReasons.push("age_under_16");
      } else if (age >= 16 && age < 19 && isStudent) {
        eligibilityReasons.push("age_16_18_education");
      } else if (age >= 60) {
        eligibilityReasons.push("age_60_plus");
      }
    }

    // Check for registered exemptions
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

    for (const exemption of exemptions) {
      // Check if exemption is still valid
      if (exemption.validUntil && new Date(exemption.validUntil) < new Date()) {
        continue;
      }

      eligibilityReasons.push(exemption.exemptionReason);
    }

    return {
      isEligible: eligibilityReasons.length > 0,
      eligibilityReasons,
      exemptions,
    };
  }

  /**
   * Calculate appropriate voucher type based on prescription
   */
  static async calculateVoucherType(data: VoucherCalculation) {
    const { prescriptionId, requiresTint, requiresMedicalTint } = data;

    // Get prescription
    const [prescription] = await db
      .select()
      .from(prescriptions)
      .where(eq(prescriptions.id, prescriptionId))
      .limit(1);

    if (!prescription) {
      throw new Error("Prescription not found");
    }

    // Extract prescription values
    const sphereOD = parseFloat(prescription.odSphere || "0");
    const sphereOS = parseFloat(prescription.osSphere || "0");
    const cylinderOD = parseFloat(prescription.odCylinder || "0");
    const cylinderOS = parseFloat(prescription.osCylinder || "0");
    const addOD = parseFloat(prescription.odAdd || "0");
    const addOS = parseFloat(prescription.osAdd || "0");
    // Calculate total prism from horizontal and vertical components
    const prismOD = Math.sqrt(
      Math.pow(parseFloat(prescription.odPrismHorizontal || "0"), 2) +
      Math.pow(parseFloat(prescription.odPrismVertical || "0"), 2)
    );
    const prismOS = Math.sqrt(
      Math.pow(parseFloat(prescription.osPrismHorizontal || "0"), 2) +
      Math.pow(parseFloat(prescription.osPrismVertical || "0"), 2)
    );

    // Check if high power
    const isHighPower =
      Math.abs(sphereOD) >= HIGH_POWER_THRESHOLDS.sphere ||
      Math.abs(sphereOS) >= HIGH_POWER_THRESHOLDS.sphere ||
      Math.abs(cylinderOD) >= HIGH_POWER_THRESHOLDS.cylinder ||
      Math.abs(cylinderOS) >= HIGH_POWER_THRESHOLDS.cylinder;

    // Check if prism required
    const isPrismRequired = prismOD + prismOS >= HIGH_POWER_THRESHOLDS.prism;

    // Check if bifocal/varifocal (has add power)
    const isBifocal = addOD > 0 || addOS > 0;

    // Determine voucher type
    let voucherType: "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H";
    const hasSmallFrameSupplement = false;

    if (requiresMedicalTint) {
      voucherType = "H"; // Tinted for medical condition
    } else if (requiresTint) {
      voucherType = "E"; // Standard tinted/photochromic
    } else if (isBifocal && isPrismRequired) {
      voucherType = "G"; // Prism-controlled bifocals
    } else if (isBifocal && isHighPower) {
      voucherType = "D"; // Bifocal high power
    } else if (isBifocal) {
      voucherType = "C"; // Standard bifocal
    } else if (isHighPower || isPrismRequired) {
      voucherType = "B"; // Single vision high power
    } else {
      voucherType = "A"; // Standard single vision
    }

    // Check for small frame supplement (usually for children)
    // Small frame: lens diameter < 40mm
    // This would be determined during dispensing

    const voucherValue = VOUCHER_VALUES[voucherType];

    return {
      voucherType,
      voucherValue,
      hasSmallFrameSupplement,
      smallFrameSupplementValue: hasSmallFrameSupplement ? VOUCHER_VALUES.F : 0,
      totalValue: voucherValue + (hasSmallFrameSupplement ? VOUCHER_VALUES.F : 0),
      prescription: {
        sphereOD,
        sphereOS,
        cylinderOD,
        cylinderOS,
        addOD,
        addOS,
        prismOD,
        prismOS,
      },
      criteria: {
        isHighPower,
        isPrismRequired,
        isBifocal,
        requiresTint,
        requiresMedicalTint,
      },
    };
  }

  /**
   * Create NHS voucher
   */
  static async createVoucher(data: CreateVoucherData) {
    const {
      companyId,
      patientId,
      prescriptionId,
      claimId,
      voucherType,
      exemptionReason,
      exemptionEvidence,
      sphereOD,
      sphereOS,
      cylinderOD,
      cylinderOS,
      prismRequired,
      tintRequired,
    } = data;

    // Generate voucher number
    const voucherNumber = await this.generateVoucherNumber(companyId);

    // Get voucher value
    const voucherValue = VOUCHER_VALUES[voucherType];

    // Set issue and expiry dates
    const issueDate = new Date().toISOString().split("T")[0];
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 3); // Valid for 3 months
    const expiryDateStr = expiryDate.toISOString().split("T")[0];

    // Create voucher
    const [voucher] = await db
      .insert(nhsVouchers)
      .values({
        companyId,
        patientId,
        prescriptionId,
        claimId,
        voucherType,
        voucherNumber,
        voucherValue: voucherValue.toString(),
        issueDate,
        expiryDate: expiryDateStr,
        exemptionReason: exemptionReason as any,
        exemptionEvidence,
        sphereOD: sphereOD?.toString(),
        sphereOS: sphereOS?.toString(),
        cylinderOD: cylinderOD?.toString(),
        cylinderOS: cylinderOS?.toString(),
        prismRequired,
        tintRequired,
        status: "active",
      })
      .returning();

    return voucher;
  }

  /**
   * Generate unique voucher number
   * Format: VCH-{COMPANY_PREFIX}-{YYYYMMDD}-{SEQUENCE}
   */
  private static async generateVoucherNumber(companyId: string): Promise<string> {
    const date = new Date().toISOString().split("T")[0].replace(/-/g, "");
    const prefix = companyId.substring(0, 4).toUpperCase();
    const sequence = Math.floor(Math.random() * 9999)
      .toString()
      .padStart(4, "0");

    return `VCH-${prefix}-${date}-${sequence}`;
  }

  /**
   * Redeem voucher
   */
  static async redeemVoucher(
    voucherId: string,
    companyId: string,
    redemptionData: {
      redeemedAmount: number;
      patientContribution?: number;
      hasComplexSupplement?: boolean;
      supplementAmount?: number;
      supplementReason?: string;
    }
  ) {
    // Get voucher
    const [voucher] = await db
      .select()
      .from(nhsVouchers)
      .where(and(eq(nhsVouchers.id, voucherId), eq(nhsVouchers.companyId, companyId)))
      .limit(1);

    if (!voucher) {
      throw new Error("Voucher not found");
    }

    if (voucher.status !== "active") {
      throw new Error(`Voucher is ${voucher.status} and cannot be redeemed`);
    }

    // Check expiry
    const expiryDate = new Date(voucher.expiryDate);
    if (expiryDate < new Date()) {
      throw new Error("Voucher has expired");
    }

    // Update voucher
    const [updatedVoucher] = await db
      .update(nhsVouchers)
      .set({
        isRedeemed: true,
        redeemedAt: new Date(),
        status: "redeemed",
        redeemedAmount: redemptionData.redeemedAmount.toString(),
        patientContribution: redemptionData.patientContribution?.toString(),
        hasComplexSupplement: redemptionData.hasComplexSupplement,
        supplementAmount: redemptionData.supplementAmount?.toString(),
        supplementReason: redemptionData.supplementReason,
        updatedAt: new Date(),
      })
      .where(eq(nhsVouchers.id, voucherId))
      .returning();

    return updatedVoucher;
  }

  /**
   * Get voucher by ID
   */
  static async getVoucherById(voucherId: string, companyId: string) {
    const [voucher] = await db
      .select()
      .from(nhsVouchers)
      .where(and(eq(nhsVouchers.id, voucherId), eq(nhsVouchers.companyId, companyId)))
      .limit(1);

    return voucher;
  }

  /**
   * Get patient vouchers
   */
  static async getPatientVouchers(patientId: string, companyId: string) {
    const vouchers = await db
      .select()
      .from(nhsVouchers)
      .where(and(eq(nhsVouchers.patientId, patientId), eq(nhsVouchers.companyId, companyId)))
      .orderBy(desc(nhsVouchers.issueDate));

    return vouchers;
  }

  /**
   * Get active vouchers for a patient
   */
  static async getActiveVouchers(patientId: string, companyId: string) {
    const today = new Date().toISOString().split("T")[0];

    const vouchers = await db
      .select()
      .from(nhsVouchers)
      .where(
        and(
          eq(nhsVouchers.patientId, patientId),
          eq(nhsVouchers.companyId, companyId),
          eq(nhsVouchers.status, "active"),
          gte(nhsVouchers.expiryDate, today)
        )
      )
      .orderBy(desc(nhsVouchers.issueDate));

    return vouchers;
  }

  /**
   * Mark expired vouchers
   */
  static async markExpiredVouchers(companyId: string) {
    const today = new Date().toISOString().split("T")[0];

    const expiredVouchers = await db
      .update(nhsVouchers)
      .set({
        status: "expired",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(nhsVouchers.companyId, companyId),
          eq(nhsVouchers.status, "active"),
          lte(nhsVouchers.expiryDate, today)
        )
      )
      .returning();

    return expiredVouchers;
  }

  /**
   * Cancel voucher
   */
  static async cancelVoucher(voucherId: string, companyId: string, reason: string) {
    const [voucher] = await db
      .update(nhsVouchers)
      .set({
        status: "cancelled",
        metadata: { cancellationReason: reason },
        updatedAt: new Date(),
      })
      .where(and(eq(nhsVouchers.id, voucherId), eq(nhsVouchers.companyId, companyId)))
      .returning();

    return voucher;
  }

  /**
   * Get voucher statistics
   */
  static async getVoucherStatistics(companyId: string, startDate: string, endDate: string) {
    const vouchers = await db
      .select()
      .from(nhsVouchers)
      .where(
        and(
          eq(nhsVouchers.companyId, companyId),
          gte(nhsVouchers.issueDate, startDate),
          lte(nhsVouchers.issueDate, endDate)
        )
      );

    const stats = {
      totalVouchers: vouchers.length,
      activeVouchers: vouchers.filter((v: any) => v.status === "active").length,
      redeemedVouchers: vouchers.filter((v: any) => v.status === "redeemed").length,
      expiredVouchers: vouchers.filter((v: any) => v.status === "expired").length,
      cancelledVouchers: vouchers.filter((v: any) => v.status === "cancelled").length,

      totalValue: vouchers.reduce((sum: any, v: any) => sum + parseFloat(v.voucherValue), 0),
      totalRedeemed: vouchers
        .filter((v: any) => v.isRedeemed)
        .reduce((sum: any, v: any) => sum + parseFloat(v.redeemedAmount || "0"), 0),
      totalPatientContribution: vouchers
        .filter((v: any) => v.isRedeemed)
        .reduce((sum: any, v: any) => sum + parseFloat(v.patientContribution || "0"), 0),

      vouchersByType: {
        A: vouchers.filter((v: any) => v.voucherType === "A").length,
        B: vouchers.filter((v: any) => v.voucherType === "B").length,
        C: vouchers.filter((v: any) => v.voucherType === "C").length,
        D: vouchers.filter((v: any) => v.voucherType === "D").length,
        E: vouchers.filter((v: any) => v.voucherType === "E").length,
        F: vouchers.filter((v: any) => v.voucherType === "F").length,
        G: vouchers.filter((v: any) => v.voucherType === "G").length,
        H: vouchers.filter((v: any) => v.voucherType === "H").length,
      },

      redemptionRate:
        vouchers.length > 0
          ? ((vouchers.filter((v: any) => v.isRedeemed).length / vouchers.length) * 100).toFixed(1)
          : 0,
    };

    return stats;
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
}
