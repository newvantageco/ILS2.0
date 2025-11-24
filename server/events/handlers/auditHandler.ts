/**
 * Audit Event Handler
 * 
 * Logs security-relevant events for audit compliance.
 * Events are already stored in event_log table, this handler provides
 * additional audit-specific processing and alerting.
 */

import { EventBus } from '../EventBus';
import logger from '../../utils/logger';
import type {
  UserCreatedData,
  UserUpdatedData,
  UserLoginData,
  OrderCreatedData,
  OrderCancelledData,
  MarketplaceConnectionApprovedData,
} from '../events';

/**
 * Initialize audit event handlers
 */
export function initializeAuditHandlers() {
  // Audit user creation
  EventBus.subscribe<UserCreatedData>('user.created', async (event) => {
    logger.info(`[AUDIT] User created: ${event.data.email} by ${event.data.createdBy || 'system'}`);
  });

  // Audit user updates
  EventBus.subscribe<UserUpdatedData>('user.updated', async (event) => {
    logger.info(`[AUDIT] User ${event.data.userId} updated by ${event.data.updatedBy}:`, event.data.changes);
  });

  // Audit login attempts
  EventBus.subscribe<UserLoginData>('user.login', async (event) => {
    if (event.data.success) {
      logger.info(`[AUDIT] Successful login: ${event.data.email} via ${event.data.loginMethod}`);
    } else {
      logger.info(`[AUDIT] Failed login: ${event.data.email} - ${event.data.failureReason}`);
    }
  });

  // Audit order creation (financial transaction)
  EventBus.subscribe<OrderCreatedData>('order.created', async (event) => {
    logger.info(`[AUDIT] Order created: ${event.data.orderId} - Total: ${event.data.total}`);
  });

  // Audit order cancellations
  EventBus.subscribe<OrderCancelledData>('order.cancelled', async (event) => {
    logger.info(`[AUDIT] Order cancelled: ${event.data.orderId} by ${event.data.cancelledBy} - Reason: ${event.data.reason}`);
  });

  // Audit marketplace connections
  EventBus.subscribe<MarketplaceConnectionApprovedData>('marketplace.connection_approved', async (event) => {
    logger.info(`[AUDIT] Marketplace connection approved: ${event.data.requestorCompanyId} -> ${event.data.targetCompanyId}`);
  });

  logger.info('✅ Audit event handlers initialized');
}
