/**
 * Python RAG Service Integration
 *
 * Provides integration between the Node.js backend and the Python RAG microservice.
 * Handles embedding generation and semantic search using the Python service.
 */

import { createLogger } from '../utils/logger.js';

const logger = createLogger('PythonRAGService');

// Configuration
const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || 'http://localhost:8001';
const REQUEST_TIMEOUT = 30000; // 30 seconds

/**
 * Response types from Python RAG service
 */
interface EmbeddingResponse {
  embedding: number[];
  model: string;
  dimensions: number;
}

interface BatchEmbeddingResponse {
  embeddings: number[][];
  model: string;
  dimensions: number;
  count: number;
}

interface RAGSearchResult {
  id: string;
  content: string;
  filename: string;
  category?: string;
  similarity: number;
}

interface RAGSearchResponse {
  query: string;
  results: RAGSearchResult[];
  total_found: number;
}

interface IndexDocumentResponse {
  document_id: string;
  status: string;
}

/**
 * Python RAG Service Client
 *
 * Provides methods to interact with the Python RAG microservice for:
 * - Embedding generation
 * - Semantic search (RAG)
 * - Document indexing
 */
export class PythonRAGService {
  private serviceUrl: string;
  private timeout: number;

  constructor() {
    this.serviceUrl = RAG_SERVICE_URL;
    this.timeout = REQUEST_TIMEOUT;

    logger.info(`Initialized Python RAG Service client: ${this.serviceUrl}`);
  }

  /**
   * Check if Python RAG service is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.serviceUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5 second timeout for health check
      });

      if (response.ok) {
        const data = await response.json();
        logger.info(`Python RAG service health: ${data.status}`);
        return data.status === 'healthy';
      }

      return false;
    } catch (error) {
      logger.error('Python RAG service health check failed:', error);
      return false;
    }
  }

  /**
   * Generate embedding for a single text
   *
   * @param text - Input text to generate embedding for
   * @param model - Embedding model to use (default: all-MiniLM-L6-v2)
   * @returns Embedding vector
   */
  async generateEmbedding(
    text: string,
    model: string = 'all-MiniLM-L6-v2'
  ): Promise<number[]> {
    try {
      logger.debug(`Generating embedding for text (length: ${text.length})`);

      const response = await fetch(`${this.serviceUrl}/api/embeddings/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, model }),
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`RAG service error: ${error.error || response.statusText}`);
      }

      const data: EmbeddingResponse = await response.json();
      logger.debug(`Generated embedding with ${data.dimensions} dimensions`);

      return data.embedding;
    } catch (error) {
      logger.error('Failed to generate embedding:', error);
      throw new Error(`Embedding generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate embeddings for multiple texts (batch processing)
   *
   * @param texts - Array of texts to generate embeddings for
   * @param model - Embedding model to use
   * @returns Array of embedding vectors
   */
  async generateEmbeddings(
    texts: string[],
    model: string = 'all-MiniLM-L6-v2'
  ): Promise<number[][]> {
    try {
      logger.debug(`Generating batch embeddings for ${texts.length} texts`);

      const response = await fetch(`${this.serviceUrl}/api/embeddings/generate-batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ texts, model }),
        signal: AbortSignal.timeout(this.timeout * 2), // Double timeout for batch
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`RAG service error: ${error.error || response.statusText}`);
      }

      const data: BatchEmbeddingResponse = await response.json();
      logger.debug(`Generated ${data.count} embeddings with ${data.dimensions} dimensions`);

      return data.embeddings;
    } catch (error) {
      logger.error('Failed to generate batch embeddings:', error);
      throw new Error(`Batch embedding generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search knowledge base using semantic similarity (RAG)
   *
   * @param query - Search query text
   * @param companyId - Company ID for tenant isolation
   * @param options - Search options (limit, threshold)
   * @returns Array of search results with similarity scores
   */
  async searchKnowledge(
    query: string,
    companyId: string,
    options: { limit?: number; threshold?: number } = {}
  ): Promise<RAGSearchResponse> {
    try {
      const { limit = 5, threshold = 0.7 } = options;

      logger.debug(`RAG search: company=${companyId}, query="${query.slice(0, 50)}..."`);

      const response = await fetch(`${this.serviceUrl}/api/rag/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          company_id: companyId,
          limit,
          threshold,
        }),
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`RAG search error: ${error.error || response.statusText}`);
      }

      const data: RAGSearchResponse = await response.json();
      logger.info(`RAG search found ${data.total_found} results for company ${companyId}`);

      return data;
    } catch (error) {
      logger.error('RAG search failed:', error);
      throw new Error(`RAG search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Index a new document in the knowledge base
   *
   * @param params - Document parameters
   * @returns Document ID
   */
  async indexDocument(params: {
    companyId: string;
    userId: string;
    filename: string;
    content: string;
    category?: string;
  }): Promise<string> {
    try {
      logger.debug(`Indexing document: ${params.filename} for company ${params.companyId}`);

      const response = await fetch(`${this.serviceUrl}/api/rag/index-document`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_id: params.companyId,
          user_id: params.userId,
          filename: params.filename,
          content: params.content,
          category: params.category,
        }),
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Document indexing error: ${error.error || response.statusText}`);
      }

      const data: IndexDocumentResponse = await response.json();
      logger.info(`✅ Indexed document ${data.document_id} for company ${params.companyId}`);

      return data.document_id;
    } catch (error) {
      logger.error('Document indexing failed:', error);
      throw new Error(`Document indexing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get service configuration
   */
  getConfig() {
    return {
      serviceUrl: this.serviceUrl,
      timeout: this.timeout,
    };
  }
}

// Singleton instance
export const pythonRAGService = new PythonRAGService();
