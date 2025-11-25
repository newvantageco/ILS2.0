/**
 * Embedding Service
 *
 * Generates vector embeddings using OpenAI's text-embedding-ada-002 model.
 * Supports caching via Redis to reduce API costs and improve performance.
 */

import OpenAI from 'openai';
import crypto from 'crypto';
import { createLogger } from '../utils/logger';

const logger = createLogger('EmbeddingService');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configuration
const EMBEDDING_MODEL = 'text-embedding-ada-002';
const EMBEDDING_DIMENSIONS = 1536;
const CACHE_TTL = 86400; // 24 hours in seconds

export class EmbeddingService {
  private cache: Map<string, number[]>;

  constructor() {
    // In-memory cache as fallback if Redis unavailable
    this.cache = new Map();
  }

  /**
   * Generate embedding for a single text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      // Validate input
      if (!text || text.trim().length === 0) {
        throw new Error('Text cannot be empty');
      }

      // Check cache first
      const cacheKey = this.getCacheKey(text);
      const cached = await this.getFromCache(cacheKey);
      if (cached) {
        logger.debug('Embedding cache hit');
        return cached;
      }

      // Generate embedding via OpenAI
      logger.debug(`Generating embedding for text (${text.length} chars)`);
      const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: text,
      });

      const embedding = response.data[0].embedding;

      // Verify dimensions
      if (embedding.length !== EMBEDDING_DIMENSIONS) {
        throw new Error(
          `Unexpected embedding dimensions: ${embedding.length} (expected ${EMBEDDING_DIMENSIONS})`
        );
      }

      // Cache the result
      await this.setInCache(cacheKey, embedding);

      logger.info(`Generated embedding with ${EMBEDDING_DIMENSIONS} dimensions`);
      return embedding;
    } catch (error: any) {
      logger.error('Failed to generate embedding:', error);
      throw new Error(`Embedding generation failed: ${error.message}`);
    }
  }

  /**
   * Generate embeddings for multiple texts (batch processing)
   * OpenAI supports up to 2048 inputs per request
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      if (texts.length === 0) {
        return [];
      }

      // OpenAI batch limit
      const BATCH_SIZE = 2048;
      if (texts.length > BATCH_SIZE) {
        logger.warn(`Batch size ${texts.length} exceeds limit ${BATCH_SIZE}, splitting into chunks`);
        return this.generateEmbeddingsBatched(texts, BATCH_SIZE);
      }

      // Filter out empty texts
      const validTexts = texts.filter(t => t && t.trim().length > 0);
      if (validTexts.length === 0) {
        throw new Error('All texts are empty');
      }

      // Check cache for all texts
      const cacheKeys = validTexts.map(t => this.getCacheKey(t));
      const cachedEmbeddings = await this.getMultipleFromCache(cacheKeys);

      // Identify which texts need generation
      const textsToGenerate: string[] = [];
      const textIndices: number[] = [];

      validTexts.forEach((text, index) => {
        if (!cachedEmbeddings[index]) {
          textsToGenerate.push(text);
          textIndices.push(index);
        }
      });

      // If all cached, return early
      if (textsToGenerate.length === 0) {
        logger.debug(`All ${validTexts.length} embeddings found in cache`);
        return cachedEmbeddings as number[][];
      }

      logger.debug(`Generating ${textsToGenerate.length}/${validTexts.length} embeddings (others cached)`);

      // Generate missing embeddings
      const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: textsToGenerate,
      });

      const newEmbeddings = response.data.map(item => item.embedding);

      // Cache new embeddings
      await Promise.all(
        newEmbeddings.map((embedding, idx) => {
          const text = textsToGenerate[idx];
          const cacheKey = this.getCacheKey(text);
          return this.setInCache(cacheKey, embedding);
        })
      );

      // Merge cached and new embeddings in correct order
      const result: number[][] = [];
      let newEmbeddingIndex = 0;

      for (let i = 0; i < validTexts.length; i++) {
        if (cachedEmbeddings[i]) {
          result.push(cachedEmbeddings[i]);
        } else {
          result.push(newEmbeddings[newEmbeddingIndex++]);
        }
      }

      logger.info(`Generated ${newEmbeddings.length} new embeddings, ${cachedEmbeddings.filter(Boolean).length} from cache`);
      return result;
    } catch (error: any) {
      logger.error('Failed to generate batch embeddings:', error);
      throw new Error(`Batch embedding generation failed: ${error.message}`);
    }
  }

  /**
   * Generate embeddings in batches (for large datasets)
   */
  private async generateEmbeddingsBatched(texts: string[], batchSize: number): Promise<number[][]> {
    const results: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      logger.debug(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(texts.length / batchSize)}`);

      const batchEmbeddings = await this.generateEmbeddings(batch);
      results.push(...batchEmbeddings);

      // Rate limiting: small delay between batches
      if (i + batchSize < texts.length) {
        await this.sleep(100); // 100ms delay
      }
    }

    return results;
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same dimensions');
    }

    const dotProduct = embedding1.reduce((sum, val, idx) => sum + val * embedding2[idx], 0);
    const magnitude1 = Math.sqrt(embedding1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(embedding2.reduce((sum, val) => sum + val * val, 0));

    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }

    return dotProduct / (magnitude1 * magnitude2);
  }

  /**
   * Get cache key for text (hash to handle long texts)
   */
  private getCacheKey(text: string): string {
    return `embedding:${crypto.createHash('sha256').update(text).digest('hex')}`;
  }

  /**
   * Get embedding from cache (in-memory for now, can be extended to Redis)
   */
  private async getFromCache(key: string): Promise<number[] | null> {
    // Try in-memory cache
    const cached = this.cache.get(key);
    if (cached) {
      return cached;
    }

    // TODO: Try Redis cache if available
    // if (redis) {
    //   const cached = await redis.get(key);
    //   if (cached) {
    //     const embedding = JSON.parse(cached);
    //     this.cache.set(key, embedding); // Warm up in-memory cache
    //     return embedding;
    //   }
    // }

    return null;
  }

  /**
   * Get multiple embeddings from cache
   */
  private async getMultipleFromCache(keys: string[]): Promise<(number[] | null)[]> {
    return Promise.all(keys.map(key => this.getFromCache(key)));
  }

  /**
   * Set embedding in cache
   */
  private async setInCache(key: string, embedding: number[]): Promise<void> {
    // Set in-memory cache
    this.cache.set(key, embedding);

    // Limit cache size (LRU-style eviction)
    if (this.cache.size > 1000) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    // TODO: Set in Redis if available
    // if (redis) {
    //   await redis.setex(key, CACHE_TTL, JSON.stringify(embedding));
    // }
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
    logger.info('Embedding cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      model: EMBEDDING_MODEL,
      dimensions: EMBEDDING_DIMENSIONS,
    };
  }

  /**
   * Sleep utility for rate limiting
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const embeddingService = new EmbeddingService();
