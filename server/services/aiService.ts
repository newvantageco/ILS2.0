/**
 * AI Service Client
 * 
 * Handles communication with the AI service (FastAPI) and implements
 * tenant-specific business logic.
 */

import fetch from 'node-fetch';
import { TenantContext } from '../middleware/tenantContext';
import logger from '../utils/logger';


export class AIService {
  private aiServiceUrl: string;
  private tenantContext: TenantContext;
  
  constructor(tenantContext: TenantContext) {
    this.aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8080';
    this.tenantContext = tenantContext;
  }
  
  /**
   * Generate JWT token for AI service authentication
   */
  private generateAIServiceToken(): string {
    const jwt = require('jsonwebtoken');
    
    return jwt.sign(
      {
        tenant_id: this.tenantContext.tenantId,
        tenant_code: this.tenantContext.tenantCode,
        subscription_tier: this.tenantContext.subscriptionTier,
      },
      process.env.JWT_SECRET,
      { expiresIn: '5m' } // Short-lived token for AI service
    );
  }
  
  /**
   * Query ophthalmic knowledge base
   */
  async queryOphthalmicKnowledge(
    question: string,
    context?: string
  ): Promise<any> {
    try {
      const response = await fetch(
        `${this.aiServiceUrl}/api/v1/ophthalmic-knowledge`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.generateAIServiceToken()}`,
          },
          body: JSON.stringify({ question, context }),
          timeout: 30000, // 30 second timeout
        }
      );
      
      if (!response.ok) {
        throw new Error(`AI service returned ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        success: true,
        answer: data.answer,
        model: data.model,
        timestamp: data.timestamp,
        queryType: 'knowledge',
      };
      
    } catch (error) {
      logger.error('[AIService] Ophthalmic knowledge query failed:', error);
      return {
        success: false,
        error: 'Failed to retrieve ophthalmic knowledge',
        message: 'Please try again or contact support if the issue persists.',
      };
    }
  }
  
  /**
   * Query sales data using RAG
   */
  async querySales(question: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.aiServiceUrl}/api/v1/query`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.generateAIServiceToken()}`,
          },
          body: JSON.stringify({
            question,
            query_type: 'sales',
          }),
          timeout: 45000, // 45 second timeout for database queries
        }
      );
      
      if (!response.ok) {
        throw new Error(`AI service returned ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        success: data.success,
        answer: data.answer,
        metadata: data.metadata,
        queryType: 'sales',
      };
      
    } catch (error) {
      logger.error('[AIService] Sales query failed:', error);
      return {
        success: false,
        error: 'Failed to query sales data',
        message: 'Please try again or contact support if the issue persists.',
      };
    }
  }
  
  /**
   * Query inventory data using RAG
   */
  async queryInventory(question: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.aiServiceUrl}/api/v1/query`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.generateAIServiceToken()}`,
          },
          body: JSON.stringify({
            question,
            query_type: 'inventory',
          }),
          timeout: 45000,
        }
      );
      
      if (!response.ok) {
        throw new Error(`AI service returned ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        success: data.success,
        answer: data.answer,
        metadata: data.metadata,
        queryType: 'inventory',
      };
      
    } catch (error) {
      logger.error('[AIService] Inventory query failed:', error);
      return {
        success: false,
        error: 'Failed to query inventory data',
        message: 'Please try again or contact support if the issue persists.',
      };
    }
  }
  
  /**
   * Query patient analytics (anonymized data only)
   */
  async queryPatientAnalytics(question: string): Promise<any> {
    // Check if tenant has access to patient analytics
    if (this.tenantContext.subscriptionTier !== 'enterprise') {
      return {
        success: false,
        error: 'Upgrade required',
        message: 'Patient analytics is only available on the Enterprise plan.',
        upgradeUrl: '/settings/subscription',
      };
    }
    
    try {
      const response = await fetch(
        `${this.aiServiceUrl}/api/v1/query`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.generateAIServiceToken()}`,
          },
          body: JSON.stringify({
            question,
            query_type: 'patient_analytics',
          }),
          timeout: 45000,
        }
      );
      
      if (!response.ok) {
        throw new Error(`AI service returned ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        success: data.success,
        answer: data.answer,
        metadata: data.metadata,
        queryType: 'patient_analytics',
        notice: 'This data is anonymized and HIPAA-compliant',
      };
      
    } catch (error) {
      logger.error('[AIService] Patient analytics query failed:', error);
      return {
        success: false,
        error: 'Failed to query patient analytics',
        message: 'Please try again or contact support if the issue persists.',
      };
    }
  }
  
  /**
   * Get product recommendations
   */
  async getProductRecommendation(
    productType: string,
    patientPrescription?: any
  ): Promise<any> {
    try {
      // Build context for recommendation
      let context = `Product type: ${productType}.`;
      
      if (patientPrescription) {
        context += ` Patient prescription: OD sphere ${patientPrescription.od_sphere}, `;
        context += `cylinder ${patientPrescription.od_cylinder}; `;
        context += `OS sphere ${patientPrescription.os_sphere}, `;
        context += `cylinder ${patientPrescription.os_cylinder}.`;
      }
      
      const question = `What lens recommendations would you make for this patient and why?`;
      
      const result = await this.queryOphthalmicKnowledge(question, context);
      
      if (result.success) {
        return {
          success: true,
          recommendation: result.answer,
          productType,
        };
      }
      
      return result;
      
    } catch (error) {
      logger.error('[AIService] Product recommendation failed:', error);
      return {
        success: false,
        error: 'Failed to generate recommendation',
      };
    }
  }
  
  /**
   * Health check for AI service
   */
  async checkHealth(): Promise<any> {
    try {
      const response = await fetch(
        `${this.aiServiceUrl}/`,
        {
          method: 'GET',
          timeout: 5000,
        }
      );
      
      if (!response.ok) {
        return {
          healthy: false,
          status: response.status,
          message: 'AI service returned non-OK status',
        };
      }
      
      const data = await response.json();
      
      return {
        healthy: true,
        status: 200,
        service: data.service,
        version: data.version,
      };
      
    } catch (error) {
      logger.error('[AIService] Health check failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        healthy: false,
        error: errorMessage,
        message: 'AI service unreachable',
      };
    }
  }
}
