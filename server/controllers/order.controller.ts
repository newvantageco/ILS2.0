/**
 * Order Controller
 * 
 * Handles HTTP requests for order management and delegates
 * business logic to the OrderService.
 */

import { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth";
import { BaseController, ExtendedAuthenticatedRequest } from "./base.controller";
import { OrderService } from "../services/order.service";
import { storage } from "../storage";
import { 
  insertOrderSchema, 
  updateOrderStatusSchema,
  OrderStatus 
} from "@shared/schema";
import { z } from "zod";

export class OrderController extends BaseController {
  private orderService: OrderService;

  constructor() {
    super();
    this.orderService = new OrderService();
  }

  /**
   * GET /api/orders
   * Get all orders for the authenticated user
   */
  getOrders = this.asyncHandler(async (req: ExtendedAuthenticatedRequest, res: Response) => {
    const { userId } = this.getAuthenticatedUser(req);
    const user = await storage.getUserById_Internal(userId);

    if (!user || !user.companyId) {
      return this.error(res, "User not found or not associated with a company", 404);
    }

    // Parse query parameters
    const querySchema = z.object({
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(100).default(50),
      sortBy: z.enum(['createdAt', 'updatedAt', 'orderDate', 'priority']).default('createdAt'),
      sortOrder: z.enum(['asc', 'desc']).default('desc'),
      status: z.array(z.enum(['pending', 'in_production', 'quality_check', 'shipped', 'completed', 'on_hold', 'cancelled'])).optional(),
      patientId: z.string().uuid().optional(),
      ecpId: z.string().uuid().optional(),
      dateFrom: z.string().datetime().optional(),
      dateTo: z.string().datetime().optional(),
      search: z.string().optional(),
      urgent: z.enum(['true', 'false']).optional().transform(val => val === 'true'),
    });

    const query = querySchema.parse(req.query);

    const filters = {
      status: query.status,
      patientId: query.patientId,
      ecpId: query.ecpId,
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
      dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
      search: query.search,
      urgent: query.urgent,
    };

    const options = {
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      filters,
    };

    const result = await this.orderService.getOrders(userId, user.role, user.companyId, options);

    this.logAction('get_orders', userId, { 
      page: query.page, 
      limit: query.limit, 
      filters: Object.keys(filters).filter(key => filters[key as keyof typeof filters] !== undefined) 
    });

    this.success(res, result, "Orders retrieved successfully");
  });

  /**
   * GET /api/orders/:id
   * Get a specific order by ID
   */
  getOrderById = this.asyncHandler(async (req: ExtendedAuthenticatedRequest, res: Response) => {
    const { userId } = this.getAuthenticatedUser(req);
    const user = await storage.getUserById_Internal(userId);

    if (!user || !user.companyId) {
      return this.error(res, "User not found or not associated with a company", 404);
    }

    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      return this.error(res, "Invalid order ID", 400);
    }

    const order = await this.orderService.getOrderById(id, userId, user.role, user.companyId);

    this.logAction('get_order', userId, { orderId: id });
    this.success(res, order, "Order retrieved successfully");
  });

  /**
   * POST /api/orders
   * Create a new order
   */
  createOrder = this.asyncHandler(async (req: ExtendedAuthenticatedRequest, res: Response) => {
    const { userId } = this.getAuthenticatedUser(req);
    const user = await storage.getUserById_Internal(userId);

    if (!user || !user.companyId) {
      return this.error(res, "User not found or not associated with a company", 404);
    }

    // Check permissions
    if (!['ecp', 'admin', 'lab_tech'].includes(user.role)) {
      return this.error(res, "Insufficient permissions to create orders", 403);
    }

    const orderData = {
      ...req.body,
      companyId: user.companyId,
      ecpId: userId,
    };

    const newOrder = await this.orderService.createOrder(userId, orderData);

    this.logAction('create_order', userId, { 
      orderId: newOrder.id, 
      orderNumber: newOrder.orderNumber 
    });

    this.success(res, newOrder, "Order created successfully", 201);
  });

  /**
   * PUT /api/orders/:id/status
   * Update order status
   */
  updateOrderStatus = this.asyncHandler(async (req: ExtendedAuthenticatedRequest, res: Response) => {
    const { userId } = this.getAuthenticatedUser(req);
    const user = await storage.getUserById_Internal(userId);

    if (!user || !user.companyId) {
      return this.error(res, "User not found or not associated with a company", 404);
    }

    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      return this.error(res, "Invalid order ID", 400);
    }

    // Validate status update data
    const statusData = updateOrderStatusSchema.parse(req.body);

    // Check permissions for status transitions
    const allowedTransitions: Record<string, OrderStatus[]> = {
      'ecp': ['pending', 'cancelled'],
      'lab_tech': ['in_production', 'quality_check', 'on_hold'],
      'admin': ['pending', 'in_production', 'quality_check', 'shipped', 'completed', 'on_hold', 'cancelled'],
      'platform_admin': ['pending', 'in_production', 'quality_check', 'shipped', 'completed', 'on_hold', 'cancelled'],
    };

    if (!allowedTransitions[user.role]?.includes(statusData.status)) {
      return this.error(res, "Insufficient permissions for this status transition", 403);
    }

    const updatedOrder = await this.orderService.updateOrderStatus(id, statusData, userId);

    this.logAction('update_order_status', userId, { 
      orderId: id, 
      newStatus: statusData.status 
    });

    this.success(res, updatedOrder, "Order status updated successfully");
  });

  /**
   * DELETE /api/orders/:id
   * Delete (cancel) an order
   */
  deleteOrder = this.asyncHandler(async (req: ExtendedAuthenticatedRequest, res: Response) => {
    const { userId } = this.getAuthenticatedUser(req);
    const user = await storage.getUserById_Internal(userId);

    if (!user || !user.companyId) {
      return this.error(res, "User not found or not associated with a company", 404);
    }

    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      return this.error(res, "Invalid order ID", 400);
    }

    // Check permissions
    if (!['ecp', 'admin'].includes(user.role)) {
      return this.error(res, "Insufficient permissions to delete orders", 403);
    }

    const deletedOrder = await this.orderService.deleteOrder(id, userId);

    this.logAction('delete_order', userId, { orderId: id });
    this.success(res, deletedOrder, "Order cancelled successfully");
  });

  /**
   * GET /api/orders/stats
   * Get order statistics for dashboard
   */
  getOrderStats = this.asyncHandler(async (req: ExtendedAuthenticatedRequest, res: Response) => {
    const { userId } = this.getAuthenticatedUser(req);
    const user = await storage.getUserById_Internal(userId);

    if (!user || !user.companyId) {
      return this.error(res, "User not found or not associated with a company", 404);
    }

    // Parse query parameters for filtering
    const querySchema = z.object({
      status: z.array(z.enum(['pending', 'in_production', 'quality_check', 'shipped', 'completed', 'on_hold', 'cancelled'])).optional(),
      dateFrom: z.string().datetime().optional(),
      dateTo: z.string().datetime().optional(),
    });

    const query = querySchema.parse(req.query);

    const filters = {
      status: query.status,
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
      dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
    };

    const stats = await this.orderService.getOrderStats(user.companyId, filters);

    this.logAction('get_order_stats', userId, { filters });
    this.success(res, stats, "Order statistics retrieved successfully");
  });
}
