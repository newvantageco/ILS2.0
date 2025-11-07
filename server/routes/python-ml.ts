import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";

const router = Router();

// Validation schemas
const executeCodeSchema = z.object({
  code: z.string().min(1),
  timeout: z.number().int().positive().optional().default(30000),
});

const createJobSchema = z.object({
  jobType: z.enum(["analysis", "training", "prediction", "optimization"]),
  parameters: z.record(z.any()),
  priority: z.enum(["low", "normal", "high"]).optional().default("normal"),
});

// Helper to check admin access
const requireAdmin = async (req: any, res: any, next: any) => {
  const userId = req.user.claims.sub;
  const user = await storage.getUserById_Internal(userId);
  
  if (!user || (user.role !== 'admin' && user.role !== 'platform_admin')) {
    return res.status(403).json({ message: "Admin access required" });
  }
  
  (req as any).currentUser = user;
  next();
};

// Apply auth middleware to all routes
router.use(isAuthenticated, requireAdmin);

/**
 * GET /api/python-ml/health
 * Check Python ML service health status
 */
router.get("/health", async (req, res) => {
  try {
    // Mock health check - in production would ping Python service
    const health = {
      status: "healthy",
      uptime: 3600 * 24 * 7, // seconds
      version: "2.1.0",
      pythonVersion: "3.11.5",
      dependencies: {
        numpy: "1.24.3",
        pandas: "2.0.3",
        scikit_learn: "1.3.0",
        tensorflow: "2.13.0",
        torch: "2.0.1",
      },
      resources: {
        cpu_usage: 45.2,
        memory_usage: 62.8,
        disk_usage: 38.5,
      },
      lastCheck: new Date(),
    };

    res.json(health);
  } catch (error) {
    console.error("Error checking Python ML health:", error);
    res.status(500).json({ message: "Failed to check service health" });
  }
});

/**
 * GET /api/python-ml/predictions
 * Get prediction history
 */
router.get("/predictions", async (req, res) => {
  try {
    const { limit = "50", offset = "0", status, modelId } = req.query;

    // Mock prediction history
    const predictions = [
      {
        id: "pred-001",
        modelId: "model-001",
        modelName: "Customer Churn Predictor",
        input: { customer_id: "cust-123", features: {} },
        output: { prediction: "churn", confidence: 0.87 },
        status: "completed",
        latency: 45,
        createdAt: new Date(Date.now() - 3600000),
        completedAt: new Date(Date.now() - 3599000),
      },
      {
        id: "pred-002",
        modelId: "model-002",
        modelName: "Demand Forecasting",
        input: { product_id: "prod-456", days_ahead: 30 },
        output: { forecast: [120, 135, 142, 155] },
        status: "completed",
        latency: 230,
        createdAt: new Date(Date.now() - 7200000),
        completedAt: new Date(Date.now() - 7198000),
      },
      {
        id: "pred-003",
        modelId: "model-003",
        modelName: "Quality Control",
        input: { image_url: "https://..." },
        output: { defect_detected: false, confidence: 0.98 },
        status: "completed",
        latency: 120,
        createdAt: new Date(Date.now() - 10800000),
        completedAt: new Date(Date.now() - 10799000),
      },
    ];

    // Apply filters
    let filtered = predictions;
    
    if (status) {
      filtered = filtered.filter(p => p.status === status);
    }
    
    if (modelId) {
      filtered = filtered.filter(p => p.modelId === modelId);
    }

    // Apply pagination
    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);
    const paginated = filtered.slice(offsetNum, offsetNum + limitNum);

    res.json({
      predictions: paginated,
      total: filtered.length,
      limit: limitNum,
      offset: offsetNum,
    });
  } catch (error) {
    console.error("Error fetching predictions:", error);
    res.status(500).json({ message: "Failed to fetch predictions" });
  }
});

/**
 * GET /api/python-ml/jobs
 * Get analytics job queue
 */
router.get("/jobs", async (req, res) => {
  try {
    const { status, jobType, limit = "50", offset = "0" } = req.query;

    // Mock job queue
    const jobs = [
      {
        id: "job-001",
        jobType: "analysis",
        status: "running",
        progress: 65,
        parameters: { dataset: "sales_2025", analysis_type: "cohort" },
        createdAt: new Date(Date.now() - 1800000),
        startedAt: new Date(Date.now() - 1500000),
        estimatedCompletion: new Date(Date.now() + 600000),
        createdBy: (req as any).currentUser.id,
      },
      {
        id: "job-002",
        jobType: "training",
        status: "queued",
        progress: 0,
        parameters: { model: "churn_predictor_v2", epochs: 100 },
        createdAt: new Date(Date.now() - 900000),
        startedAt: null,
        estimatedCompletion: new Date(Date.now() + 3600000),
        createdBy: (req as any).currentUser.id,
      },
      {
        id: "job-003",
        jobType: "prediction",
        status: "completed",
        progress: 100,
        parameters: { batch_size: 1000, model: "demand_forecast" },
        createdAt: new Date(Date.now() - 7200000),
        startedAt: new Date(Date.now() - 7000000),
        completedAt: new Date(Date.now() - 6800000),
        createdBy: (req as any).currentUser.id,
      },
    ];

    // Apply filters
    let filtered = jobs;
    
    if (status) {
      filtered = filtered.filter(j => j.status === status);
    }
    
    if (jobType) {
      filtered = filtered.filter(j => j.jobType === jobType);
    }

    // Apply pagination
    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);
    const paginated = filtered.slice(offsetNum, offsetNum + limitNum);

    res.json({
      jobs: paginated,
      total: filtered.length,
      limit: limitNum,
      offset: offsetNum,
    });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ message: "Failed to fetch jobs" });
  }
});

/**
 * POST /api/python-ml/jobs
 * Create a new analytics job
 */
router.post("/jobs", async (req, res) => {
  try {
    const validation = createJobSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        message: "Validation failed", 
        errors: validation.error.errors 
      });
    }

    const jobData = validation.data;

    // Create job
    const newJob = {
      id: `job-${Date.now()}`,
      ...jobData,
      status: "queued",
      progress: 0,
      createdAt: new Date(),
      startedAt: null,
      estimatedCompletion: new Date(Date.now() + 3600000),
      createdBy: (req as any).currentUser.id,
    };

    res.status(201).json(newJob);
  } catch (error) {
    console.error("Error creating job:", error);
    res.status(500).json({ message: "Failed to create job" });
  }
});

/**
 * GET /api/python-ml/jobs/:id
 * Get job details and status
 */
router.get("/jobs/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Mock job details
    const job = {
      id,
      jobType: "analysis",
      status: "running",
      progress: 65,
      parameters: { 
        dataset: "sales_2025", 
        analysis_type: "cohort",
        filters: { region: "EMEA", product_category: "progressive" }
      },
      results: null,
      logs: [
        { timestamp: new Date(Date.now() - 1800000), level: "INFO", message: "Job queued" },
        { timestamp: new Date(Date.now() - 1500000), level: "INFO", message: "Job started" },
        { timestamp: new Date(Date.now() - 1200000), level: "INFO", message: "Loading dataset (10M records)" },
        { timestamp: new Date(Date.now() - 900000), level: "INFO", message: "Applying filters and transformations" },
        { timestamp: new Date(Date.now() - 600000), level: "INFO", message: "Running cohort analysis..." },
      ],
      createdAt: new Date(Date.now() - 1800000),
      startedAt: new Date(Date.now() - 1500000),
      estimatedCompletion: new Date(Date.now() + 600000),
      createdBy: (req as any).currentUser.id,
    };

    res.json(job);
  } catch (error) {
    console.error("Error fetching job:", error);
    res.status(500).json({ message: "Failed to fetch job" });
  }
});

/**
 * DELETE /api/python-ml/jobs/:id
 * Cancel a queued or running job
 */
router.delete("/jobs/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // In production, would send cancel signal to Python service
    res.json({ 
      message: "Job cancelled successfully", 
      id,
      cancelledAt: new Date()
    });
  } catch (error) {
    console.error("Error cancelling job:", error);
    res.status(500).json({ message: "Failed to cancel job" });
  }
});

/**
 * POST /api/python-ml/execute
 * Execute Python code snippet (admin only, sandboxed)
 */
router.post("/execute", async (req, res) => {
  try {
    const validation = executeCodeSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        message: "Validation failed", 
        errors: validation.error.errors 
      });
    }

    const { code, timeout } = validation.data;

    // In production, would execute in sandboxed Python environment
    // For now, return mock execution result
    const result = {
      executionId: `exec-${Date.now()}`,
      code,
      output: "Execution completed successfully\nResult: 42",
      error: null,
      executionTime: 145, // ms
      timestamp: new Date(),
    };

    res.json(result);
  } catch (error) {
    console.error("Error executing code:", error);
    res.status(500).json({ message: "Failed to execute code" });
  }
});

/**
 * GET /api/python-ml/metrics
 * Get Python ML service metrics
 */
router.get("/metrics", async (req, res) => {
  try {
    const { timeRange = "7d" } = req.query;

    // Mock metrics
    const metrics = {
      timeRange,
      predictions: {
        total: 45231,
        successful: 44987,
        failed: 244,
        averageLatency: 125, // ms
      },
      jobs: {
        total: 1234,
        completed: 1189,
        failed: 28,
        running: 12,
        queued: 5,
      },
      performance: {
        cpuUsage: [45, 52, 48, 61, 55, 49, 44],
        memoryUsage: [62, 65, 63, 68, 66, 64, 62],
        requestRate: [120, 145, 132, 189, 156, 142, 138],
      },
      history: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
        predictions: Math.floor(Math.random() * 2000) + 5000,
        jobs: Math.floor(Math.random() * 50) + 150,
        avgLatency: 100 + Math.random() * 50,
        errorRate: Math.random() * 0.01,
      })).reverse(),
    };

    res.json(metrics);
  } catch (error) {
    console.error("Error fetching metrics:", error);
    res.status(500).json({ message: "Failed to fetch metrics" });
  }
});

/**
 * POST /api/python-ml/restart
 * Restart Python ML service (admin only)
 */
router.post("/restart", async (req, res) => {
  try {
    // In production, would send restart signal to Python service
    res.json({ 
      message: "Service restart initiated", 
      estimatedDowntime: 30, // seconds
      restartedAt: new Date()
    });
  } catch (error) {
    console.error("Error restarting service:", error);
    res.status(500).json({ message: "Failed to restart service" });
  }
});

export default router;
