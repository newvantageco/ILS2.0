/**
 * Healthcare Analytics API Routes
 * 
 * Comprehensive REST API for healthcare analytics including:
 * - Clinical outcome tracking and analysis
 * - Population health metrics and insights
 * - Quality reporting and compliance monitoring
 * - Predictive analytics and trend analysis
 * - Performance dashboards and KPI tracking
 * - Financial analytics and revenue insights
 * - Operational efficiency metrics
 * - Patient satisfaction and engagement analytics
 */

import { Router, Request, Response } from "express";
import { z } from "zod";
import { healthcareAnalyticsService } from "../services/HealthcareAnalyticsService";
import logger from "../utils/logger";

const router = Router();

// Authentication middleware (assumed to be applied at router level)
const requireAuth = (req: Request, res: Response, next: any) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};

const requireCompanyAccess = (req: Request, res: Response, next: any) => {
  if (!req.user?.companyId) {
    return res.status(403).json({ error: "Company context required" });
  }
  next();
};

// Helper functions for type safety
const getCompanyId = (req: Request): string => {
  if (!req.user?.companyId) {
    throw new Error('Company context required');
  }
  return req.user.companyId;
};

const getUserId = (req: Request): string => {
  if (!req.user?.id) {
    throw new Error('User context required');
  }
  return req.user.id;
};

// Validation schemas
const dateRangeSchema = z.object({
  dateFrom: z.coerce.date(),
  dateTo: z.coerce.date()
});

const clinicalOutcomeMetricsSchema = z.object({
  dateRange: dateRangeSchema,
  providerId: z.string().optional(),
  departmentId: z.string().optional(),
  patientDemographics: z.object({
    ageRange: z.object({
      min: z.number(),
      max: z.number()
    }).optional(),
    gender: z.string().optional(),
    conditions: z.array(z.string()).optional()
  }).optional()
});

const populationHealthMetricsSchema = z.object({
  dateRange: dateRangeSchema,
  metrics: z.array(z.object({
    type: z.enum(['chronic_disease', 'preventive_care', 'readmission', 'medication_adherence', 'vaccination_rate']),
    parameters: z.any().optional()
  }))
});

const qualityReportingMetricsSchema = z.object({
  reportingPeriod: dateRangeSchema,
  qualityMeasures: z.array(z.object({
    measureId: z.string(),
    measureType: z.enum(['clinical_process', 'outcome', 'patient_experience', 'efficiency']),
    parameters: z.any().optional()
  }))
});

const predictiveAnalyticsSchema = z.object({
  modelType: z.enum(['no_show_prediction', 'readmission_risk', 'disease_progression', 'revenue_forecast']),
  predictionPeriod: dateRangeSchema,
  features: z.array(z.string()).optional()
});

const dashboardDataSchema = z.object({
  dateRange: dateRangeSchema,
  dashboardType: z.enum(['executive', 'clinical', 'financial', 'operational']).default('executive')
});

// ========== CLINICAL OUTCOMES ANALYTICS ==========

/**
 * Get clinical outcome metrics
 */
router.post('/clinical-outcomes', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const validated = clinicalOutcomeMetricsSchema.parse(req.body);
    
    const metrics = await healthcareAnalyticsService.getClinicalOutcomeMetrics({
      companyId: getCompanyId(req),
      ...validated
    });

    res.json({
      success: true,
      metrics
    });
  } catch (error) {
    logger.error({ error, body: req.body }, 'Failed to get clinical outcome metrics');
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to get clinical outcome metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ========== POPULATION HEALTH ANALYTICS ==========

/**
 * Get population health metrics
 */
router.post('/population-health', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const validated = populationHealthMetricsSchema.parse(req.body);
    
    const metrics = await healthcareAnalyticsService.getPopulationHealthMetrics({
      companyId: getCompanyId(req),
      ...validated
    });

    res.json({
      success: true,
      metrics
    });
  } catch (error) {
    logger.error({ error, body: req.body }, 'Failed to get population health metrics');
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to get population health metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ========== QUALITY REPORTING ANALYTICS ==========

/**
 * Get quality reporting metrics
 */
router.post('/quality-reporting', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const validated = qualityReportingMetricsSchema.parse(req.body);
    
    const metrics = await healthcareAnalyticsService.getQualityReportingMetrics({
      companyId: getCompanyId(req),
      ...validated
    });

    res.json({
      success: true,
      metrics
    });
  } catch (error) {
    logger.error({ error, body: req.body }, 'Failed to get quality reporting metrics');
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to get quality reporting metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ========== PREDICTIVE ANALYTICS ==========

/**
 * Get predictive analytics
 */
router.post('/predictive-analytics', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const validated = predictiveAnalyticsSchema.parse(req.body);
    
    const predictions = await healthcareAnalyticsService.getPredictiveAnalytics({
      companyId: getCompanyId(req),
      ...validated
    });

    res.json({
      success: true,
      predictions
    });
  } catch (error) {
    logger.error({ error, body: req.body }, 'Failed to get predictive analytics');
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to get predictive analytics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ========== FINANCIAL ANALYTICS ==========

/**
 * Get financial analytics
 */
router.post('/financial', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const validated = dateRangeSchema.parse(req.body);
    
    const analytics = await healthcareAnalyticsService.getFinancialAnalytics(
      getCompanyId(req),
      validated
    );

    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    logger.error({ error, body: req.body }, 'Failed to get financial analytics');
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to get financial analytics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ========== OPERATIONAL EFFICIENCY ANALYTICS ==========

/**
 * Get operational efficiency metrics
 */
router.post('/operational-efficiency', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const validated = dateRangeSchema.parse(req.body);
    
    const metrics = await healthcareAnalyticsService.getOperationalEfficiencyMetrics(
      getCompanyId(req),
      validated
    );

    res.json({
      success: true,
      metrics
    });
  } catch (error) {
    logger.error({ error, body: req.body }, 'Failed to get operational efficiency metrics');
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to get operational efficiency metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ========== DASHBOARD DATA ==========

/**
 * Get comprehensive dashboard data
 */
router.post('/dashboard', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const validated = dashboardDataSchema.parse(req.body);
    
    const dashboardData = await healthcareAnalyticsService.getDashboardData(
      getCompanyId(req),
      validated.dateRange,
      validated.dashboardType
    );

    res.json({
      success: true,
      dashboardData
    });
  } catch (error) {
    logger.error({ error, body: req.body }, 'Failed to get dashboard data');
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to get dashboard data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ========== QUICK ANALYTICS ENDPOINTS ==========

/**
 * Get executive overview (quick summary)
 */
router.get('/executive-overview', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const { 
      dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      dateTo = new Date().toISOString()
    } = req.query;

    const dateRange = {
      dateFrom: new Date(dateFrom as string),
      dateTo: new Date(dateTo as string)
    };

    const overview = await healthcareAnalyticsService.getDashboardData(
      getCompanyId(req),
      dateRange,
      'executive'
    );

    res.json({
      success: true,
      overview
    });
  } catch (error) {
    logger.error({ error, query: req.query }, 'Failed to get executive overview');
    res.status(500).json({ 
      error: 'Failed to get executive overview',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get clinical dashboard
 */
router.get('/clinical-dashboard', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const { 
      dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      dateTo = new Date().toISOString()
    } = req.query;

    const dateRange = {
      dateFrom: new Date(dateFrom as string),
      dateTo: new Date(dateTo as string)
    };

    const dashboard = await healthcareAnalyticsService.getDashboardData(
      getCompanyId(req),
      dateRange,
      'clinical'
    );

    res.json({
      success: true,
      dashboard
    });
  } catch (error) {
    logger.error({ error, query: req.query }, 'Failed to get clinical dashboard');
    res.status(500).json({ 
      error: 'Failed to get clinical dashboard',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get financial dashboard
 */
router.get('/financial-dashboard', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const { 
      dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      dateTo = new Date().toISOString()
    } = req.query;

    const dateRange = {
      dateFrom: new Date(dateFrom as string),
      dateTo: new Date(dateTo as string)
    };

    const dashboard = await healthcareAnalyticsService.getDashboardData(
      getCompanyId(req),
      dateRange,
      'financial'
    );

    res.json({
      success: true,
      dashboard
    });
  } catch (error) {
    logger.error({ error, query: req.query }, 'Failed to get financial dashboard');
    res.status(500).json({ 
      error: 'Failed to get financial dashboard',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get operational dashboard
 */
router.get('/operational-dashboard', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const { 
      dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      dateTo = new Date().toISOString()
    } = req.query;

    const dateRange = {
      dateFrom: new Date(dateFrom as string),
      dateTo: new Date(dateTo as string)
    };

    const dashboard = await healthcareAnalyticsService.getDashboardData(
      getCompanyId(req),
      dateRange,
      'operational'
    );

    res.json({
      success: true,
      dashboard
    });
  } catch (error) {
    logger.error({ error, query: req.query }, 'Failed to get operational dashboard');
    res.status(500).json({ 
      error: 'Failed to get operational dashboard',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ========== ANALYTICS EXPORT ==========

/**
 * Export analytics data to CSV/Excel
 */
router.post('/export', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const { 
      reportType,
      dateRange,
      format = 'csv'
    } = req.body;

    if (!reportType || !dateRange) {
      return res.status(400).json({
        error: 'Report type and date range are required'
      });
    }

    // This would generate the export based on report type
    // For now, return a placeholder response
    res.json({
      success: true,
      message: 'Export functionality would be implemented here',
      reportType,
      format,
      dateRange
    });
  } catch (error) {
    logger.error({ error, body: req.body }, 'Failed to export analytics data');
    res.status(500).json({ 
      error: 'Failed to export analytics data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
