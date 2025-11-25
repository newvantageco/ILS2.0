/**
 * Python RAG Service Client
 *
 * HTTP client for communicating with the Python RAG microservice.
 * Provides embedding generation and semantic search capabilities.
 */

import { createLogger } from '../utils/logger.js';

const logger = createLogger('PythonRAGService');

// Configuration
const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || 'http://localhost:8001';
const RAG_SERVICE_TIMEOUT = parseInt(process.env.RAG_SERVICE_TIMEOUT || '10000');
const RAG_SERVICE_ENABLED = process.env.RAG_SERVICE_ENABLED !== 'false';
const RAG_SERVICE_MAX_RETRIES = parseInt(process.env.RAG_SERVICE_MAX_RETRIES || '3');

// Response types
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

interface HealthCheckResponse {
  status: string;
  service: string;
  version: string;
}

// Error class for RAG service errors
export class RAGServiceError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public serviceName: string = 'PythonRAGService'
  ) {
    super(message);
    this.name = 'RAGServiceError';
  }
}

/**
 * Python RAG Service Client
 */
export class PythonRAGService {
  private baseUrl: string;
  private timeout: number;
  private enabled: boolean;
  private maxRetries: number;

  constructor() {
    this.baseUrl = RAG_SERVICE_URL;
    this.timeout = RAG_SERVICE_TIMEOUT;
    this.enabled = RAG_SERVICE_ENABLED;
    this.maxRetries = RAG_SERVICE_MAX_RETRIES;

    if (!this.enabled) {
      logger.warn('⚠️  Python RAG Service is DISABLED via RAG_SERVICE_ENABLED=false');
    } else {
      logger.info(`Python RAG Service configured: ${this.baseUrl}`);
    }
  }

  /**
   * Check if the service is available
   */
  async healthCheck(): Promise<boolean> {
    if (!this.enabled) {
      return false;
    }

    try {
      const response = await this.fetchWithTimeout<HealthCheckResponse>(
        `${this.baseUrl}/health`,
        { method: 'GET' },
        5000 // Short timeout for health check
      );

      return response.status === 'healthy';
    } catch (error) {
      logger.warn({ error: error instanceof Error ? error.message : String(error) }, 'Python RAG Service health check failed');
      return false;
    }
  }

  /**
   * Generate embedding for a single text
   */
  async generateEmbedding(
    text: string,
    model: string = 'all-MiniLM-L6-v2'
  ): Promise<number[]> {
    this.ensureEnabled();

    try {
      logger.debug(`Generating embedding for text (length: ${text.length})`);

      const response = await this.fetchWithRetry<EmbeddingResponse>(
        `${this.baseUrl}/api/embeddings/generate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, model })
        }
      );

      logger.debug(`Embedding generated: ${response.dimensions} dimensions`);
      return response.embedding;

    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Failed to generate embedding');
      throw this.wrapError(error, 'Embedding generation failed');
    }
  }

  /**
   * Generate embeddings for multiple texts (batch processing)
   */
  async generateEmbeddings(
    texts: string[],
    model: string = 'all-MiniLM-L6-v2'
  ): Promise<number[][]> {
    this.ensureEnabled();

    try {
      logger.debug(`Generating batch embeddings for ${texts.length} texts`);

      const response = await this.fetchWithRetry<BatchEmbeddingResponse>(
        `${this.baseUrl}/api/embeddings/generate-batch`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ texts, model })
        }
      );

      logger.debug(`Batch embeddings generated: ${response.count} embeddings`);
      return response.embeddings;

    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Failed to generate batch embeddings');
      throw this.wrapError(error, 'Batch embedding generation failed');
    }
  }

  /**
   * Search knowledge base using semantic similarity
   */
  async searchKnowledge(
    query: string,
    companyId: string,
    options: {
      limit?: number;
      threshold?: number;
    } = {}
  ): Promise<RAGSearchResult[]> {
    this.ensureEnabled();

    const limit = options.limit || 5;
    const threshold = options.threshold || 0.7;

    try {
      logger.debug(`RAG search: company=${companyId}, query="${query.slice(0, 50)}..."`);

      const response = await this.fetchWithRetry<RAGSearchResponse>(
        `${this.baseUrl}/api/rag/search`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            company_id: companyId,
            limit,
            threshold
          })
        }
      );

      logger.info(`RAG search returned ${response.results.length} results`);
      return response.results;

    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'RAG search failed');
      throw this.wrapError(error, 'Knowledge base search failed');
    }
  }

  /**
   * Index a document in the knowledge base
   */
  async indexDocument(doc: {
    companyId: string;
    userId: string;
    filename: string;
    content: string;
    category?: string;
  }): Promise<string> {
    this.ensureEnabled();

    try {
      logger.debug(`Indexing document: ${doc.filename} for company ${doc.companyId}`);

      const response = await this.fetchWithRetry<IndexDocumentResponse>(
        `${this.baseUrl}/api/rag/index-document`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company_id: doc.companyId,
            user_id: doc.userId,
            filename: doc.filename,
            content: doc.content,
            category: doc.category
          })
        }
      );

      logger.info(`Document indexed: ${response.document_id}`);
      return response.document_id;

    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Document indexing failed');
      throw this.wrapError(error, 'Document indexing failed');
    }
  }

  /**
   * Check if service is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get service configuration
   */
  getConfig() {
    return {
      baseUrl: this.baseUrl,
      timeout: this.timeout,
      enabled: this.enabled,
      maxRetries: this.maxRetries
    };
  }

  // Private helper methods

  private ensureEnabled(): void {
    if (!this.enabled) {
      throw new RAGServiceError(
        'Python RAG Service is disabled. Set RAG_SERVICE_ENABLED=true to enable.',
        503
      );
    }
  }

  private async fetchWithTimeout<T>(
    url: string,
    options: RequestInit,
    timeout: number = this.timeout
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        throw new RAGServiceError(
          `HTTP ${response.status}: ${errorText}`,
          response.status
        );
      }

      return await response.json();

    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new RAGServiceError(
          `Request timeout after ${timeout}ms`,
          408
        );
      }

      throw error;
    }
  }

  private async fetchWithRetry<T>(
    url: string,
    options: RequestInit,
    retries: number = this.maxRetries
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await this.fetchWithTimeout<T>(url, options);
      } catch (error) {
        lastError = error as Error;

        // Don't retry on client errors (4xx)
        if (error instanceof RAGServiceError && error.statusCode && error.statusCode < 500) {
          throw error;
        }

        // Don't retry on last attempt
        if (attempt === retries) {
          break;
        }

        // Exponential backoff: 100ms, 200ms, 400ms, etc.
        const delay = Math.min(100 * Math.pow(2, attempt), 5000);
        logger.warn(`Request failed, retrying in ${delay}ms (attempt ${attempt + 1}/${retries})...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  private wrapError(error: unknown, message: string): RAGServiceError {
    if (error instanceof RAGServiceError) {
      return error;
    }

    if (error instanceof Error) {
      return new RAGServiceError(
        `${message}: ${error.message}`,
        undefined
      );
    }

    return new RAGServiceError(message);
  }
}

// Singleton instance
export const pythonRAGService = new PythonRAGService();
