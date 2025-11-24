/**
 * Event Handlers Index
 * 
 * Centralizes all event handler initialization.
 */

import { initializeEmailHandlers } from './emailHandler';
import { initializeNotificationHandlers } from './notificationHandler';
import { initializeMetricsHandlers } from './metricsHandler';
import { initializeAuditHandlers } from './auditHandler';
import logger from '../utils/logger';


/**
 * Initialize all event handlers
 */
export function initializeAllEventHandlers() {
  logger.info('🔧 Initializing event handlers...');
  
  initializeEmailHandlers();
  initializeNotificationHandlers();
  initializeMetricsHandlers();
  initializeAuditHandlers();
  
  logger.info('✅ All event handlers initialized successfully');
}
