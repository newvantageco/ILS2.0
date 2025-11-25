/**
 * Vector Storage Layer - pgvector operations
 *
 * Extends the main storage layer with vector similarity search capabilities.
 * This file contains methods for semantic search using pgvector.
 */

import { db } from './db';
import { sql, and, eq, desc, isNotNull } from 'drizzle-orm';
import { aiKnowledgeBase, type AiKnowledgeBase, type InsertAiKnowledgeBase } from '../shared/schema';
import { cosineDistance, cosineSimilarity } from '../shared/schema-pgvector';
import { createLogger } from './utils/logger';
import crypto from 'crypto';

const logger = createLogger('storage-vector');

export interface VectorSearchOptions {
  limit?: number;
  threshold?: number;
  category?: string;
}

export interface VectorSearchResult extends AiKnowledgeBase {
  similarity: number;
  distance: number;
}

/**
 * Search knowledge base using vector similarity
 *
 * @param companyId - Tenant ID for isolation
 * @param queryEmbedding - Query vector (1536 dimensions)
 * @param options - Search options (limit, threshold, category filter)
 * @returns Array of knowledge base entries with similarity scores
 */
export async function searchKnowledgeBaseByEmbedding(
  companyId: string,
  queryEmbedding: number[],
  options: VectorSearchOptions = {}
): Promise<VectorSearchResult[]> {
  const { limit = 5, threshold = 0.7, category } = options;

  try {
    // Validate embedding dimensions
    if (queryEmbedding.length !== 1536) {
      throw new Error(`Invalid embedding dimensions: ${queryEmbedding.length} (expected 1536)`);
    }

    logger.debug(`Vector search for company ${companyId}, limit ${limit}, threshold ${threshold}`);

    // Build WHERE conditions
    const conditions = [
      eq(aiKnowledgeBase.companyId, companyId),
      eq(aiKnowledgeBase.isActive, true),
      isNotNull(aiKnowledgeBase.embedding),
    ];

    if (category) {
      conditions.push(eq(aiKnowledgeBase.category, category));
    }

    // Execute vector similarity search
    // Using cosine distance (<=>): 0 = identical, 2 = opposite
    // Similarity = 1 - distance/2 (normalized to 0-1)
    const results = await db
      .select({
        id: aiKnowledgeBase.id,
        companyId: aiKnowledgeBase.companyId,
        uploadedBy: aiKnowledgeBase.uploadedBy,
        filename: aiKnowledgeBase.filename,
        fileType: aiKnowledgeBase.fileType,
        fileSize: aiKnowledgeBase.fileSize,
        fileUrl: aiKnowledgeBase.fileUrl,
        content: aiKnowledgeBase.content,
        summary: aiKnowledgeBase.summary,
        tags: aiKnowledgeBase.tags,
        embeddings: aiKnowledgeBase.embeddings,
        embedding: aiKnowledgeBase.embedding,
        category: aiKnowledgeBase.category,
        isActive: aiKnowledgeBase.isActive,
        processingStatus: aiKnowledgeBase.processingStatus,
        createdAt: aiKnowledgeBase.createdAt,
        updatedAt: aiKnowledgeBase.updatedAt,
        distance: sql<number>`${aiKnowledgeBase.embedding} <=> ${JSON.stringify(queryEmbedding)}::vector`,
        similarity: sql<number>`1 - (${aiKnowledgeBase.embedding} <=> ${JSON.stringify(queryEmbedding)}::vector)`,
      })
      .from(aiKnowledgeBase)
      .where(and(...conditions))
      .having(sql`1 - (${aiKnowledgeBase.embedding} <=> ${JSON.stringify(queryEmbedding)}::vector) > ${threshold}`)
      .orderBy(sql`${aiKnowledgeBase.embedding} <=> ${JSON.stringify(queryEmbedding)}::vector`)
      .limit(limit);

    logger.info(`Found ${results.length} results with similarity > ${threshold}`);

    return results as VectorSearchResult[];
  } catch (error: any) {
    logger.error('Vector search failed:', error);
    throw new Error(`Vector similarity search failed: ${error.message}`);
  }
}

/**
 * Store knowledge base entry with vector embedding
 *
 * @param data - Knowledge base entry data with embedding
 * @returns Created knowledge base entry
 */
export async function createKnowledgeBaseWithEmbedding(
  data: InsertAiKnowledgeBase & { embedding: number[] }
): Promise<AiKnowledgeBase> {
  try {
    // Validate embedding
    if (!data.embedding || data.embedding.length !== 1536) {
      throw new Error('Invalid embedding: must be 1536 dimensions');
    }

    // Generate ID if not provided
    const id = data.id || crypto.randomUUID();

    const [entry] = await db
      .insert(aiKnowledgeBase)
      .values({
        ...data,
        id,
        isActive: data.isActive !== undefined ? data.isActive : true,
        processingStatus: data.processingStatus || 'completed',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    logger.info(`Created knowledge base entry ${entry.id} for company ${data.companyId}`);

    return entry;
  } catch (error: any) {
    logger.error('Failed to create knowledge base entry:', error);
    throw new Error(`Knowledge base creation failed: ${error.message}`);
  }
}

/**
 * Update embedding for existing knowledge base entry
 *
 * @param id - Entry ID
 * @param companyId - Company ID for tenant isolation
 * @param embedding - New vector embedding
 * @returns Updated entry
 */
export async function updateKnowledgeBaseEmbedding(
  id: string,
  companyId: string,
  embedding: number[]
): Promise<AiKnowledgeBase | undefined> {
  try {
    // Validate embedding
    if (embedding.length !== 1536) {
      throw new Error(`Invalid embedding dimensions: ${embedding.length} (expected 1536)`);
    }

    const [updated] = await db
      .update(aiKnowledgeBase)
      .set({
        embedding,
        processingStatus: 'completed',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(aiKnowledgeBase.id, id),
          eq(aiKnowledgeBase.companyId, companyId) // Tenant isolation
        )
      )
      .returning();

    if (updated) {
      logger.info(`Updated embedding for entry ${id}`);
    } else {
      logger.warn(`Entry ${id} not found or access denied for company ${companyId}`);
    }

    return updated;
  } catch (error: any) {
    logger.error('Failed to update embedding:', error);
    throw new Error(`Embedding update failed: ${error.message}`);
  }
}

/**
 * Get knowledge base entries without embeddings (need migration)
 *
 * @param companyId - Company ID for tenant isolation
 * @param limit - Max number of entries to return
 * @returns Entries that need embedding generation
 */
export async function getEntriesWithoutEmbedding(
  companyId: string,
  limit: number = 100
): Promise<AiKnowledgeBase[]> {
  try {
    const results = await db
      .select()
      .from(aiKnowledgeBase)
      .where(
        and(
          eq(aiKnowledgeBase.companyId, companyId),
          eq(aiKnowledgeBase.isActive, true),
          sql`${aiKnowledgeBase.embedding} IS NULL`,
          isNotNull(aiKnowledgeBase.content) // Must have content to embed
        )
      )
      .orderBy(desc(aiKnowledgeBase.createdAt))
      .limit(limit);

    logger.info(`Found ${results.length} entries without embeddings for company ${companyId}`);

    return results;
  } catch (error: any) {
    logger.error('Failed to query entries without embeddings:', error);
    throw new Error(`Query failed: ${error.message}`);
  }
}

/**
 * Get embedding statistics for a company
 *
 * @param companyId - Company ID
 * @returns Statistics about embeddings
 */
export async function getEmbeddingStats(companyId: string) {
  try {
    const [stats] = await db
      .select({
        total: sql<number>`COUNT(*)`,
        withEmbedding: sql<number>`COUNT(${aiKnowledgeBase.embedding})`,
        withoutEmbedding: sql<number>`COUNT(*) FILTER (WHERE ${aiKnowledgeBase.embedding} IS NULL)`,
        active: sql<number>`COUNT(*) FILTER (WHERE ${aiKnowledgeBase.isActive} = true)`,
      })
      .from(aiKnowledgeBase)
      .where(eq(aiKnowledgeBase.companyId, companyId));

    logger.debug(`Embedding stats for company ${companyId}:`, stats);

    return {
      total: Number(stats.total),
      withEmbedding: Number(stats.withEmbedding),
      withoutEmbedding: Number(stats.withoutEmbedding),
      active: Number(stats.active),
      migrationProgress: stats.total > 0
        ? ((Number(stats.withEmbedding) / Number(stats.total)) * 100).toFixed(1) + '%'
        : '0%',
    };
  } catch (error: any) {
    logger.error('Failed to get embedding stats:', error);
    throw new Error(`Stats query failed: ${error.message}`);
  }
}

/**
 * Find similar documents to an existing document
 *
 * @param documentId - Source document ID
 * @param companyId - Company ID for tenant isolation
 * @param options - Search options
 * @returns Similar documents
 */
export async function findSimilarDocuments(
  documentId: string,
  companyId: string,
  options: VectorSearchOptions = {}
): Promise<VectorSearchResult[]> {
  try {
    // Get the source document's embedding
    const [sourceDoc] = await db
      .select({ embedding: aiKnowledgeBase.embedding })
      .from(aiKnowledgeBase)
      .where(
        and(
          eq(aiKnowledgeBase.id, documentId),
          eq(aiKnowledgeBase.companyId, companyId)
        )
      );

    if (!sourceDoc || !sourceDoc.embedding) {
      throw new Error('Source document not found or has no embedding');
    }

    // Search for similar documents (exclude the source document)
    const results = await searchKnowledgeBaseByEmbedding(
      companyId,
      sourceDoc.embedding as number[],
      options
    );

    return results.filter(doc => doc.id !== documentId);
  } catch (error: any) {
    logger.error('Failed to find similar documents:', error);
    throw new Error(`Similar document search failed: ${error.message}`);
  }
}
