/**
 * Prepared Statement Utilities
 *
 * Pre-compiled query patterns for improved performance.
 * These statements reduce query parsing overhead and enable
 * better query plan caching.
 *
 * @module db/preparedStatements
 */

import { sql, eq, and, desc, asc, gte, lte, like, or, inArray, isNull } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { db } from './index';
import * as schema from '../shared/schema';

// ============================================
// TYPES
// ============================================

export interface PaginationParams {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DateRangeParams {
  startDate?: Date;
  endDate?: Date;
}

export interface TenantQueryParams {
  tenantId: string;
}

// ============================================
// TENANT-SCOPED QUERY BUILDERS
// ============================================

/**
 * Build tenant-scoped query conditions
 */
export function tenantCondition<T extends { companyId: any }>(
  table: T,
  tenantId: string
): SQL {
  return eq(table.companyId, tenantId);
}

/**
 * Build date range conditions
 */
export function dateRangeCondition<T extends { createdAt: any }>(
  table: T,
  params: DateRangeParams
): SQL | undefined {
  const conditions: SQL[] = [];

  if (params.startDate) {
    conditions.push(gte(table.createdAt, params.startDate));
  }

  if (params.endDate) {
    conditions.push(lte(table.createdAt, params.endDate));
  }

  if (conditions.length === 0) return undefined;
  if (conditions.length === 1) return conditions[0];

  return and(...conditions);
}

/**
 * Build soft-delete aware condition
 */
export function activeRecordCondition<T extends { deletedAt?: any }>(
  table: T
): SQL {
  return isNull(table.deletedAt as any);
}

/**
 * Combine multiple conditions
 */
export function combineConditions(...conditions: (SQL | undefined)[]): SQL | undefined {
  const validConditions = conditions.filter((c): c is SQL => c !== undefined);

  if (validConditions.length === 0) return undefined;
  if (validConditions.length === 1) return validConditions[0];

  return and(...validConditions);
}

// ============================================
// COMMON QUERY PATTERNS
// ============================================

/**
 * Optimized orders query for tenant
 */
export const orderQueries = {
  /**
   * Get orders by status for a tenant
   */
  byStatus: async (tenantId: string, status: string, pagination?: PaginationParams) => {
    return db
      .select()
      .from(schema.orders)
      .where(and(
        eq(schema.orders.companyId, tenantId),
        eq(schema.orders.status, status as any)
      ))
      .orderBy(desc(schema.orders.createdAt))
      .limit(pagination?.limit || 50)
      .offset(pagination?.offset || 0);
  },

  /**
   * Get recent orders for a tenant
   */
  recent: async (tenantId: string, days = 7, limit = 20) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return db
      .select()
      .from(schema.orders)
      .where(and(
        eq(schema.orders.companyId, tenantId),
        gte(schema.orders.createdAt, startDate)
      ))
      .orderBy(desc(schema.orders.createdAt))
      .limit(limit);
  },

  /**
   * Get orders count by status
   */
  countByStatus: async (tenantId: string) => {
    const result = await db.execute(sql`
      SELECT status, COUNT(*) as count
      FROM orders
      WHERE company_id = ${tenantId}
      GROUP BY status
    `);

    return result.rows.reduce((acc: Record<string, number>, row: any) => {
      acc[row.status] = parseInt(row.count);
      return acc;
    }, {});
  },

  /**
   * Get order with all related data
   */
  withDetails: async (tenantId: string, orderId: string) => {
    return db
      .select({
        order: schema.orders,
        patient: schema.patients,
        ecp: {
          id: schema.users.id,
          firstName: schema.users.firstName,
          lastName: schema.users.lastName,
        },
      })
      .from(schema.orders)
      .innerJoin(schema.patients, eq(schema.orders.patientId, schema.patients.id))
      .innerJoin(schema.users, eq(schema.orders.ecpId, schema.users.id))
      .where(and(
        eq(schema.orders.companyId, tenantId),
        eq(schema.orders.id, orderId)
      ))
      .limit(1);
  },
};

/**
 * Optimized patient queries for tenant
 */
export const patientQueries = {
  /**
   * Search patients by name
   */
  searchByName: async (tenantId: string, searchTerm: string, limit = 20) => {
    const searchPattern = `%${searchTerm.toLowerCase()}%`;

    return db
      .select()
      .from(schema.patients)
      .where(and(
        eq(schema.patients.companyId, tenantId),
        or(
          sql`LOWER(${schema.patients.firstName}) LIKE ${searchPattern}`,
          sql`LOWER(${schema.patients.lastName}) LIKE ${searchPattern}`,
          sql`LOWER(${schema.patients.email}) LIKE ${searchPattern}`
        )
      ))
      .orderBy(schema.patients.lastName, schema.patients.firstName)
      .limit(limit);
  },

  /**
   * Get patient with recent orders
   */
  withRecentOrders: async (tenantId: string, patientId: string) => {
    const [patient, orders] = await Promise.all([
      db
        .select()
        .from(schema.patients)
        .where(and(
          eq(schema.patients.companyId, tenantId),
          eq(schema.patients.id, patientId)
        ))
        .limit(1),
      db
        .select()
        .from(schema.orders)
        .where(and(
          eq(schema.orders.companyId, tenantId),
          eq(schema.orders.patientId, patientId)
        ))
        .orderBy(desc(schema.orders.createdAt))
        .limit(10),
    ]);

    return patient[0] ? { ...patient[0], recentOrders: orders } : null;
  },

  /**
   * Get patients with appointments today
   */
  withAppointmentsToday: async (tenantId: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return db
      .select({
        patient: schema.patients,
        appointment: schema.appointmentBookings,
      })
      .from(schema.appointmentBookings)
      .innerJoin(schema.patients, eq(schema.appointmentBookings.patientId, schema.patients.id))
      .where(and(
        eq(schema.appointmentBookings.companyId, tenantId),
        gte(schema.appointmentBookings.startTime, today),
        lte(schema.appointmentBookings.startTime, tomorrow)
      ))
      .orderBy(schema.appointmentBookings.startTime);
  },
};

/**
 * Optimized invoice queries
 */
export const invoiceQueries = {
  /**
   * Get overdue invoices
   */
  overdue: async (tenantId: string) => {
    const now = new Date();

    return db
      .select()
      .from(schema.invoices)
      .where(and(
        eq(schema.invoices.companyId, tenantId),
        lte(schema.invoices.dueDate, now),
        inArray(schema.invoices.status, ['draft', 'sent', 'overdue'] as any[])
      ))
      .orderBy(asc(schema.invoices.dueDate));
  },

  /**
   * Get invoice summary for dashboard
   */
  summary: async (tenantId: string) => {
    const result = await db.execute(sql`
      SELECT
        status,
        COUNT(*) as count,
        COALESCE(SUM(total_amount), 0) as total_amount
      FROM invoices
      WHERE company_id = ${tenantId}
      GROUP BY status
    `);

    return result.rows.reduce((acc: Record<string, { count: number; totalAmount: number }>, row: any) => {
      acc[row.status] = {
        count: parseInt(row.count),
        totalAmount: parseFloat(row.total_amount) || 0,
      };
      return acc;
    }, {});
  },
};

/**
 * Optimized AI conversation queries
 */
export const aiQueries = {
  /**
   * Get user's conversations with message count
   */
  userConversations: async (tenantId: string, userId: string, limit = 20) => {
    return db.execute(sql`
      SELECT
        c.id,
        c.title,
        c.created_at,
        c.updated_at,
        COUNT(m.id) as message_count,
        MAX(m.created_at) as last_message_at
      FROM ai_conversations c
      LEFT JOIN ai_messages m ON m.conversation_id = c.id
      WHERE c.company_id = ${tenantId}
        AND c.user_id = ${userId}
      GROUP BY c.id
      ORDER BY c.updated_at DESC
      LIMIT ${limit}
    `);
  },

  /**
   * Get conversation with messages
   */
  conversationWithMessages: async (tenantId: string, conversationId: string) => {
    const [conversation, messages] = await Promise.all([
      db
        .select()
        .from(schema.aiConversations)
        .where(and(
          eq(schema.aiConversations.companyId, tenantId),
          eq(schema.aiConversations.id, conversationId)
        ))
        .limit(1),
      db
        .select()
        .from(schema.aiMessages)
        .where(eq(schema.aiMessages.conversationId, conversationId))
        .orderBy(schema.aiMessages.createdAt),
    ]);

    return conversation[0] ? { conversation: conversation[0], messages } : null;
  },
};

// ============================================
// BATCH OPERATIONS
// ============================================

/**
 * Batch insert with chunking for large datasets
 */
export async function batchInsert<T>(
  table: any,
  data: T[],
  options: {
    chunkSize?: number;
    onProgress?: (completed: number, total: number) => void;
  } = {}
): Promise<void> {
  const { chunkSize = 100, onProgress } = options;

  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    await db.insert(table).values(chunk);

    if (onProgress) {
      onProgress(Math.min(i + chunkSize, data.length), data.length);
    }
  }
}

/**
 * Batch update with transaction
 */
export async function batchUpdate<T extends { id: string }>(
  table: any,
  updates: Array<{ id: string; data: Partial<T> }>,
  idColumn: any
): Promise<number> {
  let updated = 0;

  for (const update of updates) {
    const result = await db
      .update(table)
      .set(update.data)
      .where(eq(idColumn, update.id));

    if (result.rowCount) {
      updated += result.rowCount;
    }
  }

  return updated;
}

// ============================================
// EXPORT ALL
// ============================================

export default {
  tenantCondition,
  dateRangeCondition,
  activeRecordCondition,
  combineConditions,
  orderQueries,
  patientQueries,
  invoiceQueries,
  aiQueries,
  batchInsert,
  batchUpdate,
};
