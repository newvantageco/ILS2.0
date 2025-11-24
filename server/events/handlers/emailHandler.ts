/**
 * Email Event Handler
 * 
 * Handles email notifications triggered by events.
 * Integrates with Chunk 8 queue system for async email delivery.
 */

import { EventBus } from '../EventBus';
import type {
  OrderCreatedData,
  OrderShippedData,
  OrderDeliveredData,
  OrderCancelledData,
  UserCreatedData,
  ProductLowStockData,
  ProductOutOfStockData,
  AiAnomalyDetectedData,
  PaymentSuccessData,
  PaymentFailedData,
} from '../events';
import {
import logger from '../utils/logger';

  queueOrderConfirmationEmail,
  queueOrderShipmentEmail,
  queueMarketplaceConnectionEmail,
  queueDailyBriefingEmail,
  queueGenericEmail,
} from '../../queue/helpers';

/**
 * Initialize email event handlers
 */
export function initializeEmailHandlers() {
  // Order confirmation emails
  EventBus.subscribe<OrderCreatedData>('order.created', async (event) => {
    const { orderId, userId } = event.data;
    
    await queueOrderConfirmationEmail(orderId, userId);
  });

  // Order shipped emails
  EventBus.subscribe<OrderShippedData>('order.shipped', async (event) => {
    const { orderId, trackingNumber, carrier } = event.data;
    
    await queueOrderShipmentEmail(
      orderId,
      trackingNumber || 'N/A',
      carrier || 'Standard Shipping'
    );
  });

  // Order delivered emails (optional - could be a satisfaction survey)
  EventBus.subscribe<OrderDeliveredData>('order.delivered', async (event) => {
    const { orderId } = event.data;
    
    // Using generic email for custom templates
    await queueGenericEmail(
      event.data.userId,
      'Order Delivered - Share Your Feedback',
      `<p>Your order has been delivered!</p>
       <p>Order ID: ${orderId}</p>
       <p>Delivered at: ${event.data.deliveredAt}</p>
       <p><a href="/orders/${orderId}/feedback">Share your feedback</a></p>`
    );
  });

  // Order cancelled emails
  EventBus.subscribe<OrderCancelledData>('order.cancelled', async (event) => {
    const { orderId, reason } = event.data;
    
    await queueGenericEmail(
      event.data.userId,
      'Order Cancelled',
      `<p>Your order has been cancelled.</p>
       <p>Order ID: ${orderId}</p>
       <p>Reason: ${reason}</p>
       <p>If you have questions, please contact support.</p>`
    );
  });

  // Welcome emails for new users
  EventBus.subscribe<UserCreatedData>('user.created', async (event) => {
    const { email } = event.data;
    
    await queueGenericEmail(
      email,
      'Welcome to Integrated Lens System',
      `<h1>Welcome!</h1>
       <p>Thank you for joining Integrated Lens System.</p>
       <p>Get started by exploring your dashboard.</p>`
    );
  });

  // Low stock alerts
  EventBus.subscribe<ProductLowStockData>('product.low_stock', async (event) => {
    const { name, currentStock, threshold } = event.data;
    
    // Send to company admins - would need to fetch admin emails from DB
    // For now, this is a placeholder showing the pattern
    logger.info(`Low stock alert: ${name} (${currentStock}/${threshold})`);
  });

  // Out of stock alerts (critical)
  EventBus.subscribe<ProductOutOfStockData>('product.out_of_stock', async (event) => {
    const { name, sku } = event.data;
    
    // Send to company admins - would need to fetch admin emails from DB
    logger.info(`OUT OF STOCK: ${name} (SKU: ${sku})`);
  });

  // AI anomaly alerts
  EventBus.subscribe<AiAnomalyDetectedData>('ai.anomaly_detected', async (event) => {
    const { type, severity, description } = event.data;
    
    // Only log for high/critical severity - would email company admins in production
    if (severity === 'high' || severity === 'critical') {
      logger.info(`AI ANOMALY (${severity}): ${type} - ${description}`);
    }
  });

  // Payment success confirmation
  EventBus.subscribe<PaymentSuccessData>('payment.success', async (event) => {
    const { paymentId, amount, currency } = event.data;
    
    await queueGenericEmail(
      event.data.userId,
      'Payment Successful',
      `<h2>Payment Confirmation</h2>
       <p>Your payment was successful!</p>
       <p>Amount: ${currency} ${amount}</p>
       <p>Payment ID: ${paymentId}</p>
       <p>Transaction ID: ${event.data.transactionId || 'N/A'}</p>`
    );
  });

  // Payment failure notification
  EventBus.subscribe<PaymentFailedData>('payment.failed', async (event) => {
    const { paymentId, errorMessage } = event.data;
    
    await queueGenericEmail(
      event.data.userId,
      'Payment Failed - Action Required',
      `<h2>Payment Failed</h2>
       <p>Unfortunately, your payment could not be processed.</p>
       <p>Payment ID: ${paymentId}</p>
       <p>Error: ${errorMessage}</p>
       <p>Please update your payment method and try again.</p>`
    );
  });

  logger.info('✅ Email event handlers initialized');
}
