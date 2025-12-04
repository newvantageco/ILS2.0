/**
 * Unified AI Service
 *
 * Consolidates AI capabilities from:
 * - MasterAIService (chat, learning, documents)
 * - PlatformAIService (insights, alerts, quick actions)
 * - OphthalamicAIService (ophthalmic-specific queries)
 *
 * Architecture:
 * - Tenant-scoped by design (companyId in constructor)
 * - Uses @anthropic-ai/sdk for all AI operations
 * - Tool execution via ToolRegistry
 * - Conversation history management
 * - Learning/feedback recording
 *
 * SECURITY:
 * - All operations scoped to tenant
 * - PHI access audit logged
 * - Rate limiting enforced at route level
 */

import Anthropic from '@anthropic-ai/sdk';
import { db } from '../../db';
// Import tables not yet extracted to modular domains
import {
  aiFeedback
} from '@shared/schema';
// Import tables not yet extracted to modular domains
import { eq, and, desc, sql } from 'drizzle-orm';
import { createLogger } from '../../utils/logger';
import { ToolRegistry, type Tool } from './ToolRegistry';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger('UnifiedAIService');

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface AIQuery {
  message: string;
  conversationId?: string;
  context?: Record<string, any>;
}

export interface AIResponse {
  answer: string;
  conversationId: string;
  confidence: number;
  sources: AISource[];
  toolsUsed: string[];
  suggestedActions?: SuggestedAction[];
  followUpQuestions?: string[];
  metadata: AIResponseMetadata;
}

export interface AISource {
  type: 'knowledge' | 'database' | 'learned' | 'external';
  reference?: string;
  toolName?: string;
  confidence?: number;
}

export interface SuggestedAction {
  id: string;
  label: string;
  type: 'navigate' | 'api' | 'workflow';
  command?: string;
  params?: Record<string, unknown>;
}

export interface AIResponseMetadata {
  tokensUsed: number;
  responseTimeMs: number;
  model: string;
  queryType: 'chat' | 'briefing' | 'prediction' | 'action';
}

export interface DailyBriefing {
  date: string;
  summary: string;
  keyMetrics: BriefingMetric[];
  alerts: BriefingAlert[];
  recommendations: string[];
  generatedAt: Date;
}

export interface BriefingMetric {
  name: string;
  value: string | number;
  trend: 'up' | 'down' | 'stable';
  change?: string;
}

export interface BriefingAlert {
  type: 'stockout' | 'demand' | 'staffing' | 'quality' | 'other';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionRequired: boolean;
}

export interface Prediction {
  type: 'demand' | 'stockout' | 'staffing';
  period: string;
  predictions: PredictionItem[];
  confidence: number;
  generatedAt: Date;
}

export interface PredictionItem {
  date: string;
  value: number;
  confidence: number;
  factors?: string[];
}

export interface AutonomousAction {
  type: 'create_purchase_order' | 'send_reminder' | 'update_inventory' | 'generate_report';
  params: Record<string, any>;
  requiresApproval?: boolean;
}

export interface ActionResult {
  success: boolean;
  actionId: string;
  type: string;
  status: 'completed' | 'pending_approval' | 'failed';
  result?: any;
  error?: string;
}

// ============================================
// MAIN SERVICE CLASS
// ============================================

export class UnifiedAIService {
  private anthropic: Anthropic;
  private toolRegistry: ToolRegistry;
  private companyId: string;
  private model: string = 'claude-sonnet-4-20250514';

  constructor(companyId: string) {
    this.companyId = companyId;

    // Initialize Anthropic client
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      logger.warn('ANTHROPIC_API_KEY not set - AI features will be limited');
    }
    this.anthropic = new Anthropic({ apiKey: apiKey || 'dummy' });

    // Initialize tool registry with company context
    this.toolRegistry = new ToolRegistry(companyId);
  }

  // ============================================
  // MAIN CHAT INTERFACE
  // ============================================

  /**
   * Process a user query through the AI system
   */
  async processQuery(
    query: AIQuery,
    userId: string
  ): Promise<AIResponse> {
    const startTime = Date.now();
    const toolsUsed: string[] = [];
    const sources: AISource[] = [];

    try {
      // Get or create conversation
      const conversationId = query.conversationId || await this.createConversation(userId);

      // Load conversation history
      const history = await this.getConversationHistory(conversationId);

      // Build system prompt with company context
      const systemPrompt = await this.buildSystemPrompt(query.context);

      // Get available tools
      const tools = this.toolRegistry.getToolsForAnthropic();

      // Build messages array
      const messages: Anthropic.MessageParam[] = [
        ...history.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
        { role: 'user', content: query.message },
      ];

      // Call Anthropic API with tools
      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 4096,
        system: systemPrompt,
        messages,
        tools,
      });

      // Process tool calls if any
      let finalContent = '';
      for (const block of response.content) {
        if (block.type === 'text') {
          finalContent += block.text;
        } else if (block.type === 'tool_use') {
          const toolResult = await this.toolRegistry.executeTool(
            block.name,
            block.input as Record<string, any>,
            userId
          );
          toolsUsed.push(block.name);
          sources.push({
            type: 'database',
            toolName: block.name,
            confidence: 0.9,
          });

          // Continue conversation with tool result
          const continuedResponse = await this.anthropic.messages.create({
            model: this.model,
            max_tokens: 4096,
            system: systemPrompt,
            messages: [
              ...messages,
              { role: 'assistant', content: response.content },
              {
                role: 'user',
                content: [{
                  type: 'tool_result',
                  tool_use_id: block.id,
                  content: JSON.stringify(toolResult),
                }],
              },
            ],
          });

          for (const contBlock of continuedResponse.content) {
            if (contBlock.type === 'text') {
              finalContent = contBlock.text;
            }
          }
        }
      }

      // Save messages to conversation
      await this.saveMessage(conversationId, 'user', query.message, userId);
      await this.saveMessage(conversationId, 'assistant', finalContent, userId, {
        toolsUsed,
        tokensUsed: response.usage?.input_tokens + response.usage?.output_tokens,
      });

      // Record learning data
      await this.recordLearning(query.message, finalContent, userId);

      return {
        answer: finalContent,
        conversationId,
        confidence: 0.85,
        sources,
        toolsUsed,
        suggestedActions: this.extractSuggestedActions(finalContent),
        followUpQuestions: this.extractFollowUpQuestions(finalContent),
        metadata: {
          tokensUsed: response.usage?.input_tokens + response.usage?.output_tokens || 0,
          responseTimeMs: Date.now() - startTime,
          model: this.model,
          queryType: 'chat',
        },
      };
    } catch (error) {
      logger.error({ error, companyId: this.companyId }, 'AI query failed');
      throw error;
    }
  }

  // ============================================
  // DAILY BRIEFING
  // ============================================

  /**
   * Generate a daily briefing with insights and recommendations
   */
  async generateDailyBriefing(userId: string): Promise<DailyBriefing> {
    const startTime = Date.now();

    try {
      // Gather company data for briefing
      const orderStats = await this.toolRegistry.executeTool('get_order_stats', {}, userId);
      const inventoryAlerts = await this.toolRegistry.executeTool('get_inventory_alerts', {}, userId);
      const appointments = await this.toolRegistry.executeTool('get_appointments', { days: 1 }, userId);

      // Build briefing prompt
      const prompt = `Generate a daily briefing for an optical practice. Here's the current data:

Order Statistics: ${JSON.stringify(orderStats)}
Inventory Alerts: ${JSON.stringify(inventoryAlerts)}
Today's Appointments: ${JSON.stringify(appointments)}

Provide:
1. A brief summary (2-3 sentences)
2. Key metrics with trends
3. Any alerts that need attention
4. 3-5 actionable recommendations

Format as JSON with keys: summary, keyMetrics, alerts, recommendations`;

      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      });

      const textContent = response.content.find(b => b.type === 'text');
      const briefingData = this.parseJSONResponse(textContent?.text || '{}');

      return {
        date: new Date().toISOString().split('T')[0],
        summary: briefingData.summary || 'No summary available',
        keyMetrics: briefingData.keyMetrics || [],
        alerts: briefingData.alerts || [],
        recommendations: briefingData.recommendations || [],
        generatedAt: new Date(),
      };
    } catch (error) {
      logger.error({ error, companyId: this.companyId }, 'Failed to generate briefing');
      throw error;
    }
  }

  // ============================================
  // PREDICTIONS
  // ============================================

  /**
   * Get predictions for demand, stockouts, or staffing
   */
  async getPredictions(type: 'demand' | 'stockout' | 'staffing'): Promise<Prediction> {
    try {
      let data: any;
      let prompt: string;

      switch (type) {
        case 'demand':
          data = await this.toolRegistry.executeTool('get_historical_orders', { days: 90 }, 'system');
          prompt = `Analyze order history and predict demand for the next 14 days: ${JSON.stringify(data)}`;
          break;
        case 'stockout':
          data = await this.toolRegistry.executeTool('get_inventory_levels', {}, 'system');
          prompt = `Analyze inventory levels and predict potential stockouts: ${JSON.stringify(data)}`;
          break;
        case 'staffing':
          data = await this.toolRegistry.executeTool('get_appointments', { days: 14 }, 'system');
          prompt = `Analyze appointment schedule and predict staffing needs: ${JSON.stringify(data)}`;
          break;
      }

      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: `${prompt}\n\nProvide predictions as JSON with: period, predictions (array of {date, value, confidence}), overallConfidence`,
        }],
      });

      const textContent = response.content.find(b => b.type === 'text');
      const predictionData = this.parseJSONResponse(textContent?.text || '{}');

      return {
        type,
        period: predictionData.period || '14 days',
        predictions: predictionData.predictions || [],
        confidence: predictionData.overallConfidence || 0.7,
        generatedAt: new Date(),
      };
    } catch (error) {
      logger.error({ error, type, companyId: this.companyId }, 'Failed to get predictions');
      throw error;
    }
  }

  // ============================================
  // AUTONOMOUS ACTIONS
  // ============================================

  /**
   * Execute an autonomous action (with approval check)
   */
  async executeAutonomousAction(
    action: AutonomousAction,
    userId: string
  ): Promise<ActionResult> {
    const actionId = uuidv4();

    try {
      // Check if action requires approval
      const needsApproval = await this.toolRegistry.checkApprovalRequired(action.type, action.params);

      if (needsApproval) {
        // Store pending action for approval
        await this.storePendingAction(actionId, action, userId);
        return {
          success: true,
          actionId,
          type: action.type,
          status: 'pending_approval',
        };
      }

      // Execute the action
      const result = await this.toolRegistry.executeTool(
        action.type,
        action.params,
        userId
      );

      // Log the action
      logger.info({
        actionId,
        type: action.type,
        companyId: this.companyId,
        userId,
      }, 'Autonomous action executed');

      return {
        success: true,
        actionId,
        type: action.type,
        status: 'completed',
        result,
      };
    } catch (error: any) {
      logger.error({ error, action, companyId: this.companyId }, 'Autonomous action failed');
      return {
        success: false,
        actionId,
        type: action.type,
        status: 'failed',
        error: error.message,
      };
    }
  }

  // ============================================
  // SUGGESTED ACTIONS
  // ============================================

  /**
   * Get context-aware suggested actions
   */
  async getSuggestedActions(context: Record<string, any>): Promise<SuggestedAction[]> {
    try {
      const prompt = `Given this context from an optical practice management system:
${JSON.stringify(context)}

Suggest 3-5 relevant quick actions the user might want to take.
Format as JSON array with: id, label, type (navigate/api/workflow), command, params`;

      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      });

      const textContent = response.content.find(b => b.type === 'text');
      return this.parseJSONResponse(textContent?.text || '[]') || [];
    } catch (error) {
      logger.error({ error, companyId: this.companyId }, 'Failed to get suggested actions');
      return [];
    }
  }

  // ============================================
  // CONVERSATION MANAGEMENT
  // ============================================

  private async createConversation(userId: string): Promise<string> {
    const id = uuidv4();
    await db.insert(aiConversations).values({
      id,
      companyId: this.companyId,
      userId,
      title: 'New Conversation',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return id;
  }

  private async getConversationHistory(conversationId: string): Promise<Array<{ role: string; content: string }>> {
    const messages = await db
      .select({
        role: aiMessages.role,
        content: aiMessages.content,
      })
      .from(aiMessages)
      .where(eq(aiMessages.conversationId, conversationId))
      .orderBy(aiMessages.createdAt)
      .limit(20); // Keep last 20 messages for context

    return messages;
  }

  private async saveMessage(
    conversationId: string,
    role: string,
    content: string,
    userId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await db.insert(aiMessages).values({
      id: uuidv4(),
      conversationId,
      role,
      content,
      metadata: metadata ? JSON.stringify(metadata) : null,
      createdAt: new Date(),
    });

    // Update conversation timestamp
    await db
      .update(aiConversations)
      .set({ updatedAt: new Date() })
      .where(eq(aiConversations.id, conversationId));
  }

  // ============================================
  // LEARNING & FEEDBACK
  // ============================================

  private async recordLearning(query: string, response: string, userId: string): Promise<void> {
    try {
      await db.insert(aiLearningData).values({
        id: uuidv4(),
        companyId: this.companyId,
        interactionType: 'chat',
        inputData: JSON.stringify({ query }),
        outputData: JSON.stringify({ response }),
        userId,
        createdAt: new Date(),
      });
    } catch (error) {
      logger.error({ error }, 'Failed to record learning data');
    }
  }

  async recordFeedback(
    messageId: string,
    rating: number,
    comment: string | null,
    userId: string
  ): Promise<void> {
    await db.insert(aiFeedback).values({
      id: uuidv4(),
      messageId,
      companyId: this.companyId,
      userId,
      rating,
      comment,
      createdAt: new Date(),
    });
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private async buildSystemPrompt(context?: Record<string, any>): Promise<string> {
    return `You are an AI assistant for an optical practice management system. You help with:
- Order management and tracking
- Patient information (be mindful of PHI)
- Inventory and stock levels
- Appointment scheduling
- Clinical decision support for optometry

Company ID: ${this.companyId}
${context ? `Additional Context: ${JSON.stringify(context)}` : ''}

Guidelines:
- Be concise and professional
- When accessing patient data, only retrieve what's necessary
- Suggest relevant follow-up actions
- If you're unsure, say so rather than guessing
- Focus on optometry and optical practice topics`;
  }

  private parseJSONResponse(text: string): any {
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1] || jsonMatch[0]);
      }
      return {};
    } catch {
      return {};
    }
  }

  private extractSuggestedActions(response: string): SuggestedAction[] {
    // Extract any suggested actions from the response
    // This is a simple implementation - could be enhanced with NLP
    return [];
  }

  private extractFollowUpQuestions(response: string): string[] {
    // Extract follow-up questions from response
    return [];
  }

  private async storePendingAction(
    actionId: string,
    action: AutonomousAction,
    userId: string
  ): Promise<void> {
    // Store in a pending actions table for approval workflow
    logger.info({ actionId, action, userId }, 'Stored pending action for approval');
  }
}

// ============================================
// FACTORY FUNCTION
// ============================================

/**
 * Create a tenant-scoped AI service instance
 */
export function createUnifiedAIService(companyId: string): UnifiedAIService {
  return new UnifiedAIService(companyId);
}

export default UnifiedAIService;
