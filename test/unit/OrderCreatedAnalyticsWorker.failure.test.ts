import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerOrderCreatedAnalyticsWorker } from '../../server/workers/OrderCreatedAnalyticsWorker';

describe('OrderCreatedAnalyticsWorker - failure', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('marks order with analyticsErrorMessage after permanent failures', async () => {
    const analyticsClient = {
      track: vi.fn(async () => { throw new Error('boom'); }),
    };

    const storage = {
      updateOrder: vi.fn(async (orderId: string, updates: any) => {
        // emulate successful DB update
        return { id: orderId, ...updates };
      }),
    } as any;

    // set low attempts/backoff to speed up test
    process.env.WORKER_ANALYTICS_MAX_ATTEMPTS = '2';
    process.env.WORKER_ANALYTICS_BASE_BACKOFF_MS = '5';

    registerOrderCreatedAnalyticsWorker(storage, { analyticsClient });

    const eventBus = (await import('../../server/lib/eventBus')).default;
    await eventBus.publish('order.submitted', { orderId: 'order-2', ecpId: 'ecp-2' });

    // wait a bit for retries/backoff
    await new Promise((r) => setTimeout(r, 200));

    expect(analyticsClient.track).toHaveBeenCalled();
    expect((storage.updateOrder as any).mock.calls.length).toBeGreaterThan(0);
    const [[orderId, updates]] = (storage.updateOrder as any).mock.calls;
    expect(orderId).toBe('order-2');
    expect(updates.analyticsErrorMessage).toContain('boom');
  });
});
