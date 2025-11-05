/**
 * Event Bus - Core event-driven architecture component
 * 
 * Provides pub/sub pattern for decoupled communication between system components.
 * All events are automatically stored in the database for audit trail and replay.
 * 
 * Usage:
 *   await EventBus.publish('order.created', { orderId, userId, total });
 *   EventBus.subscribe('order.created', async (event) => { ... });
 */

import { EventEmitter } from 'events';
import { db } from '../db';
import { eventLog, type InsertEventLog } from '../../shared/schema';
import { eq, and, gte, lte, desc, inArray } from 'drizzle-orm';

/**
 * Event metadata structure
 */
export interface EventMetadata {
  ip?: string;
  userAgent?: string;
  source?: string; // 'api', 'ui', 'system', 'webhook'
  correlationId?: string; // For tracing related events
  [key: string]: any; // Allow additional metadata
}

/**
 * Complete event structure with all context
 */
export interface Event<T = any> {
  id: string;
  type: string;
  data: T;
  metadata?: EventMetadata;
  userId?: string;
  companyId?: string;
  timestamp: Date;
}

/**
 * Event handler function signature
 */
export type EventHandler<T = any> = (event: Event<T>) => Promise<void> | void;

/**
 * Event query filters
 */
export interface EventQuery {
  types?: string[];
  userId?: string;
  companyId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

/**
 * Central Event Bus for event-driven architecture
 * 
 * Features:
 * - Pub/sub pattern with EventEmitter
 * - Automatic event persistence to database
 * - Type-safe event handlers
 * - Event replay for debugging
 * - Query event history
 */
class EventBusClass extends EventEmitter {
  private isReplaying = false;

  constructor() {
    super();
    // Increase max listeners to avoid warnings
    this.setMaxListeners(100);
  }

  /**
   * Publish an event to all subscribers
   * Automatically stores event in database for audit trail
   * 
   * @param type - Event type (e.g., 'order.created')
   * @param data - Event-specific data
   * @param metadata - Additional context (IP, user agent, etc.)
   * @returns Event ID
   */
  async publish<T = any>(
    type: string,
    data: T,
    metadata?: EventMetadata
  ): Promise<string> {
    const event: Event<T> = {
      id: crypto.randomUUID(),
      type,
      data,
      metadata,
      userId: metadata?.userId,
      companyId: metadata?.companyId,
      timestamp: new Date(),
    };

    // Store event in database (unless replaying)
    if (!this.isReplaying) {
      try {
        await db.insert(eventLog).values({
          id: event.id,
          type: event.type,
          data: event.data,
          metadata: event.metadata || {},
          userId: event.userId,
          companyId: event.companyId,
          timestamp: event.timestamp,
        });
      } catch (error) {
        console.error(`Failed to store event ${type}:`, error);
        // Continue even if storage fails - don't block event handlers
      }
    }

    // Emit to subscribers
    this.emit(type, event);
    
    // Emit wildcard for global listeners
    this.emit('*', event);

    return event.id;
  }

  /**
   * Subscribe to specific event type
   * 
   * @param type - Event type to subscribe to (or '*' for all events)
   * @param handler - Handler function called when event is published
   */
  subscribe<T = any>(type: string, handler: EventHandler<T>): void {
    this.on(type, async (event: Event<T>) => {
      try {
        await handler(event);
      } catch (error) {
        console.error(`Error in event handler for ${type}:`, error);
        // Handlers don't block each other
      }
    });
  }

  /**
   * Subscribe to event type (runs once then unsubscribes)
   * 
   * @param type - Event type to subscribe to
   * @param handler - Handler function
   */
  subscribeOnce<T = any>(type: string, handler: EventHandler<T>): void {
    this.once(type, async (event: Event<T>) => {
      try {
        await handler(event);
      } catch (error) {
        console.error(`Error in one-time event handler for ${type}:`, error);
      }
    });
  }

  /**
   * Unsubscribe from event type
   * 
   * @param type - Event type
   * @param handler - Original handler function
   */
  unsubscribe<T = any>(type: string, handler: EventHandler<T>): void {
    this.off(type, handler);
  }

  /**
   * Query event history from database
   * 
   * @param query - Filter criteria
   * @returns Array of events matching query
   */
  async getEvents(query: EventQuery = {}): Promise<Event[]> {
    const conditions = [];

    if (query.types && query.types.length > 0) {
      conditions.push(inArray(eventLog.type, query.types));
    }

    if (query.userId) {
      conditions.push(eq(eventLog.userId, query.userId));
    }

    if (query.companyId) {
      conditions.push(eq(eventLog.companyId, query.companyId));
    }

    if (query.startDate) {
      conditions.push(gte(eventLog.timestamp, query.startDate));
    }

    if (query.endDate) {
      conditions.push(lte(eventLog.timestamp, query.endDate));
    }

    const events = await db
      .select()
      .from(eventLog)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(eventLog.timestamp))
      .limit(query.limit || 100);

    return events.map((e: typeof eventLog.$inferSelect) => ({
      id: e.id,
      type: e.type,
      data: e.data as any,
      metadata: (e.metadata as EventMetadata) || undefined,
      userId: e.userId || undefined,
      companyId: e.companyId || undefined,
      timestamp: e.timestamp,
    }));
  }

  /**
   * Replay events from history
   * Useful for debugging, testing, or rebuilding state
   * 
   * Events are re-published to subscribers but NOT stored again in database
   * 
   * @param eventIds - Specific event IDs to replay
   */
  async replayEvents(eventIds: string[]): Promise<void> {
    if (eventIds.length === 0) return;

    this.isReplaying = true;

    try {
      const events = await db
        .select()
        .from(eventLog)
        .where(inArray(eventLog.id, eventIds))
        .orderBy(eventLog.timestamp);

      for (const e of events) {
        const event: Event = {
          id: e.id,
          type: e.type,
          data: e.data as any,
          metadata: (e.metadata as EventMetadata) || undefined,
          userId: e.userId || undefined,
          companyId: e.companyId || undefined,
          timestamp: e.timestamp,
        };

        // Emit to subscribers
        this.emit(event.type, event);
        this.emit('*', event);
      }
    } finally {
      this.isReplaying = false;
    }
  }

  /**
   * Replay events matching query
   * 
   * @param query - Filter criteria for events to replay
   */
  async replayQuery(query: EventQuery): Promise<void> {
    const events = await this.getEvents(query);
    await this.replayEvents(events.map((e) => e.id));
  }

  /**
   * Get event statistics
   * 
   * @param startDate - Start of period
   * @param endDate - End of period
   * @returns Event counts by type
   */
  async getEventStats(
    startDate: Date,
    endDate: Date
  ): Promise<Record<string, number>> {
    const events = await db
      .select()
      .from(eventLog)
      .where(
        and(
          gte(eventLog.timestamp, startDate),
          lte(eventLog.timestamp, endDate)
        )
      );

    const stats: Record<string, number> = {};
    for (const event of events) {
      stats[event.type] = (stats[event.type] || 0) + 1;
    }

    return stats;
  }

  /**
   * Remove all listeners (for testing)
   */
  clearAllSubscriptions(): void {
    this.removeAllListeners();
  }
}

// Export singleton instance
export const EventBus = new EventBusClass();
