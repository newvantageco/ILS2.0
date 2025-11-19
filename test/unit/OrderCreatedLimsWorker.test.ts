import { describe, it, expect, vi, afterEach } from 'vitest';
import eventBus from '../../server/lib/eventBus';
import { registerOrderCreatedLimsWorker } from '../../server/workers/OrderCreatedLimsWorker';

describe('OrderCreatedLimsWorker (unit)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates a LIMS job and updates order', async () => {
    const orderId = 'lims-order-1';
    const order = { id: orderId, odSphere: '1.0', osSphere: '1.0', lensType: 'single', lensMaterial: 'poly', coating: 'ar' } as any;

    const storageMock = {
      getOrderById_Internal: vi.fn(async (id: string) => (id === orderId ? order : null)),
      updateOrderWithLimsJob: vi.fn(async (id: string, limsData: any) => ({ ...limsData })),
    } as any;

    const limsResponse = { jobId: 'job-123', status: 'queued', createdAt: new Date().toISOString() };
    const limsClientMock = {
      createJob: vi.fn(async (req: any) => limsResponse),
      validateConfiguration: vi.fn(async () => ({ valid: true })),
      getJobStatus: vi.fn(async () => ({ status: 'queued' })),
      healthCheck: vi.fn(async () => true),
    } as any;

    registerOrderCreatedLimsWorker(limsClientMock, storageMock);

    eventBus.publish('order.submitted', { orderId });

    // Wait for worker to process (small sleep)
    await new Promise((r) => setTimeout(r, 400));

    expect(storageMock.getOrderById_Internal).toHaveBeenCalledWith(orderId);
    expect(limsClientMock.createJob).toHaveBeenCalled();
    expect(storageMock.updateOrderWithLimsJob).toHaveBeenCalledWith(orderId, expect.objectContaining({ jobId: limsResponse.jobId }));
  });
});
