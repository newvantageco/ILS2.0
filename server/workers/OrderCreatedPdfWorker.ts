import eventBus from "../lib/eventBus";
import type { IStorage } from "../storage";
import { createLogger } from "../utils/logger";

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

export function registerOrderCreatedPdfWorker(storage: IStorage, opts?: PdfWorkerOptions) {
  const generateFn = opts?.generateFn ?? defaultGenerateOrderPdfAndStore;

  eventBus.subscribe("order.submitted", async (payload) => {
    try {
      const { orderId } = payload as any;
      logger.info("Generating PDF for order", { orderId });

      const order = await storage.getOrderById_Internal(orderId);
      if (!order) {
        logger.warn("Order not found for PDF generation", { orderId });
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
          logger.info('PDF generation attempt', { orderId, attempt });
          const pdfUrl = await generateFn(order);

          await storage.updateOrder(orderId, { pdfUrl });
          logger.info('PDF generated and stored', { orderId, pdfUrl });
          success = true;
          break;
        } catch (err) {
          lastError = err;
          logger.warn('PDF generation failed', { orderId, attempt, error: (err as Error)?.message || String(err) });

          if (attempt >= maxAttempts) {
            // Mark order with PDF error so it can be retried via DLQ or manual intervention
            try {
              await storage.updateOrder(orderId, { pdfErrorMessage: (err as Error)?.message || String(err) });
            } catch (dbErr) {
              logger.error('Failed to mark order with pdf error', (dbErr as Error)?.message || String(dbErr), { orderId });
            }

            logger.error('PDF generation permanently failed', (err as Error)?.message || String(err), { orderId });
            break;
          }

          const backoffMs = baseBackoffMs * Math.pow(2, attempt - 1);
          logger.info('Backing off before PDF retry', { orderId, attempt, backoffMs });
          await sleep(backoffMs);
        }
      }

    } catch (err) {
      logger.error("OrderCreatedPdfWorker error", (err as Error)?.message || String(err), {});
    }
  });
}
