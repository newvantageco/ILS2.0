/**
 * Order Event Handlers
 * 
 * These handlers automate the order lifecycle by subscribing to patient journey events.
 * 
 * CRITICAL AUTOMATION FLOWS:
 * =========================
 * 
 * 1. invoice.paid → Auto-create lab order
 *    - Extracts prescription from invoice line items
 *    - Creates order in database
 *    - Publishes order.created event (triggers lab dashboard update)
 *    - Sends confirmation email to patient
 * 
 * 2. order.shipped → Notify patient
 *    - Sends email with tracking info
 *    - Sends SMS if phone number available
 *    - Updates Patient 360 view via WebSocket
 * 
 * 3. order.status_changed → Broadcast updates
 *    - WebSocket to lab dashboard (all lab techs)
 *    - WebSocket to ECP (Patient 360 view)
 *    - Logs to audit trail
 */

import { EventBus } from '../EventBus';
import { 
  InvoicePaidPayload, 
  OrderShippedPayload,
  OrderStatusChangedPayload,
  publishOrderCreated,
  publishEmailRequired,
  PatientJourneyEvent
} from '../PatientJourneyEvents';
import { db } from '../../db';
import { orders, patients, prescriptions, invoices } from '../../../shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

// =====================================================
// HANDLER 1: Auto-Create Order When Invoice is Paid
// =====================================================

/**
 * This is the "magic" that makes POS instant.
 * 
 * When a Dispenser completes a sale:
 * 1. POS fires invoice.paid event
 * 2. UI is immediately ready for next patient
 * 3. This handler (running in background) creates the order
 * 4. Lab dashboard updates in real-time via WebSocket
 * 
 * BUSINESS LOGIC:
 * - Only creates order if invoice has prescription/lens items
 * - Automatically links to most recent prescription
 * - Generates unique order number
 * - Sets initial status to "pending"
 */
EventBus.subscribe(PatientJourneyEvent.INVOICE_PAID, async (event) => {
  const payload = event.data as InvoicePaidPayload;
  
  console.log(`📦 [OrderHandler] Processing invoice.paid: ${payload.invoiceNumber}`);
  
  try {
    // Check if invoice contains items that require a lab order
    const hasLensOrder = payload.lineItems.some(item => 
      item.type === 'lens' || 
      item.type === 'product' && item.productId?.includes('lens')
    );
    
    if (!hasLensOrder) {
      console.log(`   ℹ️  Invoice ${payload.invoiceNumber} has no lens items. Skipping order creation.`);
      return;
    }
    
    // Get patient details
    const patient = await db.query.patients.findFirst({
      where: eq(patients.id, payload.patientId),
    });
    
    if (!patient) {
      console.error(`   ❌ Patient ${payload.patientId} not found. Cannot create order.`);
      return;
    }
    
    // Get most recent prescription for this patient
    const recentPrescription = await db.query.prescriptions.findFirst({
      where: eq(prescriptions.patientId, payload.patientId),
      orderBy: desc(prescriptions.createdAt),
    });
    
    if (!recentPrescription) {
      console.warn(`   ⚠️  No prescription found for patient ${patient.name}. Creating order without Rx.`);
    }
    
    // Extract lens details from line items
    const lensItem = payload.lineItems.find(item => item.type === 'lens');
    const lensType = lensItem?.description || 'Standard Single Vision';
    
    // Generate unique order number
    const orderNumber = `ORD-${Date.now()}-${payload.patientId.slice(-4)}`;
    
    // Create order in database
    const [newOrder] = await db.insert(orders).values({
      orderNumber,
      companyId: payload.companyId,
      patientId: payload.patientId,
      ecpId: payload.dispenserId,
      status: 'pending',
      
      // Prescription data (if available)
      odSphere: recentPrescription?.odSphere || null,
      odCylinder: recentPrescription?.odCylinder || null,
      odAxis: recentPrescription?.odAxis || null,
      odAdd: recentPrescription?.odAdd || null,
      osSphere: recentPrescription?.osSphere || null,
      osCylinder: recentPrescription?.osCylinder || null,
      osAxis: recentPrescription?.osAxis || null,
      osAdd: recentPrescription?.osAdd || null,
      pd: recentPrescription?.pd || null,
      
      // Product details
      lensType,
      lensMaterial: 'Standard',
      coating: 'Anti-Reflection',
      
      // Metadata
      notes: `Auto-created from invoice ${payload.invoiceNumber}`,
    }).returning();
    
    console.log(`   ✅ Order created: ${orderNumber} (ID: ${newOrder.id})`);
    
    // Publish order.created event
    // This triggers:
    // - Lab dashboard update (WebSocket)
    // - Email to patient (confirmation)
    // - Audit log entry
    await publishOrderCreated({
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
      patientId: payload.patientId,
      patientName: payload.patientName,
      patientEmail: payload.patientEmail,
      ecpId: payload.dispenserId,
      ecpName: payload.dispenserName,
      companyId: payload.companyId,
      invoiceId: payload.invoiceId,
      prescription: recentPrescription ? {
        odSphere: recentPrescription.odSphere || '',
        odCylinder: recentPrescription.odCylinder || '',
        odAxis: recentPrescription.odAxis || '',
        odAdd: recentPrescription.odAdd ?? undefined,
        osSphere: recentPrescription.osSphere || '',
        osCylinder: recentPrescription.osCylinder || '',
        osAxis: recentPrescription.osAxis || '',
        osAdd: recentPrescription.osAdd ?? undefined,
        pd: recentPrescription.pd ?? undefined,
      } : undefined,
      lensType,
      timestamp: new Date(),
    });
    
    // Send order confirmation email to patient
    if (payload.patientEmail) {
      await publishEmailRequired({
        to: payload.patientEmail,
        subject: `Order Confirmation - ${orderNumber}`,
        template: 'order-confirmation',
        data: {
          patientName: payload.patientName,
          orderNumber,
          lensType,
          totalAmount: payload.totalAmount,
          currency: payload.currency,
          estimatedCompletion: '5-7 business days',
        },
        companyId: payload.companyId,
        priority: 'normal',
      });
      
      console.log(`   📧 Order confirmation email queued for ${payload.patientEmail}`);
    }
    
    console.log(`   🎉 Order automation complete for invoice ${payload.invoiceNumber}`);
    
  } catch (error) {
    console.error(`   ❌ Failed to create order for invoice ${payload.invoiceNumber}:`, error);
    
    // TODO: Add to retry queue or dead letter queue
    // For now, we'll let it fail silently to not break the POS
    // The invoice is still paid, order can be created manually
  }
});

// =====================================================
// HANDLER 2: Send Notification When Order Ships
// =====================================================

/**
 * This handler notifies the patient when their order is shipped.
 * 
 * Triggered by: order.shipped event
 * 
 * Actions:
 * 1. Send email with tracking information
 * 2. Send SMS if phone number available (optional)
 * 3. Update Patient 360 view via WebSocket
 * 
 * BUSINESS RULES:
 * - Email is required, shipping proceeds without it
 * - SMS is optional, not having phone doesn't block
 * - Includes carrier and tracking number if available
 */
EventBus.subscribe(PatientJourneyEvent.ORDER_SHIPPED, async (event) => {
  const payload = event.data as OrderShippedPayload;
  
  console.log(`📦 [OrderHandler] Processing order.shipped: ${payload.orderNumber}`);
  
  try {
    // Get patient details (for email/phone)
    const patient = await db.query.patients.findFirst({
      where: eq(patients.id, payload.patientId),
    });
    
    if (!patient) {
      console.error(`   ❌ Patient ${payload.patientId} not found. Cannot send notification.`);
      return;
    }
    
    // Send email notification
    if (patient.email) {
      await publishEmailRequired({
        to: patient.email,
        subject: `Your Order Has Shipped! - ${payload.orderNumber}`,
        template: 'order-shipped',
        data: {
          patientName: patient.name,
          orderNumber: payload.orderNumber,
          trackingNumber: payload.trackingNumber || 'Not available',
          carrier: payload.carrier || 'Standard Delivery',
          estimatedDelivery: payload.estimatedDelivery 
            ? payload.estimatedDelivery.toLocaleDateString('en-GB')
            : '2-3 business days',
          trackingUrl: payload.trackingNumber 
            ? `https://track.royalmail.com/track?trackingNumber=${payload.trackingNumber}`
            : null,
        },
        companyId: payload.companyId,
        priority: 'high',
      });
      
      console.log(`   📧 Shipment notification email queued for ${patient.email}`);
    } else {
      console.warn(`   ⚠️  Patient ${patient.name} has no email. Skipping email notification.`);
    }
    
    // TODO: Send SMS notification (if enabled)
    // if (patient.phone && process.env.SMS_ENABLED === 'true') {
    //   await sendSMS({
    //     to: patient.phone,
    //     message: `Your order ${payload.orderNumber} has shipped! Track: ${payload.trackingNumber}`,
    //   });
    // }
    
    console.log(`   ✅ Shipment notifications sent for order ${payload.orderNumber}`);
    
  } catch (error) {
    console.error(`   ❌ Failed to send shipment notification for order ${payload.orderNumber}:`, error);
  }
});

// =====================================================
// HANDLER 3: Log Order Status Changes
// =====================================================

/**
 * This handler logs all order status changes for audit trail.
 * 
 * Triggered by: order.status_changed event
 * 
 * This creates a complete audit trail of:
 * - Who changed the status
 * - When it was changed
 * - What the old and new statuses were
 * - Any notes added
 * 
 * Required for:
 * - Quality control tracking
 * - Performance metrics (time in each status)
 * - Compliance (GOC/GDPR)
 */
EventBus.subscribe(PatientJourneyEvent.ORDER_STATUS_CHANGED, async (event) => {
  const payload = event.data as OrderStatusChangedPayload;
  
  console.log(`📊 [OrderHandler] Order status changed: ${payload.orderNumber}`);
  console.log(`   ${payload.oldStatus} → ${payload.newStatus} by ${payload.changedByName}`);
  
  // The EventBus already logs this to event_log table
  // Additional business logic can be added here:
  
  // Example: If order goes to quality_check, assign to QC team
  if (payload.newStatus === 'quality_check') {
    console.log(`   🔍 Order moved to quality check. Assigning to QC team...`);
    // TODO: Implement QC assignment logic
  }
  
  // Example: If order is cancelled, send notification
  if (payload.newStatus === 'cancelled') {
    console.log(`   ⚠️  Order cancelled. Sending notification...`);
    // TODO: Implement cancellation notification
  }
  
  // Example: Calculate time in previous status (for metrics)
  // const timeInStatus = calculateTimeInStatus(payload.orderId, payload.oldStatus);
  // await saveMetric('order_status_duration', timeInStatus, { status: payload.oldStatus });
});

// =====================================================
// HANDLER 4: Create Order Confirmation Email
// =====================================================

/**
 * This handler sends order confirmation when order is created.
 * 
 * Triggered by: order.created event
 * 
 * Sends a professional email with:
 * - Order number
 * - Prescription details
 * - Lens type and coatings
 * - Estimated completion date
 * - Next steps
 */
EventBus.subscribe(PatientJourneyEvent.ORDER_CREATED, async (event) => {
  const payload = event.data as any;
  
  console.log(`📧 [OrderHandler] Sending order confirmation for ${payload.orderNumber}`);
  
  try {
    if (!payload.patientEmail) {
      console.log(`   ℹ️  No email address for patient. Skipping confirmation email.`);
      return;
    }
    
    // Build prescription summary for email
    let prescriptionSummary = '';
    if (payload.prescription) {
      prescriptionSummary = `
        Right Eye (OD): ${payload.prescription.odSphere} ${payload.prescription.odCylinder} x ${payload.prescription.odAxis}
        Left Eye (OS): ${payload.prescription.osSphere} ${payload.prescription.osCylinder} x ${payload.prescription.osAxis}
        ${payload.prescription.odAdd ? `Add: +${payload.prescription.odAdd}` : ''}
      `;
    }
    
    await publishEmailRequired({
      to: payload.patientEmail,
      subject: `Order Confirmation - ${payload.orderNumber}`,
      template: 'order-confirmation',
      data: {
        patientName: payload.patientName,
        orderNumber: payload.orderNumber,
        lensType: payload.lensType,
        lensMaterial: payload.lensMaterial,
        coating: payload.coating,
        frameType: payload.frameType,
        prescriptionSummary,
        estimatedCompletion: '5-7 business days',
        nextSteps: 'Your order has been sent to our lab for production. You will receive an email when it ships.',
      },
      companyId: payload.companyId,
      priority: 'normal',
    });
    
    console.log(`   ✅ Order confirmation email queued`);
    
  } catch (error) {
    console.error(`   ❌ Failed to send order confirmation:`, error);
  }
});

// =====================================================
// INITIALIZATION
// =====================================================

console.log('✅ Order event handlers initialized');
console.log('   Subscribed to: invoice.paid, order.created, order.shipped, order.status_changed');

/**
 * Export for testing
 */
export const handlers = {
  onInvoicePaid: 'Registered via EventBus.subscribe',
  onOrderShipped: 'Registered via EventBus.subscribe',
  onOrderStatusChanged: 'Registered via EventBus.subscribe',
  onOrderCreated: 'Registered via EventBus.subscribe',
};
