import { NotificationServiceImpl } from '../server/services/NotificationService';
import type { Notification } from '../shared/types/services';

type InsertValues = {
  title?: string;
  message?: string;
  type?: string;
  severity?: string;
  target?: { type: string; id?: string };
  createdAt?: Date;
};

jest.mock('../server/db', () => {
  const validTargetTypes = new Set(['user', 'role', 'organization']);

  const buildReturning = (values: InsertValues) => {
    if (!values.title || !values.message || !values.type || !values.target) {
      return jest.fn(() => Promise.reject(new Error('Invalid notification data')));
    }

    if (!validTargetTypes.has(values.target.type)) {
      return jest.fn(() => Promise.reject(new Error('Invalid notification target')));
    }

    const createdAt = values.createdAt ?? new Date();

    return jest.fn(() => Promise.resolve([
      {
        id: 'mock-notification-id',
        ...values,
        createdAt,
        read: false,
        readAt: null
      }
    ]));
  };

  return {
    db: {
      insert: jest.fn(() => ({
        values: jest.fn((values: InsertValues) => ({
          returning: buildReturning(values)
        }))
      })),
      select: jest.fn(() => ({
        from: jest.fn(() => ({
          where: jest.fn(() => ({
            orderBy: jest.fn(() => ({
              limit: jest.fn(() => Promise.resolve([]))
            }))
          }))
        }))
      })),
      update: jest.fn(() => ({
        set: jest.fn(() => ({
          where: jest.fn(() => Promise.resolve())
        }))
      })),
      delete: jest.fn(() => ({
        where: jest.fn(() => Promise.resolve())
      }))
    }
  };
});

describe('NotificationService', () => {
  let service: NotificationServiceImpl;
  let mockWebSocket: jest.Mock;
  let mockEmail: jest.Mock;
  let mockSMS: jest.Mock;

  beforeEach(() => {
    mockWebSocket = jest.fn();
    mockEmail = jest.fn();
    mockSMS = jest.fn();

    service = new NotificationServiceImpl();
    service.setChannelHandlers({
      websocket: mockWebSocket,
      email: mockEmail,
      sms: mockSMS
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Notification Sending', () => {
    const testNotification: Omit<Notification, 'id' | 'createdAt'> = {
      title: 'Test Notification',
      message: 'This is a test notification',
      type: 'info',
      severity: 'low',
      target: {
        type: 'user',
        id: 'user123'
      }
    };

    it('should send notification through all available channels', async () => {
      await service.sendNotification(testNotification);

      expect(mockWebSocket).toHaveBeenCalledWith(
        expect.objectContaining({
          title: testNotification.title,
          message: testNotification.message
        })
      );

      expect(mockEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          title: testNotification.title,
          message: testNotification.message
        })
      );

      expect(mockSMS).toHaveBeenCalledWith(
        expect.objectContaining({
          message: testNotification.message
        })
      );
    });
  });

  describe('Target-specific Tests', () => {
    it('should handle user-targeted notification', async () => {
      const userNotification: Omit<Notification, 'id' | 'createdAt'> = {
        title: 'User Notification',
        message: 'This is for a specific user',
        type: 'info',
        severity: 'medium',
        target: {
          type: 'user',
          id: 'user123'
        }
      };

      await service.sendNotification(userNotification);

      expect(mockWebSocket).toHaveBeenCalledWith(
        expect.objectContaining({
          title: userNotification.title,
          target: userNotification.target
        })
      );
    });

    it('should handle role-targeted notification', async () => {
      const roleNotification: Omit<Notification, 'id' | 'createdAt'> = {
        title: 'Role Notification',
        message: 'This is for all users with a specific role',
        type: 'warning',
        severity: 'high',
        target: {
          type: 'role',
          id: 'admin'
        }
      };

      await service.sendNotification(roleNotification);

      expect(mockWebSocket).toHaveBeenCalledWith(
        expect.objectContaining({
          title: roleNotification.title,
          target: roleNotification.target
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle channel delivery failure', async () => {
      mockEmail.mockRejectedValueOnce(new Error('Email delivery failed'));

      const notification: Omit<Notification, 'id' | 'createdAt'> = {
        title: 'Test',
        message: 'Test message',
        type: 'info',
        severity: 'low',
        target: {
          type: 'user',
          id: 'user123'
        }
      };

      await expect(service.sendNotification(notification)).rejects.toThrow('Email delivery failed');
    });

    it('should handle invalid notification data', async () => {
      const invalidNotification = {
        // Missing required fields
        message: 'Test message'
      };

      await expect(
        service.sendNotification(invalidNotification as any)
      ).rejects.toThrow();
    });

    it('should handle invalid target type', async () => {
      const invalidNotification = {
        title: 'Test',
        message: 'Test message',
        type: 'info',
        severity: 'low',
        target: {
          type: 'invalid-target' as 'user' | 'role' | 'organization',
          id: 'test123'
        }
      };

      await expect(
        service.sendNotification(invalidNotification as any)
      ).rejects.toThrow();
    });
  });

  describe('Subscription Management', () => {
    it('should allow subscribing to notifications', () => {
      const callback = jest.fn();
      const unsubscribe = service.subscribeToNotifications('user123', callback);

      // Trigger a notification
      const notification: Notification = {
        id: 'test123',
        title: 'Test',
        message: 'Test message',
        type: 'info',
        severity: 'low',
        target: {
          type: 'user',
          id: 'user123'
        },
        createdAt: new Date()
      };

      service.notifySubscribers(notification);

      expect(callback).toHaveBeenCalledWith(notification);

      // Test unsubscribe
      unsubscribe();
      service.notifySubscribers(notification);
      
      // Callback should not be called again after unsubscribe
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple subscriptions', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      service.subscribeToNotifications('user1', callback1);
      service.subscribeToNotifications('user2', callback2);

      const notification: Notification = {
        id: 'test123',
        title: 'Test',
        message: 'Test message',
        type: 'info',
        severity: 'low',
        target: {
          type: 'user',
          id: 'user1'
        },
        createdAt: new Date()
      };

      service.notifySubscribers(notification);

      expect(callback1).toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });
  });
});