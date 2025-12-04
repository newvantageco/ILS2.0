/**
 * AI Tool Registry
 *
 * Manages tools available to the AI for database operations and actions.
 * All tools enforce tenant isolation using the companyId.
 *
 * Tool Categories:
 * - Query Tools: Read-only data access (orders, patients, inventory)
 * - Action Tools: Create/update operations (purchase orders, reminders)
 * - Analysis Tools: Generate reports and insights
 *
 * SECURITY:
 * - All queries scoped to companyId
 * - Audit logging for all tool executions
 * - Approval workflow for high-impact actions
 */

import Anthropic from '@anthropic-ai/sdk';
import { db } from '../../db';
import {
  orders,
  patients,
  users,
  products,  // Moved to inventory domain
  invoices,  // Moved to billing domain
  appointments,  // Moved to appointments domain
} from '@shared/schema';

// Import tables not yet extracted to modular domains
import {
  purchaseOrders,
} from '@shared/schemaLegacy';
import { eq, and, desc, gte, sql, count } from 'drizzle-orm';
import { createLogger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger('ToolRegistry');

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  handler: (params: Record<string, any>, userId: string) => Promise<any>;
  requiresApproval?: (params: Record<string, any>) => boolean;
  auditCategory?: 'read' | 'write' | 'phi';
}

export interface ToolExecutionLog {
  toolName: string;
  companyId: string;
  userId: string;
  params: Record<string, any>;
  result: any;
  executedAt: Date;
  durationMs: number;
}

// ============================================
// TOOL REGISTRY CLASS
// ============================================

export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();
  private companyId: string;

  constructor(companyId: string) {
    this.companyId = companyId;
    this.registerCoreTools();
  }

  // ============================================
  // TOOL REGISTRATION
  // ============================================

  private registerCoreTools(): void {
    // ORDER TOOLS
    this.register({
      name: 'get_orders',
      description: 'Get orders with optional filters. Returns order list with basic details.',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            description: 'Filter by order status (pending, in_progress, completed, shipped)',
            enum: ['pending', 'in_progress', 'completed', 'shipped', 'cancelled'],
          },
          limit: {
            type: 'number',
            description: 'Maximum number of orders to return (default 20)',
          },
          daysBack: {
            type: 'number',
            description: 'Only return orders from the last N days',
          },
        },
      },
      handler: async (params) => {
        const conditions = [eq(orders.companyId, this.companyId)];

        if (params.status) {
          conditions.push(eq(orders.status, params.status));
        }

        if (params.daysBack) {
          const cutoff = new Date();
          cutoff.setDate(cutoff.getDate() - params.daysBack);
          conditions.push(gte(orders.createdAt, cutoff));
        }

        const result = await db
          .select({
            id: orders.id,
            status: orders.status,
            patientId: orders.patientId,
            createdAt: orders.createdAt,
            totalAmount: orders.totalAmount,
          })
          .from(orders)
          .where(and(...conditions))
          .orderBy(desc(orders.createdAt))
          .limit(params.limit || 20);

        return result;
      },
      auditCategory: 'read',
    });

    this.register({
      name: 'get_order_details',
      description: 'Get full details for a specific order including line items and patient info.',
      parameters: {
        type: 'object',
        properties: {
          orderId: {
            type: 'string',
            description: 'The order ID to retrieve',
          },
        },
        required: ['orderId'],
      },
      handler: async (params) => {
        const [order] = await db
          .select()
          .from(orders)
          .where(and(
            eq(orders.id, params.orderId),
            eq(orders.companyId, this.companyId)
          ));

        if (!order) return null;

        // Get patient with limited PHI
        const [patient] = await db
          .select({
            id: patients.id,
            firstName: patients.firstName,
            lastName: patients.lastName,
          })
          .from(patients)
          .where(eq(patients.id, order.patientId));

        return { ...order, patient };
      },
      auditCategory: 'phi',
    });

    this.register({
      name: 'get_order_stats',
      description: 'Get order statistics and counts by status.',
      parameters: {
        type: 'object',
        properties: {
          daysBack: {
            type: 'number',
            description: 'Period in days (default 30)',
          },
        },
      },
      handler: async (params) => {
        const days = params.daysBack || 30;
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);

        const stats = await db
          .select({
            status: orders.status,
            count: count(),
          })
          .from(orders)
          .where(and(
            eq(orders.companyId, this.companyId),
            gte(orders.createdAt, cutoff)
          ))
          .groupBy(orders.status);

        return {
          period: `${days} days`,
          byStatus: stats,
          total: stats.reduce((sum, s) => sum + Number(s.count), 0),
        };
      },
      auditCategory: 'read',
    });

    this.register({
      name: 'get_historical_orders',
      description: 'Get historical order data for trend analysis.',
      parameters: {
        type: 'object',
        properties: {
          days: {
            type: 'number',
            description: 'Number of days of history (default 90)',
          },
        },
      },
      handler: async (params) => {
        const days = params.days || 90;
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);

        const result = await db
          .select({
            date: sql<string>`DATE(${orders.createdAt})`,
            count: count(),
          })
          .from(orders)
          .where(and(
            eq(orders.companyId, this.companyId),
            gte(orders.createdAt, cutoff)
          ))
          .groupBy(sql`DATE(${orders.createdAt})`)
          .orderBy(sql`DATE(${orders.createdAt})`);

        return result;
      },
      auditCategory: 'read',
    });

    // INVENTORY TOOLS
    this.register({
      name: 'check_inventory',
      description: 'Check current inventory stock levels and reorder points.',
      parameters: {
        type: 'object',
        properties: {
          productId: {
            type: 'string',
            description: 'Specific product ID (optional)',
          },
          lowStockOnly: {
            type: 'boolean',
            description: 'Only return items below reorder point',
          },
        },
      },
      handler: async (params) => {
        const conditions = [eq(products.companyId, this.companyId)];

        if (params.productId) {
          conditions.push(eq(products.id, params.productId));
        }

        const result = await db
          .select({
            id: products.id,
            name: products.name,
            sku: products.sku,
            stockQuantity: products.stockQuantity,
            reorderPoint: products.reorderPoint,
            category: products.category,
          })
          .from(products)
          .where(and(...conditions))
          .orderBy(products.stockQuantity);

        if (params.lowStockOnly) {
          return result.filter(p =>
            (p.stockQuantity || 0) <= (p.reorderPoint || 0)
          );
        }

        return result;
      },
      auditCategory: 'read',
    });

    this.register({
      name: 'get_inventory_alerts',
      description: 'Get inventory alerts for low stock and stockout conditions.',
      parameters: {
        type: 'object',
        properties: {},
      },
      handler: async () => {
        const lowStock = await db
          .select({
            id: products.id,
            name: products.name,
            stockQuantity: products.stockQuantity,
            reorderPoint: products.reorderPoint,
          })
          .from(products)
          .where(and(
            eq(products.companyId, this.companyId),
            sql`${products.stockQuantity} <= ${products.reorderPoint}`
          ));

        return {
          lowStockCount: lowStock.length,
          items: lowStock.slice(0, 10),
          hasMore: lowStock.length > 10,
        };
      },
      auditCategory: 'read',
    });

    this.register({
      name: 'get_inventory_levels',
      description: 'Get all inventory levels for prediction analysis.',
      parameters: {
        type: 'object',
        properties: {},
      },
      handler: async () => {
        const result = await db
          .select({
            id: products.id,
            name: products.name,
            stockQuantity: products.stockQuantity,
            reorderPoint: products.reorderPoint,
            category: products.category,
          })
          .from(products)
          .where(eq(products.companyId, this.companyId));

        return result;
      },
      auditCategory: 'read',
    });

    // PATIENT TOOLS (Limited PHI)
    this.register({
      name: 'find_patient',
      description: 'Search for patients by name or email. Returns limited information only.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query (name or email)',
          },
          limit: {
            type: 'number',
            description: 'Maximum results (default 10)',
          },
        },
        required: ['query'],
      },
      handler: async (params) => {
        const searchTerm = `%${params.query}%`;

        const result = await db
          .select({
            id: patients.id,
            firstName: patients.firstName,
            lastName: patients.lastName,
            // Deliberately exclude sensitive PHI
          })
          .from(patients)
          .where(and(
            eq(patients.companyId, this.companyId),
            sql`(${patients.firstName} ILIKE ${searchTerm} OR ${patients.lastName} ILIKE ${searchTerm} OR ${patients.email} ILIKE ${searchTerm})`
          ))
          .limit(params.limit || 10);

        return result;
      },
      auditCategory: 'phi',
    });

    // APPOINTMENT TOOLS
    this.register({
      name: 'get_appointments',
      description: 'Get upcoming appointments.',
      parameters: {
        type: 'object',
        properties: {
          days: {
            type: 'number',
            description: 'Number of days to look ahead (default 7)',
          },
          providerId: {
            type: 'string',
            description: 'Filter by provider ID',
          },
        },
      },
      handler: async (params) => {
        const days = params.days || 7;
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + days);

        const conditions = [
          eq(appointments.companyId, this.companyId),
          gte(appointments.appointmentDate, new Date()),
        ];

        if (params.providerId) {
          conditions.push(eq(appointments.providerId, params.providerId));
        }

        const result = await db
          .select({
            id: appointments.id,
            appointmentDate: appointments.appointmentDate,
            appointmentTime: appointments.startTime,
            patientId: appointments.patientId,
            providerId: appointments.providerId,
            status: appointments.status,
            type: appointments.appointmentTypeId,
          })
          .from(appointments)
          .where(and(...conditions))
          .orderBy(appointments.appointmentDate)
          .limit(50);

        return result;
      },
      auditCategory: 'read',
    });

    // ACTION TOOLS (Require Approval)
    this.register({
      name: 'create_purchase_order',
      description: 'Create a new purchase order for inventory replenishment.',
      parameters: {
        type: 'object',
        properties: {
          supplierId: {
            type: 'string',
            description: 'The supplier ID',
          },
          items: {
            type: 'array',
            description: 'Array of items with productId and quantity',
            items: {
              type: 'object',
              properties: {
                productId: { type: 'string' },
                quantity: { type: 'number' },
              },
            },
          },
          notes: {
            type: 'string',
            description: 'Optional notes for the PO',
          },
        },
        required: ['supplierId', 'items'],
      },
      handler: async (params, userId) => {
        const poId = uuidv4();

        await db.insert(purchaseOrders).values({
          id: poId,
          companyId: this.companyId,
          supplierId: params.supplierId,
          status: 'draft',
          notes: params.notes || 'AI-generated purchase order',
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        return { poId, status: 'created' };
      },
      requiresApproval: (params) => {
        // Require approval for POs over certain thresholds
        const totalItems = params.items?.reduce((sum: number, i: any) => sum + (i.quantity || 0), 0) || 0;
        return totalItems > 100;
      },
      auditCategory: 'write',
    });

    // REPORT TOOLS
    this.register({
      name: 'generate_report',
      description: 'Generate a summary report for sales, inventory, or quality.',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            description: 'Report type: sales, inventory, quality',
            enum: ['sales', 'inventory', 'quality'],
          },
          period: {
            type: 'string',
            description: 'Report period: day, week, month',
            enum: ['day', 'week', 'month'],
          },
        },
        required: ['type'],
      },
      handler: async (params) => {
        // Generate report based on type
        const periodDays = params.period === 'day' ? 1 : params.period === 'week' ? 7 : 30;
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - periodDays);

        if (params.type === 'sales') {
          const orderData = await db
            .select({
              count: count(),
              total: sql<number>`SUM(${orders.totalAmount})`,
            })
            .from(orders)
            .where(and(
              eq(orders.companyId, this.companyId),
              gte(orders.createdAt, cutoff)
            ));

          return {
            type: 'sales',
            period: params.period || 'month',
            orderCount: orderData[0]?.count || 0,
            totalRevenue: orderData[0]?.total || 0,
          };
        }

        return { type: params.type, period: params.period, data: {} };
      },
      auditCategory: 'read',
    });
  }

  // ============================================
  // PUBLIC METHODS
  // ============================================

  /**
   * Register a new tool
   */
  register(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Get all tools in Anthropic API format
   */
  getToolsForAnthropic(): Anthropic.Tool[] {
    return Array.from(this.tools.values()).map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.parameters,
    }));
  }

  /**
   * Execute a tool with audit logging
   */
  async executeTool(
    name: string,
    params: Record<string, any>,
    userId: string
  ): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }

    const startTime = Date.now();

    try {
      const result = await tool.handler(params, userId);

      // Audit log
      this.logToolExecution({
        toolName: name,
        companyId: this.companyId,
        userId,
        params,
        result: tool.auditCategory === 'phi' ? '[REDACTED]' : result,
        executedAt: new Date(),
        durationMs: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      logger.error({ error, toolName: name, companyId: this.companyId }, 'Tool execution failed');
      throw error;
    }
  }

  /**
   * Check if an action requires approval
   */
  async checkApprovalRequired(
    actionType: string,
    params: Record<string, any>
  ): Promise<boolean> {
    const tool = this.tools.get(actionType);
    if (!tool?.requiresApproval) {
      return false;
    }
    return tool.requiresApproval(params);
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  private logToolExecution(log: ToolExecutionLog): void {
    logger.info({
      audit: true,
      ai_tool: true,
      ...log,
    }, `AI tool executed: ${log.toolName}`);

    // TODO: Also store in database audit table
  }
}

export default ToolRegistry;
