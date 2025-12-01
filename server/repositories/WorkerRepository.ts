/**
 * Worker Repository
 *
 * SECURITY: This repository provides cross-tenant access for background workers.
 * Workers run outside of HTTP request context and cannot use normal tenant middleware.
 *
 * All access is audit logged and includes the worker ID for traceability.
 *
 * USE CASES:
 * 1. PDF generation worker - needs order details to generate PDF
 * 2. LIMS integration worker - needs order details to send to lab
 * 3. Email workers - need order/patient data to send notifications
 * 4. Scheduled jobs - need to process data across tenants
 *
 * SECURITY CONTROLS:
 * - All access is logged with worker ID
 * - Workers should have minimal permissions
 * - Data returned should be minimal for the task
 */

import { db } from '../db';
import { orders, patients, users, invoices } from '@shared/schema';
import type { Order, Patient, User, OrderWithDetails } from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import { createLogger } from '../utils/logger';

const logger = createLogger('WorkerRepository');

/**
 * Audit log entry for worker repository access
 */
interface WorkerAuditEntry {
  action: string;
  workerId: string;
  workerType: string;
  targetId: string;
  targetType: string;
  tenantId?: string;
  timestamp: Date;
  success: boolean;
  metadata?: Record<string, any>;
}

/**
 * Log worker access for compliance
 */
async function auditWorkerAccess(entry: WorkerAuditEntry): Promise<void> {
  try {
    logger.info({
      audit: true,
      worker: true,
      ...entry,
    }, `Worker access: ${entry.action}`);

    // TODO: In production, also log to database audit table
    // await db.insert(workerAuditLogs).values(entry);
  } catch (error) {
    logger.error({ err: error }, 'Failed to write worker audit log');
  }
}

/**
 * Worker types that can access this repository
 */
export type WorkerType =
  | 'OrderCreatedPdfWorker'
  | 'OrderCreatedLimsWorker'
  | 'OrderShippedEmailWorker'
  | 'InvoiceGenerationWorker'
  | 'ScheduledReportWorker'
  | 'DataSyncWorker';

/**
 * Worker Repository
 *
 * Provides AUDITED cross-tenant access for background workers.
 */
export class WorkerRepository {
  private workerId: string;
  private workerType: WorkerType;

  constructor(workerId: string, workerType: WorkerType) {
    this.workerId = workerId;
    this.workerType = workerType;
  }

  /**
   * Get order with full details for worker processing
   *
   * @param orderId - The order ID to fetch
   */
  async getOrderWithDetails(orderId: string): Promise<OrderWithDetails | undefined> {
    const result = await db
      .select({
        order: orders,
        patient: patients,
        ecp: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          organizationName: users.organizationName,
        },
      })
      .from(orders)
      .innerJoin(patients, eq(orders.patientId, patients.id))
      .innerJoin(users, eq(orders.ecpId, users.id))
      .where(eq(orders.id, orderId))
      .limit(1);

    const found = result.length > 0;
    const order = found
      ? {
          ...result[0].order,
          patient: result[0].patient,
          ecp: result[0].ecp,
        }
      : undefined;

    await auditWorkerAccess({
      action: 'GET_ORDER_WITH_DETAILS',
      workerId: this.workerId,
      workerType: this.workerType,
      targetId: orderId,
      targetType: 'order',
      tenantId: order?.companyId || undefined,
      timestamp: new Date(),
      success: found,
    });

    return order;
  }

  /**
   * Update order with worker-generated data
   *
   * @param orderId - The order ID to update
   * @param updates - The fields to update
   */
  async updateOrder(
    orderId: string,
    updates: Partial<Order>
  ): Promise<Order | undefined> {
    // First fetch the order to get tenant context for audit
    const existingOrder = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!existingOrder.length) {
      await auditWorkerAccess({
        action: 'UPDATE_ORDER_NOT_FOUND',
        workerId: this.workerId,
        workerType: this.workerType,
        targetId: orderId,
        targetType: 'order',
        timestamp: new Date(),
        success: false,
      });
      return undefined;
    }

    const [updatedOrder] = await db
      .update(orders)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))
      .returning();

    await auditWorkerAccess({
      action: 'UPDATE_ORDER',
      workerId: this.workerId,
      workerType: this.workerType,
      targetId: orderId,
      targetType: 'order',
      tenantId: updatedOrder?.companyId || existingOrder[0].companyId || undefined,
      timestamp: new Date(),
      success: !!updatedOrder,
      metadata: { updatedFields: Object.keys(updates) },
    });

    return updatedOrder;
  }

  /**
   * Get patient for worker processing (minimal PHI)
   *
   * @param patientId - The patient ID to fetch
   */
  async getPatient(patientId: string): Promise<Patient | undefined> {
    const [patient] = await db
      .select()
      .from(patients)
      .where(eq(patients.id, patientId));

    await auditWorkerAccess({
      action: 'GET_PATIENT',
      workerId: this.workerId,
      workerType: this.workerType,
      targetId: patientId,
      targetType: 'patient',
      tenantId: patient?.companyId || undefined,
      timestamp: new Date(),
      success: !!patient,
    });

    return patient;
  }

  /**
   * Get user for worker processing (e.g., for email notifications)
   *
   * @param userId - The user ID to fetch
   */
  async getUser(userId: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    await auditWorkerAccess({
      action: 'GET_USER',
      workerId: this.workerId,
      workerType: this.workerType,
      targetId: userId,
      targetType: 'user',
      tenantId: user?.companyId || undefined,
      timestamp: new Date(),
      success: !!user,
    });

    return user;
  }
}

/**
 * Factory function to create a worker repository with proper identification
 */
export function createWorkerRepository(
  workerId: string,
  workerType: WorkerType
): WorkerRepository {
  return new WorkerRepository(workerId, workerType);
}

export default WorkerRepository;
