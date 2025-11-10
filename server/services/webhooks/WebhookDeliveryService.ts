/**
 * Webhook Delivery Service
 *
 * Handles reliable webhook event delivery with retries and failure tracking
 */

import axios, { AxiosError } from 'axios';
import crypto from 'crypto';
import { loggers } from '../../utils/logger.js';
import { db } from '../../db.js';
import { eq, and } from 'drizzle-orm';

const logger = loggers.api;

/**
 * Webhook Event
 */
export interface WebhookEvent {
  id?: string;
  webhookId: string;
  eventType: string;
  payload: Record<string, any>;
  deliveryAttempts?: number;
  lastAttemptAt?: Date;
  deliveredAt?: Date;
  failedAt?: Date;
  errorMessage?: string;
  createdAt?: Date;
}

/**
 * Webhook Subscription
 */
export interface WebhookSubscription {
  id: string;
  companyId: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Delivery Result
 */
export interface DeliveryResult {
  success: boolean;
  statusCode?: number;
  responseTime: number;
  errorMessage?: string;
  attempt: number;
}

/**
 * Webhook Delivery Service
 */
export class WebhookDeliveryService {
  /**
   * Maximum delivery attempts before marking as failed
   */
  private static readonly MAX_ATTEMPTS = 3;

  /**
   * Timeout for webhook delivery (ms)
   */
  private static readonly DELIVERY_TIMEOUT = 10000; // 10 seconds

  /**
   * Retry delays (exponential backoff)
   */
  private static readonly RETRY_DELAYS = [1000, 5000, 30000]; // 1s, 5s, 30s

  /**
   * In-memory webhook store (use database in production)
   */
  private static webhookSubscriptions = new Map<string, WebhookSubscription>();

  /**
   * In-memory event queue (use Redis/BullMQ in production)
   */
  private static eventQueue: WebhookEvent[] = [];

  /**
   * Register a webhook subscription
   */
  static async registerWebhook(
    companyId: string,
    url: string,
    events: string[]
  ): Promise<WebhookSubscription> {
    // Validate URL
    try {
      new URL(url);
    } catch (error) {
      throw new Error('Invalid webhook URL');
    }

    // Validate events
    if (!events || events.length === 0) {
      throw new Error('At least one event type is required');
    }

    // Generate webhook secret for signature verification
    const secret = this.generateSecret();

    const webhook: WebhookSubscription = {
      id: crypto.randomUUID(),
      companyId,
      url,
      events,
      secret,
      active: true,
      createdAt: new Date(),
    };

    // Store webhook (in production, save to database)
    this.webhookSubscriptions.set(webhook.id, webhook);

    logger.info({ webhookId: webhook.id, url, events }, 'Webhook registered');

    return webhook;
  }

  /**
   * Get webhooks for a company
   */
  static async getWebhooks(companyId: string): Promise<WebhookSubscription[]> {
    return Array.from(this.webhookSubscriptions.values()).filter(
      (webhook) => webhook.companyId === companyId
    );
  }

  /**
   * Get webhook by ID
   */
  static async getWebhook(webhookId: string): Promise<WebhookSubscription | null> {
    return this.webhookSubscriptions.get(webhookId) || null;
  }

  /**
   * Update webhook
   */
  static async updateWebhook(
    webhookId: string,
    updates: Partial<WebhookSubscription>
  ): Promise<WebhookSubscription> {
    const webhook = this.webhookSubscriptions.get(webhookId);

    if (!webhook) {
      throw new Error('Webhook not found');
    }

    const updated = {
      ...webhook,
      ...updates,
      updatedAt: new Date(),
    };

    this.webhookSubscriptions.set(webhookId, updated);

    logger.info({ webhookId, updates }, 'Webhook updated');

    return updated;
  }

  /**
   * Delete webhook
   */
  static async deleteWebhook(webhookId: string): Promise<boolean> {
    const deleted = this.webhookSubscriptions.delete(webhookId);

    if (deleted) {
      logger.info({ webhookId }, 'Webhook deleted');
    }

    return deleted;
  }

  /**
   * Trigger webhook event
   */
  static async triggerEvent(
    companyId: string,
    eventType: string,
    payload: Record<string, any>
  ): Promise<void> {
    // Find webhooks subscribed to this event type
    const webhooks = Array.from(this.webhookSubscriptions.values()).filter(
      (webhook) =>
        webhook.companyId === companyId &&
        webhook.active &&
        (webhook.events.includes(eventType) || webhook.events.includes('*'))
    );

    if (webhooks.length === 0) {
      logger.debug({ companyId, eventType }, 'No webhooks subscribed to event');
      return;
    }

    // Queue events for delivery
    for (const webhook of webhooks) {
      const event: WebhookEvent = {
        id: crypto.randomUUID(),
        webhookId: webhook.id,
        eventType,
        payload,
        deliveryAttempts: 0,
        createdAt: new Date(),
      };

      this.eventQueue.push(event);

      logger.info({ webhookId: webhook.id, eventType }, 'Webhook event queued');

      // Deliver immediately (in production, use background job queue)
      this.deliverEvent(event, webhook).catch((error) => {
        logger.error({ eventId: event.id, error }, 'Failed to deliver webhook event');
      });
    }
  }

  /**
   * Deliver a webhook event
   */
  private static async deliverEvent(
    event: WebhookEvent,
    webhook: WebhookSubscription
  ): Promise<DeliveryResult> {
    const attempt = (event.deliveryAttempts || 0) + 1;

    logger.info(
      { eventId: event.id, webhookId: webhook.id, attempt },
      'Delivering webhook event'
    );

    const startTime = Date.now();

    try {
      // Prepare webhook payload
      const webhookPayload = {
        id: event.id,
        event: event.eventType,
        created_at: event.createdAt,
        data: event.payload,
      };

      // Generate signature for verification
      const signature = this.generateSignature(webhookPayload, webhook.secret);

      // Send webhook request
      const response = await axios.post(webhook.url, webhookPayload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': event.eventType,
          'X-Webhook-Id': event.id,
          'User-Agent': 'ILS-Webhook/1.0',
        },
        timeout: this.DELIVERY_TIMEOUT,
        validateStatus: (status) => status >= 200 && status < 300,
      });

      const responseTime = Date.now() - startTime;

      // Mark as delivered
      event.deliveredAt = new Date();
      event.deliveryAttempts = attempt;
      event.lastAttemptAt = new Date();

      logger.info(
        {
          eventId: event.id,
          webhookId: webhook.id,
          statusCode: response.status,
          responseTime,
        },
        'Webhook delivered successfully'
      );

      return {
        success: true,
        statusCode: response.status,
        responseTime,
        attempt,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage =
        error instanceof AxiosError
          ? `HTTP ${error.response?.status}: ${error.message}`
          : error instanceof Error
          ? error.message
          : 'Unknown error';

      event.deliveryAttempts = attempt;
      event.lastAttemptAt = new Date();
      event.errorMessage = errorMessage;

      logger.error(
        {
          eventId: event.id,
          webhookId: webhook.id,
          attempt,
          errorMessage,
        },
        'Webhook delivery failed'
      );

      // Retry if attempts remaining
      if (attempt < this.MAX_ATTEMPTS) {
        const retryDelay = this.RETRY_DELAYS[attempt - 1] || 30000;

        logger.info(
          { eventId: event.id, retryDelay, nextAttempt: attempt + 1 },
          'Scheduling webhook retry'
        );

        // Schedule retry (in production, use background job queue)
        setTimeout(() => {
          this.deliverEvent(event, webhook).catch((retryError) => {
            logger.error(
              { eventId: event.id, retryError },
              'Webhook retry failed'
            );
          });
        }, retryDelay);
      } else {
        // Max attempts reached, mark as failed
        event.failedAt = new Date();

        logger.error(
          { eventId: event.id, webhookId: webhook.id },
          'Webhook delivery failed permanently'
        );

        // Optionally disable webhook after repeated failures
        // await this.updateWebhook(webhook.id, { active: false });
      }

      return {
        success: false,
        statusCode: error instanceof AxiosError ? error.response?.status : undefined,
        responseTime,
        errorMessage,
        attempt,
      };
    }
  }

  /**
   * Test webhook delivery
   */
  static async testWebhook(webhookId: string): Promise<DeliveryResult> {
    const webhook = await this.getWebhook(webhookId);

    if (!webhook) {
      throw new Error('Webhook not found');
    }

    // Create test event
    const testEvent: WebhookEvent = {
      id: `test_${crypto.randomUUID()}`,
      webhookId: webhook.id,
      eventType: 'webhook.test',
      payload: {
        message: 'This is a test webhook event',
        timestamp: new Date().toISOString(),
      },
      deliveryAttempts: 0,
      createdAt: new Date(),
    };

    return this.deliverEvent(testEvent, webhook);
  }

  /**
   * Generate webhook secret
   */
  private static generateSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate HMAC signature for webhook payload
   */
  private static generateSignature(payload: any, secret: string): string {
    const payloadString = JSON.stringify(payload);
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payloadString);
    return `sha256=${hmac.digest('hex')}`;
  }

  /**
   * Verify webhook signature
   */
  static verifySignature(
    payload: any,
    signature: string,
    secret: string
  ): boolean {
    const expectedSignature = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Get webhook delivery statistics
   */
  static async getWebhookStats(webhookId: string): Promise<{
    totalEvents: number;
    delivered: number;
    failed: number;
    pending: number;
  }> {
    const events = this.eventQueue.filter((e) => e.webhookId === webhookId);

    return {
      totalEvents: events.length,
      delivered: events.filter((e) => e.deliveredAt).length,
      failed: events.filter((e) => e.failedAt).length,
      pending: events.filter((e) => !e.deliveredAt && !e.failedAt).length,
    };
  }

  /**
   * Get recent webhook events
   */
  static async getWebhookEvents(
    webhookId: string,
    limit: number = 50
  ): Promise<WebhookEvent[]> {
    return this.eventQueue
      .filter((e) => e.webhookId === webhookId)
      .slice(-limit)
      .reverse();
  }

  /**
   * Clean up old events (run periodically)
   */
  static cleanupOldEvents(olderThanDays: number = 30): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const before = this.eventQueue.length;

    this.eventQueue = this.eventQueue.filter((event) => {
      const eventDate = event.createdAt || new Date(0);
      return eventDate >= cutoffDate;
    });

    const removed = before - this.eventQueue.length;

    if (removed > 0) {
      logger.info({ removed }, 'Cleaned up old webhook events');
    }

    return removed;
  }
}
