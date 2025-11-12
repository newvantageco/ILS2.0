/**
 * Daily Briefing Cron Job
 *
 * Runs every morning at 8:00 AM to generate proactive insights
 * for all active companies using AI/ML worker.
 */

import cron from 'node-cron';
import { db } from "../../db";
import { companies, aiNotifications } from "@shared/schema";
import { eq } from "drizzle-orm";
import { queueDailyBriefing } from "../queue/helpers";
import { createLogger } from "../utils/logger";

const logger = createLogger("DailyBriefingCron");

export function startDailyBriefingCron() {

  // Run every day at 8:00 AM
  // Cron format: "minute hour * * *"
  // 0 8 * * * = 8:00 AM every day
  const cronSchedule = '0 8 * * *';

  const job = cron.schedule(cronSchedule, async () => {
    logger.info("Starting daily briefing generation for all companies");

    try {
      // Get all active companies
      const activeCompanies = await db
        .select()
        .from(companies)
        .where(eq(companies.status, 'active'));

      logger.info(`Generating briefings for ${activeCompanies.length} active companies`);

      let successCount = 0;
      let errorCount = 0;

      // Queue briefing generation for each company using AI worker
      for (const company of activeCompanies) {
        try {
          logger.info(`Queuing AI briefing for company: ${company.name}`, {
            companyId: company.id
          });

          // Queue the AI briefing generation
          const date = new Date().toISOString();
          await queueDailyBriefing(company.id, date);

          successCount++;
          logger.info(`AI briefing queued successfully for ${company.name}`, {
            companyId: company.id
          });
        } catch (error) {
          errorCount++;
          logger.error(`Failed to queue briefing for ${company.name}`, error as Error, {
            companyId: company.id
          });
        }
      }

      logger.info("Daily briefing generation completed", {
        total: activeCompanies.length,
        success: successCount,
        errors: errorCount
      });
    } catch (error) {
      logger.error("Fatal error in daily briefing cron", error as Error);
    }
  }, {
    timezone: "America/New_York" // Change to your timezone
  });

  logger.info(`Daily briefing cron job scheduled: ${cronSchedule} (8:00 AM daily)`);

  return job;
}

/**
 * Manual trigger for testing (don't schedule this)
 */
export async function generateBriefingNow() {
  logger.info("Manual briefing trigger initiated (using AI worker)");

  try {
    const activeCompanies = await db
      .select()
      .from(companies)
      .where(eq(companies.status, 'active'));

    const date = new Date().toISOString();

    for (const company of activeCompanies) {
      logger.info(`Queuing manual AI briefing for ${company.name}`);
      await queueDailyBriefing(company.id, date);
    }

    logger.info(`Manual briefing queued for ${activeCompanies.length} companies`);
  } catch (error) {
    logger.error("Failed to queue manual briefing", error as Error);
    throw error;
  }
}
