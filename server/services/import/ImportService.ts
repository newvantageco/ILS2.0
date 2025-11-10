/**
 * Import Service
 *
 * Handles batch data import with validation, transformation, and rollback
 * Tracks import progress and provides status updates
 */

import { randomUUID } from 'crypto';
import { db } from '../../db.js';
import { patients, orders } from '@shared/schema';
import { eq, or, and } from 'drizzle-orm';
import { loggers } from '../../utils/logger.js';
import {
  type PatientImport,
  type OrderImport,
  type BatchImportRequest,
  type ImportStatus,
  type FieldMapping,
  validateBatch,
} from '../../validation/import.js';
import { DataTransformService } from './DataTransformService.js';

const logger = loggers.database;

/**
 * Import job tracking
 */
interface ImportJob {
  id: string;
  type: 'patients' | 'orders';
  status: ImportStatus['status'];
  progress: ImportStatus['progress'];
  options: BatchImportRequest['options'];
  metadata: BatchImportRequest['metadata'];
  errors: ImportStatus['errors'];
  startedAt: Date;
  completedAt: Date | null;
  createdBy: string | null;
  records: any[];
  importedIds: string[];
}

/**
 * In-memory job store (in production, use Redis or database)
 */
const jobs = new Map<string, ImportJob>();

/**
 * Import Service
 */
export class ImportService {
  /**
   * Create import job
   */
  static async createImportJob(
    type: 'patients' | 'orders',
    records: any[],
    request: BatchImportRequest,
    createdBy?: string
  ): Promise<string> {
    const jobId = randomUUID();

    const job: ImportJob = {
      id: jobId,
      type,
      status: 'pending',
      progress: {
        total: records.length,
        processed: 0,
        successful: 0,
        failed: 0,
        skipped: 0,
      },
      options: request.options || {},
      metadata: request.metadata || {},
      errors: [],
      startedAt: new Date(),
      completedAt: null,
      createdBy: createdBy || null,
      records,
      importedIds: [],
    };

    jobs.set(jobId, job);

    logger.info({ jobId, type, recordCount: records.length }, 'Import job created');

    return jobId;
  }

  /**
   * Get import job status
   */
  static getImportStatus(jobId: string): ImportStatus | null {
    const job = jobs.get(jobId);

    if (!job) {
      return null;
    }

    return {
      id: job.id,
      type: job.type,
      status: job.status,
      progress: job.progress,
      options: job.options,
      metadata: job.metadata,
      errors: job.errors,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      createdBy: job.createdBy,
    };
  }

  /**
   * Execute import job
   */
  static async executeImport(jobId: string): Promise<ImportStatus> {
    const job = jobs.get(jobId);

    if (!job) {
      throw new Error(`Import job not found: ${jobId}`);
    }

    if (job.status !== 'pending') {
      throw new Error(`Import job already ${job.status}: ${jobId}`);
    }

    try {
      // Update status to validating
      job.status = 'validating';
      jobs.set(jobId, job);

      logger.info({ jobId }, 'Validating import data');

      // Validate all records
      const validationResult = validateBatch(job.type, job.records);

      if (!validationResult.valid && !job.options.continueOnError) {
        job.status = 'failed';
        job.errors = validationResult.errors.map((error) => ({
          row: error.row || 0,
          field: error.field,
          message: error.message,
          data: error.value,
        }));
        job.completedAt = new Date();
        jobs.set(jobId, job);

        logger.error(
          { jobId, errorCount: validationResult.errors.length },
          'Validation failed'
        );

        return this.getImportStatus(jobId)!;
      }

      // Check if dry run
      if (job.options.dryRun || job.options.validateOnly) {
        job.status = 'completed';
        job.progress.processed = job.records.length;
        job.progress.successful = validationResult.summary.validRows;
        job.progress.failed = validationResult.summary.invalidRows;
        job.completedAt = new Date();
        jobs.set(jobId, job);

        logger.info({ jobId }, 'Dry run completed');

        return this.getImportStatus(jobId)!;
      }

      // Update status to processing
      job.status = 'processing';
      jobs.set(jobId, job);

      logger.info({ jobId }, 'Processing import data');

      // Process records in batches
      const batchSize = job.options.batchSize || 100;

      for (let i = 0; i < job.records.length; i += batchSize) {
        const batch = job.records.slice(i, i + batchSize);

        await this.processBatch(job, batch, i);

        // Update progress
        job.progress.processed = Math.min(i + batchSize, job.records.length);
        jobs.set(jobId, job);

        logger.info(
          {
            jobId,
            progress: `${job.progress.processed}/${job.progress.total}`,
          },
          'Batch processed'
        );
      }

      // Mark as completed
      job.status = 'completed';
      job.completedAt = new Date();
      jobs.set(jobId, job);

      logger.info(
        {
          jobId,
          successful: job.progress.successful,
          failed: job.progress.failed,
          skipped: job.progress.skipped,
        },
        'Import completed'
      );

      return this.getImportStatus(jobId)!;
    } catch (error) {
      logger.error({ jobId, error }, 'Import job failed');

      job.status = 'failed';
      job.errors.push({
        row: 0,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      job.completedAt = new Date();
      jobs.set(jobId, job);

      throw error;
    }
  }

  /**
   * Process a batch of records
   */
  private static async processBatch(
    job: ImportJob,
    batch: any[],
    startIndex: number
  ): Promise<void> {
    for (let i = 0; i < batch.length; i++) {
      const record = batch[i];
      const rowIndex = startIndex + i;

      try {
        if (job.type === 'patients') {
          await this.processPatientRecord(job, record, rowIndex);
        } else {
          await this.processOrderRecord(job, record, rowIndex);
        }
      } catch (error) {
        job.progress.failed++;
        job.errors.push({
          row: rowIndex,
          message: error instanceof Error ? error.message : 'Unknown error',
          data: record,
        });

        if (!job.options.continueOnError) {
          throw error;
        }
      }
    }
  }

  /**
   * Process patient record
   */
  private static async processPatientRecord(
    job: ImportJob,
    record: PatientImport,
    rowIndex: number
  ): Promise<void> {
    // Check for duplicates
    if (job.options.skipDuplicates || job.options.updateExisting) {
      const existingPatient = await this.findDuplicatePatient(record);

      if (existingPatient) {
        if (job.options.updateExisting) {
          // Update existing patient
          await db
            .update(patients)
            .set({
              ...record,
              updatedAt: new Date(),
            })
            .where(eq(patients.id, existingPatient.id));

          job.progress.successful++;
          job.importedIds.push(existingPatient.id);

          logger.debug({ patientId: existingPatient.id }, 'Patient updated');
        } else {
          // Skip duplicate
          job.progress.skipped++;

          logger.debug({ record }, 'Duplicate patient skipped');
        }

        return;
      }
    }

    // Insert new patient
    const [inserted] = await db
      .insert(patients)
      .values({
        ...record,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    job.progress.successful++;
    job.importedIds.push(inserted.id);

    logger.debug({ patientId: inserted.id }, 'Patient created');
  }

  /**
   * Process order record
   */
  private static async processOrderRecord(
    job: ImportJob,
    record: OrderImport,
    rowIndex: number
  ): Promise<void> {
    // Find patient by identifier
    const patient = await this.findPatientByIdentifier(record.patientIdentifier);

    if (!patient) {
      throw new Error(`Patient not found: ${record.patientIdentifier}`);
    }

    // Check for duplicates
    if (job.options.skipDuplicates || job.options.updateExisting) {
      const existingOrder = await this.findDuplicateOrder(record, patient.id);

      if (existingOrder) {
        if (job.options.updateExisting) {
          // Update existing order
          await db
            .update(orders)
            .set({
              ...record,
              patientId: patient.id,
              updatedAt: new Date(),
            })
            .where(eq(orders.id, existingOrder.id));

          job.progress.successful++;
          job.importedIds.push(existingOrder.id);

          logger.debug({ orderId: existingOrder.id }, 'Order updated');
        } else {
          // Skip duplicate
          job.progress.skipped++;

          logger.debug({ record }, 'Duplicate order skipped');
        }

        return;
      }
    }

    // Insert new order
    const [inserted] = await db
      .insert(orders)
      .values({
        patientId: patient.id,
        orderNumber: record.orderNumber,
        orderDate: new Date(record.orderDate),
        testType: record.testType,
        status: record.status || 'pending',
        priority: record.priority || 'routine',
        orderingProvider: record.orderingProvider,
        facility: record.facility,
        department: record.department,
        notes: record.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    job.progress.successful++;
    job.importedIds.push(inserted.id);

    logger.debug({ orderId: inserted.id }, 'Order created');
  }

  /**
   * Find duplicate patient
   */
  private static async findDuplicatePatient(
    record: PatientImport
  ): Promise<any | null> {
    // Check by MRN
    if (record.mrn) {
      const [patient] = await db
        .select()
        .from(patients)
        .where(eq(patients.mrn, record.mrn))
        .limit(1);

      if (patient) return patient;
    }

    // Check by email
    if (record.email) {
      const [patient] = await db
        .select()
        .from(patients)
        .where(eq(patients.email, record.email))
        .limit(1);

      if (patient) return patient;
    }

    // Check by external ID
    if (record.externalId) {
      const [patient] = await db
        .select()
        .from(patients)
        .where(eq(patients.externalId, record.externalId))
        .limit(1);

      if (patient) return patient;
    }

    // Check by name and DOB
    const [patient] = await db
      .select()
      .from(patients)
      .where(
        and(
          eq(patients.firstName, record.firstName),
          eq(patients.lastName, record.lastName),
          eq(patients.dateOfBirth, record.dateOfBirth)
        )
      )
      .limit(1);

    return patient || null;
  }

  /**
   * Find duplicate order
   */
  private static async findDuplicateOrder(
    record: OrderImport,
    patientId: number
  ): Promise<any | null> {
    // Check by order number
    const [order] = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.patientId, patientId),
          eq(orders.orderNumber, record.orderNumber)
        )
      )
      .limit(1);

    return order || null;
  }

  /**
   * Find patient by identifier
   */
  private static async findPatientByIdentifier(
    identifier: string
  ): Promise<any | null> {
    // Try MRN
    let [patient] = await db
      .select()
      .from(patients)
      .where(eq(patients.mrn, identifier))
      .limit(1);

    if (patient) return patient;

    // Try email
    [patient] = await db
      .select()
      .from(patients)
      .where(eq(patients.email, identifier))
      .limit(1);

    if (patient) return patient;

    // Try external ID
    [patient] = await db
      .select()
      .from(patients)
      .where(eq(patients.externalId, identifier))
      .limit(1);

    return patient || null;
  }

  /**
   * Cancel import job
   */
  static cancelImport(jobId: string): boolean {
    const job = jobs.get(jobId);

    if (!job) {
      return false;
    }

    if (job.status === 'completed' || job.status === 'failed') {
      return false;
    }

    job.status = 'cancelled';
    job.completedAt = new Date();
    jobs.set(jobId, job);

    logger.info({ jobId }, 'Import job cancelled');

    return true;
  }

  /**
   * Rollback import
   */
  static async rollbackImport(jobId: string): Promise<boolean> {
    const job = jobs.get(jobId);

    if (!job) {
      throw new Error(`Import job not found: ${jobId}`);
    }

    if (job.importedIds.length === 0) {
      logger.warn({ jobId }, 'No records to rollback');
      return false;
    }

    try {
      if (job.type === 'patients') {
        await db.delete(patients).where(
          or(...job.importedIds.map((id) => eq(patients.id, id)))
        );
      } else {
        await db.delete(orders).where(
          or(...job.importedIds.map((id) => eq(orders.id, id)))
        );
      }

      logger.info(
        { jobId, recordCount: job.importedIds.length },
        'Import rolled back'
      );

      return true;
    } catch (error) {
      logger.error({ jobId, error }, 'Rollback failed');
      throw error;
    }
  }

  /**
   * Clean up old jobs
   */
  static cleanupOldJobs(olderThanHours: number = 24): number {
    const cutoffTime = Date.now() - olderThanHours * 60 * 60 * 1000;
    let cleanedCount = 0;

    for (const [jobId, job] of jobs.entries()) {
      if (job.completedAt && job.completedAt.getTime() < cutoffTime) {
        jobs.delete(jobId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info({ cleanedCount }, 'Cleaned up old import jobs');
    }

    return cleanedCount;
  }

  /**
   * Get all jobs
   */
  static getAllJobs(): ImportStatus[] {
    return Array.from(jobs.values()).map((job) => this.getImportStatus(job.id)!);
  }
}
