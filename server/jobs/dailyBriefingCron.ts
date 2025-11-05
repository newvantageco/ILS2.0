/**
 * Daily Briefing Cron Job
 * 
 * Runs every morning at 8:00 AM to generate proactive insights
 * for all active companies.
 */

import cron from 'node-cron';
import { db } from "../../db";
import { companies, aiNotifications } from "@shared/schema";
import { eq } from "drizzle-orm";
import { ProactiveInsightsService } from "../services/ProactiveInsightsService";
import { createLogger } from "../utils/logger";

const logger = createLogger("DailyBriefingCron");

export function startDailyBriefingCron() {
  const insightsService = new ProactiveInsightsService();

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

      // Generate briefings for each company
      for (const company of activeCompanies) {
        try {
          logger.info(`Generating briefing for company: ${company.name}`, { 
            companyId: company.id 
          });

          // Use first admin user as the userId (or system user)
          const briefing = await insightsService.generateDailyBriefing(
            company.id,
            'system'
          );

          // Store the summary as a briefing notification
          await db.insert(aiNotifications).values({
            companyId: company.id,
            userId: null, // Company-wide
            type: "briefing",
            priority: "medium",
            title: "📊 Daily Business Briefing",
            message: briefing.summary,
            summary: briefing.summary.substring(0, 100),
            data: { metrics: briefing.metrics },
            generatedBy: "daily_cron",
          });

          // Store each insight as a separate notification
          for (const insight of briefing.insights) {
            await db.insert(aiNotifications).values({
              companyId: company.id,
              userId: null,
              type: "insight",
              priority: insight.priority >= 4 ? "high" : 
                       insight.priority >= 3 ? "medium" : "low",
              title: insight.title,
              message: insight.message,
              summary: insight.message.substring(0, 100),
              recommendation: insight.recommendation,
              actionUrl: insight.actionUrl,
              actionLabel: insight.actionUrl ? "View Details" : undefined,
              data: insight.data,
              generatedBy: "daily_cron",
            });
          }

          successCount++;
          logger.info(`Briefing generated successfully for ${company.name}`, {
            companyId: company.id,
            insightCount: briefing.insights.length
          });
        } catch (error) {
          errorCount++;
          logger.error(`Failed to generate briefing for ${company.name}`, error as Error, {
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
  logger.info("Manual briefing trigger initiated");
  
  const insightsService = new ProactiveInsightsService();
  
  try {
    const activeCompanies = await db
      .select()
      .from(companies)
      .where(eq(companies.status, 'active'));

    for (const company of activeCompanies) {
      const briefing = await insightsService.generateDailyBriefing(
        company.id,
        'system'
      );

      await db.insert(aiNotifications).values({
        companyId: company.id,
        userId: null,
        type: "briefing",
        priority: "medium",
        title: "📊 Daily Business Briefing (Manual)",
        message: briefing.summary,
        summary: briefing.summary.substring(0, 100),
        data: { metrics: briefing.metrics },
        generatedBy: "manual_trigger",
      });

      for (const insight of briefing.insights) {
        await db.insert(aiNotifications).values({
          companyId: company.id,
          userId: null,
          type: "insight",
          priority: insight.priority >= 4 ? "high" : 
                   insight.priority >= 3 ? "medium" : "low",
          title: insight.title,
          message: insight.message,
          summary: insight.message.substring(0, 100),
          recommendation: insight.recommendation,
          actionUrl: insight.actionUrl,
          actionLabel: insight.actionUrl ? "View Details" : undefined,
          data: insight.data,
          generatedBy: "manual_trigger",
        });
      }
    }

    logger.info("Manual briefing generation completed");
  } catch (error) {
    logger.error("Failed to generate manual briefing", error as Error);
    throw error;
  }
}
