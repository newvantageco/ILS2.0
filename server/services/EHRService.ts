/**
 * EHR Service - Electronic Health Records Management
 * 
 * Comprehensive service for managing patient medical records, medications,
 * allergies, clinical notes, vital signs, immunizations, and lab results.
 * 
 * Features:
 * - Medical record management with audit trail
 * - Medication prescribing and tracking
 * - Allergy documentation and alerts
 * - Clinical note creation with SOAP structure
 * - Vital signs tracking and interpretation
 * - Immunization records and schedules
 * - Lab result management and interpretation
 * - HIPAA-compliant data handling
 * - Multi-tenant data isolation
 */

import { db } from "../db";
import { eq, and, desc, asc, ilike, gte, lte, inArray } from "drizzle-orm";
import * as schema from "@shared/schema";
import logger from "../utils/logger";
import { z } from "zod";

// Types for EHR operations
export interface MedicalRecordData {
  patientId: string;
  practitionerId?: string;
  primaryDiagnosis?: string;
  secondaryDiagnoses?: any[];
  chiefComplaint?: string;
  historyOfPresentIllness?: string;
  pastMedicalHistory?: any;
  surgicalHistory?: any;
  familyHistory?: any;
  socialHistory?: any;
  externalId?: string;
  sourceSystem?: string;
}

export interface MedicationData {
  patientId: string;
  practitionerId?: string;
  medicationName: string;
  genericName?: string;
  ndcCode?: string;
  dosage: string;
  route: string;
  frequency: string;
  instructions?: string;
  startDate?: Date;
  endDate?: Date;
  reason?: string;
  quantity?: number;
  refills?: number;
  pharmacy?: string;
  externalPrescriptionId?: string;
}

export interface AllergyData {
  patientId: string;
  practitionerId?: string;
  allergen: string;
  allergenType: string;
  severity: "mild" | "moderate" | "severe" | "life_threatening";
  reaction: string;
  onsetDate?: Date;
  notes?: string;
}

export interface ClinicalNoteData {
  patientId: string;
  practitionerId?: string;
  noteType: "consultation" | "examination" | "follow_up" | "discharge_summary" | "referral" | "progress_note" | "initial_evaluation" | "treatment_plan";
  title: string;
  content: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  serviceDate?: Date;
  appointmentId?: string;
  attachments?: any[];
}

export interface VitalSignData {
  patientId: string;
  practitionerId?: string;
  vitalType: "blood_pressure" | "heart_rate" | "respiratory_rate" | "temperature" | "oxygen_saturation" | "height" | "weight" | "bmi" | "visual_acuity" | "intraocular_pressure";
  value: string;
  unit: string;
  measurementDate: Date;
  method?: string;
  position?: string;
  interpretation?: string;
  notes?: string;
  deviceId?: string;
  deviceType?: string;
}

export interface ImmunizationData {
  patientId: string;
  practitionerId?: string;
  vaccineName: string;
  vaccineType: string;
  manufacturer?: string;
  lotNumber?: string;
  administrationDate: Date;
  dose?: string;
  route?: string;
  site?: string;
  nextDueDate?: Date;
  indications?: string;
  adverseEvents?: string;
  notes?: string;
  cvxCode?: string;
}

export interface LabResultData {
  patientId: string;
  practitionerId?: string;
  testName: string;
  testCategory?: string;
  loincCode?: string;
  resultValue?: string;
  resultUnit?: string;
  referenceRange?: string;
  abnormalFlag?: string;
  interpretation?: string;
  specimenDate?: Date;
  resultDate: Date;
  performingLab?: string;
  orderingProvider?: string;
  clinicalNotes?: string;
  accessionNumber?: string;
}

export interface EHRSearchParams {
  companyId: string;
  patientId?: string;
  practitionerId?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  page?: number;
  limit?: number;
}

export class EHRService {
  /**
   * ========== MEDICAL RECORDS MANAGEMENT ==========
   */

  /**
   * Create or update a patient medical record
   */
  async createMedicalRecord(data: MedicalRecordData & { companyId: string; updatedBy: string }): Promise<schema.MedicalRecord> {
    try {
      // Generate unique record number
      const recordNumber = await this.generateRecordNumber(data.companyId);

      const medicalRecordData = {
        ...data,
        recordNumber,
        status: "active" as const,
        lastUpdated: new Date(),
        createdAt: new Date()
      };

      const [medicalRecord] = await db
        .insert(schema.medicalRecords)
        .values(medicalRecordData)
        .returning();

      logger.info({
        medicalRecordId: medicalRecord.id,
        patientId: medicalRecord.patientId,
        practitionerId: medicalRecord.practitionerId,
        recordNumber: medicalRecord.recordNumber
      }, 'Medical record created');

      return medicalRecord;
    } catch (error) {
      logger.error({ error, data }, 'Failed to create medical record');
      throw error;
    }
  }

  /**
   * Get medical record by ID
   */
  async getMedicalRecordById(id: string, companyId: string): Promise<schema.MedicalRecord | null> {
    try {
      const [medicalRecord] = await db
        .select()
        .from(schema.medicalRecords)
        .where(and(
          eq(schema.medicalRecords.id, id),
          eq(schema.medicalRecords.companyId, companyId)
        ))
        .limit(1);

      return medicalRecord || null;
    } catch (error) {
      logger.error({ error, id, companyId }, 'Failed to get medical record');
      throw error;
    }
  }

  /**
   * Get medical records with filtering and pagination
   */
  async getMedicalRecords(params: EHRSearchParams): Promise<{
    medicalRecords: schema.MedicalRecord[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const {
        companyId,
        patientId,
        practitionerId,
        status,
        dateFrom,
        dateTo,
        search,
        page = 1,
        limit = 20
      } = params;

      const conditions = [eq(schema.medicalRecords.companyId, companyId)];

      if (patientId) {
        conditions.push(eq(schema.medicalRecords.patientId, patientId));
      }

      if (practitionerId) {
        conditions.push(eq(schema.medicalRecords.practitionerId, practitionerId));
      }

      if (status) {
        conditions.push(eq(schema.medicalRecords.status, status));
      }

      if (dateFrom) {
        conditions.push(gte(schema.medicalRecords.createdAt, dateFrom));
      }

      if (dateTo) {
        conditions.push(lte(schema.medicalRecords.createdAt, dateTo));
      }

      if (search) {
        conditions.push(
          ilike(schema.medicalRecords.recordNumber, `%${search}%`)
        );
      }

      // Get total count
      const [{ count }] = await db
        .select({ count: schema.medicalRecords.id })
        .from(schema.medicalRecords)
        .where(and(...conditions));

      // Get paginated results
      const medicalRecords = await db
        .select()
        .from(schema.medicalRecords)
        .where(and(...conditions))
        .orderBy(desc(schema.medicalRecords.createdAt))
        .limit(limit)
        .offset((page - 1) * limit);

      const total = Number(count);
      const totalPages = Math.ceil(total / limit);

      return {
        medicalRecords,
        total,
        page,
        totalPages
      };
    } catch (error) {
      logger.error({ error, params }, 'Failed to get medical records');
      throw error;
    }
  }

  /**
   * Update medical record
   */
  async updateMedicalRecord(
    id: string,
    data: Partial<MedicalRecordData>,
    updatedBy: string,
    companyId: string
  ): Promise<schema.MedicalRecord> {
    try {
      const updateData = {
        ...data,
        lastUpdated: new Date(),
        updatedBy
      };

      const [medicalRecord] = await db
        .update(schema.medicalRecords)
        .set(updateData)
        .where(and(
          eq(schema.medicalRecords.id, id),
          eq(schema.medicalRecords.companyId, companyId)
        ))
        .returning();

      if (!medicalRecord) {
        throw new Error('Medical record not found');
      }

      logger.info({
        medicalRecordId: id,
        changes: Object.keys(data)
      }, 'Medical record updated');

      return medicalRecord;
    } catch (error) {
      logger.error({ error, id, data }, 'Failed to update medical record');
      throw error;
    }
  }

  /**
   * ========== MEDICATIONS MANAGEMENT ==========
   */

  /**
   * Add medication to patient record
   */
  async addMedication(data: MedicationData & { companyId: string; prescribedBy: string }): Promise<schema.Medication> {
    try {
      const medicationData = {
        ...data,
        prescribedDate: new Date(),
        status: "active" as const,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const [medication] = await db
        .insert(schema.medications)
        .values(medicationData)
        .returning();

      // Check for medication allergies
      await this.checkMedicationAllergies(data.patientId, data.medicationName, data.companyId);

      logger.info({
        medicationId: medication.id,
        patientId: medication.patientId,
        medicationName: medication.medicationName
      }, 'Medication added');

      return medication;
    } catch (error) {
      logger.error({ error, data }, 'Failed to add medication');
      throw error;
    }
  }

  /**
   * Get patient medications
   */
  async getMedications(params: EHRSearchParams): Promise<schema.Medication[]> {
    try {
      const {
        companyId,
        patientId,
        practitionerId,
        status,
        dateFrom,
        dateTo
      } = params;

      const conditions = [eq(schema.medications.companyId, companyId)];

      if (patientId) {
        conditions.push(eq(schema.medications.patientId, patientId));
      }

      if (practitionerId) {
        conditions.push(eq(schema.medications.practitionerId, practitionerId));
      }

      if (status) {
        conditions.push(eq(schema.medications.status, status));
      }

      if (dateFrom) {
        conditions.push(gte(schema.medications.prescribedDate, dateFrom));
      }

      if (dateTo) {
        conditions.push(lte(schema.medications.prescribedDate, dateTo));
      }

      const medications = await db
        .select()
        .from(schema.medications)
        .where(and(...conditions))
        .orderBy(desc(schema.medications.prescribedDate));

      return medications;
    } catch (error) {
      logger.error({ error, params }, 'Failed to get medications');
      throw error;
    }
  }

  /**
   * Update medication status (discontinue, complete, etc.)
   */
  async updateMedicationStatus(
    id: string,
    status: "active" | "discontinued" | "completed" | "on_hold",
    endDate?: Date,
    companyId: string
  ): Promise<schema.Medication> {
    try {
      const updateData: any = {
        status,
        updatedAt: new Date()
      };

      if (endDate) {
        updateData.endDate = endDate;
      }

      const [medication] = await db
        .update(schema.medications)
        .set(updateData)
        .where(and(
          eq(schema.medications.id, id),
          eq(schema.medications.companyId, companyId)
        ))
        .returning();

      if (!medication) {
        throw new Error('Medication not found');
      }

      logger.info({
        medicationId: id,
        newStatus: status,
        endDate
      }, 'Medication status updated');

      return medication;
    } catch (error) {
      logger.error({ error, id, status }, 'Failed to update medication status');
      throw error;
    }
  }

  /**
   * ========== ALLERGIES MANAGEMENT ==========
   */

  /**
   * Add patient allergy
   */
  async addAllergy(data: AllergyData & { companyId: string; reportedBy: string }): Promise<schema.Allergy> {
    try {
      const allergyData = {
        ...data,
        status: "active",
        reportedDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const [allergy] = await db
        .insert(schema.allergies)
        .values(allergyData)
        .returning();

      logger.info({
        allergyId: allergy.id,
        patientId: allergy.patientId,
        allergen: allergy.allergen,
        severity: allergy.severity
      }, 'Allergy added');

      return allergy;
    } catch (error) {
      logger.error({ error, data }, 'Failed to add allergy');
      throw error;
    }
  }

  /**
   * Get patient allergies
   */
  async getAllergies(patientId: string, companyId: string): Promise<schema.Allergy[]> {
    try {
      const allergies = await db
        .select()
        .from(schema.allergies)
        .where(and(
          eq(schema.allergies.companyId, companyId),
          eq(schema.allergies.patientId, patientId),
          eq(schema.allergies.status, "active")
        ))
        .orderBy(desc(schema.allergies.reportedDate));

      return allergies;
    } catch (error) {
      logger.error({ error, patientId, companyId }, 'Failed to get allergies');
      throw error;
    }
  }

  /**
   * Check for medication allergies
   */
  async checkMedicationAllergies(patientId: string, medicationName: string, companyId: string): Promise<schema.Allergy[]> {
    try {
      const allergies = await this.getAllergies(patientId, companyId);
      
      const medicationAllergies = allergies.filter(allergy => 
        allergy.allergenType === 'medication' && 
        (allergy.allergen.toLowerCase().includes(medicationName.toLowerCase()) ||
         medicationName.toLowerCase().includes(allergy.allergen.toLowerCase()))
      );

      if (medicationAllergies.length > 0) {
        logger.warn({
          patientId,
          medicationName,
          allergyCount: medicationAllergies.length,
          severities: medicationAllergies.map(a => a.severity)
        }, 'Medication allergy conflict detected');
      }

      return medicationAllergies;
    } catch (error) {
      logger.error({ error, patientId, medicationName }, 'Failed to check medication allergies');
      throw error;
    }
  }

  /**
   * ========== CLINICAL NOTES MANAGEMENT ==========
   */

  /**
   * Create clinical note
   */
  async createClinicalNote(data: ClinicalNoteData & { companyId: string; createdBy: string }): Promise<schema.ClinicalNote> {
    try {
      const noteData = {
        ...data,
        noteDate: new Date(),
        status: "draft",
        isSigned: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const [clinicalNote] = await db
        .insert(schema.clinicalNotes)
        .values(noteData)
        .returning();

      logger.info({
        noteId: clinicalNote.id,
        patientId: clinicalNote.patientId,
        noteType: clinicalNote.noteType,
        title: clinicalNote.title
      }, 'Clinical note created');

      return clinicalNote;
    } catch (error) {
      logger.error({ error, data }, 'Failed to create clinical note');
      throw error;
    }
  }

  /**
   * Get clinical notes
   */
  async getClinicalNotes(params: EHRSearchParams): Promise<schema.ClinicalNote[]> {
    try {
      const {
        companyId,
        patientId,
        practitionerId,
        noteType,
        dateFrom,
        dateTo,
        page = 1,
        limit = 20
      } = params;

      const conditions = [eq(schema.clinicalNotes.companyId, companyId)];

      if (patientId) {
        conditions.push(eq(schema.clinicalNotes.patientId, patientId));
      }

      if (practitionerId) {
        conditions.push(eq(schema.clinicalNotes.practitionerId, practitionerId));
      }

      if (noteType) {
        conditions.push(eq(schema.clinicalNotes.noteType, noteType));
      }

      if (dateFrom) {
        conditions.push(gte(schema.clinicalNotes.noteDate, dateFrom));
      }

      if (dateTo) {
        conditions.push(lte(schema.clinicalNotes.noteDate, dateTo));
      }

      const clinicalNotes = await db
        .select()
        .from(schema.clinicalNotes)
        .where(and(...conditions))
        .orderBy(desc(schema.clinicalNotes.noteDate))
        .limit(limit)
        .offset((page - 1) * limit);

      return clinicalNotes;
    } catch (error) {
      logger.error({ error, params }, 'Failed to get clinical notes');
      throw error;
    }
  }

  /**
   * Sign clinical note
   */
  async signClinicalNote(id: string, signedBy: string, companyId: string): Promise<schema.ClinicalNote> {
    try {
      const [clinicalNote] = await db
        .update(schema.clinicalNotes)
        .set({
          isSigned: true,
          signedAt: new Date(),
          signedBy,
          status: "signed",
          updatedAt: new Date()
        })
        .where(and(
          eq(schema.clinicalNotes.id, id),
          eq(schema.clinicalNotes.companyId, companyId)
        ))
        .returning();

      if (!clinicalNote) {
        throw new Error('Clinical note not found');
      }

      logger.info({
        noteId: id,
        signedBy
      }, 'Clinical note signed');

      return clinicalNote;
    } catch (error) {
      logger.error({ error, id, signedBy }, 'Failed to sign clinical note');
      throw error;
    }
  }

  /**
   * ========== VITAL SIGNS MANAGEMENT ==========
   */

  /**
   * Add vital sign measurement
   */
  async addVitalSign(data: VitalSignData & { companyId: string; measuredBy: string }): Promise<schema.VitalSign> {
    try {
      const vitalSignData = {
        ...data,
        interpretation: data.interpretation || this.interpretVitalSign(data.vitalType, data.value),
        createdAt: new Date()
      };

      const [vitalSign] = await db
        .insert(schema.vitalSigns)
        .values(vitalSignData)
        .returning();

      logger.info({
        vitalSignId: vitalSign.id,
        patientId: vitalSign.patientId,
        vitalType: vitalSign.vitalType,
        value: vitalSign.value,
        interpretation: vitalSign.interpretation
      }, 'Vital sign added');

      return vitalSign;
    } catch (error) {
      logger.error({ error, data }, 'Failed to add vital sign');
      throw error;
    }
  }

  /**
   * Get vital signs
   */
  async getVitalSigns(params: EHRSearchParams & { vitalType?: string }): Promise<schema.VitalSign[]> {
    try {
      const {
        companyId,
        patientId,
        practitionerId,
        vitalType,
        dateFrom,
        dateTo
      } = params;

      const conditions = [eq(schema.vitalSigns.companyId, companyId)];

      if (patientId) {
        conditions.push(eq(schema.vitalSigns.patientId, patientId));
      }

      if (practitionerId) {
        conditions.push(eq(schema.vitalSigns.practitionerId, practitionerId));
      }

      if (vitalType) {
        conditions.push(eq(schema.vitalSigns.vitalType, vitalType));
      }

      if (dateFrom) {
        conditions.push(gte(schema.vitalSigns.measurementDate, dateFrom));
      }

      if (dateTo) {
        conditions.push(lte(schema.vitalSigns.measurementDate, dateTo));
      }

      const vitalSigns = await db
        .select()
        .from(schema.vitalSigns)
        .where(and(...conditions))
        .orderBy(desc(schema.vitalSigns.measurementDate));

      return vitalSigns;
    } catch (error) {
      logger.error({ error, params }, 'Failed to get vital signs');
      throw error;
    }
  }

  /**
   * ========== IMMUNIZATIONS MANAGEMENT ==========
   */

  /**
   * Add immunization record
   */
  async addImmunization(data: ImmunizationData & { companyId: string; administeredBy: string }): Promise<schema.Immunization> {
    try {
      const immunizationData = {
        ...data,
        status: "administered" as const,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const [immunization] = await db
        .insert(schema.immunizations)
        .values(immunizationData)
        .returning();

      logger.info({
        immunizationId: immunization.id,
        patientId: immunization.patientId,
        vaccineName: immunization.vaccineName,
        administrationDate: immunization.administrationDate
      }, 'Immunization added');

      return immunization;
    } catch (error) {
      logger.error({ error, data }, 'Failed to add immunization');
      throw error;
    }
  }

  /**
   * Get immunizations
   */
  async getImmunizations(params: EHRSearchParams): Promise<schema.Immunization[]> {
    try {
      const {
        companyId,
        patientId,
        practitionerId,
        status,
        dateFrom,
        dateTo
      } = params;

      const conditions = [eq(schema.immunizations.companyId, companyId)];

      if (patientId) {
        conditions.push(eq(schema.immunizations.patientId, patientId));
      }

      if (practitionerId) {
        conditions.push(eq(schema.immunizations.practitionerId, practitionerId));
      }

      if (status) {
        conditions.push(eq(schema.immunizations.status, status));
      }

      if (dateFrom) {
        conditions.push(gte(schema.immunizations.administrationDate, dateFrom));
      }

      if (dateTo) {
        conditions.push(lte(schema.immunizations.administrationDate, dateTo));
      }

      const immunizations = await db
        .select()
        .from(schema.immunizations)
        .where(and(...conditions))
        .orderBy(desc(schema.immunizations.administrationDate));

      return immunizations;
    } catch (error) {
      logger.error({ error, params }, 'Failed to get immunizations');
      throw error;
    }
  }

  /**
   * ========== LAB RESULTS MANAGEMENT ==========
   */

  /**
   * Add lab result
   */
  async addLabResult(data: LabResultData & { companyId: string }): Promise<schema.LabResult> {
    try {
      const labResultData = {
        ...data,
        status: "final",
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const [labResult] = await db
        .insert(schema.labResults)
        .values(labResultData)
        .returning();

      logger.info({
        labResultId: labResult.id,
        patientId: labResult.patientId,
        testName: labResult.testName,
        resultValue: labResult.resultValue,
        abnormalFlag: labResult.abnormalFlag
      }, 'Lab result added');

      return labResult;
    } catch (error) {
      logger.error({ error, data }, 'Failed to add lab result');
      throw error;
    }
  }

  /**
   * Get lab results
   */
  async getLabResults(params: EHRSearchParams & { testCategory?: string; abnormalOnly?: boolean }): Promise<schema.LabResult[]> {
    try {
      const {
        companyId,
        patientId,
        practitionerId,
        testCategory,
        abnormalOnly,
        dateFrom,
        dateTo
      } = params;

      const conditions = [eq(schema.labResults.companyId, companyId)];

      if (patientId) {
        conditions.push(eq(schema.labResults.patientId, patientId));
      }

      if (practitionerId) {
        conditions.push(eq(schema.labResults.practitionerId, practitionerId));
      }

      if (testCategory) {
        conditions.push(eq(schema.labResults.testCategory, testCategory));
      }

      if (abnormalOnly) {
        conditions.push(
          inArray(schema.labResults.abnormalFlag, ["H", "L", "HH", "LL", "A", "AA", "P", "PP"])
        );
      }

      if (dateFrom) {
        conditions.push(gte(schema.labResults.resultDate, dateFrom));
      }

      if (dateTo) {
        conditions.push(lte(schema.labResults.resultDate, dateTo));
      }

      const labResults = await db
        .select()
        .from(schema.labResults)
        .where(and(...conditions))
        .orderBy(desc(schema.labResults.resultDate));

      return labResults;
    } catch (error) {
      logger.error({ error, params }, 'Failed to get lab results');
      throw error;
    }
  }

  /**
   * ========== UTILITY METHODS ==========
   */

  /**
   * Generate unique medical record number
   */
  private async generateRecordNumber(companyId: string): Promise<string> {
    try {
      const year = new Date().getFullYear();
      const prefix = `MR${year}`;
      
      // Get the highest record number for this year and company
      const existingRecords = await db
        .select({ recordNumber: schema.medicalRecords.recordNumber })
        .from(schema.medicalRecords)
        .where(and(
          eq(schema.medicalRecords.companyId, companyId),
          ilike(schema.medicalRecords.recordNumber, `${prefix}%`)
        ))
        .orderBy(desc(schema.medicalRecords.recordNumber))
        .limit(1);

      let sequence = 1;
      if (existingRecords.length > 0) {
        const lastRecordNumber = existingRecords[0].recordNumber;
        const lastSequence = parseInt(lastRecordNumber.replace(prefix, ''));
        sequence = lastSequence + 1;
      }

      return `${prefix}${sequence.toString().padStart(6, '0')}`;
    } catch (error) {
      logger.error({ error, companyId }, 'Failed to generate record number');
      throw error;
    }
  }

  /**
   * Interpret vital sign values
   */
  private interpretVitalSign(vitalType: string, value: string): string {
    try {
      const numValue = parseFloat(value);
      
      switch (vitalType) {
        case 'blood_pressure':
          // Format: "120/80"
          const [systolic, diastolic] = value.split('/').map(Number);
          if (systolic >= 180 || diastolic >= 120) return 'critical';
          if (systolic >= 140 || diastolic >= 90) return 'high';
          if (systolic < 90 || diastolic < 60) return 'low';
          return 'normal';
          
        case 'heart_rate':
          if (numValue >= 120 || numValue < 40) return 'critical';
          if (numValue >= 100) return 'high';
          if (numValue < 60) return 'low';
          return 'normal';
          
        case 'temperature':
          if (numValue >= 103 || numValue < 95) return 'critical';
          if (numValue >= 100.4) return 'high';
          if (numValue < 97) return 'low';
          return 'normal';
          
        case 'oxygen_saturation':
          if (numValue < 88) return 'critical';
          if (numValue < 92) return 'low';
          return 'normal';
          
        case 'respiratory_rate':
          if (numValue >= 30 || numValue < 8) return 'critical';
          if (numValue >= 24) return 'high';
          if (numValue < 12) return 'low';
          return 'normal';
          
        default:
          return 'normal';
      }
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Get comprehensive patient health summary
   */
  async getPatientHealthSummary(patientId: string, companyId: string): Promise<{
    medicalRecord: schema.MedicalRecord | null;
    medications: schema.Medication[];
    allergies: schema.Allergy[];
    recentVitalSigns: schema.VitalSign[];
    immunizations: schema.Immunization[];
    recentLabResults: schema.LabResult[];
    clinicalNotes: schema.ClinicalNote[];
  }> {
    try {
      const [
        medicalRecord,
        medications,
        allergies,
        recentVitalSigns,
        immunizations,
        recentLabResults,
        clinicalNotes
      ] = await Promise.all([
        this.getMedicalRecordByPatient(patientId, companyId),
        this.getMedications({ companyId, patientId }),
        this.getAllergies(patientId, companyId),
        this.getVitalSigns({ 
          companyId, 
          patientId, 
          dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }),
        this.getImmunizations({ companyId, patientId }),
        this.getLabResults({ 
          companyId, 
          patientId, 
          dateFrom: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
        }),
        this.getClinicalNotes({ companyId, patientId })
      ]);

      return {
        medicalRecord,
        medications,
        allergies,
        recentVitalSigns,
        immunizations,
        recentLabResults,
        clinicalNotes
      };
    } catch (error) {
      logger.error({ error, patientId, companyId }, 'Failed to get patient health summary');
      throw error;
    }
  }

  /**
   * Get medical record by patient ID
   */
  private async getMedicalRecordByPatient(patientId: string, companyId: string): Promise<schema.MedicalRecord | null> {
    try {
      const [medicalRecord] = await db
        .select()
        .from(schema.medicalRecords)
        .where(and(
          eq(schema.medicalRecords.patientId, patientId),
          eq(schema.medicalRecords.companyId, companyId),
          eq(schema.medicalRecords.status, "active")
        ))
        .limit(1);

      return medicalRecord || null;
    } catch (error) {
      logger.error({ error, patientId, companyId }, 'Failed to get medical record by patient');
      throw error;
    }
  }
}

export const ehrService = new EHRService();
export default ehrService;
