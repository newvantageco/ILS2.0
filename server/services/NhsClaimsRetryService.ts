/**
 * NHS Claims Retry Service
 *
 * Manages automatic retry of failed PCSE claim submissions with exponential backoff.
 *
 * Retry Strategy:
 * - 1st retry: 1 hour after failure
 * - 2nd retry: 4 hours after 1st retry
 * - 3rd retry: 24 hours after 2nd retry
 * - After 3 failed retries: Mark as failed, require manual intervention
 *
 * Background Job:
 * - Runs every 5 minutes
 * - Processes claims ready for retry (nextRetryAt <= now)
 * - Submits claims via NhsClaimsService
 * - Updates retry queue status
 *
 * @module server/services/NhsClaimsRetryService
 */

import { db } from "../db.js";
import { nhsClaimsRetryQueue, nhsClaims } from "../../shared/schema.js";
import { eq, lte, and, ne } from "drizzle-orm";
import { NhsClaimsService } from "./NhsClaimsService.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger('nhs-retry');

export class NhsClaimsRetryService {
  /**
   * Add a claim to the retry queue
   *
   * @param claimId - The claim ID that failed submission
   * @param companyId - The company ID
   * @param errorMessage - The error message from PCSE
   * @param errorCode - Optional error code
   * @param pcseResponse - Optional PCSE response data
   */
  static async addToRetryQueue(
    claimId: string,
    companyId: string,
    errorMessage: string,
    errorCode?: string,
    pcseResponse?: any
  ): Promise<void> {
    try {
      // Check if already in retry queue
      const [existing] = await db
        .select()
        .from(nhsClaimsRetryQueue)
        .where(and(
          eq(nhsClaimsRetryQueue.claimId, claimId),
          ne(nhsClaimsRetryQueue.status, 'completed'),
          ne(nhsClaimsRetryQueue.status, 'failed')
        ))
        .limit(1);

      if (existing) {
        logger.info({ claimId }, 'Claim already in retry queue, skipping');
        return;
      }

      // Calculate next retry time (1 hour from now for first retry)
      const nextRetryAt = new Date();
      nextRetryAt.setHours(nextRetryAt.getHours() + 1);

      // Add to retry queue
      await db.insert(nhsClaimsRetryQueue).values({
        claimId,
        companyId,
        retryCount: 0,
        maxRetries: parseInt(process.env.NHS_CLAIMS_MAX_RETRIES || '3'),
        nextRetryAt,
        errorMessage,
        errorCode,
        pcseResponse,
        status: 'pending',
      });

      logger.info({ claimId, nextRetryAt }, 'Claim added to retry queue');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error({ error: errorMsg, claimId }, 'Failed to add claim to retry queue');
      throw error;
    }
  }

  /**
   * Process the retry queue
   *
   * Finds all claims ready for retry and attempts to submit them.
   * Called by background job every 5 minutes.
   */
  static async processRetryQueue(): Promise<void> {
    try {
      // Find claims ready for retry
      const now = new Date();
      const readyClaims = await db
        .select()
        .from(nhsClaimsRetryQueue)
        .where(and(
          lte(nhsClaimsRetryQueue.nextRetryAt, now),
          eq(nhsClaimsRetryQueue.status, 'pending')
        ))
        .limit(10); // Process 10 at a time to avoid overwhelming PCSE API

      if (readyClaims.length === 0) {
        logger.debug('No claims ready for retry');
        return;
      }

      logger.info({ count: readyClaims.length }, 'Processing retry queue');

      // Process each claim
      for (const retryItem of readyClaims) {
        await this.retryClaimSubmission(retryItem);
      }

      logger.info({ count: readyClaims.length }, 'Retry queue processing complete');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error({ error: errorMsg }, 'Failed to process retry queue');
    }
  }

  /**
   * Retry a single claim submission
   *
   * @param retryItem - The retry queue item
   */
  private static async retryClaimSubmission(
    retryItem: typeof nhsClaimsRetryQueue.$inferSelect
  ): Promise<void> {
    try {
      // Update status to retrying
      await db
        .update(nhsClaimsRetryQueue)
        .set({
          status: 'retrying',
          lastAttemptAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(nhsClaimsRetryQueue.id, retryItem.id));

      logger.info({ claimId: retryItem.claimId, retryCount: retryItem.retryCount + 1 }, 'Retrying claim submission');

      // Attempt to submit claim
      await NhsClaimsService.submitClaim(retryItem.claimId);

      // If successful, mark as completed
      await db
        .update(nhsClaimsRetryQueue)
        .set({
          status: 'completed',
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(nhsClaimsRetryQueue.id, retryItem.id));

      logger.info({ claimId: retryItem.claimId }, 'Claim submission retry successful');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error({ error: errorMsg, claimId: retryItem.claimId }, 'Claim submission retry failed');

      // Increment retry count
      const newRetryCount = retryItem.retryCount + 1;

      // Check if max retries reached
      if (newRetryCount >= retryItem.maxRetries) {
        // Mark as failed
        await db
          .update(nhsClaimsRetryQueue)
          .set({
            status: 'failed',
            failedAt: new Date(),
            errorMessage: errorMsg,
            retryCount: newRetryCount,
            updatedAt: new Date(),
          })
          .where(eq(nhsClaimsRetryQueue.id, retryItem.id));

        // Update claim status to indicate manual intervention needed
        await db
          .update(nhsClaims)
          .set({
            pcseError: `Max retries (${retryItem.maxRetries}) reached. Manual intervention required. Last error: ${errorMsg}`,
            updatedAt: new Date(),
          })
          .where(eq(nhsClaims.id, retryItem.claimId));

        logger.error({ claimId: retryItem.claimId, retryCount: newRetryCount }, 'Max retries reached, manual intervention required');
      } else {
        // Calculate next retry time with exponential backoff
        const nextRetryAt = this.calculateNextRetry(newRetryCount);

        // Update retry queue
        await db
          .update(nhsClaimsRetryQueue)
          .set({
            status: 'pending',
            retryCount: newRetryCount,
            nextRetryAt,
            errorMessage: errorMsg,
            updatedAt: new Date(),
          })
          .where(eq(nhsClaimsRetryQueue.id, retryItem.id));

        logger.info({ claimId: retryItem.claimId, retryCount: newRetryCount, nextRetryAt }, 'Scheduled next retry');
      }
    }
  }

  /**
   * Calculate next retry time using exponential backoff
   *
   * @param retryCount - Current retry count (1-based)
   * @returns Next retry timestamp
   */
  private static calculateNextRetry(retryCount: number): Date {
    const nextRetryAt = new Date();

    // Exponential backoff: 1h, 4h, 24h
    switch (retryCount) {
      case 1:
        // 1st retry: 1 hour
        nextRetryAt.setHours(nextRetryAt.getHours() + 1);
        break;
      case 2:
        // 2nd retry: 4 hours
        nextRetryAt.setHours(nextRetryAt.getHours() + 4);
        break;
      case 3:
      default:
        // 3rd+ retry: 24 hours
        nextRetryAt.setHours(nextRetryAt.getHours() + 24);
        break;
    }

    return nextRetryAt;
  }

  /**
   * Get retry queue status for a company
   *
   * @param companyId - The company ID
   * @returns Retry queue statistics
   */
  static async getRetryQueueStatus(companyId: string): Promise<{
    pending: number;
    retrying: number;
    completed: number;
    failed: number;
    total: number;
  }> {
    const items = await db
      .select()
      .from(nhsClaimsRetryQueue)
      .where(eq(nhsClaimsRetryQueue.companyId, companyId));

    return {
      pending: items.filter(i => i.status === 'pending').length,
      retrying: items.filter(i => i.status === 'retrying').length,
      completed: items.filter(i => i.status === 'completed').length,
      failed: items.filter(i => i.status === 'failed').length,
      total: items.length,
    };
  }

  /**
   * Clear completed retry queue items older than 30 days
   *
   * Housekeeping function to prevent retry queue from growing indefinitely.
   */
  static async cleanupCompletedRetries(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await db
      .delete(nhsClaimsRetryQueue)
      .where(and(
        eq(nhsClaimsRetryQueue.status, 'completed'),
        lte(nhsClaimsRetryQueue.completedAt, thirtyDaysAgo)
      ));

    logger.info({ deletedCount: result.rowCount || 0 }, 'Cleaned up completed retry queue items');
    return result.rowCount || 0;
  }
}
