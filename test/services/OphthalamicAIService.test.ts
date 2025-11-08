/**
 * Ophthalmic AI Service Tests
 * Tests for optical practice AI assistant with clinical and business intelligence
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { OphthalamicAIService } from '../../server/services/OphthalamicAIService';
import { setupTest, teardownTest, createTestPatient, createTestPrescription } from '../helpers/testDb';
import { createMockPrescription, createMockOpenAIResponse } from '../helpers/mockData';

describe('OphthalamicAIService', () => {
  let testCompany: any;
  let testPatient: any;
  let testPrescription: any;

  beforeEach(async () => {
    const { company } = await setupTest();
    testCompany = company;
    testPatient = await createTestPatient(company.id);
    testPrescription = await createTestPrescription(testPatient.id, company.id);
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await teardownTest();
    jest.restoreAllMocks();
  });

  describe('General AI Query', () => {
    it('should answer ophthalmic questions', async () => {
      const mockResponse = {
        answer: 'Progressive lenses have multiple focal points for distance, intermediate, and near vision.',
        confidence: 0.95,
        relatedTopics: ['Bifocals', 'Varifocals', 'Presbyopia'],
      };

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(
            createMockOpenAIResponse(JSON.stringify(mockResponse))
          ),
        })
      ) as any;

      const response = await OphthalamicAIService.query({
        question: 'What are progressive lenses?',
        context: { companyId: testCompany.id },
      });

      expect(response.answer).toBeDefined();
      expect(response.confidence).toBeGreaterThan(0.5);
    });

    it('should include conversation history', async () => {
      const mockResponse = {
        answer: 'Varifocals are another term for progressive lenses.',
        confidence: 0.9,
      };

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(
            createMockOpenAIResponse(JSON.stringify(mockResponse))
          ),
        })
      ) as any;

      const response = await OphthalamicAIService.query({
        question: 'What about varifocals?',
        context: {
          companyId: testCompany.id,
          conversationHistory: [
            { role: 'user', content: 'What are progressive lenses?' },
            { role: 'assistant', content: 'Progressive lenses have multiple focal points.' },
          ],
        },
      });

      expect(response.answer).toBeDefined();
    });

    it('should provide recommendations', async () => {
      const mockResponse = {
        answer: 'For first-time progressive wearers, I recommend...',
        recommendations: [
          {
            type: 'product',
            title: 'Premium Progressive Lenses',
            description: 'Wide field of view, easy adaptation',
            action: 'View product details',
          },
        ],
        confidence: 0.88,
      };

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(
            createMockOpenAIResponse(JSON.stringify(mockResponse))
          ),
        })
      ) as any;

      const response = await OphthalamicAIService.query({
        question: 'What lenses should I recommend for a first-time progressive wearer?',
        context: { companyId: testCompany.id },
      });

      expect(response.recommendations).toBeDefined();
      expect(response.recommendations?.length).toBeGreaterThan(0);
    });

    it('should use patient context when provided', async () => {
      const mockResponse = {
        answer: 'Based on this patient\'s prescription...',
        confidence: 0.92,
      };

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(
            createMockOpenAIResponse(JSON.stringify(mockResponse))
          ),
        })
      ) as any;

      const response = await OphthalamicAIService.query({
        question: 'What lenses should I recommend?',
        context: {
          companyId: testCompany.id,
          patientId: testPatient.id,
        },
      });

      expect(response.answer).toBeDefined();
      // Verify fetch was called with patient context
      expect(fetch).toHaveBeenCalled();
    });
  });

  describe('Lens Recommendations', () => {
    it('should recommend lenses based on prescription', async () => {
      const prescriptionData = createMockPrescription({
        odSphere: '+2.00',
        odAdd: '+2.00',
        osSphere: '+2.00',
        osAdd: '+2.00',
      });

      const mockResponse = {
        recommendations: [
          {
            tier: 'BEST',
            lensType: 'Premium Progressive',
            lensMaterial: 'Polycarbonate',
            coating: 'Premium AR + Blue Light',
            features: ['Wide field of view', 'Easy adaptation', 'Scratch resistant'],
            reason: 'High ADD power requires premium progressive for best comfort',
            estimatedPrice: 299.99,
          },
          {
            tier: 'BETTER',
            lensType: 'Standard Progressive',
            lensMaterial: 'Trivex',
            coating: 'Standard AR',
            features: ['Good field of view', 'Impact resistant'],
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
            createMockOpenAIResponse(JSON.stringify(mockResponse))
          ),
        })
      ) as any;

      const response = await OphthalamicAIService.getLensRecommendations(
        prescriptionData,
        { patientAge: 55, occupation: 'Computer programmer' }
      );

      expect(response.recommendations).toBeDefined();
      expect(response.recommendations.length).toBeGreaterThan(0);
      expect(response.recommendations[0]).toHaveProperty('tier');
      expect(response.recommendations[0]).toHaveProperty('lensType');
      expect(response.recommendations[0]).toHaveProperty('reason');
    });

    it('should consider patient lifestyle', async () => {
      const prescriptionData = createMockPrescription();

      const mockResponse = {
        recommendations: [
          {
            tier: 'BEST',
            lensType: 'Progressive with Blue Light Filter',
            features: ['Reduced eye strain', 'Computer optimized'],
            reason: 'Occupation requires extended computer use',
          },
        ],
        confidence: 0.88,
      };

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(
            createMockOpenAIResponse(JSON.stringify(mockResponse))
          ),
        })
      ) as any;

      const response = await OphthalamicAIService.getLensRecommendations(
        prescriptionData,
        {
          patientAge: 45,
          occupation: 'Software developer',
          lifestyle: 'Works 8+ hours on computer daily',
        }
      );

      expect(response.recommendations[0].features).toContain('Computer optimized');
    });

    it('should handle single vision prescriptions', async () => {
      const prescriptionData = createMockPrescription({
        odAdd: undefined,
        osAdd: undefined,
      });

      const mockResponse = {
        recommendations: [
          {
            tier: 'BEST',
            lensType: 'Single Vision',
            lensMaterial: 'High-index',
            reason: 'No ADD power needed',
          },
        ],
        confidence: 0.95,
      };

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(
            createMockOpenAIResponse(JSON.stringify(mockResponse))
          ),
        })
      ) as any;

      const response = await OphthalamicAIService.getLensRecommendations(
        prescriptionData,
        { patientAge: 25 }
      );

      expect(response.recommendations[0].lensType).toContain('Single Vision');
    });
  });

  describe('Contact Lens Recommendations', () => {
    it('should recommend contact lenses for eligible patients', async () => {
      const mockResponse = {
        recommendations: [
          {
            tier: 'BEST',
            brand: 'Premium Daily Disposable',
            type: 'Daily',
            material: 'Silicone Hydrogel',
            features: ['High oxygen transmission', 'UV protection'],
            reason: 'Best for dry eyes and long wear',
          },
        ],
        warnings: [],
        fittingNotes: 'Standard fitting expected',
        confidence: 0.89,
      };

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(
            createMockOpenAIResponse(JSON.stringify(mockResponse))
          ),
        })
      ) as any;

      const response = await OphthalamicAIService.getContactLensRecommendations(
        testPrescription.id,
        testCompany.id,
        {
          wearSchedule: 'daily',
          hasAstigmatism: false,
        }
      );

      expect(response.recommendations).toBeDefined();
      expect(response.recommendations.length).toBeGreaterThan(0);
    });

    it('should provide warnings for challenging prescriptions', async () => {
      const mockResponse = {
        recommendations: [],
        warnings: [
          'High astigmatism may require specialty toric lenses',
          'Professional fitting strongly recommended',
        ],
        fittingNotes: 'May require trial fitting',
        confidence: 0.65,
      };

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(
            createMockOpenAIResponse(JSON.stringify(mockResponse))
          ),
        })
      ) as any;

      const response = await OphthalamicAIService.getContactLensRecommendations(
        testPrescription.id,
        testCompany.id,
        {
          wearSchedule: 'extended',
          hasAstigmatism: true,
        }
      );

      expect(response.warnings).toBeDefined();
      expect(response.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Prescription Explanation', () => {
    it('should explain prescription in patient-friendly language', async () => {
      const mockResponse = {
        summary: 'You have mild nearsightedness with astigmatism in both eyes.',
        details: {
          rightEye: 'Your right eye needs correction for distance vision and has slight astigmatism.',
          leftEye: 'Your left eye is similar to your right eye.',
          readingAddition: 'You also need reading glasses as you have presbyopia.',
        },
        recommendations: [
          'Progressive lenses would give you clear vision at all distances',
          'Consider anti-reflective coating to reduce glare',
        ],
        glossary: {
          'Sphere': 'Measures nearsightedness or farsightedness',
          'Cylinder': 'Measures astigmatism',
          'Add': 'Reading power for close work',
        },
      };

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(
            createMockOpenAIResponse(JSON.stringify(mockResponse))
          ),
        })
      ) as any;

      const response = await OphthalamicAIService.explainPrescription(
        testPrescription.id,
        testCompany.id
      );

      expect(response.summary).toBeDefined();
      expect(response.details).toBeDefined();
      expect(response.recommendations).toBeDefined();
    });

    it('should provide glossary of technical terms', async () => {
      const mockResponse = {
        summary: 'Summary',
        glossary: {
          'Sphere': 'Definition',
          'Cylinder': 'Definition',
          'Axis': 'Definition',
        },
      };

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(
            createMockOpenAIResponse(JSON.stringify(mockResponse))
          ),
        })
      ) as any;

      const response = await OphthalamicAIService.explainPrescription(
        testPrescription.id,
        testCompany.id
      );

      expect(response.glossary).toBeDefined();
      expect(Object.keys(response.glossary).length).toBeGreaterThan(0);
    });
  });

  describe('NHS Guidance', () => {
    it('should check NHS eligibility', async () => {
      const mockResponse = {
        isEligible: true,
        eligibilityReasons: [
          'Patient is under 16',
          'Full-time student under 19',
        ],
        voucherValue: 39.10,
        voucherType: 'A',
        claimProcess: [
          'Complete GOS1 form',
          'Submit to NHS BSA',
          'Retain records for 3 years',
        ],
        additionalInfo: 'Patient may be eligible for complex lens supplement',
      };

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(
            createMockOpenAIResponse(JSON.stringify(mockResponse))
          ),
        })
      ) as any;

      const response = await OphthalamicAIService.getNhsGuidance(
        testPatient.id,
        testCompany.id
      );

      expect(response.isEligible).toBeDefined();
      expect(response.voucherValue).toBeDefined();
      expect(response.claimProcess).toBeDefined();
    });

    it('should explain why patient is not eligible', async () => {
      const mockResponse = {
        isEligible: false,
        eligibilityReasons: [
          'Patient does not meet age criteria',
          'No registered exemptions found',
        ],
        suggestions: [
          'Check if patient qualifies for low income support',
          'Consider private payment options',
        ],
      };

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(
            createMockOpenAIResponse(JSON.stringify(mockResponse))
          ),
        })
      ) as any;

      const response = await OphthalamicAIService.getNhsGuidance(
        testPatient.id,
        testCompany.id
      );

      expect(response.isEligible).toBe(false);
      expect(response.suggestions).toBeDefined();
    });

    it('should provide complex lens supplement guidance', async () => {
      const mockResponse = {
        isEligible: true,
        voucherValue: 39.10,
        complexLensSupplementEligible: true,
        supplementAmount: 54.30,
        supplementReason: 'Prism correction required',
      };

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(
            createMockOpenAIResponse(JSON.stringify(mockResponse))
          ),
        })
      ) as any;

      const response = await OphthalamicAIService.getNhsGuidance(
        testPatient.id,
        testCompany.id
      );

      expect(response.complexLensSupplementEligible).toBe(true);
      expect(response.supplementAmount).toBeDefined();
    });
  });

  describe('Business Insights', () => {
    it('should provide inventory insights', async () => {
      const mockResponse = {
        answer: 'Your inventory analysis shows...',
        insights: [
          {
            type: 'inventory',
            title: 'Low stock alert',
            description: 'Progressive lenses running low',
            priority: 'high',
            action: 'Reorder 50 units',
          },
        ],
        metrics: {
          totalFrames: 150,
          lowStockItems: 5,
          topSellers: ['Ray-Ban Aviator', 'Oakley Holbrook'],
        },
      };

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(
            createMockOpenAIResponse(JSON.stringify(mockResponse))
          ),
        })
      ) as any;

      const response = await OphthalamicAIService.getBusinessInsights(
        testCompany.id,
        'What is my inventory status?'
      );

      expect(response.answer).toBeDefined();
      expect(response.insights).toBeDefined();
    });

    it('should provide sales insights', async () => {
      const mockResponse = {
        answer: 'Your sales performance...',
        insights: [
          {
            type: 'sales',
            title: 'Revenue trending up',
            description: '15% increase from last month',
            priority: 'medium',
          },
        ],
        metrics: {
          monthlyRevenue: 25000,
          averageOrderValue: 250,
          topProducts: ['Progressive lenses', 'Blue light coating'],
        },
      };

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(
            createMockOpenAIResponse(JSON.stringify(mockResponse))
          ),
        })
      ) as any;

      const response = await OphthalamicAIService.getBusinessInsights(
        testCompany.id,
        'How are my sales performing?'
      );

      expect(response.metrics).toBeDefined();
    });

    it('should provide patient analytics', async () => {
      const mockResponse = {
        answer: 'Your patient demographics...',
        insights: [
          {
            type: 'patients',
            title: 'Growing presbyopic patient base',
            description: '60% of patients over 45',
            priority: 'medium',
            action: 'Consider stocking more progressive lenses',
          },
        ],
      };

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(
            createMockOpenAIResponse(JSON.stringify(mockResponse))
          ),
        })
      ) as any;

      const response = await OphthalamicAIService.getBusinessInsights(
        testCompany.id,
        'What are my patient demographics?'
      );

      expect(response.insights).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle AI service errors gracefully', async () => {
      global.fetch = jest.fn(() =>
        Promise.reject(new Error('AI service unavailable'))
      ) as any;

      await expect(
        OphthalamicAIService.query({
          question: 'Test question',
          context: { companyId: testCompany.id },
        })
      ).rejects.toThrow();
    });

    it('should handle invalid prescription ID', async () => {
      await expect(
        OphthalamicAIService.explainPrescription('non-existent-id', testCompany.id)
      ).rejects.toThrow();
    });

    it('should handle invalid patient ID', async () => {
      await expect(
        OphthalamicAIService.getNhsGuidance('non-existent-id', testCompany.id)
      ).rejects.toThrow();
    });

    it('should handle malformed AI responses', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(
            createMockOpenAIResponse('Invalid JSON response')
          ),
        })
      ) as any;

      await expect(
        OphthalamicAIService.query({
          question: 'Test',
          context: { companyId: testCompany.id },
        })
      ).rejects.toThrow();
    });
  });

  describe('Context Building', () => {
    it('should build comprehensive system prompt', async () => {
      const mockResponse = {
        answer: 'Contextual response',
        confidence: 0.9,
      };

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(
            createMockOpenAIResponse(JSON.stringify(mockResponse))
          ),
        })
      ) as any;

      await OphthalamicAIService.query({
        question: 'Test',
        context: { companyId: testCompany.id },
      });

      // Verify system prompt was included in API call
      const call = (fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);

      expect(body.messages[0].role).toBe('system');
      expect(body.messages[0].content).toContain('ophthalmic');
    });
  });
});
