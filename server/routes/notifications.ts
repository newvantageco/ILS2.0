import { Router } from 'express';
import { authenticateUser } from '../middleware/auth';
import NotificationService from '../services/NotificationService';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import * as schema from '@shared/schema';

const router = Router();
const notificationService = NotificationService.getInstance();

// Get user notifications
router.get(
  '/api/notifications',
  authenticateUser,
  async (req: any, res) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit as string) || 50;
      const notifications = await notificationService.getUserNotifications(userId, limit);
      res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  }
);

// Mark notification as read
router.post(
  '/api/notifications/:id/read',
  authenticateUser,
  async (req, res) => {
    try {
      const { id } = req.params;

      await db.update(schema.notifications)
        .set({
          read: true,
          readAt: new Date()
        })
        .where(eq(schema.notifications.id, id));

      res.json({ message: 'Notification marked as read' });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ error: 'Failed to update notification' });
    }
  }
);

// Mark all notifications as read
router.post(
  '/api/notifications/read-all',
  authenticateUser,
  async (req: any, res) => {
    try {
      const userId = req.user.id;

      await db.update(schema.notifications)
        .set({
          read: true,
          readAt: new Date()
        })
        .where(eq(schema.notifications.target.users, [userId]));

      res.json({ message: 'All notifications marked as read' });
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      res.status(500).json({ error: 'Failed to update notifications' });
    }
  }
);

// Delete notification
router.delete(
  '/api/notifications/:id',
  authenticateUser,
  async (req, res) => {
    try {
      const { id } = req.params;

      await db.delete(schema.notifications)
        .where(eq(schema.notifications.id, id));

      res.json({ message: 'Notification deleted' });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({ error: 'Failed to delete notification' });
    }
  }
);

// Clear all notifications
router.delete(
  '/api/notifications',
  authenticateUser,
  async (req: any, res) => {
    try {
      const userId = req.user.id;

      await db.delete(schema.notifications)
        .where(eq(schema.notifications.target.users, [userId]));

      res.json({ message: 'All notifications cleared' });
    } catch (error) {
      console.error('Error clearing notifications:', error);
      res.status(500).json({ error: 'Failed to clear notifications' });
    }
  }
);

export default router;