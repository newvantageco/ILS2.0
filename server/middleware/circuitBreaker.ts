/**
 * Circuit Breaker Middleware
 * Implements circuit breaker pattern for graceful degradation
 * Prevents cascading failures by detecting and isolating failing services
 */

import { Request, Response, NextFunction } from 'express';
import { cacheService } from '../services/CacheService';
import logger from '../utils/logger';

type CircuitState = 'closed' | 'open' | 'half-open';

interface CircuitStats {
  failures: number;
  successes: number;
  totalRequests: number;
  lastFailureTime: Date | null;
  state: CircuitState;
}

interface CircuitBreakerOptions {
  failureThreshold: number; // Number of failures before opening circuit
  successThreshold: number; // Number of successes in half-open before closing
  timeout: number; // Time to wait before trying again (ms)
  monitoringPeriod: number; // Period to track failures (ms)
  fallbackResponse?: any; // Optional fallback response
}

class CircuitBreaker {
  private circuits: Map<string, CircuitStats> = new Map();
  private readonly defaultOptions: CircuitBreakerOptions = {
    failureThreshold: 5,
    successThreshold: 2,
    timeout: 60000, // 1 minute
    monitoringPeriod: 120000, // 2 minutes
  };

  /**
   * Wrap a function with circuit breaker logic
   */
  async execute<T>(
    circuitName: string,
    fn: () => Promise<T>,
    options?: Partial<CircuitBreakerOptions>
  ): Promise<T> {
    const opts = { ...this.defaultOptions, ...options };
    const circuit = this.getOrCreateCircuit(circuitName);

    // Check circuit state
    if (circuit.state === 'open') {
      // Check if timeout has passed
      if (
        circuit.lastFailureTime &&
        Date.now() - circuit.lastFailureTime.getTime() > opts.timeout
      ) {
        // Move to half-open state
        circuit.state = 'half-open';
        logger.info({ circuitName, state: 'half-open' }, 'Circuit moved to half-open state');
      } else {
        // Circuit is still open, use fallback
        if (opts.fallbackResponse !== undefined) {
          logger.warn({ circuitName, state: 'open' }, 'Circuit is open, using fallback');
          return opts.fallbackResponse;
        }
        
        throw new Error(`Circuit breaker '${circuitName}' is open`);
      }
    }

    try {
      // Execute function
      const result = await fn();

      // Record success
      circuit.successes++;
      circuit.totalRequests++;

      // If in half-open state, check if we should close
      if (circuit.state === 'half-open') {
        if (circuit.successes >= opts.successThreshold) {
          circuit.state = 'closed';
          circuit.failures = 0;
          circuit.successes = 0;
          logger.info({ circuitName, state: 'closed', successes: circuit.successes }, 'Circuit closed');
        }
      }

      return result;
    } catch (error) {
      // Record failure
      circuit.failures++;
      circuit.totalRequests++;
      circuit.lastFailureTime = new Date();

      // Check if we should open the circuit
      if (circuit.state === 'closed' || circuit.state === 'half-open') {
        if (circuit.failures >= opts.failureThreshold) {
          circuit.state = 'open';
          logger.error({ circuitName, state: 'open', failures: circuit.failures }, 'Circuit opened due to failures');
        }
      }

      // If circuit is now open and we have a fallback, use it
      if (circuit.state === 'open' && opts.fallbackResponse !== undefined) {
        logger.warn({ circuitName, state: 'open' }, 'Circuit opened, using fallback');
        return opts.fallbackResponse;
      }

      throw error;
    }
  }

  /**
   * Create middleware for circuit breaker
   */
  middleware(
    circuitName: string,
    options?: Partial<CircuitBreakerOptions>
  ) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const circuit = this.getOrCreateCircuit(circuitName);

      // Check circuit state
      if (circuit.state === 'open') {
        const opts = { ...this.defaultOptions, ...options };
        
        // Check if timeout has passed
        if (
          circuit.lastFailureTime &&
          Date.now() - circuit.lastFailureTime.getTime() < opts.timeout
        ) {
          // Circuit is open, return fallback or error
          if (opts.fallbackResponse !== undefined) {
            return res.status(503).json(opts.fallbackResponse);
          }
          
          return res.status(503).json({
            error: 'Service temporarily unavailable',
            message: `Circuit breaker '${circuitName}' is open`,
            retryAfter: Math.ceil(opts.timeout / 1000),
          });
        }

        // Move to half-open
        circuit.state = 'half-open';
        logger.info({ circuitName, state: 'half-open' }, 'Circuit moved to half-open state');
      }

      // Store original send function
      const originalSend = res.send;
      const originalJson = res.json;

      let responseSent = false;

      // Wrap send to track success/failure
      res.send = function (data: any) {
        if (!responseSent) {
          responseSent = true;
          
          if (res.statusCode >= 500) {
            circuitBreaker.recordFailure(circuitName, options);
          } else {
            circuitBreaker.recordSuccess(circuitName, options);
          }
        }
        
        return originalSend.call(this, data);
      };

      res.json = function (data: any) {
        if (!responseSent) {
          responseSent = true;
          
          if (res.statusCode >= 500) {
            circuitBreaker.recordFailure(circuitName, options);
          } else {
            circuitBreaker.recordSuccess(circuitName, options);
          }
        }
        
        return originalJson.call(this, data);
      };

      next();
    };
  }

  /**
   * Record success
   */
  recordSuccess(circuitName: string, options?: Partial<CircuitBreakerOptions>): void {
    const opts = { ...this.defaultOptions, ...options };
    const circuit = this.getOrCreateCircuit(circuitName);

    circuit.successes++;
    circuit.totalRequests++;

    // If in half-open state, check if we should close
    if (circuit.state === 'half-open') {
      if (circuit.successes >= opts.successThreshold) {
        circuit.state = 'closed';
        circuit.failures = 0;
        circuit.successes = 0;
        logger.info({ circuitName, state: 'closed', successes: opts.successThreshold }, 'Circuit closed');
      }
    }
  }

  /**
   * Record failure
   */
  recordFailure(circuitName: string, options?: Partial<CircuitBreakerOptions>): void {
    const opts = { ...this.defaultOptions, ...options };
    const circuit = this.getOrCreateCircuit(circuitName);

    circuit.failures++;
    circuit.totalRequests++;
    circuit.lastFailureTime = new Date();

    // Check if we should open the circuit
    if (circuit.state === 'closed' || circuit.state === 'half-open') {
      if (circuit.failures >= opts.failureThreshold) {
        circuit.state = 'open';
        logger.error({ circuitName, state: 'open', failures: circuit.failures }, 'Circuit opened due to failures');
      }
    }
  }

  /**
   * Get or create circuit
   */
  private getOrCreateCircuit(circuitName: string): CircuitStats {
    if (!this.circuits.has(circuitName)) {
      this.circuits.set(circuitName, {
        failures: 0,
        successes: 0,
        totalRequests: 0,
        lastFailureTime: null,
        state: 'closed',
      });
    }

    return this.circuits.get(circuitName)!;
  }

  /**
   * Get circuit stats
   */
  getStats(circuitName: string): CircuitStats | null {
    return this.circuits.get(circuitName) || null;
  }

  /**
   * Get all circuit stats
   */
  getAllStats(): Record<string, CircuitStats> {
    const stats: Record<string, CircuitStats> = {};
    
    for (const [name, circuit] of Array.from(this.circuits.entries())) {
      stats[name] = circuit;
    }

    return stats;
  }

  /**
   * Reset circuit
   */
  reset(circuitName: string): void {
    const circuit = this.circuits.get(circuitName);
    
    if (circuit) {
      circuit.failures = 0;
      circuit.successes = 0;
      circuit.totalRequests = 0;
      circuit.lastFailureTime = null;
      circuit.state = 'closed';

      logger.info({ circuitName, state: 'closed' }, 'Circuit reset');
    }
  }

  /**
   * Reset all circuits
   */
  resetAll(): void {
    for (const [name] of Array.from(this.circuits.entries())) {
      this.reset(name);
    }
  }

  /**
   * Force open a circuit (for testing or maintenance)
   */
  forceOpen(circuitName: string): void {
    const circuit = this.getOrCreateCircuit(circuitName);
    circuit.state = 'open';
    circuit.lastFailureTime = new Date();
    logger.info({ circuitName, state: 'open', forced: true }, 'Circuit forcefully opened');
  }

  /**
   * Force close a circuit
   */
  forceClose(circuitName: string): void {
    const circuit = this.circuits.get(circuitName);
    
    if (circuit) {
      circuit.state = 'closed';
      circuit.failures = 0;
      circuit.successes = 0;
      logger.info({ circuitName, state: 'closed', forced: true }, 'Circuit forcefully closed');
    }
  }
}

// Singleton instance
export const circuitBreaker = new CircuitBreaker();

// Pre-configured circuit breaker middlewares
export const databaseCircuitBreaker = circuitBreaker.middleware('database', {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 30000, // 30 seconds
  fallbackResponse: {
    error: 'Database temporarily unavailable',
    message: 'Please try again in a few moments',
  },
});

export const externalAPICircuitBreaker = circuitBreaker.middleware('external-api', {
  failureThreshold: 3,
  successThreshold: 2,
  timeout: 60000, // 1 minute
  fallbackResponse: {
    error: 'External service temporarily unavailable',
    message: 'Using cached data or default values',
  },
});

export const aiServiceCircuitBreaker = circuitBreaker.middleware('ai-service', {
  failureThreshold: 2,
  successThreshold: 1,
  timeout: 120000, // 2 minutes
  fallbackResponse: {
    error: 'AI service temporarily unavailable',
    message: 'Using standard recommendations',
  },
});

export const storageCircuitBreaker = circuitBreaker.middleware('storage', {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 30000, // 30 seconds
  fallbackResponse: {
    error: 'Storage temporarily unavailable',
    message: 'Please try uploading later',
  },
});

export default circuitBreaker;
