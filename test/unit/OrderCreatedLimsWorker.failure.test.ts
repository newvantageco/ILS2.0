import { describe, it, expect, vi, afterEach } from 'vitest';
import eventBus from '../../server/lib/eventBus';
import { registerOrderCreatedLimsWorker } from '../../server/workers/OrderCreatedLimsWorker';

describe('OrderCreatedLimsWorker (failure DLQ)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('marks order as failed and writes jobErrorMessage on permanent LIMS failure', async () => {
    const orderId = 'lims-order-fail-1';
    const order = { id: orderId } as any;

    const updateCalls: any[] = [];
    const storageMock = {
      getOrder: vi.fn(async (id: string) => (id === orderId ? order : null)),
      updateOrderWithLimsJob: vi.fn(async (id: string, limsData: any) => {
        updateCalls.push({ id, limsData });
        return true;
      }),
    } as any;

    // LIMS client that always throws a non-retryable error
    const limsClientMock = {
      createJob: vi.fn(async () => {
        const e: any = new Error('permanent LIMS failure');
        e.retryable = false;
        throw e;
      }),
      validateConfiguration: vi.fn(async () => ({ valid: true })),
      getJobStatus: vi.fn(async () => ({ status: 'failed' })),
      healthCheck: vi.fn(async () => true),
    } as any;

    registerOrderCreatedLimsWorker(limsClientMock, storageMock);

    eventBus.publish('order.submitted', { orderId });

    // Wait for processing and backoff attempts (give some margin)
    await new Promise((r) => setTimeout(r, 1200));

    const marked = updateCalls.find((c) => c.limsData && c.limsData.jobStatus === 'failed');
    expect(marked).toBeDefined();
    expect(marked.limsData.jobErrorMessage).toContain('permanent LIMS failure');
  });
});
