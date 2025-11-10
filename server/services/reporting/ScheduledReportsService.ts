/**
 * Scheduled Reports Service
 *
 * Manages automated report generation and distribution on schedules
 * (daily, weekly, monthly) with email delivery
 */

import { loggers } from '../../utils/logger.js';
import { ReportBuilderService, type ReportDefinition, type ReportResult } from './ReportBuilderService.js';
import { emailService } from '../EmailService.js';

const logger = loggers.api;

/**
 * Report Schedule Configuration
 */
export interface ReportSchedule {
  id: string;
  reportId: string;
  name: string;
  companyId: string;

  // Schedule configuration
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  dayOfWeek?: number; // 0-6 for weekly (0 = Sunday)
  dayOfMonth?: number; // 1-31 for monthly
  monthOfYear?: number; // 1-12 for annually
  time: string; // HH:MM format

  // Report generation parameters
  parameters?: Record<string, any>;
  outputFormat: 'pdf' | 'excel' | 'csv' | 'json';

  // Distribution
  recipients: string[]; // Email addresses
  subject?: string;
  message?: string;
  attachReport: boolean;

  // Metadata
  lastRunAt?: Date;
  lastRunStatus?: 'success' | 'failed';
  lastRunError?: string;
  nextRunAt?: Date;
  runCount: number;

  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Schedule Run Result
 */
export interface ScheduleRunResult {
  scheduleId: string;
  reportResult: ReportResult;
  emailsSent: number;
  status: 'success' | 'failed';
  error?: string;
  startedAt: Date;
  completedAt: Date;
  duration: number; // milliseconds
}

/**
 * Scheduled Reports Service
 */
export class ScheduledReportsService {
  /**
   * In-memory schedules store (use database in production)
   */
  private static schedules = new Map<string, ReportSchedule>();

  /**
   * In-memory run history (use database in production)
   */
  private static runHistory: ScheduleRunResult[] = [];

  /**
   * Scheduled tasks (intervals)
   */
  private static scheduledTasks = new Map<string, NodeJS.Timeout>();

  /**
   * Create a new report schedule
   */
  static async createSchedule(
    schedule: Omit<ReportSchedule, 'id' | 'createdAt' | 'runCount' | 'nextRunAt'>
  ): Promise<ReportSchedule> {
    const newSchedule: ReportSchedule = {
      ...schedule,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      runCount: 0,
      nextRunAt: this.calculateNextRun(schedule as any),
    };

    this.schedules.set(newSchedule.id, newSchedule);

    // Start the schedule if enabled
    if (newSchedule.enabled) {
      this.startSchedule(newSchedule.id);
    }

    logger.info({ scheduleId: newSchedule.id, name: newSchedule.name }, 'Report schedule created');

    return newSchedule;
  }

  /**
   * Get schedule by ID
   */
  static async getSchedule(scheduleId: string): Promise<ReportSchedule | null> {
    return this.schedules.get(scheduleId) || null;
  }

  /**
   * Get all schedules for a company
   */
  static async getSchedules(companyId: string): Promise<ReportSchedule[]> {
    return Array.from(this.schedules.values()).filter(
      (schedule) => schedule.companyId === companyId
    );
  }

  /**
   * Update schedule
   */
  static async updateSchedule(
    scheduleId: string,
    updates: Partial<ReportSchedule>
  ): Promise<ReportSchedule> {
    const schedule = this.schedules.get(scheduleId);

    if (!schedule) {
      throw new Error('Schedule not found');
    }

    const updated = {
      ...schedule,
      ...updates,
      updatedAt: new Date(),
      nextRunAt: this.calculateNextRun({
        ...schedule,
        ...updates,
      } as ReportSchedule),
    };

    this.schedules.set(scheduleId, updated);

    // Restart schedule if enabled status changed
    if (updated.enabled && !schedule.enabled) {
      this.startSchedule(scheduleId);
    } else if (!updated.enabled && schedule.enabled) {
      this.stopSchedule(scheduleId);
    }

    logger.info({ scheduleId, updates }, 'Report schedule updated');

    return updated;
  }

  /**
   * Delete schedule
   */
  static async deleteSchedule(scheduleId: string): Promise<boolean> {
    this.stopSchedule(scheduleId);
    const deleted = this.schedules.delete(scheduleId);

    if (deleted) {
      logger.info({ scheduleId }, 'Report schedule deleted');
    }

    return deleted;
  }

  /**
   * Start a schedule
   */
  static startSchedule(scheduleId: string): void {
    const schedule = this.schedules.get(scheduleId);

    if (!schedule || !schedule.enabled) {
      return;
    }

    // Stop existing task if any
    this.stopSchedule(scheduleId);

    // Calculate interval
    const checkInterval = 60000; // Check every minute

    // Set up periodic check
    const task = setInterval(() => {
      this.checkAndRunSchedule(scheduleId).catch((error) => {
        logger.error({ scheduleId, error }, 'Failed to check/run schedule');
      });
    }, checkInterval);

    this.scheduledTasks.set(scheduleId, task);

    logger.info({ scheduleId, name: schedule.name }, 'Report schedule started');
  }

  /**
   * Stop a schedule
   */
  static stopSchedule(scheduleId: string): void {
    const task = this.scheduledTasks.get(scheduleId);

    if (task) {
      clearInterval(task);
      this.scheduledTasks.delete(scheduleId);

      logger.info({ scheduleId }, 'Report schedule stopped');
    }
  }

  /**
   * Check if schedule should run and execute if needed
   */
  private static async checkAndRunSchedule(scheduleId: string): Promise<void> {
    const schedule = this.schedules.get(scheduleId);

    if (!schedule || !schedule.enabled) {
      return;
    }

    const now = new Date();

    // Check if it's time to run
    if (!schedule.nextRunAt || now < schedule.nextRunAt) {
      return;
    }

    // Run the schedule
    await this.runSchedule(scheduleId);

    // Update next run time
    const updated = {
      ...schedule,
      nextRunAt: this.calculateNextRun(schedule),
    };

    this.schedules.set(scheduleId, updated);
  }

  /**
   * Manually run a schedule
   */
  static async runSchedule(scheduleId: string): Promise<ScheduleRunResult> {
    const startedAt = new Date();

    const schedule = this.schedules.get(scheduleId);

    if (!schedule) {
      throw new Error('Schedule not found');
    }

    logger.info({ scheduleId, name: schedule.name }, 'Running scheduled report');

    try {
      // Generate report
      const reportResult = await ReportBuilderService.generateReport(
        schedule.reportId,
        schedule.parameters,
        schedule.outputFormat
      );

      // Send emails to recipients
      let emailsSent = 0;

      if (schedule.recipients.length > 0) {
        const report = await ReportBuilderService.getReport(schedule.reportId);

        for (const recipient of schedule.recipients) {
          try {
            await this.sendReportEmail(
              recipient,
              schedule,
              report!,
              reportResult
            );
            emailsSent++;
          } catch (error) {
            logger.error({ recipient, error }, 'Failed to send report email');
          }
        }
      }

      const completedAt = new Date();
      const duration = completedAt.getTime() - startedAt.getTime();

      const result: ScheduleRunResult = {
        scheduleId,
        reportResult,
        emailsSent,
        status: 'success',
        startedAt,
        completedAt,
        duration,
      };

      // Update schedule
      const updated = {
        ...schedule,
        lastRunAt: completedAt,
        lastRunStatus: 'success' as const,
        lastRunError: undefined,
        runCount: schedule.runCount + 1,
      };

      this.schedules.set(scheduleId, updated);

      // Store run history
      this.runHistory.push(result);

      logger.info(
        { scheduleId, emailsSent, duration },
        'Scheduled report completed successfully'
      );

      return result;
    } catch (error) {
      const completedAt = new Date();
      const duration = completedAt.getTime() - startedAt.getTime();

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      const result: ScheduleRunResult = {
        scheduleId,
        reportResult: {} as ReportResult, // Empty result on failure
        emailsSent: 0,
        status: 'failed',
        error: errorMessage,
        startedAt,
        completedAt,
        duration,
      };

      // Update schedule
      const updated = {
        ...schedule,
        lastRunAt: completedAt,
        lastRunStatus: 'failed' as const,
        lastRunError: errorMessage,
        runCount: schedule.runCount + 1,
      };

      this.schedules.set(scheduleId, updated);

      // Store run history
      this.runHistory.push(result);

      logger.error({ scheduleId, error }, 'Scheduled report failed');

      throw error;
    }
  }

  /**
   * Send report via email
   */
  private static async sendReportEmail(
    recipient: string,
    schedule: ReportSchedule,
    report: ReportDefinition,
    result: ReportResult
  ): Promise<void> {
    const subject = schedule.subject || `Scheduled Report: ${report.name}`;

    const message =
      schedule.message ||
      `
      <p>Your scheduled report has been generated.</p>
      <p><strong>Report:</strong> ${report.name}</p>
      <p><strong>Description:</strong> ${report.description}</p>
      <p><strong>Generated:</strong> ${result.metadata.generatedAt.toLocaleString()}</p>
      <p><strong>Records:</strong> ${result.metadata.totalRecords}</p>
    `;

    // In production, would attach the actual file
    await emailService.sendEmail(recipient, subject, message);

    logger.info({ recipient, reportName: report.name }, 'Report email sent');
  }

  /**
   * Calculate next run time for schedule
   */
  private static calculateNextRun(schedule: ReportSchedule): Date {
    const now = new Date();
    const [hours, minutes] = schedule.time.split(':').map(Number);

    const next = new Date(now);
    next.setHours(hours, minutes, 0, 0);

    // If time has passed today, move to next period
    if (next <= now) {
      switch (schedule.frequency) {
        case 'daily':
          next.setDate(next.getDate() + 1);
          break;

        case 'weekly':
          // Find next occurrence of dayOfWeek
          const targetDay = schedule.dayOfWeek || 0;
          const currentDay = next.getDay();
          const daysToAdd = (targetDay - currentDay + 7) % 7 || 7;
          next.setDate(next.getDate() + daysToAdd);
          break;

        case 'monthly':
          // Move to next month on the specified day
          next.setMonth(next.getMonth() + 1);
          next.setDate(schedule.dayOfMonth || 1);
          break;

        case 'quarterly':
          // Move to next quarter
          next.setMonth(next.getMonth() + 3);
          next.setDate(schedule.dayOfMonth || 1);
          break;

        case 'annually':
          // Move to next year
          next.setFullYear(next.getFullYear() + 1);
          next.setMonth((schedule.monthOfYear || 1) - 1);
          next.setDate(schedule.dayOfMonth || 1);
          break;
      }
    }

    return next;
  }

  /**
   * Get schedule run history
   */
  static async getScheduleHistory(
    scheduleId: string,
    limit: number = 50
  ): Promise<ScheduleRunResult[]> {
    return this.runHistory
      .filter((result) => result.scheduleId === scheduleId)
      .slice(-limit)
      .reverse();
  }

  /**
   * Get all active schedules that should run soon
   */
  static async getUpcomingSchedules(
    companyId: string,
    withinHours: number = 24
  ): Promise<ReportSchedule[]> {
    const now = new Date();
    const cutoff = new Date(now.getTime() + withinHours * 60 * 60 * 1000);

    return Array.from(this.schedules.values()).filter(
      (schedule) =>
        schedule.companyId === companyId &&
        schedule.enabled &&
        schedule.nextRunAt &&
        schedule.nextRunAt <= cutoff
    );
  }

  /**
   * Initialize all enabled schedules
   */
  static initializeSchedules(): void {
    const enabledSchedules = Array.from(this.schedules.values()).filter(
      (s) => s.enabled
    );

    enabledSchedules.forEach((schedule) => {
      this.startSchedule(schedule.id);
    });

    logger.info(
      { count: enabledSchedules.length },
      'Scheduled reports initialized'
    );
  }

  /**
   * Clean up old run history
   */
  static cleanupHistory(olderThanDays: number = 90): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const before = this.runHistory.length;

    this.runHistory = this.runHistory.filter(
      (result) => result.completedAt >= cutoffDate
    );

    const removed = before - this.runHistory.length;

    if (removed > 0) {
      logger.info({ removed }, 'Cleaned up old schedule run history');
    }

    return removed;
  }

  /**
   * Get schedule statistics
   */
  static async getScheduleStats(
    scheduleId: string
  ): Promise<{
    totalRuns: number;
    successfulRuns: number;
    failedRuns: number;
    averageDuration: number;
    lastRunStatus?: 'success' | 'failed';
    lastRunAt?: Date;
  }> {
    const history = await this.getScheduleHistory(scheduleId);

    const totalRuns = history.length;
    const successfulRuns = history.filter((r) => r.status === 'success').length;
    const failedRuns = history.filter((r) => r.status === 'failed').length;

    const averageDuration =
      totalRuns > 0
        ? history.reduce((sum, r) => sum + r.duration, 0) / totalRuns
        : 0;

    const schedule = this.schedules.get(scheduleId);

    return {
      totalRuns,
      successfulRuns,
      failedRuns,
      averageDuration,
      lastRunStatus: schedule?.lastRunStatus,
      lastRunAt: schedule?.lastRunAt,
    };
  }
}
