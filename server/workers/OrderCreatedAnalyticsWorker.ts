import eventBus from "../lib/eventBus";
import type { IStorage } from "../storage";
import { createLogger } from "../utils/logger";

const logger = createLogger("OrderCreatedAnalyticsWorker");

// Simple in-process idempotency cache to avoid duplicate analytics during the same process lifetime.
const sentAnalytics = new Set<string>();

type AnalyticsClient = {
  track?: (eventName: string, payload: any) => Promise<void> | void;
  sendEvent?: (payload: any) => Promise<void> | void;
};

type AnalyticsWorkerOptions = {
  analyticsClient?: AnalyticsClient;
};

export function registerOrderCreatedAnalyticsWorker(storage: IStorage | null = null, opts?: AnalyticsWorkerOptions) {
  const analyticsClient = opts?.analyticsClient;

  eventBus.subscribe("order.submitted", async (payload) => {
    try {
      const { orderId, ecpId } = payload as any;
      logger.info("Tracking analytics for order (worker)", { orderId, ecpId });

      if (sentAnalytics.has(orderId)) {
        logger.info('Analytics already sent for order in this process, skipping', { orderId });
        return;
      }

      const maxAttempts = Number(process.env.WORKER_ANALYTICS_MAX_ATTEMPTS || 3);
      const baseBackoffMs = Number(process.env.WORKER_ANALYTICS_BASE_BACKOFF_MS || 200);

      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

      let attempt = 0;
      let success = false;
      let lastErr: any = null;

      while (attempt < maxAttempts && !success) {
        attempt += 1;
        try {
          if (analyticsClient?.track) {
            await analyticsClient.track('order.submitted', { orderId, ecpId });
          } else if (analyticsClient?.sendEvent) {
            await analyticsClient.sendEvent({ type: 'order.submitted', orderId, ecpId });
          } else {
            // placeholder logging if no client provided
            logger.info('Analytics event sent (placeholder)', { orderId, ecpId, attempt });
          }

          sentAnalytics.add(orderId);
          success = true;
          break;
        } catch (err) {
          lastErr = err;
          logger.warn('Analytics send failed', { orderId, attempt, error: (err as Error)?.message || String(err) });

          if (attempt >= maxAttempts) {
            logger.error('Analytics permanently failed for order', (err as Error)?.message || String(err), { orderId });
            // Optionally mark the order with analytics error so it can be retried/inspected
            if (storage) {
              try {
                await storage.updateOrder(orderId, { analyticsErrorMessage: (err as Error)?.message || String(err) } as any);
              } catch (dbErr) {
                logger.error('Failed to mark order with analytics error', (dbErr as Error)?.message || String(dbErr), { orderId });
              }
            }
            break;
          }

          const backoffMs = baseBackoffMs * Math.pow(2, attempt - 1);
          await sleep(backoffMs);
        }
      }

    } catch (err) {
      logger.error("OrderCreatedAnalyticsWorker error", (err as Error)?.message || String(err), {});
    }
  });
}
