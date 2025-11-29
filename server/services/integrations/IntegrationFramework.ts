/**
 * Integration Framework
 *
 * Core framework for managing third-party integrations, connectors,
 * and data synchronization across external systems
 */

import { loggers } from '../../utils/logger.js';
import crypto from 'crypto';

const logger = loggers.api;

/**
 * Integration Types
 */
export type IntegrationType =
  | 'ehr' // Electronic Health Record
  | 'lab' // Laboratory Information System
  | 'insurance' // Insurance Verification
  | 'ecommerce' // E-commerce platform
  | 'payment' // Payment processor
  | 'pharmacy' // Pharmacy Management System
  | 'imaging' // Medical Imaging System
  | 'billing' // Billing System
  | 'custom'; // Custom integration

/**
 * Authentication Types
 */
export type AuthType =
  | 'api_key'
  | 'oauth2'
  | 'basic'
  | 'jwt'
  | 'certificate'
  | 'custom';

/**
 * Integration Status
 */
export type IntegrationStatus =
  | 'active' // Actively syncing
  | 'paused' // Temporarily paused
  | 'error' // In error state
  | 'configuring' // Being configured
  | 'disabled'; // Disabled

/**
 * Sync Direction
 */
export type SyncDirection = 'pull' | 'push' | 'bidirectional';

/**
 * Sync Strategy
 */
export type SyncStrategy =
  | 'webhook' // Event-driven via webhooks
  | 'polling' // Periodic polling
  | 'real_time' // Real-time streaming
  | 'batch' // Batch processing
  | 'manual'; // Manual trigger only

/**
 * Integration Configuration
 */
export interface IntegrationConfig {
  id: string;
  name: string;
  type: IntegrationType;
  provider: string; // e.g., "Epic", "Cerner", "Shopify"
  companyId: string;

  // Connection details
  status: IntegrationStatus;
  authType: AuthType;
  credentials: {
    encrypted: string; // Encrypted credentials
    expiresAt?: Date;
  };
  endpoint?: string; // Base URL for API
  webhookUrl?: string; // URL for receiving webhooks

  // Sync configuration
  syncDirection: SyncDirection;
  syncStrategy: SyncStrategy;
  syncFrequency?: number; // For polling, in minutes
  syncEnabled: boolean;

  // Data mapping
  entityMappings: EntityMapping[];
  fieldMappings: Record<string, FieldMapping[]>;

  // Features
  capabilities: IntegrationCapability[];
  customSettings?: Record<string, any>;

  // Monitoring
  lastSyncAt?: Date;
  lastSuccessAt?: Date;
  lastErrorAt?: Date;
  lastError?: string;
  syncCount: number;
  errorCount: number;

  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
  version: string; // Integration version
}

/**
 * Entity Mapping (which entities to sync)
 */
export interface EntityMapping {
  localEntity: string; // e.g., "patients"
  remoteEntity: string; // e.g., "Patient"
  enabled: boolean;
  direction: SyncDirection;
  filter?: Record<string, any>; // Optional filter criteria
}

/**
 * Field Mapping
 */
export interface FieldMapping {
  localField: string;
  remoteField: string;
  transform?: string; // Transformation function name
  required: boolean;
  direction: 'import' | 'export' | 'both';
}

/**
 * Integration Capability
 */
export interface IntegrationCapability {
  name: string;
  enabled: boolean;
  config?: Record<string, any>;
}

/**
 * Sync Job
 */
export interface SyncJob {
  id: string;
  integrationId: string;
  entity: string;
  direction: SyncDirection;
  status: 'pending' | 'running' | 'completed' | 'failed';

  // Progress tracking
  totalRecords: number;
  processedRecords: number;
  successfulRecords: number;
  failedRecords: number;
  errors: SyncError[];

  // Timing
  startedAt: Date;
  completedAt?: Date;
  duration?: number; // milliseconds

  // Metadata
  triggeredBy: 'manual' | 'scheduled' | 'webhook' | 'system';
  triggeredByUser?: string;
}

/**
 * Sync Error
 */
export interface SyncError {
  recordId?: string;
  field?: string;
  error: string;
  timestamp: Date;
  recoverable: boolean;
}

/**
 * Integration Event
 */
export interface IntegrationEvent {
  id: string;
  integrationId: string;
  type: 'sync_started' | 'sync_completed' | 'sync_failed' | 'auth_refreshed' | 'error' | 'status_changed';
  data: Record<string, any>;
  timestamp: Date;
}

/**
 * Integration Framework Service
 */
export class IntegrationFramework {
  /**
   * In-memory integrations store (use database in production)
   */
  private static integrations = new Map<string, IntegrationConfig>();

  /**
   * In-memory sync jobs store (use database in production)
   */
  private static syncJobs = new Map<string, SyncJob>();

  /**
   * In-memory events store (use database in production)
   */
  private static events: IntegrationEvent[] = [];

  /**
   * Encryption key for credentials (use proper key management in production)
   * WARNING: INTEGRATION_ENCRYPTION_KEY must be set in production for secure credential storage
   */
  private static readonly ENCRYPTION_KEY = (() => {
    const key = process.env.INTEGRATION_ENCRYPTION_KEY;
    if (!key && process.env.NODE_ENV === 'production') {
      console.error('CRITICAL: INTEGRATION_ENCRYPTION_KEY not set in production - integration credentials will not be secure');
    }
    return key || 'dev-only-insecure-key-' + (process.env.NODE_ENV || 'development');
  })();

  /**
   * Create a new integration
   */
  static async createIntegration(
    config: Omit<IntegrationConfig, 'id' | 'createdAt' | 'syncCount' | 'errorCount'>
  ): Promise<IntegrationConfig> {
    const integration: IntegrationConfig = {
      ...config,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      syncCount: 0,
      errorCount: 0,
    };

    this.integrations.set(integration.id, integration);

    await this.emitEvent({
      integrationId: integration.id,
      type: 'status_changed',
      data: { status: integration.status, oldStatus: null },
    });

    logger.info(
      { integrationId: integration.id, name: integration.name, provider: integration.provider },
      'Integration created'
    );

    return integration;
  }

  /**
   * Get integration by ID
   */
  static async getIntegration(integrationId: string): Promise<IntegrationConfig | null> {
    return this.integrations.get(integrationId) || null;
  }

  /**
   * Get all integrations for a company
   */
  static async getIntegrations(
    companyId: string,
    filters?: {
      type?: IntegrationType;
      status?: IntegrationStatus;
      provider?: string;
    }
  ): Promise<IntegrationConfig[]> {
    let integrations = Array.from(this.integrations.values()).filter(
      (i) => i.companyId === companyId
    );

    if (filters?.type) {
      integrations = integrations.filter((i) => i.type === filters.type);
    }

    if (filters?.status) {
      integrations = integrations.filter((i) => i.status === filters.status);
    }

    if (filters?.provider) {
      integrations = integrations.filter((i) => i.provider === filters.provider);
    }

    return integrations;
  }

  /**
   * Update integration
   */
  static async updateIntegration(
    integrationId: string,
    updates: Partial<IntegrationConfig>
  ): Promise<IntegrationConfig> {
    const integration = this.integrations.get(integrationId);

    if (!integration) {
      throw new Error('Integration not found');
    }

    const oldStatus = integration.status;
    const updated = {
      ...integration,
      ...updates,
      updatedAt: new Date(),
    };

    this.integrations.set(integrationId, updated);

    if (updates.status && updates.status !== oldStatus) {
      await this.emitEvent({
        integrationId,
        type: 'status_changed',
        data: { status: updates.status, oldStatus },
      });
    }

    logger.info({ integrationId, updates }, 'Integration updated');

    return updated;
  }

  /**
   * Delete integration
   */
  static async deleteIntegration(integrationId: string): Promise<boolean> {
    const deleted = this.integrations.delete(integrationId);

    if (deleted) {
      logger.info({ integrationId }, 'Integration deleted');
    }

    return deleted;
  }

  /**
   * Test integration connection
   */
  static async testConnection(integrationId: string): Promise<{
    success: boolean;
    message: string;
    latency?: number;
  }> {
    const integration = this.integrations.get(integrationId);

    if (!integration) {
      return { success: false, message: 'Integration not found' };
    }

    const startTime = Date.now();

    try {
      // In production, would actually test the connection
      // For now, simulate a connection test
      await new Promise((resolve) => setTimeout(resolve, 100));

      const latency = Date.now() - startTime;

      logger.info({ integrationId, latency }, 'Connection test successful');

      return {
        success: true,
        message: 'Connection successful',
        latency,
      };
    } catch (error) {
      logger.error({ integrationId, error }, 'Connection test failed');

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }

  /**
   * Start a sync job
   */
  static async startSync(
    integrationId: string,
    entity: string,
    triggeredBy: SyncJob['triggeredBy'],
    triggeredByUser?: string
  ): Promise<SyncJob> {
    const integration = this.integrations.get(integrationId);

    if (!integration) {
      throw new Error('Integration not found');
    }

    if (integration.status !== 'active') {
      throw new Error('Integration is not active');
    }

    const entityMapping = integration.entityMappings.find(
      (m) => m.localEntity === entity && m.enabled
    );

    if (!entityMapping) {
      throw new Error('Entity mapping not found or disabled');
    }

    const job: SyncJob = {
      id: crypto.randomUUID(),
      integrationId,
      entity,
      direction: entityMapping.direction,
      status: 'pending',
      totalRecords: 0,
      processedRecords: 0,
      successfulRecords: 0,
      failedRecords: 0,
      errors: [],
      startedAt: new Date(),
      triggeredBy,
      triggeredByUser,
    };

    this.syncJobs.set(job.id, job);

    await this.emitEvent({
      integrationId,
      type: 'sync_started',
      data: { jobId: job.id, entity },
    });

    // Execute sync in background
    this.executeSync(job.id).catch((error) => {
      logger.error({ jobId: job.id, error }, 'Sync execution failed');
    });

    logger.info({ jobId: job.id, integrationId, entity }, 'Sync job started');

    return job;
  }

  /**
   * Execute sync job
   */
  private static async executeSync(jobId: string): Promise<void> {
    const job = this.syncJobs.get(jobId);

    if (!job) {
      throw new Error('Sync job not found');
    }

    const integration = this.integrations.get(job.integrationId);

    if (!integration) {
      throw new Error('Integration not found');
    }

    job.status = 'running';
    this.syncJobs.set(jobId, job);

    try {
      // In production, would perform actual sync based on strategy
      // For now, simulate sync
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Simulate processing records
      job.totalRecords = 100;
      job.processedRecords = 100;
      job.successfulRecords = 95;
      job.failedRecords = 5;

      // Complete job
      job.status = 'completed';
      job.completedAt = new Date();
      job.duration = job.completedAt.getTime() - job.startedAt.getTime();

      this.syncJobs.set(jobId, job);

      // Update integration stats
      await this.updateIntegration(job.integrationId, {
        lastSyncAt: new Date(),
        lastSuccessAt: new Date(),
        syncCount: integration.syncCount + 1,
      });

      await this.emitEvent({
        integrationId: job.integrationId,
        type: 'sync_completed',
        data: {
          jobId,
          totalRecords: job.totalRecords,
          successfulRecords: job.successfulRecords,
          failedRecords: job.failedRecords,
        },
      });

      logger.info(
        {
          jobId,
          integrationId: job.integrationId,
          totalRecords: job.totalRecords,
          successfulRecords: job.successfulRecords,
          duration: job.duration,
        },
        'Sync job completed'
      );
    } catch (error) {
      job.status = 'failed';
      job.completedAt = new Date();
      job.duration = job.completedAt.getTime() - job.startedAt.getTime();

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      job.errors.push({
        error: errorMessage,
        timestamp: new Date(),
        recoverable: false,
      });

      this.syncJobs.set(jobId, job);

      // Update integration stats
      await this.updateIntegration(job.integrationId, {
        lastSyncAt: new Date(),
        lastErrorAt: new Date(),
        lastError: errorMessage,
        errorCount: integration.errorCount + 1,
      });

      await this.emitEvent({
        integrationId: job.integrationId,
        type: 'sync_failed',
        data: { jobId, error: errorMessage },
      });

      logger.error({ jobId, integrationId: job.integrationId, error }, 'Sync job failed');

      throw error;
    }
  }

  /**
   * Get sync job by ID
   */
  static async getSyncJob(jobId: string): Promise<SyncJob | null> {
    return this.syncJobs.get(jobId) || null;
  }

  /**
   * Get sync jobs for an integration
   */
  static async getSyncJobs(
    integrationId: string,
    limit: number = 50
  ): Promise<SyncJob[]> {
    return Array.from(this.syncJobs.values())
      .filter((job) => job.integrationId === integrationId)
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
      .slice(0, limit);
  }

  /**
   * Encrypt credentials
   */
  static encryptCredentials(credentials: Record<string, any>): string {
    const iv = crypto.randomBytes(16);
    const key = crypto.scryptSync(this.ENCRYPTION_KEY, 'salt', 32);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

    let encrypted = cipher.update(JSON.stringify(credentials), 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return `${iv.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt credentials
   */
  static decryptCredentials(encryptedData: string): Record<string, any> {
    const [ivHex, encrypted] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const key = crypto.scryptSync(this.ENCRYPTION_KEY, 'salt', 32);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  }

  /**
   * Emit integration event
   */
  private static async emitEvent(
    event: Omit<IntegrationEvent, 'id' | 'timestamp'>
  ): Promise<void> {
    const fullEvent: IntegrationEvent = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };

    this.events.push(fullEvent);

    // Trim events if too many
    if (this.events.length > 10000) {
      this.events = this.events.slice(-10000);
    }

    logger.debug({ event: fullEvent }, 'Integration event emitted');
  }

  /**
   * Get events for an integration
   */
  static async getEvents(
    integrationId: string,
    limit: number = 100
  ): Promise<IntegrationEvent[]> {
    return this.events
      .filter((event) => event.integrationId === integrationId)
      .slice(-limit)
      .reverse();
  }

  /**
   * Get integration statistics
   */
  static async getIntegrationStats(integrationId: string): Promise<{
    totalSyncs: number;
    successfulSyncs: number;
    failedSyncs: number;
    averageDuration: number;
    lastSyncAt?: Date;
    uptime: number; // percentage
  }> {
    const integration = this.integrations.get(integrationId);

    if (!integration) {
      throw new Error('Integration not found');
    }

    const jobs = await this.getSyncJobs(integrationId, 1000);

    const totalSyncs = jobs.length;
    const successfulSyncs = jobs.filter((j) => j.status === 'completed').length;
    const failedSyncs = jobs.filter((j) => j.status === 'failed').length;

    const completedJobs = jobs.filter((j) => j.duration);
    const averageDuration =
      completedJobs.length > 0
        ? completedJobs.reduce((sum, j) => sum + (j.duration || 0), 0) /
          completedJobs.length
        : 0;

    const uptime = totalSyncs > 0 ? (successfulSyncs / totalSyncs) * 100 : 100;

    return {
      totalSyncs,
      successfulSyncs,
      failedSyncs,
      averageDuration,
      lastSyncAt: integration.lastSyncAt,
      uptime,
    };
  }

  /**
   * Pause integration
   */
  static async pauseIntegration(integrationId: string): Promise<void> {
    await this.updateIntegration(integrationId, { status: 'paused' });
    logger.info({ integrationId }, 'Integration paused');
  }

  /**
   * Resume integration
   */
  static async resumeIntegration(integrationId: string): Promise<void> {
    await this.updateIntegration(integrationId, { status: 'active' });
    logger.info({ integrationId }, 'Integration resumed');
  }

  /**
   * Disable integration
   */
  static async disableIntegration(integrationId: string): Promise<void> {
    await this.updateIntegration(integrationId, { status: 'disabled', syncEnabled: false });
    logger.info({ integrationId }, 'Integration disabled');
  }
}
