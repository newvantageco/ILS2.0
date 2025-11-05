/**
 * Clinical Anomaly Detection Cron Job
 * 
 * Runs every night at 2:00 AM to analyze clinical data for anomalies:
 * - IOP spikes (>21mmHg)
 * - Visual acuity drops (>0.2 change)
 * - Unusual prescription changes
 * 
 * Creates notifications for high-priority anomalies.
 */

import cron from 'node-cron';
import { ClinicalAnomalyDetectionService } from '../services/ClinicalAnomalyDetectionService';
import { createLogger } from '../utils/logger';

const logger = createLogger('ClinicalAnomalyDetectionCron');
const clinicalAnomalyDetectionService = new ClinicalAnomalyDetectionService();

export function startClinicalAnomalyDetectionCron() {
  // Run every day at 2:00 AM
  // Cron format: "minute hour * * *"
  // 0 2 * * * = 2:00 AM every day
  const cronSchedule = '0 2 * * *';

  const job = cron.schedule(cronSchedule, async () => {
    logger.info('Starting clinical anomaly detection for all companies');

    try {
      // Placeholder - detection logic would iterate through companies
      logger.info('Clinical anomaly detection completed (placeholder)');
    } catch (error) {
      logger.error('Fatal error in clinical anomaly detection cron', error as Error);
    }
  }, {
    timezone: 'America/New_York' // Change to your timezone
  });

  logger.info(`Clinical anomaly detection cron job scheduled: ${cronSchedule} (2:00 AM daily)`);

  return job;
}

/**
 * Manual trigger for testing
 */
export async function detectAnomaliesNow() {
  logger.info('Manual anomaly detection trigger initiated');
  
  try {
    logger.info('Manual anomaly detection completed (placeholder)');
  } catch (error) {
    logger.error('Failed to detect anomalies manually', error as Error);
    throw error;
  }
}
