export type NotificationType = 'info' | 'warning' | 'error' | 'success';

export type NotificationChannel = 'email' | 'sms' | 'websocket';

export type NotificationTarget = 'user' | 'role' | 'organization';

export interface Notification {
  id?: string;
  title: string;
  message: string;
  type: NotificationType;
  severity: 'low' | 'medium' | 'high';
  target: {
    type: NotificationTarget;
    id: string;
  };
  createdAt?: Date;
}

export interface NotificationService {
  sendNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<void>;
  subscribeToNotifications(userId: string, callback: (notification: Notification) => void): () => void;
}