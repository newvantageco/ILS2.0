import { Router, Request, Response } from 'express';
import { scheduledEmailService } from '../services/ScheduledEmailService';
import { authenticateUser } from '../middleware/auth';

const router = Router();

/**
 * Manual trigger for prescription reminders (admin only)
 */
router.post('/trigger/prescription-reminders', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    // Only admins can manually trigger
    if (user.role !== 'admin' && user.role !== 'platform_admin') {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }

    const result = await scheduledEmailService.triggerPrescriptionRemindersNow();
    
    res.json({
      message: 'Prescription reminders sent successfully',
      ...result
    });
  } catch (error: any) {
    console.error('Error triggering prescription reminders:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Manual trigger for recall notifications (admin only)
 */
router.post('/trigger/recall-notifications', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    // Only admins can manually trigger
    if (user.role !== 'admin' && user.role !== 'platform_admin') {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }

    const result = await scheduledEmailService.triggerRecallNotificationsNow();
    
    res.json({
      message: 'Recall notifications sent successfully',
      ...result
    });
  } catch (error: any) {
    console.error('Error triggering recall notifications:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
