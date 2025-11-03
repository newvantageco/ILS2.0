/**
 * Queue Service
 * Background job processing with Bull/BullMQ
 * Handles async operations: emails, reports, AI processing, data exports
 */

import { cacheService } from './CacheService';

// Optional Bull dependency - gracefully handles if not installed
let Queue: any;
let Worker: any;
let QueueEvents: any;

try {
  const BullMQ = require('bullmq');
  Queue = BullMQ.Queue;
  Worker = BullMQ.Worker;
  QueueEvents = BullMQ.QueueEvents;
} catch (e) {
  console.warn('bullmq not installed. Job queues unavailable.');
}

interface JobData {
  companyId: string;
  userId?: string;
  [key: string]: any;
}

interface EmailJobData extends JobData {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

interface ReportJobData extends JobData {
  reportType: 'sales' | 'inventory' | 'patients' | 'financial';
  startDate: string;
  endDate: string;
  format: 'pdf' | 'excel' | 'csv';
}

interface AIJobData extends JobData {
  operation: 'frame-recommendation' | 'lens-optimization' | 'vision-analysis';
  inputData: Record<string, any>;
}

interface ExportJobData extends JobData {
  exportType: 'customers' | 'products' | 'orders' | 'full-backup';
  format: 'csv' | 'json' | 'excel';
  filters?: Record<string, any>;
}

interface NotificationJobData extends JobData {
  type: 'email' | 'sms' | 'push' | 'in-app';
  recipient: string;
  message: string;
  metadata?: Record<string, any>;
}

type JobType = 'email' | 'report' | 'ai-processing' | 'export' | 'notification' | 'cleanup';

class QueueService {
  private queues: Map<JobType, any> = new Map();
  private workers: Map<JobType, any> = new Map();
  private queueEvents: Map<JobType, any> = new Map();
  private isEnabled: boolean = false;
  private redisConnection: any;

  constructor() {
    this.initializeQueues();
  }

  private initializeQueues(): void {
    // Check if BullMQ is available
    if (!Queue) {
      console.log('⚠️  BullMQ not available - job queues disabled');
      console.log('   Install with: npm install bullmq');
      return;
    }

    // Configure Redis connection
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = parseInt(process.env.REDIS_PORT || '6379');
    const redisPassword = process.env.REDIS_PASSWORD;

    this.redisConnection = {
      host: redisHost,
      port: redisPort,
      password: redisPassword,
      maxRetriesPerRequest: null, // Required for BullMQ
    };

    try {
      // Initialize queues
      const queueTypes: JobType[] = ['email', 'report', 'ai-processing', 'export', 'notification', 'cleanup'];

      for (const queueType of queueTypes) {
        this.createQueue(queueType);
      }

      this.isEnabled = true;
      console.log('✓ Job queues initialized successfully');
    } catch (error) {
      console.error('Failed to initialize job queues:', error);
      console.log('⚠️  Job queues disabled - operations will run synchronously');
    }
  }

  private createQueue(queueType: JobType): void {
    try {
      // Create queue
      const queue = new Queue(queueType, {
        connection: this.redisConnection,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000, // Start with 2s, doubles each retry
          },
          removeOnComplete: {
            age: 86400, // Keep completed jobs for 24 hours
            count: 1000, // Keep max 1000 completed jobs
          },
          removeOnFail: {
            age: 604800, // Keep failed jobs for 7 days
            count: 5000, // Keep max 5000 failed jobs
          },
        },
      });

      this.queues.set(queueType, queue);

      // Create worker to process jobs
      const worker = new Worker(
        queueType,
        async (job: any) => {
          return this.processJob(queueType, job);
        },
        {
          connection: this.redisConnection,
          concurrency: this.getConcurrency(queueType),
        }
      );

      // Set up error handling
      worker.on('failed', (job: any, error: Error) => {
        console.error(`Job ${job.id} in queue ${queueType} failed:`, error);
      });

      worker.on('completed', (job: any) => {
        console.log(`Job ${job.id} in queue ${queueType} completed`);
      });

      this.workers.set(queueType, worker);

      // Create queue events listener
      const queueEvents = new QueueEvents(queueType, {
        connection: this.redisConnection,
      });

      this.queueEvents.set(queueType, queueEvents);

      console.log(`  ✓ Queue '${queueType}' created`);
    } catch (error) {
      console.error(`Failed to create queue '${queueType}':`, error);
    }
  }

  private getConcurrency(queueType: JobType): number {
    // Different concurrency levels based on job type
    switch (queueType) {
      case 'email':
        return 10; // Process 10 emails simultaneously
      case 'report':
        return 2; // Reports are heavy, limit concurrency
      case 'ai-processing':
        return 3; // AI operations are resource-intensive
      case 'export':
        return 5; // Moderate concurrency for exports
      case 'notification':
        return 20; // High concurrency for notifications
      case 'cleanup':
        return 1; // Single worker for cleanup
      default:
        return 5;
    }
  }

  /**
   * Process job based on type
   */
  private async processJob(queueType: JobType, job: any): Promise<any> {
    const data = job.data;

    console.log(`Processing ${queueType} job ${job.id} for company ${data.companyId}`);

    switch (queueType) {
      case 'email':
        return this.processEmailJob(data);
      case 'report':
        return this.processReportJob(data);
      case 'ai-processing':
        return this.processAIJob(data);
      case 'export':
        return this.processExportJob(data);
      case 'notification':
        return this.processNotificationJob(data);
      case 'cleanup':
        return this.processCleanupJob(data);
      default:
        throw new Error(`Unknown job type: ${queueType}`);
    }
  }

  /**
   * Process email job
   */
  private async processEmailJob(data: EmailJobData): Promise<void> {
    // Import email service dynamically to avoid circular dependencies
    // In production, you'd have an EmailService
    console.log(`Sending email to ${data.to}: ${data.subject}`);
    
    // Simulate email sending
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Actual implementation would use nodemailer or similar
    // const emailService = require('./EmailService');
    // await emailService.send(data);
  }

  /**
   * Process report generation job
   */
  private async processReportJob(data: ReportJobData): Promise<string> {
    console.log(`Generating ${data.reportType} report for company ${data.companyId}`);
    
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Return file key or download URL
    return `reports/${data.companyId}/${data.reportType}-${Date.now()}.${data.format}`;
  }

  /**
   * Process AI operation job
   */
  private async processAIJob(data: AIJobData): Promise<any> {
    console.log(`Running AI operation: ${data.operation} for company ${data.companyId}`);
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Return AI results
    return { success: true, results: {} };
  }

  /**
   * Process data export job
   */
  private async processExportJob(data: ExportJobData): Promise<string> {
    console.log(`Exporting ${data.exportType} for company ${data.companyId}`);
    
    // Simulate export
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Return file key or download URL
    return `exports/${data.companyId}/${data.exportType}-${Date.now()}.${data.format}`;
  }

  /**
   * Process notification job
   */
  private async processNotificationJob(data: NotificationJobData): Promise<void> {
    console.log(`Sending ${data.type} notification to ${data.recipient}`);
    
    // Simulate notification sending
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  /**
   * Process cleanup job
   */
  private async processCleanupJob(data: JobData): Promise<void> {
    console.log(`Running cleanup for company ${data.companyId}`);
    
    // Cleanup old temp files, expired cache, etc.
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  /**
   * Add job to queue
   */
  async addJob<T extends JobData>(
    queueType: JobType,
    data: T,
    options?: {
      priority?: number; // 1 (highest) to 10 (lowest)
      delay?: number; // Delay in milliseconds
      jobId?: string; // Unique job ID (prevents duplicates)
    }
  ): Promise<string> {
    if (!this.isEnabled) {
      // If queues disabled, run synchronously (fallback)
      console.warn(`Queue disabled - running ${queueType} job synchronously`);
      await this.processJob(queueType, { data, id: 'sync' });
      return 'sync';
    }

    const queue = this.queues.get(queueType);
    if (!queue) {
      throw new Error(`Queue '${queueType}' not found`);
    }

    const job = await queue.add(queueType, data, {
      priority: options?.priority,
      delay: options?.delay,
      jobId: options?.jobId,
    });

    return job.id;
  }

  /**
   * Schedule recurring job
   */
  async scheduleRecurringJob(
    queueType: JobType,
    data: JobData,
    pattern: string // Cron pattern, e.g., '0 * * * *' for every hour
  ): Promise<void> {
    if (!this.isEnabled) {
      console.warn('Queues disabled - cannot schedule recurring jobs');
      return;
    }

    const queue = this.queues.get(queueType);
    if (!queue) {
      throw new Error(`Queue '${queueType}' not found`);
    }

    await queue.add(queueType, data, {
      repeat: {
        pattern,
      },
    });

    console.log(`Scheduled recurring ${queueType} job: ${pattern}`);
  }

  /**
   * Get job status
   */
  async getJobStatus(queueType: JobType, jobId: string): Promise<any> {
    if (!this.isEnabled) {
      return null;
    }

    const queue = this.queues.get(queueType);
    if (!queue) {
      throw new Error(`Queue '${queueType}' not found`);
    }

    const job = await queue.getJob(jobId);
    if (!job) {
      return null;
    }

    const state = await job.getState();
    const progress = job.progress;

    return {
      id: job.id,
      state,
      progress,
      attemptsMade: job.attemptsMade,
      data: job.data,
      returnValue: job.returnvalue,
      failedReason: job.failedReason,
    };
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(queueType: JobType): Promise<any> {
    if (!this.isEnabled) {
      return null;
    }

    const queue = this.queues.get(queueType);
    if (!queue) {
      throw new Error(`Queue '${queueType}' not found`);
    }

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  }

  /**
   * Get all queue statistics
   */
  async getAllQueueStats(): Promise<Record<JobType, any>> {
    const stats: Record<string, any> = {};

    this.queues.forEach((queue, queueType) => {
      this.getQueueStats(queueType).then(queueStats => {
        stats[queueType] = queueStats;
      });
    });

    return stats;
  }

  /**
   * Cancel job
   */
  async cancelJob(queueType: JobType, jobId: string): Promise<boolean> {
    if (!this.isEnabled) {
      return false;
    }

    const queue = this.queues.get(queueType);
    if (!queue) {
      throw new Error(`Queue '${queueType}' not found`);
    }

    const job = await queue.getJob(jobId);
    if (!job) {
      return false;
    }

    await job.remove();
    return true;
  }

  /**
   * Pause queue
   */
  async pauseQueue(queueType: JobType): Promise<void> {
    if (!this.isEnabled) {
      return;
    }

    const queue = this.queues.get(queueType);
    if (!queue) {
      throw new Error(`Queue '${queueType}' not found`);
    }

    await queue.pause();
    console.log(`Queue '${queueType}' paused`);
  }

  /**
   * Resume queue
   */
  async resumeQueue(queueType: JobType): Promise<void> {
    if (!this.isEnabled) {
      return;
    }

    const queue = this.queues.get(queueType);
    if (!queue) {
      throw new Error(`Queue '${queueType}' not found`);
    }

    await queue.resume();
    console.log(`Queue '${queueType}' resumed`);
  }

  /**
   * Clean old jobs
   */
  async cleanQueue(
    queueType: JobType,
    grace: number = 86400000, // 24 hours default
    status: 'completed' | 'failed' | 'active' | 'delayed' | 'wait' = 'completed'
  ): Promise<number> {
    if (!this.isEnabled) {
      return 0;
    }

    const queue = this.queues.get(queueType);
    if (!queue) {
      throw new Error(`Queue '${queueType}' not found`);
    }

    const cleaned = await queue.clean(grace, 1000, status);
    console.log(`Cleaned ${cleaned.length} ${status} jobs from '${queueType}' queue`);
    
    return cleaned.length;
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down job queues...');

    // Close all workers
    for (const [queueType, worker] of Array.from(this.workers.entries())) {
      await worker.close();
      console.log(`  ✓ Worker '${queueType}' closed`);
    }

    // Close all queue event listeners
    for (const [queueType, events] of Array.from(this.queueEvents.entries())) {
      await events.close();
      console.log(`  ✓ Queue events '${queueType}' closed`);
    }

    // Close all queues
    for (const [queueType, queue] of Array.from(this.queues.entries())) {
      await queue.close();
      console.log(`  ✓ Queue '${queueType}' closed`);
    }

    console.log('✓ All job queues shut down');
  }

  /**
   * Get health status
   */
  getHealth(): { enabled: boolean; queues: number; workers: number } {
    return {
      enabled: this.isEnabled,
      queues: this.queues.size,
      workers: this.workers.size,
    };
  }
}

// Singleton instance
export const queueService = new QueueService();

// Graceful shutdown on process termination
process.on('SIGTERM', async () => {
  await queueService.shutdown();
});

process.on('SIGINT', async () => {
  await queueService.shutdown();
  process.exit(0);
});

// Helper functions for common operations
export async function sendEmailJob(
  companyId: string,
  to: string,
  subject: string,
  template: string,
  data: Record<string, any>
): Promise<string> {
  return queueService.addJob('email', {
    companyId,
    to,
    subject,
    template,
    data,
  });
}

export async function generateReportJob(
  companyId: string,
  reportType: 'sales' | 'inventory' | 'patients' | 'financial',
  startDate: string,
  endDate: string,
  format: 'pdf' | 'excel' | 'csv' = 'pdf'
): Promise<string> {
  return queueService.addJob('report', {
    companyId,
    reportType,
    startDate,
    endDate,
    format,
  });
}

export async function runAIProcessingJob(
  companyId: string,
  operation: 'frame-recommendation' | 'lens-optimization' | 'vision-analysis',
  inputData: Record<string, any>
): Promise<string> {
  return queueService.addJob('ai-processing', {
    companyId,
    operation,
    inputData,
  });
}

export async function exportDataJob(
  companyId: string,
  exportType: 'customers' | 'products' | 'orders' | 'full-backup',
  format: 'csv' | 'json' | 'excel' = 'csv',
  filters?: Record<string, any>
): Promise<string> {
  return queueService.addJob('export', {
    companyId,
    exportType,
    format,
    filters,
  });
}
