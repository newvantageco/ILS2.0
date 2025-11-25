/**
 * MasterAIService pgvector Integration Patch
 *
 * This file shows the changes needed to update MasterAIService to use pgvector.
 * Apply these changes to server/services/MasterAIService.ts
 *
 * Key changes:
 * 1. Import embeddingService and vector storage methods
 * 2. Replace Jaccard similarity with vector similarity search
 * 3. Update handleKnowledgeQuery to use pgvector
 * 4. Remove old calculateSimilarity method
 */

// ========================================
// ADD IMPORTS (at top of file)
// ========================================

import { embeddingService } from './EmbeddingService';
import {
  searchKnowledgeBaseByEmbedding,
  getEmbeddingStats,
} from '../storage-vector';

// ========================================
// REPLACE handleKnowledgeQuery METHOD
// ========================================

/**
 * Handle knowledge queries using pgvector similarity search (NEW!)
 *
 * Old implementation used Python RAG or Jaccard similarity.
 * New implementation uses pgvector for fast semantic search.
 */
private async handleKnowledgeQuery(
  query: MasterAIQuery,
  company: any,
  startTime: number,
  learningProgress: number
): Promise<MasterAIResponse> {
  try {
    this.logger.info('Processing knowledge query with pgvector');

    // 1. Generate query embedding
    const queryEmbedding = await embeddingService.generateEmbedding(query.message);

    // 2. Search knowledge base using vector similarity
    const knowledgeSources = await searchKnowledgeBaseByEmbedding(
      query.companyId,
      queryEmbedding,
      {
        limit: 5,
        threshold: 0.7,  // 70% similarity threshold
      }
    );

    this.logger.debug(`Found ${knowledgeSources.length} relevant documents`);

    // 3. Build context from retrieved documents
    let context = '';
    if (knowledgeSources.length > 0) {
      context = knowledgeSources
        .map((doc, idx) =>
          `[Document ${idx + 1}: ${doc.filename}]\n${doc.content}\n(Similarity: ${(doc.similarity * 100).toFixed(1)}%)`
        )
        .join('\n\n---\n\n');
    }

    // 4. Generate response with context using External AI
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: company.aiSettings?.systemPrompt ||
          'You are an AI assistant for an optical practice. Use the provided knowledge base to answer questions accurately.'
      }
    ];

    if (context) {
      messages.push({
        role: 'system',
        content: `Here is relevant information from the company's knowledge base:\n\n${context}\n\nUse this information to answer the question.`
      });
    }

    messages.push({
      role: 'user',
      content: query.message
    });

    const aiResponse = await this.externalAI.chat(messages, {
      preferredProvider: 'openai',
      model: 'gpt-4',
    });

    return {
      answer: aiResponse.content,
      conversationId: query.conversationId || crypto.randomUUID(),
      sources: knowledgeSources.map(doc => ({
        type: 'company_document' as const,
        reference: doc.filename,
        confidence: doc.similarity,
      })),
      toolsUsed: ['vector_search', 'knowledge_base', 'gpt-4'],
      confidence: knowledgeSources.length > 0 ? 0.85 : 0.6,
      isRelevant: true,
      metadata: {
        responseTime: Date.now() - startTime,
        queryType: 'knowledge',
        learningProgress,
        usedExternalAI: true,
        tokensUsed: aiResponse.usage?.total_tokens,
      }
    };
  } catch (error) {
    this.logger.error('Knowledge query with pgvector failed:', error);

    // Fallback to external AI without context
    const fallbackResponse = await this.externalAI.chat([
      {
        role: 'user',
        content: query.message
      }
    ]);

    return {
      answer: fallbackResponse.content,
      conversationId: query.conversationId || crypto.randomUUID(),
      sources: [{ type: 'external_ai' as const }],
      toolsUsed: ['gpt-4'],
      confidence: 0.6,
      isRelevant: true,
      metadata: {
        responseTime: Date.now() - startTime,
        queryType: 'knowledge',
        learningProgress,
        usedExternalAI: true,
      }
    };
  }
}

// ========================================
// ADD NEW METHOD: Get Company Embedding Stats
// ========================================

/**
 * Get embedding statistics for a company
 *
 * Useful for monitoring migration progress and knowledge base health.
 */
async getCompanyEmbeddingStats(companyId: string) {
  try {
    const stats = await getEmbeddingStats(companyId);
    return stats;
  } catch (error) {
    this.logger.error('Failed to get embedding stats:', error);
    return null;
  }
}

// ========================================
// ADD NEW METHOD: Index New Document
// ========================================

/**
 * Index a new document in the knowledge base with embedding
 */
async indexDocument(
  companyId: string,
  userId: string,
  filename: string,
  content: string,
  category?: string
): Promise<string> {
  try {
    // Generate embedding for the content
    const embedding = await embeddingService.generateEmbedding(content);

    // Store in knowledge base
    const entry = await this.storage.createKnowledgeBaseWithEmbedding({
      companyId,
      uploadedBy: userId,
      filename,
      fileType: filename.split('.').pop() || 'txt',
      content,
      embedding,
      category,
      isActive: true,
      processingStatus: 'completed',
    });

    this.logger.info(`Indexed document ${entry.id} for company ${companyId}`);
    return entry.id;
  } catch (error) {
    this.logger.error('Failed to index document:', error);
    throw new Error('Document indexing failed');
  }
}

// ========================================
// REMOVE OLD METHOD
// ========================================

// DELETE THIS METHOD (no longer needed with pgvector):
/*
private calculateSimilarity(text1: string, text2: string): number {
  // Old Jaccard similarity implementation
  // This is replaced by vector cosine similarity
}
*/

// DELETE THIS METHOD (replaced by pgvector search):
/*
private async searchLearnedKnowledge(query: string, companyId: string) {
  // Old implementation using Jaccard similarity
  // Now uses vector similarity in pgvector
}
*/

// ========================================
// EXAMPLE USAGE IN ROUTES
// ========================================

/*
// server/routes/master-ai.ts

// New endpoint to check embedding migration status
app.get("/api/master-ai/embedding-stats", isAuthenticated, async (req: any, res: Response) => {
  try {
    const companyId = req.user.claims.companyId || req.user.claims.sub;
    const stats = await masterAIService.getCompanyEmbeddingStats(companyId);

    res.json({
      success: true,
      stats,
      message: stats.migrationProgress === '100%'
        ? 'All documents have embeddings'
        : `Migration in progress: ${stats.migrationProgress}`
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// New endpoint to index documents
app.post("/api/master-ai/index-document", isAuthenticated, async (req: any, res: Response) => {
  try {
    const { filename, content, category } = req.body;
    const companyId = req.user.claims.companyId || req.user.claims.sub;
    const userId = req.user.id || req.user.claims.sub;

    if (!filename || !content) {
      return res.status(400).json({ error: 'filename and content are required' });
    }

    const documentId = await masterAIService.indexDocument(
      companyId,
      userId,
      filename,
      content,
      category
    );

    res.json({
      success: true,
      documentId,
      message: 'Document indexed successfully'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
*/
