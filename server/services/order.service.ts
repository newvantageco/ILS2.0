/**
 * Order Service
 * 
 * Business logic for order management, validation, and operations.
 * This service handles all order-related database operations and business rules.
 */

import { db } from "../db";
import * as schema from "@shared/schema";
import { eq, desc, and, ilike, gte, lte, inArray } from "drizzle-orm";
import { 
  insertOrderSchema, 
  updateOrderStatusSchema,
  Order,
  OrderStatus
} from "@shared/schema";
import logger from "../utils/logger";

export interface OrderFilters {
  status?: OrderStatus[];
  patientId?: string;
  ecpId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  urgent?: boolean;
}

export interface OrderQueryOptions {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'orderDate' | 'priority';
  sortOrder?: 'asc' | 'desc';
  filters?: OrderFilters;
}

export class OrderService {
  /**
   * Get orders for a user with filtering and pagination
   */
  async getOrders(userId: string, userRole: string, companyId: string, options: OrderQueryOptions = {}) {
    const {
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      filters = {}
    } = options;

    const offset = (page - 1) * limit;

    try {
      // Build base query conditions
      const conditions = [];
      
      // Company access control
      if (userRole !== 'platform_admin') {
        conditions.push(eq(schema.orders.companyId, companyId));
      }

      // Apply filters
      if (filters.status && filters.status.length > 0) {
        conditions.push(inArray(schema.orders.status, filters.status));
      }

      if (filters.patientId) {
        conditions.push(eq(schema.orders.patientId, filters.patientId));
      }

      if (filters.ecpId) {
        conditions.push(eq(schema.orders.ecpId, filters.ecpId));
      }

      if (filters.urgent !== undefined) {
        conditions.push(eq(schema.orders.urgent, filters.urgent));
      }

      if (filters.dateFrom) {
        conditions.push(gte(schema.orders.orderDate, filters.dateFrom));
      }

      if (filters.dateTo) {
        conditions.push(lte(schema.orders.orderDate, filters.dateTo));
      }

      if (filters.search) {
        conditions.push(
          ilike(schema.orders.orderNumber, `%${filters.search}%`)
        );
      }

      // Build the query
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Execute query with sorting
      const orderBy = sortOrder === 'desc' 
        ? desc(schema.orders[sortBy])
        : schema.orders[sortBy];

      const orders = await db
        .select()
        .from(schema.orders)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);

      // Get total count for pagination
      const totalCount = await db
        .select({ count: schema.orders.id })
        .from(schema.orders)
        .where(whereClause);

      return {
        orders,
        pagination: {
          page,
          limit,
          total: totalCount.length,
          totalPages: Math.ceil(totalCount.length / limit),
        },
      };
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : String(error),
        userId,
        options,
      }, 'OrderService.getOrders failed');
      throw error;
    }
  }

  /**
   * Get a single order by ID
   */
  async getOrderById(orderId: string, userId: string, userRole: string, companyId: string) {
    try {
      const order = await db
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.id, orderId))
        .limit(1);

      if (order.length === 0) {
        throw new Error("Order not found");
      }

      // Check access permissions
      const orderData = order[0];
      if (userRole !== 'platform_admin' && orderData.companyId !== companyId) {
        throw new Error("Access denied");
      }

      return orderData;
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : String(error),
        orderId,
        userId,
      }, 'OrderService.getOrderById failed');
      throw error;
    }
  }

  /**
   * Create a new order
   */
  async createOrder(userId: string, orderData: Partial<Order>) {
    try {
      // Validate order data
      const validatedData = insertOrderSchema.parse(orderData);

      // Generate order number and add it separately (not in schema validation)
      const orderNumber = await this.generateOrderNumber(validatedData.companyId!);

      // Prepare final order data
      const finalOrderData = {
        ...validatedData,
        orderNumber,
        status: 'pending' as const,
        orderDate: new Date(),
      };

      // Insert order
      const result = await db
        .insert(schema.orders)
        .values(finalOrderData)
        .returning();

      const newOrder = result[0];

      logger.info({
        action: 'order_created',
        orderId: newOrder.id,
        orderNumber: newOrder.orderNumber,
        userId,
        companyId: newOrder.companyId,
      }, 'Order created successfully');

      return newOrder;
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : String(error),
        userId,
        orderData,
      }, 'OrderService.createOrder failed');
      throw error;
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: string, statusData: { status: OrderStatus }, userId: string) {
    try {
      // Validate status data
      const validatedData = updateOrderStatusSchema.parse(statusData);

      // Update order
      const result = await db
        .update(schema.orders)
        .set({ 
          status: validatedData.status,
        })
        .where(eq(schema.orders.id, orderId))
        .returning();

      if (result.length === 0) {
        throw new Error("Order not found");
      }

      const updatedOrder = result[0];

      logger.info({
        action: 'order_status_updated',
        orderId,
        newStatus: validatedData.status,
        userId,
      }, 'Order status updated successfully');

      return updatedOrder;
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : String(error),
        orderId,
        statusData,
        userId,
      }, 'OrderService.updateOrderStatus failed');
      throw error;
    }
  }

  /**
   * Delete an order (soft delete by setting status to cancelled)
   */
  async deleteOrder(orderId: string, userId: string) {
    try {
      const result = await db
        .update(schema.orders)
        .set({ 
          status: 'cancelled',
        })
        .where(eq(schema.orders.id, orderId))
        .returning();

      if (result.length === 0) {
        throw new Error("Order not found");
      }

      logger.info({
        action: 'order_deleted',
        orderId,
        userId,
      }, 'Order deleted successfully');

      return result[0];
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : String(error),
        orderId,
        userId,
      }, 'OrderService.deleteOrder failed');
      throw error;
    }
  }

  /**
   * Generate a unique order number
   */
  private async generateOrderNumber(companyId: string): Promise<string> {
    const prefix = 'ORD';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Get order statistics for dashboard
   */
  async getOrderStats(companyId: string, filters?: OrderFilters) {
    try {
      const conditions = [eq(schema.orders.companyId, companyId)];

      if (filters?.status && filters.status.length > 0) {
        conditions.push(inArray(schema.orders.status, filters.status));
      }

      if (filters?.dateFrom) {
        conditions.push(gte(schema.orders.orderDate, filters.dateFrom));
      }

      if (filters?.dateTo) {
        conditions.push(lte(schema.orders.orderDate, filters.dateTo));
      }

      const whereClause = and(...conditions);

      // Get orders by status
      const statusCounts = await db
        .select({
          status: schema.orders.status,
          count: schema.orders.id,
        })
        .from(schema.orders)
        .where(whereClause)
        .groupBy(schema.orders.status);

      // Get total orders
      const totalOrders = await db
        .select({ count: schema.orders.id })
        .from(schema.orders)
        .where(whereClause);

      // Get urgent orders
      const urgentOrders = await db
        .select({ count: schema.orders.id })
        .from(schema.orders)
        .where(and(whereClause, eq(schema.orders.urgent, true)));

      return {
        totalOrders: totalOrders.length,
        urgentOrders: urgentOrders.length,
        statusBreakdown: statusCounts.reduce((acc, item) => {
          acc[item.status] = parseInt(item.count);
          return acc;
        }, {} as Record<string, number>),
      };
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : String(error),
        companyId,
        filters,
      }, 'OrderService.getOrderStats failed');
      throw error;
    }
  }
}
