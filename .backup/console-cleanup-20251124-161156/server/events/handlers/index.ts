/**
 * Event Handlers Index
 * 
 * Centralizes all event handler initialization.
 */

import { initializeEmailHandlers } from './emailHandler';
import { initializeNotificationHandlers } from './notificationHandler';
import { initializeMetricsHandlers } from './metricsHandler';
import { initializeAuditHandlers } from './auditHandler';

/**
 * Initialize all event handlers
 */
export function initializeAllEventHandlers() {
  console.log('🔧 Initializing event handlers...');
  
  initializeEmailHandlers();
  initializeNotificationHandlers();
  initializeMetricsHandlers();
  initializeAuditHandlers();
  
  console.log('✅ All event handlers initialized successfully');
}
