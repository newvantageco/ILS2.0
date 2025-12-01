/**
 * Repository Factory and Middleware
 *
 * Central export for all repositories and factory function.
 * Provides middleware to attach tenant-scoped repositories to requests.
 *
 * SECURITY:
 * - All repositories are scoped to the tenant from request context
 * - Never instantiate repositories without a valid tenantId
 * - Repositories are created per-request to ensure proper isolation
 *
 * Usage:
 * ```typescript
 * // In routes
 * app.use('/api/orders', attachRepositories, orderRoutes);
 *
 * // In route handlers
 * const orders = await req.repos.orders.findAll();
 * ```
 */

import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { Repositories } from '../types/express';

// ============================================
// REPOSITORY IMPORTS
// ============================================

export { BaseRepository, type QueryOptions, type CreateOptions, type UpdateOptions } from './BaseRepository';
export { OrderRepository, type OrderWithDetails, type OrderSearchOptions, type OrderStats } from './OrderRepository';
export { PatientRepository, type PatientWithExaminations, type PatientSearchOptions } from './PatientRepository';
export { UserRepository, type UserWithRoles, type UserPreferences } from './UserRepository';
export { AIRepository, type ConversationWithMessages, type KnowledgeSearchResult, type LearningEntry } from './AIRepository';
export { AuthRepository } from './AuthRepository';
export { WorkerRepository } from './WorkerRepository';

// Import classes for factory
import { OrderRepository } from './OrderRepository';
import { PatientRepository } from './PatientRepository';
import { UserRepository } from './UserRepository';
import { AIRepository } from './AIRepository';
import { createLogger } from '../utils/logger';

const logger = createLogger('RepositoryFactory');

// ============================================
// TYPED REPOSITORIES INTERFACE
// ============================================

/**
 * Strongly-typed repositories interface
 * Extends the base Repositories interface with concrete types
 */
export interface TypedRepositories extends Repositories {
  orders: OrderRepository;
  patients: PatientRepository;
  users: UserRepository;
  ai: AIRepository;
}

// ============================================
// FACTORY FUNCTION
// ============================================

/**
 * Create all tenant-scoped repositories
 *
 * @param tenantId - The company ID for tenant isolation
 * @returns Object containing all initialized repositories
 *
 * @example
 * ```typescript
 * const repos = createRepositories('company-uuid');
 * const orders = await repos.orders.findAll();
 * ```
 */
export function createRepositories(tenantId: string): TypedRepositories {
  if (!tenantId) {
    throw new Error('Cannot create repositories without a tenantId');
  }

  return {
    orders: new OrderRepository(tenantId),
    patients: new PatientRepository(tenantId),
    users: new UserRepository(tenantId),
    ai: new AIRepository(tenantId),
  };
}

// ============================================
// MIDDLEWARE
// ============================================

/**
 * Middleware to attach repositories to the request object
 *
 * Must be used AFTER setTenantContext middleware.
 * Creates tenant-scoped repository instances for the request.
 *
 * @example
 * ```typescript
 * // Apply after authentication and tenant context
 * router.use(attachRepositories);
 *
 * // In handlers
 * router.get('/', async (req, res) => {
 *   const orders = await req.repos!.orders.findAll();
 *   res.json(orders);
 * });
 * ```
 */
export function attachRepositories(req: Request, res: Response, next: NextFunction): void {
  const tenantId = req.tenantId;

  if (!tenantId) {
    logger.warn({ path: req.path, method: req.method }, 'attachRepositories called without tenantId');
    // Don't fail - let routes handle missing tenant context if needed
    return next();
  }

  try {
    req.repos = createRepositories(tenantId);
    next();
  } catch (error) {
    logger.error({ error, tenantId }, 'Failed to create repositories');
    next(error);
  }
}

/**
 * Higher-order function to create repository middleware with options
 *
 * @param options - Configuration options
 * @returns Express middleware function
 *
 * @example
 * ```typescript
 * // Require repositories (fail if no tenant)
 * router.use(withRepositories({ required: true }));
 * ```
 */
export function withRepositories(options: {
  required?: boolean;
  lazy?: boolean;
} = {}): RequestHandler {
  const { required = false, lazy = false } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    const tenantId = req.tenantId;

    if (!tenantId) {
      if (required) {
        res.status(401).json({
          error: 'Authentication required',
          message: 'Tenant context is required for this endpoint',
        });
        return;
      }
      return next();
    }

    if (lazy) {
      // Create repositories lazily on first access
      let repos: TypedRepositories | null = null;
      Object.defineProperty(req, 'repos', {
        get() {
          if (!repos) {
            repos = createRepositories(tenantId);
          }
          return repos;
        },
        configurable: true,
      });
    } else {
      // Create repositories immediately
      req.repos = createRepositories(tenantId);
    }

    next();
  };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get repositories from request, creating them if needed
 * Useful in situations where middleware may not have run
 *
 * @param req - Express request object
 * @returns Repositories or undefined if no tenant context
 */
export function getRepositories(req: Request): TypedRepositories | undefined {
  if (req.repos) {
    return req.repos as TypedRepositories;
  }

  const tenantId = req.tenantId;
  if (!tenantId) {
    return undefined;
  }

  const repos = createRepositories(tenantId);
  req.repos = repos;
  return repos;
}

/**
 * Ensure repositories exist on request, throwing if not
 *
 * @param req - Express request object
 * @returns Repositories
 * @throws Error if no tenant context
 */
export function requireRepositories(req: Request): TypedRepositories {
  const repos = getRepositories(req);
  if (!repos) {
    throw new Error('Repositories not available - missing tenant context');
  }
  return repos;
}

// ============================================
// DEFAULT EXPORT
// ============================================

export default {
  createRepositories,
  attachRepositories,
  withRepositories,
  getRepositories,
  requireRepositories,
};
