// packages/lims-client/src/LimsClient.ts
// Type-safe LIMS API client with retry and circuit breaker logic

import { createHmac } from 'crypto';
import {
  CreateJobRequest,
  CreateJobResponse,
  JobStatus,
  LimsStatusUpdatePayload,
  ValidationRequest,
  ValidationResponse,
  CatalogResponse,
  LimsHealthCheck,
  CircuitBreakerState,
  LimsClientConfig,
  LimsClientOptions,
} from './types';

export class LimsClientError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public retryable?: boolean
  ) {
    super(message);
    this.name = 'LimsClientError';
  }
}

export class LimsClient {
  private config: LimsClientOptions;
  private circuitBreaker: CircuitBreakerState = {
    status: 'closed',
    failureCount: 0,
    successCount: 0,
  };
  private catalogCache: CatalogResponse | null = null;
  private lastCatalogFetch: Date | null = null;
  private catalogCacheTTL = 5 * 60 * 1000; // 5 minutes

  constructor(config: LimsClientConfig) {
    this.config = {
      timeout: 30000,
      retryMaxAttempts: 3,
      retryBackoffMs: 1000,
      circuitBreakerThreshold: 5,
      circuitBreakerTimeout: 60000,
      logger: {
        debug: console.debug,
        info: console.info,
        warn: console.warn,
        error: console.error,
      },
      ...config,
    };
  }

  private async makeRequest<T>(
    method: string,
    path: string,
    body?: any
  ): Promise<T> {
    const url = new URL(path, this.config.baseUrl).toString();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'lims-client/1.0.0',
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      const data = await response.json() as T;

      if (!response.ok) {
        throw new LimsClientError(
          `HTTP ${response.status}`,
          'HTTP_ERROR',
          response.status,
          response.status >= 500 || response.status === 429
        );
      }

      return data;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // ==================== Public API Methods ====================

  /**
   * Create a job in LIMS and receive a job ID
   */
  async createJob(request: CreateJobRequest): Promise<CreateJobResponse> {
    this.ensureCircuitBreakerOpen();
    
    try {
      this.config.logger?.debug('Creating LIMS job', {
        ecpId: request.ecpId,
        patientId: request.patientId,
      });

      const data = await this.retryWithBackoff(() =>
        this.makeRequest<CreateJobResponse>('POST', '/jobs/create', request)
      );

      this.recordSuccess();
      
      return {
        ...data,
        estimatedCompletionDate: new Date(data.estimatedCompletionDate),
      };
    } catch (error) {
      this.recordFailure();
      throw this.handleError(error, 'CREATE_JOB_FAILED');
    }
  }

  /**
   * Get the current status of a job
   */
  async getJobStatus(jobId: string): Promise<JobStatus> {
    this.ensureCircuitBreakerOpen();

    try {
      this.config.logger?.debug('Fetching LIMS job status', { jobId });

      const data = await this.retryWithBackoff(() =>
        this.makeRequest<{ status: JobStatus }>('GET', `/jobs/${jobId}/status`)
      );

      this.recordSuccess();
      return data.status;
    } catch (error) {
      this.recordFailure();
      throw this.handleError(error, 'GET_JOB_STATUS_FAILED');
    }
  }

  /**
   * Validate a configuration against LIMS rules
   */
  async validateConfiguration(request: ValidationRequest): Promise<ValidationResponse> {
    this.ensureCircuitBreakerOpen();

    try {
      this.config.logger?.debug('Validating configuration against LIMS rules', {
        lensType: request.lensType,
        coating: request.coating,
      });

      const data = await this.retryWithBackoff(() =>
        this.makeRequest<ValidationResponse>('POST', '/validation', request)
      );

      this.recordSuccess();
      return data;
    } catch (error) {
      this.recordFailure();
      throw this.handleError(error, 'VALIDATION_FAILED');
    }
  }

  /**
   * Fetch the current catalog from LIMS
   */
  async fetchCatalog(useCache = true): Promise<CatalogResponse> {
    this.ensureCircuitBreakerOpen();

    // Check cache
    if (
      useCache &&
      this.catalogCache &&
      this.lastCatalogFetch &&
      Date.now() - this.lastCatalogFetch.getTime() < this.catalogCacheTTL
    ) {
      this.config.logger?.debug('Using cached catalog');
      return this.catalogCache;
    }

    try {
      this.config.logger?.debug('Fetching catalog from LIMS');

      const data = await this.retryWithBackoff(() =>
        this.makeRequest<CatalogResponse>('GET', '/catalog')
      );

      const catalog = {
        ...data,
        timestamp: new Date(data.timestamp),
      };

      this.catalogCache = catalog;
      this.lastCatalogFetch = new Date();
      this.recordSuccess();

      return catalog;
    } catch (error) {
      this.recordFailure();
      throw this.handleError(error, 'FETCH_CATALOG_FAILED');
    }
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<LimsHealthCheck> {
    const startTime = Date.now();

    try {
      await this.makeRequest<void>('GET', '/health');
      const latency = Date.now() - startTime;

      return {
        status: 'healthy',
        lastCheck: new Date(),
        latency,
        version: this.config.apiKey ? 'v1' : 'unknown',
      };
    } catch (error) {
      const latency = Date.now() - startTime;

      return {
        status: 'degraded',
        lastCheck: new Date(),
        latency,
        version: 'unknown',
      };
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(
    payload: string,
    signature: string
  ): boolean {
    if (!this.config.webhookSecret) {
      this.config.logger?.warn('Webhook secret not configured');
      return false;
    }

    const expectedSignature = createHmac('sha256', this.config.webhookSecret)
      .update(payload)
      .digest('hex');

    return expectedSignature === signature;
  }

  /**
   * Get circuit breaker state for monitoring
   */
  getCircuitBreakerState(): CircuitBreakerState {
    return { ...this.circuitBreaker };
  }

  /**
   * Clear circuit breaker state (use with caution)
   */
  resetCircuitBreaker(): void {
    this.circuitBreaker = {
      status: 'closed',
      failureCount: 0,
      successCount: 0,
    };
    this.config.logger?.info('Circuit breaker reset');
  }

  // ==================== Private Helper Methods ====================

  /**
   * Retry logic with exponential backoff
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    attempt = 1
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      const isRetryable = this.isRetryableError(error);
      
      if (isRetryable && attempt < this.config.retryMaxAttempts!) {
        const backoffMs = this.config.retryBackoffMs! * Math.pow(2, attempt - 1);
        this.config.logger?.warn(
          `Retrying request (attempt ${attempt}/${this.config.retryMaxAttempts}) after ${backoffMs}ms`,
          { error: (error as Error).message }
        );

        await new Promise(resolve => setTimeout(resolve, backoffMs));
        return this.retryWithBackoff(fn, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    if (error instanceof LimsClientError) {
      return error.retryable ?? false;
    }
    return true; // Retry unknown errors
  }

  /**
   * Handle and transform errors
   */
  private handleError(error: any, code: string): LimsClientError {
    if (error instanceof LimsClientError) {
      return error;
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    this.config.logger?.error('Error', { code, message });

    return new LimsClientError(message, code, undefined, false);
  }

  /**
   * Ensure circuit breaker is not open
   */
  private ensureCircuitBreakerOpen(): void {
    if (this.circuitBreaker.status === 'open') {
      const now = Date.now();
      const nextRetry = this.circuitBreaker.nextRetryTime?.getTime() || 0;

      if (now < nextRetry) {
        throw new LimsClientError(
          'Circuit breaker is open. Too many failures.',
          'CIRCUIT_BREAKER_OPEN',
          undefined,
          true
        );
      }

      // Transition to half-open
      this.circuitBreaker.status = 'half-open';
      this.circuitBreaker.successCount = 0;
      this.config.logger?.info('Circuit breaker transitioning to half-open');
    }
  }

  /**
   * Record successful request
   */
  private recordSuccess(): void {
    if (this.circuitBreaker.status === 'half-open') {
      this.circuitBreaker.successCount++;

      // If we've had enough successes, close the circuit
      if (this.circuitBreaker.successCount >= 3) {
        this.circuitBreaker.status = 'closed';
        this.circuitBreaker.failureCount = 0;
        this.circuitBreaker.successCount = 0;
        this.config.logger?.info('Circuit breaker closed');
      }
    } else if (this.circuitBreaker.status === 'closed') {
      this.circuitBreaker.failureCount = 0;
    }
  }

  /**
   * Record failed request
   */
  private recordFailure(): void {
    this.circuitBreaker.failureCount++;

    if (this.circuitBreaker.failureCount >= this.config.circuitBreakerThreshold!) {
      this.circuitBreaker.status = 'open';
      this.circuitBreaker.nextRetryTime = new Date(
        Date.now() + this.config.circuitBreakerTimeout!
      );
      this.config.logger?.error('Circuit breaker opened due to repeated failures');
    }
  }
}

export default LimsClient;
