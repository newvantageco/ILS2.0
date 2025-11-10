/**
 * Usage Reporting Cron Job
 * 
 * Runs every day at 1:00 AM to report usage to Stripe:
 * - Orders created
 * - Invoices generated
 * - Storage consumed
 * - API calls made
 * - AI jobs processed
 * 
 * Reports to Stripe Billing Meter API for metered billing.
 */

import cron from 'node-cron';
import { meteredBillingService } from '../services/MeteredBillingService';
import { createLogger } from '../utils/logger';

const logger = createLogger('UsageReportingCron');

export function startUsageReportingCron() {
  // Run every day at 1:00 AM
  // Cron format: "minute hour * * *"
  // 0 1 * * * = 1:00 AM every day
  const cronSchedule = '0 1 * * *';

  const job = cron.schedule(cronSchedule, async () => {
    logger.info('Starting daily usage reporting to Stripe');

    try {
      // Report for yesterday's usage
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateString = yesterday.toISOString().split('T')[0];
      
      await meteredBillingService.reportDailyUsageToStripe(dateString);
      
      logger.info('Usage reporting completed');
    } catch (error) {
      logger.error({ err: error }, 'Fatal error in usage reporting cron');
    }
  }, {
    timezone: 'America/New_York' // Change to your timezone
  });

  logger.info(`Usage reporting cron job scheduled: ${cronSchedule} (1:00 AM daily)`);

  return job;
}

/**
 * Manual trigger for testing
 */
export async function reportUsageNow() {
  logger.info('Manual usage reporting trigger initiated');
  
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateString = yesterday.toISOString().split('T')[0];
    
    await meteredBillingService.reportDailyUsageToStripe(dateString);
    
    logger.info('Manual usage reporting completed');
  } catch (error) {
    logger.error({ err: error }, 'Failed to report usage manually');
    throw error;
  }
}
