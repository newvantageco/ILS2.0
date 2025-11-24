/**
 * Event System Initialization
 * 
 * Centralizes initialization of all event system components.
 * Call this once during server startup.
 */

import { initializeAllEventHandlers } from './handlers';
import { WebhookManager } from './webhooks/WebhookManager';
import { WebSocketBroadcaster } from './websocket/WebSocketBroadcaster';
import logger from '../utils/logger';


/**
 * Initialize complete event system
 */
export function initializeEventSystem() {
  logger.info('');
  logger.info('═══════════════════════════════════════════════════');
  logger.info('🚀 Initializing Event-Driven Architecture (Chunk 9)');
  logger.info('═══════════════════════════════════════════════════');
  logger.info('');

  // Initialize event handlers
  initializeAllEventHandlers();

  // Initialize webhook manager
  WebhookManager.initialize();

  // Initialize WebSocket broadcaster
  WebSocketBroadcaster.initialize();

  logger.info('');
  logger.info('✅ Event system fully initialized');
  logger.info('═══════════════════════════════════════════════════');
  logger.info('');
}

export { EventBus } from './EventBus';
export { WebhookManager } from './webhooks/WebhookManager';
export { WebSocketBroadcaster } from './websocket/WebSocketBroadcaster';
export * from './events';
