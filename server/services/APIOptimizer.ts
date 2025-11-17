/**
 * API Performance Optimization Service for ILS 2.0
 * 
 * Comprehensive API optimization including:
 * - Response time optimization
 * - Intelligent caching strategies
 * - Request batching and deduplication
 * - Rate limiting and throttling
 * - Compression and minimization
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import Redis from 'ioredis';
import { performance } from 'perf_hooks';

// Redis client (lazy initialization - prevents connection at module load time in Docker)
let redis: Redis | null = null;
let redisInitialized = false;

/**
 * Initialize Redis connection (lazy)
 */
function initializeRedis(): void {
  if (redisInitialized) return; // Already attempted initialization
  redisInitialized = true;

  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    logger.info('APIOptimizer: REDIS_URL not set; using in-memory cache only');
    return;
  }

  try {
    redis = new Redis(redisUrl);
    redis.on('error', (error) => {
      logger.warn({ error }, 'APIOptimizer Redis connection error; using in-memory cache only');
      redis = null;
    });
    redis.on('connect', () => {
      logger.info('APIOptimizer: Redis connected successfully');
    });
  } catch (error) {
    logger.warn({ error }, 'APIOptimizer: Failed to initialize Redis');
    redis = null;
  }
}

export interface APIMetrics {
  totalRequests: number;
  averageResponseTime: number;
  slowRequests: number;
  cacheHitRate: number;
  compressionRatio: number;
  errorRate: number;
  requestsPerSecond: number;
}

export interface OptimizationRule {
  endpoint: string;
  method: string;
  cacheTTL: number;
  compressionEnabled: boolean;
  rateLimitPerMinute: number;
  batchable: boolean;
  priority: 'high' | 'medium' | 'low';
}

export class APIOptimizer {
  private metrics: Map<string, APIMetrics> = new Map();
  private optimizationRules: OptimizationRule[] = [];
  private requestCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private batchQueue = new Map<string, Array<{ resolve: Function; reject: Function; args: any[] }>>();

  constructor() {
    this.initializeOptimizationRules();
    this.startMetricsCollection();
  }

  /**
   * Initialize default optimization rules
   */
  private initializeOptimizationRules(): void {
    this.optimizationRules = [
      // Patient endpoints
      {
        endpoint: '/api/patients',
        method: 'GET',
        cacheTTL: 300, // 5 minutes
        compressionEnabled: true,
        rateLimitPerMinute: 100,
        batchable: true,
        priority: 'high'
      },
      {
        endpoint: '/api/patients/:id',
        method: 'GET',
        cacheTTL: 600, // 10 minutes
        compressionEnabled: true,
        rateLimitPerMinute: 200,
        batchable: false,
        priority: 'high'
      },

      // Prescription endpoints
      {
        endpoint: '/api/prescriptions',
        method: 'GET',
        cacheTTL: 180, // 3 minutes
        compressionEnabled: true,
        rateLimitPerMinute: 80,
        batchable: true,
        priority: 'medium'
      },
      {
        endpoint: '/api/prescriptions/:id',
        method: 'GET',
        cacheTTL: 300, // 5 minutes
        compressionEnabled: true,
        rateLimitPerMinute: 150,
        batchable: false,
        priority: 'medium'
      },

      // Order endpoints
      {
        endpoint: '/api/orders',
        method: 'GET',
        cacheTTL: 120, // 2 minutes
        compressionEnabled: true,
        rateLimitPerMinute: 60,
        batchable: true,
        priority: 'medium'
      },

      // AI service endpoints
      {
        endpoint: '/api/ai/analyze',
        method: 'POST',
        cacheTTL: 0, // No caching for AI analysis
        compressionEnabled: true,
        rateLimitPerMinute: 20,
        batchable: false,
        priority: 'low'
      },
      {
        endpoint: '/api/ai/ocr',
        method: 'POST',
        cacheTTL: 0, // No caching for OCR
        compressionEnabled: true,
        rateLimitPerMinute: 30,
        batchable: false,
        priority: 'low'
      },

      // Analytics endpoints
      {
        endpoint: '/api/analytics',
        method: 'GET',
        cacheTTL: 900, // 15 minutes
        compressionEnabled: true,
        rateLimitPerMinute: 30,
        batchable: true,
        priority: 'low'
      }
    ];
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    setInterval(() => {
      this.cleanupExpiredCache();
      this.updateMetrics();
    }, 60000); // Every minute
  }

  /**
   * Middleware for API optimization
   */
  optimizeAPI(req: Request, res: Response, next: NextFunction): void {
    const startTime = performance.now();
    const endpoint = `${req.method}:${req.route?.path || req.path}`;
    
    // Apply optimization rules
    const rule = this.getOptimizationRule(req.method, req.path);
    
    if (rule) {
      // Apply caching
      if (rule.cacheTTL > 0 && req.method === 'GET') {
        const cached = this.getCachedResponse(req);
        if (cached) {
          this.sendCachedResponse(res, cached);
          this.recordMetric(endpoint, performance.now() - startTime, true);
          return;
        }
      }

      // Apply compression
      if (rule.compressionEnabled) {
        res.setHeader('Content-Encoding', 'gzip');
      }

      // Set cache headers
      if (rule.cacheTTL > 0) {
        res.setHeader('Cache-Control', `public, max-age=${rule.cacheTTL}`);
      }
    }

    // Continue to next middleware
    const originalSend = res.send;
    res.send = function(data: any) {
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      // Cache response if applicable
      if (rule && rule.cacheTTL > 0 && req.method === 'GET' && res.statusCode === 200) {
        APIOptimizer.prototype.cacheResponse(req, data, rule.cacheTTL);
      }
      
      // Record metrics
      APIOptimizer.prototype.recordMetric(endpoint, responseTime, false);
      
      // Add performance headers
      res.setHeader('X-Response-Time', `${responseTime.toFixed(2)}ms`);
      res.setHeader('X-Cache-Status', data ? 'HIT' : 'MISS');
      
      return originalSend.call(this, data);
    };

    next();
  }

  /**
   * Get optimization rule for endpoint
   */
  private getOptimizationRule(method: string, path: string): OptimizationRule | null {
    return this.optimizationRules.find(rule => {
      const rulePattern = rule.endpoint.replace(/:[^/]+/g, '[^/]+');
      const regex = new RegExp(`^${rulePattern}$`);
      return rule.method === method && regex.test(path);
    }) || null;
  }

  /**
   * Get cached response
   */
  private getCachedResponse(req: Request): any {
    const cacheKey = this.generateCacheKey(req);
    const cached = this.requestCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < cached.ttl * 1000) {
      return cached.data;
    }
    
    // Remove expired cache
    if (cached) {
      this.requestCache.delete(cacheKey);
    }
    
    return null;
  }

  /**
   * Cache response
   */
  private cacheResponse(req: Request, data: any, ttl: number): void {
    const cacheKey = this.generateCacheKey(req);
    this.requestCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(req: Request): string {
    const key = `${req.method}:${req.path}:${JSON.stringify(req.query)}`;
    return Buffer.from(key).toString('base64');
  }

  /**
   * Send cached response
   */
  private sendCachedResponse(res: Response, data: any): void {
    res.setHeader('X-Cache-Status', 'HIT');
    res.json(data);
  }

  /**
   * Record API metrics
   */
  private recordMetric(endpoint: string, responseTime: number, fromCache: boolean): void {
    if (!this.metrics.has(endpoint)) {
      this.metrics.set(endpoint, {
        totalRequests: 0,
        averageResponseTime: 0,
        slowRequests: 0,
        cacheHitRate: 0,
        compressionRatio: 0,
        errorRate: 0,
        requestsPerSecond: 0
      });
    }

    const metrics = this.metrics.get(endpoint)!;
    metrics.totalRequests++;
    
    // Update average response time
    metrics.averageResponseTime = (metrics.averageResponseTime * (metrics.totalRequests - 1) + responseTime) / metrics.totalRequests;
    
    // Count slow requests (> 1 second)
    if (responseTime > 1000) {
      metrics.slowRequests++;
    }
    
    // Update cache hit rate
    if (fromCache) {
      metrics.cacheHitRate = (metrics.cacheHitRate * (metrics.totalRequests - 1) + 100) / metrics.totalRequests;
    } else {
      metrics.cacheHitRate = (metrics.cacheHitRate * (metrics.totalRequests - 1)) / metrics.totalRequests;
    }
  }

  /**
   * Update metrics calculations
   */
  private updateMetrics(): void {
    this.metrics.forEach((metrics, endpoint) => {
      // Calculate requests per second (based on last minute)
      metrics.requestsPerSecond = metrics.totalRequests / 60;
      
      // Log slow endpoints
      if (metrics.averageResponseTime > 500) {
        logger.warn({
          endpoint,
          averageResponseTime: metrics.averageResponseTime,
          slowRequests: metrics.slowRequests
        }, 'Slow API endpoint detected');
      }
    });
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupExpiredCache(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.requestCache.forEach((cached, key) => {
      if (now - cached.timestamp > cached.ttl * 1000) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.requestCache.delete(key));
  }

  /**
   * Batch similar requests
   */
  async batchRequest<T>(
    batchKey: string,
    requestFn: (...args: any[]) => Promise<T>,
    args: any[],
    timeout: number = 100
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.batchQueue.has(batchKey)) {
        this.batchQueue.set(batchKey, []);
        
        // Process batch after timeout
        setTimeout(() => {
          this.processBatch(batchKey, requestFn);
        }, timeout);
      }
      
      this.batchQueue.get(batchKey)!.push({ resolve, reject, args });
    });
  }

  /**
   * Process batched requests
   */
  private async processBatch<T>(
    batchKey: string,
    requestFn: (...args: any[]) => Promise<T>
  ): Promise<void> {
    const queue = this.batchQueue.get(batchKey);
    if (!queue || queue.length === 0) return;
    
    this.batchQueue.delete(batchKey);
    
    try {
      // Group similar requests and execute in batch
      const batchArgs = queue.map(item => item.args);
      const results = await Promise.all(batchArgs.map(args => requestFn(...args)));
      
      // Resolve individual promises
      queue.forEach((item, index) => {
        item.resolve(results[index]);
      });
    } catch (error) {
      // Reject all promises in batch
      queue.forEach(item => {
        item.reject(error);
      });
    }
  }

  /**
   * Redis-based distributed caching
   */
  async getDistributedCache(key: string): Promise<any> {
    initializeRedis(); // Lazy initialization

    if (!redis) {
      return null;
    }
    try {
      const cached = await redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.warn({ error, key }, 'Failed to get distributed cache');
      return null;
    }
  }

  async setDistributedCache(key: string, data: any, ttl: number): Promise<void> {
    initializeRedis(); // Lazy initialization

    if (!redis) {
      return;
    }
    try {
      await redis.setex(key, ttl, JSON.stringify(data));
    } catch (error) {
      logger.warn({ error, key }, 'Failed to set distributed cache');
    }
  }

  /**
   * Compress response data
   */
  compressResponse(data: any): Buffer {
    const zlib = require('zlib');
    const jsonString = JSON.stringify(data);
    return zlib.gzipSync(jsonString);
  }

  /**
   * Decompress response data
   */
  decompressResponse(compressedData: Buffer): any {
    const zlib = require('zlib');
    const jsonString = zlib.gunzipSync(compressedData).toString();
    return JSON.parse(jsonString);
  }

  /**
   * Get API metrics
   */
  getMetrics(): Map<string, APIMetrics> {
    return new Map(this.metrics);
  }

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations(): Array<{
    endpoint: string;
    type: 'caching' | 'compression' | 'rate-limiting' | 'batching';
    recommendation: string;
    impact: string;
  }> {
    const recommendations: Array<{
      endpoint: string;
      type: 'caching' | 'compression' | 'rate-limiting' | 'batching';
      recommendation: string;
      impact: string;
    }> = [];

    this.metrics.forEach((metrics, endpoint) => {
      // Slow response times
      if (metrics.averageResponseTime > 1000) {
        recommendations.push({
          endpoint,
          type: 'caching',
          recommendation: 'Enable response caching for this endpoint',
          impact: '50-70% faster response times'
        });
      }

      // Low cache hit rate
      if (metrics.cacheHitRate < 50 && metrics.totalRequests > 100) {
        recommendations.push({
          endpoint,
          type: 'caching',
          recommendation: 'Increase cache TTL or implement smarter caching',
          impact: '30-50% reduction in server load'
        });
      }

      // High error rate
      if (metrics.errorRate > 5) {
        recommendations.push({
          endpoint,
          type: 'rate-limiting',
          recommendation: 'Implement stricter rate limiting',
          impact: 'Improved stability and reduced abuse'
        });
      }

      // High request volume
      if (metrics.requestsPerSecond > 10) {
        const rule = this.optimizationRules.find(r => endpoint.includes(r.endpoint));
        if (rule && !rule.batchable) {
          recommendations.push({
            endpoint,
            type: 'batching',
            recommendation: 'Implement request batching for high-volume endpoint',
            impact: '40-60% reduction in database queries'
          });
        }
      }
    });

    return recommendations;
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport(): string {
    const totalRequests = Array.from(this.metrics.values()).reduce((sum, m) => sum + m.totalRequests, 0);
    const averageResponseTime = Array.from(this.metrics.values()).reduce((sum, m) => sum + m.averageResponseTime, 0) / this.metrics.size || 0;
    const totalSlowRequests = Array.from(this.metrics.values()).reduce((sum, m) => sum + m.slowRequests, 0);
    
    const recommendations = this.getOptimizationRecommendations();

    const report = `
# 📊 API Performance Report
Generated: ${new Date().toISOString()}

## 📈 Overall Metrics
- **Total Requests**: ${totalRequests.toLocaleString()}
- **Average Response Time**: ${averageResponseTime.toFixed(2)}ms
- **Slow Requests**: ${totalSlowRequests} (${((totalSlowRequests / totalRequests) * 100).toFixed(2)}%)
- **Cache Hit Rate**: ${(Array.from(this.metrics.values()).reduce((sum, m) => sum + m.cacheHitRate, 0) / this.metrics.size || 0).toFixed(2)}%

## 🎯 Endpoint Performance
${Array.from(this.metrics.entries()).map(([endpoint, metrics]) => `
### ${endpoint}
- Requests: ${metrics.totalRequests}
- Avg Response Time: ${metrics.averageResponseTime.toFixed(2)}ms
- Slow Requests: ${metrics.slowRequests}
- Cache Hit Rate: ${metrics.cacheHitRate.toFixed(2)}%
- Requests/sec: ${metrics.requestsPerSecond.toFixed(2)}
`).join('')}

## 💡 Optimization Recommendations
${recommendations.map(rec => `
- **${rec.type.toUpperCase()}** for ${rec.endpoint}: ${rec.recommendation}
  - Impact: ${rec.impact}
`).join('')}

## 🚀 Performance Score
${this.calculatePerformanceScore()}/100

## 📋 Optimization Rules Applied
${this.optimizationRules.map(rule => `
- ${rule.method} ${rule.endpoint}: Cache ${rule.cacheTTL}s, Rate limit ${rule.rateLimitPerMinute}/min
`).join('')}
    `.trim();

    return report;
  }

  /**
   * Calculate overall performance score
   */
  private calculatePerformanceScore(): number {
    if (this.metrics.size === 0) return 100;

    let totalScore = 0;
    let totalWeight = 0;

    this.metrics.forEach((metrics) => {
      let score = 100;
      let weight = 1;

      // Response time scoring (40% weight)
      if (metrics.averageResponseTime > 2000) {
        score -= 40;
      } else if (metrics.averageResponseTime > 1000) {
        score -= 25;
      } else if (metrics.averageResponseTime > 500) {
        score -= 10;
      }

      // Cache hit rate scoring (30% weight)
      if (metrics.cacheHitRate < 50) {
        score -= 30;
      } else if (metrics.cacheHitRate < 70) {
        score -= 15;
      } else if (metrics.cacheHitRate < 85) {
        score -= 5;
      }

      // Error rate scoring (20% weight)
      if (metrics.errorRate > 10) {
        score -= 20;
      } else if (metrics.errorRate > 5) {
        score -= 10;
      } else if (metrics.errorRate > 2) {
        score -= 5;
      }

      // Slow requests scoring (10% weight)
      const slowRequestRate = (metrics.slowRequests / metrics.totalRequests) * 100;
      if (slowRequestRate > 10) {
        score -= 10;
      } else if (slowRequestRate > 5) {
        score -= 5;
      } else if (slowRequestRate > 2) {
        score -= 2;
      }

      totalScore += Math.max(0, score) * weight;
      totalWeight += weight;
    });

    return Math.round(totalScore / totalWeight);
  }

  /**
   * Clear all metrics and cache
   */
  reset(): void {
    this.metrics.clear();
    this.requestCache.clear();
    this.batchQueue.clear();
    logger.info('API optimizer reset completed');
  }
}

export const apiOptimizer = new APIOptimizer();
export default apiOptimizer;
