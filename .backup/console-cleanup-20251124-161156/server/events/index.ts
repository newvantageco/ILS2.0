/**
 * Event System Initialization
 * 
 * Centralizes initialization of all event system components.
 * Call this once during server startup.
 */

import { initializeAllEventHandlers } from './handlers';
import { WebhookManager } from './webhooks/WebhookManager';
import { WebSocketBroadcaster } from './websocket/WebSocketBroadcaster';

/**
 * Initialize complete event system
 */
export function initializeEventSystem() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('🚀 Initializing Event-Driven Architecture (Chunk 9)');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  // Initialize event handlers
  initializeAllEventHandlers();

  // Initialize webhook manager
  WebhookManager.initialize();

  // Initialize WebSocket broadcaster
  WebSocketBroadcaster.initialize();

  console.log('');
  console.log('✅ Event system fully initialized');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
}

export { EventBus } from './EventBus';
export { WebhookManager } from './webhooks/WebhookManager';
export { WebSocketBroadcaster } from './websocket/WebSocketBroadcaster';
export * from './events';
