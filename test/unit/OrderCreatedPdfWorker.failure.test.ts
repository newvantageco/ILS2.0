import { describe, it, expect, vi, afterEach } from 'vitest';
import eventBus from '../../server/lib/eventBus';
import { registerOrderCreatedPdfWorker } from '../../server/workers/OrderCreatedPdfWorker';

describe('OrderCreatedPdfWorker (failure DLQ)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('marks order with pdfErrorMessage after permanent failures', async () => {
    const orderId = 'test-order-fail-1';
    const order = { id: orderId } as any;

    const updateCalls: any[] = [];

    const storageMock = {
      getOrderById_Internal: vi.fn(async (id: string) => (id === orderId ? order : null)),
      updateOrder: vi.fn(async (id: string, updates: any) => {
        updateCalls.push({ id, updates });
        return true;
      }),
    } as any;

    // Make generateFn always throw to simulate permanent failure
    const failingGenerate = vi.fn(async () => {
      throw new Error('simulated PDF generator failure');
    });

    // Register worker with mock storage and failing generator
    registerOrderCreatedPdfWorker(storageMock, { generateFn: failingGenerate });

    // Publish event
    eventBus.publish('order.submitted', { orderId });

    // Wait enough time for worker to attempt retries: attempts * backoff. Default maxAttempts=3 and baseBackoff default 500.
    // Worst-case time: 3 attempts with sleeps: 500ms + 1000ms = ~1500ms + generation 200ms each -> allow 2500ms
    await new Promise((r) => setTimeout(r, 2600));

    // Ensure updateOrder was called at least once for the error marking
    const errorMark = updateCalls.find((c) => c.id === orderId && c.updates && c.updates.pdfErrorMessage);
    expect(errorMark).toBeDefined();
    expect(errorMark.updates.pdfErrorMessage).toContain('simulated PDF generator failure');
  });
});
