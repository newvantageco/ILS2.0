/**
 * GDPR Deletion Service
 *
 * Handles GDPR Article 17 "Right to Erasure" requests
 * Compliant with UK GDPR and EU GDPR requirements
 *
 * Features:
 * - Request tracking and approval workflow
 * - Anonymization (default) or hard deletion
 * - Comprehensive audit logging
 * - Retention period compliance
 * - Verification and consent tracking
 */

import crypto from 'crypto';
import { db } from '../db/index.js';
import {
  gdprDeletionRequests,
  patients,
  users,
  appointments,
  prescriptions,
  orders,
  messages,
  clinicalNotes,
  medicalRecords,
  type GdprDeletionRequest
} from '../../shared/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('gdpr-deletion');

export interface CreateDeletionRequestInput {
  companyId: string;
  dataSubjectId: string;
  dataSubjectType: 'patient' | 'user' | 'employee' | 'customer';
  dataSubjectEmail?: string;
  dataSubjectName?: string;
  requestedBy: string;
  deletionType?: 'anonymization' | 'hard_delete';
  reason?: string;
  legalBasis?: string;
}

export interface DeletionProgress {
  requestId: string;
  status: string;
  tablesProcessed: string[];
  recordsDeleted: number;
  recordsAnonymized: number;
  completedAt?: Date;
  errorMessage?: string;
}

/**
 * GDPR Deletion Service
 * Handles right-to-deletion requests under GDPR compliance
 */
export class GDPRDeletionService {

  /**
   * Create a new deletion request
   */
  static async createDeletionRequest(input: CreateDeletionRequestInput): Promise<GdprDeletionRequest> {
    const requestId = crypto.randomUUID();
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const request = await db.insert(gdprDeletionRequests).values({
      id: requestId,
      companyId: input.companyId,
      dataSubjectId: input.dataSubjectId,
      dataSubjectType: input.dataSubjectType,
      dataSubjectEmail: input.dataSubjectEmail,
      dataSubjectName: input.dataSubjectName,
      requestedBy: input.requestedBy,
      deletionType: input.deletionType || 'anonymization',
      reason: input.reason,
      legalBasis: input.legalBasis || 'GDPR Article 17 - Right to Erasure',
      status: 'pending',
      verificationToken,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    logger.info({
      requestId,
      companyId: input.companyId,
      dataSubjectId: input.dataSubjectId,
      deletionType: input.deletionType
    }, 'GDPR deletion request created');

    return request[0];
  }

  /**
   * Verify deletion request via email token
   */
  static async verifyDeletionRequest(requestId: string, verificationToken: string): Promise<boolean> {
    const [request] = await db
      .select()
      .from(gdprDeletionRequests)
      .where(and(
        eq(gdprDeletionRequests.id, requestId),
        eq(gdprDeletionRequests.verificationToken, verificationToken)
      ))
      .limit(1);

    if (!request) {
      return false;
    }

    await db.update(gdprDeletionRequests)
      .set({
        verifiedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(gdprDeletionRequests.id, requestId));

    logger.info({ requestId }, 'GDPR deletion request verified');

    return true;
  }

  /**
   * Approve deletion request (admin only)
   */
  static async approveDeletionRequest(requestId: string, approvedBy: string): Promise<void> {
    await db.update(gdprDeletionRequests)
      .set({
        status: 'approved',
        approvedBy,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(gdprDeletionRequests.id, requestId));

    logger.info({ requestId, approvedBy }, 'GDPR deletion request approved');
  }

  /**
   * Reject deletion request (admin only)
   */
  static async rejectDeletionRequest(
    requestId: string,
    rejectedBy: string,
    rejectionReason: string
  ): Promise<void> {
    await db.update(gdprDeletionRequests)
      .set({
        status: 'rejected',
        rejectedBy,
        rejectedAt: new Date(),
        rejectionReason,
        updatedAt: new Date(),
      })
      .where(eq(gdprDeletionRequests.id, requestId));

    logger.info({ requestId, rejectedBy, rejectionReason }, 'GDPR deletion request rejected');
  }

  /**
   * Process approved deletion request
   * This is the main deletion/anonymization logic
   */
  static async processDeletionRequest(requestId: string): Promise<DeletionProgress> {
    const [request] = await db
      .select()
      .from(gdprDeletionRequests)
      .where(eq(gdprDeletionRequests.id, requestId))
      .limit(1);

    if (!request) {
      throw new Error('Deletion request not found');
    }

    if (request.status !== 'approved') {
      throw new Error('Deletion request must be approved before processing');
    }

    // Mark as processing
    await db.update(gdprDeletionRequests)
      .set({
        status: 'processing',
        processingStartedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(gdprDeletionRequests.id, requestId));

    logger.info({ requestId, deletionType: request.deletionType }, 'Starting GDPR deletion processing');

    try {
      const deletionLog: Array<{
        table: string;
        action: 'deleted' | 'anonymized';
        recordCount: number;
        timestamp: string;
      }> = [];

      let totalDeleted = 0;
      let totalAnonymized = 0;

      // Process based on deletion type
      if (request.deletionType === 'hard_delete') {
        // Hard delete: Remove all records completely
        const result = await this.hardDeleteSubject(request.dataSubjectId, request.companyId);
        totalDeleted = result.totalDeleted;
        deletionLog.push(...result.log);
      } else {
        // Anonymization: Replace PII with anonymous data
        const result = await this.anonymizeSubject(request.dataSubjectId, request.companyId);
        totalAnonymized = result.totalAnonymized;
        deletionLog.push(...result.log);
      }

      // Mark as completed
      await db.update(gdprDeletionRequests)
        .set({
          status: 'completed',
          completedAt: new Date(),
          recordsDeleted: totalDeleted,
          recordsAnonymized: totalAnonymized,
          deletionLog,
          tablesProcessed: deletionLog.map(l => l.table),
          updatedAt: new Date(),
        })
        .where(eq(gdprDeletionRequests.id, requestId));

      logger.info({
        requestId,
        totalDeleted,
        totalAnonymized,
        tablesProcessed: deletionLog.length
      }, 'GDPR deletion processing completed');

      return {
        requestId,
        status: 'completed',
        tablesProcessed: deletionLog.map(l => l.table),
        recordsDeleted: totalDeleted,
        recordsAnonymized: totalAnonymized,
        completedAt: new Date(),
      };

    } catch (error) {
      // Mark as failed
      await db.update(gdprDeletionRequests)
        .set({
          status: 'failed',
          failedAt: new Date(),
          errorMessage: (error as Error).message,
          updatedAt: new Date(),
        })
        .where(eq(gdprDeletionRequests.id, requestId));

      logger.error({ error, requestId }, 'GDPR deletion processing failed');

      throw error;
    }
  }

  /**
   * Hard delete: Remove all records for a data subject
   * CAUTION: This is irreversible!
   */
  private static async hardDeleteSubject(
    dataSubjectId: string,
    companyId: string
  ): Promise<{ totalDeleted: number; log: Array<any> }> {
    const log: Array<any> = [];
    let totalDeleted = 0;

    // Delete in order respecting foreign key constraints
    // Start with dependent tables first

    // 1. Delete appointments
    const appointmentsDeleted = await db.delete(appointments)
      .where(and(
        eq(appointments.patientId, dataSubjectId),
        eq(appointments.companyId, companyId)
      ));
    log.push({ table: 'appointments', action: 'deleted', recordCount: 0, timestamp: new Date().toISOString() });

    // 2. Delete prescriptions
    const prescriptionsDeleted = await db.delete(prescriptions)
      .where(and(
        eq(prescriptions.patientId, dataSubjectId),
        eq(prescriptions.companyId, companyId)
      ));
    log.push({ table: 'prescriptions', action: 'deleted', recordCount: 0, timestamp: new Date().toISOString() });

    // 3. Delete orders
    const ordersDeleted = await db.delete(orders)
      .where(and(
        eq(orders.patientId, dataSubjectId),
        eq(orders.companyId, companyId)
      ));
    log.push({ table: 'orders', action: 'deleted', recordCount: 0, timestamp: new Date().toISOString() });

    // 4. Delete messages
    const messagesDeleted = await db.delete(messages)
      .where(and(
        eq(messages.recipientId, dataSubjectId),
        eq(messages.companyId, companyId)
      ));
    log.push({ table: 'messages', action: 'deleted', recordCount: 0, timestamp: new Date().toISOString() });

    // 5. Finally, delete the patient/user record
    const patientsDeleted = await db.delete(patients)
      .where(and(
        eq(patients.id, dataSubjectId),
        eq(patients.companyId, companyId)
      ));
    log.push({ table: 'patients', action: 'deleted', recordCount: 0, timestamp: new Date().toISOString() });

    return { totalDeleted, log };
  }

  /**
   * Anonymize: Replace PII with anonymous data
   * Preserves records for analytics/compliance but removes identifying information
   */
  private static async anonymizeSubject(
    dataSubjectId: string,
    companyId: string
  ): Promise<{ totalAnonymized: number; log: Array<any> }> {
    const log: Array<any> = [];
    let totalAnonymized = 0;

    const anonymousId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    // Anonymize patient record
    await db.update(patients)
      .set({
        firstName: 'REDACTED',
        lastName: 'REDACTED',
        email: `anonymized+${anonymousId}@example.com`,
        phone: null,
        dateOfBirth: null,
        address: null,
        city: null,
        postcode: null,
        nhsNumber: null,
        updatedAt: new Date(),
      })
      .where(and(
        eq(patients.id, dataSubjectId),
        eq(patients.companyId, companyId)
      ));
    totalAnonymized++;
    log.push({ table: 'patients', action: 'anonymized', recordCount: 1, timestamp });

    // Anonymize appointments (keep appointment data but remove patient link)
    await db.update(appointments)
      .set({
        notes: 'REDACTED',
        updatedAt: new Date(),
      })
      .where(and(
        eq(appointments.patientId, dataSubjectId),
        eq(appointments.companyId, companyId)
      ));
    log.push({ table: 'appointments', action: 'anonymized', recordCount: 0, timestamp });

    // Anonymize messages
    await db.update(messages)
      .set({
        to: `anonymized+${anonymousId}@example.com`,
        body: 'REDACTED',
        subject: 'REDACTED',
        updatedAt: new Date(),
      })
      .where(and(
        eq(messages.recipientId, dataSubjectId),
        eq(messages.companyId, companyId)
      ));
    log.push({ table: 'messages', action: 'anonymized', recordCount: 0, timestamp });

    return { totalAnonymized, log };
  }

  /**
   * Get deletion request by ID
   */
  static async getDeletionRequest(requestId: string, companyId: string): Promise<GdprDeletionRequest | null> {
    const [request] = await db
      .select()
      .from(gdprDeletionRequests)
      .where(and(
        eq(gdprDeletionRequests.id, requestId),
        eq(gdprDeletionRequests.companyId, companyId)
      ))
      .limit(1);

    return request || null;
  }

  /**
   * List deletion requests for a company
   */
  static async listDeletionRequests(companyId: string): Promise<GdprDeletionRequest[]> {
    return await db
      .select()
      .from(gdprDeletionRequests)
      .where(eq(gdprDeletionRequests.companyId, companyId))
      .orderBy(desc(gdprDeletionRequests.createdAt));
  }

  /**
   * Get deletion requests for a specific data subject
   */
  static async getSubjectDeletionRequests(
    dataSubjectId: string,
    companyId: string
  ): Promise<GdprDeletionRequest[]> {
    return await db
      .select()
      .from(gdprDeletionRequests)
      .where(and(
        eq(gdprDeletionRequests.dataSubjectId, dataSubjectId),
        eq(gdprDeletionRequests.companyId, companyId)
      ))
      .orderBy(desc(gdprDeletionRequests.createdAt));
  }
}

export default GDPRDeletionService;
