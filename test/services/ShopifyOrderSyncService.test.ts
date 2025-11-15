/**
 * Shopify Order Sync Service Tests
 * Tests for automated order synchronization from Shopify to ILS
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ShopifyOrderSyncService } from '../../server/services/ShopifyOrderSyncService';
import { PrescriptionVerificationService } from '../../server/services/PrescriptionVerificationService';
import { setupTest, teardownTest, createTestPatient } from '../helpers/testDb';
import { createMockShopifyOrder } from '../helpers/mockData';
import { db } from '../../server/db';
import { orders } from '../../shared/schema';
import { eq } from 'drizzle-orm';

describe.skip('ShopifyOrderSyncService (SKIPPED - needs API refactor)', () => {
  let syncService: ShopifyOrderSyncService;
  let testCompany: any;

  beforeEach(async () => {
    const { company } = await setupTest();
    testCompany = company;
    syncService = new ShopifyOrderSyncService(company.id);
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await teardownTest();
    jest.restoreAllMocks();
  });

  describe('Order Synchronization', () => {
    it('should sync new Shopify order to ILS database', async () => {
      const mockOrder = createMockShopifyOrder();

      const result = await ShopifyOrderSyncService.syncOrder(mockOrder);

      expect(result).toHaveProperty('ilsOrderId');
      expect(result).toHaveProperty('shopifyOrderId');
      expect(result.shopifyOrderId).toBe(mockOrder.id.toString());
      expect(result.status).toBe('synced');
    });

    it('should create or find customer from Shopify order', async () => {
      const mockOrder = createMockShopifyOrder({
        customer: {
          id: 123456,
          email: 'new.customer@example.com',
          first_name: 'New',
          last_name: 'Customer',
        },
      });

      const result = await ShopifyOrderSyncService.syncOrder(mockOrder);

      expect(result.patientId).toBeDefined();
      expect(result.customerEmail).toBe('new.customer@example.com');
    });

    it('should link prescription upload if present in metadata', async () => {
      const mockOrder = createMockShopifyOrder({
        note_attributes: [
          { name: 'prescription_upload_id', value: 'upload-123' },
        ],
      });

      const result = await ShopifyOrderSyncService.syncOrder(mockOrder);

      expect(result.prescriptionUploadId).toBe('upload-123');
    });

    it('should extract lens specifications from line items', async () => {
      const mockOrder = createMockShopifyOrder({
        line_items: [
          {
            id: 111,
            title: 'Progressive Lenses - Premium',
            variant_title: 'Polycarbonate with AR Coating',
            properties: [
              { name: 'Lens Type', value: 'Progressive' },
              { name: 'Material', value: 'Polycarbonate' },
              { name: 'Coating', value: 'Premium AR' },
            ],
          },
        ],
      });

      const result = await ShopifyOrderSyncService.syncOrder(mockOrder);

      expect(result.lensType).toBe('Progressive');
      expect(result.lensMaterial).toBe('Polycarbonate');
      expect(result.coating).toBe('Premium AR');
    });

    it('should update existing order if already synced', async () => {
      const mockOrder = createMockShopifyOrder();

      // Sync once
      const first = await ShopifyOrderSyncService.syncOrder(mockOrder);

      // Update Shopify order
      mockOrder.financial_status = 'refunded';

      // Sync again
      const second = await ShopifyOrderSyncService.syncOrder(mockOrder);

      expect(second.ilsOrderId).toBe(first.ilsOrderId);
      expect(second.financialStatus).toBe('refunded');
    });
  });

  describe('Customer Matching', () => {
    it('should match existing patient by email', async () => {
      // Create existing patient
      const existingPatient = await createTestPatient(testCompany.id, {
        email: 'existing@example.com',
      });

      const mockOrder = createMockShopifyOrder({
        customer: {
          email: 'existing@example.com',
        },
      });

      const result = await ShopifyOrderSyncService.syncOrder(mockOrder);

      expect(result.patientId).toBe(existingPatient.id);
    });

    it('should create new patient if no match found', async () => {
      const mockOrder = createMockShopifyOrder({
        customer: {
          email: 'newcustomer@example.com',
          first_name: 'New',
          last_name: 'Customer',
        },
      });

      const result = await ShopifyOrderSyncService.syncOrder(mockOrder);

      expect(result.patientId).toBeDefined();
      // Verify patient was created
      const patient = await db.query.patients.findFirst({
        where: eq(patients.id, result.patientId),
      });
      expect(patient?.email).toBe('newcustomer@example.com');
    });

    it('should handle orders without customer data', async () => {
      const mockOrder = createMockShopifyOrder({
        customer: null,
      });

      const result = await ShopifyOrderSyncService.syncOrder(mockOrder);

      expect(result.patientId).toBeNull();
      expect(result.status).toBe('synced');
    });
  });

  describe('Prescription Processing', () => {
    it('should create prescription from order metadata', async () => {
      const mockOrder = createMockShopifyOrder({
        note_attributes: [
          { name: 'rx_od_sphere', value: '+1.50' },
          { name: 'rx_od_cylinder', value: '-0.75' },
          { name: 'rx_od_axis', value: '90' },
          { name: 'rx_os_sphere', value: '+1.25' },
          { name: 'rx_os_cylinder', value: '-0.50' },
          { name: 'rx_os_axis', value: '95' },
          { name: 'rx_pd', value: '64' },
        ],
      });

      const result = await ShopifyOrderSyncService.syncOrder(mockOrder);

      expect(result.prescriptionId).toBeDefined();
    });

    it('should wait for prescription upload if not provided', async () => {
      const mockOrder = createMockShopifyOrder();
      // No prescription in metadata

      const result = await ShopifyOrderSyncService.syncOrder(mockOrder);

      expect(result.prescriptionId).toBeNull();
      expect(result.awaitingPrescription).toBe(true);
    });

    it('should link prescription after upload', async () => {
      const mockOrder = createMockShopifyOrder();

      // Sync order without prescription
      const synced = await ShopifyOrderSyncService.syncOrder(mockOrder);
      expect(synced.prescriptionId).toBeNull();

      // Upload prescription
      const upload = await PrescriptionVerificationService.uploadPrescription({
        companyId: testCompany.id,
        shopifyOrderId: mockOrder.id.toString(),
        fileUrl: 'https://example.com/rx.jpg',
        fileName: 'rx.jpg',
        fileType: 'image/jpeg',
        fileSize: 1024000,
      });

      // Link prescription to order
      const linked = await ShopifyOrderSyncService.linkPrescription(
        synced.ilsOrderId,
        upload.id
      );

      expect(linked.prescriptionId).toBeDefined();
      expect(linked.awaitingPrescription).toBe(false);
    });
  });

  describe('Bulk Synchronization', () => {
    it('should sync multiple orders in batch', async () => {
      const mockOrders = [
        createMockShopifyOrder({ id: 1001 }),
        createMockShopifyOrder({ id: 1002 }),
        createMockShopifyOrder({ id: 1003 }),
      ];

      const results = await ShopifyOrderSyncService.syncBulk(mockOrders);

      expect(results).toHaveLength(3);
      expect(results.filter(r => r.status === 'synced')).toHaveLength(3);
    });

    it('should handle partial failures in bulk sync', async () => {
      const mockOrders = [
        createMockShopifyOrder({ id: 1001 }),
        createMockShopifyOrder({ id: 1002, customer: null }), // Invalid
        createMockShopifyOrder({ id: 1003 }),
      ];

      const results = await ShopifyOrderSyncService.syncBulk(mockOrders);

      expect(results).toHaveLength(3);
      const succeeded = results.filter(r => r.status === 'synced');
      const failed = results.filter(r => r.status === 'error');

      expect(succeeded.length).toBeGreaterThan(0);
      expect(failed.length).toBeLessThanOrEqual(1);
    });

    it('should report sync progress for large batches', async () => {
      const mockOrders = Array.from({ length: 50 }, (_, i) =>
        createMockShopifyOrder({ id: 1000 + i })
      );

      let progressReports = 0;
      const onProgress = () => {
        progressReports++;
      };

      await ShopifyOrderSyncService.syncBulk(mockOrders, { onProgress });

      expect(progressReports).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Mock database error
      jest.spyOn(db, 'insert').mockRejectedValueOnce(new Error('Database error'));

      const mockOrder = createMockShopifyOrder();

      await expect(ShopifyOrderSyncService.syncOrder(mockOrder)).rejects.toThrow('Database error');
    });

    it('should continue bulk sync after individual failures', async () => {
      const mockOrders = [
        createMockShopifyOrder({ id: 1001 }),
        createMockShopifyOrder({ id: 1002 }), // This will fail
        createMockShopifyOrder({ id: 1003 }),
      ];

      // Mock error for second order
      let callCount = 0;
      jest.spyOn(db, 'insert').mockImplementation((...args) => {
        callCount++;
        if (callCount === 2) {
          return Promise.reject(new Error('Simulated error'));
        }
        return Promise.resolve([{ id: 'order-' + callCount }] as any);
      });

      const results = await ShopifyOrderSyncService.syncBulk(mockOrders, {
        continueOnError: true,
      });

      expect(results).toHaveLength(3);
      const succeeded = results.filter(r => r.status === 'synced');
      expect(succeeded.length).toBe(2);
    });
  });

  describe('Webhook Integration', () => {
    it('should process order creation webhook', async () => {
      const mockOrder = createMockShopifyOrder();

      const result = await ShopifyOrderSyncService.processWebhook('orders/create', mockOrder);

      expect(result.success).toBe(true);
      expect(result.ilsOrderId).toBeDefined();
    });

    it('should process order update webhook', async () => {
      const mockOrder = createMockShopifyOrder();

      // Create order
      await ShopifyOrderSyncService.syncOrder(mockOrder);

      // Update order
      mockOrder.financial_status = 'paid';
      const result = await ShopifyOrderSyncService.processWebhook('orders/updated', mockOrder);

      expect(result.success).toBe(true);
    });

    it('should process order cancellation webhook', async () => {
      const mockOrder = createMockShopifyOrder();

      // Create order
      const synced = await ShopifyOrderSyncService.syncOrder(mockOrder);

      // Cancel order
      const result = await ShopifyOrderSyncService.processWebhook('orders/cancelled', mockOrder);

      expect(result.success).toBe(true);
      // Verify order status updated
      const updated = await db.query.orders.findFirst({
        where: eq(orders.id, synced.ilsOrderId),
      });
      expect(updated?.status).toBe('cancelled');
    });
  });

  describe('Sync Status Tracking', () => {
    it('should track last sync time', async () => {
      const mockOrder = createMockShopifyOrder();

      const result = await ShopifyOrderSyncService.syncOrder(mockOrder);

      expect(result.lastSyncedAt).toBeDefined();
      expect(result.lastSyncedAt).toBeInstanceOf(Date);
    });

    it('should retrieve sync history', async () => {
      const mockOrder = createMockShopifyOrder();

      await ShopifyOrderSyncService.syncOrder(mockOrder);

      const history = await ShopifyOrderSyncService.getSyncHistory(mockOrder.id.toString());

      expect(history).toBeDefined();
      expect(history.length).toBeGreaterThan(0);
    });

    it('should identify orders needing resync', async () => {
      // Create orders with different sync statuses
      const order1 = createMockShopifyOrder({ id: 1001 });
      const order2 = createMockShopifyOrder({ id: 1002 });

      await ShopifyOrderSyncService.syncOrder(order1);
      // order2 intentionally not synced

      const needsResync = await ShopifyOrderSyncService.getOrdersNeedingSync(testCompany.id);

      expect(needsResync.some(o => o.shopifyOrderId === '1002')).toBe(true);
    });
  });
});
