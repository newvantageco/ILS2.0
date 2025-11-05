/**
 * Webhook Manager
 * 
 * Manages webhook subscriptions and delivers events to external systems.
 * Features HMAC signature verification and automatic retry logic.
 */

import crypto from 'crypto';
import { db } from '../../db';
import { webhookSubscriptions, webhookDeliveries } from '../../../shared/schema';
import type { Event } from '../EventBus';
import { eq } from 'drizzle-orm';
import { EventBus } from '../EventBus';

/**
 * Webhook subscription configuration
 */
export interface WebhookSubscription {
  id: string;
  companyId: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
}

/**
 * Webhook Manager Class
 */
export class WebhookManager {
  /**
   * Register a new webhook subscription
   */
  static async register(
    companyId: string,
    url: string,
    events: string[],
    secret?: string
  ): Promise<string> {
    const webhookSecret = secret || crypto.randomBytes(32).toString('hex');
    
    const [subscription] = await db.insert(webhookSubscriptions).values({
      id: crypto.randomUUID(),
      companyId,
      url,
      events,
      secret: webhookSecret,
      active: true,
    }).returning();

    console.log(`✅ Webhook registered: ${subscription.id} for company ${companyId}`);
    
    return subscription.id;
  }

  /**
   * Unregister (deactivate) a webhook subscription
   */
  static async unregister(subscriptionId: string): Promise<void> {
    await db
      .update(webhookSubscriptions)
      .set({ active: false })
      .where(eq(webhookSubscriptions.id, subscriptionId));

    console.log(`❌ Webhook unregistered: ${subscriptionId}`);
  }

  /**
   * Get all active subscriptions for a company
   */
  static async getSubscriptions(companyId: string): Promise<WebhookSubscription[]> {
    const subs = await db
      .select()
      .from(webhookSubscriptions)
      .where(eq(webhookSubscriptions.companyId, companyId));

    return subs.map((s) => ({
      id: s.id,
      companyId: s.companyId,
      url: s.url,
      events: s.events || [],
      secret: s.secret,
      active: s.active,
    }));
  }

  /**
   * Send event to all matching webhook subscriptions
   */
  static async sendToSubscribers(event: any): Promise<void> {
    // Get subscriptions for this company and event type
    const allSubs = await db
      .select()
      .from(webhookSubscriptions)
      .where(eq(webhookSubscriptions.active, true));

    // Filter subscriptions that match event type and company
    const matchingSubs = allSubs.filter((sub) => {
      const matchesCompany = !event.companyId || sub.companyId === event.companyId;
      const matchesEvent = sub.events?.includes(event.type) || sub.events?.includes('*');
      return matchesCompany && matchesEvent;
    });

    // Send to each matching subscription
    const deliveries = matchingSubs.map((sub) =>
      this.deliver(sub, event)
    );

    await Promise.allSettled(deliveries);
  }

  /**
   * Deliver event to specific webhook
   */
  static async deliver(
    subscription: typeof webhookSubscriptions.$inferSelect,
    event: any
  ): Promise<void> {
    const deliveryId = crypto.randomUUID();

    try {
      // Generate HMAC signature
      const signature = this.generateSignature(event, subscription.secret);

      // Send HTTP request
      const response = await fetch(subscription.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Id': subscription.id,
          'X-Event-Type': event.type,
          'User-Agent': 'IntegratedLensSystem-Webhooks/1.0',
        },
        body: JSON.stringify({
          id: event.id,
          type: event.type,
          data: event.data,
          timestamp: event.timestamp,
          companyId: event.companyId,
          userId: event.userId,
        }),
      });

      // Log delivery
      await db.insert(webhookDeliveries).values({
        id: deliveryId,
        subscriptionId: subscription.id,
        eventId: event.id,
        status: response.ok ? 'success' : 'failed',
        responseCode: response.status,
        errorMessage: response.ok ? null : await response.text(),
        deliveredAt: response.ok ? new Date() : null,
        attempts: 1,
      });

      if (response.ok) {
        console.log(`✅ Webhook delivered: ${deliveryId} to ${subscription.url}`);
      } else {
        console.error(`❌ Webhook failed: ${deliveryId} - Status ${response.status}`);
        // Schedule retry
        await this.scheduleRetry(deliveryId, subscription, event);
      }
    } catch (error) {
      console.error(`❌ Webhook delivery error: ${deliveryId}`, error);

      // Log failed delivery
      await db.insert(webhookDeliveries).values({
        id: deliveryId,
        subscriptionId: subscription.id,
        eventId: event.id,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        attempts: 1,
        nextRetryAt: new Date(Date.now() + 60000), // Retry in 1 minute
      });

      // Schedule retry
      await this.scheduleRetry(deliveryId, subscription, event);
    }
  }

  /**
   * Generate HMAC signature for webhook payload
   */
  private static generateSignature(event: any, secret: string): string {
    const payload = JSON.stringify({
      id: event.id,
      type: event.type,
      data: event.data,
      timestamp: event.timestamp,
    });

    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  /**
   * Verify webhook signature (for incoming webhooks)
   */
  static verifySignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    );
  }

  /**
   * Schedule retry for failed delivery
   */
  private static async scheduleRetry(
    deliveryId: string,
    subscription: typeof webhookSubscriptions.$inferSelect,
    event: any
  ): Promise<void> {
    // Get delivery record
    const delivery = await db
      .select()
      .from(webhookDeliveries)
      .where(eq(webhookDeliveries.id, deliveryId))
      .then((rows) => rows[0]);

    if (!delivery) return;

    const attempts = delivery.attempts || 1;
    const maxAttempts = 5;

    if (attempts >= maxAttempts) {
      console.error(`❌ Webhook max retries reached: ${deliveryId}`);
      return;
    }

    // Exponential backoff: 1min, 5min, 15min, 1hr, 4hr
    const delays = [60000, 300000, 900000, 3600000, 14400000];
    const nextRetry = new Date(Date.now() + delays[attempts - 1] || 3600000);

    await db
      .update(webhookDeliveries)
      .set({
        nextRetryAt: nextRetry,
        status: 'retrying',
      })
      .where(eq(webhookDeliveries.id, deliveryId));

    console.log(`🔄 Webhook retry scheduled: ${deliveryId} at ${nextRetry.toISOString()}`);

    // Actually schedule the retry (simplified - in production use a queue)
    setTimeout(() => {
      this.retryDelivery(deliveryId, subscription, event);
    }, delays[attempts - 1] || 3600000);
  }

  /**
   * Retry failed delivery
   */
  private static async retryDelivery(
    deliveryId: string,
    subscription: typeof webhookSubscriptions.$inferSelect,
    event: any
  ): Promise<void> {
    console.log(`🔄 Retrying webhook delivery: ${deliveryId}`);

    try {
      const signature = this.generateSignature(event, subscription.secret);

      const response = await fetch(subscription.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Id': subscription.id,
          'X-Event-Type': event.type,
          'X-Retry-Attempt': 'true',
        },
        body: JSON.stringify({
          id: event.id,
          type: event.type,
          data: event.data,
          timestamp: event.timestamp,
        }),
      });

      const delivery = await db
        .select()
        .from(webhookDeliveries)
        .where(eq(webhookDeliveries.id, deliveryId))
        .then((rows) => rows[0]);

      await db
        .update(webhookDeliveries)
        .set({
          status: response.ok ? 'success' : 'failed',
          responseCode: response.status,
          errorMessage: response.ok ? null : await response.text(),
          deliveredAt: response.ok ? new Date() : null,
          attempts: (delivery?.attempts || 0) + 1,
        })
        .where(eq(webhookDeliveries.id, deliveryId));

      if (response.ok) {
        console.log(`✅ Webhook retry successful: ${deliveryId}`);
      } else {
        console.error(`❌ Webhook retry failed: ${deliveryId}`);
        // Schedule another retry
        await this.scheduleRetry(deliveryId, subscription, event);
      }
    } catch (error) {
      console.error(`❌ Webhook retry error: ${deliveryId}`, error);
      const delivery = await db
        .select()
        .from(webhookDeliveries)
        .where(eq(webhookDeliveries.id, deliveryId))
        .then((rows) => rows[0]);

      await db
        .update(webhookDeliveries)
        .set({
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          attempts: (delivery?.attempts || 0) + 1,
        })
        .where(eq(webhookDeliveries.id, deliveryId));

      // Schedule another retry
      await this.scheduleRetry(deliveryId, subscription, event);
    }
  }

  /**
   * Initialize webhook event listener
   */
  static initialize(): void {
    // Subscribe to all events
    EventBus.subscribe('*', async (event: any) => {
      await this.sendToSubscribers(event);
    });

    console.log('✅ Webhook manager initialized');
  }
}
