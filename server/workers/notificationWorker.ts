import { Worker, Job } from 'bullmq';
import { getRedisConnection } from '../queue/config';
import { db } from '../../db';
import { users, companies } from '@shared/schema';
import { eq } from 'drizzle-orm';
import logger from '../utils/logger';

/**
 * Notification Job Data Types
 */
interface SystemNotificationData {
  type: 'system';
  userId: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
}

interface OrderNotificationData {
  type: 'order';
  userId: string;
  orderId: string;
  status: string;
  message: string;
}

interface AIInsightNotificationData {
  type: 'ai-insight';
  userId: string;
  insightType: 'briefing' | 'forecast' | 'anomaly' | 'recommendation';
  title: string;
  summary: string;
  detailUrl?: string;
}

interface MarketplaceNotificationData {
  type: 'marketplace';
  userId: string;
  connectionId: number;
  action: 'request' | 'accepted' | 'rejected';
  companyName: string;
}

type NotificationJobData = 
  | SystemNotificationData
  | OrderNotificationData
  | AIInsightNotificationData
  | MarketplaceNotificationData;

/**
 * Notification Worker
 * Processes notification jobs from the notification queue
 */
export function createNotificationWorker() {
  const connection = getRedisConnection();

  if (!connection) {
    logger.warn('Notification worker not started - Redis not available');
    return null;
  }

  const worker = new Worker<NotificationJobData>(
    'notifications',
    async (job: Job<NotificationJobData>) => {
      logger.info({ jobId: job.id, type: job.data.type }, 'Processing notification job');

      try {
        switch (job.data.type) {
          case 'system':
            await processSystemNotification(job.data);
            break;

          case 'order':
            await processOrderNotification(job.data);
            break;

          case 'ai-insight':
            await processAIInsightNotification(job.data);
            break;

          case 'marketplace':
            await processMarketplaceNotification(job.data);
            break;

          default:
            throw new Error(`Unknown notification type: ${(job.data as any).type}`);
        }

        logger.info({ jobId: job.id }, 'Notification job completed successfully');
        return { success: true, sentAt: new Date().toISOString() };
      } catch (error) {
        logger.error({
          error: error instanceof Error ? error.message : String(error),
          jobId: job.id
        }, 'Notification job failed');
        throw error;
      }
    },
    {
      connection,
      concurrency: 10, // Process up to 10 notifications concurrently
      limiter: {
        max: 200, // Max 200 notifications
        duration: 60000, // Per minute
      },
    }
  );

  // Worker event handlers
  worker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Notification job completed');
  });

  worker.on('failed', (job, err) => {
    logger.error({
      error: err.message,
      jobId: job?.id
    }, 'Notification job failed');
  });

  worker.on('error', (err) => {
    logger.error({ error: err.message }, 'Notification worker error');
  });

  logger.info('Notification worker started');
  return worker;
}

/**
 * Process system notification
 */
async function processSystemNotification(data: SystemNotificationData): Promise<void> {
  const { userId, title, message, priority, actionUrl } = data;

  // Get user details
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    throw new Error(`User ${userId} not found`);
  }

  // Store notification in database (using aiNotifications table for now)
  // In production, you might want a dedicated notifications table
  logger.info({
    email: user.email,
    title,
    priority,
    message,
    actionUrl,
    type: 'system'
  }, 'System notification processed');

  // TODO: Store in database
  // await db.insert(notifications).values({
  //   userId,
  //   type: 'system',
  //   title,
  //   message,
  //   priority,
  //   actionUrl,
  //   read: false,
  // });

  // TODO: Send WebSocket notification for real-time updates
  // await websocketService.sendToUser(userId, {
  //   type: 'notification',
  //   data: { title, message, priority, actionUrl }
  // });
}

/**
 * Process order notification
 */
async function processOrderNotification(data: OrderNotificationData): Promise<void> {
  const { userId, orderId, status, message } = data;

  // Get user details
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    throw new Error(`User ${userId} not found`);
  }

  logger.info({
    email: user.email,
    orderId,
    status,
    message,
    type: 'order'
  }, 'Order notification processed');

  // TODO: Store notification and send WebSocket update
  // await db.insert(notifications).values({
  //   userId,
  //   type: 'order',
  //   title: `Order ${orderId} ${status}`,
  //   message,
  //   actionUrl: `/orders/${orderId}`,
  //   read: false,
  // });
}

/**
 * Process AI insight notification
 */
async function processAIInsightNotification(data: AIInsightNotificationData): Promise<void> {
  const { userId, insightType, title, summary, detailUrl } = data;

  // Get user details
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    throw new Error(`User ${userId} not found`);
  }

  logger.info({
    email: user.email,
    insightType,
    title,
    summary,
    detailUrl,
    type: 'ai-insight'
  }, 'AI Insight notification processed');

  // TODO: Store notification
  // await db.insert(notifications).values({
  //   userId,
  //   type: 'ai-insight',
  //   title,
  //   message: summary,
  //   actionUrl: detailUrl,
  //   read: false,
  // });
}

/**
 * Process marketplace notification
 */
async function processMarketplaceNotification(data: MarketplaceNotificationData): Promise<void> {
  const { userId, connectionId, action, companyName } = data;

  // Get user details
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    throw new Error(`User ${userId} not found`);
  }

  const actionMessages = {
    request: `${companyName} wants to connect with you`,
    accepted: `${companyName} accepted your connection request`,
    rejected: `${companyName} declined your connection request`,
  };

  logger.info({
    email: user.email,
    action,
    companyName,
    connectionId,
    message: actionMessages[action],
    type: 'marketplace'
  }, 'Marketplace notification processed');

  // TODO: Store notification
  // await db.insert(notifications).values({
  //   userId,
  //   type: 'marketplace',
  //   title: 'Marketplace Connection',
  //   message: actionMessages[action],
  //   actionUrl: `/marketplace/connections`,
  //   read: false,
  // });
}

/**
 * Fallback: Send notification immediately if queue not available
 */
export async function sendNotificationImmediate(data: NotificationJobData): Promise<void> {
  logger.warn({ type: data.type }, 'Sending notification immediately (fallback mode)');

  switch (data.type) {
    case 'system':
      await processSystemNotification(data);
      break;
    case 'order':
      await processOrderNotification(data);
      break;
    case 'ai-insight':
      await processAIInsightNotification(data);
      break;
    case 'marketplace':
      await processMarketplaceNotification(data);
      break;
    default:
      throw new Error(`Unknown notification type: ${(data as any).type}`);
  }
}

// Export the factory function - worker is initialized after Redis connects
// Do NOT auto-create at import time to avoid boot order issues
export { createNotificationWorker };
