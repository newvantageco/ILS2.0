/**
 * Ophthalmic AI Service Client
 *
 * Integrates with the new consolidated AI service for:
 * - Ophthalmic knowledge queries
 * - Dispensing advice
 * - Product recommendations
 * - Business intelligence
 * - RAG-powered contextual responses
 */

import fetch from 'node-fetch';
import { createLogger, type Logger } from '../utils/logger';
import jwt from 'jsonwebtoken';

export interface ChatRequest {
  message: string;
  conversationId?: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  category?: 'ophthalmic' | 'dispensing' | 'business' | 'general';
}

export interface ChatResponse {
  answer: string;
  conversationId?: string;
  usedExternalAi: boolean;
  confidence: number;
  contextUsed: boolean;
  sources: Array<{
    type: 'learned' | 'knowledge';
    similarity?: number;
    category?: string;
  }>;
  provider?: string;
  model?: string;
  processingTimeMs: number;
}

export interface ProductRecommendationRequest {
  prescription: {
    od_sphere?: number;
    od_cylinder?: number;
    od_axis?: number;
    os_sphere?: number;
    os_cylinder?: number;
    os_axis?: number;
    add?: number;
    pd?: number;
  };
  patientNeeds?: string;
}

export interface AddKnowledgeRequest {
  content: string;
  category: 'ophthalmic' | 'dispensing' | 'business' | 'general';
  summary?: string;
  tags?: string[];
  filename?: string;
}

export interface BusinessQueryRequest {
  query: string;
  queryType: 'sales' | 'inventory' | 'patient_analytics' | 'general';
}

export interface FeedbackRequest {
  messageId?: string;
  learningId?: string;
  helpful: boolean;
  rating?: number;
  comments?: string;
}

export class OphthalmicAIService {
  private logger: Logger;
  private serviceUrl: string;
  private companyId: string;
  private userId: string;
  private jwtSecret: string;

  constructor(companyId: string, userId: string) {
    this.logger = createLogger('OphthalmicAIService');
    this.serviceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8080';
    this.companyId = companyId;
    this.userId = userId;
    this.jwtSecret = process.env.JWT_SECRET || '';

    if (!this.jwtSecret) {
      this.logger.warn('JWT_SECRET not configured');
    }
  }

  /**
   * Generate JWT token for AI service authentication
   */
  private generateToken(): string {
    const payload = {
      company_id: this.companyId,
      tenant_id: this.companyId,
      user_id: this.userId,
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    };

    return jwt.sign(payload, this.jwtSecret);
  }

  /**
   * Make authenticated request to AI service
   */
  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' = 'POST',
    body?: any
  ): Promise<T> {
    const token = this.generateToken();
    const url = `${this.serviceUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: body ? JSON.stringify(body) : undefined,
        // @ts-expect-error - node-fetch timeout
        timeout: 60000, // 60 second timeout
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`AI service error (${response.status}): ${error}`);
      }

      return await response.json() as T;
    } catch (error) {
      this.logger.error({ error, endpoint }, 'AI service request failed');
      throw error;
    }
  }

  /**
   * Chat with ophthalmic AI assistant
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    this.logger.info({ category: request.category }, 'Chat request');

    try {
      const response = await this.makeRequest<ChatResponse>(
        '/api/v1/chat',
        'POST',
        request
      );

      this.logger.info(
        {
          usedExternalAi: response.usedExternalAi,
          confidence: response.confidence,
          processingTimeMs: response.processingTimeMs,
        },
        'Chat response received'
      );

      return response;
    } catch (error) {
      this.logger.error({ error }, 'Chat request failed');
      throw new Error('Failed to process chat request');
    }
  }

  /**
   * Add knowledge to the knowledge base
   */
  async addKnowledge(request: AddKnowledgeRequest): Promise<{ success: boolean; data: any }> {
    this.logger.info({ category: request.category }, 'Adding knowledge');

    try {
      const response = await this.makeRequest<{ success: boolean; data: any }>(
        '/api/v1/knowledge/add',
        'POST',
        request
      );

      return response;
    } catch (error) {
      this.logger.error({ error }, 'Add knowledge failed');
      throw new Error('Failed to add knowledge');
    }
  }

  /**
   * Get product recommendation based on prescription
   */
  async getProductRecommendation(
    request: ProductRecommendationRequest
  ): Promise<{ success: boolean; data: any }> {
    this.logger.info('Product recommendation request');

    try {
      const response = await this.makeRequest<{ success: boolean; data: any }>(
        '/api/v1/recommendations/product',
        'POST',
        request
      );

      return response;
    } catch (error) {
      this.logger.error({ error }, 'Product recommendation failed');
      throw new Error('Failed to get product recommendation');
    }
  }

  /**
   * Query business analytics
   */
  async businessQuery(
    request: BusinessQueryRequest
  ): Promise<{ success: boolean; data: any }> {
    this.logger.info({ queryType: request.queryType }, 'Business query');

    try {
      const response = await this.makeRequest<{ success: boolean; data: any }>(
        '/api/v1/business/query',
        'POST',
        request
      );

      return response;
    } catch (error) {
      this.logger.error({ error }, 'Business query failed');
      throw new Error('Failed to process business query');
    }
  }

  /**
   * Submit feedback on AI response
   */
  async submitFeedback(request: FeedbackRequest): Promise<{ success: boolean }> {
    this.logger.info('Submitting feedback');

    try {
      const response = await this.makeRequest<{ success: boolean }>(
        '/api/v1/feedback',
        'POST',
        request
      );

      return response;
    } catch (error) {
      this.logger.error({ error }, 'Submit feedback failed');
      throw new Error('Failed to submit feedback');
    }
  }

  /**
   * Get learning progress for company
   */
  async getLearningProgress(): Promise<{
    success: boolean;
    data: {
      totalProgress: number;
      knowledgeBaseEntries: number;
      learnedEntries: number;
      validatedEntries: number;
      learningRate: number;
    };
  }> {
    this.logger.info('Getting learning progress');

    try {
      const response = await this.makeRequest<any>(
        '/api/v1/learning/progress',
        'GET'
      );

      return response;
    } catch (error) {
      this.logger.error({ error }, 'Get learning progress failed');
      throw new Error('Failed to get learning progress');
    }
  }

  /**
   * Get system health
   */
  async getSystemHealth(): Promise<{
    success: boolean;
    data: {
      database: boolean;
      llmServices: {
        openai: boolean;
        anthropic: boolean;
      };
      timestamp: string;
    };
  }> {
    try {
      const response = await this.makeRequest<any>(
        '/api/v1/system/health',
        'GET'
      );

      return response;
    } catch (error) {
      this.logger.error({ error }, 'System health check failed');
      throw new Error('Failed to check system health');
    }
  }

  /**
   * Check if AI service is healthy
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.serviceUrl}/health`, {
        // @ts-expect-error - node-fetch timeout
        timeout: 5000,
      });

      return response.ok;
    } catch (error) {
      this.logger.error({ error }, 'Health check failed');
      return false;
    }
  }
}

/**
 * Create OphthalmicAIService instance
 */
export function createOphthalmicAIService(
  companyId: string,
  userId: string
): OphthalmicAIService {
  return new OphthalmicAIService(companyId, userId);
}
