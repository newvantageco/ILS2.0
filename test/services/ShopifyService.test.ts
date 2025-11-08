/**
 * Shopify Service Tests
 * Tests for Shopify API integration and order synchronization
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ShopifyService } from '../../server/services/ShopifyService';
import { setupTest, teardownTest, createTestCompany } from '../helpers/testDb';
import { createMockShopifyOrder } from '../helpers/mockData';

describe('ShopifyService', () => {
  let shopifyService: ShopifyService;
  let testCompany: any;

  beforeEach(async () => {
    const { company } = await setupTest();
    testCompany = company;

    shopifyService = new ShopifyService({
      shopDomain: 'test-shop.myshopify.com',
      accessToken: 'test_access_token',
      companyId: company.id,
    });
  });

  afterEach(async () => {
    await teardownTest();
    jest.clearAllMocks();
  });

  describe('Configuration', () => {
    it('should initialize with correct configuration', () => {
      expect(shopifyService).toBeDefined();
      expect(shopifyService['config'].shopDomain).toBe('test-shop.myshopify.com');
      expect(shopifyService['config'].companyId).toBe(testCompany.id);
    });

    it('should throw error with invalid shop domain', () => {
      expect(() => {
        new ShopifyService({
          shopDomain: 'invalid-domain',
          accessToken: 'test_token',
          companyId: 'test-company-id',
        });
      }).toThrow();
    });

    it('should throw error without access token', () => {
      expect(() => {
        new ShopifyService({
          shopDomain: 'test-shop.myshopify.com',
          accessToken: '',
          companyId: 'test-company-id',
        });
      }).toThrow();
    });
  });

  describe('Order Retrieval', () => {
    it('should fetch orders from Shopify', async () => {
      const mockOrders = [
        createMockShopifyOrder({ id: 1, order_number: 1001 }),
        createMockShopifyOrder({ id: 2, order_number: 1002 }),
      ];

      // Mock fetch API
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ orders: mockOrders }),
        })
      ) as any;

      const orders = await shopifyService.getOrders();

      expect(orders).toHaveLength(2);
      expect(orders[0].order_number).toBe(1001);
      expect(orders[1].order_number).toBe(1002);
    });

    it('should handle Shopify API errors gracefully', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
        })
      ) as any;

      await expect(shopifyService.getOrders()).rejects.toThrow();
    });

    it('should filter orders by status', async () => {
      const mockOrders = [
        createMockShopifyOrder({ id: 1, fulfillment_status: 'fulfilled' }),
        createMockShopifyOrder({ id: 2, fulfillment_status: 'unfulfilled' }),
      ];

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ orders: mockOrders }),
        })
      ) as any;

      const orders = await shopifyService.getOrders({ fulfillment_status: 'unfulfilled' });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('fulfillment_status=unfulfilled'),
        expect.any(Object)
      );
    });
  });

  describe('Order Synchronization', () => {
    it('should sync Shopify order to ILS database', async () => {
      const mockOrder = createMockShopifyOrder();

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ order: mockOrder }),
        })
      ) as any;

      const syncedOrder = await shopifyService.syncOrder(mockOrder.id);

      expect(syncedOrder).toBeDefined();
      expect(syncedOrder.shopifyOrderId).toBe(mockOrder.id.toString());
      expect(syncedOrder.companyId).toBe(testCompany.id);
    });

    it('should handle duplicate order sync', async () => {
      const mockOrder = createMockShopifyOrder();

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ order: mockOrder }),
        })
      ) as any;

      // Sync once
      await shopifyService.syncOrder(mockOrder.id);

      // Sync again - should update, not create duplicate
      const secondSync = await shopifyService.syncOrder(mockOrder.id);

      expect(secondSync).toBeDefined();
      // Verify only one order exists
      const allOrders = await shopifyService.getOrders();
      expect(allOrders.filter(o => o.id === mockOrder.id)).toHaveLength(1);
    });

    it('should extract customer information correctly', async () => {
      const mockOrder = createMockShopifyOrder({
        customer: {
          id: 12345,
          email: 'john.doe@example.com',
          first_name: 'John',
          last_name: 'Doe',
          phone: '07123456789',
        },
      });

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ order: mockOrder }),
        })
      ) as any;

      const syncedOrder = await shopifyService.syncOrder(mockOrder.id);

      expect(syncedOrder.customerEmail).toBe('john.doe@example.com');
      expect(syncedOrder.customerName).toBe('John Doe');
      expect(syncedOrder.customerPhone).toBe('07123456789');
    });
  });

  describe('Webhook Handling', () => {
    it('should verify webhook signature', () => {
      const payload = JSON.stringify(createMockShopifyOrder());
      const secret = 'test_webhook_secret';
      const signature = shopifyService.generateWebhookSignature(payload, secret);

      const isValid = shopifyService.verifyWebhook(payload, signature, secret);

      expect(isValid).toBe(true);
    });

    it('should reject invalid webhook signature', () => {
      const payload = JSON.stringify(createMockShopifyOrder());
      const secret = 'test_webhook_secret';
      const invalidSignature = 'invalid_signature';

      const isValid = shopifyService.verifyWebhook(payload, invalidSignature, secret);

      expect(isValid).toBe(false);
    });

    it('should process order creation webhook', async () => {
      const mockOrder = createMockShopifyOrder();

      const result = await shopifyService.handleWebhook('orders/create', mockOrder);

      expect(result).toBe(true);
      // Verify order was created in database
      const orders = await shopifyService.getOrders();
      expect(orders.some(o => o.id === mockOrder.id)).toBe(true);
    });

    it('should process order update webhook', async () => {
      const mockOrder = createMockShopifyOrder();

      // Create order first
      await shopifyService.handleWebhook('orders/create', mockOrder);

      // Update order
      const updatedOrder = { ...mockOrder, financial_status: 'refunded' };
      await shopifyService.handleWebhook('orders/updated', updatedOrder);

      // Verify order was updated
      const orders = await shopifyService.getOrders();
      const order = orders.find(o => o.id === mockOrder.id);
      expect(order?.financial_status).toBe('refunded');
    });
  });

  describe('Fulfillment', () => {
    it('should create fulfillment for order', async () => {
      const mockOrder = createMockShopifyOrder();

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            fulfillment: {
              id: 999,
              order_id: mockOrder.id,
              status: 'success',
              tracking_number: 'TRACK123',
            },
          }),
        })
      ) as any;

      const fulfillment = await shopifyService.createFulfillment(mockOrder.id, {
        line_items: mockOrder.line_items.map(item => ({ id: item.id })),
        tracking_number: 'TRACK123',
        tracking_company: 'Royal Mail',
      });

      expect(fulfillment).toBeDefined();
      expect(fulfillment.tracking_number).toBe('TRACK123');
    });

    it('should handle fulfillment errors', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 400,
          json: () => Promise.resolve({
            errors: 'Invalid fulfillment request',
          }),
        })
      ) as any;

      await expect(
        shopifyService.createFulfillment(123456, {
          line_items: [],
        })
      ).rejects.toThrow();
    });
  });

  describe('Rate Limiting', () => {
    it('should respect Shopify API rate limits', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 429,
          headers: {
            get: (name: string) => (name === 'Retry-After' ? '2' : null),
          },
        })
      ) as any;

      const startTime = Date.now();

      try {
        await shopifyService.getOrders();
      } catch (error) {
        // Expected to throw
      }

      const elapsedTime = Date.now() - startTime;

      // Should have waited for retry-after period
      expect(elapsedTime).toBeGreaterThanOrEqual(2000);
    });
  });

  describe('Error Recovery', () => {
    it('should retry failed requests', async () => {
      let callCount = 0;
      global.fetch = jest.fn(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.resolve({
            ok: false,
            status: 500,
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ orders: [] }),
        });
      }) as any;

      const orders = await shopifyService.getOrders();

      expect(callCount).toBe(3);
      expect(orders).toBeDefined();
    });

    it('should fail after max retries', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
        })
      ) as any;

      await expect(shopifyService.getOrders()).rejects.toThrow();
    });
  });
});
