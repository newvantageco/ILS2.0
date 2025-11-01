/**
 * Feature Flags Service
 * Dynamic feature toggling for gradual rollout and A/B testing
 * Enables/disables features without redeployment
 */

import { cacheService } from './CacheService';

type FeatureFlagTarget = 'global' | 'company' | 'user';

interface FeatureFlag {
  key: string;
  enabled: boolean;
  description: string;
  target: FeatureFlagTarget;
  rolloutPercentage?: number; // 0-100, for gradual rollout
  allowList?: string[]; // Specific IDs (companyId or userId) with access
  blockList?: string[]; // Specific IDs explicitly blocked
  createdAt: Date;
  updatedAt: Date;
}

interface FeatureFlagCheck {
  enabled: boolean;
  reason: string;
}

class FeatureFlagsService {
  private flags: Map<string, FeatureFlag> = new Map();
  private readonly cacheNamespace = 'feature-flags';

  constructor() {
    this.initializeDefaultFlags();
  }

  /**
   * Initialize default feature flags
   */
  private initializeDefaultFlags(): void {
    // Core features (always on by default)
    this.createFlag('core-api', true, 'Core API endpoints', 'global');
    this.createFlag('authentication', true, 'User authentication', 'global');

    // New features (controlled rollout)
    this.createFlag('ai-recommendations', false, 'AI-powered frame recommendations', 'company');
    this.createFlag('advanced-analytics', false, 'Advanced analytics dashboard', 'company');
    this.createFlag('bulk-operations', false, 'Bulk import/export operations', 'company');
    this.createFlag('custom-reports', false, 'Custom report builder', 'company');
    this.createFlag('api-access', false, 'REST API access', 'company');
    this.createFlag('webhooks', false, 'Webhook integrations', 'company');

    // Experimental features (beta testing)
    this.createFlag('vision-analysis', false, 'AI vision analysis', 'company', 10); // 10% rollout
    this.createFlag('mobile-app', false, 'Mobile app access', 'user', 5); // 5% rollout
    this.createFlag('voice-assistant', false, 'Voice assistant integration', 'company', 0);

    // Performance/reliability toggles
    this.createFlag('use-read-replicas', true, 'Use database read replicas', 'global');
    this.createFlag('use-cdn', true, 'Use CDN for static assets', 'global');
    this.createFlag('enable-caching', true, 'Enable Redis caching', 'global');
    this.createFlag('enable-job-queues', true, 'Enable background job queues', 'global');

    // Maintenance mode
    this.createFlag('maintenance-mode', false, 'Maintenance mode', 'global');

    console.log(`✓ Initialized ${this.flags.size} feature flags`);
  }

  /**
   * Create a new feature flag
   */
  createFlag(
    key: string,
    enabled: boolean,
    description: string,
    target: FeatureFlagTarget,
    rolloutPercentage?: number
  ): FeatureFlag {
    const flag: FeatureFlag = {
      key,
      enabled,
      description,
      target,
      rolloutPercentage,
      allowList: [],
      blockList: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.flags.set(key, flag);
    return flag;
  }

  /**
   * Check if feature is enabled
   */
  async isEnabled(
    flagKey: string,
    targetId?: string // companyId or userId
  ): Promise<boolean> {
    const result = await this.checkFeature(flagKey, targetId);
    return result.enabled;
  }

  /**
   * Check feature with detailed reason
   */
  async checkFeature(
    flagKey: string,
    targetId?: string
  ): Promise<FeatureFlagCheck> {
    const flag = this.flags.get(flagKey);

    if (!flag) {
      return {
        enabled: false,
        reason: 'Feature flag not found',
      };
    }

    // If flag is disabled globally, it's disabled for everyone
    if (!flag.enabled) {
      return {
        enabled: false,
        reason: 'Feature disabled globally',
      };
    }

    // If no target ID provided for non-global flags, assume disabled
    if (flag.target !== 'global' && !targetId) {
      return {
        enabled: false,
        reason: 'Target ID required for non-global flags',
      };
    }

    // Check block list
    if (flag.blockList && targetId && flag.blockList.includes(targetId)) {
      return {
        enabled: false,
        reason: 'Target explicitly blocked',
      };
    }

    // Check allow list (overrides percentage rollout)
    if (flag.allowList && targetId && flag.allowList.includes(targetId)) {
      return {
        enabled: true,
        reason: 'Target in allow list',
      };
    }

    // Check rollout percentage
    if (flag.rolloutPercentage !== undefined && targetId) {
      const hash = this.hashString(targetId + flagKey);
      const percentage = (hash % 100) + 1;

      if (percentage > flag.rolloutPercentage) {
        return {
          enabled: false,
          reason: `Not in ${flag.rolloutPercentage}% rollout (hash: ${percentage})`,
        };
      }

      return {
        enabled: true,
        reason: `In ${flag.rolloutPercentage}% rollout (hash: ${percentage})`,
      };
    }

    // Default: enabled if flag is enabled globally
    return {
      enabled: true,
      reason: 'Feature enabled globally',
    };
  }

  /**
   * Enable feature flag
   */
  enable(flagKey: string): void {
    const flag = this.flags.get(flagKey);
    
    if (flag) {
      flag.enabled = true;
      flag.updatedAt = new Date();
      console.log(`Feature flag '${flagKey}' enabled`);
    }
  }

  /**
   * Disable feature flag
   */
  disable(flagKey: string): void {
    const flag = this.flags.get(flagKey);
    
    if (flag) {
      flag.enabled = false;
      flag.updatedAt = new Date();
      console.log(`Feature flag '${flagKey}' disabled`);
    }
  }

  /**
   * Set rollout percentage
   */
  setRollout(flagKey: string, percentage: number): void {
    const flag = this.flags.get(flagKey);
    
    if (flag) {
      flag.rolloutPercentage = Math.max(0, Math.min(100, percentage));
      flag.updatedAt = new Date();
      console.log(`Feature flag '${flagKey}' rollout set to ${percentage}%`);
    }
  }

  /**
   * Add to allow list
   */
  addToAllowList(flagKey: string, targetId: string): void {
    const flag = this.flags.get(flagKey);
    
    if (flag) {
      if (!flag.allowList) {
        flag.allowList = [];
      }
      
      if (!flag.allowList.includes(targetId)) {
        flag.allowList.push(targetId);
        flag.updatedAt = new Date();
        console.log(`Added ${targetId} to '${flagKey}' allow list`);
      }
    }
  }

  /**
   * Remove from allow list
   */
  removeFromAllowList(flagKey: string, targetId: string): void {
    const flag = this.flags.get(flagKey);
    
    if (flag && flag.allowList) {
      flag.allowList = flag.allowList.filter(id => id !== targetId);
      flag.updatedAt = new Date();
      console.log(`Removed ${targetId} from '${flagKey}' allow list`);
    }
  }

  /**
   * Add to block list
   */
  addToBlockList(flagKey: string, targetId: string): void {
    const flag = this.flags.get(flagKey);
    
    if (flag) {
      if (!flag.blockList) {
        flag.blockList = [];
      }
      
      if (!flag.blockList.includes(targetId)) {
        flag.blockList.push(targetId);
        flag.updatedAt = new Date();
        console.log(`Added ${targetId} to '${flagKey}' block list`);
      }
    }
  }

  /**
   * Remove from block list
   */
  removeFromBlockList(flagKey: string, targetId: string): void {
    const flag = this.flags.get(flagKey);
    
    if (flag && flag.blockList) {
      flag.blockList = flag.blockList.filter(id => id !== targetId);
      flag.updatedAt = new Date();
      console.log(`Removed ${targetId} from '${flagKey}' block list`);
    }
  }

  /**
   * Get flag details
   */
  getFlag(flagKey: string): FeatureFlag | null {
    return this.flags.get(flagKey) || null;
  }

  /**
   * Get all flags
   */
  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  /**
   * Get flags for specific target
   */
  async getFlagsForTarget(targetId: string): Promise<Record<string, boolean>> {
    const result: Record<string, boolean> = {};

    for (const flag of this.flags.values()) {
      result[flag.key] = await this.isEnabled(flag.key, targetId);
    }

    return result;
  }

  /**
   * Hash string to number (for consistent percentage rollout)
   */
  private hashString(str: string): number {
    let hash = 0;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash);
  }

  /**
   * Export flags to JSON
   */
  exportFlags(): string {
    const flags = Array.from(this.flags.values());
    return JSON.stringify(flags, null, 2);
  }

  /**
   * Import flags from JSON
   */
  importFlags(json: string): void {
    try {
      const flags = JSON.parse(json) as FeatureFlag[];
      
      for (const flag of flags) {
        this.flags.set(flag.key, flag);
      }
      
      console.log(`Imported ${flags.length} feature flags`);
    } catch (error) {
      console.error('Failed to import feature flags:', error);
    }
  }

  /**
   * Get health status
   */
  getHealth(): {
    totalFlags: number;
    enabledFlags: number;
    disabledFlags: number;
    rolloutFlags: number;
  } {
    const flags = Array.from(this.flags.values());
    const enabled = flags.filter(f => f.enabled).length;
    const rollout = flags.filter(f => f.rolloutPercentage !== undefined && f.rolloutPercentage > 0).length;

    return {
      totalFlags: flags.length,
      enabledFlags: enabled,
      disabledFlags: flags.length - enabled,
      rolloutFlags: rollout,
    };
  }
}

// Singleton instance
export const featureFlagsService = new FeatureFlagsService();

// Helper function for checking features in middleware/routes
export async function requireFeature(flagKey: string, targetId?: string): Promise<void> {
  const enabled = await featureFlagsService.isEnabled(flagKey, targetId);
  
  if (!enabled) {
    throw new Error(`Feature '${flagKey}' is not enabled`);
  }
}

// Middleware factory for protecting routes with feature flags
export function featureGate(flagKey: string, getTargetId?: (req: any) => string) {
  return async (req: any, res: any, next: any) => {
    const targetId = getTargetId ? getTargetId(req) : req.user?.companyId || req.user?.id;
    const check = await featureFlagsService.checkFeature(flagKey, targetId);

    if (!check.enabled) {
      return res.status(403).json({
        error: 'Feature not available',
        message: `This feature is not available: ${check.reason}`,
        featureKey: flagKey,
      });
    }

    next();
  };
}

export default featureFlagsService;
