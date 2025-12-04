/**
 * Domain Route Registry
 *
 * Central registry for all domain-based routes.
 * Provides a clean API for registering routes with the Express app.
 *
 * Usage:
 * ```typescript
 * import { registerDomainRoutes } from './routes/domains';
 * registerDomainRoutes(app);
 * ```
 *
 * @module routes/domains
 */

import type { Express, RequestHandler } from 'express';
import { createLogger } from '../../utils/logger';

// Domain route imports
import aiRoutes from './ai';
import authRoutes, { registerGoogleAuthRoutes } from './auth';
import adminRoutes, { registerPermissionRoutes, registerAdminRoutes } from './admin';
import clinicalRoutes from './clinical';
import billingRoutes, { registerPaymentRoutes } from './billing';
import analyticsRoutes, { registerBiRoutes, registerSaaSRoutes, pythonAnalyticsRoutes } from './analytics';
import healthcareRoutes from './healthcare';
import integrationsRoutes, { shopifyWebhookRoutes } from './integrations';
import systemRoutes from './system';
import onboardingRoutes from '../onboarding';

// Middleware imports
import { secureRoute } from '../../middleware/secureRoute';
import { deprecateAIRoute } from '../../middleware/deprecation';

const logger = createLogger('RouteRegistry');

/**
 * Route domain configuration
 */
interface DomainConfig {
  path: string;
  router: any;
  middleware?: RequestHandler[];
  description?: string;
}

/**
 * Domain routes configuration
 */
const domainRoutes: DomainConfig[] = [
  {
    path: '/api/ai',
    router: aiRoutes,
    middleware: [...secureRoute()],
    description: 'Unified AI services',
  },
  {
    path: '/api/auth',
    router: authRoutes,
    description: 'Authentication services',
  },
  {
    path: '/api/onboarding',
    router: onboardingRoutes,
    description: 'User onboarding and signup',
  },
  {
    path: '/api/admin',
    router: adminRoutes,
    description: 'Administration services',
  },
  {
    path: '/api/clinical',
    router: clinicalRoutes,
    description: 'Clinical practice management',
  },
  {
    path: '/api/billing',
    router: billingRoutes,
    description: 'Billing and payments',
  },
  {
    path: '/api/analytics',
    router: analyticsRoutes,
    description: 'Analytics and reporting',
  },
  {
    path: '/api/healthcare',
    router: healthcareRoutes,
    description: 'Healthcare platform',
  },
  {
    path: '/api/integrations',
    router: integrationsRoutes,
    description: 'External integrations',
  },
  {
    path: '/api/system',
    router: systemRoutes,
    description: 'System administration',
  },
];

/**
 * Register all domain routes with the Express app
 *
 * @param app - Express application instance
 */
export function registerDomainRoutes(app: Express): void {
  logger.info('Registering domain routes...');

  // Register main domain routes
  for (const config of domainRoutes) {
    if (config.middleware && config.middleware.length > 0) {
      app.use(config.path, ...config.middleware, config.router);
    } else {
      app.use(config.path, config.router);
    }
    logger.debug({ path: config.path }, `Registered: ${config.description || config.path}`);
  }

  // Register routes that need app instance
  registerGoogleAuthRoutes(app);
  registerPermissionRoutes(app);
  registerAdminRoutes(app);
  registerPaymentRoutes(app);
  registerBiRoutes(app);
  registerSaaSRoutes(app);

  // Python analytics (different path structure)
  app.use(pythonAnalyticsRoutes);

  // Shopify webhooks (special rate limiting)
  // Note: This should be registered with webhookLimiter middleware

  logger.info(`Registered ${domainRoutes.length} domain route groups`);
}

/**
 * Register deprecated AI routes for backward compatibility
 *
 * @param app - Express application instance
 */
export function registerLegacyAIRoutes(app: Express): void {
  // Legacy AI routes with deprecation warnings
  // These will be removed in a future release

  // Import legacy routes
  const masterAIRoutes = require('../master-ai').registerMasterAIRoutes;
  const platformAIRoutes = require('../platform-ai').default;
  const aiNotificationRoutes = require('../ai-notifications').registerAINotificationRoutes;
  const aiPurchaseOrderRoutes = require('../ai-purchase-orders').registerAutonomousPORoutes;
  const demandForecastingRoutes = require('../demand-forecasting').registerDemandForecastingRoutes;
  const aiMLRoutes = require('../ai-ml').default;
  const ophthalamicAIRoutes = require('../ophthalamicAI').default;

  // Register with deprecation middleware
  app.use('/api/master-ai', deprecateAIRoute('/api/master-ai', '/api/ai'));
  masterAIRoutes(app);

  app.use('/api/platform-ai',
    deprecateAIRoute('/api/platform-ai', '/api/ai'),
    ...secureRoute(),
    platformAIRoutes
  );

  app.use('/api/ai-notifications', deprecateAIRoute('/api/ai-notifications', '/api/ai/briefing'));
  aiNotificationRoutes(app);

  app.use('/api/ai-purchase-orders', deprecateAIRoute('/api/ai-purchase-orders', '/api/ai/actions'));
  aiPurchaseOrderRoutes(app);

  app.use('/api/demand-forecasting', deprecateAIRoute('/api/demand-forecasting', '/api/ai/predictions/demand'));
  demandForecastingRoutes(app);

  app.use('/api/ai-ml',
    deprecateAIRoute('/api/ai-ml', '/api/ai/clinical'),
    ...secureRoute(),
    aiMLRoutes
  );

  app.use('/api/ophthalmic-ai',
    deprecateAIRoute('/api/ophthalmic-ai', '/api/ai/chat'),
    ...secureRoute(),
    ophthalamicAIRoutes
  );

  logger.info('Registered legacy AI routes with deprecation warnings');
}

// Export individual domain routers for custom mounting
export {
  aiRoutes,
  authRoutes,
  adminRoutes,
  clinicalRoutes,
  billingRoutes,
  analyticsRoutes,
  healthcareRoutes,
  integrationsRoutes,
  systemRoutes,
};

// Export webhook routes for special handling
export { shopifyWebhookRoutes };
