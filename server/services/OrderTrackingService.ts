import { orderStatusEnum } from "@shared/schema";
import { storage } from "../storage";
import { addStatusChange } from "../utils/timestamps";
import type { Request } from "express";

export interface OrderUpdateDetails {
  location?: string;
  stage?: string;
  completedSteps?: string[];
  nextStep?: string;
  estimatedCompletion?: Date;
  notes?: string;
}

export interface OrderUpdate {
  orderId: string;
  status: (typeof orderStatusEnum.enumValues)[number];
  timestamp: Date;
  details?: OrderUpdateDetails;
  updatedBy?: string;
  updatedAt?: Date;
}

class OrderTrackingService {
  async updateOrderStatus(
    orderId: string,
    status: (typeof orderStatusEnum.enumValues)[number],
    details?: OrderUpdateDetails,
    req?: Request,
  ): Promise<OrderUpdate> {
    // Get existing order first
    const existingOrder = await storage.getOrderById_Internal(orderId);
    
    if (!existingOrder) {
      throw new Error(`Order ${orderId} not found`);
    }

    const oldStatus = existingOrder.status;

    // Update order status
    const updatedOrder = await storage.updateOrderStatus(orderId, status as any);

    if (!updatedOrder) {
      throw new Error(`Failed to update order ${orderId}`);
    }

    // Add timestamp and status change tracking if request context available
    if (req) {
      const orderWithTimestamp = addStatusChange(
        { ...updatedOrder },
        req,
        oldStatus,
        status
      );
      
      // Store the updated change history back to database
      // Note: This assumes storage.updateOrder exists or we use db directly
      // For now, we'll return it in the response
      
      return {
        orderId,
        status: updatedOrder.status as (typeof orderStatusEnum.enumValues)[number],
        timestamp: new Date(),
        details,
        updatedBy: orderWithTimestamp.updatedBy,
        updatedAt: orderWithTimestamp.updatedAt || new Date(),
      };
    }

    return {
      orderId,
      status: updatedOrder.status as (typeof orderStatusEnum.enumValues)[number],
      timestamp: new Date(),
      details,
    };
  }
}

const orderTrackingService = new OrderTrackingService();
export default orderTrackingService;