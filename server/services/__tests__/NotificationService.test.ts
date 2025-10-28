import { NotificationServiceImpl } from '../NotificationService';
import { db } from '../../db';
import * as schema from '../../../shared/schema';
import { Notification } from '../../../shared/types/services';

// Mock the database
jest.mock('../../db', () => ({
  db: {
    insert: jest.fn(),
    select: jest.fn(),
  },
}));

describe('NotificationServiceImpl', () => {
  let notificationService: NotificationServiceImpl;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    notificationService = new NotificationServiceImpl();
  });

  beforeAll(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('sendNotification', () => {
    const mockNotification: Omit<Notification, 'id' | 'createdAt'> = {
      title: 'Test Notification',
      message: 'This is a test message',
      type: 'info',
      severity: 'low',
      target: {
        type: 'user',
        id: 'user123',
      },
    };

    it('should successfully send a notification', async () => {
      const mockCreated = {
        id: 'notification123',
        createdAt: new Date(),
        ...mockNotification,
      };

      (db.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockCreated]),
        }),
      });

      const websocketHandler = jest.fn();
      const emailHandler = jest.fn();
      const smsHandler = jest.fn();

      notificationService.setChannelHandlers({
        websocket: websocketHandler,
        email: emailHandler,
        sms: smsHandler,
      });

      await notificationService.sendNotification(mockNotification);

      // Verify database insertion
      expect(db.insert).toHaveBeenCalledWith(schema.notifications);

      // Verify channel handlers were called
      expect(websocketHandler).toHaveBeenCalledWith(expect.objectContaining(mockCreated));
      expect(emailHandler).toHaveBeenCalledWith(expect.objectContaining(mockCreated));
      expect(smsHandler).toHaveBeenCalledWith(expect.objectContaining(mockCreated));
    });

    it('should handle database errors gracefully', async () => {
      const error = new Error('Database error');
      (db.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockRejectedValue(error),
        }),
      });

      await expect(notificationService.sendNotification(mockNotification))
        .rejects
        .toThrow('Database error');
    });
  });

  describe('subscribeToNotifications', () => {
    it('should allow subscribing and unsubscribing to notifications', () => {
      const userId = 'user123';
      const callback = jest.fn();

      // Subscribe
      const unsubscribe = notificationService.subscribeToNotifications(userId, callback);

      // Verify subscription
      const notification: Notification = {
        id: 'notification123',
        title: 'Test',
        message: 'Test message',
        type: 'info',
        severity: 'low',
        target: {
          type: 'user',
          id: userId,
        },
        createdAt: new Date(),
      };

      notificationService.notifySubscribers(notification);
      expect(callback).toHaveBeenCalledWith(notification);

      // Unsubscribe
      unsubscribe();

      // Verify unsubscription
      notificationService.notifySubscribers(notification);
      expect(callback).toHaveBeenCalledTimes(1); // Should not be called again
    });

    it('should only notify relevant subscribers based on target type and id', () => {
      const user1Id = 'user1';
      const user2Id = 'user2';
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      notificationService.subscribeToNotifications(user1Id, callback1);
      notificationService.subscribeToNotifications(user2Id, callback2);

      const notification: Notification = {
        id: 'notification123',
        title: 'Test',
        message: 'Test message',
        type: 'info',
        severity: 'low',
        target: {
          type: 'user',
          id: user1Id,
        },
        createdAt: new Date(),
      };

      notificationService.notifySubscribers(notification);

      expect(callback1).toHaveBeenCalledWith(notification);
      expect(callback2).not.toHaveBeenCalled();
    });
  });
});