/**
 * Integration Test: Shopify Order to Prescription Fulfillment Workflow
 *
 * Tests the complete end-to-end workflow:
 * 1. Shopify order received
 * 2. Order synchronized to ILS
 * 3. Customer prescription uploaded
 * 4. AI verifies prescription
 * 5. Prescription linked to order
 * 6. AI recommends lenses
 * 7. Order processed and fulfilled
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ShopifyOrderSyncService } from '../../server/services/ShopifyOrderSyncService';
import { PrescriptionVerificationService } from '../../server/services/PrescriptionVerificationService';
import { OphthalamicAIService } from '../../server/services/OphthalamicAIService';
import { setupTest, teardownTest } from '../helpers/testDb';
import { createMockShopifyOrder, createMockOpenAIResponse } from '../helpers/mockData';

describe('Shopify to Prescription Fulfillment Workflow', () => {
  let testCompany: any;
  let syncService: ShopifyOrderSyncService;

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

  it('should complete full workflow from Shopify order to fulfillment', async () => {
    // ==========================================
    // STEP 1: Shopify order received
    // ==========================================
    const shopifyOrder = createMockShopifyOrder({
      id: 999888777,
      order_number: 2001,
      customer: {
        id: 555666777,
        email: 'workflow.test@example.com',
        first_name: 'Workflow',
        last_name: 'Test',
      },
      line_items: [
        {
          id: 111222,
          title: 'Progressive Lenses - Premium',
          quantity: 1,
          price: '299.99',
        },
      ],
    });

    // ==========================================
    // STEP 2: Order synchronized to ILS
    // ==========================================
    const syncedOrder = await ShopifyOrderSyncService.syncOrder(shopifyOrder);

    expect(syncedOrder).toHaveProperty('ilsOrderId');
    expect(syncedOrder).toHaveProperty('patientId');
    expect(syncedOrder.shopifyOrderId).toBe('999888777');
    expect(syncedOrder.awaitingPrescription).toBe(true);

    // ==========================================
    // STEP 3: Customer uploads prescription
    // ==========================================
    const mockAIExtractionResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            prescriptionData: {
              sphereOD: 1.50,
              cylinderOD: -0.75,
              axisOD: 90,
              addOD: 2.00,
              sphereOS: 1.25,
              cylinderOS: -0.50,
              axisOS: 95,
              addOS: 2.00,
              pd: 64,
              prescriptionDate: '2025-01-01',
              practitionerName: 'Dr. Integration Test',
            },
            confidence: 0.95,
            requiresReview: false,
            reviewNotes: [],
          }),
        },
      }],
    };

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockAIExtractionResponse),
      })
    ) as any;

    const prescriptionUpload = await PrescriptionVerificationService.uploadPrescription({
      companyId: testCompany.id,
      shopifyOrderId: '999888777',
      fileUrl: 'https://example.com/workflow-prescription.jpg',
      fileName: 'workflow-prescription.jpg',
      fileType: 'image/jpeg',
      fileSize: 1024000,
    });

    // ==========================================
    // STEP 4: AI verifies prescription
    // ==========================================
    expect(prescriptionUpload.verificationStatus).toBe('verified');
    expect(prescriptionUpload.extractedData).toBeDefined();
    expect(prescriptionUpload.extractedData.sphereOD).toBe(1.50);
    expect(prescriptionUpload.confidence).toBeGreaterThan(0.9);

    // ==========================================
    // STEP 5: Prescription linked to order
    // ==========================================
    const linkedOrder = await ShopifyOrderSyncService.linkPrescription(
      syncedOrder.ilsOrderId,
      prescriptionUpload.id
    );

    expect(linkedOrder.prescriptionId).toBe(prescriptionUpload.id);
    expect(linkedOrder.awaitingPrescription).toBe(false);

    // ==========================================
    // STEP 6: AI recommends lenses
    // ==========================================
    const mockLensRecommendations = {
      recommendations: [
        {
          tier: 'BEST',
          lensType: 'Premium Progressive',
          lensMaterial: 'Polycarbonate',
          coating: 'Premium AR + Blue Light',
          features: ['Wide field of view', 'Easy adaptation'],
          reason: 'High ADD power requires premium progressive',
          estimatedPrice: 299.99,
        },
        {
          tier: 'BETTER',
          lensType: 'Standard Progressive',
          lensMaterial: 'Trivex',
          coating: 'Standard AR',
          features: ['Good field of view'],
          reason: 'Balanced quality and value',
          estimatedPrice: 199.99,
        },
      ],
      confidence: 0.91,
    };

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(
          createMockOpenAIResponse(JSON.stringify(mockLensRecommendations))
        ),
      })
    ) as any;

    const lensRecommendations = await OphthalamicAIService.getLensRecommendations(
      prescriptionUpload.extractedData,
      {
        patientAge: 55,
        occupation: 'Software Developer',
      }
    );

    expect(lensRecommendations.recommendations).toHaveLength(2);
    expect(lensRecommendations.recommendations[0].tier).toBe('BEST');

    // ==========================================
    // STEP 7: Order processed
    // ==========================================
    const processedOrder = await ShopifyOrderSyncService.updateOrderStatus(
      syncedOrder.ilsOrderId,
      'in_production',
      {
        lensType: lensRecommendations.recommendations[0].lensType,
        lensMaterial: lensRecommendations.recommendations[0].lensMaterial,
        coating: lensRecommendations.recommendations[0].coating,
      }
    );

    expect(processedOrder.status).toBe('in_production');
    expect(processedOrder.lensType).toBe('Premium Progressive');

    // ==========================================
    // STEP 8: Order fulfilled
    // ==========================================
    const fulfilledOrder = await ShopifyOrderSyncService.updateOrderStatus(
      syncedOrder.ilsOrderId,
      'shipped',
      {
        trackingNumber: 'TRACK123456',
        carrier: 'Royal Mail',
        shippedDate: new Date(),
      }
    );

    expect(fulfilledOrder.status).toBe('shipped');
    expect(fulfilledOrder.trackingNumber).toBe('TRACK123456');

    // ==========================================
    // VERIFICATION: Complete workflow
    // ==========================================

    // Verify customer created
    const customer = await db.query.patients.findFirst({
      where: eq(patients.email, 'workflow.test@example.com'),
    });
    expect(customer).toBeDefined();
    expect(customer?.firstName).toBe('Workflow');

    // Verify order exists with all data
    const finalOrder = await db.query.orders.findFirst({
      where: eq(orders.id, syncedOrder.ilsOrderId),
    });
    expect(finalOrder).toBeDefined();
    expect(finalOrder?.status).toBe('shipped');
    expect(finalOrder?.prescriptionId).toBeDefined();
    expect(finalOrder?.lensType).toBe('Premium Progressive');
    expect(finalOrder?.trackingNumber).toBe('TRACK123456');

    // Verify prescription stored
    const storedPrescription = await db.query.prescriptionUploads.findFirst({
      where: eq(prescriptionUploads.id, prescriptionUpload.id),
    });
    expect(storedPrescription).toBeDefined();
    expect(storedPrescription?.verificationStatus).toBe('verified');

    console.log('✅ Complete workflow test passed');
    console.log('   1. Shopify order received ✓');
    console.log('   2. Order synchronized ✓');
    console.log('   3. Prescription uploaded ✓');
    console.log('   4. AI verified prescription ✓');
    console.log('   5. Prescription linked ✓');
    console.log('   6. AI recommended lenses ✓');
    console.log('   7. Order processed ✓');
    console.log('   8. Order fulfilled ✓');
  });

  it('should handle workflow with manual prescription review', async () => {
    // Order received
    const shopifyOrder = createMockShopifyOrder();
    const syncedOrder = await ShopifyOrderSyncService.syncOrder(shopifyOrder);

    // Prescription upload with low confidence
    const mockLowConfidenceResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            prescriptionData: {
              sphereOD: 1.50,
              cylinderOD: null, // Missing data
              axisOD: null,
            },
            confidence: 0.55, // Low confidence
            requiresReview: true,
            reviewNotes: ['Unable to read cylinder values'],
          }),
        },
      }],
    };

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockLowConfidenceResponse),
        })
    ) as any;

    const upload = await PrescriptionVerificationService.uploadPrescription({
      companyId: testCompany.id,
      shopifyOrderId: syncedOrder.shopifyOrderId,
      fileUrl: 'https://example.com/blurry-rx.jpg',
      fileName: 'blurry-rx.jpg',
      fileType: 'image/jpeg',
      fileSize: 1024000,
    });

    // Verify needs manual review
    expect(upload.verificationStatus).toBe('needs_review');
    expect(upload.requiresReview).toBe(true);

    // Manual review and approval
    const approved = await PrescriptionVerificationService.approvePrescription(
      upload.id,
      {
        sphereOD: 1.50,
        cylinderOD: -0.75,
        axisOD: 90,
        sphereOS: 1.50,
        cylinderOS: -0.75,
        axisOS: 90,
        pd: 64,
      },
      'optometrist-123'
    );

    expect(approved.verificationStatus).toBe('verified');
    expect(approved.reviewedBy).toBe('optometrist-123');

    // Link and continue workflow
    const linkedOrder = await ShopifyOrderSyncService.linkPrescription(
      syncedOrder.ilsOrderId,
      approved.id
    );

    expect(linkedOrder.prescriptionId).toBeDefined();
    expect(linkedOrder.awaitingPrescription).toBe(false);
  });

  it('should handle workflow with rejected prescription', async () => {
    // Order received
    const shopifyOrder = createMockShopifyOrder();
    const syncedOrder = await ShopifyOrderSyncService.syncOrder(shopifyOrder);

    // Unreadable prescription
    const mockUnreadableResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            prescriptionData: {},
            confidence: 0.20,
            requiresReview: true,
            reviewNotes: ['Image too blurry to read'],
          }),
        },
      }],
    };

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockUnreadableResponse),
      })
    ) as any;

    const upload = await PrescriptionVerificationService.uploadPrescription({
      companyId: testCompany.id,
      shopifyOrderId: syncedOrder.shopifyOrderId,
      fileUrl: 'https://example.com/unreadable-rx.jpg',
      fileName: 'unreadable-rx.jpg',
      fileType: 'image/jpeg',
      fileSize: 1024000,
    });

    // Reject prescription
    const rejected = await PrescriptionVerificationService.rejectPrescription(
      upload.id,
      'Image quality too poor - please resubmit',
      'optometrist-123'
    );

    expect(rejected.verificationStatus).toBe('rejected');

    // Order should still be awaiting prescription
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, syncedOrder.ilsOrderId),
    });

    expect(order?.prescriptionId).toBeNull();
    expect(order?.awaitingPrescription).toBe(true);
  });
});
