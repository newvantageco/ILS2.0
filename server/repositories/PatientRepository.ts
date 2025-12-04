/**
 * Patient Repository
 *
 * Tenant-scoped repository for patient management.
 * HIPAA-aware with PHI access logging.
 */

import { db } from '../db';
import {
  
  patients, eyeExaminations,
  prescriptions
} from '@shared/schema';

// Import tables not yet extracted to modular domains
import {
  appointments
} from '@shared/schemaLegacy';;
import type { Patient, EyeExamination, Prescription } from '@shared/schema';
import { eq, and, desc, sql, gte, or } from 'drizzle-orm';
import { BaseRepository, type QueryOptions } from './BaseRepository';
import { createLogger } from '../utils/logger';

const logger = createLogger('PatientRepository');

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface PatientWithExaminations extends Patient {
  examinations?: EyeExamination[];
  latestPrescription?: Prescription;
}

export interface PatientSearchOptions extends QueryOptions {
  includeInactive?: boolean;
}

// ============================================
// PATIENT REPOSITORY CLASS
// ============================================

export class PatientRepository extends BaseRepository<typeof patients, Patient, Patient> {
  constructor(tenantId: string) {
    super(patients, tenantId, 'companyId');
  }

  // ============================================
  // PHI ACCESS LOGGING
  // ============================================

  /**
   * Log PHI access for HIPAA compliance
   */
  private logPHIAccess(action: string, patientId: string, userId?: string): void {
    logger.info({
      audit: true,
      hipaa: true,
      phi_access: true,
      action,
      patientId,
      tenantId: this.tenantId,
      userId,
      timestamp: new Date().toISOString(),
    }, `PHI Access: ${action}`);
  }

  // ============================================
  // EXTENDED QUERY METHODS
  // ============================================

  /**
   * Get patient with examination history
   */
  async getWithExaminations(
    id: string,
    userId?: string
  ): Promise<PatientWithExaminations | undefined> {
    const patient = await this.findById(id);

    if (!patient) return undefined;

    // Log PHI access
    this.logPHIAccess('getWithExaminations', id, userId);

    // Get examinations
    const exams = await db
      .select()
      .from(eyeExaminations)
      .where(and(
        eq(eyeExaminations.patientId, id),
        eq(eyeExaminations.companyId, this.tenantId)
      ))
      .orderBy(desc(eyeExaminations.examinationDate));

    // Get latest prescription
    const [latestRx] = await db
      .select()
      .from(prescriptions)
      .where(and(
        eq(prescriptions.patientId, id),
        eq(prescriptions.companyId, this.tenantId)
      ))
      .orderBy(desc(prescriptions.prescriptionDate))
      .limit(1);

    return {
      ...patient,
      examinations: exams,
      latestPrescription: latestRx,
    };
  }

  /**
   * Search patients by name, email, or phone
   */
  async search(
    query: string,
    options: PatientSearchOptions = {}
  ): Promise<Patient[]> {
    const { limit = 50, offset = 0, includeInactive = false } = options;
    const searchTerm = `%${query}%`;

    const conditions = [
      eq(patients.companyId, this.tenantId),
      or(
        sql`${patients.firstName} ILIKE ${searchTerm}`,
        sql`${patients.lastName} ILIKE ${searchTerm}`,
        sql`${patients.email} ILIKE ${searchTerm}`,
        sql`${patients.phone} ILIKE ${searchTerm}`,
        sql`CONCAT(${patients.firstName}, ' ', ${patients.lastName}) ILIKE ${searchTerm}`
      ),
    ];

    if (!includeInactive) {
      conditions.push(sql`${patients.deletedAt} IS NULL`);
    }

    const result = await db
      .select()
      .from(patients)
      .where(and(...conditions.filter(Boolean) as any))
      .orderBy(patients.lastName, patients.firstName)
      .limit(limit)
      .offset(offset);

    // Log search PHI access
    logger.info({
      audit: true,
      hipaa: true,
      phi_access: true,
      action: 'search',
      query: query.substring(0, 3) + '***', // Partial query for audit
      resultCount: result.length,
      tenantId: this.tenantId,
    }, 'PHI Search performed');

    return result;
  }

  /**
   * Get patients with upcoming appointments
   */
  async getWithUpcomingAppointments(
    daysAhead: number = 7
  ): Promise<Patient[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const result = await db
      .selectDistinct({ patient: patients })
      .from(patients)
      .innerJoin(appointments, eq(patients.id, appointments.patientId))
      .where(and(
        eq(patients.companyId, this.tenantId),
        gte(appointments.appointmentDate, new Date()),
        sql`${appointments.appointmentDate} <= ${futureDate}`
      ))
      .orderBy(patients.lastName);

    return result.map(r => r.patient);
  }

  /**
   * Get patients needing recall
   * (Last examination was more than N months ago)
   */
  async getNeedingRecall(monthsThreshold: number = 24): Promise<Patient[]> {
    const thresholdDate = new Date();
    thresholdDate.setMonth(thresholdDate.getMonth() - monthsThreshold);

    // Get patients whose last exam was before threshold
    const result = await db
      .select({ patient: patients })
      .from(patients)
      .leftJoin(eyeExaminations, and(
        eq(patients.id, eyeExaminations.patientId),
        eq(eyeExaminations.companyId, this.tenantId)
      ))
      .where(and(
        eq(patients.companyId, this.tenantId),
        sql`${patients.deletedAt} IS NULL`
      ))
      .groupBy(patients.id)
      .having(
        sql`MAX(${eyeExaminations.examinationDate}) < ${thresholdDate} OR MAX(${eyeExaminations.examinationDate}) IS NULL`
      )
      .orderBy(patients.lastName);

    return result.map(r => r.patient);
  }

  /**
   * Get patient by email
   */
  async getByEmail(email: string): Promise<Patient | undefined> {
    const [result] = await db
      .select()
      .from(patients)
      .where(and(
        eq(patients.companyId, this.tenantId),
        sql`LOWER(${patients.email}) = LOWER(${email})`
      ))
      .limit(1);

    return result;
  }

  /**
   * Get patient count
   */
  async getTotalCount(): Promise<number> {
    return this.count(sql`${patients.deletedAt} IS NULL`);
  }

  /**
   * Override create to log PHI access
   */
  async create(data: Partial<Patient>, options: { userId?: string } = {}): Promise<Patient> {
    const patient = await super.create(data, options);
    this.logPHIAccess('create', patient.id, options.userId);
    return patient;
  }

  /**
   * Override update to log PHI access
   */
  async update(
    id: string,
    data: Partial<Patient>,
    options: { userId?: string } = {}
  ): Promise<Patient | undefined> {
    const patient = await super.update(id, data, options);
    if (patient) {
      this.logPHIAccess('update', id, options.userId);
    }
    return patient;
  }

  /**
   * Override findById to log PHI access
   */
  async findById(id: string, userId?: string): Promise<Patient | undefined> {
    const patient = await super.findById(id);
    if (patient) {
      this.logPHIAccess('read', id, userId);
    }
    return patient;
  }
}

export default PatientRepository;
