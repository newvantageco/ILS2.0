import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { authRepository } from "../repositories/AuthRepository";
import { isAuthenticated } from "../replitAuth";

const router = Router();
import { createLogger } from "../utils/logger";

const logger = createLogger('ml-models');

// Validation schemas
const createModelSchema = z.object({
  name: z.string().min(1),
  modelType: z.enum(["classification", "regression", "clustering", "neural_network"]),
  framework: z.enum(["tensorflow", "pytorch", "scikit-learn", "xgboost"]),
  description: z.string().optional(),
  parameters: z.record(z.any()).optional(),
});

const updateModelSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  parameters: z.record(z.any()).optional(),
});

const trainModelSchema = z.object({
  trainingData: z.object({
    datasetId: z.string().optional(),
    datasetUrl: z.string().optional(),
    parameters: z.record(z.any()).optional(),
  }),
  hyperparameters: z.record(z.any()).optional(),
  epochs: z.number().int().positive().optional(),
  batchSize: z.number().int().positive().optional(),
});

// Helper to check admin access
const requireAdmin = async (req: any, res: any, next: any) => {
  const userId = req.user.claims.sub;
  const user = await authRepository.getUserByIdWithTenantCheck(userId, { id: req.user.id, companyId: req.user.companyId || null, role: req.user.role }, { reason: "Route operation", ip: req.ip });
  
  if (!user || (user.role !== 'admin' && user.role !== 'platform_admin')) {
    return res.status(403).json({ message: "Admin access required" });
  }
  
  (req as any).currentUser = user;
  next();
};

// Apply auth middleware to all routes
router.use(isAuthenticated, requireAdmin);

/**
 * GET /api/ml/models
 * List all ML models with optional filtering
 */
router.get("/", async (req: any, res) => {
  try {
    const { status, modelType, framework, search, limit = "50", offset = "0" } = req.query;

    // Mock data for demonstration - replace with actual database queries
    const models = [
      {
        id: "model-001",
        name: "Customer Churn Predictor",
        modelType: "classification",
        framework: "scikit-learn",
        version: "1.2.0",
        status: "deployed",
        accuracy: 0.94,
        lastTrained: new Date("2025-10-15"),
        deployedAt: new Date("2025-10-20"),
        trainingTime: 3600, // seconds
        description: "Predicts customer churn probability based on historical data",
        parameters: {
          algorithm: "RandomForest",
          n_estimators: 100,
          max_depth: 10,
        },
        createdBy: req.currentUser.id,
        createdAt: new Date("2025-09-01"),
      },
      {
        id: "model-002",
        name: "Demand Forecasting Model",
        modelType: "regression",
        framework: "tensorflow",
        version: "2.0.1",
        status: "training",
        accuracy: null,
        lastTrained: null,
        deployedAt: null,
        trainingTime: null,
        description: "Forecasts product demand for next 30 days",
        parameters: {
          layers: 5,
          neurons: 128,
          activation: "relu",
        },
        createdBy: req.currentUser.id,
        createdAt: new Date("2025-10-25"),
      },
      {
        id: "model-003",
        name: "Quality Control Detector",
        modelType: "classification",
        framework: "pytorch",
        version: "1.0.5",
        status: "deployed",
        accuracy: 0.98,
        lastTrained: new Date("2025-10-10"),
        deployedAt: new Date("2025-10-12"),
        trainingTime: 7200,
        description: "Detects defects in lens manufacturing process",
        parameters: {
          architecture: "ResNet50",
          image_size: 224,
          batch_norm: true,
        },
        createdBy: req.currentUser.id,
        createdAt: new Date("2025-08-15"),
      },
    ];

    // Apply filters
    let filtered = models;
    
    if (status) {
      filtered = filtered.filter(m => m.status === status);
    }
    
    if (modelType) {
      filtered = filtered.filter(m => m.modelType === modelType);
    }
    
    if (framework) {
      filtered = filtered.filter(m => m.framework === framework);
    }
    
    if (search) {
      const searchLower = (search as string).toLowerCase();
      filtered = filtered.filter(m => 
        m.name.toLowerCase().includes(searchLower) ||
        (m.description && m.description.toLowerCase().includes(searchLower))
      );
    }

    // Apply pagination
    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);
    const paginated = filtered.slice(offsetNum, offsetNum + limitNum);

    res.json({
      models: paginated,
      total: filtered.length,
      limit: limitNum,
      offset: offsetNum,
    });
  } catch (error) {
    logger.error({ error, status, modelType, framework, search, limit, offset }, 'Error fetching ML models');
    res.status(500).json({ message: "Failed to fetch ML models" });
  }
});

/**
 * GET /api/ml/models/:id
 * Get detailed information about a specific model
 */
router.get("/:id", async (req: any, res) => {
  try {
    const { id } = req.params;

    // Mock detailed model data
    const model = {
      id,
      name: "Customer Churn Predictor",
      modelType: "classification",
      framework: "scikit-learn",
      version: "1.2.0",
      status: "deployed",
      accuracy: 0.94,
      f1Score: 0.92,
      precision: 0.93,
      recall: 0.91,
      lastTrained: new Date("2025-10-15"),
      deployedAt: new Date("2025-10-20"),
      trainingTime: 3600,
      description: "Predicts customer churn probability based on historical data",
      parameters: {
        algorithm: "RandomForest",
        n_estimators: 100,
        max_depth: 10,
        min_samples_split: 2,
      },
      trainingHistory: [
        {
          version: "1.2.0",
          trainedAt: new Date("2025-10-15"),
          accuracy: 0.94,
          loss: 0.18,
          epochs: 50,
        },
        {
          version: "1.1.0",
          trainedAt: new Date("2025-09-20"),
          accuracy: 0.91,
          loss: 0.22,
          epochs: 50,
        },
      ],
      predictions: {
        total: 15234,
        last24Hours: 342,
        averageConfidence: 0.87,
      },
      createdBy: (req as any).currentUser.id,
      createdAt: new Date("2025-09-01"),
      updatedAt: new Date("2025-10-20"),
    };

    res.json(model);
  } catch (error) {
    logger.error({ error, modelId: id }, 'Error fetching ML model');
    res.status(500).json({ message: "Failed to fetch ML model" });
  }
});

/**
 * POST /api/ml/models
 * Create a new ML model
 */
router.post("/", async (req: any, res) => {
  try {
    const validation = createModelSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        message: "Validation failed", 
        errors: validation.error.errors 
      });
    }

    const modelData = validation.data;
    
    // Create model record
    const newModel = {
      id: `model-${Date.now()}`,
      ...modelData,
      version: "1.0.0",
      status: "draft",
      accuracy: null,
      lastTrained: null,
      deployedAt: null,
      trainingTime: null,
      createdBy: (req as any).currentUser.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    res.status(201).json(newModel);
  } catch (error) {
    logger.error({ error, name: modelData?.name, modelType: modelData?.modelType }, 'Error creating ML model');
    res.status(500).json({ message: "Failed to create ML model" });
  }
});

/**
 * PATCH /api/ml/models/:id
 * Update an existing ML model
 */
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const validation = updateModelSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        message: "Validation failed", 
        errors: validation.error.errors 
      });
    }

    // Mock update
    const updatedModel = {
      id,
      name: validation.data.name || "Updated Model",
      description: validation.data.description,
      parameters: validation.data.parameters,
      updatedAt: new Date(),
    };

    res.json(updatedModel);
  } catch (error) {
    logger.error({ error, modelId: id, updates: validation.data }, 'Error updating ML model');
    res.status(500).json({ message: "Failed to update ML model" });
  }
});

/**
 * DELETE /api/ml/models/:id
 * Delete an ML model
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Check if model is deployed
    // In production, would query database
    // For now, mock the check
    
    res.json({ message: "Model deleted successfully", id });
  } catch (error) {
    logger.error({ error, modelId: id }, 'Error deleting ML model');
    res.status(500).json({ message: "Failed to delete ML model" });
  }
});

/**
 * POST /api/ml/models/:id/train
 * Start training a model
 */
router.post("/:id/train", async (req, res) => {
  try {
    const { id } = req.params;
    const validation = trainModelSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        message: "Validation failed", 
        errors: validation.error.errors 
      });
    }

    const trainingConfig = validation.data;

    // In production, this would:
    // 1. Queue a background training job
    // 2. Update model status to "training"
    // 3. Return job ID for tracking

    const trainingJob = {
      jobId: `train-job-${Date.now()}`,
      modelId: id,
      status: "queued",
      startedAt: new Date(),
      estimatedCompletion: new Date(Date.now() + 3600000), // 1 hour
      config: trainingConfig,
    };

    res.json({
      message: "Training job started",
      job: trainingJob,
    });
  } catch (error) {
    logger.error({ error, modelId: id, trainingConfig }, 'Error starting model training');
    res.status(500).json({ message: "Failed to start model training" });
  }
});

/**
 * POST /api/ml/models/:id/deploy
 * Deploy a trained model
 */
router.post("/:id/deploy", async (req, res) => {
  try {
    const { id } = req.params;
    const { environment = "production" } = req.body;

    // In production, this would:
    // 1. Validate model is trained
    // 2. Create deployment endpoint
    // 3. Update model status to "deployed"

    const deployment = {
      modelId: id,
      environment,
      status: "deployed",
      endpoint: `https://api.example.com/ml/predict/${id}`,
      deployedAt: new Date(),
      deployedBy: (req as any).currentUser.id,
    };

    res.json({
      message: "Model deployed successfully",
      deployment,
    });
  } catch (error) {
    logger.error({ error, modelId: id, environment }, 'Error deploying model');
    res.status(500).json({ message: "Failed to deploy model" });
  }
});

/**
 * POST /api/ml/models/:id/stop
 * Stop a deployed model
 */
router.post("/:id/stop", async (req, res) => {
  try {
    const { id } = req.params;

    // In production, this would:
    // 1. Remove deployment endpoint
    // 2. Update model status to "stopped"

    res.json({
      message: "Model stopped successfully",
      modelId: id,
      stoppedAt: new Date(),
    });
  } catch (error) {
    logger.error({ error, modelId: id }, 'Error stopping model');
    res.status(500).json({ message: "Failed to stop model" });
  }
});

/**
 * GET /api/ml/models/:id/metrics
 * Get performance metrics for a model
 */
router.get("/:id/metrics", async (req, res) => {
  try {
    const { id } = req.params;
    const { timeRange = "7d" } = req.query;

    // Mock metrics data
    const metrics = {
      modelId: id,
      timeRange,
      performance: {
        accuracy: 0.94,
        f1Score: 0.92,
        precision: 0.93,
        recall: 0.91,
        auc: 0.96,
      },
      usage: {
        totalPredictions: 15234,
        predictionsToday: 342,
        averageLatency: 45, // ms
        errorRate: 0.002,
      },
      history: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
        predictions: Math.floor(Math.random() * 500) + 200,
        accuracy: 0.90 + Math.random() * 0.05,
        avgLatency: 40 + Math.random() * 20,
      })).reverse(),
    };

    res.json(metrics);
  } catch (error) {
    logger.error({ error, modelId: id, timeRange }, 'Error fetching model metrics');
    res.status(500).json({ message: "Failed to fetch model metrics" });
  }
});

/**
 * POST /api/ml/models/:id/predict
 * Make a prediction using a deployed model
 */
router.post("/:id/predict", async (req, res) => {
  try {
    const { id } = req.params;
    const { input } = req.body;

    if (!input) {
      return res.status(400).json({ message: "Input data required" });
    }

    // Mock prediction
    const prediction = {
      modelId: id,
      input,
      output: {
        prediction: Math.random() > 0.5 ? "positive" : "negative",
        confidence: 0.85 + Math.random() * 0.1,
        probabilities: {
          positive: 0.85,
          negative: 0.15,
        },
      },
      latency: 42, // ms
      timestamp: new Date(),
    };

    res.json(prediction);
  } catch (error) {
    logger.error({ error, modelId: id, input }, 'Error making prediction');
    res.status(500).json({ message: "Failed to make prediction" });
  }
});

export default router;
