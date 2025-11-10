import { IStorage } from "../storage";
import type { InsertOrder, Order } from "@shared/schema";
import { createLogger, type Logger } from "../utils/logger";
import eventBus from "../lib/eventBus";

export interface LimsClientInterface {
  createJob(request: CreateJobRequest): Promise<CreateJobResponse>;
  getJobStatus(jobId: string): Promise<JobStatusResponse>;
  validateConfiguration(config: ValidationRequest): Promise<ValidationResponse>;
  healthCheck(): Promise<boolean>;
}

export interface CreateJobRequest {
  patientName: string;
  patientAge: number;
  prescriptionData: {
    odSphere: number;
    odCylinder: number;
    odAxis: number;
    odAdd: number;
    osSphere: number;
    osCylinder: number;
    osAxis: number;
    osAdd: number;
    pd: number;
  };
  lensType: string;
  lensMaterial: string;
  coating: string;
  frameType?: string;
  orderNumber: string;
  metadata: Record<string, any>;
}

export interface CreateJobResponse {
  jobId: string;
  status: string;
  createdAt: string;
}

export interface JobStatusResponse {
  jobId: string;
  status: string;
  progress?: number;
  estimatedCompletion?: string;
  errorMessage?: string;
}

export interface ValidationRequest {
  lensType: string;
  lensMaterial: string;
  coating: string;
}

export interface ValidationResponse {
  valid: boolean;
  rules: Record<string, any>;
  availableOptions?: Record<string, any[]>;
}

interface OrderAnalyticsEvent {
  type: "order_created" | "order_submitted" | "order_failed";
  orderId: string;
  jobId?: string;
  status: string;
  ecpId: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export class OrderService {
  private logger: Logger;
  private enableLimsValidation: boolean;

  constructor(
    private limsClient: LimsClientInterface,
    private storage: IStorage,
    private options?: { enableLimsValidation?: boolean }
  ) {
    this.logger = createLogger("OrderService");
    this.enableLimsValidation = options?.enableLimsValidation ?? true;
  }

  async submitOrder(orderData: Partial<InsertOrder>, ecpId: string): Promise<Order> {
    try {
      const orderNumber = (orderData as any).orderNumber || "unknown";
      this.logger.info("Submitting order to LIMS", {
        orderNumber,
        ecpId,
      });

      if (this.enableLimsValidation) {
        await this.validateOrderConfiguration(orderData);
      }

      const createdOrder = await this.storage.createOrder({
        ...(orderData as InsertOrder),
        status: "pending",
      });

      this.logger.debug("Order created locally", { orderId: createdOrder.id });

      // Publish an event and return immediately. Background workers will handle LIMS submission,
      // PDF generation, emails, analytics, etc. This keeps the critical path fast and resilient.
      eventBus.publish("order.submitted", {
        orderId: createdOrder.id,
        ecpId,
        order: createdOrder,
        metadata: {
          lensType: orderData.lensType,
          material: orderData.lensMaterial,
        },
      });

      this.emitOrderCreatedEvent({
        type: "order_submitted",
        orderId: createdOrder.id,
        status: "pending",
        ecpId,
        timestamp: new Date(),
        metadata: {
          lensType: orderData.lensType,
          material: orderData.lensMaterial,
        },
      });

      return createdOrder;
    } catch (error) {
      const orderNumber = (orderData as any).orderNumber || "unknown";
      this.logger.error("Order submission failed", error as Error, {
        orderNumber,
      });

      this.emitOrderCreatedEvent({
        type: "order_failed",
        orderId: "",
        status: "pending",
        ecpId,
        timestamp: new Date(),
        metadata: {
          error: error instanceof Error ? error.message : String(error),
        },
      });

      throw error;
    }
  }

  private async validateOrderConfiguration(
    orderData: Partial<InsertOrder>
  ): Promise<ValidationResponse> {
    try {
      this.logger.debug("Validating order configuration", {
        lensType: orderData.lensType,
        material: orderData.lensMaterial,
      });

      const validationRequest: ValidationRequest = {
        lensType: orderData.lensType || "",
        lensMaterial: orderData.lensMaterial || "",
        coating: orderData.coating || "",
      };

      const validation = await this.limsClient.validateConfiguration(
        validationRequest
      );

      if (!validation.valid) {
        throw new Error(
          `Configuration validation failed: ${JSON.stringify(validation.rules)}`
        );
      }

      return validation;
    } catch (error) {
      this.logger.warn("Configuration validation error", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  private transformOrderToLimsRequest(
    createdOrder: Order,
    orderData: Partial<InsertOrder>
  ): CreateJobRequest {
    return {
      patientName: `${createdOrder.id}`,
      patientAge: 0,
      prescriptionData: {
        odSphere: parseFloat(createdOrder.odSphere || "0") || 0,
        odCylinder: parseFloat(createdOrder.odCylinder || "0") || 0,
        odAxis: parseFloat(createdOrder.odAxis || "0") || 0,
        odAdd: parseFloat(createdOrder.odAdd || "0") || 0,
        osSphere: parseFloat(createdOrder.osSphere || "0") || 0,
        osCylinder: parseFloat(createdOrder.osCylinder || "0") || 0,
        osAxis: parseFloat(createdOrder.osAxis || "0") || 0,
        osAdd: parseFloat(createdOrder.osAdd || "0") || 0,
        pd: parseFloat(createdOrder.pd || "0") || 0,
      },
      lensType: createdOrder.lensType,
      lensMaterial: createdOrder.lensMaterial,
      coating: createdOrder.coating,
      frameType: createdOrder.frameType || undefined,
      orderNumber: createdOrder.orderNumber,
      metadata: {
        orderId: createdOrder.id,
        ecpId: createdOrder.ecpId,
        traceFileUrl: createdOrder.traceFileUrl,
        omaFilename: createdOrder.omaFilename,
        customerReference: createdOrder.customerReferenceNumber,
      },
    };
  }

  async getOrderStatus(orderId: string): Promise<JobStatusResponse | null> {
    try {
      const order = await this.storage.getOrderById_Internal(orderId);

      if (!order || !order.jobId) {
        return null;
      }

      return await this.limsClient.getJobStatus(order.jobId);
    } catch (error) {
      this.logger.error("Failed to get order status", error as Error, {
        orderId,
      });
      throw error;
    }
  }

  async syncOrderStatusFromLims(
    orderId: string,
    limsStatus: string
  ): Promise<Order | undefined> {
    try {
      this.logger.info("Syncing order status from LIMS", {
        orderId,
        limsStatus,
      });

      let localStatus: Order["status"] = "in_production";

      if (limsStatus.toLowerCase().includes("completed")) {
        localStatus = "completed";
      } else if (limsStatus.toLowerCase().includes("shipped")) {
        localStatus = "shipped";
      } else if (limsStatus.toLowerCase().includes("on_hold")) {
        localStatus = "on_hold";
      }

      return await this.storage.updateOrderStatus(orderId, localStatus);
    } catch (error) {
      this.logger.error("Order status sync failed", error as Error, {
        orderId,
      });
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      return await this.limsClient.healthCheck();
    } catch (error) {
      this.logger.warn("LIMS health check failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  private emitOrderCreatedEvent(event: OrderAnalyticsEvent): void {
    this.logger.debug("Analytics event emitted", {
      type: event.type,
      orderId: event.orderId,
      jobId: event.jobId,
    });
  }
}
