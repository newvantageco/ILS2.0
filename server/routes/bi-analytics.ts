/**
 * Business Intelligence & Analytics API Routes
 *
 * Routes for analytics engine, dashboards, and KPI metrics
 */

import express from 'express';
import { loggers } from '../utils/logger';
import { AnalyticsEngineService } from '../services/analytics/AnalyticsEngineService';
import { DashboardService } from '../services/analytics/DashboardService';
import { KPIMetricsService } from '../services/analytics/KPIMetricsService';

const router = express.Router();
const logger = loggers.api;

// Initialize KPI Metrics on first load
KPIMetricsService.initialize().catch((error) => {
  logger.error({ error }, 'Failed to initialize KPI Metrics Service');
});

// ========== Metrics Routes ==========

/**
 * POST /api/analytics/metrics
 * Register new metric
 */
router.post('/metrics', async (req, res) => {
  try {
    const metric = await AnalyticsEngineService.registerMetric(req.body);
    res.status(201).json({ success: true, metric });
  } catch (error) {
    logger.error({ error }, 'Register metric error');
    res.status(500).json({ success: false, error: 'Failed to register metric' });
  }
});

/**
 * GET /api/analytics/metrics
 * List metrics
 */
router.get('/metrics', async (req, res) => {
  try {
    const { category } = req.query;
    const metrics = await AnalyticsEngineService.listMetrics(category as any);
    res.json({ success: true, metrics });
  } catch (error) {
    logger.error({ error }, 'List metrics error');
    res.status(500).json({ success: false, error: 'Failed to list metrics' });
  }
});

/**
 * GET /api/analytics/metrics/:metricId
 * Get metric value
 */
router.get('/metrics/:metricId', async (req, res) => {
  try {
    const { metricId } = req.params;
    const { period, startDate, endDate } = req.query;

    const value = await AnalyticsEngineService.getMetricValue(
      metricId,
      (period as any) || 'month',
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    if (!value) {
      return res.status(404).json({ success: false, error: 'Metric not found' });
    }

    res.json({ success: true, value });
  } catch (error) {
    logger.error({ error }, 'Get metric value error');
    res.status(500).json({ success: false, error: 'Failed to get metric value' });
  }
});

/**
 * GET /api/analytics/metrics/:metricId/timeseries
 * Get metric time series
 */
router.get('/metrics/:metricId/timeseries', async (req, res) => {
  try {
    const { metricId } = req.params;
    const { period, granularity, startDate, endDate } = req.query;

    const timeseries = await AnalyticsEngineService.getMetricTimeSeries(
      metricId,
      (period as any) || 'month',
      (granularity as any) || 'day',
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.json({ success: true, timeseries });
  } catch (error) {
    logger.error({ error }, 'Get timeseries error');
    res.status(500).json({ success: false, error: 'Failed to get timeseries' });
  }
});

/**
 * POST /api/analytics/query
 * Execute analytics query
 */
router.post('/query', async (req, res) => {
  try {
    const result = await AnalyticsEngineService.executeQuery(req.body);
    res.json({ success: true, result });
  } catch (error) {
    logger.error({ error }, 'Execute query error');
    res.status(500).json({ success: false, error: 'Failed to execute query' });
  }
});

// ========== Dashboard Routes ==========

/**
 * POST /api/analytics/dashboards
 * Create dashboard
 */
router.post('/dashboards', async (req, res) => {
  try {
    const { name, category, description, isPublic, layout, theme } = req.body;
    const ownerId = (req as any).user?.id || 'system';

    const dashboard = await DashboardService.createDashboard(name, ownerId, category, {
      description,
      isPublic,
      layout,
      theme,
    });

    res.status(201).json({ success: true, dashboard });
  } catch (error) {
    logger.error({ error }, 'Create dashboard error');
    res.status(500).json({ success: false, error: 'Failed to create dashboard' });
  }
});

/**
 * GET /api/analytics/dashboards
 * List dashboards
 */
router.get('/dashboards', async (req, res) => {
  try {
    const userId = (req as any).user?.id || 'system';
    const { category } = req.query;

    const dashboards = await DashboardService.listDashboards(userId, category as any);
    res.json({ success: true, dashboards });
  } catch (error) {
    logger.error({ error }, 'List dashboards error');
    res.status(500).json({ success: false, error: 'Failed to list dashboards' });
  }
});

/**
 * GET /api/analytics/dashboards/:dashboardId
 * Get dashboard
 */
router.get('/dashboards/:dashboardId', async (req, res) => {
  try {
    const { dashboardId } = req.params;
    const dashboard = await DashboardService.getDashboard(dashboardId);

    if (!dashboard) {
      return res.status(404).json({ success: false, error: 'Dashboard not found' });
    }

    const widgets = await DashboardService.getDashboardWidgets(dashboardId);

    res.json({ success: true, dashboard, widgets });
  } catch (error) {
    logger.error({ error }, 'Get dashboard error');
    res.status(500).json({ success: false, error: 'Failed to get dashboard' });
  }
});

/**
 * PUT /api/analytics/dashboards/:dashboardId
 * Update dashboard
 */
router.put('/dashboards/:dashboardId', async (req, res) => {
  try {
    const { dashboardId } = req.params;
    const dashboard = await DashboardService.updateDashboard(dashboardId, req.body);

    if (!dashboard) {
      return res.status(404).json({ success: false, error: 'Dashboard not found' });
    }

    res.json({ success: true, dashboard });
  } catch (error) {
    logger.error({ error }, 'Update dashboard error');
    res.status(500).json({ success: false, error: 'Failed to update dashboard' });
  }
});

/**
 * DELETE /api/analytics/dashboards/:dashboardId
 * Delete dashboard
 */
router.delete('/dashboards/:dashboardId', async (req, res) => {
  try {
    const { dashboardId } = req.params;
    const deleted = await DashboardService.deleteDashboard(dashboardId);

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Dashboard not found' });
    }

    res.json({ success: true, message: 'Dashboard deleted' });
  } catch (error) {
    logger.error({ error }, 'Delete dashboard error');
    res.status(500).json({ success: false, error: 'Failed to delete dashboard' });
  }
});

/**
 * POST /api/analytics/dashboards/:dashboardId/widgets
 * Add widget to dashboard
 */
router.post('/dashboards/:dashboardId/widgets', async (req, res) => {
  try {
    const { dashboardId } = req.params;
    const widget = await DashboardService.addWidget(dashboardId, req.body);

    if (!widget) {
      return res.status(404).json({ success: false, error: 'Dashboard not found' });
    }

    res.status(201).json({ success: true, widget });
  } catch (error) {
    logger.error({ error }, 'Add widget error');
    res.status(500).json({ success: false, error: 'Failed to add widget' });
  }
});

/**
 * PUT /api/analytics/dashboards/:dashboardId/widgets/:widgetId
 * Update widget
 */
router.put('/dashboards/:dashboardId/widgets/:widgetId', async (req, res) => {
  try {
    const { widgetId } = req.params;
    const widget = await DashboardService.updateWidget(widgetId, req.body);

    if (!widget) {
      return res.status(404).json({ success: false, error: 'Widget not found' });
    }

    res.json({ success: true, widget });
  } catch (error) {
    logger.error({ error }, 'Update widget error');
    res.status(500).json({ success: false, error: 'Failed to update widget' });
  }
});

/**
 * DELETE /api/analytics/dashboards/:dashboardId/widgets/:widgetId
 * Delete widget
 */
router.delete('/dashboards/:dashboardId/widgets/:widgetId', async (req, res) => {
  try {
    const { widgetId } = req.params;
    const deleted = await DashboardService.deleteWidget(widgetId);

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Widget not found' });
    }

    res.json({ success: true, message: 'Widget deleted' });
  } catch (error) {
    logger.error({ error }, 'Delete widget error');
    res.status(500).json({ success: false, error: 'Failed to delete widget' });
  }
});

/**
 * POST /api/analytics/dashboards/:dashboardId/refresh
 * Refresh dashboard data
 */
router.post('/dashboards/:dashboardId/refresh', async (req, res) => {
  try {
    const { dashboardId } = req.params;
    const dashboard = await DashboardService.refreshDashboard(dashboardId);

    if (!dashboard) {
      return res.status(404).json({ success: false, error: 'Dashboard not found' });
    }

    res.json({ success: true, dashboard });
  } catch (error) {
    logger.error({ error }, 'Refresh dashboard error');
    res.status(500).json({ success: false, error: 'Failed to refresh dashboard' });
  }
});

/**
 * GET /api/analytics/dashboards/templates
 * List dashboard templates
 */
router.get('/templates', async (req, res) => {
  try {
    const templates = await DashboardService.listTemplates();
    res.json({ success: true, templates });
  } catch (error) {
    logger.error({ error }, 'List templates error');
    res.status(500).json({ success: false, error: 'Failed to list templates' });
  }
});

/**
 * POST /api/analytics/dashboards/from-template
 * Create dashboard from template
 */
router.post('/dashboards/from-template', async (req, res) => {
  try {
    const { templateId, name } = req.body;
    const ownerId = (req as any).user?.id || 'system';

    const dashboard = await DashboardService.createFromTemplate(templateId, name, ownerId);

    if (!dashboard) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }

    res.status(201).json({ success: true, dashboard });
  } catch (error) {
    logger.error({ error }, 'Create from template error');
    res.status(500).json({ success: false, error: 'Failed to create dashboard from template' });
  }
});

// ========== KPI Routes ==========

/**
 * GET /api/analytics/kpis
 * Get all KPIs
 */
router.get('/kpis', async (req, res) => {
  try {
    const kpis = await KPIMetricsService.getAllKPIs();
    res.json({ success: true, kpis });
  } catch (error) {
    logger.error({ error }, 'Get KPIs error');
    res.status(500).json({ success: false, error: 'Failed to get KPIs' });
  }
});

/**
 * GET /api/analytics/kpis/category/:category
 * Get KPIs by category
 */
router.get('/kpis/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const group = await KPIMetricsService.getKPIsByCategory(category as any);
    res.json({ success: true, group });
  } catch (error) {
    logger.error({ error }, 'Get KPIs by category error');
    res.status(500).json({ success: false, error: 'Failed to get KPIs by category' });
  }
});

/**
 * GET /api/analytics/kpis/scorecard
 * Get KPI scorecard
 */
router.get('/kpis/scorecard', async (req, res) => {
  try {
    const scorecard = await KPIMetricsService.getScorecard();
    res.json({ success: true, scorecard });
  } catch (error) {
    logger.error({ error }, 'Get scorecard error');
    res.status(500).json({ success: false, error: 'Failed to get scorecard' });
  }
});

/**
 * GET /api/analytics/kpis/:metricId
 * Get specific KPI
 */
router.get('/kpis/:metricId', async (req, res) => {
  try {
    const { metricId } = req.params;
    const kpi = await KPIMetricsService.getKPI(metricId);

    if (!kpi) {
      return res.status(404).json({ success: false, error: 'KPI not found' });
    }

    res.json({ success: true, kpi });
  } catch (error) {
    logger.error({ error }, 'Get KPI error');
    res.status(500).json({ success: false, error: 'Failed to get KPI' });
  }
});

/**
 * PUT /api/analytics/kpis/:metricId/target
 * Set KPI target
 */
router.put('/kpis/:metricId/target', async (req, res) => {
  try {
    const { metricId } = req.params;
    await KPIMetricsService.setTarget(metricId, req.body);
    res.json({ success: true, message: 'Target set successfully' });
  } catch (error) {
    logger.error({ error }, 'Set KPI target error');
    res.status(500).json({ success: false, error: 'Failed to set target' });
  }
});

export default router;
