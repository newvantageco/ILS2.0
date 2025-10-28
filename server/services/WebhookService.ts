import { IStorage } from "../storage";
import { createLogger, type Logger } from "../utils/logger";
import { websocketService } from "../websocket";

export interface LimsWebhookPayload {
  jobId: string;
  jobStatus: string;
  orderId: string;
  progress?: number;
  estimatedCompletion?: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface WebhookSignatureVerificationOptions {
  secret: string;
}

export class WebhookService {
  private logger: Logger;
  private secret: string;

  constructor(
    private storage: IStorage,
    options: WebhookSignatureVerificationOptions
  ) {
    this.logger = createLogger("WebhookService");
    this.secret = options.secret;
  }

  /**
   * Verify webhook signature using HMAC-SHA256
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      const crypto = require("crypto");
      const hash = crypto
        .createHmac("sha256", this.secret)
        .update(payload)
        .digest("hex");

      return hash === signature;
    } catch (error) {
      this.logger.warn("Webhook signature verification failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Handle LIMS status update webhook (Flow 2)
   */
  async handleStatusUpdate(payload: LimsWebhookPayload): Promise<boolean> {
    try {
      this.logger.info("Processing LIMS webhook status update", {
        jobId: payload.jobId,
        jobStatus: payload.jobStatus,
        orderId: payload.orderId,
      });

      // Validate required fields
      if (!payload.orderId || !payload.jobId || !payload.jobStatus) {
        throw new Error("Missing required webhook fields: orderId, jobId, jobStatus");
      }

      // Get the order
      const order = await this.storage.getOrder(payload.orderId);
      if (!order) {
        this.logger.warn("Webhook received for non-existent order", {
          orderId: payload.orderId,
        });
        return false;
      }

      // Verify job ID matches
      if (order.jobId !== payload.jobId) {
        this.logger.warn("Webhook job ID mismatch", {
          orderId: payload.orderId,
          expectedJobId: order.jobId,
          receivedJobId: payload.jobId,
        });
        return false;
      }

      // Map LIMS status to local order status
      const localStatus = this.mapLimsStatusToLocal(payload.jobStatus);

      // Update order with new status
      const updatedOrder = await this.storage.updateOrderStatus(
        payload.orderId,
        localStatus
      );

      if (updatedOrder) {
        this.logger.info("Order status updated from webhook", {
          orderId: payload.orderId,
          newStatus: localStatus,
          limsStatus: payload.jobStatus,
        });

        // Emit real-time update event
        this.emitStatusUpdateEvent({
          orderId: payload.orderId,
          jobId: payload.jobId,
          status: localStatus,
          progress: payload.progress,
          estimatedCompletion: payload.estimatedCompletion,
          errorMessage: payload.errorMessage,
        });

        return true;
      }

      return false;
    } catch (error) {
      this.logger.error("Webhook processing failed", error as Error, {
        jobId: payload.jobId,
        orderId: payload.orderId,
      });
      return false;
    }
  }

  /**
   * Map LIMS status to local order status
   */
  private mapLimsStatusToLocal(
    limsStatus: string
  ): "pending" | "in_production" | "quality_check" | "shipped" | "completed" | "on_hold" | "cancelled" {
    const status = limsStatus.toLowerCase();

    if (status.includes("completed")) {
      return "completed";
    }
    if (status.includes("shipped")) {
      return "shipped";
    }
    if (status.includes("quality") || status.includes("check")) {
      return "quality_check";
    }
    if (status.includes("hold") || status.includes("pending")) {
      return "on_hold";
    }
    if (status.includes("cancel")) {
      return "cancelled";
    }

    return "in_production";
  }

  /**
   * Emit real-time status update event
   * Broadcast to WebSocket clients in real-time
   */
  private async emitStatusUpdateEvent(data: {
    orderId: string;
    jobId: string;
    status: string;
    progress?: number;
    estimatedCompletion?: string;
    errorMessage?: string;
  }): Promise<void> {
    this.logger.debug("Status update event emitted", {
      orderId: data.orderId,
      status: data.status,
    });

    // Get order to determine organization for room-based broadcasting
    try {
      const order = await this.storage.getOrder(data.orderId);
      if (order) {
        // Broadcast order status update to organization room
        websocketService.broadcastOrderStatus(
          data.orderId,
          data.status,
          order.ecpId, // organizationId
          {
            orderNumber: order.orderNumber,
            progress: data.progress || 0,
            estimatedCompletion: data.estimatedCompletion,
            errorMessage: data.errorMessage,
            updatedAt: new Date().toISOString(),
          }
        );

        // Broadcast LIMS sync event
        websocketService.broadcastLimsSync(
          data.jobId,
          data.status,
          data.orderId,
          order.ecpId
        );
      }
    } catch (error) {
      this.logger.error("Failed to broadcast status update", error as Error, {
        orderId: data.orderId,
      });
    }
  }
}
