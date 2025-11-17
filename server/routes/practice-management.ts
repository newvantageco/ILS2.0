/**
 * Extended Practice Management API Routes
 * 
 * Comprehensive REST API for practice management including:
 * - Staff scheduling and management
 * - Resource optimization and allocation
 * - Inventory management and tracking
 * - Facility scheduling and utilization
 * - Performance dashboards and metrics
 * - Workflow automation and optimization
 * - Compliance and regulatory management
 * - Financial planning and budgeting
 */

import { Router, Request, Response } from "express";
import { z } from "zod";
import { practiceManagementService } from "../services/PracticeManagementService";
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
const shiftSchema = z.object({
  date: z.coerce.date(),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  department: z.string().min(1),
  role: z.string().min(1),
  location: z.string().optional(),
  breakTime: z.number().optional(),
  overtime: z.boolean().optional()
});

const staffScheduleSchema = z.object({
  staffId: z.string().min(1),
  scheduleType: z.enum(['weekly', 'monthly', 'custom']),
  dateRange: z.object({
    dateFrom: z.coerce.date(),
    dateTo: z.coerce.date()
  }),
  shifts: z.array(shiftSchema).min(1),
  preferences: z.object({
    preferredShifts: z.array(z.string()).optional(),
    unavailableTimes: z.array(z.object({
      dateFrom: z.coerce.date(),
      dateTo: z.coerce.date(),
      reason: z.string().min(1)
    })).optional()
  }).optional()
});

const allocationSchema = z.object({
  date: z.coerce.date(),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  assignedTo: z.string().min(1),
  purpose: z.string().min(1),
  priority: z.enum(['low', 'medium', 'high', 'critical'])
});

const resourceAllocationSchema = z.object({
  resourceType: z.enum(['room', 'equipment', 'staff', 'facility']),
  resourceId: z.string().min(1),
  allocations: z.array(allocationSchema).min(1),
  constraints: z.object({
    maxConcurrentUsage: z.number().optional(),
    requiredQualifications: z.array(z.string()).optional(),
    maintenanceWindows: z.array(z.object({
      dateFrom: z.coerce.date(),
      dateTo: z.coerce.date()
    })).optional()
  }).optional()
});

const inventoryItemSchema = z.object({
  itemId: z.string().min(1),
  itemName: z.string().min(1),
  category: z.string().min(1),
  currentStock: z.number().min(0),
  minStockLevel: z.number().min(0),
  maxStockLevel: z.number().min(0),
  unitOfMeasure: z.string().min(1),
  costPerUnit: z.number().min(0),
  supplier: z.string().min(1),
  leadTimeDays: z.number().min(0),
  expiryDate: z.coerce.date().optional(),
  storageLocation: z.string().optional()
});

const inventoryManagementSchema = z.object({
  items: z.array(inventoryItemSchema).min(1),
  transactions: z.array(z.object({
    itemId: z.string().min(1),
    transactionType: z.enum(['receive', 'issue', 'adjust', 'return']),
    quantity: z.number(),
    reason: z.string().min(1),
    performedBy: z.string().min(1),
    transactionDate: z.coerce.date()
  })).optional()
});

const facilityUtilizationSchema = z.object({
  facilityId: z.string().min(1),
  dateRange: z.object({
    dateFrom: z.coerce.date(),
    dateTo: z.coerce.date()
  }),
  metrics: z.array(z.object({
    metricType: z.enum(['room_utilization', 'equipment_usage', 'patient_flow', 'staff_productivity']),
    parameters: z.any().optional()
  })).min(1)
});

// ========== STAFF SCHEDULING ==========

/**
 * Create staff schedule
 */
router.post('/staff/schedule', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const validated = staffScheduleSchema.parse(req.body);
    
    const result = await practiceManagementService.createStaffSchedule({
      companyId: getCompanyId(req),
      ...validated
    });

    res.status(201).json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error({ error, body: req.body }, 'Failed to create staff schedule');
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to create staff schedule',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get staff schedules
 */
router.get('/staff/schedules', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const {
      staffId,
      department,
      dateFrom,
      dateTo,
      status
    } = req.query;

    const options = {
      staffId: staffId as string,
      department: department as string,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
      status: status as string
    };

    const result = await practiceManagementService.getStaffSchedules(getCompanyId(req), options);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error({ error, query: req.query }, 'Failed to get staff schedules');
    res.status(500).json({ 
      error: 'Failed to get staff schedules',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get staff schedule conflicts
 */
router.get('/staff/schedule/conflicts', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const { staffId, dateFrom, dateTo } = req.query;
    
    // This would need to be implemented in the service
    res.json({
      success: true,
      message: 'Schedule conflicts endpoint - to be implemented',
      staffId,
      dateFrom,
      dateTo
    });
  } catch (error) {
    logger.error({ error, query: req.query }, 'Failed to get schedule conflicts');
    res.status(500).json({ 
      error: 'Failed to get schedule conflicts',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ========== RESOURCE MANAGEMENT ==========

/**
 * Optimize resource allocation
 */
router.post('/resources/optimize', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const validated = resourceAllocationSchema.parse(req.body);
    
    const result = await practiceManagementService.optimizeResourceAllocation({
      companyId: getCompanyId(req),
      ...validated
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error({ error, body: req.body }, 'Failed to optimize resource allocation');
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to optimize resource allocation',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get resource utilization
 */
router.get('/resources/utilization', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const {
      resourceType,
      resourceId,
      dateFrom = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      dateTo = new Date().toISOString()
    } = req.query;

    const dateRange = {
      dateFrom: new Date(dateFrom as string),
      dateTo: new Date(dateTo as string)
    };

    // This would need to be implemented in the service
    res.json({
      success: true,
      message: 'Resource utilization endpoint - to be implemented',
      resourceType,
      resourceId,
      dateRange
    });
  } catch (error) {
    logger.error({ error, query: req.query }, 'Failed to get resource utilization');
    res.status(500).json({ 
      error: 'Failed to get resource utilization',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ========== INVENTORY MANAGEMENT ==========

/**
 * Manage inventory
 */
router.post('/inventory/manage', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const validated = inventoryManagementSchema.parse(req.body);
    
    const result = await practiceManagementService.manageInventory({
      companyId: getCompanyId(req),
      ...validated
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error({ error, body: req.body }, 'Failed to manage inventory');
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to manage inventory',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get inventory status
 */
router.get('/inventory/status', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const {
      category,
      lowStockOnly = false,
      limit = 100,
      offset = 0
    } = req.query;

    // This would need to be implemented in the service
    res.json({
      success: true,
      message: 'Inventory status endpoint - to be implemented',
      filters: { category, lowStockOnly }
    });
  } catch (error) {
    logger.error({ error, query: req.query }, 'Failed to get inventory status');
    res.status(500).json({ 
      error: 'Failed to get inventory status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Process inventory transaction
 */
router.post('/inventory/transaction', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const { 
      itemId,
      transactionType,
      quantity,
      reason
    } = req.body;

    // This would need to be implemented in the service
    res.json({
      success: true,
      message: 'Inventory transaction endpoint - to be implemented',
      itemId,
      transactionType,
      quantity,
      reason,
      performedBy: getUserId(req),
      transactionDate: new Date()
    });
  } catch (error) {
    logger.error({ error, body: req.body }, 'Failed to process inventory transaction');
    res.status(500).json({ 
      error: 'Failed to process inventory transaction',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ========== FACILITY MANAGEMENT ==========

/**
 * Get facility utilization metrics
 */
router.post('/facility/utilization', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const validated = facilityUtilizationSchema.parse(req.body);
    
    const result = await practiceManagementService.getFacilityUtilization({
      companyId: getCompanyId(req),
      ...validated
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error({ error, body: req.body }, 'Failed to get facility utilization metrics');
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to get facility utilization metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get facility overview
 */
router.get('/facility/overview', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const {
      facilityId,
      dateFrom = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      dateTo = new Date().toISOString()
    } = req.query;

    // This would need to be implemented in the service
    res.json({
      success: true,
      message: 'Facility overview endpoint - to be implemented',
      facilityId,
      dateFrom,
      dateTo
    });
  } catch (error) {
    logger.error({ error, query: req.query }, 'Failed to get facility overview');
    res.status(500).json({ 
      error: 'Failed to get facility overview',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ========== PERFORMANCE MANAGEMENT ==========

/**
 * Get practice performance metrics
 */
router.get('/performance/metrics', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const {
      dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      dateTo = new Date().toISOString()
    } = req.query;

    const dateRange = {
      dateFrom: new Date(dateFrom as string),
      dateTo: new Date(dateTo as string)
    };

    const result = await practiceManagementService.getPracticePerformanceMetrics(getCompanyId(req), dateRange);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error({ error, query: req.query }, 'Failed to get practice performance metrics');
    res.status(500).json({ 
      error: 'Failed to get practice performance metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get department performance
 */
router.get('/performance/department/:departmentId', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const { departmentId } = req.params;
    const {
      dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      dateTo = new Date().toISOString()
    } = req.query;

    // This would need to be implemented in the service
    res.json({
      success: true,
      message: 'Department performance endpoint - to be implemented',
      departmentId,
      dateFrom,
      dateTo
    });
  } catch (error) {
    logger.error({ error, params: req.params }, 'Failed to get department performance');
    res.status(500).json({ 
      error: 'Failed to get department performance',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ========== WORKFLOW OPTIMIZATION ==========

/**
 * Optimize workflows
 */
router.post('/workflows/optimize', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const {
      workflowType,
      department,
      targetEfficiency
    } = req.body;

    const options = {
      workflowType,
      department,
      targetEfficiency
    };

    const result = await practiceManagementService.optimizeWorkflows(getCompanyId(req), options);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error({ error, body: req.body }, 'Failed to optimize workflows');
    res.status(500).json({ 
      error: 'Failed to optimize workflows',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get workflow analysis
 */
router.get('/workflows/analysis', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const {
      workflowType,
      department,
      dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      dateTo = new Date().toISOString()
    } = req.query;

    // This would need to be implemented in the service
    res.json({
      success: true,
      message: 'Workflow analysis endpoint - to be implemented',
      workflowType,
      department,
      dateFrom,
      dateTo
    });
  } catch (error) {
    logger.error({ error, query: req.query }, 'Failed to get workflow analysis');
    res.status(500).json({ 
      error: 'Failed to get workflow analysis',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ========== COMPLIANCE MANAGEMENT ==========

/**
 * Manage compliance
 */
router.get('/compliance/manage', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const {
      complianceType,
      dateFrom = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      dateTo = new Date().toISOString()
    } = req.query;

    const options = {
      complianceType: complianceType as string,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined
    };

    const result = await practiceManagementService.manageCompliance(getCompanyId(req), options);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error({ error, query: req.query }, 'Failed to manage compliance');
    res.status(500).json({ 
      error: 'Failed to manage compliance',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get compliance reports
 */
router.get('/compliance/reports', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const {
      reportType,
      dateFrom,
      dateTo,
      format = 'json'
    } = req.query;

    // This would need to be implemented in the service
    res.json({
      success: true,
      message: 'Compliance reports endpoint - to be implemented',
      reportType,
      dateFrom,
      dateTo,
      format
    });
  } catch (error) {
    logger.error({ error, query: req.query }, 'Failed to get compliance reports');
    res.status(500).json({ 
      error: 'Failed to get compliance reports',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ========== DASHBOARD AND REPORTS ==========

/**
 * Get practice management dashboard
 */
router.get('/dashboard', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const {
      dashboardType = 'overview',
      dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      dateTo = new Date().toISOString()
    } = req.query;

    const dateRange = {
      dateFrom: new Date(dateFrom as string),
      dateTo: new Date(dateTo as string)
    };

    // This would need to be implemented in the service
    res.json({
      success: true,
      message: 'Practice management dashboard endpoint - to be implemented',
      dashboardType,
      dateRange
    });
  } catch (error) {
    logger.error({ error, query: req.query }, 'Failed to get practice management dashboard');
    res.status(500).json({ 
      error: 'Failed to get practice management dashboard',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Generate practice reports
 */
router.post('/reports/generate', requireAuth, requireCompanyAccess, async (req: Request, res: Response) => {
  try {
    const {
      reportType,
      dateFrom,
      dateTo,
      format = 'pdf',
      parameters
    } = req.body;

    // This would need to be implemented in the service
    res.json({
      success: true,
      message: 'Generate practice reports endpoint - to be implemented',
      reportType,
      dateFrom,
      dateTo,
      format,
      parameters
    });
  } catch (error) {
    logger.error({ error, body: req.body }, 'Failed to generate practice reports');
    res.status(500).json({ 
      error: 'Failed to generate practice reports',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
