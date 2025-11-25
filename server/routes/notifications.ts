import { Router, Request, Response } from 'express';
import { isAuthenticated } from '../replitAuth';
import NotificationService from '../services/NotificationService';
import { createLogger } from '../utils/logger';
import { getWebSocketService } from '../services/WebSocketService';

const router = Router();
const logger = createLogger('notifications');
const notificationService = NotificationService.getInstance();

// Type for authenticated request with user info
// Using intersection to avoid incompatibility with Express.User
interface AuthenticatedUser {
  id: string;
  role: string;
  email?: string;
}

interface AuthenticatedRequest extends Omit<Request, 'user'> {
  user: AuthenticatedUser;
}

/**
 * Validate UUID format for notification IDs
 * Prevents injection attacks and ensures valid IDs
 */
function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Validate and sanitize limit parameter
 */
function sanitizeLimit(limit: unknown): number {
  const parsed = parseInt(String(limit), 10);
  if (isNaN(parsed) || parsed < 1) return 50;
  return Math.min(parsed, 200); // Cap at 200 to prevent abuse
}

// Get user notifications
router.get(
  '/api/notifications',
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.id;
      const limit = sanitizeLimit(req.query.limit);
      const notifications = await notificationService.getUserNotifications(userId, limit);
      res.json({ notifications, userId, limit });
    } catch (error) {
      const authReq = req as AuthenticatedRequest;
      logger.error({ error, userId: authReq.user?.id, limit: req.query?.limit }, 'Error fetching notifications');
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  }
);

// Mark notification as read
router.post(
  '/api/notifications/:id/read',
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Validate notification ID format
      if (!isValidUUID(id)) {
        return res.status(400).json({ error: 'Invalid notification ID format' });
      }

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
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.id;

      await notificationService.markAllNotificationsAsRead(userId);

      res.json({ message: 'All notifications marked as read', userId });
    } catch (error) {
      const authReq = req as AuthenticatedRequest;
      logger.error({ error, userId: authReq.user?.id }, 'Error marking notifications as read');
      res.status(500).json({ error: 'Failed to update notifications' });
    }
  }
);

// Delete notification
router.delete(
  '/api/notifications/:id',
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Validate notification ID format
      if (!isValidUUID(id)) {
        return res.status(400).json({ error: 'Invalid notification ID format' });
      }

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
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.id;

      await notificationService.clearNotifications(userId);

      res.json({ message: 'All notifications cleared', userId });
    } catch (error) {
      const authReq = req as AuthenticatedRequest;
      logger.error({ error, userId: authReq.user?.id }, 'Error clearing notifications');
      res.status(500).json({ error: 'Failed to clear notifications' });
    }
  }
);

// Get real-time notification stats
router.get(
  '/api/notifications/stats',
  isAuthenticated,
  async (_req: Request, res: Response) => {
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
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      if (authReq.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { type = 'system', userId = authReq.user.id } = req.body;
      
      // Validate userId if provided in body
      if (typeof userId !== 'string' || !isValidUUID(userId)) {
        return res.status(400).json({ error: 'Invalid userId format' });
      }
      
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
      const authReq = req as AuthenticatedRequest;
      logger.error({ error, userId: authReq.user.id }, 'Error sending test notification');
      res.status(500).json({ error: 'Failed to send test notification' });
    }
  }
);

export default router;