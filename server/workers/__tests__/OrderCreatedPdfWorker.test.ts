import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import eventBus from '../../lib/eventBus';
import { registerOrderCreatedPdfWorker } from '../OrderCreatedPdfWorker';

describe('OrderCreatedPdfWorker', () => {
  beforeEach(() => {
    // reset event handlers map by creating a fresh eventBus instance is difficult here
    // so we rely on unsubscribe behavior via register calls in tests and fresh mocks.
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('generates a PDF and updates order with pdfUrl', async () => {
    const orderId = 'test-order-1';
    const order = { id: orderId } as any;

    const updateCalls: any[] = [];

    const storageMock = {
      getOrder: vi.fn(async (id: string) => (id === orderId ? order : null)),
      updateOrder: vi.fn(async (id: string, updates: any) => {
        updateCalls.push({ id, updates });
        return true;
      }),
    } as any;

    // Register worker with mock storage
    registerOrderCreatedPdfWorker(storageMock);

    // Publish event
    eventBus.publish('order.submitted', { orderId });

    // Wait enough time for the worker to run its placeholder PDF generation (200ms) plus slop
    await new Promise((r) => setTimeout(r, 400));

    // Assert storage.getOrder and updateOrder were called
    expect(storageMock.getOrder).toHaveBeenCalledWith(orderId);
    expect(updateCalls.length).toBeGreaterThan(0);

    const found = updateCalls.find((c) => c.id === orderId && c.updates && c.updates.pdfUrl);
    expect(found).toBeDefined();
    expect(found.updates.pdfUrl).toBe(`https://files.example.com/orders/${orderId}/order.pdf`);
  });
});
