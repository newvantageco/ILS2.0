import eventBus from "../lib/eventBus";
import { createWorkerRepository } from "../repositories/WorkerRepository";
import { createLogger } from "../utils/logger";
import crypto from "crypto";

const logger = createLogger("OrderCreatedPdfWorker");

// Placeholder PDF generator. Replace with real implementation (pdfkit, puppeteer, etc.).
async function defaultGenerateOrderPdfAndStore(_order: any): Promise<string> {
  // Simulate PDF generation and return a URL/path
  await new Promise((r) => setTimeout(r, 200));
  return `https://files.example.com/orders/${_order.id}/order.pdf`;
}

type PdfWorkerOptions = {
  generateFn?: (order: any) => Promise<string>;
};

export function registerOrderCreatedPdfWorker(opts?: PdfWorkerOptions) {
  const generateFn = opts?.generateFn ?? defaultGenerateOrderPdfAndStore;

  eventBus.subscribe("order.submitted", async (payload) => {
    // Create a unique worker ID for this job execution
    const workerId = `pdf-worker-${crypto.randomUUID().slice(0, 8)}`;
    const workerRepo = createWorkerRepository(workerId, 'OrderCreatedPdfWorker');

    try {
      const { orderId } = payload as any;
      logger.info("Generating PDF for order", { orderId, workerId });

      // Use WorkerRepository with audit logging instead of _Internal method
      const order = await workerRepo.getOrderWithDetails(orderId);
      if (!order) {
        logger.warn("Order not found for PDF generation", { orderId, workerId });
        return;
      }

      // Idempotency: skip if PDF already generated
      if ((order as any).pdfUrl) {
        logger.info("Order already has a PDF, skipping", { orderId, pdfUrl: (order as any).pdfUrl });
        return;
      }

      const maxAttempts = Number(process.env.WORKER_PDF_MAX_ATTEMPTS || 3);
      const baseBackoffMs = Number(process.env.WORKER_PDF_BASE_BACKOFF_MS || 500);

      const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

      let attempt = 0;
      let success = false;
      let lastError: any = null;

      while (attempt < maxAttempts && !success) {
        attempt += 1;
        try {
          logger.info({ orderId, attempt, workerId }, 'PDF generation attempt');
          const pdfUrl = await generateFn(order);

          // Use WorkerRepository for audited update
          await workerRepo.updateOrder(orderId, { pdfUrl } as any);
          logger.info({ orderId, pdfUrl, workerId }, 'PDF generated and stored');
          success = true;
          break;
        } catch (err) {
          lastError = err;
          logger.warn({ orderId, attempt, workerId, error: (err as Error)?.message || String(err) }, 'PDF generation failed');

          if (attempt >= maxAttempts) {
            // Mark order with PDF error so it can be retried via DLQ or manual intervention
            try {
              await workerRepo.updateOrder(orderId, { pdfErrorMessage: (err as Error)?.message || String(err) } as any);
            } catch (dbErr) {
              logger.error({ orderId, workerId, error: (dbErr as Error)?.message || String(dbErr) }, 'Failed to mark order with pdf error');
            }

            logger.error({ orderId, workerId, error: (err as Error)?.message || String(err) }, 'PDF generation permanently failed');
            break;
          }

          const backoffMs = baseBackoffMs * Math.pow(2, attempt - 1);
          logger.info({ orderId, attempt, workerId, backoffMs }, 'Backing off before PDF retry');
          await sleep(backoffMs);
        }
      }

    } catch (err) {
      logger.error({ error: (err as Error)?.message || String(err) }, 'OrderCreatedPdfWorker error');
    }
  });
}
