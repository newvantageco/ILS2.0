import { Worker, Job } from 'bullmq';
import { getRedisConnection } from '../queue/config';
import { db } from '../../db';
import { users, companies } from '@shared/schema';
import { eq } from 'drizzle-orm';

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
    console.warn('⚠️  Notification worker not started - Redis not available');
    return null;
  }

  const worker = new Worker<NotificationJobData>(
    'notifications',
    async (job: Job<NotificationJobData>) => {
      console.log(`🔔 Processing notification job ${job.id}: ${job.data.type}`);
      
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
        
        console.log(`✅ Notification job ${job.id} completed successfully`);
        return { success: true, sentAt: new Date().toISOString() };
      } catch (error) {
        console.error(`❌ Notification job ${job.id} failed:`, error);
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
    console.log(`✅ Notification job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ Notification job ${job?.id} failed:`, err.message);
  });

  worker.on('error', (err) => {
    console.error('Notification worker error:', err);
  });

  console.log('✅ Notification worker started');
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
  console.log(`📢 System notification for ${user.email}: ${title}`);
  console.log(`   Priority: ${priority}, Message: ${message}`);
  if (actionUrl) {
    console.log(`   Action URL: ${actionUrl}`);
  }

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

  console.log(`📦 Order notification for ${user.email}: Order ${orderId} - ${status}`);
  console.log(`   Message: ${message}`);

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

  console.log(`🤖 AI Insight for ${user.email}: ${insightType}`);
  console.log(`   Title: ${title}`);
  console.log(`   Summary: ${summary}`);
  if (detailUrl) {
    console.log(`   Details: ${detailUrl}`);
  }

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

  console.log(`🤝 Marketplace notification for ${user.email}: ${actionMessages[action]}`);

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
  console.log(`⚠️  [FALLBACK] Sending notification immediately: ${data.type}`);
  
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

// Start worker if Redis is available
export const notificationWorker = createNotificationWorker();
