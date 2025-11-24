/**
 * Soft Delete Service
 *
 * Provides comprehensive soft delete functionality for healthcare compliance.
 * Integrates with the ArchivalService for complete audit trail and data recovery.
 *
 * Key Features:
 * - Soft delete records (set deletedAt, archive to archivedRecords)
 * - Restore deleted records
 * - Query helpers to filter out soft-deleted records
 * - Batch soft delete operations
 * - Healthcare compliance (7-year retention)
 */

import { db } from "../../db";
import { eq, and, isNull, isNotNull, sql } from "drizzle-orm";
import { archivalService } from "./ArchivalService";
import type { PgTable } from "drizzle-orm/pg-core";

/**
 * Table configuration for soft delete operations
 */
interface SoftDeleteTableConfig {
  table: PgTable;
  tableName: string;
  idColumn: string;
  companyIdColumn?: string;
  hasDeletedAt: boolean;
}

/**
 * Map of table names to their Drizzle table objects
 * This allows us to dynamically work with any table
 */
const tableRegistry: Record<string, SoftDeleteTableConfig> = {};

/**
 * Register a table for soft delete operations
 */
export function registerSoftDeleteTable(config: SoftDeleteTableConfig): void {
  tableRegistry[config.tableName] = config;
}

/**
 * Result of a soft delete operation
 */
export interface SoftDeleteResult {
  success: boolean;
  recordId: string;
  tableName: string;
  archiveId?: string;
  error?: string;
}

/**
 * Result of a restore operation
 */
export interface RestoreResult {
  success: boolean;
  recordId: string;
  tableName: string;
  restoredData?: any;
  error?: string;
}

export class SoftDeleteService {
  /**
   * Soft delete a record by ID
   *
   * This method:
   * 1. Fetches the record
   * 2. Sets deletedAt and deletedBy on the source table
   * 3. Archives the record to archivedRecords for recovery
   * 4. Creates an audit trail entry
   */
  async softDelete(params: {
    tableName: string;
    recordId: string;
    companyId?: string;
    deletedBy: string;
    reason?: string;
    tags?: string[];
  }): Promise<SoftDeleteResult> {
    try {
      // Get the record data before soft deleting
      const recordData = await this.getRecordById(params.tableName, params.recordId);

      if (!recordData) {
        return {
          success: false,
          recordId: params.recordId,
          tableName: params.tableName,
          error: "Record not found",
        };
      }

      // Check if already deleted
      if (recordData.deletedAt) {
        return {
          success: false,
          recordId: params.recordId,
          tableName: params.tableName,
          error: "Record is already deleted",
        };
      }

      // Update the source table with deletedAt
      await this.setDeletedAt(params.tableName, params.recordId, params.deletedBy);

      // Archive the record for recovery
      const archived = await archivalService.archiveRecord({
        tableName: params.tableName,
        recordId: params.recordId,
        recordData,
        companyId: params.companyId || recordData.companyId,
        archivedBy: params.deletedBy,
        reason: params.reason || "User requested deletion",
        tags: params.tags,
      });

      return {
        success: true,
        recordId: params.recordId,
        tableName: params.tableName,
        archiveId: archived.id,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        recordId: params.recordId,
        tableName: params.tableName,
        error: errorMessage,
      };
    }
  }

  /**
   * Restore a soft-deleted record
   *
   * This method:
   * 1. Clears deletedAt and deletedBy on the source table
   * 2. Updates the archive record with restore timestamp
   * 3. Creates an audit trail entry
   */
  async restore(params: {
    tableName: string;
    recordId: string;
    restoredBy: string;
  }): Promise<RestoreResult> {
    try {
      // Check if the record exists and is deleted
      const recordData = await this.getRecordById(params.tableName, params.recordId);

      if (!recordData) {
        return {
          success: false,
          recordId: params.recordId,
          tableName: params.tableName,
          error: "Record not found",
        };
      }

      if (!recordData.deletedAt) {
        return {
          success: false,
          recordId: params.recordId,
          tableName: params.tableName,
          error: "Record is not deleted",
        };
      }

      // Clear deletedAt on the source table
      await this.clearDeletedAt(params.tableName, params.recordId);

      // Find and update the archive record
      const { records } = await archivalService.getArchivedRecords({
        tableName: params.tableName,
        includeRestored: false,
      });

      const archivedRecord = records.find((r) => r.originalId === params.recordId);
      if (archivedRecord) {
        await archivalService.restoreRecord(archivedRecord.id, params.restoredBy);
      }

      return {
        success: true,
        recordId: params.recordId,
        tableName: params.tableName,
        restoredData: recordData,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        recordId: params.recordId,
        tableName: params.tableName,
        error: errorMessage,
      };
    }
  }

  /**
   * Batch soft delete multiple records
   */
  async batchSoftDelete(params: {
    tableName: string;
    recordIds: string[];
    companyId?: string;
    deletedBy: string;
    reason?: string;
  }): Promise<{
    succeeded: SoftDeleteResult[];
    failed: SoftDeleteResult[];
  }> {
    const succeeded: SoftDeleteResult[] = [];
    const failed: SoftDeleteResult[] = [];

    for (const recordId of params.recordIds) {
      const result = await this.softDelete({
        tableName: params.tableName,
        recordId,
        companyId: params.companyId,
        deletedBy: params.deletedBy,
        reason: params.reason,
      });

      if (result.success) {
        succeeded.push(result);
      } else {
        failed.push(result);
      }
    }

    return { succeeded, failed };
  }

  /**
   * Get deleted records for a table
   */
  async getDeletedRecords(params: {
    tableName: string;
    companyId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ records: any[]; total: number }> {
    return await archivalService.getArchivedRecords({
      tableName: params.tableName,
      companyId: params.companyId,
      includeRestored: false,
      limit: params.limit || 50,
      offset: params.offset || 0,
    });
  }

  /**
   * Permanently delete a soft-deleted record
   * WARNING: This cannot be undone!
   */
  async permanentDelete(params: {
    tableName: string;
    recordId: string;
    deletedBy: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      // Find the archive record
      const { records } = await archivalService.getArchivedRecords({
        tableName: params.tableName,
        includeRestored: true,
      });

      const archivedRecord = records.find((r) => r.originalId === params.recordId);
      if (archivedRecord) {
        await archivalService.permanentlyDeleteRecord(archivedRecord.id, params.deletedBy);
      }

      // Actually delete from the source table
      await this.hardDelete(params.tableName, params.recordId);

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get a record by ID from any table
   * Uses raw SQL for flexibility across all tables
   */
  private async getRecordById(tableName: string, recordId: string): Promise<any> {
    const result = await db.execute(
      sql`SELECT * FROM ${sql.identifier(tableName)} WHERE id = ${recordId} LIMIT 1`
    );
    return result.rows?.[0];
  }

  /**
   * Set deletedAt timestamp on a record
   */
  private async setDeletedAt(
    tableName: string,
    recordId: string,
    deletedBy: string
  ): Promise<void> {
    await db.execute(
      sql`UPDATE ${sql.identifier(tableName)}
          SET deleted_at = NOW(), deleted_by = ${deletedBy}
          WHERE id = ${recordId}`
    );
  }

  /**
   * Clear deletedAt timestamp on a record (restore)
   */
  private async clearDeletedAt(tableName: string, recordId: string): Promise<void> {
    await db.execute(
      sql`UPDATE ${sql.identifier(tableName)}
          SET deleted_at = NULL, deleted_by = NULL
          WHERE id = ${recordId}`
    );
  }

  /**
   * Hard delete a record (permanent)
   */
  private async hardDelete(tableName: string, recordId: string): Promise<void> {
    await db.execute(
      sql`DELETE FROM ${sql.identifier(tableName)} WHERE id = ${recordId}`
    );
  }
}

/**
 * SQL condition for filtering out soft-deleted records
 * Use this in WHERE clauses to exclude deleted records
 */
export function notDeleted(table: any): ReturnType<typeof isNull> {
  return isNull(table.deletedAt);
}

/**
 * SQL condition for filtering to only soft-deleted records
 * Use this in WHERE clauses to find deleted records
 */
export function onlyDeleted(table: any): ReturnType<typeof isNotNull> {
  return isNotNull(table.deletedAt);
}

/**
 * Create standard soft delete WHERE condition
 * Combines company ID check with soft delete filter
 */
export function activeRecords(table: any, companyId: string) {
  return and(eq(table.companyId, companyId), isNull(table.deletedAt));
}

/**
 * Helper to build a soft delete query for any table
 */
export async function softDeleteQuery<T>(
  tableName: string,
  table: PgTable,
  recordId: string,
  deletedBy: string
): Promise<T[]> {
  return await db
    .update(table)
    .set({
      deletedAt: new Date(),
      deletedBy,
    } as any)
    .where(eq((table as any).id, recordId))
    .returning() as T[];
}

// Export singleton instance
export const softDeleteService = new SoftDeleteService();

// Export for use in routes
export default {
  softDeleteService,
  notDeleted,
  onlyDeleted,
  activeRecords,
  softDeleteQuery,
  registerSoftDeleteTable,
};
