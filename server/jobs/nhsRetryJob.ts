/**
 * NHS Claims Retry Background Job
 *
 * Runs every 5 minutes to process the retry queue.
 * Automatically retries failed PCSE claim submissions with exponential backoff.
 *
 * Usage:
 * import { startNhsRetryJob, stopNhsRetryJob } from './jobs/nhsRetryJob';
 *
 * // Start the job when server starts
 * startNhsRetryJob();
 *
 * // Stop the job when server shuts down
 * stopNhsRetryJob();
 *
 * @module server/jobs/nhsRetryJob
 */

import { NhsClaimsRetryService } from '../services/NhsClaimsRetryService.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('nhs-retry-job');

let intervalId: NodeJS.Timeout | null = null;
const JOB_INTERVAL = 5 * 60 * 1000; // 5 minutes

/**
 * Process the retry queue
 * Called every 5 minutes by the interval timer
 */
async function processRetryQueue(): Promise<void> {
  try {
    logger.info('NHS retry job started');
    await NhsClaimsRetryService.processRetryQueue();
    logger.info('NHS retry job completed');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error({ error: errorMessage }, 'NHS retry job failed');
  }
}

/**
 * Start the NHS retry background job
 *
 * Runs every 5 minutes to process the retry queue.
 * Safe to call multiple times - will not create duplicate jobs.
 */
export function startNhsRetryJob(): void {
  // Check if auto-retry is enabled
  const autoRetryEnabled = process.env.NHS_CLAIMS_AUTO_RETRY === 'true';
  if (!autoRetryEnabled) {
    logger.info('NHS auto-retry disabled, not starting retry job');
    return;
  }

  // Don't start if already running
  if (intervalId) {
    logger.warn('NHS retry job already running');
    return;
  }

  logger.info({ intervalMinutes: 5 }, 'Starting NHS retry job');

  // Run immediately on start
  processRetryQueue();

  // Then run every 5 minutes
  intervalId = setInterval(processRetryQueue, JOB_INTERVAL);

  logger.info('NHS retry job started successfully');
}

/**
 * Stop the NHS retry background job
 *
 * Safe to call even if job is not running.
 */
export function stopNhsRetryJob(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    logger.info('NHS retry job stopped');
  }
}

/**
 * Check if the NHS retry job is running
 *
 * @returns true if job is running, false otherwise
 */
export function isNhsRetryJobRunning(): boolean {
  return intervalId !== null;
}
