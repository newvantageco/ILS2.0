/**
 * Data Sync Engine
 *
 * Core engine for synchronizing data between systems with transformation,
 * validation, conflict resolution, and error handling
 */

import { loggers } from '../../utils/logger.js';
import type { FieldMapping } from './IntegrationFramework.js';

const logger = loggers.api;

/**
 * Sync Direction
 */
export type SyncDirection = 'import' | 'export' | 'bidirectional';

/**
 * Conflict Resolution Strategy
 */
export type ConflictResolution =
  | 'source_wins' // Source system always wins
  | 'dest_wins' // Destination always wins
  | 'newest_wins' // Most recently modified wins
  | 'manual' // Require manual resolution
  | 'merge'; // Attempt to merge changes

/**
 * Sync Record
 */
export interface SyncRecord {
  id: string;
  sourceId?: string;
  destinationId?: string;
  data: Record<string, any>;
  metadata?: {
    lastModified?: Date;
    version?: number;
    checksum?: string;
  };
}

/**
 * Transformation Function
 */
export type TransformFunction = (value: any, record: Record<string, any>) => any;

/**
 * Validation Rule
 */
export interface ValidationRule {
  field: string;
  rule: 'required' | 'email' | 'phone' | 'date' | 'number' | 'custom';
  customValidator?: (value: any) => boolean;
  message?: string;
}

/**
 * Sync Result
 */
export interface SyncResult {
  success: boolean;
  recordId: string;
  operation: 'create' | 'update' | 'skip' | 'conflict';
  sourceId?: string;
  destinationId?: string;
  error?: string;
  conflicts?: ConflictInfo[];
}

/**
 * Conflict Information
 */
export interface ConflictInfo {
  field: string;
  sourceValue: any;
  destinationValue: any;
  resolution?: 'source' | 'destination' | 'merged';
}

/**
 * Batch Sync Options
 */
export interface BatchSyncOptions {
  batchSize: number;
  conflictResolution: ConflictResolution;
  continueOnError: boolean;
  validateBeforeSync: boolean;
  transformData: boolean;
}

/**
 * Data Sync Engine
 */
export class DataSyncEngine {
  /**
   * Transformation functions registry
   */
  private static transformFunctions = new Map<string, TransformFunction>();

  /**
   * Initialize default transformation functions
   */
  static initializeTransformations(): void {
    // Date transformations
    this.registerTransform('date_to_iso', (value) => {
      if (!value) return null;
      return new Date(value).toISOString();
    });

    this.registerTransform('date_from_iso', (value) => {
      if (!value) return null;
      return new Date(value);
    });

    this.registerTransform('date_to_unix', (value) => {
      if (!value) return null;
      return Math.floor(new Date(value).getTime() / 1000);
    });

    // String transformations
    this.registerTransform('trim', (value) => {
      return typeof value === 'string' ? value.trim() : value;
    });

    this.registerTransform('lowercase', (value) => {
      return typeof value === 'string' ? value.toLowerCase() : value;
    });

    this.registerTransform('uppercase', (value) => {
      return typeof value === 'string' ? value.toUpperCase() : value;
    });

    this.registerTransform('normalize_phone', (value) => {
      if (!value) return null;
      // Remove all non-digit characters
      return value.toString().replace(/\D/g, '');
    });

    this.registerTransform('format_phone_us', (value) => {
      if (!value) return null;
      const digits = value.toString().replace(/\D/g, '');
      if (digits.length === 10) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
      }
      return value;
    });

    // Name transformations
    this.registerTransform('capitalize', (value) => {
      if (!value || typeof value !== 'string') return value;
      return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    });

    this.registerTransform('full_name', (value, record) => {
      return `${record.firstName || ''} ${record.lastName || ''}`.trim();
    });

    // Boolean transformations
    this.registerTransform('to_boolean', (value) => {
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        return ['true', 'yes', '1', 'on'].includes(value.toLowerCase());
      }
      return Boolean(value);
    });

    // Number transformations
    this.registerTransform('to_number', (value) => {
      return typeof value === 'number' ? value : parseFloat(value);
    });

    this.registerTransform('round', (value) => {
      return typeof value === 'number' ? Math.round(value) : value;
    });

    // Gender normalization
    this.registerTransform('normalize_gender', (value) => {
      if (!value) return null;
      const normalized = value.toString().toLowerCase();
      if (['m', 'male', '1'].includes(normalized)) return 'male';
      if (['f', 'female', '2'].includes(normalized)) return 'female';
      if (['o', 'other', '3'].includes(normalized)) return 'other';
      return value;
    });

    // JSON transformations
    this.registerTransform('json_parse', (value) => {
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      }
      return value;
    });

    this.registerTransform('json_stringify', (value) => {
      return typeof value === 'object' ? JSON.stringify(value) : value;
    });

    logger.info({ count: this.transformFunctions.size }, 'Transform functions initialized');
  }

  /**
   * Register a transformation function
   */
  static registerTransform(name: string, fn: TransformFunction): void {
    this.transformFunctions.set(name, fn);
    logger.debug({ name }, 'Transform function registered');
  }

  /**
   * Apply field mappings to transform data
   */
  static transformRecord(
    sourceRecord: Record<string, any>,
    fieldMappings: FieldMapping[],
    direction: 'import' | 'export'
  ): Record<string, any> {
    const transformed: Record<string, any> = {};

    fieldMappings.forEach((mapping) => {
      // Skip if mapping doesn't apply to this direction
      if (mapping.direction !== 'both' && mapping.direction !== direction) {
        return;
      }

      const sourceField = direction === 'import' ? mapping.remoteField : mapping.localField;
      const destField = direction === 'import' ? mapping.localField : mapping.remoteField;

      // Get value from source
      let value = this.getNestedValue(sourceRecord, sourceField);

      // Apply transformation if specified
      if (mapping.transform && value !== undefined) {
        const transformFn = this.transformFunctions.get(mapping.transform);
        if (transformFn) {
          value = transformFn(value, sourceRecord);
        } else {
          logger.warn({ transform: mapping.transform }, 'Transform function not found');
        }
      }

      // Set value in destination
      if (value !== undefined || mapping.required) {
        this.setNestedValue(transformed, destField, value);
      }
    });

    return transformed;
  }

  /**
   * Get nested value from object using path
   */
  private static getNestedValue(obj: Record<string, any>, path: string): any {
    // Handle simple field names
    if (!path.includes('.') && !path.includes('[')) {
      return obj[path];
    }

    // Handle nested paths like "name[0].given[0]"
    const parts = path.split(/\.|\[|\]/).filter(Boolean);

    let value: any = obj;
    for (const part of parts) {
      if (value === null || value === undefined) {
        return undefined;
      }

      // Handle array index
      if (/^\d+$/.test(part)) {
        value = value[parseInt(part)];
      } else {
        value = value[part];
      }
    }

    return value;
  }

  /**
   * Set nested value in object using path
   */
  private static setNestedValue(obj: Record<string, any>, path: string, value: any): void {
    const parts = path.split('.');

    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current)) {
        current[part] = {};
      }
      current = current[part];
    }

    current[parts[parts.length - 1]] = value;
  }

  /**
   * Validate record against rules
   */
  static validateRecord(
    record: Record<string, any>,
    rules: ValidationRule[]
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    rules.forEach((rule) => {
      const value = record[rule.field];

      switch (rule.rule) {
        case 'required':
          if (value === undefined || value === null || value === '') {
            errors.push(rule.message || `Field '${rule.field}' is required`);
          }
          break;

        case 'email':
          if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            errors.push(rule.message || `Field '${rule.field}' must be a valid email`);
          }
          break;

        case 'phone':
          if (value && !/^\+?[\d\s\-()]+$/.test(value)) {
            errors.push(rule.message || `Field '${rule.field}' must be a valid phone number`);
          }
          break;

        case 'date':
          if (value && isNaN(new Date(value).getTime())) {
            errors.push(rule.message || `Field '${rule.field}' must be a valid date`);
          }
          break;

        case 'number':
          if (value && isNaN(Number(value))) {
            errors.push(rule.message || `Field '${rule.field}' must be a number`);
          }
          break;

        case 'custom':
          if (rule.customValidator && !rule.customValidator(value)) {
            errors.push(rule.message || `Field '${rule.field}' failed validation`);
          }
          break;
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Detect conflicts between source and destination records
   */
  static detectConflicts(
    sourceRecord: Record<string, any>,
    destinationRecord: Record<string, any>,
    fieldMappings: FieldMapping[]
  ): ConflictInfo[] {
    const conflicts: ConflictInfo[] = [];

    fieldMappings.forEach((mapping) => {
      const sourceValue = sourceRecord[mapping.localField];
      const destValue = destinationRecord[mapping.localField];

      // Skip if values are the same
      if (JSON.stringify(sourceValue) === JSON.stringify(destValue)) {
        return;
      }

      // Both have values and they differ
      if (sourceValue !== undefined && destValue !== undefined && sourceValue !== destValue) {
        conflicts.push({
          field: mapping.localField,
          sourceValue,
          destinationValue: destValue,
        });
      }
    });

    return conflicts;
  }

  /**
   * Resolve conflicts based on strategy
   */
  static resolveConflicts(
    sourceRecord: Record<string, any>,
    destinationRecord: Record<string, any>,
    conflicts: ConflictInfo[],
    strategy: ConflictResolution,
    sourceModified?: Date,
    destModified?: Date
  ): Record<string, any> {
    const resolved = { ...destinationRecord };

    conflicts.forEach((conflict) => {
      let resolvedValue: any;
      let resolution: ConflictInfo['resolution'];

      switch (strategy) {
        case 'source_wins':
          resolvedValue = conflict.sourceValue;
          resolution = 'source';
          break;

        case 'dest_wins':
          resolvedValue = conflict.destinationValue;
          resolution = 'destination';
          break;

        case 'newest_wins':
          if (sourceModified && destModified) {
            resolvedValue =
              sourceModified > destModified ? conflict.sourceValue : conflict.destinationValue;
            resolution = sourceModified > destModified ? 'source' : 'destination';
          } else {
            resolvedValue = conflict.sourceValue;
            resolution = 'source';
          }
          break;

        case 'merge':
          // Simple merge: if one value is empty, use the other
          if (!conflict.destinationValue) {
            resolvedValue = conflict.sourceValue;
            resolution = 'source';
          } else if (!conflict.sourceValue) {
            resolvedValue = conflict.destinationValue;
            resolution = 'destination';
          } else {
            // For complex merge, keep destination (could be enhanced)
            resolvedValue = conflict.destinationValue;
            resolution = 'destination';
          }
          break;

        case 'manual':
          // Keep destination and flag for manual review
          resolvedValue = conflict.destinationValue;
          resolution = 'destination';
          logger.warn(
            { field: conflict.field, conflict },
            'Conflict requires manual resolution'
          );
          break;

        default:
          resolvedValue = conflict.sourceValue;
          resolution = 'source';
      }

      resolved[conflict.field] = resolvedValue;
      conflict.resolution = resolution;
    });

    return resolved;
  }

  /**
   * Sync a single record
   */
  static async syncRecord(
    sourceRecord: SyncRecord,
    destinationRecord: SyncRecord | null,
    fieldMappings: FieldMapping[],
    options: {
      conflictResolution: ConflictResolution;
      validateBeforeSync: boolean;
      validationRules?: ValidationRule[];
    }
  ): Promise<SyncResult> {
    try {
      // Validate source record if required
      if (options.validateBeforeSync && options.validationRules) {
        const validation = this.validateRecord(sourceRecord.data, options.validationRules);

        if (!validation.valid) {
          return {
            success: false,
            recordId: sourceRecord.id,
            operation: 'skip',
            error: `Validation failed: ${validation.errors.join(', ')}`,
          };
        }
      }

      // If destination doesn't exist, create new
      if (!destinationRecord) {
        return {
          success: true,
          recordId: sourceRecord.id,
          operation: 'create',
          sourceId: sourceRecord.sourceId,
        };
      }

      // Detect conflicts
      const conflicts = this.detectConflicts(
        sourceRecord.data,
        destinationRecord.data,
        fieldMappings
      );

      // No conflicts, proceed with update
      if (conflicts.length === 0) {
        return {
          success: true,
          recordId: sourceRecord.id,
          operation: 'update',
          sourceId: sourceRecord.sourceId,
          destinationId: destinationRecord.destinationId,
        };
      }

      // Resolve conflicts
      if (options.conflictResolution === 'manual') {
        return {
          success: false,
          recordId: sourceRecord.id,
          operation: 'conflict',
          sourceId: sourceRecord.sourceId,
          destinationId: destinationRecord.destinationId,
          conflicts,
          error: 'Manual conflict resolution required',
        };
      }

      const resolved = this.resolveConflicts(
        sourceRecord.data,
        destinationRecord.data,
        conflicts,
        options.conflictResolution,
        sourceRecord.metadata?.lastModified,
        destinationRecord.metadata?.lastModified
      );

      return {
        success: true,
        recordId: sourceRecord.id,
        operation: 'update',
        sourceId: sourceRecord.sourceId,
        destinationId: destinationRecord.destinationId,
        conflicts,
      };
    } catch (error) {
      logger.error({ recordId: sourceRecord.id, error }, 'Failed to sync record');

      return {
        success: false,
        recordId: sourceRecord.id,
        operation: 'skip',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Sync batch of records
   */
  static async syncBatch(
    sourceRecords: SyncRecord[],
    destinationRecords: Map<string, SyncRecord>,
    fieldMappings: FieldMapping[],
    options: BatchSyncOptions
  ): Promise<{
    results: SyncResult[];
    summary: {
      total: number;
      created: number;
      updated: number;
      skipped: number;
      conflicts: number;
      errors: number;
    };
  }> {
    const results: SyncResult[] = [];

    for (let i = 0; i < sourceRecords.length; i += options.batchSize) {
      const batch = sourceRecords.slice(i, i + options.batchSize);

      for (const sourceRecord of batch) {
        const destRecord = destinationRecords.get(sourceRecord.id) || null;

        const result = await this.syncRecord(sourceRecord, destRecord, fieldMappings, {
          conflictResolution: options.conflictResolution,
          validateBeforeSync: options.validateBeforeSync,
        });

        results.push(result);

        // Stop on error if continueOnError is false
        if (!result.success && !options.continueOnError) {
          break;
        }
      }
    }

    // Generate summary
    const summary = {
      total: results.length,
      created: results.filter((r) => r.operation === 'create').length,
      updated: results.filter((r) => r.operation === 'update').length,
      skipped: results.filter((r) => r.operation === 'skip').length,
      conflicts: results.filter((r) => r.operation === 'conflict').length,
      errors: results.filter((r) => !r.success).length,
    };

    logger.info(summary, 'Batch sync completed');

    return { results, summary };
  }

  /**
   * Calculate checksum for record
   */
  static calculateChecksum(record: Record<string, any>): string {
    const crypto = require('crypto');
    const data = JSON.stringify(record, Object.keys(record).sort());
    return crypto.createHash('md5').update(data).digest('hex');
  }

  /**
   * Check if record has changed
   */
  static hasChanged(
    sourceRecord: SyncRecord,
    destinationRecord: SyncRecord
  ): boolean {
    if (!sourceRecord.metadata?.checksum || !destinationRecord.metadata?.checksum) {
      return true; // Assume changed if no checksum
    }

    return sourceRecord.metadata.checksum !== destinationRecord.metadata.checksum;
  }
}

// Initialize transformation functions on module load
DataSyncEngine.initializeTransformations();
