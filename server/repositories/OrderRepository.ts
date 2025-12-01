/**
 * Order Repository
 *
 * Tenant-scoped repository for order management.
 * Extends BaseRepository with order-specific operations.
 */

import { db } from '../db';
import {
  orders,
  orderTimeline,
  patients,
  users,
} from '@shared/schema';
import type { Order, OrderTimeline, Patient } from '@shared/schema';
import { eq, and, desc, sql, inArray, gte, lte } from 'drizzle-orm';
import { BaseRepository, type QueryOptions } from './BaseRepository';
import { v4 as uuidv4 } from 'uuid';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface OrderWithDetails extends Order {
  patient?: Pick<Patient, 'id' | 'firstName' | 'lastName' | 'email'>;
  ecp?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    organizationName: string | null;
  };
  timeline?: OrderTimeline[];
  lineItems?: any[];
}

export interface OrderFilters {
  status?: string;
  ecpId?: string;
  patientId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface OrderStats {
  total: number;
  byStatus: Record<string, number>;
  period: string;
}

// ============================================
// ORDER REPOSITORY CLASS
// ============================================

export class OrderRepository extends BaseRepository<typeof orders, Order, Order> {
  constructor(tenantId: string) {
    super(orders, tenantId, 'companyId');
  }

  // ============================================
  // EXTENDED QUERY METHODS
  // ============================================

  /**
   * Get order with full details including patient and ECP
   */
  async getWithDetails(id: string): Promise<OrderWithDetails | undefined> {
    const [result] = await db
      .select({
        order: orders,
        patient: {
          id: patients.id,
          firstName: patients.firstName,
          lastName: patients.lastName,
          email: patients.email,
        },
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
      .where(and(
        eq(orders.id, id),
        eq(orders.companyId, this.tenantId)
      ))
      .limit(1);

    if (!result) return undefined;

    // Get timeline
    const timeline = await db
      .select()
      .from(orderTimeline)
      .where(eq(orderTimeline.orderId, id))
      .orderBy(desc(orderTimeline.timestamp));

    return {
      ...result.order,
      patient: result.patient,
      ecp: result.ecp,
      timeline,
    };
  }

  /**
   * Get orders by status with pagination
   */
  async getByStatus(
    status: string,
    options: QueryOptions = {}
  ): Promise<Order[]> {
    const { limit = 50, offset = 0 } = options;

    const result = await db
      .select()
      .from(orders)
      .where(and(
        eq(orders.companyId, this.tenantId),
        eq(orders.status, status as any)
      ))
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    return result;
  }

  /**
   * Update order status with timeline entry
   */
  async updateStatus(
    id: string,
    status: string,
    userId: string,
    notes?: string
  ): Promise<Order | undefined> {
    // Update the order
    const updatedOrder = await this.update(id, { status } as any, { userId });

    if (!updatedOrder) return undefined;

    // Add timeline entry
    await db.insert(orderTimeline).values({
      id: uuidv4(),
      orderId: id,
      status: status as any,
      notes,
      userId,
      timestamp: new Date(),
    });

    this.logMutation('updateStatus', id, userId);

    return updatedOrder;
  }

  /**
   * Get order statistics by status
   */
  async getStats(daysBack: number = 30): Promise<OrderStats> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysBack);

    const stats = await db
      .select({
        status: orders.status,
        count: sql<number>`count(*)`,
      })
      .from(orders)
      .where(and(
        eq(orders.companyId, this.tenantId),
        gte(orders.createdAt, cutoff)
      ))
      .groupBy(orders.status);

    const byStatus: Record<string, number> = {};
    let total = 0;

    for (const stat of stats) {
      const count = Number(stat.count);
      byStatus[stat.status] = count;
      total += count;
    }

    return {
      total,
      byStatus,
      period: `${daysBack} days`,
    };
  }

  /**
   * Search orders with filters
   */
  async search(
    query: string,
    filters: OrderFilters = {},
    options: QueryOptions = {}
  ): Promise<Order[]> {
    const { limit = 50, offset = 0 } = options;
    const conditions = [eq(orders.companyId, this.tenantId)];

    // Add text search on order number
    if (query) {
      conditions.push(
        sql`${orders.orderNumber} ILIKE ${`%${query}%`}`
      );
    }

    // Add filters
    if (filters.status) {
      conditions.push(eq(orders.status, filters.status as any));
    }
    if (filters.ecpId) {
      conditions.push(eq(orders.ecpId, filters.ecpId));
    }
    if (filters.patientId) {
      conditions.push(eq(orders.patientId, filters.patientId));
    }
    if (filters.startDate) {
      conditions.push(gte(orders.createdAt, filters.startDate));
    }
    if (filters.endDate) {
      conditions.push(lte(orders.createdAt, filters.endDate));
    }

    const result = await db
      .select()
      .from(orders)
      .where(and(...conditions))
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    return result;
  }

  /**
   * Get orders for a specific patient
   */
  async getByPatient(patientId: string, options: QueryOptions = {}): Promise<Order[]> {
    return this.findMany(
      eq(orders.patientId, patientId),
      options
    );
  }

  /**
   * Get orders for a specific ECP
   */
  async getByEcp(ecpId: string, options: QueryOptions = {}): Promise<Order[]> {
    return this.findMany(
      eq(orders.ecpId, ecpId),
      options
    );
  }

  /**
   * Get recent orders
   */
  async getRecent(limit: number = 10): Promise<Order[]> {
    return this.findMany(undefined, { limit, orderBy: 'desc', orderByField: 'createdAt' });
  }
}

export default OrderRepository;
