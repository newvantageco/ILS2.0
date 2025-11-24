/**
 * Notification Event Handler
 * 
 * Creates in-app notifications triggered by events.
 * Integrates with existing notification system.
 */

import { EventBus } from '../EventBus';
import type {
  OrderCreatedData,
  OrderShippedData,
  OrderDeliveredData,
  OrderCancelledData,
  ProductLowStockData,
  ProductOutOfStockData,
  AiAnomalyDetectedData,
  AiRecommendationGeneratedData,
  MarketplaceConnectionRequestedData,
  MarketplaceConnectionApprovedData,
} from '../events';
import { db } from '../../db';
import { notifications } from '../../../shared/schema';
import logger from '../utils/logger';


/**
 * Helper to create notification
 */
async function createNotification(data: {
  userId?: string;
  companyId?: string;
  type: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  actionUrl?: string;
  eventId: string;
}) {
  try {
    await db.insert(notifications).values({
      type: data.type as any, // Cast to avoid enum issues
      severity: data.severity as 'low' | 'medium' | 'high', // Map to schema enum
      title: data.title,
      message: data.message,
      target: {
        userId: data.userId,
        companyId: data.companyId,
        actionUrl: data.actionUrl,
        eventId: data.eventId,
      },
      read: false,
    });
  } catch (error) {
    logger.error('Failed to create notification:', error);
  }
}

/**
 * Initialize notification event handlers
 */
export function initializeNotificationHandlers() {
  // Order created notification
  EventBus.subscribe<OrderCreatedData>('order.created', async (event) => {
    await createNotification({
      userId: event.data.userId,
      companyId: event.data.companyId,
      type: 'order_update',
      severity: 'success',
      title: 'Order Created',
      message: `Your order #${event.data.orderId.slice(0, 8)} has been created successfully.`,
      actionUrl: `/orders/${event.data.orderId}`,
      eventId: event.id,
    });
  });

  // Order shipped notification
  EventBus.subscribe<OrderShippedData>('order.shipped', async (event) => {
    const trackingInfo = event.data.trackingNumber
      ? ` (Tracking: ${event.data.trackingNumber})`
      : '';
    
    await createNotification({
      userId: event.data.userId,
      companyId: event.data.companyId,
      type: 'order_update',
      severity: 'info',
      title: 'Order Shipped',
      message: `Your order has been shipped${trackingInfo}.`,
      actionUrl: `/orders/${event.data.orderId}`,
      eventId: event.id,
    });
  });

  // Order delivered notification
  EventBus.subscribe<OrderDeliveredData>('order.delivered', async (event) => {
    await createNotification({
      userId: event.data.userId,
      companyId: event.data.companyId,
      type: 'order_update',
      severity: 'success',
      title: 'Order Delivered',
      message: 'Your order has been delivered. Please share your feedback!',
      actionUrl: `/orders/${event.data.orderId}/feedback`,
      eventId: event.id,
    });
  });

  // Order cancelled notification
  EventBus.subscribe<OrderCancelledData>('order.cancelled', async (event) => {
    await createNotification({
      userId: event.data.userId,
      companyId: event.data.companyId,
      type: 'order_update',
      severity: 'warning',
      title: 'Order Cancelled',
      message: `Order cancelled: ${event.data.reason}`,
      actionUrl: `/orders/${event.data.orderId}`,
      eventId: event.id,
    });
  });

  // Low stock notification (company-level)
  EventBus.subscribe<ProductLowStockData>('product.low_stock', async (event) => {
    await createNotification({
      companyId: event.data.companyId,
      type: 'inventory_alert',
      severity: 'warning',
      title: 'Low Stock Alert',
      message: `Product "${event.data.name}" is low on stock (${event.data.currentStock} remaining).`,
      actionUrl: `/inventory/${event.data.productId}`,
      eventId: event.id,
    });
  });

  // Out of stock notification (company-level, critical)
  EventBus.subscribe<ProductOutOfStockData>('product.out_of_stock', async (event) => {
    await createNotification({
      companyId: event.data.companyId,
      type: 'inventory_alert',
      severity: 'error',
      title: 'Out of Stock',
      message: `Product "${event.data.name}" is out of stock!`,
      actionUrl: `/inventory/${event.data.productId}`,
      eventId: event.id,
    });
  });

  // AI anomaly notification
  EventBus.subscribe<AiAnomalyDetectedData>('ai.anomaly_detected', async (event) => {
    const severityMap = {
      low: 'info' as const,
      medium: 'info' as const,
      high: 'warning' as const,
      critical: 'error' as const,
    };

    await createNotification({
      companyId: event.data.companyId,
      type: 'ai_insight',
      severity: severityMap[event.data.severity],
      title: `AI Alert: ${event.data.type}`,
      message: event.data.description,
      actionUrl: `/ai/anomalies/${event.data.anomalyId}`,
      eventId: event.id,
    });
  });

  // AI recommendation notification
  EventBus.subscribe<AiRecommendationGeneratedData>('ai.recommendation_generated', async (event) => {
    await createNotification({
      userId: event.data.userId,
      companyId: event.data.companyId,
      type: 'ai_insight',
      severity: 'info',
      title: 'New AI Recommendation',
      message: event.data.description,
      actionUrl: `/ai/recommendations/${event.data.recommendationId}`,
      eventId: event.id,
    });
  });

  // Marketplace connection requested
  EventBus.subscribe<MarketplaceConnectionRequestedData>('marketplace.connection_requested', async (event) => {
    await createNotification({
      companyId: event.data.targetCompanyId,
      type: 'marketplace',
      severity: 'info',
      title: 'New Connection Request',
      message: `A company has requested to connect as ${event.data.relationshipType}.`,
      actionUrl: `/marketplace/requests/${event.data.requestId}`,
      eventId: event.id,
    });
  });

  // Marketplace connection approved
  EventBus.subscribe<MarketplaceConnectionApprovedData>('marketplace.connection_approved', async (event) => {
    // Notify both companies
    await Promise.all([
      createNotification({
        companyId: event.data.requestorCompanyId,
        type: 'marketplace',
        severity: 'success',
        title: 'Connection Approved',
        message: `Your connection request has been approved!`,
        actionUrl: `/marketplace/connections`,
        eventId: event.id,
      }),
      createNotification({
        companyId: event.data.targetCompanyId,
        type: 'marketplace',
        severity: 'success',
        title: 'Connection Established',
        message: `You've successfully connected with a new company.`,
        actionUrl: `/marketplace/connections`,
        eventId: event.id,
      }),
    ]);
  });

  logger.info('✅ Notification event handlers initialized');
}
