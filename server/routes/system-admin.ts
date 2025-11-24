/**
 * System Admin API Routes
 *
 * Routes for platform administration and system management
 *
 * SECURITY: All routes require platform_admin role
 */

import express from 'express';
import { loggers } from '../utils/logger';
import { SystemMonitoringService } from '../services/admin/SystemMonitoringService';
import { ConfigurationService } from '../services/admin/ConfigurationService';
import { AdminOperationsService } from '../services/admin/AdminOperationsService';
import { requireAuth, requireRole } from '../middleware/auth';

const router = express.Router();
const logger = loggers.api;

// ========== SECURITY MIDDLEWARE ==========
// Apply authentication and authorization to ALL system admin routes
router.use(requireAuth);
router.use(requireRole(['platform_admin']));

// ========== System Monitoring ==========

router.get('/health', async (req, res) => {
  try {
    const health = SystemMonitoringService.getHealthStatus();
    res.json({ success: true, health });
  } catch (error) {
    logger.error({ error }, 'Get health status error');
    res.status(500).json({ success: false, error: 'Failed to get health status' });
  }
});

router.get('/metrics/system', async (req, res) => {
  try {
    const metrics = SystemMonitoringService.collectSystemMetrics();
    res.json({ success: true, metrics });
  } catch (error) {
    logger.error({ error }, 'Get system metrics error');
    res.status(500).json({ success: false, error: 'Failed to get system metrics' });
  }
});

router.get('/metrics/performance', async (req, res) => {
  try {
    const { name, startTime, endTime } = req.query;
    const metrics = SystemMonitoringService.getMetrics(
      name as string,
      startTime ? new Date(startTime as string) : undefined,
      endTime ? new Date(endTime as string) : undefined
    );
    res.json({ success: true, metrics });
  } catch (error) {
    logger.error({ error }, 'Get performance metrics error');
    res.status(500).json({ success: false, error: 'Failed to get performance metrics' });
  }
});

router.post('/metrics/record', async (req, res) => {
  try {
    const { name, type, value, unit, tags } = req.body;
    SystemMonitoringService.recordMetric(name, type, value, unit, tags);
    res.json({ success: true });
  } catch (error) {
    logger.error({ error }, 'Record metric error');
    res.status(500).json({ success: false, error: 'Failed to record metric' });
  }
});

router.get('/alerts', async (req, res) => {
  try {
    const { severity, component, acknowledged } = req.query;
    const alerts = SystemMonitoringService.getAlerts(
      severity as any,
      component as string,
      acknowledged ? acknowledged === 'true' : undefined
    );
    res.json({ success: true, alerts });
  } catch (error) {
    logger.error({ error }, 'Get alerts error');
    res.status(500).json({ success: false, error: 'Failed to get alerts' });
  }
});

router.post('/alerts/:alertId/acknowledge', async (req, res) => {
  try {
    const { userId } = req.body;
    const alert = SystemMonitoringService.acknowledgeAlert(req.params.alertId, userId);
    if (!alert) {
      return res.status(404).json({ success: false, error: 'Alert not found' });
    }
    res.json({ success: true, alert });
  } catch (error) {
    logger.error({ error }, 'Acknowledge alert error');
    res.status(500).json({ success: false, error: 'Failed to acknowledge alert' });
  }
});

router.post('/alerts/:alertId/resolve', async (req, res) => {
  try {
    const { userId } = req.body;
    const alert = SystemMonitoringService.resolveAlert(req.params.alertId, userId);
    if (!alert) {
      return res.status(404).json({ success: false, error: 'Alert not found' });
    }
    res.json({ success: true, alert });
  } catch (error) {
    logger.error({ error }, 'Resolve alert error');
    res.status(500).json({ success: false, error: 'Failed to resolve alert' });
  }
});

router.get('/statistics', async (req, res) => {
  try {
    const stats = SystemMonitoringService.getStatistics();
    res.json({ success: true, statistics: stats });
  } catch (error) {
    logger.error({ error }, 'Get statistics error');
    res.status(500).json({ success: false, error: 'Failed to get statistics' });
  }
});

// ========== Configuration Management ==========

router.get('/config/settings', async (req, res) => {
  try {
    const { category, includeSecrets } = req.query;
    const settings = ConfigurationService.listSettings(
      category as any,
      includeSecrets === 'true'
    );
    res.json({ success: true, settings });
  } catch (error) {
    logger.error({ error }, 'List settings error');
    res.status(500).json({ success: false, error: 'Failed to list settings' });
  }
});

router.get('/config/settings/:key', async (req, res) => {
  try {
    const setting = ConfigurationService.getSetting(req.params.key);
    if (!setting) {
      return res.status(404).json({ success: false, error: 'Setting not found' });
    }
    res.json({ success: true, setting });
  } catch (error) {
    logger.error({ error }, 'Get setting error');
    res.status(500).json({ success: false, error: 'Failed to get setting' });
  }
});

router.get('/config/settings/:key/value', async (req, res) => {
  try {
    const value = ConfigurationService.getValue(req.params.key);
    res.json({ success: true, value });
  } catch (error) {
    logger.error({ error }, 'Get setting value error');
    res.status(500).json({ success: false, error: 'Failed to get setting value' });
  }
});

router.put('/config/settings/:key', async (req, res) => {
  try {
    const { value, userId, reason } = req.body;
    const setting = ConfigurationService.updateSetting(req.params.key, value, userId, reason);
    if (!setting) {
      return res.status(404).json({ success: false, error: 'Setting not found' });
    }
    res.json({ success: true, setting });
  } catch (error: any) {
    logger.error({ error }, 'Update setting error');
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/config/settings/:key/reset', async (req, res) => {
  try {
    const { userId } = req.body;
    const setting = ConfigurationService.resetSetting(req.params.key, userId);
    if (!setting) {
      return res.status(404).json({ success: false, error: 'Setting not found' });
    }
    res.json({ success: true, setting });
  } catch (error) {
    logger.error({ error }, 'Reset setting error');
    res.status(500).json({ success: false, error: 'Failed to reset setting' });
  }
});

router.get('/config/history', async (req, res) => {
  try {
    const { key, userId } = req.query;
    const history = ConfigurationService.getChangeHistory(key as string, userId as string);
    res.json({ success: true, history });
  } catch (error) {
    logger.error({ error }, 'Get change history error');
    res.status(500).json({ success: false, error: 'Failed to get change history' });
  }
});

router.get('/config/export', async (req, res) => {
  try {
    const { includeSecrets } = req.query;
    const config = ConfigurationService.exportConfiguration(includeSecrets === 'true');
    res.json({ success: true, config });
  } catch (error) {
    logger.error({ error }, 'Export configuration error');
    res.status(500).json({ success: false, error: 'Failed to export configuration' });
  }
});

router.post('/config/import', async (req, res) => {
  try {
    const { config, userId } = req.body;
    const result = ConfigurationService.importConfiguration(config, userId);
    res.json({ success: true, result });
  } catch (error) {
    logger.error({ error }, 'Import configuration error');
    res.status(500).json({ success: false, error: 'Failed to import configuration' });
  }
});

// ========== Feature Flags ==========

router.get('/features', async (req, res) => {
  try {
    const flags = ConfigurationService.listFeatureFlags();
    res.json({ success: true, flags });
  } catch (error) {
    logger.error({ error }, 'List feature flags error');
    res.status(500).json({ success: false, error: 'Failed to list feature flags' });
  }
});

router.get('/features/:key', async (req, res) => {
  try {
    const flag = ConfigurationService.getFeatureFlag(req.params.key);
    if (!flag) {
      return res.status(404).json({ success: false, error: 'Feature flag not found' });
    }
    res.json({ success: true, flag });
  } catch (error) {
    logger.error({ error }, 'Get feature flag error');
    res.status(500).json({ success: false, error: 'Failed to get feature flag' });
  }
});

router.get('/features/:key/enabled', async (req, res) => {
  try {
    const { userId, userRole } = req.query;
    const enabled = ConfigurationService.isFeatureEnabled(
      req.params.key,
      userId as string,
      userRole as string
    );
    res.json({ success: true, enabled });
  } catch (error) {
    logger.error({ error }, 'Check feature enabled error');
    res.status(500).json({ success: false, error: 'Failed to check feature status' });
  }
});

router.put('/features/:key', async (req, res) => {
  try {
    const { updates, userId } = req.body;
    const flag = ConfigurationService.updateFeatureFlag(req.params.key, updates, userId);
    if (!flag) {
      return res.status(404).json({ success: false, error: 'Feature flag not found' });
    }
    res.json({ success: true, flag });
  } catch (error) {
    logger.error({ error }, 'Update feature flag error');
    res.status(500).json({ success: false, error: 'Failed to update feature flag' });
  }
});

router.post('/features/:key/enable', async (req, res) => {
  try {
    const { userId } = req.body;
    const flag = ConfigurationService.enableFeature(req.params.key, userId);
    if (!flag) {
      return res.status(404).json({ success: false, error: 'Feature flag not found' });
    }
    res.json({ success: true, flag });
  } catch (error) {
    logger.error({ error }, 'Enable feature error');
    res.status(500).json({ success: false, error: 'Failed to enable feature' });
  }
});

router.post('/features/:key/disable', async (req, res) => {
  try {
    const { userId } = req.body;
    const flag = ConfigurationService.disableFeature(req.params.key, userId);
    if (!flag) {
      return res.status(404).json({ success: false, error: 'Feature flag not found' });
    }
    res.json({ success: true, flag });
  } catch (error) {
    logger.error({ error }, 'Disable feature error');
    res.status(500).json({ success: false, error: 'Failed to disable feature' });
  }
});

router.post('/features/:key/rollout', async (req, res) => {
  try {
    const { percentage, userId } = req.body;
    const flag = ConfigurationService.setRolloutPercentage(req.params.key, percentage, userId);
    if (!flag) {
      return res.status(404).json({ success: false, error: 'Feature flag not found' });
    }
    res.json({ success: true, flag });
  } catch (error: any) {
    logger.error({ error }, 'Set rollout percentage error');
    res.status(400).json({ success: false, error: error.message });
  }
});

// ========== User Management ==========

router.post('/users', async (req, res) => {
  try {
    const { userData, createdBy } = req.body;
    const user = AdminOperationsService.createUser(userData, createdBy);
    res.status(201).json({ success: true, user });
  } catch (error: any) {
    logger.error({ error }, 'Create user error');
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/users', async (req, res) => {
  try {
    const { role, status } = req.query;
    const users = AdminOperationsService.listUsers(role as any, status as any);
    res.json({ success: true, users });
  } catch (error) {
    logger.error({ error }, 'List users error');
    res.status(500).json({ success: false, error: 'Failed to list users' });
  }
});

router.get('/users/:userId', async (req, res) => {
  try {
    const user = AdminOperationsService.getUser(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    logger.error({ error }, 'Get user error');
    res.status(500).json({ success: false, error: 'Failed to get user' });
  }
});

router.put('/users/:userId', async (req, res) => {
  try {
    const { updates, updatedBy } = req.body;
    const user = AdminOperationsService.updateUser(req.params.userId, updates, updatedBy);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    logger.error({ error }, 'Update user error');
    res.status(500).json({ success: false, error: 'Failed to update user' });
  }
});

router.post('/users/:userId/password/change', async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const result = await AdminOperationsService.changePassword(
      req.params.userId,
      oldPassword,
      newPassword
    );
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (error) {
    logger.error({ error }, 'Change password error');
    res.status(500).json({ success: false, error: 'Failed to change password' });
  }
});

router.post('/users/:userId/password/reset', async (req, res) => {
  try {
    const { newPassword, resetBy } = req.body;
    const user = await AdminOperationsService.resetPassword(
      req.params.userId,
      newPassword,
      resetBy
    );
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    logger.error({ error }, 'Reset password error');
    res.status(500).json({ success: false, error: 'Failed to reset password' });
  }
});

router.post('/users/:userId/suspend', async (req, res) => {
  try {
    const { suspendedBy } = req.body;
    const user = AdminOperationsService.suspendUser(req.params.userId, suspendedBy);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    logger.error({ error }, 'Suspend user error');
    res.status(500).json({ success: false, error: 'Failed to suspend user' });
  }
});

router.post('/users/:userId/unsuspend', async (req, res) => {
  try {
    const { unsuspendedBy } = req.body;
    const user = AdminOperationsService.unsuspendUser(req.params.userId, unsuspendedBy);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    logger.error({ error }, 'Unsuspend user error');
    res.status(500).json({ success: false, error: 'Failed to unsuspend user' });
  }
});

router.delete('/users/:userId', async (req, res) => {
  try {
    const { deletedBy } = req.body;
    const user = AdminOperationsService.deleteUser(req.params.userId, deletedBy);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    logger.error({ error }, 'Delete user error');
    res.status(500).json({ success: false, error: 'Failed to delete user' });
  }
});

router.get('/users/:userId/permissions/:permission', async (req, res) => {
  try {
    const hasPermission = AdminOperationsService.hasPermission(
      req.params.userId,
      req.params.permission as any
    );
    res.json({ success: true, hasPermission });
  } catch (error) {
    logger.error({ error }, 'Check permission error');
    res.status(500).json({ success: false, error: 'Failed to check permission' });
  }
});

// ========== Audit Logs ==========

router.get('/audit', async (req, res) => {
  try {
    const { userId, action, resource, startDate, endDate } = req.query;
    const logs = AdminOperationsService.getAuditLogs({
      userId: userId as string,
      action: action as string,
      resource: resource as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });
    res.json({ success: true, logs });
  } catch (error) {
    logger.error({ error }, 'Get audit logs error');
    res.status(500).json({ success: false, error: 'Failed to get audit logs' });
  }
});

// ========== System Operations ==========

router.post('/operations/:operation', async (req, res) => {
  try {
    const { userId, params } = req.body;
    const result = await AdminOperationsService.executeOperation(
      req.params.operation as any,
      userId,
      params
    );
    res.json({ success: result.success, result });
  } catch (error: any) {
    logger.error({ error }, 'Execute operation error');
    res.status(400).json({ success: false, error: error.message });
  }
});

// ========== Bulk Operations ==========

router.post('/bulk', async (req, res) => {
  try {
    const { type, resource, criteria, updates, createdBy } = req.body;
    const operation = AdminOperationsService.createBulkOperation(
      type,
      resource,
      criteria,
      updates,
      createdBy
    );
    res.status(202).json({ success: true, operation });
  } catch (error) {
    logger.error({ error }, 'Create bulk operation error');
    res.status(500).json({ success: false, error: 'Failed to create bulk operation' });
  }
});

router.get('/bulk/:operationId', async (req, res) => {
  try {
    const operation = AdminOperationsService.getBulkOperation(req.params.operationId);
    if (!operation) {
      return res.status(404).json({ success: false, error: 'Operation not found' });
    }
    res.json({ success: true, operation });
  } catch (error) {
    logger.error({ error }, 'Get bulk operation error');
    res.status(500).json({ success: false, error: 'Failed to get bulk operation' });
  }
});

router.get('/bulk', async (req, res) => {
  try {
    const { userId } = req.query;
    const operations = AdminOperationsService.listBulkOperations(userId as string);
    res.json({ success: true, operations });
  } catch (error) {
    logger.error({ error }, 'List bulk operations error');
    res.status(500).json({ success: false, error: 'Failed to list bulk operations' });
  }
});

// ========== Admin Statistics ==========

router.get('/admin/statistics', async (req, res) => {
  try {
    const stats = AdminOperationsService.getStatistics();
    res.json({ success: true, statistics: stats });
  } catch (error) {
    logger.error({ error }, 'Get admin statistics error');
    res.status(500).json({ success: false, error: 'Failed to get admin statistics' });
  }
});

// ========== External Service Connection Tests ==========

/**
 * Test Stripe connection
 */
router.get('/test-connection/stripe', async (req, res) => {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    
    if (!stripeSecretKey) {
      return res.json({
        success: false,
        connected: false,
        error: 'STRIPE_SECRET_KEY not configured',
        message: 'Stripe secret key is not set in environment variables'
      });
    }

    // Dynamic import to avoid issues if stripe isn't loaded
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-10-29.clover' as any,
    });

    // Test connection by retrieving account info
    const account = await stripe.accounts.retrieve();
    
    res.json({
      success: true,
      connected: true,
      message: 'Stripe connection successful',
      details: {
        accountId: account.id,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        country: account.country,
        defaultCurrency: account.default_currency,
        businessType: account.business_type,
      }
    });
  } catch (error: any) {
    logger.error({ error }, 'Stripe connection test failed');
    res.json({
      success: false,
      connected: false,
      error: error.message || 'Unknown error',
      message: 'Failed to connect to Stripe. Check your API key.'
    });
  }
});

/**
 * Test OpenAI connection
 */
router.get('/test-connection/openai', async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return res.json({
        success: false,
        connected: false,
        error: 'OPENAI_API_KEY not configured',
        message: 'OpenAI API key is not set in environment variables'
      });
    }

    // Test with a minimal API call
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      res.json({
        success: true,
        connected: true,
        message: 'OpenAI connection successful',
        details: {
          modelsAvailable: data.data?.length || 0,
        }
      });
    } else {
      const errorData = await response.json().catch(() => ({}));
      res.json({
        success: false,
        connected: false,
        error: errorData.error?.message || `HTTP ${response.status}`,
        message: 'Failed to connect to OpenAI'
      });
    }
  } catch (error: any) {
    logger.error({ error }, 'OpenAI connection test failed');
    res.json({
      success: false,
      connected: false,
      error: error.message || 'Unknown error',
      message: 'Failed to connect to OpenAI'
    });
  }
});

/**
 * Test Anthropic connection
 */
router.get('/test-connection/anthropic', async (req, res) => {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      return res.json({
        success: false,
        connected: false,
        error: 'ANTHROPIC_API_KEY not configured',
        message: 'Anthropic API key is not set in environment variables'
      });
    }

    // Test with a minimal API call
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'Hi' }],
      }),
    });

    if (response.ok || response.status === 400) {
      // 400 might be returned for rate limits or other issues, but it means auth worked
      res.json({
        success: true,
        connected: true,
        message: 'Anthropic connection successful',
        details: {
          status: response.status,
        }
      });
    } else if (response.status === 401) {
      res.json({
        success: false,
        connected: false,
        error: 'Invalid API key',
        message: 'Anthropic API key is invalid'
      });
    } else {
      res.json({
        success: false,
        connected: false,
        error: `HTTP ${response.status}`,
        message: 'Failed to connect to Anthropic'
      });
    }
  } catch (error: any) {
    logger.error({ error }, 'Anthropic connection test failed');
    res.json({
      success: false,
      connected: false,
      error: error.message || 'Unknown error',
      message: 'Failed to connect to Anthropic'
    });
  }
});

/**
 * Test Google OAuth configuration
 */
router.get('/test-connection/google-oauth', async (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  res.json({
    success: Boolean(clientId && clientSecret),
    connected: Boolean(clientId && clientSecret),
    message: clientId && clientSecret 
      ? 'Google OAuth is configured'
      : 'Google OAuth credentials are not configured',
    details: {
      clientIdConfigured: Boolean(clientId),
      clientSecretConfigured: Boolean(clientSecret),
    }
  });
});

/**
 * Get all service connection statuses
 */
router.get('/test-connection/all', async (req, res) => {
  const services = {
    stripe: Boolean(process.env.STRIPE_SECRET_KEY),
    openai: Boolean(process.env.OPENAI_API_KEY),
    anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
    googleOauth: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    redis: Boolean(process.env.REDIS_URL || process.env.REDIS_HOST),
    resend: Boolean(process.env.RESEND_API_KEY),
    database: Boolean(process.env.DATABASE_URL),
  };

  res.json({
    success: true,
    services,
    configured: Object.values(services).filter(Boolean).length,
    total: Object.keys(services).length,
  });
});

export default router;
