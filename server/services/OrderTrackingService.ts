import { orderStatusEnum } from "@shared/schema";
import { storage } from "../storage";

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
}

class OrderTrackingService {
  async updateOrderStatus(
    orderId: string,
    status: (typeof orderStatusEnum.enumValues)[number],
    details?: OrderUpdateDetails,
  ): Promise<OrderUpdate> {
    const updatedOrder = await storage.updateOrderStatus(orderId, status as any);

    if (!updatedOrder) {
      throw new Error(`Order ${orderId} not found`);
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