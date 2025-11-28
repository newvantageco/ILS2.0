/**
 * NHS API Audit Service
 * 
 * Provides compliance audit logging for all NHS API interactions.
 * NHS requires an 8-year audit trail for all patient data access.
 * 
 * Features:
 * - Logs all NHS API requests and responses
 * - Tracks patient data access
 * - Maintains 8-year retention policy
 * - Supports compliance reporting
 */

import { db } from '../../db/index.js';
import { sql } from 'drizzle-orm';
import { createLogger } from '../utils/logger.js';
import crypto from 'crypto';

const logger = createLogger('nhs-audit');

interface AuditLogEntry {
  companyId: string;
  apiName: string;
  endpoint: string;
  method: string;
  requestId: string;
  userId?: string;
  userRole?: string;
  patientNhsNumber?: string;
  patientId?: string;
  responseStatus?: number;
  responseTimeMs?: number;
  success: boolean;
  errorMessage?: string;
  accessTokenId?: string;
  ipAddress?: string;
  userAgent?: string;
}

interface AuditSearchParams {
  companyId?: string;
  apiName?: string;
  patientNhsNumber?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  success?: boolean;
  limit?: number;
  offset?: number;
}

interface AuditStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  uniquePatients: number;
  uniqueUsers: number;
  averageResponseTime: number;
  requestsByApi: Record<string, number>;
  requestsByDay: Array<{ date: string; count: number }>;
}

/**
 * NHS API Audit Service
 * Compliance logging for all NHS API interactions
 */
export class NhsApiAuditService {
  /**
   * Log an NHS API interaction
   */
  async logApiInteraction(entry: AuditLogEntry): Promise<string> {
    const id = crypto.randomUUID();
    
    try {
      await db.execute(sql`
        INSERT INTO nhs_api_audit_log (
          id, company_id, api_name, endpoint, method, request_id,
          user_id, user_role, patient_nhs_number, patient_id,
          response_status, response_time_ms, success, error_message,
          access_token_id, ip_address, user_agent, created_at
        ) VALUES (
          ${id}, ${entry.companyId}, ${entry.apiName}, ${entry.endpoint},
          ${entry.method}, ${entry.requestId}, ${entry.userId || null},
          ${entry.userRole || null}, ${entry.patientNhsNumber || null},
          ${entry.patientId || null}, ${entry.responseStatus || null},
          ${entry.responseTimeMs || null}, ${entry.success},
          ${entry.errorMessage || null}, ${entry.accessTokenId || null},
          ${entry.ipAddress || null}, ${entry.userAgent || null}, NOW()
        )
      `);

      logger.debug({ 
        requestId: entry.requestId, 
        apiName: entry.apiName,
        success: entry.success 
      }, 'NHS API interaction logged');

      return id;
    } catch (error) {
      // Don't fail the request if audit logging fails, but log the error
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error({ error: message, entry }, 'Failed to log NHS API interaction');
      return '';
    }
  }

  /**
   * Log a PDS patient lookup
   */
  async logPdsLookup(params: {
    companyId: string;
    userId: string;
    userRole?: string;
    nhsNumber: string;
    patientId?: string;
    success: boolean;
    responseTimeMs?: number;
    errorMessage?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.logApiInteraction({
      companyId: params.companyId,
      apiName: 'pds',
      endpoint: `/Patient/${params.nhsNumber}`,
      method: 'GET',
      requestId: crypto.randomUUID(),
      userId: params.userId,
      userRole: params.userRole,
      patientNhsNumber: params.nhsNumber,
      patientId: params.patientId,
      success: params.success,
      responseTimeMs: params.responseTimeMs,
      errorMessage: params.errorMessage,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  }

  /**
   * Log a claims submission
   */
  async logClaimsSubmission(params: {
    companyId: string;
    userId: string;
    claimId: string;
    patientNhsNumber?: string;
    patientId: string;
    success: boolean;
    pcseReference?: string;
    errorMessage?: string;
    ipAddress?: string;
  }): Promise<void> {
    await this.logApiInteraction({
      companyId: params.companyId,
      apiName: 'pcse',
      endpoint: '/claims',
      method: 'POST',
      requestId: params.claimId,
      userId: params.userId,
      patientNhsNumber: params.patientNhsNumber,
      patientId: params.patientId,
      success: params.success,
      errorMessage: params.errorMessage,
      ipAddress: params.ipAddress,
    });
  }

  /**
   * Search audit logs with filters
   */
  async searchAuditLogs(params: AuditSearchParams): Promise<{
    total: number;
    entries: AuditLogEntry[];
  }> {
    const {
      companyId,
      apiName,
      patientNhsNumber,
      userId,
      startDate,
      endDate,
      success,
      limit = 100,
      offset = 0,
    } = params;

    try {
      // Build dynamic WHERE clause
      const conditions: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (companyId) {
        conditions.push(`company_id = $${paramIndex++}`);
        values.push(companyId);
      }
      if (apiName) {
        conditions.push(`api_name = $${paramIndex++}`);
        values.push(apiName);
      }
      if (patientNhsNumber) {
        conditions.push(`patient_nhs_number = $${paramIndex++}`);
        values.push(patientNhsNumber);
      }
      if (userId) {
        conditions.push(`user_id = $${paramIndex++}`);
        values.push(userId);
      }
      if (startDate) {
        conditions.push(`created_at >= $${paramIndex++}`);
        values.push(startDate);
      }
      if (endDate) {
        conditions.push(`created_at <= $${paramIndex++}`);
        values.push(endDate);
      }
      if (success !== undefined) {
        conditions.push(`success = $${paramIndex++}`);
        values.push(success);
      }

      const whereClause = conditions.length > 0 
        ? `WHERE ${conditions.join(' AND ')}` 
        : '';

      // Get total count
      const countResult = await db.execute(sql.raw(`
        SELECT COUNT(*) as total FROM nhs_api_audit_log ${whereClause}
      `));
      const total = parseInt((countResult.rows[0] as any)?.total || '0', 10);

      // Get entries
      const result = await db.execute(sql.raw(`
        SELECT * FROM nhs_api_audit_log 
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `));

      return {
        total,
        entries: result.rows as unknown as AuditLogEntry[],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error({ error: message, params }, 'Failed to search audit logs');
      return { total: 0, entries: [] };
    }
  }

  /**
   * Get audit statistics for a company
   */
  async getAuditStats(
    companyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AuditStats> {
    try {
      // Basic stats
      const statsResult = await db.execute(sql`
        SELECT 
          COUNT(*) as total_requests,
          SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_requests,
          SUM(CASE WHEN NOT success THEN 1 ELSE 0 END) as failed_requests,
          COUNT(DISTINCT patient_nhs_number) as unique_patients,
          COUNT(DISTINCT user_id) as unique_users,
          AVG(response_time_ms) as avg_response_time
        FROM nhs_api_audit_log
        WHERE company_id = ${companyId}
          AND created_at >= ${startDate}
          AND created_at <= ${endDate}
      `);

      const stats = statsResult.rows[0] as any;

      // Requests by API
      const apiResult = await db.execute(sql`
        SELECT api_name, COUNT(*) as count
        FROM nhs_api_audit_log
        WHERE company_id = ${companyId}
          AND created_at >= ${startDate}
          AND created_at <= ${endDate}
        GROUP BY api_name
      `);

      const requestsByApi: Record<string, number> = {};
      for (const row of apiResult.rows as any[]) {
        requestsByApi[row.api_name] = parseInt(row.count, 10);
      }

      // Requests by day
      const dayResult = await db.execute(sql`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM nhs_api_audit_log
        WHERE company_id = ${companyId}
          AND created_at >= ${startDate}
          AND created_at <= ${endDate}
        GROUP BY DATE(created_at)
        ORDER BY date
      `);

      const requestsByDay = (dayResult.rows as any[]).map(row => ({
        date: row.date,
        count: parseInt(row.count, 10),
      }));

      return {
        totalRequests: parseInt(stats.total_requests || '0', 10),
        successfulRequests: parseInt(stats.successful_requests || '0', 10),
        failedRequests: parseInt(stats.failed_requests || '0', 10),
        uniquePatients: parseInt(stats.unique_patients || '0', 10),
        uniqueUsers: parseInt(stats.unique_users || '0', 10),
        averageResponseTime: parseFloat(stats.avg_response_time || '0'),
        requestsByApi,
        requestsByDay,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error({ error: message, companyId }, 'Failed to get audit stats');
      return {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        uniquePatients: 0,
        uniqueUsers: 0,
        averageResponseTime: 0,
        requestsByApi: {},
        requestsByDay: [],
      };
    }
  }

  /**
   * Get patient access history (for subject access requests)
   */
  async getPatientAccessHistory(
    nhsNumber: string,
    limit = 100
  ): Promise<{
    total: number;
    accesses: Array<{
      date: string;
      apiName: string;
      userId: string;
      companyId: string;
      success: boolean;
    }>;
  }> {
    try {
      const countResult = await db.execute(sql`
        SELECT COUNT(*) as total FROM nhs_api_audit_log
        WHERE patient_nhs_number = ${nhsNumber}
      `);
      const total = parseInt((countResult.rows[0] as any)?.total || '0', 10);

      const result = await db.execute(sql`
        SELECT 
          created_at as date,
          api_name,
          user_id,
          company_id,
          success
        FROM nhs_api_audit_log
        WHERE patient_nhs_number = ${nhsNumber}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `);

      return {
        total,
        accesses: result.rows as any[],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error({ error: message, nhsNumber: nhsNumber.slice(-4) }, 'Failed to get patient access history');
      return { total: 0, accesses: [] };
    }
  }

  /**
   * Purge old audit logs (beyond retention period)
   * Note: NHS requires 8 years retention - this should only run after that period
   */
  async purgeExpiredLogs(): Promise<number> {
    try {
      const result = await db.execute(sql`
        DELETE FROM nhs_api_audit_log
        WHERE retention_until < CURRENT_DATE
        RETURNING id
      `);

      const deletedCount = result.rows.length;
      
      if (deletedCount > 0) {
        logger.info({ deletedCount }, 'Purged expired NHS audit logs');
      }

      return deletedCount;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error({ error: message }, 'Failed to purge expired audit logs');
      return 0;
    }
  }
}

// Singleton instance
export const nhsApiAuditService = new NhsApiAuditService();
