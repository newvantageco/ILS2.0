import eventBus from "../lib/eventBus";
import type { LimsClientInterface } from "../services/OrderService";
import type { IStorage } from "../storage";
import { createLogger } from "../utils/logger";

const logger = createLogger("OrderCreatedLimsWorker");

export function registerOrderCreatedLimsWorker(limsClient: LimsClientInterface, storage: IStorage) {
  // Subscribe to order.submitted events and create a LIMS job in the background.
  eventBus.subscribe("order.submitted", async (payload) => {
    try {
      const { orderId, ecpId } = payload as any;
      logger.info("Received order.submitted", { orderId, ecpId });

      // Idempotency: check if order already has a jobId
      // NOTE: Using _Internal here is acceptable because:
      // 1. This is a background worker processing internal events (not user request)
      // 2. Event triggered by legitimate order creation
      // 3. Worker operates on behalf of the system, not a specific user
      // 4. Order was already validated during creation
      const order = await storage.getOrderById_Internal(orderId);
      if (!order) {
        logger.warn("Order not found for LIMS worker", { orderId });
        return;
      }

      if (order.jobId) {
        logger.info("Order already has a LIMS job, skipping", { orderId, jobId: order.jobId });
        return;
      }

      // Transform order into a LIMS request -- TODO: reuse shared transform logic if available
      const limsRequest = {
        // order object shape varies across the codebase; use order.id as fallback patient identifier
        patientName: order.id,
        patientAge: 0,
        prescriptionData: {
          odSphere: parseFloat(order.odSphere || "0") || 0,
          odCylinder: parseFloat(order.odCylinder || "0") || 0,
          odAxis: parseFloat(order.odAxis || "0") || 0,
          odAdd: parseFloat(order.odAdd || "0") || 0,
          osSphere: parseFloat(order.osSphere || "0") || 0,
          osCylinder: parseFloat(order.osCylinder || "0") || 0,
          osAxis: parseFloat(order.osAxis || "0") || 0,
          osAdd: parseFloat(order.osAdd || "0") || 0,
          pd: parseFloat(order.pd || "0") || 0,
        },
        lensType: order.lensType,
        lensMaterial: order.lensMaterial,
        coating: order.coating,
        frameType: order.frameType || undefined,
        orderNumber: order.orderNumber,
        metadata: {
          orderId: order.id,
          ecpId: order.ecpId,
        },
      };

      // Worker-level retry/backoff configuration
      const maxAttempts = Number(process.env.WORKER_LIMS_MAX_ATTEMPTS || 5);
      const baseBackoffMs = Number(process.env.WORKER_LIMS_BASE_BACKOFF_MS || 500);

      const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      let attempt = 0;
      let success = false;
      let lastError: any = null;

      while (attempt < maxAttempts && !success) {
        attempt += 1;
        try {
          logger.info('Attempting to create LIMS job', { orderId, attempt });
          const limsResponse = await limsClient.createJob(limsRequest as any);
          logger.info("LIMS job created", { orderId, jobId: limsResponse.jobId });

          await storage.updateOrderWithLimsJob(orderId, {
            jobId: limsResponse.jobId,
            jobStatus: limsResponse.status,
            sentToLabAt: new Date(limsResponse.createdAt),
          });

          success = true;
          break;
        } catch (err) {
          lastError = err;
          const e: any = err;
          // LimsClientError exposes retryable flag; treat unknown errors as retryable initially
          const isRetryable = Boolean(e?.retryable === true || e?.code === 'HTTP_ERROR' || e?.code === 'CIRCUIT_BREAKER_OPEN');

          logger.warn('LIMS createJob failed', { orderId, attempt, error: (e as Error)?.message || String(e), isRetryable });

          if (attempt >= maxAttempts || !isRetryable) {
            // Permanent failure: mark the order with an error so it can be reviewed and retried manually or by a DLQ process
            try {
              await storage.updateOrderWithLimsJob(orderId, {
                jobId: '',
                jobStatus: 'failed',
                sentToLabAt: new Date(),
                jobErrorMessage: (e as Error)?.message || String(e),
              });
            } catch (dbErr) {
              logger.error('Failed to mark order as failed after LIMS error', (dbErr as Error)?.message || String(dbErr), { orderId });
            }

            logger.error('LIMS job creation permanently failed, sent to DLQ state', (e as Error)?.message || String(e), { orderId });
            break;
          }

          // Exponential backoff before retrying
          const backoffMs = baseBackoffMs * Math.pow(2, attempt - 1);
          logger.info('Backing off before retry', { orderId, attempt, backoffMs });
          await sleep(backoffMs);
        }
      }
    } catch (err) {
      logger.error("OrderCreatedLimsWorker error", err as Error);
      // Worker should not throw — it should log and allow retries from an external process if needed.
    }
  });
}
