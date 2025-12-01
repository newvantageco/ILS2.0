/**
 * Session Cleanup Cron Job
 *
 * Runs hourly to remove expired sessions from the database.
 * This prevents session table bloat and improves query performance.
 */

import cron from 'node-cron';
import { db } from "../../db";
import { sessions } from "@shared/schema";
import { lt, sql } from "drizzle-orm";
import { createLogger } from "../utils/logger";

const logger = createLogger("SessionCleanupCron");

/**
 * Start the session cleanup cron job
 * Runs every hour at minute 0
 */
export function startSessionCleanupCron() {
  // Run every hour at minute 0
  // Cron format: "minute hour * * *"
  // 0 * * * * = Every hour at minute 0
  const cronSchedule = '0 * * * *';

  const job = cron.schedule(cronSchedule, async () => {
    logger.info("Starting session cleanup");

    try {
      const startTime = Date.now();

      // Delete all expired sessions
      const result = await db
        .delete(sessions)
        .where(lt(sessions.expire, new Date()));

      const deletedCount = result.rowCount || 0;
      const duration = Date.now() - startTime;

      logger.info({
        deletedCount,
        durationMs: duration
      }, `Session cleanup completed: removed ${deletedCount} expired sessions`);

      // Log warning if cleanup took too long (potential performance issue)
      if (duration > 5000) {
        logger.warn({
          deletedCount,
          durationMs: duration
        }, "Session cleanup took longer than expected - consider adding partitioning");
      }
    } catch (error) {
      logger.error({ err: error }, "Failed to clean up expired sessions");
    }
  }, {
    timezone: "UTC"
  });

  logger.info(`Session cleanup cron job scheduled: ${cronSchedule} (hourly)`);

  return job;
}

/**
 * Get session statistics for monitoring
 */
export async function getSessionStats(): Promise<{
  total: number;
  expired: number;
  active: number;
}> {
  try {
    const now = new Date();

    const [totalResult, expiredResult] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(sessions),
      db.select({ count: sql<number>`count(*)::int` })
        .from(sessions)
        .where(lt(sessions.expire, now))
    ]);

    const total = totalResult[0]?.count || 0;
    const expired = expiredResult[0]?.count || 0;

    return {
      total,
      expired,
      active: total - expired
    };
  } catch (error) {
    logger.error({ err: error }, "Failed to get session stats");
    throw error;
  }
}

/**
 * Manual session cleanup for immediate execution
 * Use for emergency cleanup or testing
 */
export async function cleanupSessionsNow(): Promise<number> {
  logger.info("Manual session cleanup triggered");

  try {
    const result = await db
      .delete(sessions)
      .where(lt(sessions.expire, new Date()));

    const deletedCount = result.rowCount || 0;

    logger.info({ deletedCount }, "Manual session cleanup completed");

    return deletedCount;
  } catch (error) {
    logger.error({ err: error }, "Failed to execute manual session cleanup");
    throw error;
  }
}

/**
 * Clean up sessions for a specific user (for logout-all functionality)
 */
export async function cleanupUserSessions(userId: string): Promise<number> {
  logger.info({ userId }, "Cleaning up sessions for user");

  try {
    const result = await db
      .delete(sessions)
      .where(sql`${sessions.userId} = ${userId}`);

    const deletedCount = result.rowCount || 0;

    logger.info({ userId, deletedCount }, "User session cleanup completed");

    return deletedCount;
  } catch (error) {
    logger.error({ err: error, userId }, "Failed to clean up user sessions");
    throw error;
  }
}
