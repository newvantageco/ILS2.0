import { WebSocket, WebSocketServer } from 'ws';
import { Server } from 'http';
import { db } from '../db';
import * as schema from '../../shared/schema';
import { Notification, NotificationService } from '../../shared/types/services';
import { desc, eq, sql } from 'drizzle-orm';
import { logger } from '../utils/logger';
import { getWebSocketService } from './WebSocketService';

// Enhanced notification interfaces
export interface CreateNotificationRequest {
  userId?: string;
  type: 'prescription' | 'order' | 'ai_analysis' | 'system' | 'appointment';
  title: string;
  message: string;
  data?: any;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  sendEmail?: boolean;
  ecpId?: string;
  role?: string;
}

export interface NotificationTemplate {
  type: string;
  title: string;
  message: string;
  emailSubject?: string;
}

export class NotificationServiceImpl implements NotificationService {
  private static instance: NotificationServiceImpl | null = null;
  private wss?: WebSocketServer;
  private connections: Map<string, WebSocket> = new Map();
  private subscribers: Map<string, (notification: Notification) => void> = new Map();
  private webSocketService = getWebSocketService();
  private channelHandlers: {
    websocket?: (notification: Notification) => void;
    email?: (notification: Notification) => void;
    sms?: (notification: Notification) => void;
  } = {};
  
  // Notification templates
  private templates: Record<string, NotificationTemplate> = {
    prescription_created: {
      type: 'prescription',
      title: 'New Prescription Created',
      message: 'A new prescription has been created for you.',
      emailSubject: 'New Prescription - ILS 2.0'
    },
    prescription_updated: {
      type: 'prescription',
      title: 'Prescription Updated',
      message: 'Your prescription has been updated.',
      emailSubject: 'Prescription Updated - ILS 2.0'
    },
    prescription_ready: {
      type: 'prescription',
      title: 'Prescription Ready for Pickup',
      message: 'Your prescription is ready for pickup.',
      emailSubject: 'Prescription Ready - ILS 2.0'
    },
    order_created: {
      type: 'order',
      title: 'New Order Placed',
      message: 'Your order has been successfully placed.',
      emailSubject: 'Order Confirmation - ILS 2.0'
    },
    order_shipped: {
      type: 'order',
      title: 'Order Shipped',
      message: 'Your order has been shipped and is on its way.',
      emailSubject: 'Order Shipped - ILS 2.0'
    },
    ai_analysis_complete: {
      type: 'ai_analysis',
      title: 'AI Analysis Complete',
      message: 'Your AI analysis has been completed.',
      emailSubject: 'AI Analysis Results - ILS 2.0'
    },
    appointment_reminder: {
      type: 'appointment',
      title: 'Appointment Reminder',
      message: 'You have an appointment scheduled for tomorrow.',
      emailSubject: 'Appointment Reminder - ILS 2.0'
    },
    system_maintenance: {
      type: 'system',
      title: 'System Maintenance',
      message: 'Scheduled maintenance will occur tonight.',
      emailSubject: 'System Maintenance - ILS 2.0'
    }
  };

  static getInstance(): NotificationServiceImpl {
    if (!this.instance) {
      this.instance = new NotificationServiceImpl();
    }
    return this.instance;
  }

  initialize(server: Server): void {
    if (!this.wss) {
      this.wss = new WebSocketServer({ server });
    }
  }

  setChannelHandlers(handlers: {
    websocket?: (notification: Notification) => void;
    email?: (notification: Notification) => void;
    sms?: (notification: Notification) => void;
  }): void {
    this.channelHandlers = handlers;
  }

  async sendNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<void> {
    try {
      const [created] = await db.insert(schema.notifications)
        .values({
          type: notification.type,
          title: notification.title,
          message: notification.message,
          severity: notification.severity,
          target: notification.target,
          read: false,
          createdAt: new Date()
        })
        .returning();

      const fullNotification: Notification = {
        ...notification,
        id: created.id,
        createdAt: created.createdAt,
        read: created.read,
        readAt: created.readAt ?? undefined
      };

      await Promise.all([
        this.channelHandlers.websocket?.(fullNotification),
        this.channelHandlers.email?.(fullNotification),
        this.channelHandlers.sms?.(fullNotification),
        this.notifySubscribers(fullNotification)
      ]);
    } catch (error) {
      logger.error('Error sending notification:', error);
      throw error;
    }
  }

  subscribeToNotifications(userId: string, callback: (notification: Notification) => void): () => void {
    this.subscribers.set(userId, callback);
    return () => {
      this.subscribers.delete(userId);
    };
  }

  async getUserNotifications(userId: string, limit = 50): Promise<Notification[]> {
    const rows = await db.select()
      .from(schema.notifications)
      .where(sql`(${schema.notifications.target} ->> 'type') = 'user' AND (${schema.notifications.target} ->> 'id') = ${userId}`)
      .orderBy(desc(schema.notifications.createdAt))
      .limit(limit);

    return rows.map(row => ({
      id: row.id,
      title: row.title,
      message: row.message,
      type: row.type,
      severity: row.severity,
      target: row.target as Notification['target'],
      createdAt: row.createdAt,
      read: row.read,
      readAt: row.readAt ?? undefined
    }));
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await db.update(schema.notifications)
      .set({ read: true, readAt: new Date() })
      .where(eq(schema.notifications.id, id));
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db.update(schema.notifications)
      .set({ read: true, readAt: new Date() })
      .where(sql`(${schema.notifications.target} ->> 'type') = 'user' AND (${schema.notifications.target} ->> 'id') = ${userId}`);
  }

  async deleteNotification(id: string): Promise<void> {
    await db.delete(schema.notifications)
      .where(eq(schema.notifications.id, id));
  }

  async clearNotifications(userId: string): Promise<void> {
    await db.delete(schema.notifications)
      .where(sql`(${schema.notifications.target} ->> 'type') = 'user' AND (${schema.notifications.target} ->> 'id') = ${userId}`);
  }

  async notifySubscribers(notification: Notification): Promise<void> {
    const targetType = notification.target.type;
    const targetId = notification.target.id;

    // Process subscribers in parallel
    const notificationPromises = Array.from(this.subscribers.entries()).map(async ([userId, callback]) => {
      let shouldNotify = false;

      if (targetType === 'user' && targetId === userId) {
        shouldNotify = true;
      } else if (targetType === 'role') {
        shouldNotify = await this.userHasRole(userId, targetId);
      } else if (targetType === 'organization') {
        shouldNotify = await this.userInOrganization(userId, targetId);
      }

      if (shouldNotify) {
        callback(notification);
      }
    });

    await Promise.all(notificationPromises);
  }

  private async userHasRole(userId: string, roleId: string): Promise<boolean> {
    try {
      const user = await db.query.users.findFirst({
        where: eq(schema.users.id, userId),
      });
      return user?.role === roleId;
    } catch (error) {
      logger.error('Error checking user role:', error);
      return false;
    }
  }

  private async userInOrganization(userId: string, orgId: string): Promise<boolean> {
    try {
      const user = await db.query.users.findFirst({
        where: eq(schema.users.id, userId),
      });
      return user?.companyId === orgId;
    } catch (error) {
      logger.error('Error checking user organization:', error);
      return false;
    }
  }

  // Enhanced real-time notification methods
  async createEnhancedNotification(request: CreateNotificationRequest): Promise<string> {
    try {
      const notificationId = this.generateNotificationId();
      
      // Create target object
      let target: any;
      if (request.userId) {
        target = { type: 'user', id: request.userId };
      } else if (request.role) {
        target = { type: 'role', id: request.role };
      } else if (request.ecpId) {
        target = { type: 'organization', id: request.ecpId };
      } else {
        throw new Error('Must specify userId, role, or ecpId');
      }

      const notification: Omit<Notification, 'id' | 'createdAt'> = {
        type: request.type,
        title: request.title,
        message: request.message,
        severity: request.priority as any,
        target,
        data: request.data || {},
        actionUrl: request.actionUrl
      };

      // Store in database
      const [created] = await db.insert(schema.notifications)
        .values({
          ...notification,
          read: false,
          createdAt: new Date()
        })
        .returning();

      const fullNotification: Notification = {
        ...notification,
        id: created.id,
        createdAt: created.createdAt,
        read: created.read,
        readAt: created.readAt ?? undefined
      };

      // Send via WebSocket if available
      if (this.webSocketService) {
        if (request.userId) {
          await this.webSocketService.sendNotification(request.userId, {
            id: fullNotification.id,
            userId: request.userId,
            type: request.type,
            title: request.title,
            message: request.message,
            data: request.data,
            priority: request.priority,
            ecpId: request.ecpId,
            timestamp: fullNotification.createdAt,
            read: false,
            actionUrl: request.actionUrl
          });
        } else if (request.ecpId) {
          await this.webSocketService.sendToECP(request.ecpId, {
            id: fullNotification.id,
            type: request.type,
            title: request.title,
            message: request.message,
            data: request.data,
            priority: request.priority,
            timestamp: fullNotification.createdAt,
            read: false,
            actionUrl: request.actionUrl
          });
        } else if (request.role) {
          await this.webSocketService.sendToRole(request.role, {
            id: fullNotification.id,
            type: request.type,
            title: request.title,
            message: request.message,
            data: request.data,
            priority: request.priority,
            timestamp: fullNotification.createdAt,
            read: false,
            actionUrl: request.actionUrl
          });
        }
      }

      // Send via existing channels
      await Promise.all([
        this.channelHandlers.websocket?.(fullNotification),
        this.channelHandlers.email?.(fullNotification),
        this.channelHandlers.sms?.(fullNotification),
        this.notifySubscribers(fullNotification)
      ]);

      logger.info('Enhanced notification created and sent', {
        notificationId: fullNotification.id,
        type: request.type,
        target,
        priority: request.priority
      });

      return fullNotification.id;
    } catch (error) {
      logger.error({ error, request }, 'Failed to create enhanced notification');
      throw error;
    }
  }

  async createFromTemplate(
    templateKey: string,
    target: { userId?: string; role?: string; ecpId?: string },
    data?: any,
    options?: Partial<CreateNotificationRequest>
  ): Promise<string> {
    const template = this.templates[templateKey];
    if (!template) {
      throw new Error(`Template not found: ${templateKey}`);
    }

    // Interpolate template variables
    const title = this.interpolateTemplate(template.title, data);
    const message = this.interpolateTemplate(template.message, data);

    return this.createEnhancedNotification({
      type: template.type as any,
      title,
      message,
      data,
      priority: 'medium',
      sendEmail: true,
      ...target,
      ...options
    });
  }

  private generateNotificationId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private interpolateTemplate(template: string, data?: any): string {
    if (!data) return template;

    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
  }

  // Convenience methods for common notifications
  async notifyPrescriptionCreated(userId: string, prescriptionData: any): Promise<void> {
    await this.createFromTemplate('prescription_created', { userId }, prescriptionData);
  }

  async notifyPrescriptionReady(userId: string, prescriptionData: any): Promise<void> {
    await this.createFromTemplate('prescription_ready', { userId }, prescriptionData);
  }

  async notifyOrderCreated(userId: string, orderData: any): Promise<void> {
    await this.createFromTemplate('order_created', { userId }, orderData);
  }

  async notifyOrderShipped(userId: string, orderData: any): Promise<void> {
    await this.createFromTemplate('order_shipped', { userId }, orderData);
  }

  async notifyAIAnalysisComplete(userId: string, analysisData: any): Promise<void> {
    await this.createFromTemplate('ai_analysis_complete', { userId }, analysisData);
  }

  async notifyAppointmentReminder(userId: string, appointmentData: any): Promise<void> {
    await this.createFromTemplate('appointment_reminder', { userId }, appointmentData);
  }

  async notifySystemMaintenance(role?: string): Promise<void> {
    if (role) {
      await this.createFromTemplate('system_maintenance', { role });
    } else {
      // Broadcast to all users
      await this.createEnhancedNotification({
        type: 'system',
        title: 'System Maintenance',
        message: 'Scheduled maintenance will occur tonight.',
        priority: 'medium',
        role: 'all'
      });
    }
  }
}
export default NotificationServiceImpl;