/**
 * Order Email Service
 * 
 * Handles automated email notifications for order status changes
 * Integrates with EmailTrackingService to send templated emails
 * at each stage of the customer's order journey.
 */

import { db } from '../db';
import { orders, companies, patients, emailTemplates, emailLogs } from '../../shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import { emailTrackingService } from './EmailTrackingService';

export type OrderStatus = 'pending' | 'in_production' | 'quality_check' | 'shipped' | 'completed' | 'on_hold' | 'cancelled';

export interface OrderEmailContext {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  orderDate: string;
  expectedDate?: string;
  companyName: string;
  companyPhone: string;
  collectionAddress?: string;
  openingHours?: string;
}

class OrderEmailService {
  /**
   * Mapping of order statuses to email template types
   */
  private readonly statusToTemplateType: Record<string, string> = {
    'pending': 'order_confirmation',
    'in_production': 'order_update',
    'quality_check': 'order_update',
    'shipped': 'order_update',
    'completed': 'order_update',
  };

  /**
   * Mapping of order statuses to template names
   */
  private readonly statusToTemplateName: Record<string, string> = {
    'pending': 'Order Confirmation - Default',
    'in_production': 'Order In Production - Default',
    'quality_check': 'Order Quality Check - Default',
    'shipped': 'Order Ready for Collection - Default',
    'completed': 'Order Completed - Default',
  };

  /**
   * Send order status change email
   * Called whenever an order status changes
   */
  async sendOrderStatusEmail(orderId: string, newStatus: OrderStatus): Promise<void> {
    try {
      // Skip emails for on_hold and cancelled
      if (newStatus === 'on_hold' || newStatus === 'cancelled') {
        console.log(`[OrderEmailService] Skipping email for status: ${newStatus}`);
        return;
      }

      // Get order details
      const order = await this.getOrderWithDetails(orderId);
      if (!order) {
        console.error(`[OrderEmailService] Order ${orderId} not found`);
        return;
      }

      // Get company details
      const company = await db.select()
        .from(companies)
        .where(eq(companies.id, order.companyId))
        .limit(1);

      if (!company.length) {
        console.error(`[OrderEmailService] Company ${order.companyId} not found`);
        return;
      }

      const companyData = company[0];

      // Get patient details
      const patient = await db.select()
        .from(patients)
        .where(eq(patients.id, order.patientId))
        .limit(1);

      if (!patient.length) {
        console.error(`[OrderEmailService] Patient ${order.patientId} not found`);
        return;
      }

      const patientData = patient[0];

      // Prepare email context
      const emailContext = this.prepareEmailContext(order, patientData, companyData, newStatus);

      // Get template name for this status
      const templateName = this.statusToTemplateName[newStatus];
      if (!templateName) {
        console.log(`[OrderEmailService] No template configured for status: ${newStatus}`);
        return;
      }

      // Find template ID by name
      const [template] = await db.select()
        .from(emailTemplates)
        .where(
          and(
            eq(emailTemplates.name, templateName),
            eq(emailTemplates.companyId, order.companyId)
          )
        )
        .limit(1);

      if (!template) {
        console.error(`[OrderEmailService] Template not found: ${templateName}`);
        return;
      }

      // Send the email using the template
      await emailTrackingService.sendTemplateEmail(
        template.id,
        emailContext,
        {
          to: emailContext.customerEmail,
          companyId: order.companyId,
          patientId: order.patientId.toString(),
          sentBy: 'system',
          metadata: {
            orderId: orderId.toString(),
            orderStatus: newStatus,
            patientId: order.patientId.toString(),
          }
        }
      );

      console.log(`[OrderEmailService] Sent ${newStatus} email for order ${order.orderNumber} to ${emailContext.customerEmail}`);
    } catch (error) {
      console.error('[OrderEmailService] Error sending order status email:', error);
      // Don't throw - we don't want email failures to break order updates
    }
  }

  /**
   * Get order with all necessary details
   */
  private async getOrderWithDetails(orderId: string) {
    const orderData = await db.select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    return orderData.length > 0 ? orderData[0] : null;
  }

  /**
   * Prepare email context variables
   */
  private prepareEmailContext(
    order: any,
    patient: any,
    company: any,
    status: OrderStatus
  ): OrderEmailContext {
    // Calculate expected date (7 days from order date for new orders)
    const orderDate = new Date(order.createdAt);
    const expectedDate = new Date(orderDate);
    expectedDate.setDate(expectedDate.getDate() + 7);

    // Format dates nicely
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    };

    // Prepare collection address
    const collectionAddress = company.address 
      ? `${company.address}, ${company.city || ''}, ${company.postcode || ''}`.replace(/,\s*,/g, ',').trim()
      : company.name;

    // Default opening hours
    const openingHours = company.openingHours || 'Monday - Friday: 9:00 AM - 5:30 PM';

    return {
      orderNumber: order.orderNumber || `ORD-${order.id}`,
      customerName: `${patient.firstName} ${patient.lastName}`,
      customerEmail: patient.email,
      orderDate: formatDate(orderDate),
      expectedDate: formatDate(expectedDate),
      companyName: company.name,
      companyPhone: company.phone || 'Contact your practice',
      collectionAddress: collectionAddress,
      openingHours: openingHours,
    };
  }

  /**
   * Manually trigger order confirmation email (for testing or re-sending)
   */
  async sendOrderConfirmationEmail(orderId: string): Promise<void> {
    await this.sendOrderStatusEmail(orderId, 'pending');
  }

  /**
   * Manually trigger production started email
   */
  async sendProductionStartedEmail(orderId: string): Promise<void> {
    await this.sendOrderStatusEmail(orderId, 'in_production');
  }

  /**
   * Manually trigger quality check email
   */
  async sendQualityCheckEmail(orderId: string): Promise<void> {
    await this.sendOrderStatusEmail(orderId, 'quality_check');
  }

  /**
   * Manually trigger ready for collection email
   */
  async sendReadyForCollectionEmail(orderId: string): Promise<void> {
    await this.sendOrderStatusEmail(orderId, 'shipped');
  }

  /**
   * Manually trigger order completed email
   */
  async sendOrderCompletedEmail(orderId: string): Promise<void> {
    await this.sendOrderStatusEmail(orderId, 'completed');
  }

  /**
   * Get order email history
   */
  async getOrderEmailHistory(orderId: string) {
    return await db.select()
      .from(emailLogs)
      .where(eq(emailLogs.metadata, { orderId }))
      .orderBy(desc(emailLogs.sentAt));
  }

  /**
   * Get email statistics for an order
   */
  async getOrderEmailStats(orderId: string) {
    const logs = await this.getOrderEmailHistory(orderId);
    
    return {
      totalSent: logs.length,
      opened: logs.filter((log: any) => log.openCount > 0).length,
      clicked: logs.filter((log: any) => log.clickCount > 0).length,
      failed: logs.filter((log: any) => log.status === 'failed').length,
      timeline: logs.map((log: any) => ({
        status: log.metadata?.orderStatus,
        sentAt: log.sentAt,
        opened: log.openCount > 0,
        clicked: log.clickCount > 0,
      }))
    };
  }
}

export default new OrderEmailService();
