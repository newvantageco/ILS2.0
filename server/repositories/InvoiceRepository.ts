/**
 * Invoice Repository
 *
 * Handles tenant-scoped invoice operations including:
 * - Invoice CRUD with line items
 * - Payment recording
 * - Invoice status management
 * - Billing analytics
 *
 * SECURITY:
 * - All queries scoped by companyId
 * - Audit logging for financial mutations
 * - Soft delete support for data retention
 *
 * @module server/repositories/InvoiceRepository
 */

import { BaseRepository, QueryOptions } from './BaseRepository';
import { db } from '../db';
import {
  invoices,
  invoiceLineItems,
  payments,
  type Invoice,
  type InsertInvoice,
  type InvoiceLineItem,
  type InsertInvoiceLineItem,
  type Payment,
  type InsertPayment,
} from '@shared/schema/billing';
import { eq, and, desc, sql, gte, lte, isNull, inArray } from 'drizzle-orm';
import { createLogger } from '../utils/logger';

const logger = createLogger('InvoiceRepository');

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface InvoiceWithLineItems extends Invoice {
  lineItems: InvoiceLineItem[];
}

export interface InvoiceWithPayments extends Invoice {
  payments: Payment[];
}

export interface InvoiceSearchOptions extends QueryOptions {
  status?: 'draft' | 'paid' | 'void';
  patientId?: string;
  ecpId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
}

export interface InvoiceStats {
  totalInvoices: number;
  totalRevenue: number;
  totalOutstanding: number;
  averageInvoiceAmount: number;
  invoicesByStatus: Record<string, number>;
}

// ============================================
// INVOICE REPOSITORY
// ============================================

export class InvoiceRepository extends BaseRepository<typeof invoices, InsertInvoice, Invoice> {
  constructor(tenantId: string) {
    super(invoices, tenantId, 'companyId');
  }

  // ============================================
  // INVOICE QUERIES
  // ============================================

  /**
   * Find invoice by ID with line items
   */
  async findByIdWithLineItems(id: string): Promise<InvoiceWithLineItems | undefined> {
    const invoice = await this.findById(id);
    if (!invoice) return undefined;

    const items = await db
      .select()
      .from(invoiceLineItems)
      .where(eq(invoiceLineItems.invoiceId, id))
      .orderBy(invoiceLineItems.createdAt);

    return {
      ...invoice,
      lineItems: items,
    };
  }

  /**
   * Find invoice by invoice number
   */
  async findByInvoiceNumber(invoiceNumber: string): Promise<Invoice | undefined> {
    const [result] = await db
      .select()
      .from(invoices)
      .where(
        this.withTenantFilter(
          eq(invoices.invoiceNumber, invoiceNumber),
          isNull(invoices.deletedAt)
        )
      )
      .limit(1);

    return result;
  }

  /**
   * Search invoices with filters
   */
  async search(options: InvoiceSearchOptions = {}): Promise<Invoice[]> {
    const conditions: any[] = [isNull(invoices.deletedAt)];

    if (options.status) {
      conditions.push(eq(invoices.status, options.status));
    }
    if (options.patientId) {
      conditions.push(eq(invoices.patientId, options.patientId));
    }
    if (options.ecpId) {
      conditions.push(eq(invoices.ecpId, options.ecpId));
    }
    if (options.dateFrom) {
      conditions.push(gte(invoices.invoiceDate, options.dateFrom));
    }
    if (options.dateTo) {
      conditions.push(lte(invoices.invoiceDate, options.dateTo));
    }
    if (options.minAmount !== undefined) {
      conditions.push(gte(invoices.totalAmount, options.minAmount.toString()));
    }
    if (options.maxAmount !== undefined) {
      conditions.push(lte(invoices.totalAmount, options.maxAmount.toString()));
    }

    return this.findMany(and(...conditions), {
      limit: options.limit,
      offset: options.offset,
      orderBy: options.orderBy,
      orderByField: options.orderByField || 'invoiceDate',
    });
  }

  /**
   * Get invoices for a patient
   */
  async findByPatientId(patientId: string, options: QueryOptions = {}): Promise<Invoice[]> {
    return this.findMany(
      and(eq(invoices.patientId, patientId), isNull(invoices.deletedAt)),
      options
    );
  }

  /**
   * Get unpaid/draft invoices
   */
  async findOutstanding(options: QueryOptions = {}): Promise<Invoice[]> {
    return this.findMany(
      and(eq(invoices.status, 'draft'), isNull(invoices.deletedAt)),
      options
    );
  }

  // ============================================
  // INVOICE MUTATIONS
  // ============================================

  /**
   * Create invoice with line items
   */
  async createWithLineItems(
    invoiceData: Partial<InsertInvoice>,
    lineItems: Partial<InsertInvoiceLineItem>[],
    userId?: string
  ): Promise<InvoiceWithLineItems> {
    // Generate invoice number if not provided
    if (!invoiceData.invoiceNumber) {
      invoiceData.invoiceNumber = await this.generateInvoiceNumber();
    }

    // Calculate total from line items if not provided
    if (!invoiceData.totalAmount && lineItems.length > 0) {
      invoiceData.totalAmount = lineItems
        .reduce((sum, item) => sum + parseFloat(item.totalPrice?.toString() || '0'), 0)
        .toFixed(2);
    }

    // Create invoice
    const invoice = await this.create(invoiceData, { userId });

    // Create line items
    const createdItems: InvoiceLineItem[] = [];
    for (const item of lineItems) {
      const [createdItem] = await db
        .insert(invoiceLineItems)
        .values({
          ...item,
          invoiceId: invoice.id,
          createdAt: new Date(),
        })
        .returning();
      createdItems.push(createdItem);
    }

    logger.info({
      audit: true,
      action: 'createInvoiceWithLineItems',
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      lineItemCount: createdItems.length,
      tenantId: this.tenantId,
      userId,
    }, 'Invoice created with line items');

    return {
      ...invoice,
      lineItems: createdItems,
    };
  }

  /**
   * Update invoice status
   */
  async updateStatus(
    id: string,
    status: 'draft' | 'paid' | 'void',
    userId?: string
  ): Promise<Invoice | undefined> {
    const updates: Partial<InsertInvoice> = { status };

    // If marking as paid, set the amount paid to total
    if (status === 'paid') {
      const invoice = await this.findById(id);
      if (invoice) {
        updates.amountPaid = invoice.totalAmount;
      }
    }

    const result = await this.update(id, updates, { userId });

    if (result) {
      logger.info({
        audit: true,
        action: 'updateInvoiceStatus',
        invoiceId: id,
        newStatus: status,
        tenantId: this.tenantId,
        userId,
      }, `Invoice status updated to ${status}`);
    }

    return result;
  }

  /**
   * Record payment against invoice
   */
  async recordPayment(
    invoiceId: string,
    amount: number,
    paymentMethod?: string,
    userId?: string
  ): Promise<{ invoice: Invoice; payment: Payment } | undefined> {
    const invoice = await this.findById(invoiceId);
    if (!invoice) return undefined;

    // Create payment record
    const [payment] = await db
      .insert(payments)
      .values({
        companyId: this.tenantId,
        patientId: invoice.patientId,
        amount: amount.toFixed(2),
        paymentMethod,
        paymentDate: new Date(),
        status: 'completed',
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Update invoice amount paid
    const newAmountPaid = parseFloat(invoice.amountPaid || '0') + amount;
    const totalAmount = parseFloat(invoice.totalAmount);

    const updates: Partial<InsertInvoice> = {
      amountPaid: newAmountPaid.toFixed(2),
    };

    // Auto-mark as paid if fully paid
    if (newAmountPaid >= totalAmount) {
      updates.status = 'paid';
    }

    const updatedInvoice = await this.update(invoiceId, updates, { userId });

    logger.info({
      audit: true,
      action: 'recordPayment',
      invoiceId,
      paymentId: payment.id,
      amount,
      newAmountPaid,
      tenantId: this.tenantId,
      userId,
    }, 'Payment recorded');

    return {
      invoice: updatedInvoice!,
      payment,
    };
  }

  /**
   * Add line item to existing invoice
   */
  async addLineItem(
    invoiceId: string,
    lineItem: Partial<InsertInvoiceLineItem>
  ): Promise<InvoiceLineItem | undefined> {
    // Verify invoice exists and belongs to tenant
    const invoice = await this.findById(invoiceId);
    if (!invoice) return undefined;

    const [created] = await db
      .insert(invoiceLineItems)
      .values({
        ...lineItem,
        invoiceId,
        createdAt: new Date(),
      })
      .returning();

    // Update invoice total
    const newTotal = parseFloat(invoice.totalAmount) + parseFloat(lineItem.totalPrice?.toString() || '0');
    await this.update(invoiceId, { totalAmount: newTotal.toFixed(2) });

    return created;
  }

  /**
   * Remove line item from invoice
   */
  async removeLineItem(invoiceId: string, lineItemId: string): Promise<boolean> {
    // Verify invoice exists and belongs to tenant
    const invoice = await this.findById(invoiceId);
    if (!invoice) return false;

    // Get line item to calculate new total
    const [lineItem] = await db
      .select()
      .from(invoiceLineItems)
      .where(
        and(
          eq(invoiceLineItems.id, lineItemId),
          eq(invoiceLineItems.invoiceId, invoiceId)
        )
      )
      .limit(1);

    if (!lineItem) return false;

    // Delete line item
    await db
      .delete(invoiceLineItems)
      .where(eq(invoiceLineItems.id, lineItemId));

    // Update invoice total
    const newTotal = parseFloat(invoice.totalAmount) - parseFloat(lineItem.totalPrice);
    await this.update(invoiceId, { totalAmount: Math.max(0, newTotal).toFixed(2) });

    return true;
  }

  // ============================================
  // ANALYTICS
  // ============================================

  /**
   * Get invoice statistics for the tenant
   */
  async getStats(dateFrom?: Date, dateTo?: Date): Promise<InvoiceStats> {
    const conditions: any[] = [
      this.getTenantFilter(),
      isNull(invoices.deletedAt),
    ];

    if (dateFrom) {
      conditions.push(gte(invoices.invoiceDate, dateFrom));
    }
    if (dateTo) {
      conditions.push(lte(invoices.invoiceDate, dateTo));
    }

    const [stats] = await db
      .select({
        totalInvoices: sql<number>`count(*)`,
        totalRevenue: sql<number>`coalesce(sum(${invoices.totalAmount}::numeric), 0)`,
        totalPaid: sql<number>`coalesce(sum(${invoices.amountPaid}::numeric), 0)`,
        avgAmount: sql<number>`coalesce(avg(${invoices.totalAmount}::numeric), 0)`,
      })
      .from(invoices)
      .where(and(...conditions));

    // Get counts by status
    const statusCounts = await db
      .select({
        status: invoices.status,
        count: sql<number>`count(*)`,
      })
      .from(invoices)
      .where(and(...conditions))
      .groupBy(invoices.status);

    const invoicesByStatus: Record<string, number> = {};
    for (const row of statusCounts) {
      invoicesByStatus[row.status] = Number(row.count);
    }

    return {
      totalInvoices: Number(stats.totalInvoices),
      totalRevenue: Number(stats.totalRevenue),
      totalOutstanding: Number(stats.totalRevenue) - Number(stats.totalPaid),
      averageInvoiceAmount: Number(stats.avgAmount),
      invoicesByStatus,
    };
  }

  // ============================================
  // UTILITIES
  // ============================================

  /**
   * Generate unique invoice number
   */
  private async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;

    // Get the highest invoice number for this year
    const [latest] = await db
      .select({ invoiceNumber: invoices.invoiceNumber })
      .from(invoices)
      .where(
        and(
          this.getTenantFilter(),
          sql`${invoices.invoiceNumber} LIKE ${prefix + '%'}`
        )
      )
      .orderBy(desc(invoices.invoiceNumber))
      .limit(1);

    let nextNumber = 1;
    if (latest?.invoiceNumber) {
      const currentNumber = parseInt(latest.invoiceNumber.replace(prefix, ''), 10);
      if (!isNaN(currentNumber)) {
        nextNumber = currentNumber + 1;
      }
    }

    return `${prefix}${nextNumber.toString().padStart(6, '0')}`;
  }
}

export default InvoiceRepository;
