import { WebSocket } from 'ws';
import type {
  Notification,
  NotificationService,
  NotificationType,
  NotificationSeverity,
  NotificationTarget
} from '@/types/services';

export class NotificationServiceImpl implements NotificationService {
  private notifications: Map<string, Notification>;
  private connections: Map<string, WebSocket>;

  constructor() {
    this.notifications = new Map();
    this.connections = new Map();
  }

  public handleConnection(ws: WebSocket, { userId }: { userId: string }): void {
    this.connections.set(userId, ws);
  }

  public handleDisconnection({ userId }: { userId: string }): void {
    this.connections.delete(userId);
  }

  public async sendNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<void> {
    const id = crypto.randomUUID();
    const fullNotification: Notification = {
      ...notification,
      id,
      createdAt: new Date()
    };

    this.notifications.set(id, fullNotification);

    if (notification.userId) {
      const ws = this.connections.get(notification.userId);
      if (ws) {
        ws.send(JSON.stringify(fullNotification));
      }
    }
  }

  public async broadcastNotification(notification: { type: string; message: string; broadcast: boolean }): Promise<void> {
    const id = crypto.randomUUID();
    const fullNotification: Notification = {
      id,
      type: 'system_alert' as NotificationType,
      title: 'System Notification',
      message: notification.message,
      severity: 'info' as NotificationSeverity,
      target: 'all' as NotificationTarget,
      createdAt: new Date()
    };

    this.notifications.set(id, fullNotification);
    this.connections.forEach(ws => ws.send(JSON.stringify(fullNotification)));
  }

  public async getNotificationHistory(userId: string): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(n => n.userId === userId || n.target === 'all')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 100);
  }

  public getConnectedClients(): string[] {
    return Array.from(this.connections.keys());
  }
}