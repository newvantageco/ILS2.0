/**
 * Event Type Definitions
 * 
 * Strongly-typed event interfaces for all system events.
 * Events follow naming convention: <entity>.<action>
 * 
 * Categories:
 * - Orders: order.created, order.updated, order.shipped, order.delivered, order.cancelled
 * - Users: user.created, user.updated, user.login, user.logout
 * - Inventory: product.created, product.updated, product.low_stock, product.out_of_stock
 * - AI: ai.briefing_generated, ai.forecast_completed, ai.anomaly_detected
 * - Marketplace: marketplace.connection_requested, marketplace.connection_approved
 */

/**
 * ============================================================================
 * ORDER EVENTS
 * ============================================================================
 */

export interface OrderCreatedData {
  orderId: string;
  userId: string;
  companyId: string;
  patientId?: string;
  total: number;
  items: number;
  status: string;
}

export interface OrderUpdatedData {
  orderId: string;
  userId: string;
  companyId: string;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}

export interface OrderShippedData {
  orderId: string;
  userId: string;
  companyId: string;
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: Date;
}

export interface OrderDeliveredData {
  orderId: string;
  userId: string;
  companyId: string;
  deliveredAt: Date;
  signedBy?: string;
}

export interface OrderCancelledData {
  orderId: string;
  userId: string;
  companyId: string;
  reason: string;
  cancelledBy: string;
}

/**
 * ============================================================================
 * USER EVENTS
 * ============================================================================
 */

export interface UserCreatedData {
  userId: string;
  email: string;
  companyId: string;
  role: string;
  createdBy?: string;
}

export interface UserUpdatedData {
  userId: string;
  companyId: string;
  updatedBy: string;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}

export interface UserLoginData {
  userId: string;
  email: string;
  companyId: string;
  loginMethod: 'password' | 'oauth' | 'sso';
  success: boolean;
  failureReason?: string;
}

export interface UserLogoutData {
  userId: string;
  companyId: string;
  sessionDuration: number; // seconds
}

/**
 * ============================================================================
 * INVENTORY EVENTS
 * ============================================================================
 */

export interface ProductCreatedData {
  productId: string;
  companyId: string;
  name: string;
  sku: string;
  type: string;
  initialStock: number;
}

export interface ProductUpdatedData {
  productId: string;
  companyId: string;
  updatedBy: string;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}

export interface ProductLowStockData {
  productId: string;
  companyId: string;
  currentStock: number;
  threshold: number;
  sku: string;
  name: string;
}

export interface ProductOutOfStockData {
  productId: string;
  companyId: string;
  sku: string;
  name: string;
  lastStockDate: Date;
}

export interface ProductStockUpdatedData {
  productId: string;
  companyId: string;
  oldStock: number;
  newStock: number;
  source: 'shopify' | 'manual' | 'order';
  timestamp: Date;
}

/**
 * ============================================================================
 * AI EVENTS
 * ============================================================================
 */

export interface AiBriefingGeneratedData {
  briefingId: string;
  userId: string;
  companyId: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  insights: number; // Number of insights generated
  duration: number; // Processing time in ms
}

export interface AiForecastCompletedData {
  forecastId: string;
  companyId: string;
  productId?: string;
  horizon: 'week' | 'month' | 'quarter' | 'year';
  method: string;
  accuracy?: number; // MAE, RMSE, etc.
  duration: number;
}

export interface AiAnomalyDetectedData {
  anomalyId: string;
  companyId: string;
  type: string; // 'demand_spike', 'quality_issue', 'pricing_outlier'
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedEntity: {
    type: 'product' | 'order' | 'user';
    id: string;
  };
  description: string;
  confidence: number; // 0-1
}

export interface AiRecommendationGeneratedData {
  recommendationId: string;
  userId: string;
  companyId: string;
  type: string; // 'product_suggestion', 'reorder_alert', 'price_optimization'
  priority: 'low' | 'medium' | 'high';
  description: string;
}

/**
 * ============================================================================
 * MARKETPLACE EVENTS
 * ============================================================================
 */

export interface MarketplaceConnectionRequestedData {
  requestId: string;
  requestorCompanyId: string;
  targetCompanyId: string;
  relationshipType: string;
  message?: string;
}

export interface MarketplaceConnectionApprovedData {
  requestId: string;
  requestorCompanyId: string;
  targetCompanyId: string;
  relationshipType: string;
  approvedBy: string;
}

export interface MarketplaceConnectionRejectedData {
  requestId: string;
  requestorCompanyId: string;
  targetCompanyId: string;
  relationshipType: string;
  rejectedBy: string;
  reason?: string;
}

/**
 * ============================================================================
 * PAYMENT EVENTS
 * ============================================================================
 */

export interface PaymentSuccessData {
  paymentId: string;
  orderId?: string;
  userId: string;
  companyId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionId?: string;
}

export interface PaymentFailedData {
  paymentId: string;
  orderId?: string;
  userId: string;
  companyId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  errorCode: string;
  errorMessage: string;
}

export interface SubscriptionChangedData {
  userId: string;
  companyId: string;
  oldPlan: string;
  newPlan: string;
  billingCycle: 'monthly' | 'yearly';
  effectiveDate: Date;
}

/**
 * ============================================================================
 * NOTIFICATION EVENTS
 * ============================================================================
 */

export interface NotificationCreatedData {
  notificationId: string;
  userId?: string;
  companyId?: string;
  type: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  actionUrl?: string;
}

/**
 * ============================================================================
 * CLINICAL EVENTS (NEW - World-Class Enhancement)
 * ============================================================================
 */

export interface ExaminationCompletedData {
  examinationId: string;
  patientId: string;
  companyId: string;
  ecpId: string;
  diagnosis?: string;
  managementPlan?: string;
  prescriptionCreated: boolean;
}

export interface PrescriptionValidatedData {
  prescriptionId: string;
  patientId: string;
  companyId: string;
  valid: boolean;
  expiryDate?: Date;
  validationReason?: string;
}

export interface ClinicalAnomalyDetectedData {
  anomalyId: string;
  examinationId: string;
  patientId: string;
  companyId: string;
  ecpId: string;
  metric: string; // 'IOP', 'visual_acuity', 'refraction_shift'
  currentValue: number;
  expectedRange: { min: number; max: number };
  severity: 'low' | 'medium' | 'high';
  recommendation: string;
}

/**
 * ============================================================================
 * SHOPIFY INTEGRATION EVENTS (NEW - Omnichannel)
 * ============================================================================
 */

export interface ShopifyInventorySyncedData {
  productId: string;
  companyId: string;
  stockQuantity: number;
  shopifyProductId: string;
  syncedAt: Date;
}

export interface ShopifyOrderReceivedData {
  shopifyOrderId: string;
  companyId: string;
  customerId: string;
  lineItems: {
    productId: string;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
}

/**
 * ============================================================================
 * OMA & ORDER EVENTS (NEW - Intelligent Lab System)
 * ============================================================================
 */

export interface OrderOMAValidatedData {
  orderId: string;
  companyId: string;
  valid: boolean;
  errors: string[];
  warnings: string[];
  complexity: 'simple' | 'moderate' | 'complex';
  suggestedQueue: 'lab_tech' | 'engineer';
  autoApproved: boolean;
}

export interface OrderTriageRequiredData {
  orderId: string;
  companyId: string;
  reason: string;
  assignedTo: 'engineer' | 'quality_team';
  priority: 'low' | 'medium' | 'high';
}

/**
 * ============================================================================
 * USAGE & BILLING EVENTS (NEW - Metered Billing)
 * ============================================================================
 */

export interface UsageRecordedData {
  usageId: string;
  companyId: string;
  metric: 'order' | 'invoice' | 'storage' | 'api_call' | 'ai_job';
  quantity: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface BillingThresholdExceededData {
  companyId: string;
  metric: string;
  currentUsage: number;
  threshold: number;
  estimatedCost: number;
}

/**
 * ============================================================================
 * SYSTEM EVENTS
 * ============================================================================
 */

export interface SystemErrorData {
  errorId: string;
  component: string;
  errorType: string;
  message: string;
  stack?: string;
  userId?: string;
  companyId?: string;
}

export interface SystemHealthCheckData {
  component: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime?: number;
  errorCount?: number;
}

/**
 * ============================================================================
 * EVENT TYPE REGISTRY
 * ============================================================================
 * Maps event types to their data interfaces for type safety
 */

export interface EventTypeMap {
  // Orders
  'order.created': OrderCreatedData;
  'order.updated': OrderUpdatedData;
  'order.shipped': OrderShippedData;
  'order.delivered': OrderDeliveredData;
  'order.cancelled': OrderCancelledData;

  // Users
  'user.created': UserCreatedData;
  'user.updated': UserUpdatedData;
  'user.login': UserLoginData;
  'user.logout': UserLogoutData;

  // Inventory
  'product.created': ProductCreatedData;
  'product.updated': ProductUpdatedData;
  'product.low_stock': ProductLowStockData;
  'product.out_of_stock': ProductOutOfStockData;
  'product.stock_updated': ProductStockUpdatedData;

  // AI
  'ai.briefing_generated': AiBriefingGeneratedData;
  'ai.forecast_completed': AiForecastCompletedData;
  'ai.anomaly_detected': AiAnomalyDetectedData;
  'ai.recommendation_generated': AiRecommendationGeneratedData;

  // Marketplace
  'marketplace.connection_requested': MarketplaceConnectionRequestedData;
  'marketplace.connection_approved': MarketplaceConnectionApprovedData;
  'marketplace.connection_rejected': MarketplaceConnectionRejectedData;

  // Payments
  'payment.success': PaymentSuccessData;
  'payment.failed': PaymentFailedData;
  'subscription.changed': SubscriptionChangedData;

  // Notifications
  'notification.created': NotificationCreatedData;

  // System
  'system.error': SystemErrorData;
  'system.health_check': SystemHealthCheckData;

  // Clinical (NEW)
  'examination.completed': ExaminationCompletedData;
  'prescription.validated': PrescriptionValidatedData;
  'clinical.anomaly_detected': ClinicalAnomalyDetectedData;

  // Shopify Integration (NEW)
  'shopify.inventory_synced': ShopifyInventorySyncedData;
  'shopify.order_received': ShopifyOrderReceivedData;

  // OMA & Orders (NEW)
  'order.oma_validated': OrderOMAValidatedData;
  'order.triage_required': OrderTriageRequiredData;

  // Usage & Billing (NEW)
  'usage.recorded': UsageRecordedData;
  'billing.threshold_exceeded': BillingThresholdExceededData;
}

/**
 * Type-safe event type strings
 */
export type EventType = keyof EventTypeMap;

/**
 * Get data type for specific event type
 */
export type EventDataFor<T extends EventType> = EventTypeMap[T];

/**
 * Helper to ensure event type matches data type
 */
export function createEvent<T extends EventType>(
  type: T,
  data: EventDataFor<T>
): { type: T; data: EventDataFor<T> } {
  return { type, data };
}
