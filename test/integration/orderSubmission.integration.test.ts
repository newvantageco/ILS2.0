import { describe, it, expect, vi, beforeEach } from 'vitest';

// We'll mock the eventBus to use a fresh in-memory instance per test so worker
// subscriptions don't leak between tests.
vi.mock('../../server/lib/eventBus', async () => {
  const mod = await vi.importActual('../../server/lib/eventBus/InMemoryEventBus');
  const InMemoryEventBus = (mod as any).InMemoryEventBus;
  const inst = new InMemoryEventBus();
  return { default: inst };
});

import { OrderService } from '../../server/services/OrderService';
import { registerOrderCreatedLimsWorker } from '../../server/workers/OrderCreatedLimsWorker';
import { registerOrderCreatedPdfWorker } from '../../server/workers/OrderCreatedPdfWorker';

describe('Order submission integration (in-memory event bus)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // reduce retries/backoffs to speed up tests
    process.env.WORKER_LIMS_MAX_ATTEMPTS = '1';
    process.env.WORKER_PDF_MAX_ATTEMPTS = '1';
    process.env.WORKER_LIMS_BASE_BACKOFF_MS = '10';
    process.env.WORKER_PDF_BASE_BACKOFF_MS = '10';
  });

  it('flows from submitOrder -> workers -> storage updates', async () => {
    const createdOrder = {
      id: 'int-order-1',
      orderNumber: 'INT-1',
      companyId: 'comp-1',
      patientId: 'pat-1',
      ecpId: 'ecp-int',
      status: 'pending',
      lensType: 'single',
      lensMaterial: 'plastic',
      coating: 'none',
    } as any;

    // Storage mock that will be used by OrderService and workers
    const storage = {
      createOrder: vi.fn(async (o: any) => createdOrder),
      getOrder: vi.fn(async (id: string) => createdOrder),
      updateOrderWithLimsJob: vi.fn(async (id: string, updates: any) => ({ id, ...updates })),
      updateOrder: vi.fn(async (id: string, updates: any) => ({ id, ...updates })),
    } as any;

    const limsClient = {
      validateConfiguration: vi.fn(async () => ({ valid: true, rules: {} })),
      createJob: vi.fn(async () => ({ jobId: 'job-x', status: 'queued', createdAt: new Date().toISOString() })),
    } as any;

    // Register workers with the same storage/clients
    registerOrderCreatedLimsWorker(limsClient, storage);
    registerOrderCreatedPdfWorker(storage, { generateFn: async (order: any) => `https://files.test/${order.id}.pdf` });

    const svc = new OrderService(limsClient, storage, { enableLimsValidation: true });
    const res = await svc.submitOrder({ lensType: 'single', lensMaterial: 'plastic', coating: 'none' }, 'ecp-int');

    // Wait briefly to allow in-process event handlers to run
    await new Promise((r) => setTimeout(r, 200));

    expect(storage.createOrder).toHaveBeenCalled();
    expect(storage.updateOrderWithLimsJob).toHaveBeenCalled();
    expect(storage.updateOrder).toHaveBeenCalled();
    expect(res).toEqual(createdOrder);
  });
});
