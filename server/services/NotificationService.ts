import { WebSocket, WebSocketServer } from 'ws';
import { Server } from 'http';
import { db } from '../db';
import * as schema from '../../shared/schema';
import { Notification, NotificationService } from '../../shared/types/services';
import { desc, eq, sql } from 'drizzle-orm';

export class NotificationServiceImpl implements NotificationService {
  private static instance: NotificationServiceImpl | null = null;
  private wss?: WebSocketServer;
  private connections: Map<string, WebSocket> = new Map();
  private subscribers: Map<string, (notification: Notification) => void> = new Map();
  private channelHandlers: {
    websocket?: (notification: Notification) => void;
    email?: (notification: Notification) => void;
    sms?: (notification: Notification) => void;
  } = {};

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
      console.error('Error sending notification:', error);
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
      console.error('Error checking user role:', error);
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
      console.error('Error checking user organization:', error);
      return false;
    }
  }
}
export default NotificationServiceImpl;