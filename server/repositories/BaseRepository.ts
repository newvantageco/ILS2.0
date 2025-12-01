/**
 * Base Repository
 *
 * Abstract base class for all domain repositories.
 * Provides tenant-scoped CRUD operations with automatic filtering.
 *
 * SECURITY:
 * - All queries automatically filtered by companyId
 * - Timestamps automatically managed
 * - Audit logging for mutations
 *
 * Usage:
 * ```typescript
 * class OrderRepository extends BaseRepository<typeof orders> {
 *   constructor(tenantId: string) {
 *     super(orders, tenantId, 'companyId');
 *   }
 * }
 * ```
 */

import { db } from '../db';
import {
  eq,
  and,
  desc,
  asc,
  SQL,
  sql,
  getTableColumns,
} from 'drizzle-orm';
import type {
  PgTable,
  PgColumn,
} from 'drizzle-orm/pg-core';
import { createLogger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger('BaseRepository');

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: 'asc' | 'desc';
  orderByField?: string;
}

export interface CreateOptions {
  userId?: string;
}

export interface UpdateOptions {
  userId?: string;
}

// ============================================
// BASE REPOSITORY CLASS
// ============================================

export abstract class BaseRepository<
  TTable extends PgTable,
  TInsert = any,
  TSelect = any
> {
  protected table: TTable;
  protected tenantId: string;
  protected tenantColumn: keyof TTable;
  protected logger = logger;

  constructor(
    table: TTable,
    tenantId: string,
    tenantColumn: keyof TTable = 'companyId' as keyof TTable
  ) {
    this.table = table;
    this.tenantId = tenantId;
    this.tenantColumn = tenantColumn;
  }

  // ============================================
  // TENANT FILTERING
  // ============================================

  /**
   * Get the tenant filter condition for queries
   */
  protected getTenantFilter(): SQL {
    const column = this.table[this.tenantColumn] as PgColumn;
    return eq(column, this.tenantId);
  }

  /**
   * Combine tenant filter with additional conditions
   */
  protected withTenantFilter(...conditions: (SQL | undefined)[]): SQL {
    const validConditions = conditions.filter(Boolean) as SQL[];
    return and(this.getTenantFilter(), ...validConditions)!;
  }

  // ============================================
  // READ OPERATIONS
  // ============================================

  /**
   * Find a single record by ID
   */
  async findById(id: string): Promise<TSelect | undefined> {
    const idColumn = (this.table as any).id as PgColumn;

    const [result] = await db
      .select()
      .from(this.table)
      .where(this.withTenantFilter(eq(idColumn, id)))
      .limit(1);

    return result as TSelect | undefined;
  }

  /**
   * Find multiple records with optional filters
   */
  async findMany(
    conditions?: SQL,
    options: QueryOptions = {}
  ): Promise<TSelect[]> {
    const { limit = 100, offset = 0, orderBy = 'desc', orderByField = 'createdAt' } = options;

    let query = db
      .select()
      .from(this.table)
      .where(this.withTenantFilter(conditions))
      .limit(limit)
      .offset(offset);

    // Apply ordering if the field exists
    const orderColumn = (this.table as any)[orderByField] as PgColumn | undefined;
    if (orderColumn) {
      query = query.orderBy(orderBy === 'desc' ? desc(orderColumn) : asc(orderColumn)) as any;
    }

    const results = await query;
    return results as TSelect[];
  }

  /**
   * Find all records (with pagination)
   */
  async findAll(options: QueryOptions = {}): Promise<TSelect[]> {
    return this.findMany(undefined, options);
  }

  /**
   * Count records matching conditions
   */
  async count(conditions?: SQL): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(this.table)
      .where(this.withTenantFilter(conditions));

    return Number(result?.count || 0);
  }

  /**
   * Check if a record exists
   */
  async exists(id: string): Promise<boolean> {
    const record = await this.findById(id);
    return !!record;
  }

  // ============================================
  // WRITE OPERATIONS
  // ============================================

  /**
   * Create a new record
   * Automatically adds tenantId and timestamps
   */
  async create(data: Partial<TInsert>, options: CreateOptions = {}): Promise<TSelect> {
    const now = new Date();
    const id = (data as any).id || uuidv4();

    const insertData = {
      ...data,
      id,
      [this.tenantColumn]: this.tenantId,
      createdAt: now,
      updatedAt: now,
      createdBy: options.userId,
    } as any;

    const [result] = await db
      .insert(this.table)
      .values(insertData)
      .returning();

    this.logMutation('create', id, options.userId);

    return result as TSelect;
  }

  /**
   * Create multiple records
   */
  async createMany(
    records: Partial<TInsert>[],
    options: CreateOptions = {}
  ): Promise<TSelect[]> {
    const now = new Date();

    const insertData = records.map(data => ({
      ...data,
      id: (data as any).id || uuidv4(),
      [this.tenantColumn]: this.tenantId,
      createdAt: now,
      updatedAt: now,
      createdBy: options.userId,
    })) as any[];

    const results = await db
      .insert(this.table)
      .values(insertData)
      .returning();

    this.logMutation('createMany', `${results.length} records`, options.userId);

    return results as TSelect[];
  }

  /**
   * Update a record by ID
   * Automatically updates timestamp
   */
  async update(
    id: string,
    data: Partial<TInsert>,
    options: UpdateOptions = {}
  ): Promise<TSelect | undefined> {
    const idColumn = (this.table as any).id as PgColumn;

    const updateData = {
      ...data,
      updatedAt: new Date(),
      updatedBy: options.userId,
    } as any;

    // Remove fields that shouldn't be updated
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.createdBy;
    delete updateData[this.tenantColumn];

    const [result] = await db
      .update(this.table)
      .set(updateData)
      .where(this.withTenantFilter(eq(idColumn, id)))
      .returning();

    if (result) {
      this.logMutation('update', id, options.userId);
    }

    return result as TSelect | undefined;
  }

  /**
   * Delete a record by ID
   * Returns true if deleted, false if not found
   */
  async delete(id: string): Promise<boolean> {
    const idColumn = (this.table as any).id as PgColumn;

    const result = await db
      .delete(this.table)
      .where(this.withTenantFilter(eq(idColumn, id)))
      .returning({ id: idColumn });

    if (result.length > 0) {
      this.logMutation('delete', id);
      return true;
    }

    return false;
  }

  /**
   * Soft delete a record (set deletedAt timestamp)
   * Only works if table has deletedAt column
   */
  async softDelete(id: string, userId?: string): Promise<boolean> {
    const deletedAtColumn = (this.table as any).deletedAt as PgColumn | undefined;

    if (!deletedAtColumn) {
      throw new Error('Table does not support soft delete');
    }

    const result = await this.update(id, {
      deletedAt: new Date(),
      deletedBy: userId,
    } as any);

    return !!result;
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Log mutation for audit trail
   */
  protected logMutation(action: string, recordId: string, userId?: string): void {
    logger.info({
      audit: true,
      repository: this.constructor.name,
      action,
      recordId,
      tenantId: this.tenantId,
      userId,
    }, `Repository mutation: ${action}`);
  }

  /**
   * Get the tenant ID for this repository
   */
  getTenantId(): string {
    return this.tenantId;
  }

  /**
   * Execute a raw query with tenant filter
   * Use with caution - prefer typed methods
   */
  protected async rawQuery<T>(
    queryFn: (tenantFilter: SQL) => Promise<T>
  ): Promise<T> {
    return queryFn(this.getTenantFilter());
  }
}

export default BaseRepository;
