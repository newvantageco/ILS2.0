/**
 * Master AI Training Routes
 * 
 * Platform admin routes for managing master AI training, versioning,
 * and deployment to company AIs
 */

import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { z } from "zod";

const router = Router();

/**
 * Middleware to check if user is platform admin
 */
function isPlatformAdmin(req: any, res: Response, next: Function) {
  if (req.user && req.user.role === "platform_admin") {
    return next();
  }
  res.status(403).json({ error: "Platform admin access required" });
}

// ============== AI MODEL VERSIONS ==============

/**
 * POST /api/master-ai/versions
 * Create a new master AI model version
 */
router.post("/versions", isPlatformAdmin, async (req: any, res: Response) => {
  try {
    const schema = z.object({
      versionNumber: z.string(),
      description: z.string(),
      modelName: z.string().optional(),
    });

    const validation = schema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Invalid request", details: validation.error.errors });
    }

    const { versionNumber, description, modelName } = validation.data;
    const userId = req.user?.claims?.sub || req.user?.id;

    const version = await storage.createAiModelVersion({
      versionNumber,
      description,
      modelName: modelName || "ils-master-ai",
      status: "draft",
      createdBy: userId,
    });

    res.status(201).json({ success: true, version });
  } catch (error: any) {
    console.error("Error creating AI model version:", error);
    res.status(500).json({ error: "Failed to create model version", message: error.message });
  }
});

/**
 * GET /api/master-ai/versions
 * List all AI model versions
 */
router.get("/versions", isPlatformAdmin, async (req: any, res: Response) => {
  try {
    const { status } = req.query;
    const versions = await storage.getAiModelVersions(status as string);
    res.json({ success: true, versions });
  } catch (error: any) {
    console.error("Error fetching AI model versions:", error);
    res.status(500).json({ error: "Failed to fetch versions" });
  }
});

/**
 * GET /api/master-ai/versions/:id
 * Get specific AI model version with details
 */
router.get("/versions/:id", isPlatformAdmin, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const version = await storage.getAiModelVersion(id);
    
    if (!version) {
      return res.status(404).json({ error: "Model version not found" });
    }

    // Get associated training datasets
    const trainingData = await storage.getMasterTrainingDataByVersion(id);
    const deployments = await storage.getModelDeploymentsByVersion(id);

    res.json({ 
      success: true, 
      version: {
        ...version,
        trainingDataCount: trainingData.length,
        deploymentCount: deployments.length,
      },
      trainingData,
      deployments,
    });
  } catch (error: any) {
    console.error("Error fetching AI model version:", error);
    res.status(500).json({ error: "Failed to fetch version details" });
  }
});

/**
 * PUT /api/master-ai/versions/:id/approve
 * Approve an AI model version for deployment
 */
router.put("/versions/:id/approve", isPlatformAdmin, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.claims?.sub || req.user?.id;

    const updated = await storage.updateAiModelVersion(id, {
      status: "approved",
      approvedBy: userId,
      approvedAt: new Date(),
    });

    res.json({ success: true, message: "Model version approved", version: updated });
  } catch (error: any) {
    console.error("Error approving AI model version:", error);
    res.status(500).json({ error: "Failed to approve version" });
  }
});

// ============== MASTER TRAINING DATASETS ==============

/**
 * POST /api/master-ai/training-data
 * Upload new master training data
 */
router.post("/training-data", isPlatformAdmin, async (req: any, res: Response) => {
  try {
    const schema = z.object({
      modelVersionId: z.string().optional(),
      category: z.string(),
      title: z.string(),
      content: z.string(),
      contentType: z.string(),
      source: z.string().optional(),
      qualityScore: z.number().min(0).max(1).optional(),
      tags: z.array(z.string()).optional(),
      metadata: z.any().optional(),
    });

    const validation = schema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Invalid request", details: validation.error.errors });
    }

    const data = validation.data;
    const userId = req.user?.claims?.sub || req.user?.id;

    const trainingData = await storage.createMasterTrainingDataset({
      ...data,
      createdBy: userId,
      status: "pending",
    });

    res.status(201).json({ success: true, trainingData });
  } catch (error: any) {
    console.error("Error creating training data:", error);
    res.status(500).json({ error: "Failed to create training data", message: error.message });
  }
});

/**
 * POST /api/master-ai/training-data/bulk
 * Bulk upload training data
 */
router.post("/training-data/bulk", isPlatformAdmin, async (req: any, res: Response) => {
  try {
    const { datasets } = req.body;
    
    if (!Array.isArray(datasets)) {
      return res.status(400).json({ error: "datasets must be an array" });
    }

    const userId = req.user?.claims?.sub || req.user?.id;
    const created = [];

    for (const dataset of datasets) {
      const trainingData = await storage.createMasterTrainingDataset({
        ...dataset,
        createdBy: userId,
        status: "pending",
      });
      created.push(trainingData);
    }

    res.status(201).json({ success: true, count: created.length, datasets: created });
  } catch (error: any) {
    console.error("Error bulk creating training data:", error);
    res.status(500).json({ error: "Failed to create training data", message: error.message });
  }
});

/**
 * GET /api/master-ai/training-data
 * List master training datasets
 */
router.get("/training-data", isPlatformAdmin, async (req: any, res: Response) => {
  try {
    const { category, status, modelVersionId } = req.query;
    
    const filters: any = {};
    if (category) filters.category = category;
    if (status) filters.status = status;
    if (modelVersionId) filters.modelVersionId = modelVersionId;

    const datasets = await storage.getMasterTrainingDatasets(filters);
    res.json({ success: true, datasets });
  } catch (error: any) {
    console.error("Error fetching training data:", error);
    res.status(500).json({ error: "Failed to fetch training data" });
  }
});

/**
 * PUT /api/master-ai/training-data/:id/approve
 * Approve training data for use
 */
router.put("/training-data/:id/approve", isPlatformAdmin, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.claims?.sub || req.user?.id;

    const updated = await storage.updateMasterTrainingDataset(id, {
      status: "approved",
      approvedBy: userId,
      approvedAt: new Date(),
    });

    res.json({ success: true, message: "Training data approved", dataset: updated });
  } catch (error: any) {
    console.error("Error approving training data:", error);
    res.status(500).json({ error: "Failed to approve training data" });
  }
});

/**
 * DELETE /api/master-ai/training-data/:id
 * Delete training dataset
 */
router.delete("/training-data/:id", isPlatformAdmin, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    await storage.deleteMasterTrainingDataset(id);
    res.json({ success: true, message: "Training data deleted" });
  } catch (error: any) {
    console.error("Error deleting training data:", error);
    res.status(500).json({ error: "Failed to delete training data" });
  }
});

// ============== AI TRAINING JOBS ==============

/**
 * POST /api/master-ai/training-jobs
 * Start a new AI training job
 */
router.post("/training-jobs", isPlatformAdmin, async (req: any, res: Response) => {
  try {
    const schema = z.object({
      modelVersionId: z.string(),
      jobType: z.enum(["initial_training", "incremental", "retraining", "evaluation"]),
      trainingDatasetIds: z.array(z.string()).optional(),
    });

    const validation = schema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Invalid request", details: validation.error.errors });
    }

    const { modelVersionId, jobType, trainingDatasetIds } = validation.data;
    const userId = req.user?.claims?.sub || req.user?.id;

    const job = await storage.createAiTrainingJob({
      modelVersionId,
      jobType,
      trainingDatasetIds,
      status: "queued",
      createdBy: userId,
    });

    // In production, this would trigger an actual training pipeline
    // For now, we just create the job record

    res.status(201).json({ 
      success: true, 
      message: "Training job queued", 
      job,
      note: "Training job created. In production, this would trigger the actual training pipeline.",
    });
  } catch (error: any) {
    console.error("Error creating training job:", error);
    res.status(500).json({ error: "Failed to create training job", message: error.message });
  }
});

/**
 * GET /api/master-ai/training-jobs
 * List training jobs
 */
router.get("/training-jobs", isPlatformAdmin, async (req: any, res: Response) => {
  try {
    const { status, modelVersionId } = req.query;
    const jobs = await storage.getAiTrainingJobs({ status: status as string, modelVersionId: modelVersionId as string });
    res.json({ success: true, jobs });
  } catch (error: any) {
    console.error("Error fetching training jobs:", error);
    res.status(500).json({ error: "Failed to fetch training jobs" });
  }
});

// ============== AI MODEL DEPLOYMENTS ==============

/**
 * POST /api/master-ai/deploy
 * Deploy an AI model version to companies
 */
router.post("/deploy", isPlatformAdmin, async (req: any, res: Response) => {
  try {
    const schema = z.object({
      modelVersionId: z.string(),
      companyIds: z.array(z.string()).optional(), // null = deploy to all
      deploymentType: z.enum(["immediate", "scheduled", "gradual_rollout"]),
      scheduledAt: z.string().optional(),
      priority: z.number().min(1).max(10).optional(),
    });

    const validation = schema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Invalid request", details: validation.error.errors });
    }

    const { modelVersionId, companyIds, deploymentType, scheduledAt, priority } = validation.data;
    const userId = req.user?.claims?.sub || req.user?.id;

    // Verify model version is approved
    const version = await storage.getAiModelVersion(modelVersionId);
    if (!version) {
      return res.status(404).json({ error: "Model version not found" });
    }
    if (version.status !== "approved") {
      return res.status(400).json({ error: "Can only deploy approved model versions" });
    }

    // Create deployment queue entry
    const deployment = await storage.createDeploymentQueue({
      modelVersionId,
      companyIds,
      deploymentType,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      priority: priority || 5,
      status: "pending",
      createdBy: userId,
    });

    // If immediate deployment, process it
    if (deploymentType === "immediate") {
      await processDeployment(deployment.id, modelVersionId, companyIds);
    }

    res.status(201).json({ 
      success: true, 
      message: "Deployment queued", 
      deployment,
    });
  } catch (error: any) {
    console.error("Error creating deployment:", error);
    res.status(500).json({ error: "Failed to create deployment", message: error.message });
  }
});

/**
 * GET /api/master-ai/deployments
 * Get deployment history
 */
router.get("/deployments", isPlatformAdmin, async (req: any, res: Response) => {
  try {
    const { companyId, modelVersionId, status } = req.query;
    const deployments = await storage.getModelDeployments({
      companyId: companyId as string,
      modelVersionId: modelVersionId as string,
      status: status as string,
    });
    res.json({ success: true, deployments });
  } catch (error: any) {
    console.error("Error fetching deployments:", error);
    res.status(500).json({ error: "Failed to fetch deployments" });
  }
});

/**
 * GET /api/master-ai/company-stats
 * Get AI statistics across all companies
 */
router.get("/company-stats", isPlatformAdmin, async (req: any, res: Response) => {
  try {
    const companies = await storage.getCompanies();
    const stats = {
      totalCompanies: companies.length,
      aiEnabledCompanies: companies.filter(c => c.aiEnabled).length,
      byModelVersion: {} as any,
      averageLearningProgress: 0,
      totalConversations: 0,
      totalLearningData: 0,
    };

    // Get company AI settings
    const companySettings = await storage.getAllCompanyAiSettings();
    
    for (const setting of companySettings) {
      const version = setting.currentModelVersion || "unknown";
      stats.byModelVersion[version] = (stats.byModelVersion[version] || 0) + 1;
    }

    // Calculate average learning progress
    const learningProgresses = companies.map(c => c.aiLearningProgress || 0);
    stats.averageLearningProgress = learningProgresses.reduce((a, b) => a + b, 0) / companies.length;

    res.json({ success: true, stats });
  } catch (error: any) {
    console.error("Error fetching company stats:", error);
    res.status(500).json({ error: "Failed to fetch company stats" });
  }
});

/**
 * GET /api/master-ai/training-analytics
 * Get training data effectiveness analytics
 */
router.get("/training-analytics", isPlatformAdmin, async (req: any, res: Response) => {
  try {
    const analytics = await storage.getTrainingDataAnalytics();
    res.json({ success: true, analytics });
  } catch (error: any) {
    console.error("Error fetching training analytics:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

// ============== HELPER FUNCTIONS ==============

/**
 * Process deployment to companies
 */
async function processDeployment(queueId: string, modelVersionId: string, companyIds?: string[]) {
  try {
    await storage.updateDeploymentQueue(queueId, { status: "processing" });

    const version = await storage.getAiModelVersion(modelVersionId);
    if (!version) throw new Error("Model version not found");

    // Get companies to deploy to
    const companies = companyIds 
      ? await Promise.all(companyIds.map(id => storage.getCompany(id)))
      : await storage.getCompanies();

    const validCompanies = companies.filter(c => c && c.aiEnabled);

    let deployed = 0;
    let failed = 0;

    for (const company of validCompanies) {
      if (!company) continue;

      try {
        // Create deployment record
        await storage.createModelDeployment({
          companyId: company.id,
          modelVersionId: version.id,
          versionNumber: version.versionNumber,
          deploymentStatus: "active",
          deployedAt: new Date(),
        });

        // Update company AI settings
        await storage.updateCompanyAiSettings(company.id, {
          currentModelVersion: version.versionNumber,
          lastTrainingSync: new Date(),
        });

        deployed++;
      } catch (error) {
        console.error(`Failed to deploy to company ${company.id}:`, error);
        failed++;
      }
    }

    await storage.updateDeploymentQueue(queueId, {
      status: "completed",
      companiesDeployed: deployed,
      companiesFailed: failed,
      processedAt: new Date(),
    });

  } catch (error) {
    console.error("Deployment processing error:", error);
    await storage.updateDeploymentQueue(queueId, {
      status: "failed",
      errorLog: { error: String(error) },
    });
  }
}

export function registerMasterAiRoutes(app: any) {
  app.use("/api/master-ai", router);
}
