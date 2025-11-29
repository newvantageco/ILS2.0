/**
 * Configuration Management Service
 *
 * Manages system-wide configuration, feature flags, and environment settings
 */

import { loggers } from '../../utils/logger.js';
import crypto from 'crypto';

const logger = loggers.api;

// ========== Types & Interfaces ==========

/**
 * Configuration category
 */
export type ConfigCategory =
  | 'system'
  | 'security'
  | 'integration'
  | 'communication'
  | 'billing'
  | 'clinical'
  | 'ui'
  | 'feature_flags';

/**
 * Configuration value type
 */
export type ConfigValueType = 'string' | 'number' | 'boolean' | 'json' | 'encrypted';

/**
 * Environment
 */
export type Environment = 'development' | 'staging' | 'production';

/**
 * Configuration setting
 */
export interface ConfigSetting {
  id: string;
  key: string;
  category: ConfigCategory;
  valueType: ConfigValueType;
  value: any;
  defaultValue?: any;
  description?: string;

  // Environment-specific
  environment?: Environment;

  // Validation
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
    allowedValues?: any[];
  };

  // Metadata
  isSecret: boolean;
  isEditable: boolean;
  requiresRestart: boolean;

  // Audit
  createdAt: Date;
  updatedAt?: Date;
  updatedBy?: string;
  version: number;
}

/**
 * Feature flag
 */
export interface FeatureFlag {
  id: string;
  name: string;
  key: string;
  description?: string;
  enabled: boolean;

  // Rollout strategy
  rolloutPercentage?: number; // 0-100
  targetUserIds?: string[];
  targetRoles?: string[];
  targetEnvironments?: Environment[];

  // Scheduling
  enabledAt?: Date;
  disabledAt?: Date;
  scheduleEnableAt?: Date;
  scheduleDisableAt?: Date;

  // Metadata
  createdAt: Date;
  updatedAt?: Date;
  updatedBy?: string;
}

/**
 * Configuration change
 */
export interface ConfigChange {
  id: string;
  configId: string;
  key: string;
  previousValue: any;
  newValue: any;
  changedBy: string;
  changedAt: Date;
  reason?: string;
  rollbackId?: string;
}

/**
 * Configuration Management Service
 */
export class ConfigurationService {
  /**
   * In-memory stores (use database in production)
   */
  private static settings = new Map<string, ConfigSetting>();
  private static featureFlags = new Map<string, FeatureFlag>();
  private static changeHistory: ConfigChange[] = [];

  /**
   * Configuration
   */
  private static readonly CHANGE_HISTORY_RETENTION_DAYS = 90;
  private static readonly ENCRYPTION_KEY = (() => {
    const key = process.env.CONFIG_ENCRYPTION_KEY;
    if (!key && process.env.NODE_ENV === 'production') {
      console.error('CRITICAL: CONFIG_ENCRYPTION_KEY not set in production - configuration values will not be secure');
    }
    return key || 'dev-only-insecure-key-' + (process.env.NODE_ENV || 'development');
  })();
  private static currentEnvironment: Environment = (process.env.NODE_ENV as Environment) || 'development';

  /**
   * Initialize default settings
   */
  static {
    this.initializeDefaultSettings();
    this.initializeDefaultFeatureFlags();
  }

  // ========== Default Configuration ==========

  /**
   * Initialize default settings
   */
  private static initializeDefaultSettings(): void {
    // System settings
    this.createSetting({
      key: 'system.name',
      category: 'system',
      valueType: 'string',
      value: 'ILS 2.0',
      description: 'System name',
      isSecret: false,
      isEditable: true,
      requiresRestart: false,
    });

    this.createSetting({
      key: 'system.timezone',
      category: 'system',
      valueType: 'string',
      value: 'America/New_York',
      description: 'Default system timezone',
      isSecret: false,
      isEditable: true,
      requiresRestart: false,
    });

    this.createSetting({
      key: 'system.maintenance_mode',
      category: 'system',
      valueType: 'boolean',
      value: false,
      description: 'Enable maintenance mode',
      isSecret: false,
      isEditable: true,
      requiresRestart: false,
    });

    // Security settings
    this.createSetting({
      key: 'security.session_timeout',
      category: 'security',
      valueType: 'number',
      value: 86400000, // 24 hours
      description: 'Session timeout in milliseconds',
      validation: { min: 300000, max: 604800000 }, // 5 min to 7 days
      isSecret: false,
      isEditable: true,
      requiresRestart: false,
    });

    this.createSetting({
      key: 'security.password_min_length',
      category: 'security',
      valueType: 'number',
      value: 8,
      description: 'Minimum password length',
      validation: { min: 6, max: 128 },
      isSecret: false,
      isEditable: true,
      requiresRestart: false,
    });

    this.createSetting({
      key: 'security.mfa_enabled',
      category: 'security',
      valueType: 'boolean',
      value: false,
      description: 'Enable multi-factor authentication',
      isSecret: false,
      isEditable: true,
      requiresRestart: true,
    });

    this.createSetting({
      key: 'security.max_login_attempts',
      category: 'security',
      valueType: 'number',
      value: 5,
      description: 'Maximum login attempts before lockout',
      validation: { min: 3, max: 10 },
      isSecret: false,
      isEditable: true,
      requiresRestart: false,
    });

    // Integration settings
    this.createSetting({
      key: 'integration.fhir_enabled',
      category: 'integration',
      valueType: 'boolean',
      value: true,
      description: 'Enable FHIR integration',
      isSecret: false,
      isEditable: true,
      requiresRestart: true,
    });

    this.createSetting({
      key: 'integration.hl7_enabled',
      category: 'integration',
      valueType: 'boolean',
      value: true,
      description: 'Enable HL7 integration',
      isSecret: false,
      isEditable: true,
      requiresRestart: true,
    });

    // Communication settings
    this.createSetting({
      key: 'communication.email_enabled',
      category: 'communication',
      valueType: 'boolean',
      value: true,
      description: 'Enable email notifications',
      isSecret: false,
      isEditable: true,
      requiresRestart: false,
    });

    this.createSetting({
      key: 'communication.sms_enabled',
      category: 'communication',
      valueType: 'boolean',
      value: true,
      description: 'Enable SMS notifications',
      isSecret: false,
      isEditable: true,
      requiresRestart: false,
    });

    this.createSetting({
      key: 'communication.smtp_host',
      category: 'communication',
      valueType: 'string',
      value: 'smtp.example.com',
      description: 'SMTP server host',
      isSecret: false,
      isEditable: true,
      requiresRestart: true,
    });

    this.createSetting({
      key: 'communication.smtp_password',
      category: 'communication',
      valueType: 'encrypted',
      value: this.encryptValue('default-password'),
      description: 'SMTP server password',
      isSecret: true,
      isEditable: true,
      requiresRestart: true,
    });

    // Billing settings
    this.createSetting({
      key: 'billing.currency',
      category: 'billing',
      valueType: 'string',
      value: 'USD',
      description: 'Default currency',
      validation: { allowedValues: ['USD', 'EUR', 'GBP', 'CAD'] },
      isSecret: false,
      isEditable: true,
      requiresRestart: false,
    });

    this.createSetting({
      key: 'billing.tax_rate',
      category: 'billing',
      valueType: 'number',
      value: 0.0,
      description: 'Default tax rate (percentage)',
      validation: { min: 0, max: 100 },
      isSecret: false,
      isEditable: true,
      requiresRestart: false,
    });

    // Clinical settings
    this.createSetting({
      key: 'clinical.appointment_duration_default',
      category: 'clinical',
      valueType: 'number',
      value: 30,
      description: 'Default appointment duration in minutes',
      validation: { min: 15, max: 120 },
      isSecret: false,
      isEditable: true,
      requiresRestart: false,
    });

    this.createSetting({
      key: 'clinical.prescription_refill_days',
      category: 'clinical',
      valueType: 'number',
      value: 30,
      description: 'Days before prescription expiry to allow refill',
      validation: { min: 0, max: 90 },
      isSecret: false,
      isEditable: true,
      requiresRestart: false,
    });

    // UI settings
    this.createSetting({
      key: 'ui.theme',
      category: 'ui',
      valueType: 'string',
      value: 'light',
      description: 'Default UI theme',
      validation: { allowedValues: ['light', 'dark', 'auto'] },
      isSecret: false,
      isEditable: true,
      requiresRestart: false,
    });

    this.createSetting({
      key: 'ui.items_per_page',
      category: 'ui',
      valueType: 'number',
      value: 25,
      description: 'Default items per page in lists',
      validation: { allowedValues: [10, 25, 50, 100] },
      isSecret: false,
      isEditable: true,
      requiresRestart: false,
    });
  }

  /**
   * Initialize default feature flags
   */
  private static initializeDefaultFeatureFlags(): void {
    this.createFeatureFlag({
      name: 'Telehealth',
      key: 'feature.telehealth',
      description: 'Enable telehealth virtual visits',
      enabled: true,
    });

    this.createFeatureFlag({
      name: 'Patient Portal',
      key: 'feature.patient_portal',
      description: 'Enable patient self-service portal',
      enabled: true,
    });

    this.createFeatureFlag({
      name: 'Advanced Analytics',
      key: 'feature.analytics',
      description: 'Enable advanced analytics and BI dashboards',
      enabled: true,
    });

    this.createFeatureFlag({
      name: 'AI Diagnostics',
      key: 'feature.ai_diagnostics',
      description: 'Enable AI-powered diagnostic assistance',
      enabled: false,
      rolloutPercentage: 10, // 10% gradual rollout
    });

    this.createFeatureFlag({
      name: 'Mobile App',
      key: 'feature.mobile_app',
      description: 'Enable mobile application access',
      enabled: false,
      targetEnvironments: ['development', 'staging'],
    });

    this.createFeatureFlag({
      name: 'Automated Campaigns',
      key: 'feature.campaigns',
      description: 'Enable automated marketing campaigns',
      enabled: true,
    });

    this.createFeatureFlag({
      name: 'Integration Hub',
      key: 'feature.integrations',
      description: 'Enable third-party integrations',
      enabled: true,
    });
  }

  // ========== Configuration Settings ==========

  /**
   * Create setting
   */
  static createSetting(
    setting: Omit<ConfigSetting, 'id' | 'createdAt' | 'version'>
  ): ConfigSetting {
    const newSetting: ConfigSetting = {
      id: crypto.randomUUID(),
      ...setting,
      createdAt: new Date(),
      version: 1,
    };

    this.settings.set(newSetting.key, newSetting);

    logger.info({ key: newSetting.key, category: setting.category }, 'Configuration setting created');

    return newSetting;
  }

  /**
   * Get setting
   */
  static getSetting(key: string): ConfigSetting | null {
    return this.settings.get(key) || null;
  }

  /**
   * Get setting value
   */
  static getValue(key: string): any {
    const setting = this.settings.get(key);

    if (!setting) {
      return setting?.defaultValue;
    }

    // Decrypt if encrypted
    if (setting.valueType === 'encrypted') {
      return this.decryptValue(setting.value);
    }

    return setting.value;
  }

  /**
   * List settings
   */
  static listSettings(
    category?: ConfigCategory,
    includeSecrets: boolean = false
  ): ConfigSetting[] {
    let settings = Array.from(this.settings.values());

    if (category) {
      settings = settings.filter((s) => s.category === category);
    }

    if (!includeSecrets) {
      settings = settings.map((s) => {
        if (s.isSecret) {
          return { ...s, value: '***REDACTED***' };
        }
        return s;
      });
    }

    return settings.sort((a, b) => a.key.localeCompare(b.key));
  }

  /**
   * Update setting
   */
  static updateSetting(
    key: string,
    value: any,
    userId: string,
    reason?: string
  ): ConfigSetting | null {
    const setting = this.settings.get(key);

    if (!setting) {
      return null;
    }

    if (!setting.isEditable) {
      throw new Error('Setting is not editable');
    }

    // Validate value
    this.validateSettingValue(setting, value);

    // Record change
    const change: ConfigChange = {
      id: crypto.randomUUID(),
      configId: setting.id,
      key,
      previousValue: setting.value,
      newValue: value,
      changedBy: userId,
      changedAt: new Date(),
      reason,
    };

    this.changeHistory.push(change);

    // Clean up old history
    const cutoff = new Date(Date.now() - this.CHANGE_HISTORY_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    this.changeHistory = this.changeHistory.filter((c) => c.changedAt >= cutoff);

    // Update setting
    const previousValue = setting.value;
    setting.value = setting.valueType === 'encrypted' ? this.encryptValue(value) : value;
    setting.updatedAt = new Date();
    setting.updatedBy = userId;
    setting.version++;

    this.settings.set(key, setting);

    logger.info(
      {
        key,
        previousValue: setting.isSecret ? '***' : previousValue,
        newValue: setting.isSecret ? '***' : value,
        userId,
      },
      'Configuration setting updated'
    );

    return setting;
  }

  /**
   * Validate setting value
   */
  private static validateSettingValue(setting: ConfigSetting, value: any): void {
    if (!setting.validation) {
      return;
    }

    const validation = setting.validation;

    // Required
    if (validation.required && (value === null || value === undefined || value === '')) {
      throw new Error('Value is required');
    }

    // Type-specific validation
    if (setting.valueType === 'number') {
      if (typeof value !== 'number') {
        throw new Error('Value must be a number');
      }

      if (validation.min !== undefined && value < validation.min) {
        throw new Error(`Value must be at least ${validation.min}`);
      }

      if (validation.max !== undefined && value > validation.max) {
        throw new Error(`Value must be at most ${validation.max}`);
      }
    }

    if (setting.valueType === 'string') {
      if (typeof value !== 'string') {
        throw new Error('Value must be a string');
      }

      if (validation.pattern) {
        const regex = new RegExp(validation.pattern);
        if (!regex.test(value)) {
          throw new Error('Value does not match required pattern');
        }
      }
    }

    // Allowed values
    if (validation.allowedValues && !validation.allowedValues.includes(value)) {
      throw new Error(`Value must be one of: ${validation.allowedValues.join(', ')}`);
    }
  }

  /**
   * Reset setting to default
   */
  static resetSetting(key: string, userId: string): ConfigSetting | null {
    const setting = this.settings.get(key);

    if (!setting || !setting.defaultValue) {
      return null;
    }

    return this.updateSetting(key, setting.defaultValue, userId, 'Reset to default');
  }

  /**
   * Get change history
   */
  static getChangeHistory(key?: string, userId?: string): ConfigChange[] {
    let history = this.changeHistory;

    if (key) {
      history = history.filter((c) => c.key === key);
    }

    if (userId) {
      history = history.filter((c) => c.changedBy === userId);
    }

    return history.sort((a, b) => b.changedAt.getTime() - a.changedAt.getTime());
  }

  // ========== Feature Flags ==========

  /**
   * Create feature flag
   */
  static createFeatureFlag(
    flag: Omit<FeatureFlag, 'id' | 'createdAt'>
  ): FeatureFlag {
    const newFlag: FeatureFlag = {
      id: crypto.randomUUID(),
      ...flag,
      createdAt: new Date(),
    };

    this.featureFlags.set(newFlag.key, newFlag);

    logger.info({ key: newFlag.key, enabled: flag.enabled }, 'Feature flag created');

    return newFlag;
  }

  /**
   * Get feature flag
   */
  static getFeatureFlag(key: string): FeatureFlag | null {
    return this.featureFlags.get(key) || null;
  }

  /**
   * Check if feature is enabled
   */
  static isFeatureEnabled(
    key: string,
    userId?: string,
    userRole?: string
  ): boolean {
    const flag = this.featureFlags.get(key);

    if (!flag) {
      return false;
    }

    // Check if globally disabled
    if (!flag.enabled) {
      return false;
    }

    // Check environment targeting
    if (flag.targetEnvironments && !flag.targetEnvironments.includes(this.currentEnvironment)) {
      return false;
    }

    // Check user targeting
    if (flag.targetUserIds && userId && !flag.targetUserIds.includes(userId)) {
      return false;
    }

    // Check role targeting
    if (flag.targetRoles && userRole && !flag.targetRoles.includes(userRole)) {
      return false;
    }

    // Check rollout percentage
    if (flag.rolloutPercentage !== undefined && flag.rolloutPercentage < 100) {
      if (!userId) {
        return false;
      }

      // Consistent hash-based rollout
      const hash = this.hashUserId(userId);
      return hash < flag.rolloutPercentage;
    }

    // Check scheduling
    const now = new Date();

    if (flag.scheduleEnableAt && now < flag.scheduleEnableAt) {
      return false;
    }

    if (flag.scheduleDisableAt && now >= flag.scheduleDisableAt) {
      return false;
    }

    return true;
  }

  /**
   * List feature flags
   */
  static listFeatureFlags(): FeatureFlag[] {
    return Array.from(this.featureFlags.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Update feature flag
   */
  static updateFeatureFlag(
    key: string,
    updates: Partial<Omit<FeatureFlag, 'id' | 'key' | 'createdAt'>>,
    userId: string
  ): FeatureFlag | null {
    const flag = this.featureFlags.get(key);

    if (!flag) {
      return null;
    }

    Object.assign(flag, updates, { updatedAt: new Date(), updatedBy: userId });

    this.featureFlags.set(key, flag);

    logger.info({ key, updates, userId }, 'Feature flag updated');

    return flag;
  }

  /**
   * Enable feature
   */
  static enableFeature(key: string, userId: string): FeatureFlag | null {
    return this.updateFeatureFlag(key, { enabled: true }, userId);
  }

  /**
   * Disable feature
   */
  static disableFeature(key: string, userId: string): FeatureFlag | null {
    return this.updateFeatureFlag(key, { enabled: false }, userId);
  }

  /**
   * Set rollout percentage
   */
  static setRolloutPercentage(
    key: string,
    percentage: number,
    userId: string
  ): FeatureFlag | null {
    if (percentage < 0 || percentage > 100) {
      throw new Error('Rollout percentage must be between 0 and 100');
    }

    return this.updateFeatureFlag(key, { rolloutPercentage: percentage }, userId);
  }

  // ========== Encryption ==========

  /**
   * Encrypt value
   */
  private static encryptValue(value: string): string {
    const iv = crypto.randomBytes(16);
    const key = crypto.scryptSync(this.ENCRYPTION_KEY, 'salt', 32);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return `${iv.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt value
   */
  private static decryptValue(encryptedValue: string): string {
    const [ivHex, encrypted] = encryptedValue.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const key = crypto.scryptSync(this.ENCRYPTION_KEY, 'salt', 32);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  // ========== Utilities ==========

  /**
   * Hash user ID for consistent rollout
   */
  private static hashUserId(userId: string): number {
    const hash = crypto.createHash('md5').update(userId).digest('hex');
    const num = parseInt(hash.substring(0, 8), 16);
    return (num % 100);
  }

  /**
   * Export configuration
   */
  static exportConfiguration(includeSecrets: boolean = false): {
    settings: ConfigSetting[];
    featureFlags: FeatureFlag[];
    exportedAt: Date;
    environment: Environment;
  } {
    return {
      settings: this.listSettings(undefined, includeSecrets),
      featureFlags: this.listFeatureFlags(),
      exportedAt: new Date(),
      environment: this.currentEnvironment,
    };
  }

  /**
   * Import configuration
   */
  static importConfiguration(
    config: { settings?: ConfigSetting[]; featureFlags?: FeatureFlag[] },
    userId: string
  ): { settingsImported: number; flagsImported: number } {
    let settingsImported = 0;
    let flagsImported = 0;

    // Import settings
    if (config.settings) {
      for (const setting of config.settings) {
        const existing = this.settings.get(setting.key);

        if (existing && existing.isEditable) {
          this.updateSetting(setting.key, setting.value, userId, 'Imported from configuration');
          settingsImported++;
        }
      }
    }

    // Import feature flags
    if (config.featureFlags) {
      for (const flag of config.featureFlags) {
        const existing = this.featureFlags.get(flag.key);

        if (existing) {
          this.updateFeatureFlag(flag.key, flag, userId);
          flagsImported++;
        }
      }
    }

    logger.info({ settingsImported, flagsImported, userId }, 'Configuration imported');

    return { settingsImported, flagsImported };
  }
}
