import { WebSocket, WebSocketServer } from 'ws';
import { Server } from 'http';
import { db } from '../db';
import * as schema from '../../shared/schema';
import { Notification, NotificationService } from '../../shared/types/services';

export class NotificationServiceImpl implements NotificationService {
  private wss?: WebSocketServer;
  private connections: Map<string, WebSocket> = new Map();
  private subscribers: Map<string, (notification: Notification) => void> = new Map();
  private channelHandlers: {
    websocket?: (notification: Notification) => void;
    email?: (notification: Notification) => void;
    sms?: (notification: Notification) => void;
  } = {};

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
          createdAt: new Date()
        })
        .returning();

      const fullNotification: Notification = {
        ...notification,
        id: created.id,
        createdAt: created.createdAt
      };

      await Promise.all([
        this.channelHandlers.websocket?.(fullNotification),
        this.channelHandlers.email?.(fullNotification),
        this.channelHandlers.sms?.(fullNotification)
      ]);

      this.notifySubscribers(fullNotification);
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

  notifySubscribers(notification: Notification): void {
    const targetType = notification.target.type;
    const targetId = notification.target.id;

    this.subscribers.forEach((callback, userId) => {
      if (
        (targetType === 'user' && targetId === userId) ||
        (targetType === 'role' && this.userHasRole(userId, targetId)) ||
        (targetType === 'organization' && this.userInOrganization(userId, targetId))
      ) {
        callback(notification);
      }
    });
  }

  private userHasRole(userId: string, roleId: string): boolean {
    // TODO: Implement role check from database
    return false;
  }

  private userInOrganization(userId: string, orgId: string): boolean {
    // TODO: Implement organization check from database
    return false;
  }
}
}

export default NotificationService;