/**
 * AI Repository
 *
 * Tenant-scoped repository for AI-related data.
 * Manages conversations, messages, knowledge base, and learnings.
 */

import { db } from '../db';
import {
  aiConversations,
  aiMessages,
  aiKnowledgeBase,
  aiLearningData,
  aiFeedback,
} from '@shared/schema';
import type { AIConversation, AIMessage } from '@shared/schema';
import { eq, and, desc, sql, gte, cosineDistance } from 'drizzle-orm';
import { BaseRepository, type QueryOptions } from './BaseRepository';
import { v4 as uuidv4 } from 'uuid';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface ConversationWithMessages {
  conversation: AIConversation;
  messages: AIMessage[];
}

export interface KnowledgeSearchResult {
  id: string;
  content: string;
  source: string;
  similarity: number;
}

export interface LearningEntry {
  interactionType: string;
  inputData: any;
  outputData: any;
  feedback?: number;
}

// ============================================
// AI REPOSITORY CLASS
// ============================================

export class AIRepository extends BaseRepository<typeof aiConversations, AIConversation, AIConversation> {
  constructor(tenantId: string) {
    super(aiConversations, tenantId, 'companyId');
  }

  // ============================================
  // CONVERSATION METHODS
  // ============================================

  /**
   * Get conversation with all messages
   */
  async getConversationWithMessages(
    conversationId: string
  ): Promise<ConversationWithMessages | undefined> {
    const conversation = await this.findById(conversationId);

    if (!conversation) return undefined;

    const messages = await db
      .select()
      .from(aiMessages)
      .where(eq(aiMessages.conversationId, conversationId))
      .orderBy(aiMessages.createdAt);

    return {
      conversation,
      messages,
    };
  }

  /**
   * Add message to conversation
   */
  async addMessage(
    conversationId: string,
    role: string,
    content: string,
    metadata?: Record<string, any>
  ): Promise<AIMessage> {
    // Verify conversation exists and belongs to tenant
    const conversation = await this.findById(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const [message] = await db
      .insert(aiMessages)
      .values({
        id: uuidv4(),
        conversationId,
        role,
        content,
        metadata: metadata ? JSON.stringify(metadata) : null,
        createdAt: new Date(),
      })
      .returning();

    // Update conversation timestamp
    await db
      .update(aiConversations)
      .set({ updatedAt: new Date() })
      .where(eq(aiConversations.id, conversationId));

    return message;
  }

  /**
   * Get user's conversations
   */
  async getUserConversations(
    userId: string,
    options: QueryOptions = {}
  ): Promise<AIConversation[]> {
    return this.findMany(
      eq(aiConversations.userId, userId),
      { ...options, orderByField: 'updatedAt' }
    );
  }

  /**
   * Create new conversation
   */
  async createConversation(
    userId: string,
    title?: string
  ): Promise<AIConversation> {
    return this.create({
      userId,
      title: title || 'New Conversation',
    } as any, { userId });
  }

  /**
   * Delete conversation and its messages
   */
  async deleteConversation(conversationId: string): Promise<boolean> {
    // First delete messages
    await db
      .delete(aiMessages)
      .where(eq(aiMessages.conversationId, conversationId));

    // Then delete conversation
    return this.delete(conversationId);
  }

  // ============================================
  // KNOWLEDGE BASE METHODS
  // ============================================

  /**
   * Search knowledge base using vector similarity
   */
  async searchKnowledge(
    queryEmbedding: number[],
    limit: number = 5
  ): Promise<KnowledgeSearchResult[]> {
    // Note: This requires the embedding column to exist
    // If not using embeddings, fall back to text search
    try {
      const results = await db
        .select({
          id: aiKnowledgeBase.id,
          content: aiKnowledgeBase.content,
          source: aiKnowledgeBase.source,
          similarity: sql<number>`1 - (${cosineDistance(aiKnowledgeBase.embedding, queryEmbedding)})`,
        })
        .from(aiKnowledgeBase)
        .where(eq(aiKnowledgeBase.companyId, this.tenantId))
        .orderBy(sql`${cosineDistance(aiKnowledgeBase.embedding, queryEmbedding)}`)
        .limit(limit);

      return results.map(r => ({
        id: r.id,
        content: r.content || '',
        source: r.source || 'unknown',
        similarity: r.similarity,
      }));
    } catch (error) {
      // Fall back to empty results if vector search fails
      return [];
    }
  }

  /**
   * Add to knowledge base
   */
  async addKnowledge(
    content: string,
    source: string,
    embedding?: number[],
    metadata?: Record<string, any>
  ): Promise<void> {
    await db.insert(aiKnowledgeBase).values({
      id: uuidv4(),
      companyId: this.tenantId,
      content,
      source,
      embedding,
      metadata: metadata ? JSON.stringify(metadata) : null,
      createdAt: new Date(),
    } as any);
  }

  // ============================================
  // LEARNING METHODS
  // ============================================

  /**
   * Record learning from interaction
   */
  async recordLearning(entry: LearningEntry, userId?: string): Promise<void> {
    await db.insert(aiLearningData).values({
      id: uuidv4(),
      companyId: this.tenantId,
      interactionType: entry.interactionType,
      inputData: JSON.stringify(entry.inputData),
      outputData: JSON.stringify(entry.outputData),
      feedback: entry.feedback,
      userId,
      createdAt: new Date(),
    } as any);
  }

  /**
   * Get relevant learnings for context
   * Returns recent successful interactions that match the context
   */
  async getRelevantLearnings(
    context: Record<string, any>,
    limit: number = 10
  ): Promise<any[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const learnings = await db
      .select()
      .from(aiLearningData)
      .where(and(
        eq(aiLearningData.companyId, this.tenantId),
        gte(aiLearningData.createdAt, thirtyDaysAgo),
        sql`${aiLearningData.feedback} >= 3` // Only positive feedback
      ))
      .orderBy(desc(aiLearningData.createdAt))
      .limit(limit);

    return learnings;
  }

  /**
   * Get learning statistics
   */
  async getLearningStats(): Promise<{
    totalInteractions: number;
    positiveRatio: number;
    topInteractionTypes: Array<{ type: string; count: number }>;
  }> {
    const [total] = await db
      .select({ count: sql<number>`count(*)` })
      .from(aiLearningData)
      .where(eq(aiLearningData.companyId, this.tenantId));

    const [positive] = await db
      .select({ count: sql<number>`count(*)` })
      .from(aiLearningData)
      .where(and(
        eq(aiLearningData.companyId, this.tenantId),
        sql`${aiLearningData.feedback} >= 3`
      ));

    const topTypes = await db
      .select({
        type: aiLearningData.interactionType,
        count: sql<number>`count(*)`,
      })
      .from(aiLearningData)
      .where(eq(aiLearningData.companyId, this.tenantId))
      .groupBy(aiLearningData.interactionType)
      .orderBy(sql`count(*) DESC`)
      .limit(5);

    const totalCount = Number(total?.count || 0);
    const positiveCount = Number(positive?.count || 0);

    return {
      totalInteractions: totalCount,
      positiveRatio: totalCount > 0 ? positiveCount / totalCount : 0,
      topInteractionTypes: topTypes.map(t => ({
        type: t.type || 'unknown',
        count: Number(t.count),
      })),
    };
  }

  // ============================================
  // FEEDBACK METHODS
  // ============================================

  /**
   * Record feedback on AI response
   */
  async recordFeedback(
    messageId: string,
    rating: number,
    comment: string | null,
    userId: string
  ): Promise<void> {
    await db.insert(aiFeedback).values({
      id: uuidv4(),
      messageId,
      companyId: this.tenantId,
      userId,
      rating,
      comment,
      createdAt: new Date(),
    } as any);
  }
}

export default AIRepository;
