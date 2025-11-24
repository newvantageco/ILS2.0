/**
 * Integration Hub API Routes
 *
 * REST API endpoints for managing integrations, connectors, sync jobs,
 * healthcare interoperability, and monitoring
 */

import express, { Request, Response } from 'express';
import { authenticateUser } from '../middleware/auth.js';
import { IntegrationFramework } from '../services/integrations/IntegrationFramework.js';
import { ConnectorRegistry } from '../services/integrations/ConnectorRegistry.js';
import { DataSyncEngine } from '../services/integrations/DataSyncEngine.js';
import { HealthcareInterop } from '../services/integrations/HealthcareInterop.js';
import { IntegrationMonitoring } from '../services/integrations/IntegrationMonitoring.js';
import { loggers } from '../utils/logger.js';

const router = express.Router();
const logger = loggers.api;

// ========== Connector Registry ==========

/**
 * Get available connectors
 * GET /api/integrations/connectors
 */
router.get('/connectors', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { type, isAvailable, tag, search } = req.query;

    const connectors = search
      ? ConnectorRegistry.searchConnectors(search as string)
      : ConnectorRegistry.getConnectors({
          type: type as any,
          isAvailable: isAvailable === 'true',
          tag: tag as string,
        });

    res.json({
      success: true,
      connectors,
      count: connectors.length,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to get connectors');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get connectors',
    });
  }
});

/**
 * Get connector by ID
 * GET /api/integrations/connectors/:connectorId
 */
router.get('/connectors/:connectorId', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { connectorId } = req.params;

    const connector = ConnectorRegistry.getConnector(connectorId);

    if (!connector) {
      return res.status(404).json({
        success: false,
        error: 'Connector not found',
      });
    }

    res.json({
      success: true,
      connector,
    });
  } catch (error) {
    logger.error({ error, connectorId: req.params.connectorId }, 'Failed to get connector');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get connector',
    });
  }
});

/**
 * Get connector statistics
 * GET /api/integrations/connectors/stats
 */
router.get('/connectors-stats', authenticateUser, async (req: Request, res: Response) => {
  try {
    const stats = ConnectorRegistry.getConnectorStats();

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to get connector stats');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get stats',
    });
  }
});

// ========== Integration Management ==========

/**
 * Get all integrations
 * GET /api/integrations
 */
router.get('/', authenticateUser, async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user.companyId;
    const { type, status, provider } = req.query;

    const integrations = await IntegrationFramework.getIntegrations(companyId, {
      type: type as any,
      status: status as any,
      provider: provider as string,
    });

    res.json({
      success: true,
      integrations,
      count: integrations.length,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to get integrations');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get integrations',
    });
  }
});

/**
 * Get integration by ID
 * GET /api/integrations/:integrationId
 */
router.get('/:integrationId', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { integrationId } = req.params;

    const integration = await IntegrationFramework.getIntegration(integrationId);

    if (!integration) {
      return res.status(404).json({
        success: false,
        error: 'Integration not found',
      });
    }

    res.json({
      success: true,
      integration,
    });
  } catch (error) {
    logger.error({ error, integrationId: req.params.integrationId }, 'Failed to get integration');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get integration',
    });
  }
});

/**
 * Create integration
 * POST /api/integrations
 */
router.post('/', authenticateUser, async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user.companyId;
    const userId = (req as any).user.id;

    const integrationData = {
      ...req.body,
      companyId,
      createdBy: userId,
    };

    // Encrypt credentials
    if (integrationData.credentials) {
      const encryptedCreds = IntegrationFramework.encryptCredentials(
        integrationData.credentials
      );
      integrationData.credentials = { encrypted: encryptedCreds };
    }

    const integration = await IntegrationFramework.createIntegration(integrationData);

    res.status(201).json({
      success: true,
      integration,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to create integration');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create integration',
    });
  }
});

/**
 * Update integration
 * PUT /api/integrations/:integrationId
 */
router.put('/:integrationId', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { integrationId } = req.params;

    // Encrypt credentials if provided
    if (req.body.credentials) {
      const encryptedCreds = IntegrationFramework.encryptCredentials(req.body.credentials);
      req.body.credentials = { encrypted: encryptedCreds };
    }

    const integration = await IntegrationFramework.updateIntegration(
      integrationId,
      req.body
    );

    res.json({
      success: true,
      integration,
    });
  } catch (error) {
    logger.error({ error, integrationId: req.params.integrationId }, 'Failed to update integration');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update integration',
    });
  }
});

/**
 * Delete integration
 * DELETE /api/integrations/:integrationId
 */
router.delete('/:integrationId', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { integrationId } = req.params;

    const deleted = await IntegrationFramework.deleteIntegration(integrationId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Integration not found',
      });
    }

    res.json({
      success: true,
      message: 'Integration deleted successfully',
    });
  } catch (error) {
    logger.error({ error, integrationId: req.params.integrationId }, 'Failed to delete integration');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete integration',
    });
  }
});

/**
 * Test integration connection
 * POST /api/integrations/:integrationId/test
 */
router.post('/:integrationId/test', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { integrationId } = req.params;

    const result = await IntegrationFramework.testConnection(integrationId);

    res.json({
      success: result.success,
      result,
    });
  } catch (error) {
    logger.error({ error, integrationId: req.params.integrationId }, 'Failed to test connection');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to test connection',
    });
  }
});

/**
 * Pause integration
 * POST /api/integrations/:integrationId/pause
 */
router.post('/:integrationId/pause', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { integrationId } = req.params;

    await IntegrationFramework.pauseIntegration(integrationId);

    res.json({
      success: true,
      message: 'Integration paused successfully',
    });
  } catch (error) {
    logger.error({ error, integrationId: req.params.integrationId }, 'Failed to pause integration');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to pause integration',
    });
  }
});

/**
 * Resume integration
 * POST /api/integrations/:integrationId/resume
 */
router.post('/:integrationId/resume', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { integrationId } = req.params;

    await IntegrationFramework.resumeIntegration(integrationId);

    res.json({
      success: true,
      message: 'Integration resumed successfully',
    });
  } catch (error) {
    logger.error({ error, integrationId: req.params.integrationId }, 'Failed to resume integration');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to resume integration',
    });
  }
});

// ========== Sync Jobs ==========

/**
 * Start sync job
 * POST /api/integrations/:integrationId/sync
 */
router.post('/:integrationId/sync', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { integrationId } = req.params;
    const { entity } = req.body;
    const userId = (req as any).user.id;

    if (!entity) {
      return res.status(400).json({
        success: false,
        error: 'Entity is required',
      });
    }

    const job = await IntegrationFramework.startSync(
      integrationId,
      entity,
      'manual',
      userId
    );

    res.json({
      success: true,
      job,
    });
  } catch (error) {
    logger.error({ error, integrationId: req.params.integrationId }, 'Failed to start sync');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start sync',
    });
  }
});

/**
 * Get sync job status
 * GET /api/integrations/:integrationId/jobs/:jobId
 */
router.get('/:integrationId/jobs/:jobId', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    const job = await IntegrationFramework.getSyncJob(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Sync job not found',
      });
    }

    res.json({
      success: true,
      job,
    });
  } catch (error) {
    logger.error({ error, jobId: req.params.jobId }, 'Failed to get sync job');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get sync job',
    });
  }
});

/**
 * Get sync jobs for integration
 * GET /api/integrations/:integrationId/jobs
 */
router.get('/:integrationId/jobs', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { integrationId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const jobs = await IntegrationFramework.getSyncJobs(integrationId, limit);

    res.json({
      success: true,
      jobs,
      count: jobs.length,
    });
  } catch (error) {
    logger.error({ error, integrationId: req.params.integrationId }, 'Failed to get sync jobs');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get sync jobs',
    });
  }
});

/**
 * Get integration events
 * GET /api/integrations/:integrationId/events
 */
router.get('/:integrationId/events', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { integrationId } = req.params;
    const limit = parseInt(req.query.limit as string) || 100;

    const events = await IntegrationFramework.getEvents(integrationId, limit);

    res.json({
      success: true,
      events,
      count: events.length,
    });
  } catch (error) {
    logger.error({ error, integrationId: req.params.integrationId }, 'Failed to get events');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get events',
    });
  }
});

/**
 * Get integration statistics
 * GET /api/integrations/:integrationId/stats
 */
router.get('/:integrationId/stats', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { integrationId } = req.params;

    const stats = await IntegrationFramework.getIntegrationStats(integrationId);

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    logger.error({ error, integrationId: req.params.integrationId }, 'Failed to get stats');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get stats',
    });
  }
});

// ========== Healthcare Interoperability ==========

/**
 * Convert patient to FHIR
 * POST /api/integrations/fhir/patient
 */
router.post('/fhir/patient', authenticateUser, async (req: Request, res: Response) => {
  try {
    const fhirPatient = HealthcareInterop.toFHIRPatient(req.body);

    res.json({
      success: true,
      fhirPatient,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to convert to FHIR');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to convert to FHIR',
    });
  }
});

/**
 * Convert FHIR patient to local format
 * POST /api/integrations/fhir/patient/import
 */
router.post('/fhir/patient/import', authenticateUser, async (req: Request, res: Response) => {
  try {
    const patient = HealthcareInterop.fromFHIRPatient(req.body);

    res.json({
      success: true,
      patient,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to import FHIR patient');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to import FHIR patient',
    });
  }
});

/**
 * Create HL7 ADT message
 * POST /api/integrations/hl7/adt
 */
router.post('/hl7/adt', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { patient, eventType } = req.body;

    const hl7Message = HealthcareInterop.createHL7ADTMessage(patient, eventType);

    res.json({
      success: true,
      hl7Message,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to create HL7 message');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create HL7 message',
    });
  }
});

/**
 * Parse HL7 message
 * POST /api/integrations/hl7/parse
 */
router.post('/hl7/parse', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { message } = req.body;

    const patient = HealthcareInterop.extractPatientFromHL7(message);

    res.json({
      success: true,
      patient,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to parse HL7 message');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse HL7 message',
    });
  }
});

// ========== Monitoring ==========

/**
 * Get health check for integration
 * GET /api/integrations/:integrationId/health
 */
router.get('/:integrationId/health', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { integrationId } = req.params;

    const healthCheck = IntegrationMonitoring.getHealthCheck(integrationId);

    if (!healthCheck) {
      return res.status(404).json({
        success: false,
        error: 'Health check not found',
      });
    }

    res.json({
      success: true,
      healthCheck,
    });
  } catch (error) {
    logger.error({ error, integrationId: req.params.integrationId }, 'Failed to get health check');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get health check',
    });
  }
});

/**
 * Get alerts for integration
 * GET /api/integrations/:integrationId/alerts
 */
router.get('/:integrationId/alerts', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { integrationId } = req.params;
    const { severity, resolved } = req.query;

    const alerts = IntegrationMonitoring.getAlerts(integrationId, {
      severity: severity as any,
      resolved: resolved === 'true',
    });

    res.json({
      success: true,
      alerts,
      count: alerts.length,
    });
  } catch (error) {
    logger.error({ error, integrationId: req.params.integrationId }, 'Failed to get alerts');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get alerts',
    });
  }
});

/**
 * Acknowledge alert
 * POST /api/integrations/alerts/:alertId/acknowledge
 */
router.post('/alerts/:alertId/acknowledge', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { alertId } = req.params;
    const userId = (req as any).user.id;

    const alert = await IntegrationMonitoring.acknowledgeAlert(alertId, userId);

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found',
      });
    }

    res.json({
      success: true,
      alert,
    });
  } catch (error) {
    logger.error({ error, alertId: req.params.alertId }, 'Failed to acknowledge alert');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to acknowledge alert',
    });
  }
});

/**
 * Resolve alert
 * POST /api/integrations/alerts/:alertId/resolve
 */
router.post('/alerts/:alertId/resolve', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { alertId } = req.params;
    const userId = (req as any).user.id;

    const alert = await IntegrationMonitoring.resolveAlert(alertId, userId);

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found',
      });
    }

    res.json({
      success: true,
      alert,
    });
  } catch (error) {
    logger.error({ error, alertId: req.params.alertId }, 'Failed to resolve alert');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to resolve alert',
    });
  }
});

/**
 * Get monitoring dashboard
 * GET /api/integrations/monitoring/dashboard
 */
router.get('/monitoring/dashboard', authenticateUser, async (req: Request, res: Response) => {
  try {
    const dashboard = IntegrationMonitoring.getMonitoringDashboard();

    res.json({
      success: true,
      dashboard,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to get monitoring dashboard');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get dashboard',
    });
  }
});

export default router;
