import { WebSocket } from "ws";
import type {
  Notification,
  NotificationService,
  NotificationSeverity,
  NotificationType,
} from "@/types/services";

const GLOBAL_TARGET_ID = "global";

function serialize(notification: Notification): string {
  return JSON.stringify({
    ...notification,
    createdAt: notification.createdAt?.toISOString(),
  });
}

export class NotificationServiceImpl implements NotificationService {
  private notifications = new Map<string, Notification>();
  private connections = new Map<string, Set<WebSocket>>();

  public handleConnection(ws: WebSocket, { userId }: { userId: string }): void {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }

    this.connections.get(userId)!.add(ws);

    ws.on("close", () => {
      this.connections.get(userId)?.delete(ws);
      if ((this.connections.get(userId)?.size ?? 0) === 0) {
        this.connections.delete(userId);
      }
    });
  }

  public handleDisconnection({ userId }: { userId: string }): void {
    this.connections.delete(userId);
  }

  public async sendNotification(notification: Omit<Notification, "id" | "createdAt">): Promise<void> {
    const id = crypto.randomUUID();
    const createdAt = new Date();
    const fullNotification: Notification = {
      ...notification,
      id,
      createdAt,
    };

    this.notifications.set(id, fullNotification);
    this.dispatch(fullNotification);
  }

  public async broadcastNotification(notification: { type: string; message: string; broadcast: boolean }): Promise<void> {
    const normalizedType: NotificationType = ["info", "warning", "error", "success"].includes(notification.type as NotificationType)
      ? (notification.type as NotificationType)
      : "info";

    const id = crypto.randomUUID();
    const createdAt = new Date();

    const fullNotification: Notification = {
      id,
      title: "System Notification",
      message: notification.message,
      type: normalizedType,
      severity: "low" as NotificationSeverity,
      target: { type: "organization", id: GLOBAL_TARGET_ID },
      createdAt,
    };

    this.notifications.set(id, fullNotification);
    this.dispatch(fullNotification);
  }

  public async getNotificationHistory(userId: string): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter((notification) => {
        if (!notification.target) {
          return false;
        }

        if (notification.target.type === "user") {
          return notification.target.id === userId;
        }

        // Deliver role/organization/global notifications to all connected users for now.
        return true;
      })
      .sort((a, b) => {
        const aTime = a.createdAt ? a.createdAt.getTime() : 0;
        const bTime = b.createdAt ? b.createdAt.getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, 100);
  }

  public getConnectedClients(): string[] {
    return Array.from(this.connections.keys());
  }

  private dispatch(notification: Notification): void {
    if (notification.target?.type === "user") {
      this.sendToUser(notification.target.id, notification);
      return;
    }

    const payload = serialize(notification);
    this.connections.forEach((sockets) => {
      sockets.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(payload);
        }
      });
    });
  }

  private sendToUser(userId: string, notification: Notification): void {
    const sockets = this.connections.get(userId);
    if (!sockets || sockets.size === 0) {
      return;
    }

    const payload = serialize(notification);
    sockets.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    });
  }
}