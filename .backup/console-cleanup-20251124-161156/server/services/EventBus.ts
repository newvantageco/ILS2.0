/**
 * Event Bus Service
 * 
 * Implements a simple in-memory pub/sub pattern for domain events.
 * Allows services to publish events and subscribe to them without tight coupling.
 * 
 * For production, this can be replaced with:
 * - Redis Pub/Sub
 * - AWS SNS/SQS
 * - RabbitMQ
 * - Apache Kafka
 */

import { EventEmitter } from 'events';
import { createLogger, type Logger } from '../utils/logger';
import type { EventType, EventTypeMap, EventDataFor } from '../events/events';

type EventHandler<T extends EventType> = (data: EventDataFor<T>) => void | Promise<void>;

interface EventSubscription {
  eventType: string;
  handler: Function;
  id: string;
}

class EventBus {
  private emitter: EventEmitter;
  private logger: Logger;
  private subscriptions: Map<string, EventSubscription[]>;

  constructor() {
    this.emitter = new EventEmitter();
    this.logger = createLogger('EventBus');
    this.subscriptions = new Map();

    // Increase max listeners (useful for systems with many subscribers)
    this.emitter.setMaxListeners(100);
  }

  /**
   * Publish an event
   * 
   * @example
   * eventBus.publish('product.stock_updated', {
   *   productId: '123',
   *   oldStock: 10,
   *   newStock: 5,
   *   companyId: 'abc',
   * });
   */
  publish<T extends EventType>(eventType: T, data: EventDataFor<T>): void {
    try {
      this.logger.debug(`Publishing event: ${eventType}`, { data });

      // Emit the event
      this.emitter.emit(eventType, data);

      // Also emit a generic 'event' for monitoring/logging
      this.emitter.emit('*', { type: eventType, data, timestamp: new Date() });
    } catch (error) {
      this.logger.error(`Failed to publish event: ${eventType}`, error as Error);
    }
  }

  /**
   * Subscribe to an event
   * 
   * @example
   * const unsubscribe = eventBus.subscribe('product.stock_updated', async (data) => {
   *   await shopifyService.syncProductToShopify(data.productId, data.companyId);
   * });
   * 
   * // Later, to unsubscribe:
   * unsubscribe();
   */
  subscribe<T extends EventType>(
    eventType: T,
    handler: EventHandler<T>
  ): () => void {
    const subscriptionId = this.generateSubscriptionId();

    // Wrap handler with error handling
    const wrappedHandler = async (data: EventDataFor<T>) => {
      try {
        this.logger.debug(`Handling event: ${eventType}`, {
          subscriptionId,
          data,
        });

        await handler(data);
      } catch (error) {
        this.logger.error(
          `Error in event handler for ${eventType}`,
          error as Error,
          { subscriptionId, data }
        );
      }
    };

    // Register subscription
    this.emitter.on(eventType, wrappedHandler);

    // Track subscription for debugging
    const subscription: EventSubscription = {
      eventType,
      handler: wrappedHandler,
      id: subscriptionId,
    };

    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, []);
    }
    this.subscriptions.get(eventType)!.push(subscription);

    this.logger.info(`Subscribed to event: ${eventType}`, { subscriptionId });

    // Return unsubscribe function
    return () => {
      this.emitter.off(eventType, wrappedHandler);

      const subs = this.subscriptions.get(eventType) || [];
      const index = subs.findIndex((s) => s.id === subscriptionId);
      if (index !== -1) {
        subs.splice(index, 1);
      }

      this.logger.info(`Unsubscribed from event: ${eventType}`, {
        subscriptionId,
      });
    };
  }

  /**
   * Subscribe to all events (useful for logging/monitoring)
   * 
   * @example
   * eventBus.subscribeAll((event) => {
   *   console.log(`Event: ${event.type}`, event.data);
   * });
   */
  subscribeAll(
    handler: (event: {
      type: string;
      data: any;
      timestamp: Date;
    }) => void | Promise<void>
  ): () => void {
    const wrappedHandler = async (event: any) => {
      try {
        await handler(event);
      } catch (error) {
        this.logger.error('Error in global event handler', error as Error);
      }
    };

    this.emitter.on('*', wrappedHandler);

    return () => {
      this.emitter.off('*', wrappedHandler);
    };
  }

  /**
   * Wait for an event (useful for testing or synchronous workflows)
   * 
   * @example
   * const data = await eventBus.waitFor('order.created', { timeout: 5000 });
   */
  waitFor<T extends EventType>(
    eventType: T,
    options: { timeout?: number } = {}
  ): Promise<EventDataFor<T>> {
    const { timeout = 10000 } = options;

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.emitter.off(eventType, listener);
        reject(new Error(`Timeout waiting for event: ${eventType}`));
      }, timeout);

      const listener = (data: EventDataFor<T>) => {
        clearTimeout(timer);
        this.emitter.off(eventType, listener);
        resolve(data);
      };

      this.emitter.once(eventType, listener);
    });
  }

  /**
   * Get all subscriptions (for debugging)
   */
  getSubscriptions(): Map<string, EventSubscription[]> {
    return this.subscriptions;
  }

  /**
   * Get subscription count for a specific event
   */
  getSubscriptionCount(eventType: string): number {
    return this.subscriptions.get(eventType)?.length || 0;
  }

  /**
   * Clear all subscriptions (useful for testing)
   */
  clearAll(): void {
    this.emitter.removeAllListeners();
    this.subscriptions.clear();
    this.logger.info('All event subscriptions cleared');
  }

  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

// Singleton instance
export const eventBus = new EventBus();

/**
 * Initialize event handlers
 * 
 * This is where we wire up all the domain event handlers.
 * Called during server startup.
 */
export function initializeEventHandlers(): void {
  const logger = createLogger('EventHandlers');

  // Example: Log all events for debugging
  if (process.env.LOG_EVENTS === 'true') {
    eventBus.subscribeAll((event) => {
      logger.debug(`Event: ${event.type}`, { data: event.data });
    });
  }

  // NOTE: Specific handlers will be registered by their respective services
  // For example:
  // - ShopifyService registers handlers for product.stock_updated
  // - ClinicalAnomalyService registers handlers for examination.completed
  // - BillingService registers handlers for usage.recorded

  logger.info('Event handlers initialized');
}

// Export types for convenience
export type { EventType, EventTypeMap, EventDataFor };
