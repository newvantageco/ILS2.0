import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrderService } from '../../server/services/OrderService';

describe('OrderService.submitOrder', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('creates an order, publishes event and returns created order on success', async () => {
    const createdOrder = {
      id: 'order-1',
      orderNumber: 'ORD-1',
      companyId: 'comp-1',
      patientId: 'pat-1',
      ecpId: 'ecp-1',
      status: 'pending',
      lensType: 'single',
      lensMaterial: 'plastic',
      coating: 'none',
    } as any;

    const limsClient = {
      validateConfiguration: vi.fn(async () => ({ valid: true, rules: {} })),
    } as any;

    const storage = {
      createOrder: vi.fn(async (o: any) => createdOrder),
    } as any;

    const eventBus = (await import('../../server/lib/eventBus')).default as any;
    const pubSpy = vi.spyOn(eventBus, 'publish').mockImplementation(() => undefined);

    const svc = new OrderService(limsClient, storage, { enableLimsValidation: true });
    const result = await svc.submitOrder({ lensType: 'single', lensMaterial: 'plastic', coating: 'none' }, 'ecp-1');

    expect(storage.createOrder).toHaveBeenCalled();
    expect(pubSpy).toHaveBeenCalledWith('order.submitted', expect.objectContaining({ orderId: 'order-1' }));
    expect(result).toEqual(createdOrder);
  });

  it('throws when validation fails and does not create order', async () => {
    const limsClient = {
      validateConfiguration: vi.fn(async () => { throw new Error('invalid'); }),
    } as any;

    const storage = {
      createOrder: vi.fn(async (o: any) => { return { id: 'should-not' }; }),
    } as any;

    const eventBus = (await import('../../server/lib/eventBus')).default as any;
    const pubSpy = vi.spyOn(eventBus, 'publish').mockImplementation(() => undefined);

    const svc = new OrderService(limsClient, storage, { enableLimsValidation: true });

    await expect(svc.submitOrder({ lensType: 'single' }, 'ecp-2')).rejects.toThrow();
    expect(storage.createOrder).not.toHaveBeenCalled();
    expect(pubSpy).not.toHaveBeenCalled();
  });
});
