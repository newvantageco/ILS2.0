/**
 * Clinical Reporting API Routes
 *
 * REST API endpoints for clinical features including:
 * - Clinical Decision Support
 * - Report Builder
 * - Trend Analysis
 * - Quality Metrics
 */

import express, { Request, Response } from 'express';
import { isAuthenticated } from '../middleware/auth.js';
import { ClinicalDecisionSupport } from '../services/clinical/ClinicalDecisionSupport.js';
import { ReportBuilderService } from '../services/reporting/ReportBuilderService.js';
import { TrendAnalysisService } from '../services/reporting/TrendAnalysisService.js';
import { QualityMetricsService } from '../services/reporting/QualityMetricsService.js';
import { loggers } from '../utils/logger.js';

const router = express.Router();
const logger = loggers.api;

// ========== Clinical Decision Support ==========

/**
 * Evaluate patient against clinical rules
 * GET /api/clinical-reporting/cds/evaluate/:patientId
 */
router.get('/cds/evaluate/:patientId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;

    const alerts = await ClinicalDecisionSupport.evaluatePatient(patientId);

    res.json({
      success: true,
      patientId,
      alerts,
      summary: {
        total: alerts.length,
        bySeverity: {
          critical: alerts.filter((a) => a.severity === 'critical').length,
          high: alerts.filter((a) => a.severity === 'high').length,
          medium: alerts.filter((a) => a.severity === 'medium').length,
          low: alerts.filter((a) => a.severity === 'low').length,
          info: alerts.filter((a) => a.severity === 'info').length,
        },
        actionRequired: alerts.filter((a) => a.actionRequired).length,
      },
    });
  } catch (error) {
    logger.error({ error, patientId: req.params.patientId }, 'Failed to evaluate patient');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to evaluate patient',
    });
  }
});

/**
 * Get alerts for a patient
 * GET /api/clinical-reporting/cds/alerts/:patientId
 */
router.get('/cds/alerts/:patientId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const { status } = req.query;

    const alerts = await ClinicalDecisionSupport.getPatientAlerts(
      patientId,
      status as any
    );

    res.json({
      success: true,
      patientId,
      alerts,
      count: alerts.length,
    });
  } catch (error) {
    logger.error({ error, patientId: req.params.patientId }, 'Failed to get alerts');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get alerts',
    });
  }
});

/**
 * Acknowledge an alert
 * POST /api/clinical-reporting/cds/alerts/:alertId/acknowledge
 */
router.post(
  '/cds/alerts/:alertId/acknowledge',
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const { alertId } = req.params;
      const userId = (req as any).user.id;

      const alert = await ClinicalDecisionSupport.acknowledgeAlert(alertId, userId);

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
  }
);

/**
 * Resolve an alert
 * POST /api/clinical-reporting/cds/alerts/:alertId/resolve
 */
router.post(
  '/cds/alerts/:alertId/resolve',
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const { alertId } = req.params;
      const userId = (req as any).user.id;

      const alert = await ClinicalDecisionSupport.resolveAlert(alertId, userId);

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
  }
);

/**
 * Dismiss an alert
 * POST /api/clinical-reporting/cds/alerts/:alertId/dismiss
 */
router.post(
  '/cds/alerts/:alertId/dismiss',
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const { alertId } = req.params;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({
          success: false,
          error: 'Dismissal reason is required',
        });
      }

      const alert = await ClinicalDecisionSupport.dismissAlert(alertId, reason);

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
      logger.error({ error, alertId: req.params.alertId }, 'Failed to dismiss alert');
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to dismiss alert',
      });
    }
  }
);

/**
 * Get alert statistics
 * GET /api/clinical-reporting/cds/stats
 */
router.get('/cds/stats', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user.companyId;

    const stats = await ClinicalDecisionSupport.getAlertStatistics(companyId);

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to get alert statistics');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get statistics',
    });
  }
});

/**
 * Get clinical rules
 * GET /api/clinical-reporting/cds/rules
 */
router.get('/cds/rules', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { category } = req.query;

    const rules = await ClinicalDecisionSupport.getActiveRules(category as any);

    res.json({
      success: true,
      rules,
      count: rules.length,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to get clinical rules');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get rules',
    });
  }
});

// ========== Report Builder ==========

/**
 * Get all reports
 * GET /api/clinical-reporting/reports
 */
router.get('/reports', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user.companyId;
    const { category } = req.query;

    const reports = category
      ? await ReportBuilderService.getReportsByCategory(companyId, category as any)
      : await ReportBuilderService.getReports(companyId);

    res.json({
      success: true,
      reports,
      count: reports.length,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to get reports');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get reports',
    });
  }
});

/**
 * Get report by ID
 * GET /api/clinical-reporting/reports/:reportId
 */
router.get('/reports/:reportId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;

    const report = await ReportBuilderService.getReport(reportId);

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found',
      });
    }

    res.json({
      success: true,
      report,
    });
  } catch (error) {
    logger.error({ error, reportId: req.params.reportId }, 'Failed to get report');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get report',
    });
  }
});

/**
 * Generate report
 * POST /api/clinical-reporting/reports/:reportId/generate
 */
router.post(
  '/reports/:reportId/generate',
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const { reportId } = req.params;
      const { parameters, format } = req.body;

      const result = await ReportBuilderService.generateReport(
        reportId,
        parameters,
        format
      );

      res.json({
        success: true,
        result,
      });
    } catch (error) {
      logger.error({ error, reportId: req.params.reportId }, 'Failed to generate report');
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate report',
      });
    }
  }
);

/**
 * Get report result
 * GET /api/clinical-reporting/reports/results/:resultId
 */
router.get('/reports/results/:resultId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { resultId } = req.params;

    const result = await ReportBuilderService.getReportResult(resultId);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Report result not found',
      });
    }

    res.json({
      success: true,
      result,
    });
  } catch (error) {
    logger.error({ error, resultId: req.params.resultId }, 'Failed to get report result');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get result',
    });
  }
});

/**
 * Get report history
 * GET /api/clinical-reporting/reports/:reportId/history
 */
router.get('/reports/:reportId/history', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const history = await ReportBuilderService.getReportHistory(reportId, limit);

    res.json({
      success: true,
      reportId,
      history,
      count: history.length,
    });
  } catch (error) {
    logger.error({ error, reportId: req.params.reportId }, 'Failed to get report history');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get history',
    });
  }
});

/**
 * Create custom report
 * POST /api/clinical-reporting/reports
 */
router.post('/reports', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user.companyId;
    const userId = (req as any).user.id;

    const reportData = {
      ...req.body,
      companyId,
      createdBy: userId,
      isPublic: false,
    };

    const report = await ReportBuilderService.createReport(reportData);

    res.status(201).json({
      success: true,
      report,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to create report');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create report',
    });
  }
});

/**
 * Export report to CSV
 * POST /api/clinical-reporting/reports/:reportId/export/csv
 */
router.post(
  '/reports/:reportId/export/csv',
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const { reportId } = req.params;
      const { parameters } = req.body;

      // Generate report
      const result = await ReportBuilderService.generateReport(
        reportId,
        parameters,
        'json'
      );

      const report = await ReportBuilderService.getReport(reportId);

      if (!report) {
        return res.status(404).json({
          success: false,
          error: 'Report not found',
        });
      }

      // Export to CSV
      const csv = ReportBuilderService.exportToCSV(result.data, report.fields);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${report.name.replace(/\s+/g, '_')}.csv"`
      );
      res.send(csv);
    } catch (error) {
      logger.error({ error, reportId: req.params.reportId }, 'Failed to export report');
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to export report',
      });
    }
  }
);

// ========== Trend Analysis ==========

/**
 * Get visit trends
 * GET /api/clinical-reporting/trends/visits
 */
router.get('/trends/visits', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user.companyId;
    const { startDate, endDate, period = 'monthly' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate are required',
      });
    }

    const trends = await TrendAnalysisService.analyzeVisitTrends(
      companyId,
      new Date(startDate as string),
      new Date(endDate as string),
      period as any
    );

    res.json({
      success: true,
      trends,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to analyze visit trends');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze trends',
    });
  }
});

/**
 * Get age distribution trends
 * GET /api/clinical-reporting/trends/age-distribution
 */
router.get('/trends/age-distribution', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user.companyId;

    const trends = await TrendAnalysisService.analyzeAgeTrends(companyId);

    res.json({
      success: true,
      trends,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to analyze age distribution');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze age distribution',
    });
  }
});

/**
 * Get revenue trends
 * GET /api/clinical-reporting/trends/revenue
 */
router.get('/trends/revenue', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user.companyId;
    const { startDate, endDate, period = 'monthly' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate are required',
      });
    }

    const trends = await TrendAnalysisService.analyzeRevenueTrends(
      companyId,
      new Date(startDate as string),
      new Date(endDate as string),
      period as any
    );

    res.json({
      success: true,
      trends,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to analyze revenue trends');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze revenue trends',
    });
  }
});

/**
 * Get patient retention analysis
 * GET /api/clinical-reporting/trends/retention
 */
router.get('/trends/retention', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user.companyId;
    const months = parseInt(req.query.months as string) || 12;

    const cohorts = await TrendAnalysisService.analyzePatientRetention(companyId, months);

    res.json({
      success: true,
      cohorts,
      count: cohorts.length,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to analyze patient retention');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze retention',
    });
  }
});

// ========== Quality Metrics ==========

/**
 * Get all quality metrics
 * GET /api/clinical-reporting/quality/metrics
 */
router.get('/quality/metrics', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { category } = req.query;

    const metrics = await QualityMetricsService.getAllMetrics(category as any);

    res.json({
      success: true,
      metrics,
      count: metrics.length,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to get quality metrics');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get metrics',
    });
  }
});

/**
 * Get quality dashboard
 * GET /api/clinical-reporting/quality/dashboard
 */
router.get('/quality/dashboard', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user.companyId;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate are required',
      });
    }

    const dashboard = await QualityMetricsService.getQualityDashboard(
      companyId,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.json({
      success: true,
      dashboard,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to get quality dashboard');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get dashboard',
    });
  }
});

/**
 * Calculate all metrics
 * POST /api/clinical-reporting/quality/calculate
 */
router.post('/quality/calculate', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user.companyId;
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate are required',
      });
    }

    const results = await QualityMetricsService.calculateAllMetrics(
      companyId,
      new Date(startDate),
      new Date(endDate)
    );

    res.json({
      success: true,
      results,
      count: results.length,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to calculate metrics');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate metrics',
    });
  }
});

/**
 * Get metric history
 * GET /api/clinical-reporting/quality/metrics/:metricId/history
 */
router.get(
  '/quality/metrics/:metricId/history',
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const { metricId } = req.params;
      const limit = parseInt(req.query.limit as string) || 12;

      const history = await QualityMetricsService.getMetricHistory(metricId, limit);

      res.json({
        success: true,
        metricId,
        history,
        count: history.length,
      });
    } catch (error) {
      logger.error({ error, metricId: req.params.metricId }, 'Failed to get metric history');
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get history',
      });
    }
  }
);

export default router;
