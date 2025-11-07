/**
 * Contact Lens Service
 *
 * Comprehensive contact lens management system handling:
 * - Patient assessments for CL suitability
 * - Trial lens fittings
 * - CL prescriptions
 * - Aftercare and follow-ups
 * - Inventory management
 * - NHS funding integration
 */

import { db } from "../db/index.js";
import {
  contactLensAssessments,
  contactLensFittings,
  contactLensPrescriptions,
  contactLensAftercare,
  contactLensInventory,
  contactLensOrders,
  nhsPatientExemptions,
  patients,
  users,
} from "../../shared/schema.js";
import { eq, and, gte, lte, desc, sql, or } from "drizzle-orm";

export interface CreateAssessmentData {
  companyId: string;
  patientId: string;
  practitionerId: string;
  assessmentDate: string;
  previousClWearer: boolean;
  previousClType?: string;
  reasonForDiscontinuation?: string;
  motivationReason?: string;
  occupation?: string;
  hobbies?: string;
  screenTime?: string;
  dryEyes?: boolean;
  allergies?: string;
  medications?: string;
  contraindications?: string;
  tearQuality?: string;
  tearBreakupTime?: number;
  corneaCondition?: string;
  conjunctivaCondition?: string;
  lidsCondition?: string;
  suitable: boolean;
  recommendedLensType?: string;
  recommendedWearingSchedule?: string;
  notes?: string;
}

export interface CreateFittingData {
  companyId: string;
  patientId: string;
  assessmentId?: string;
  practitionerId: string;
  fittingDate: string;
  eye: string; // OD or OS
  trialLensBrand: string;
  trialLensType: string;
  trialBaseCurve?: number;
  trialDiameter?: number;
  trialPower?: number;
  trialCylinder?: number;
  trialAxis?: number;
  trialAddition?: number;
  overRefractionSphere?: number;
  overRefractionCylinder?: number;
  overRefractionAxis?: number;
  centration?: string;
  movement?: string;
  coverage?: string;
  comfort?: string;
  fitAssessment: string;
  distanceVision?: string;
  nearVision?: string;
  finalBaseCurve?: number;
  finalDiameter?: number;
  finalPower?: number;
  finalCylinder?: number;
  finalAxis?: number;
  finalAddition?: number;
  insertionTaught?: boolean;
  removalTaught?: boolean;
  careTaught?: boolean;
  patientDemonstrated?: boolean;
  notes?: string;
}

export interface CreatePrescriptionData {
  companyId: string;
  patientId: string;
  fittingId?: string;
  practitionerId: string;
  prescriptionDate: string;
  expiryDate?: string;
  // Right Eye
  odBrand: string;
  odLensType: string;
  odDesign: string;
  odBaseCurve: number;
  odDiameter: number;
  odPower: number;
  odCylinder?: number;
  odAxis?: number;
  odAddition?: number;
  odColor?: string;
  // Left Eye
  osBrand: string;
  osLensType: string;
  osDesign: string;
  osBaseCurve: number;
  osDiameter: number;
  osPower: number;
  osCylinder?: number;
  osAxis?: number;
  osAddition?: number;
  osColor?: string;
  // Wearing Instructions
  wearingSchedule: string;
  replacementSchedule: string;
  maxWearingTime?: number;
  careSystemBrand?: string;
  careSystemType?: string;
  firstFollowUpDate?: string;
  weekFollowUpDate?: string;
  monthFollowUpDate?: string;
  specialInstructions?: string;
  notes?: string;
  nhsFunded?: boolean;
  nhsExemptionId?: string;
}

export class ContactLensService {
  /**
   * Create contact lens assessment
   */
  static async createAssessment(data: CreateAssessmentData) {
    const [assessment] = await db
      .insert(contactLensAssessments)
      .values({
        ...data,
        tearBreakupTime: data.tearBreakupTime?.toString(),
        recommendedLensType: data.recommendedLensType as any,
        recommendedWearingSchedule: data.recommendedWearingSchedule as any,
      })
      .returning();

    return assessment;
  }

  /**
   * Get patient assessments
   */
  static async getPatientAssessments(patientId: string, companyId: string) {
    const assessments = await db
      .select()
      .from(contactLensAssessments)
      .where(
        and(
          eq(contactLensAssessments.patientId, patientId),
          eq(contactLensAssessments.companyId, companyId)
        )
      )
      .orderBy(desc(contactLensAssessments.assessmentDate));

    return assessments;
  }

  /**
   * Get latest assessment for patient
   */
  static async getLatestAssessment(patientId: string, companyId: string) {
    const [assessment] = await db
      .select()
      .from(contactLensAssessments)
      .where(
        and(
          eq(contactLensAssessments.patientId, patientId),
          eq(contactLensAssessments.companyId, companyId)
        )
      )
      .orderBy(desc(contactLensAssessments.assessmentDate))
      .limit(1);

    return assessment;
  }

  /**
   * Create fitting record
   */
  static async createFitting(data: CreateFittingData) {
    const [fitting] = await db
      .insert(contactLensFittings)
      .values({
        ...data,
        trialLensType: data.trialLensType as any,
        fitAssessment: data.fitAssessment as any,
        trialBaseCurve: data.trialBaseCurve?.toString(),
        trialDiameter: data.trialDiameter?.toString(),
        trialPower: data.trialPower?.toString(),
        trialCylinder: data.trialCylinder?.toString(),
        trialAddition: data.trialAddition?.toString(),
        overRefractionSphere: data.overRefractionSphere?.toString(),
        overRefractionCylinder: data.overRefractionCylinder?.toString(),
        finalBaseCurve: data.finalBaseCurve?.toString(),
        finalDiameter: data.finalDiameter?.toString(),
        finalPower: data.finalPower?.toString(),
        finalCylinder: data.finalCylinder?.toString(),
        finalAddition: data.finalAddition?.toString(),
      })
      .returning();

    return fitting;
  }

  /**
   * Get patient fittings
   */
  static async getPatientFittings(patientId: string, companyId: string) {
    const fittings = await db
      .select()
      .from(contactLensFittings)
      .where(
        and(
          eq(contactLensFittings.patientId, patientId),
          eq(contactLensFittings.companyId, companyId)
        )
      )
      .orderBy(desc(contactLensFittings.fittingDate));

    return fittings;
  }

  /**
   * Create contact lens prescription
   */
  static async createPrescription(data: CreatePrescriptionData) {
    // Calculate expiry date if not provided (12 months from prescription date)
    const expiryDate = data.expiryDate || this.calculateExpiryDate(data.prescriptionDate);

    // Calculate follow-up dates if not provided
    const followUpDates = this.calculateFollowUpDates(data.prescriptionDate);

    const [prescription] = await db
      .insert(contactLensPrescriptions)
      .values({
        ...data,
        expiryDate,
        firstFollowUpDate: data.firstFollowUpDate || followUpDates.firstFollowUp,
        weekFollowUpDate: data.weekFollowUpDate || followUpDates.weekFollowUp,
        monthFollowUpDate: data.monthFollowUpDate || followUpDates.monthFollowUp,
        odLensType: data.odLensType as any,
        odDesign: data.odDesign as any,
        odBaseCurve: data.odBaseCurve.toString(),
        odDiameter: data.odDiameter.toString(),
        odPower: data.odPower.toString(),
        odCylinder: data.odCylinder?.toString(),
        odAddition: data.odAddition?.toString(),
        osLensType: data.osLensType as any,
        osDesign: data.osDesign as any,
        osBaseCurve: data.osBaseCurve.toString(),
        osDiameter: data.osDiameter.toString(),
        osPower: data.osPower.toString(),
        osCylinder: data.osCylinder?.toString(),
        osAddition: data.osAddition?.toString(),
        wearingSchedule: data.wearingSchedule as any,
        replacementSchedule: data.replacementSchedule as any,
        nhsFunded: data.nhsFunded || false,
      })
      .returning();

    // Auto-create aftercare appointments
    if (prescription.firstFollowUpDate) {
      await this.createAftercareAppointment({
        companyId: data.companyId,
        patientId: data.patientId,
        prescriptionId: prescription.id,
        practitionerId: data.practitionerId,
        appointmentDate: prescription.firstFollowUpDate,
        appointmentType: "initial",
      });
    }

    if (prescription.weekFollowUpDate) {
      await this.createAftercareAppointment({
        companyId: data.companyId,
        patientId: data.patientId,
        prescriptionId: prescription.id,
        practitionerId: data.practitionerId,
        appointmentDate: prescription.weekFollowUpDate,
        appointmentType: "routine",
      });
    }

    if (prescription.monthFollowUpDate) {
      await this.createAftercareAppointment({
        companyId: data.companyId,
        patientId: data.patientId,
        prescriptionId: prescription.id,
        practitionerId: data.practitionerId,
        appointmentDate: prescription.monthFollowUpDate,
        appointmentType: "routine",
      });
    }

    return prescription;
  }

  /**
   * Get patient prescriptions
   */
  static async getPatientPrescriptions(patientId: string, companyId: string) {
    const prescriptions = await db
      .select()
      .from(contactLensPrescriptions)
      .where(
        and(
          eq(contactLensPrescriptions.patientId, patientId),
          eq(contactLensPrescriptions.companyId, companyId)
        )
      )
      .orderBy(desc(contactLensPrescriptions.prescriptionDate));

    return prescriptions;
  }

  /**
   * Get active prescription for patient
   */
  static async getActivePrescription(patientId: string, companyId: string) {
    const today = new Date().toISOString().split("T")[0];

    const [prescription] = await db
      .select()
      .from(contactLensPrescriptions)
      .where(
        and(
          eq(contactLensPrescriptions.patientId, patientId),
          eq(contactLensPrescriptions.companyId, companyId),
          eq(contactLensPrescriptions.isActive, true),
          or(
            sql`${contactLensPrescriptions.expiryDate} IS NULL`,
            gte(contactLensPrescriptions.expiryDate, today)
          )
        )
      )
      .orderBy(desc(contactLensPrescriptions.prescriptionDate))
      .limit(1);

    return prescription;
  }

  /**
   * Deactivate prescription
   */
  static async deactivatePrescription(prescriptionId: string, companyId: string) {
    const [prescription] = await db
      .update(contactLensPrescriptions)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(contactLensPrescriptions.id, prescriptionId),
          eq(contactLensPrescriptions.companyId, companyId)
        )
      )
      .returning();

    return prescription;
  }

  /**
   * Create aftercare appointment
   */
  static async createAftercareAppointment(data: {
    companyId: string;
    patientId: string;
    prescriptionId: string;
    practitionerId: string;
    appointmentDate: string;
    appointmentType: string;
  }) {
    const [aftercare] = await db
      .insert(contactLensAftercare)
      .values({
        ...data,
        status: "scheduled",
      } as any)
      .returning();

    return aftercare;
  }

  /**
   * Update aftercare record (after appointment)
   */
  static async updateAftercare(
    aftercareId: string,
    companyId: string,
    data: Partial<{
      status: string;
      wearingTimeCompliance: string;
      replacementCompliance: string;
      careSystemCompliance: string;
      sleepingInLenses: boolean;
      waterExposure: boolean;
      visualAcuityOD: string;
      visualAcuityOS: string;
      comfort: string;
      lensConditionOD: string;
      lensConditionOS: string;
      fitAssessmentOD: string;
      fitAssessmentOS: string;
      corneaHealthOD: string;
      corneaHealthOS: string;
      conjunctivaHealthOD: string;
      conjunctivaHealthOS: string;
      problemsReported: string;
      adverseEvents: string;
      prescriptionChanged: boolean;
      lensesReplaced: boolean;
      careSystemChanged: boolean;
      additionalTraining: boolean;
      referralMade: boolean;
      nextAppointmentDate: string;
      nextAppointmentReason: string;
      notes: string;
    }>
  ) {
    const [aftercare] = await db
      .update(contactLensAftercare)
      .set({
        ...data,
        fitAssessmentOD: data.fitAssessmentOD as any,
        fitAssessmentOS: data.fitAssessmentOS as any,
        status: data.status as any,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(contactLensAftercare.id, aftercareId),
          eq(contactLensAftercare.companyId, companyId)
        )
      )
      .returning();

    // If next appointment scheduled, create it
    if (data.nextAppointmentDate && aftercare.prescriptionId) {
      await this.createAftercareAppointment({
        companyId,
        patientId: aftercare.patientId,
        prescriptionId: aftercare.prescriptionId,
        practitionerId: aftercare.practitionerId!,
        appointmentDate: data.nextAppointmentDate,
        appointmentType: data.nextAppointmentReason || "routine",
      });
    }

    return aftercare;
  }

  /**
   * Get patient aftercare appointments
   */
  static async getPatientAftercare(patientId: string, companyId: string) {
    const aftercare = await db
      .select()
      .from(contactLensAftercare)
      .where(
        and(
          eq(contactLensAftercare.patientId, patientId),
          eq(contactLensAftercare.companyId, companyId)
        )
      )
      .orderBy(desc(contactLensAftercare.appointmentDate));

    return aftercare;
  }

  /**
   * Get upcoming aftercare appointments
   */
  static async getUpcomingAftercare(companyId: string, daysAhead: number = 30) {
    const today = new Date().toISOString().split("T")[0];
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    const futureDateStr = futureDate.toISOString().split("T")[0];

    const appointments = await db
      .select()
      .from(contactLensAftercare)
      .where(
        and(
          eq(contactLensAftercare.companyId, companyId),
          eq(contactLensAftercare.status, "scheduled"),
          gte(contactLensAftercare.appointmentDate, today),
          lte(contactLensAftercare.appointmentDate, futureDateStr)
        )
      )
      .orderBy(contactLensAftercare.appointmentDate);

    return appointments;
  }

  /**
   * Get inventory item by parameters
   */
  static async findInventoryItem(
    companyId: string,
    brand: string,
    baseCurve: number,
    diameter: number,
    power: number,
    cylinder?: number,
    axis?: number,
    addition?: number
  ) {
    const conditions = [
      eq(contactLensInventory.companyId, companyId),
      eq(contactLensInventory.brand, brand),
      sql`${contactLensInventory.baseCurve} = ${baseCurve.toString()}`,
      sql`${contactLensInventory.diameter} = ${diameter.toString()}`,
      sql`${contactLensInventory.power} = ${power.toString()}`,
      eq(contactLensInventory.isActive, true),
    ];

    if (cylinder !== undefined) {
      conditions.push(sql`${contactLensInventory.cylinder} = ${cylinder.toString()}`);
    }
    if (axis !== undefined) {
      conditions.push(eq(contactLensInventory.axis, axis));
    }
    if (addition !== undefined) {
      conditions.push(sql`${contactLensInventory.addition} = ${addition.toString()}`);
    }

    const [item] = await db
      .select()
      .from(contactLensInventory)
      .where(and(...conditions))
      .limit(1);

    return item;
  }

  /**
   * Get low stock items
   */
  static async getLowStockItems(companyId: string) {
    const items = await db
      .select()
      .from(contactLensInventory)
      .where(
        and(
          eq(contactLensInventory.companyId, companyId),
          eq(contactLensInventory.isActive, true),
          sql`${contactLensInventory.quantityInStock} <= ${contactLensInventory.reorderLevel}`
        )
      )
      .orderBy(contactLensInventory.quantityInStock);

    return items;
  }

  /**
   * Update inventory stock
   */
  static async updateInventoryStock(
    inventoryId: string,
    companyId: string,
    quantityChange: number
  ) {
    const [item] = await db
      .update(contactLensInventory)
      .set({
        quantityInStock: sql`${contactLensInventory.quantityInStock} + ${quantityChange}`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(contactLensInventory.id, inventoryId),
          eq(contactLensInventory.companyId, companyId)
        )
      )
      .returning();

    return item;
  }

  /**
   * Get contact lens statistics
   */
  static async getStatistics(companyId: string, startDate: string, endDate: string) {
    const prescriptions = await db
      .select()
      .from(contactLensPrescriptions)
      .where(
        and(
          eq(contactLensPrescriptions.companyId, companyId),
          gte(contactLensPrescriptions.prescriptionDate, startDate),
          lte(contactLensPrescriptions.prescriptionDate, endDate)
        )
      );

    const aftercare = await db
      .select()
      .from(contactLensAftercare)
      .where(
        and(
          eq(contactLensAftercare.companyId, companyId),
          gte(contactLensAftercare.appointmentDate, startDate),
          lte(contactLensAftercare.appointmentDate, endDate)
        )
      );

    return {
      totalPrescriptions: prescriptions.length,
      activePrescriptions: prescriptions.filter((p) => p.isActive).length,
      nhsFundedPrescriptions: prescriptions.filter((p) => p.nhsFunded).length,

      lensTypeBreakdown: {
        soft: prescriptions.filter((p) => p.odLensType === "soft").length,
        rgp: prescriptions.filter((p) => p.odLensType === "rigid_gas_permeable").length,
        hybrid: prescriptions.filter((p) => p.odLensType === "hybrid").length,
        scleral: prescriptions.filter((p) => p.odLensType === "scleral").length,
      },

      designBreakdown: {
        spherical: prescriptions.filter((p) => p.odDesign === "spherical").length,
        toric: prescriptions.filter((p) => p.odDesign === "toric").length,
        multifocal: prescriptions.filter((p) => p.odDesign === "multifocal").length,
        monovision: prescriptions.filter((p) => p.odDesign === "monovision").length,
      },

      replacementScheduleBreakdown: {
        daily: prescriptions.filter((p) => p.replacementSchedule === "daily_disposable").length,
        twoWeekly: prescriptions.filter((p) => p.replacementSchedule === "two_weekly").length,
        monthly: prescriptions.filter((p) => p.replacementSchedule === "monthly").length,
        quarterly: prescriptions.filter((p) => p.replacementSchedule === "quarterly").length,
        yearly: prescriptions.filter((p) => p.replacementSchedule === "yearly").length,
      },

      aftercareStats: {
        totalAppointments: aftercare.length,
        completed: aftercare.filter((a) => a.status === "scheduled").length,
        noShows: aftercare.filter((a) => a.status === "no_show").length,
        problemReports: aftercare.filter((a) => a.problemsReported).length,
        prescriptionChanges: aftercare.filter((a) => a.prescriptionChanged).length,
      },
    };
  }

  /**
   * Helper: Calculate expiry date (12 months from prescription)
   */
  private static calculateExpiryDate(prescriptionDate: string): string {
    const date = new Date(prescriptionDate);
    date.setFullYear(date.getFullYear() + 1);
    return date.toISOString().split("T")[0];
  }

  /**
   * Helper: Calculate follow-up dates
   */
  private static calculateFollowUpDates(prescriptionDate: string) {
    const baseDate = new Date(prescriptionDate);

    // First follow-up: 1 day
    const firstFollowUp = new Date(baseDate);
    firstFollowUp.setDate(firstFollowUp.getDate() + 1);

    // Week follow-up: 7 days
    const weekFollowUp = new Date(baseDate);
    weekFollowUp.setDate(weekFollowUp.getDate() + 7);

    // Month follow-up: 30 days
    const monthFollowUp = new Date(baseDate);
    monthFollowUp.setDate(monthFollowUp.getDate() + 30);

    return {
      firstFollowUp: firstFollowUp.toISOString().split("T")[0],
      weekFollowUp: weekFollowUp.toISOString().split("T")[0],
      monthFollowUp: monthFollowUp.toISOString().split("T")[0],
    };
  }

  /**
   * Check NHS eligibility for contact lenses
   */
  static async checkNhsEligibility(patientId: string, companyId: string) {
    // Get patient exemptions
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

    // Contact lenses are NHS-funded for specific medical conditions
    const eligibleReasons = ["diabetes", "glaucoma", "registered_blind"];

    const eligibleExemptions = exemptions.filter((e) =>
      eligibleReasons.includes(e.exemptionReason)
    );

    return {
      isEligible: eligibleExemptions.length > 0,
      exemptions: eligibleExemptions,
      reason:
        eligibleExemptions.length > 0
          ? "Medical condition qualifies for NHS-funded contact lenses"
          : "No qualifying medical conditions",
    };
  }
}
