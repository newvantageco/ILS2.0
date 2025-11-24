/**
 * Metrics Event Handler
 * 
 * Tracks metrics and analytics triggered by events.
 * Updates counters, aggregates stats, and triggers metric calculations.
 */

import { EventBus } from '../EventBus';
import type {
import logger from '../utils/logger';

  OrderCreatedData,
  UserLoginData,
  ProductLowStockData,
  AiAnomalyDetectedData,
} from '../events';

/**
 * Initialize metrics event handlers
 */
export function initializeMetricsHandlers() {
  // Track order metrics
  EventBus.subscribe<OrderCreatedData>('order.created', async (event) => {
    const { companyId, total, items } = event.data;
    
    // Log metrics (would integrate with analytics system in production)
    logger.info(`Metrics: Order created - Company: ${companyId}, Total: ${total}, Items: ${items}`);
  });

  // Track login metrics
  EventBus.subscribe<UserLoginData>('user.login', async (event) => {
    const { userId, success, loginMethod } = event.data;
    
    logger.info(`Metrics: User login - User: ${userId}, Method: ${loginMethod}, Success: ${success}`);
  });

  // Track inventory metrics
  EventBus.subscribe<ProductLowStockData>('product.low_stock', async (event) => {
    const { productId, currentStock, threshold } = event.data;
    
    logger.info(`Metrics: Low stock - Product: ${productId}, Stock: ${currentStock}/${threshold}`);
  });

  // Track AI anomaly metrics
  EventBus.subscribe<AiAnomalyDetectedData>('ai.anomaly_detected', async (event) => {
    const { type, severity, confidence } = event.data;
    
    logger.info(`Metrics: AI anomaly - Type: ${type}, Severity: ${severity}, Confidence: ${confidence}`);
  });

  // Global metrics listener
  EventBus.subscribe('*', async (event) => {
    // Count all events by type
    logger.info(`Metrics: Event ${event.type} at ${event.timestamp.toISOString()}`);
  });

  logger.info('✅ Metrics event handlers initialized');
}
