import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerOrderCreatedAnalyticsWorker } from '../../server/workers/OrderCreatedAnalyticsWorker';

describe('OrderCreatedAnalyticsWorker - success', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('calls analytics client.track and does not mark order on success', async () => {
    const calls: any[] = [];
    const analyticsClient = {
      track: vi.fn(async (eventName: string, payload: any) => {
        calls.push({ eventName, payload });
      }),
    };

    // minimal in-memory storage stub
    const storage = {
      updateOrder: vi.fn(async () => { throw new Error('should not be called'); }),
    } as any;

    registerOrderCreatedAnalyticsWorker(storage, { analyticsClient });

    // publish an event via eventBus used by the worker
    const eventBus = (await import('../../server/lib/eventBus')).default;
    await eventBus.publish('order.submitted', { orderId: 'order-1', ecpId: 'ecp-1' });

    // give microtasks a tick
    await new Promise((r) => setTimeout(r, 50));

    expect(analyticsClient.track).toHaveBeenCalled();
    expect((storage.updateOrder as any).mock.calls.length).toBe(0);
  });
});
