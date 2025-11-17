import { Queue, QueueOptions } from 'bullmq';
import Redis from 'ioredis';
import logger from '../utils/logger';

/**
 * Queue System Configuration
 * 
 * Uses BullMQ with Redis for background job processing.
 * Supports graceful degradation if Redis is unavailable.
 */

// Redis connection configuration
// Railway provides REDIS_URL if Redis plugin is enabled
// Format: redis://user:password@host:port/db or rediss:// for TLS
const REDIS_URL = process.env.REDIS_URL;
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
const REDIS_DB = parseInt(process.env.REDIS_DB || '0');

let redisConnection: Redis | null = null;
let redisAvailable = false;

/**
 * Initialize Redis connection with error handling
 */
export async function initializeRedis(): Promise<boolean> {
  try {
    // Use REDIS_URL from Railway if available, otherwise use individual config
    const redisConfig = REDIS_URL
      ? { 
          url: REDIS_URL,
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
        }
      : {
          host: REDIS_HOST,
          port: REDIS_PORT,
          password: REDIS_PASSWORD,
          db: REDIS_DB,
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
        };

    redisConnection = new Redis(redisConfig as any);
    redisConnection.setMaxListeners(100);

    // Test connection
    await redisConnection.ping();
    redisAvailable = true;
    logger.info({
      source: REDIS_URL ? 'REDIS_URL' : 'REDIS_HOST/PORT',
      host: REDIS_URL ? undefined : REDIS_HOST,
      port: REDIS_URL ? undefined : REDIS_PORT
    }, 'Redis connected successfully');

    // Initialize queues after successful connection
    initializeQueues();
    
    // Handle Redis errors
    redisConnection.on('error', (err) => {
      logger.error({ error: err.message }, 'Redis error');
      redisAvailable = false;
    });

    redisConnection.on('reconnecting', () => {
      logger.info({}, 'Redis reconnecting');
    });

    return true;
  } catch (error) {
    logger.warn({ error: (error as Error).message }, 'Redis not available');
    logger.warn({}, 'Queue system will operate in fallback mode (immediate execution)');
    redisConnection = null;
    redisAvailable = false;
    return false;
  }
}

/**
 * Check if Redis is available
 */
export function isRedisAvailable(): boolean {
  return redisAvailable && redisConnection !== null;
}

/**
 * Get Redis connection (returns null if unavailable)
 */
export function getRedisConnection(): Redis | null {
  return redisConnection;
}

/**
 * Default queue options
 */
function createQueueOptions(connection: Redis | null): QueueOptions | null {
  if (!connection) return null;
  
  return {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000, // 5 seconds base delay
      },
      removeOnComplete: {
        age: 24 * 3600, // Keep completed jobs for 24 hours
        count: 1000, // Keep last 1000 completed jobs
      },
      removeOnFail: {
        age: 7 * 24 * 3600, // Keep failed jobs for 7 days
        count: 5000, // Keep last 5000 failed jobs
      },
    },
  };
}

/**
 * Email Queue
 * For sending emails asynchronously (order confirmations, notifications, etc.)
 */
export let emailQueue: Queue | null = null;

/**
 * PDF Queue
 * For generating PDFs (order sheets, lab tickets, invoices, etc.)
 */
export let pdfQueue: Queue | null = null;

/**
 * Notification Queue
 * For in-app notifications, SMS, push notifications
 */
export let notificationQueue: Queue | null = null;

/**
 * AI Processing Queue
 * For AI tasks (daily briefings, forecasts, anomaly detection)
 */
export let aiQueue: Queue | null = null;

/**
 * OMA File Processing Queue
 * For parsing and processing OMA files
 */
export let omaQueue: Queue | null = null;

/**
 * Scheduled Jobs Queue
 * For cron-style scheduled tasks (daily briefings, weekly reports, etc.)
 */
export let scheduledQueue: Queue | null = null;

/**
 * Initialize queues (called after Redis connection is established)
 */
function initializeQueues() {
  if (!isRedisAvailable() || !redisConnection) {
    logger.warn({}, 'Skipping queue initialization - Redis not available');
    return;
  }

  const options = createQueueOptions(redisConnection);
  if (!options) return;

  emailQueue = new Queue('emails', options);
  pdfQueue = new Queue('pdfs', options);
  notificationQueue = new Queue('notifications', options);
  
  // AI queue with custom options (fewer retries, longer timeout)
  aiQueue = new Queue('ai-processing', {
    ...options,
    defaultJobOptions: {
      ...options.defaultJobOptions,
      attempts: 2, // AI tasks are expensive, don't retry too much
    },
  });
  
  omaQueue = new Queue('oma-processing', options);
  
  scheduledQueue = new Queue('scheduled-jobs', {
    ...options,
    defaultJobOptions: {
      ...options.defaultJobOptions,
      removeOnComplete: {
        age: 7 * 24 * 3600, // Keep for 7 days
        count: 100,
      },
    },
  });

  logger.info({
    queues: ['emails', 'pdfs', 'notifications', 'ai-processing', 'oma-processing', 'scheduled-jobs']
  }, 'All queues initialized successfully');
}

/**
 * Fallback execution function
 * Executes jobs immediately if Redis is not available
 */
export async function executeFallback<T>(
  queueName: string,
  jobName: string,
  data: any,
  handler: (data: any) => Promise<T>
): Promise<T> {
  logger.info({ queueName, jobName, mode: 'fallback' }, 'Executing job immediately (Redis unavailable)');
  try {
    const result = await handler(data);
    logger.info({ queueName, jobName, mode: 'fallback' }, 'Job completed');
    return result;
  } catch (error) {
    logger.error({ queueName, jobName, mode: 'fallback', error: error instanceof Error ? error.message : String(error) }, 'Job failed');
    throw error;
  }
}

/**
 * Graceful shutdown of all queues
 */
export async function closeQueues(): Promise<void> {
  logger.info({}, 'Closing queues');

  const queues = [
    emailQueue,
    pdfQueue,
    notificationQueue,
    aiQueue,
    omaQueue,
    scheduledQueue,
  ];

  await Promise.all(
    queues
      .filter((q) => q !== null)
      .map((q) => q!.close())
  );

  if (redisConnection) {
    await redisConnection.quit();
  }

  logger.info({}, 'All queues closed');
}

/**
 * Queue health check
 */
export async function getQueueHealth(): Promise<{
  redis: boolean;
  queues: Record<string, {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  }>;
}> {
  if (!isRedisAvailable()) {
    return {
      redis: false,
      queues: {},
    };
  }

  const queueStats: Record<string, any> = {};

  const queues = {
    emails: emailQueue,
    pdfs: pdfQueue,
    notifications: notificationQueue,
    'ai-processing': aiQueue,
    'oma-processing': omaQueue,
    'scheduled-jobs': scheduledQueue,
  };

  for (const [name, queue] of Object.entries(queues)) {
    if (queue) {
      const counts = await queue.getJobCounts();
      queueStats[name] = {
        waiting: counts.waiting || 0,
        active: counts.active || 0,
        completed: counts.completed || 0,
        failed: counts.failed || 0,
      };
    }
  }

  return {
    redis: true,
    queues: queueStats,
  };
}

// Note: Redis is initialized explicitly in server/index.ts
// to ensure proper startup order and error handling
