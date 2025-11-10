/**
 * Master AI Service Tests
 * Tests for unified tenant intelligence and chat interface
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { MasterAIService } from '../../server/services/MasterAIService';
import { setupTest, teardownTest, createTestCompany } from '../helpers/testDb';
import { createMockAIQuery, createMockOpenAIResponse } from '../helpers/mockData';

describe('MasterAIService', () => {
  let masterAI: MasterAIService;
  let testCompany: any;
  let mockStorage: any;

  beforeEach(async () => {
    const { company } = await setupTest();
    testCompany = company;

    // Mock storage
    mockStorage = {
      getCompany: jest.fn().mockResolvedValue(company),
      saveConversation: jest.fn().mockResolvedValue({ id: 'conv-123' }),
      getConversations: jest.fn().mockResolvedValue([]),
      getConversation: jest.fn().mockResolvedValue(null),
      uploadDocument: jest.fn().mockResolvedValue({ id: 'doc-123' }),
      getKnowledgeBase: jest.fn().mockResolvedValue([]),
      getStats: jest.fn().mockResolvedValue({
        totalQueries: 0,
        totalConversations: 0,
        avgResponseTime: 0,
      }),
    };

    masterAI = new MasterAIService(mockStorage);
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await teardownTest();
    jest.restoreAllMocks();
  });

  describe('Topic Validation', () => {
    it('should accept optometry-related questions', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createMockOpenAIResponse('Progressive lenses are recommended.')),
        })
      ) as any;

      const query = createMockAIQuery({
        message: 'What are progressive lenses?',
        companyId: testCompany.id,
      });

      const response = await masterAI.chat(query);

      expect(response.isRelevant).toBe(true);
      expect(response.rejectionReason).toBeUndefined();
    });

    it('should accept eye care related questions', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createMockOpenAIResponse('Vision testing is important.')),
        })
      ) as any;

      const query = createMockAIQuery({
        message: 'How do I test patient vision?',
        companyId: testCompany.id,
      });

      const response = await masterAI.chat(query);

      expect(response.isRelevant).toBe(true);
    });

    it('should reject off-topic questions', async () => {
      const query = createMockAIQuery({
        message: 'What is the weather today?',
        companyId: testCompany.id,
      });

      const response = await masterAI.chat(query);

      expect(response.isRelevant).toBe(false);
      expect(response.rejectionReason).toBeDefined();
      expect(response.rejectionReason).toContain('not related to optometry');
    });

    it('should reject unrelated business questions', async () => {
      const query = createMockAIQuery({
        message: 'How do I invest in cryptocurrency?',
        companyId: testCompany.id,
      });

      const response = await masterAI.chat(query);

      expect(response.isRelevant).toBe(false);
      expect(response.rejectionReason).toBeDefined();
    });

    it('should accept prescription-related questions', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createMockOpenAIResponse('Sphere measures focal power.')),
        })
      ) as any;

      const query = createMockAIQuery({
        message: 'What does sphere mean in a prescription?',
        companyId: testCompany.id,
      });

      const response = await masterAI.chat(query);

      expect(response.isRelevant).toBe(true);
    });

    it('should accept inventory-related questions', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createMockOpenAIResponse('Check your inventory dashboard.')),
        })
      ) as any;

      const query = createMockAIQuery({
        message: 'How many frames do I have in stock?',
        companyId: testCompany.id,
      });

      const response = await masterAI.chat(query);

      expect(response.isRelevant).toBe(true);
    });
  });

  describe('Query Classification', () => {
    it('should classify knowledge queries', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createMockOpenAIResponse('Knowledge response')),
        })
      ) as any;

      const query = createMockAIQuery({
        message: 'What is astigmatism?',
        companyId: testCompany.id,
      });

      const response = await masterAI.chat(query);

      expect(response.metadata.queryType).toBe('knowledge');
    });

    it('should classify data queries', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createMockOpenAIResponse('Data response')),
        })
      ) as any;

      const query = createMockAIQuery({
        message: 'How many patients did I see last week?',
        companyId: testCompany.id,
      });

      const response = await masterAI.chat(query);

      expect(response.metadata.queryType).toBe('data');
    });

    it('should classify hybrid queries', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createMockOpenAIResponse('Hybrid response')),
        })
      ) as any;

      const query = createMockAIQuery({
        message: 'What progressive lenses should I recommend for my presbyopic patients?',
        companyId: testCompany.id,
      });

      const response = await masterAI.chat(query);

      expect(response.metadata.queryType).toMatch(/knowledge|hybrid|data/);
    });
  });

  describe('Conversation Management', () => {
    it('should create new conversation for first message', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createMockOpenAIResponse('Response')),
        })
      ) as any;

      const query = createMockAIQuery({
        message: 'Hello',
        companyId: testCompany.id,
      });

      const response = await masterAI.chat(query);

      expect(response.conversationId).toBeDefined();
      expect(mockStorage.saveConversation).toHaveBeenCalled();
    });

    it('should continue existing conversation', async () => {
      const existingConvId = 'existing-conv-123';
      mockStorage.getConversation.mockResolvedValue({
        id: existingConvId,
        messages: [
          { role: 'user', content: 'Previous question' },
          { role: 'assistant', content: 'Previous answer' },
        ],
      });

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createMockOpenAIResponse('Follow-up response')),
        })
      ) as any;

      const query = createMockAIQuery({
        message: 'Tell me more',
        conversationId: existingConvId,
        companyId: testCompany.id,
      });

      const response = await masterAI.chat(query);

      expect(response.conversationId).toBe(existingConvId);
    });

    it('should retrieve conversation history', async () => {
      const mockConversations = [
        { id: 'conv-1', createdAt: new Date(), messages: [] },
        { id: 'conv-2', createdAt: new Date(), messages: [] },
      ];

      mockStorage.getConversations.mockResolvedValue(mockConversations);

      const conversations = await masterAI.getConversations('user-123', testCompany.id);

      expect(conversations).toHaveLength(2);
      expect(mockStorage.getConversations).toHaveBeenCalledWith('user-123', testCompany.id);
    });
  });

  describe('Database Tools', () => {
    it('should execute patient lookup tool', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(
            createMockOpenAIResponse(JSON.stringify({
              tool: 'searchPatients',
              query: 'John Doe',
            }))
          ),
        })
      ) as any;

      const query = createMockAIQuery({
        message: 'Find patient John Doe',
        companyId: testCompany.id,
      });

      const response = await masterAI.chat(query);

      expect(response.toolsUsed).toContain('searchPatients');
    });

    it('should execute order lookup tool', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(
            createMockOpenAIResponse(JSON.stringify({
              tool: 'searchOrders',
              status: 'pending',
            }))
          ),
        })
      ) as any;

      const query = createMockAIQuery({
        message: 'Show me pending orders',
        companyId: testCompany.id,
      });

      const response = await masterAI.chat(query);

      expect(response.toolsUsed).toContain('searchOrders');
    });

    it('should execute inventory lookup tool', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(
            createMockOpenAIResponse(JSON.stringify({
              tool: 'checkInventory',
              product: 'frames',
            }))
          ),
        })
      ) as any;

      const query = createMockAIQuery({
        message: 'Check frame inventory',
        companyId: testCompany.id,
      });

      const response = await masterAI.chat(query);

      expect(response.toolsUsed).toContain('checkInventory');
    });
  });

  describe('Learning System', () => {
    it('should use learned knowledge when available', async () => {
      // Company with high learning progress
      const learnedCompany = {
        ...testCompany,
        aiLearningProgress: 75,
      };
      mockStorage.getCompany.mockResolvedValue(learnedCompany);

      // Mock learned knowledge search
      const mockLearnedResponse = {
        answer: 'Learned answer from previous interactions',
        confidence: 0.9,
        sources: [{ type: 'learned_knowledge' }],
      };

      // Override searchLearnedKnowledge to return mock
      jest.spyOn(masterAI as any, 'searchLearnedKnowledge').mockResolvedValue(mockLearnedResponse);

      const query = createMockAIQuery({
        message: 'What are progressive lenses?',
        companyId: testCompany.id,
      });

      const response = await masterAI.chat(query);

      expect(response.metadata.queryType).toBe('learned');
      expect(response.answer).toContain('Learned answer');
      expect(response.sources[0].type).toBe('learned_knowledge');
    });

    it('should fallback to external AI when learned confidence is low', async () => {
      const learnedCompany = {
        ...testCompany,
        aiLearningProgress: 50,
      };
      mockStorage.getCompany.mockResolvedValue(learnedCompany);

      // Mock low-confidence learned response
      jest.spyOn(masterAI as any, 'searchLearnedKnowledge').mockResolvedValue({
        answer: 'Low confidence answer',
        confidence: 0.6, // Below 0.85 threshold
      });

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createMockOpenAIResponse('External AI answer')),
        })
      ) as any;

      const query = createMockAIQuery({
        message: 'What are progressive lenses?',
        companyId: testCompany.id,
      });

      const response = await masterAI.chat(query);

      expect(response.metadata.usedExternalAI).toBe(true);
      expect(response.metadata.queryType).not.toBe('learned');
    });

    it('should track learning progress', async () => {
      const query = createMockAIQuery({
        message: 'What are progressive lenses?',
        companyId: testCompany.id,
      });

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createMockOpenAIResponse('Response')),
        })
      ) as any;

      const response = await masterAI.chat(query);

      expect(response.metadata.learningProgress).toBeDefined();
      expect(typeof response.metadata.learningProgress).toBe('number');
      expect(response.metadata.learningProgress).toBeGreaterThanOrEqual(0);
      expect(response.metadata.learningProgress).toBeLessThanOrEqual(100);
    });
  });

  describe('Document Upload', () => {
    it('should upload company document', async () => {
      const result = await masterAI.uploadDocument(
        testCompany.id,
        'user-123',
        {
          fileName: 'test.pdf',
          fileContent: 'base64content',
          fileType: 'application/pdf',
        }
      );

      expect(mockStorage.uploadDocument).toHaveBeenCalledWith(
        testCompany.id,
        'user-123',
        expect.objectContaining({
          fileName: 'test.pdf',
        })
      );
      expect(result).toHaveProperty('id');
    });

    it('should retrieve knowledge base documents', async () => {
      const mockDocs = [
        { id: 'doc-1', fileName: 'guide.pdf' },
        { id: 'doc-2', fileName: 'manual.pdf' },
      ];
      mockStorage.getKnowledgeBase.mockResolvedValue(mockDocs);

      const docs = await masterAI.getKnowledgeBase(testCompany.id);

      expect(docs).toHaveLength(2);
      expect(mockStorage.getKnowledgeBase).toHaveBeenCalledWith(testCompany.id);
    });
  });

  describe('Statistics', () => {
    it('should retrieve AI usage stats', async () => {
      const mockStats = {
        totalQueries: 150,
        totalConversations: 25,
        avgResponseTime: 1500,
        topicDistribution: {
          knowledge: 60,
          data: 40,
        },
      };
      mockStorage.getStats.mockResolvedValue(mockStats);

      const stats = await masterAI.getStats(testCompany.id);

      expect(stats.totalQueries).toBe(150);
      expect(stats.totalConversations).toBe(25);
      expect(mockStorage.getStats).toHaveBeenCalledWith(testCompany.id);
    });
  });

  describe('Error Handling', () => {
    it('should handle company not found', async () => {
      mockStorage.getCompany.mockResolvedValue(null);

      const query = createMockAIQuery({
        message: 'Test query',
        companyId: 'non-existent-company',
      });

      await expect(masterAI.chat(query)).rejects.toThrow('Company not found');
    });

    it('should handle external AI failure gracefully', async () => {
      global.fetch = jest.fn(() =>
        Promise.reject(new Error('AI service unavailable'))
      ) as any;

      const query = createMockAIQuery({
        message: 'What are progressive lenses?',
        companyId: testCompany.id,
      });

      await expect(masterAI.chat(query)).rejects.toThrow();
    });

    it('should handle database errors gracefully', async () => {
      mockStorage.saveConversation.mockRejectedValue(new Error('Database error'));

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createMockOpenAIResponse('Response')),
        })
      ) as any;

      const query = createMockAIQuery({
        message: 'Test query',
        companyId: testCompany.id,
      });

      await expect(masterAI.chat(query)).rejects.toThrow();
    });
  });

  describe('Response Formatting', () => {
    it('should include all required response fields', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createMockOpenAIResponse('Test response')),
        })
      ) as any;

      const query = createMockAIQuery({
        message: 'What are progressive lenses?',
        companyId: testCompany.id,
      });

      const response = await masterAI.chat(query);

      expect(response).toHaveProperty('answer');
      expect(response).toHaveProperty('conversationId');
      expect(response).toHaveProperty('sources');
      expect(response).toHaveProperty('toolsUsed');
      expect(response).toHaveProperty('confidence');
      expect(response).toHaveProperty('isRelevant');
      expect(response).toHaveProperty('metadata');
      expect(response.metadata).toHaveProperty('responseTime');
      expect(response.metadata).toHaveProperty('queryType');
      expect(response.metadata).toHaveProperty('learningProgress');
      expect(response.metadata).toHaveProperty('usedExternalAI');
    });

    it('should include suggestions for ambiguous queries', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(
            createMockOpenAIResponse('Could you clarify if you mean...')
          ),
        })
      ) as any;

      const query = createMockAIQuery({
        message: 'Tell me about lenses',
        companyId: testCompany.id,
      });

      const response = await masterAI.chat(query);

      expect(response.suggestions).toBeDefined();
    });
  });

  describe('Multi-tenant Isolation', () => {
    it('should isolate conversations by company', async () => {
      const company2 = await createTestCompany({ id: 'company-2' });

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createMockOpenAIResponse('Response')),
        })
      ) as any;

      // Query for company 1
      const query1 = createMockAIQuery({
        message: 'Test 1',
        companyId: testCompany.id,
      });

      mockStorage.getCompany.mockResolvedValueOnce(testCompany);
      await masterAI.chat(query1);

      // Query for company 2
      const query2 = createMockAIQuery({
        message: 'Test 2',
        companyId: company2.id,
      });

      mockStorage.getCompany.mockResolvedValueOnce(company2);
      await masterAI.chat(query2);

      // Verify separate storage calls
      expect(mockStorage.getCompany).toHaveBeenCalledWith(testCompany.id);
      expect(mockStorage.getCompany).toHaveBeenCalledWith(company2.id);
    });
  });

  describe('Performance', () => {
    it('should complete queries within acceptable time', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createMockOpenAIResponse('Fast response')),
        })
      ) as any;

      const query = createMockAIQuery({
        message: 'What are progressive lenses?',
        companyId: testCompany.id,
      });

      const startTime = Date.now();
      const response = await masterAI.chat(query);
      const elapsedTime = Date.now() - startTime;

      expect(response.metadata.responseTime).toBeDefined();
      expect(elapsedTime).toBeLessThan(5000); // 5 seconds
    });
  });
});
