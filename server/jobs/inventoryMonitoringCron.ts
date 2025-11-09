/**
 * Inventory Monitoring Cron Job
 * 
 * Automatically scans inventory levels and generates purchase orders
 * for items below their reorder threshold.
 * 
 * Schedule: Runs twice daily at 9 AM and 3 PM
 */

import cron from 'node-cron';
import { db } from '../db';
import { companies } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { AutonomousPurchasingService } from '../services/AutonomousPurchasingService';
import { createLogger } from '../utils/logger';

const logger = createLogger('InventoryMonitoringCron');

const purchasingService = new AutonomousPurchasingService();

/**
 * Main cron task: Scan inventory for all active companies
 */
export async function runInventoryMonitoring() {
  logger.info('Starting inventory monitoring scan for all companies');
  
  try {
    // Get all active companies (active status)
    const activeCompanies = await db
      .select({
        id: companies.id,
        name: companies.name,
      })
      .from(companies)
      .where(eq(companies.status, 'active'));

    logger.info(`Found ${activeCompanies.length} active companies to scan`);

    let totalDraftPOs = 0;
    const results = [];

    // Process each company
    for (const company of activeCompanies) {
      try {
        logger.info({ companyId: company.id }, `Scanning inventory for company: ${company.name}`);

        // Use 'system' as userId for automated scans
        const draftPOs = await purchasingService.generatePurchaseOrders(
          company.id,
          'system'
        );

        if (draftPOs.length > 0) {
          logger.info({
            companyId: company.id,
            poCount: draftPOs.length,
          }, `Generated ${draftPOs.length} draft PO(s) for ${company.name}`);

          totalDraftPOs += draftPOs.length;

          results.push({
            companyId: company.id,
            companyName: company.name,
            posGenerated: draftPOs.length,
            success: true,
          });
        } else {
          logger.info({
            companyId: company.id,
          }, `No low stock items found for ${company.name}`);

          results.push({
            companyId: company.id,
            companyName: company.name,
            posGenerated: 0,
            success: true,
          });
        }
      } catch (error) {
        logger.error({
          err: error,
          companyId: company.id,
        }, `Failed to process company: ${company.name}`);

        results.push({
          companyId: company.id,
          companyName: company.name,
          posGenerated: 0,
          success: false,
          error: (error as Error).message,
        });
      }
    }

    logger.info({
      companiesScanned: activeCompanies.length,
      totalDraftPOs,
      results,
    }, 'Inventory monitoring scan completed');

    return {
      success: true,
      companiesScanned: activeCompanies.length,
      totalDraftPOs,
      results,
    };
  } catch (error) {
    logger.error({ err: error }, 'Inventory monitoring scan failed');
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Schedule the cron job
 * Runs at 9:00 AM and 3:00 PM every day (America/New_York timezone)
 */
export function startInventoryMonitoringCron() {
  // Schedule: 0 9,15 * * * = Every day at 9 AM and 3 PM
  const schedule = '0 9,15 * * *';

  cron.schedule(schedule, async () => {
    logger.info('Inventory monitoring cron job triggered');
    await runInventoryMonitoring();
  }, {
    timezone: 'America/New_York',
  });

  logger.info({
    schedule: '9:00 AM and 3:00 PM daily',
    timezone: 'America/New_York',
  }, 'Inventory monitoring cron job started');
}

/**
 * Manual trigger for testing
 */
export async function runInventoryMonitoringNow() {
  logger.info('Manual inventory monitoring triggered');
  return await runInventoryMonitoring();
}
