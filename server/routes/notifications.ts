import { Router } from 'express';
import { isAuthenticated } from '../replitAuth';
import NotificationService from '../services/NotificationService';
import { createLogger } from '../utils/logger';
import { getWebSocketService } from '../services/WebSocketService';

const router = Router();
const logger = createLogger('notifications');
const notificationService = NotificationService.getInstance();

// Get user notifications
router.get(
  '/api/notifications',
  isAuthenticated,
  async (req: any, res) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit as string) || 50;
      const notifications = await notificationService.getUserNotifications(userId, limit);
      res.json({ notifications, userId, limit });
    } catch (error) {
      logger.error({ error, userId: req.user?.id, limit: req.query?.limit }, 'Error fetching notifications');
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  }
);

// Mark notification as read
router.post(
  '/api/notifications/:id/read',
  isAuthenticated,
  async (req, res) => {
    try {
      const { id } = req.params;

      await notificationService.markNotificationAsRead(id);

      res.json({ message: 'Notification marked as read', notificationId: id });
    } catch (error) {
      logger.error({ error, notificationId: req.params?.id }, 'Error marking notification as read');
      res.status(500).json({ error: 'Failed to update notification' });
    }
  }
);

// Mark all notifications as read
router.post(
  '/api/notifications/read-all',
  isAuthenticated,
  async (req: any, res) => {
    try {
      const userId = req.user.id;

      await notificationService.markAllNotificationsAsRead(userId);

      res.json({ message: 'All notifications marked as read', userId });
    } catch (error) {
      logger.error({ error, userId: req.user?.id }, 'Error marking notifications as read');
      res.status(500).json({ error: 'Failed to update notifications' });
    }
  }
);

// Delete notification
router.delete(
  '/api/notifications/:id',
  isAuthenticated,
  async (req, res) => {
    try {
      const { id } = req.params;

      await notificationService.deleteNotification(id);

      res.json({ message: 'Notification deleted', notificationId: id });
    } catch (error) {
      logger.error({ error, notificationId: req.params?.id }, 'Error deleting notification');
      res.status(500).json({ error: 'Failed to delete notification' });
    }
  }
);

// Clear all notifications
router.delete(
  '/api/notifications',
  isAuthenticated,
  async (req: any, res) => {
    try {
      const userId = req.user.id;

      await notificationService.clearNotifications(userId);

      res.json({ message: 'All notifications cleared', userId });
    } catch (error) {
      logger.error({ error, userId: req.user?.id }, 'Error clearing notifications');
      res.status(500).json({ error: 'Failed to clear notifications' });
    }
  }
);

// Get real-time notification stats
router.get(
  '/api/notifications/stats',
  isAuthenticated,
  async (req: any, res) => {
    try {
      const webSocketService = getWebSocketService();
      const stats = webSocketService?.getStats() || {
        totalConnections: 0,
        userConnections: 0,
        ecpConnections: 0,
        connectionsByRole: {}
      };

      res.json(stats);
    } catch (error) {
      logger.error({ error }, 'Error getting notification stats');
      res.status(500).json({ error: 'Failed to get notification stats' });
    }
  }
);

// Send test notification (admin only)
router.post(
  '/api/notifications/test',
  isAuthenticated,
  async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { type = 'system', userId = req.user.id } = req.body;
      
      await notificationService.createEnhancedNotification({
        userId,
        type,
        title: 'Test Notification',
        message: 'This is a test notification from the ILS 2.0 system.',
        priority: 'medium',
        sendEmail: false
      });
      
      res.json({ success: true, message: 'Test notification sent' });
    } catch (error) {
      logger.error({ error, userId: req.user.id }, 'Error sending test notification');
      res.status(500).json({ error: 'Failed to send test notification' });
    }
  }
);

export default router;