/**
 * Prescription Verification Service Tests
 * Tests for AI-powered prescription image OCR and validation
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { PrescriptionVerificationService } from '../../server/services/PrescriptionVerificationService';
import { setupTest, teardownTest } from '../helpers/testDb';

describe('PrescriptionVerificationService', () => {
  let testCompany: any;

  beforeEach(async () => {
    const { company } = await setupTest();
    testCompany = company;
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await teardownTest();
    jest.restoreAllMocks();
  });

  describe('Prescription Upload', () => {
    it('should upload prescription image', async () => {
      const mockAIResponse = {
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
                expiryDate: '2027-01-01',
                practitionerName: 'Dr. Smith',
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
          json: () => Promise.resolve(mockAIResponse),
        })
      ) as any;

      const result = await PrescriptionVerificationService.uploadPrescription({
        companyId: testCompany.id,
        fileUrl: 'https://example.com/prescription.jpg',
        fileName: 'prescription.jpg',
        fileType: 'image/jpeg',
        fileSize: 1024000,
      });

      expect(result).toHaveProperty('id');
      expect(result.verificationStatus).toBe('verified');
      expect(result.extractedData).toBeDefined();
    });

    it('should flag prescription for manual review when confidence is low', async () => {
      const mockAIResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              prescriptionData: {
                sphereOD: 1.50,
                cylinderOD: null, // Missing data
                axisOD: null,
                addOD: null,
                sphereOS: 1.25,
                cylinderOS: null,
                axisOS: null,
                addOS: null,
                pd: null,
              },
              confidence: 0.45, // Low confidence
              requiresReview: true,
              reviewNotes: ['Unable to read cylinder values', 'Image quality poor'],
            }),
          },
        }],
      };

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAIResponse),
        })
      ) as any;

      const result = await PrescriptionVerificationService.uploadPrescription({
        companyId: testCompany.id,
        fileUrl: 'https://example.com/blurry_prescription.jpg',
        fileName: 'blurry_prescription.jpg',
        fileType: 'image/jpeg',
        fileSize: 512000,
      });

      expect(result.verificationStatus).toBe('needs_review');
      expect(result.reviewNotes).toContain('Unable to read cylinder values');
    });

    it('should link prescription to Shopify order', async () => {
      const mockAIResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              prescriptionData: {
                sphereOD: 2.00,
                sphereOS: 2.00,
              },
              confidence: 0.92,
              requiresReview: false,
              reviewNotes: [],
            }),
          },
        }],
      };

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAIResponse),
        })
      ) as any;

      const result = await PrescriptionVerificationService.uploadPrescription({
        companyId: testCompany.id,
        shopifyOrderId: 'shopify-order-123',
        fileUrl: 'https://example.com/prescription.jpg',
        fileName: 'prescription.jpg',
        fileType: 'image/jpeg',
        fileSize: 1024000,
      });

      expect(result.shopifyOrderId).toBe('shopify-order-123');
    });
  });

  describe('AI Extraction', () => {
    it('should extract complete prescription data', async () => {
      const mockAIResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              prescriptionData: {
                sphereOD: -2.50,
                cylinderOD: -1.00,
                axisOD: 180,
                addOD: null,
                sphereOS: -2.25,
                cylinderOS: -0.75,
                axisOS: 175,
                addOS: null,
                pd: 62,
                prescriptionDate: '2024-12-15',
                expiryDate: '2026-12-15',
                practitionerName: 'Dr. Jane Doe',
                practitionerGocNumber: 'GOC12345',
              },
              confidence: 0.97,
              requiresReview: false,
              reviewNotes: [],
            }),
          },
        }],
      };

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAIResponse),
        })
      ) as any;

      const result = await (PrescriptionVerificationService as any).extractPrescriptionDataAI(
        'https://example.com/prescription.jpg'
      );

      expect(result.prescriptionData.sphereOD).toBe(-2.50);
      expect(result.prescriptionData.cylinderOD).toBe(-1.00);
      expect(result.prescriptionData.axisOD).toBe(180);
      expect(result.prescriptionData.practitionerGocNumber).toBe('GOC12345');
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    it('should handle progressive prescriptions with ADD power', async () => {
      const mockAIResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              prescriptionData: {
                sphereOD: 1.50,
                cylinderOD: -0.50,
                axisOD: 90,
                addOD: 2.00, // Progressive ADD
                sphereOS: 1.50,
                cylinderOS: -0.50,
                axisOS: 90,
                addOS: 2.00,
                pd: 64,
              },
              confidence: 0.94,
              requiresReview: false,
              reviewNotes: [],
            }),
          },
        }],
      };

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAIResponse),
        })
      ) as any;

      const result = await (PrescriptionVerificationService as any).extractPrescriptionDataAI(
        'https://example.com/progressive_rx.jpg'
      );

      expect(result.prescriptionData.addOD).toBe(2.00);
      expect(result.prescriptionData.addOS).toBe(2.00);
    });

    it('should detect when prescription data is incomplete', async () => {
      const mockAIResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              prescriptionData: {
                sphereOD: 1.50,
                cylinderOD: null, // Missing
                axisOD: null,
                addOD: null,
                sphereOS: 1.50,
                cylinderOS: null,
                axisOS: null,
                addOS: null,
                pd: null, // Missing
              },
              confidence: 0.60,
              requiresReview: true,
              reviewNotes: [
                'Could not read cylinder values',
                'PD not visible in image',
                'Image may be partially obscured',
              ],
            }),
          },
        }],
      };

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAIResponse),
        })
      ) as any;

      const result = await (PrescriptionVerificationService as any).extractPrescriptionDataAI(
        'https://example.com/incomplete_rx.jpg'
      );

      expect(result.requiresReview).toBe(true);
      expect(result.reviewNotes.length).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThan(0.85);
    });
  });

  describe('Validation', () => {
    it('should validate prescription data ranges', async () => {
      const mockAIResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              prescriptionData: {
                sphereOD: -15.00, // Very high prescription
                cylinderOD: -4.00,
                axisOD: 180,
                sphereOS: -15.00,
                cylinderOS: -4.00,
                axisOS: 180,
                pd: 64,
              },
              confidence: 0.85,
              requiresReview: true,
              reviewNotes: ['Unusually high sphere value - please verify'],
            }),
          },
        }],
      };

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAIResponse),
        })
      ) as any;

      const result = await (PrescriptionVerificationService as any).extractPrescriptionDataAI(
        'https://example.com/high_rx.jpg'
      );

      expect(result.requiresReview).toBe(true);
      expect(result.reviewNotes).toContain('Unusually high sphere value - please verify');
    });

    it('should validate axis values are between 0-180', async () => {
      const mockAIResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              prescriptionData: {
                sphereOD: 1.00,
                cylinderOD: -1.00,
                axisOD: 90, // Valid
                sphereOS: 1.00,
                cylinderOS: -1.00,
                axisOS: 185, // Invalid - out of range
              },
              confidence: 0.70,
              requiresReview: true,
              reviewNotes: ['OS axis value 185 is outside valid range (0-180)'],
            }),
          },
        }],
      };

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAIResponse),
        })
      ) as any;

      const result = await (PrescriptionVerificationService as any).extractPrescriptionDataAI(
        'https://example.com/invalid_axis_rx.jpg'
      );

      expect(result.requiresReview).toBe(true);
    });

    it('should check prescription expiry dates', async () => {
      const mockAIResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              prescriptionData: {
                sphereOD: 1.00,
                sphereOS: 1.00,
                prescriptionDate: '2020-01-01',
                expiryDate: '2022-01-01', // Expired
              },
              confidence: 0.90,
              requiresReview: true,
              reviewNotes: ['Prescription appears to be expired'],
            }),
          },
        }],
      };

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAIResponse),
        })
      ) as any;

      const result = await (PrescriptionVerificationService as any).extractPrescriptionDataAI(
        'https://example.com/expired_rx.jpg'
      );

      expect(result.reviewNotes).toContain('Prescription appears to be expired');
    });
  });

  describe('Manual Review', () => {
    it('should retrieve prescriptions needing review', async () => {
      // Upload prescription that needs review
      const mockAIResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              prescriptionData: { sphereOD: 1.00, sphereOS: 1.00 },
              confidence: 0.55,
              requiresReview: true,
              reviewNotes: ['Low image quality'],
            }),
          },
        }],
      };

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAIResponse),
        })
      ) as any;

      await PrescriptionVerificationService.uploadPrescription({
        companyId: testCompany.id,
        fileUrl: 'https://example.com/rx1.jpg',
        fileName: 'rx1.jpg',
        fileType: 'image/jpeg',
        fileSize: 1024000,
      });

      const needsReview = await PrescriptionVerificationService.getPrescriptionsNeedingReview(
        testCompany.id
      );

      expect(needsReview.length).toBeGreaterThan(0);
      expect(needsReview[0].verificationStatus).toBe('needs_review');
    });

    it('should approve prescription after manual review', async () => {
      // Upload prescription
      const mockAIResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              prescriptionData: { sphereOD: 1.00, sphereOS: 1.00 },
              confidence: 0.60,
              requiresReview: true,
              reviewNotes: ['Please verify'],
            }),
          },
        }],
      };

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAIResponse),
        })
      ) as any;

      const upload = await PrescriptionVerificationService.uploadPrescription({
        companyId: testCompany.id,
        fileUrl: 'https://example.com/rx.jpg',
        fileName: 'rx.jpg',
        fileType: 'image/jpeg',
        fileSize: 1024000,
      });

      // Approve it
      const approved = await PrescriptionVerificationService.approvePrescription(
        upload.id,
        {
          sphereOD: 1.00,
          sphereOS: 1.00,
          cylinderOD: -0.50,
          cylinderOS: -0.50,
          axisOD: 90,
          axisOS: 90,
          pd: 64,
        },
        'user-123'
      );

      expect(approved.verificationStatus).toBe('verified');
      expect(approved.reviewedBy).toBe('user-123');
    });

    it('should reject prescription with reason', async () => {
      const mockAIResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              prescriptionData: {},
              confidence: 0.30,
              requiresReview: true,
              reviewNotes: ['Cannot read prescription'],
            }),
          },
        }],
      };

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAIResponse),
        })
      ) as any;

      const upload = await PrescriptionVerificationService.uploadPrescription({
        companyId: testCompany.id,
        fileUrl: 'https://example.com/unreadable.jpg',
        fileName: 'unreadable.jpg',
        fileType: 'image/jpeg',
        fileSize: 1024000,
      });

      const rejected = await PrescriptionVerificationService.rejectPrescription(
        upload.id,
        'Image too blurry to read',
        'user-123'
      );

      expect(rejected.verificationStatus).toBe('rejected');
      expect(rejected.rejectionReason).toBe('Image too blurry to read');
    });
  });

  describe('Error Handling', () => {
    it('should handle AI service errors', async () => {
      global.fetch = jest.fn(() =>
        Promise.reject(new Error('OpenAI API error'))
      ) as any;

      await expect(
        PrescriptionVerificationService.uploadPrescription({
          companyId: testCompany.id,
          fileUrl: 'https://example.com/rx.jpg',
          fileName: 'rx.jpg',
          fileType: 'image/jpeg',
          fileSize: 1024000,
        })
      ).rejects.toThrow();
    });

    it('should handle invalid image URLs', async () => {
      await expect(
        PrescriptionVerificationService.uploadPrescription({
          companyId: testCompany.id,
          fileUrl: 'invalid-url',
          fileName: 'rx.jpg',
          fileType: 'image/jpeg',
          fileSize: 1024000,
        })
      ).rejects.toThrow();
    });

    it('should handle malformed AI responses', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            choices: [{
              message: {
                content: 'Not valid JSON',
              },
            }],
          }),
        })
      ) as any;

      await expect(
        PrescriptionVerificationService.uploadPrescription({
          companyId: testCompany.id,
          fileUrl: 'https://example.com/rx.jpg',
          fileName: 'rx.jpg',
          fileType: 'image/jpeg',
          fileSize: 1024000,
        })
      ).rejects.toThrow();
    });
  });

  describe('Image Format Support', () => {
    it('should support JPEG images', async () => {
      const mockAIResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              prescriptionData: { sphereOD: 1.00, sphereOS: 1.00 },
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
          json: () => Promise.resolve(mockAIResponse),
        })
      ) as any;

      const result = await PrescriptionVerificationService.uploadPrescription({
        companyId: testCompany.id,
        fileUrl: 'https://example.com/rx.jpg',
        fileName: 'rx.jpg',
        fileType: 'image/jpeg',
        fileSize: 1024000,
      });

      expect(result).toBeDefined();
    });

    it('should support PNG images', async () => {
      const mockAIResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              prescriptionData: { sphereOD: 1.00, sphereOS: 1.00 },
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
          json: () => Promise.resolve(mockAIResponse),
        })
      ) as any;

      const result = await PrescriptionVerificationService.uploadPrescription({
        companyId: testCompany.id,
        fileUrl: 'https://example.com/rx.png',
        fileName: 'rx.png',
        fileType: 'image/png',
        fileSize: 2048000,
      });

      expect(result).toBeDefined();
    });
  });
});
