/**
 * Request Context Module
 *
 * Provides AsyncLocalStorage-based request context for automatic
 * propagation of correlation IDs, tenant info, and user context
 * throughout async operations.
 *
 * @module server/context
 */

export {
  requestContext,
  preserveContext,
  withContext,
  PreserveContext,
  type RequestContext,
} from './requestContext';
