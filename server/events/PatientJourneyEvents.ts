/**
 * Patient Journey Events
 * 
 * Defines all events that occur throughout a patient's journey through your platform.
 * These events power the decoupled, event-driven architecture that makes ILS "one-of-a-kind".
 * 
 * ARCHITECTURE PATTERN:
 * =====================
 * Instead of: POS → OrderService → EmailService → LabService (tight coupling)
 * We use: POS → invoice.paid event → Multiple independent handlers
 * 
 * BENEFITS:
 * - POS is instant (no waiting for downstream services)
 * - Services can fail independently without breaking POS
 * - Easy to add new features (just subscribe to events)
 * - Perfect audit trail (all events are logged)
 */

import { EventBus } from './EventBus';

// =====================================================
// EVENT TYPE ENUM
// =====================================================

/**
 * All possible events in the patient journey
 * 
 * Naming convention: <entity>.<action>
 * Examples: exam.finalized, order.created, invoice.paid
 */
export enum PatientJourneyEvent {
  // ===== EXAMINATION FLOW =====
  EXAM_STARTED = 'exam.started',
  EXAM_FINALIZED = 'exam.finalized',        // ⭐ CRITICAL - Optometrist finishes exam → Dispenser handoff
  EXAM_SIGNED = 'exam.signed',
  
  // ===== PRESCRIPTION FLOW =====
  PRESCRIPTION_CREATED = 'prescription.created',
  PRESCRIPTION_UPDATED = 'prescription.updated',
  PRESCRIPTION_SIGNED = 'prescription.signed',
  
  // ===== POS & INVOICING FLOW =====
  INVOICE_CREATED = 'invoice.created',
  INVOICE_PAID = 'invoice.paid',            // ⭐ CRITICAL - Triggers order creation
  INVOICE_REFUNDED = 'invoice.refunded',
  
  // ===== ORDER LIFECYCLE (LAB WORKFLOW) =====
  ORDER_CREATED = 'order.created',          // ⭐ CRITICAL - Creates lab dashboard card
  ORDER_STATUS_CHANGED = 'order.status_changed', // ⭐ CRITICAL - Updates lab dashboard
  ORDER_ASSIGNED_TO_LAB = 'order.assigned_to_lab',
  ORDER_IN_PRODUCTION = 'order.in_production',
  ORDER_QUALITY_CHECK = 'order.quality_check',
  ORDER_SHIPPED = 'order.shipped',          // ⭐ CRITICAL - Notifies patient
  ORDER_DELIVERED = 'order.delivered',
  ORDER_CANCELLED = 'order.cancelled',
  ORDER_ON_HOLD = 'order.on_hold',
  
  // ===== PATIENT MANAGEMENT =====
  PATIENT_CREATED = 'patient.created',
  PATIENT_UPDATED = 'patient.updated',
  PATIENT_APPOINTMENT_BOOKED = 'patient.appointment_booked',
  PATIENT_APPOINTMENT_CANCELLED = 'patient.appointment_cancelled',
  
  // ===== LAB PRODUCTION =====
  LAB_PRODUCTION_STARTED = 'lab.production_started',
  LAB_PRODUCTION_COMPLETED = 'lab.production_completed',
  LAB_QUALITY_ISSUE = 'lab.quality_issue',
  
  // ===== NOTIFICATIONS & COMMUNICATIONS =====
  NOTIFICATION_REQUIRED = 'notification.required',
  EMAIL_REQUIRED = 'email.required',
  SMS_REQUIRED = 'sms.required',
}

// =====================================================
// EVENT PAYLOAD INTERFACES
// =====================================================

/**
 * Exam Finalized
 * 
 * Fired when an Optometrist completes an eye examination.
 * This triggers the "handoff" to the Dispenser (shows in POS patient list).
 */
export interface ExamFinalizedPayload {
  examId: string;
  patientId: string;
  patientName: string;
  ecpId: string;
  ecpName: string;
  companyId: string;
  
  // Clinical data (for POS context)
  diagnosis?: string;
  recommendation?: string;  // "Progressive", "Single Vision", "Bifocal"
  visualAcuity?: {
    odDistance?: string;
    osDistance?: string;
    odNear?: string;
    osNear?: string;
  };
  
  timestamp: Date;
}

/**
 * Invoice Paid
 * 
 * Fired when a Dispenser completes a POS sale.
 * This is the trigger for automatic order creation.
 */
export interface InvoicePaidPayload {
  invoiceId: string;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  patientEmail?: string;
  dispenserId: string;
  dispenserName: string;
  companyId: string;
  
  totalAmount: number;
  currency: string;
  paymentMethod: string;
  
  // Line items (for order creation logic)
  lineItems: Array<{
    type: 'product' | 'service' | 'lens';
    productId?: string;
    prescriptionId?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    description: string;
  }>;
  
  timestamp: Date;
}

/**
 * Order Created
 * 
 * Fired when a new lab order is created (usually from invoice.paid).
 * This triggers:
 * - Real-time lab dashboard card creation
 * - Email to patient with order confirmation
 * - PDF generation for lab
 */
export interface OrderCreatedPayload {
  orderId: string;
  orderNumber: string;
  patientId: string;
  patientName: string;
  patientEmail?: string;
  ecpId: string;
  ecpName: string;
  companyId: string;
  
  invoiceId?: string;  // Reference to the POS invoice
  
  // Prescription data
  prescription?: {
    odSphere: string;
    odCylinder: string;
    odAxis: string;
    odAdd?: string;
    osSphere: string;
    osCylinder: string;
    osAxis: string;
    osAdd?: string;
    pd?: string;
  };
  
  // Product details
  lensType: string;
  lensMaterial?: string;
  coating?: string;
  frameType?: string;
  frameModel?: string;
  
  // Order metadata
  priority?: 'standard' | 'rush' | 'urgent';
  dueDate?: Date;
  
  timestamp: Date;
}

/**
 * Order Status Changed
 * 
 * Fired when a lab tech moves an order to a new status.
 * This triggers:
 * - Real-time lab dashboard update (card moves columns)
 * - WebSocket broadcast to ECP (updates Patient 360 view)
 * - Notification to patient (when shipped)
 */
export interface OrderStatusChangedPayload {
  orderId: string;
  orderNumber: string;
  patientId: string;
  patientName: string;
  companyId: string;
  
  oldStatus: OrderStatus;
  newStatus: OrderStatus;
  
  changedBy: string;        // User ID of lab tech
  changedByName: string;
  
  notes?: string;           // Optional status change notes
  
  timestamp: Date;
}

/**
 * Order Shipped
 * 
 * Fired when a lab tech marks an order as shipped.
 * This triggers:
 * - Email to patient with tracking info
 * - SMS notification (if enabled)
 * - Update to Patient 360 view
 */
export interface OrderShippedPayload {
  orderId: string;
  orderNumber: string;
  patientId: string;
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  companyId: string;
  
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: Date;
  
  shippedBy: string;        // User ID of lab tech
  shippedByName: string;
  
  timestamp: Date;
}

/**
 * Email Required
 * 
 * Fired when any part of the system needs to send an email.
 * This decouples email sending from business logic.
 */
export interface EmailRequiredPayload {
  to: string;
  cc?: string[];
  bcc?: string[];
  
  subject: string;
  template: string;  // e.g., 'order-confirmation', 'order-shipped'
  
  data: Record<string, any>;  // Template variables
  
  companyId: string;
  priority?: 'high' | 'normal' | 'low';
  
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

// ===== TYPE DEFINITIONS =====

export type OrderStatus = 
  | 'pending'
  | 'in_production'
  | 'quality_check'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'on_hold'
  | 'cancelled';

// =====================================================
// CONVENIENCE PUBLISHING FUNCTIONS
// =====================================================

/**
 * Publish: Exam Finalized
 * 
 * Call this when an Optometrist completes an exam.
 * 
 * @example
 * await publishExamFinalized({
 *   examId: '123',
 *   patientId: '456',
 *   patientName: 'John Doe',
 *   ecpId: 'ecp-789',
 *   ecpName: 'Dr. Smith',
 *   companyId: 'company-abc',
 *   diagnosis: 'Myopia',
 *   recommendation: 'Progressive',
 *   timestamp: new Date(),
 * });
 */
export async function publishExamFinalized(data: ExamFinalizedPayload): Promise<void> {
  await EventBus.publish(PatientJourneyEvent.EXAM_FINALIZED, data, {
    userId: data.ecpId,
    companyId: data.companyId,
    source: 'clinical',
  });
}

/**
 * Publish: Invoice Paid
 * 
 * Call this when a Dispenser completes a POS sale.
 * This triggers automatic order creation.
 * 
 * @example
 * await publishInvoicePaid({
 *   invoiceId: 'inv-123',
 *   invoiceNumber: 'INV-2024-001',
 *   patientId: '456',
 *   patientName: 'John Doe',
 *   dispenserId: 'disp-789',
 *   dispenserName: 'Jane Smith',
 *   companyId: 'company-abc',
 *   totalAmount: 299.99,
 *   currency: 'GBP',
 *   paymentMethod: 'card',
 *   lineItems: [...],
 *   timestamp: new Date(),
 * });
 */
export async function publishInvoicePaid(data: InvoicePaidPayload): Promise<void> {
  await EventBus.publish(PatientJourneyEvent.INVOICE_PAID, data, {
    userId: data.dispenserId,
    companyId: data.companyId,
    source: 'pos',
  });
}

/**
 * Publish: Order Created
 * 
 * Call this when a new lab order is created.
 * This triggers lab dashboard updates and notifications.
 * 
 * @example
 * await publishOrderCreated({
 *   orderId: 'ord-123',
 *   orderNumber: 'ORD-2024-001',
 *   patientId: '456',
 *   patientName: 'John Doe',
 *   ecpId: 'ecp-789',
 *   companyId: 'company-abc',
 *   lensType: 'Progressive',
 *   timestamp: new Date(),
 * });
 */
export async function publishOrderCreated(data: OrderCreatedPayload): Promise<void> {
  await EventBus.publish(PatientJourneyEvent.ORDER_CREATED, data, {
    userId: data.ecpId,
    companyId: data.companyId,
    source: 'system',
  });
}

/**
 * Publish: Order Status Changed
 * 
 * Call this when a lab tech changes an order's status.
 * This triggers real-time dashboard updates.
 * 
 * @example
 * await publishOrderStatusChanged({
 *   orderId: 'ord-123',
 *   orderNumber: 'ORD-2024-001',
 *   patientId: '456',
 *   patientName: 'John Doe',
 *   companyId: 'company-abc',
 *   oldStatus: 'pending',
 *   newStatus: 'in_production',
 *   changedBy: 'user-123',
 *   changedByName: 'Lab Tech Mike',
 *   timestamp: new Date(),
 * });
 */
export async function publishOrderStatusChanged(data: OrderStatusChangedPayload): Promise<void> {
  await EventBus.publish(PatientJourneyEvent.ORDER_STATUS_CHANGED, data, {
    userId: data.changedBy,
    companyId: data.companyId,
    source: 'lab',
  });
}

/**
 * Publish: Order Shipped
 * 
 * Call this when a lab tech ships an order.
 * This triggers customer notifications.
 * 
 * @example
 * await publishOrderShipped({
 *   orderId: 'ord-123',
 *   orderNumber: 'ORD-2024-001',
 *   patientId: '456',
 *   patientName: 'John Doe',
 *   companyId: 'company-abc',
 *   trackingNumber: 'TRACK123',
 *   carrier: 'Royal Mail',
 *   shippedBy: 'user-123',
 *   shippedByName: 'Lab Tech Mike',
 *   timestamp: new Date(),
 * });
 */
export async function publishOrderShipped(data: OrderShippedPayload): Promise<void> {
  await EventBus.publish(PatientJourneyEvent.ORDER_SHIPPED, data, {
    userId: data.shippedBy,
    companyId: data.companyId,
    source: 'lab',
  });
}

/**
 * Publish: Email Required
 * 
 * Call this when you need to send an email.
 * A background worker will handle the actual sending.
 * 
 * @example
 * await publishEmailRequired({
 *   to: 'patient@example.com',
 *   subject: 'Your order has shipped!',
 *   template: 'order-shipped',
 *   data: {
 *     orderNumber: 'ORD-2024-001',
 *     trackingNumber: 'TRACK123',
 *   },
 *   companyId: 'company-abc',
 *   priority: 'high',
 * });
 */
export async function publishEmailRequired(data: EmailRequiredPayload): Promise<void> {
  await EventBus.publish(PatientJourneyEvent.EMAIL_REQUIRED, data, {
    companyId: data.companyId,
    source: 'system',
  });
}
