/**
 * AI Engine API Routes
 * 
 * POST /api/ai/analyze-order - Analyze prescription and clinical notes, generate recommendations
 * POST /api/ai/upload-catalog - Upload ECP's CSV catalog
 * GET /api/ai/recommendations/:orderId - Retrieve recommendations for an order
 * PUT /api/ai/recommendations/:id/accept - Mark recommendation as accepted
 */

import type { Express, Request, Response } from "express";
import { isAuthenticated } from "../replitAuth";
import { 
  aiAnalysisRequestSchema,
  ecpCatalogUploadSchema,
  type AiAnalysisRequest,
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { AiEngineSynapse } from "../services/aiEngine/aiEngineSynapse";
import { EcpCatalogModel } from "../services/aiEngine/ecpCatalogModel";
import { LimsModel } from "../services/aiEngine/limsModel";
import { NlpModel } from "../services/aiEngine/nlpModel";

export function registerAiEngineRoutes(app: Express): void {
  /**
   * POST /api/ai/analyze-order
   * 
   * Analyzes prescription data and clinical notes to generate
   * Good/Better/Best recommendations using the three-legged AI model.
   * 
   * Request body:
   * {
   *   orderId: string,
   *   ecpId: string,
   *   prescription: { odSphere?, odCylinder?, ..., pd? },
   *   clinicalNotes: {
   *     rawNotes: string,
   *     patientAge?: number,
   *     occupation?: string
   *   },
   *   frameData?: {
   *     wrapAngle?: number,
   *     type?: string
   *   }
   * }
   */
  app.post("/api/ai/analyze-order", isAuthenticated, async (req: any, res: Response) => {
    try {
      // Validate request
      const validationResult = aiAnalysisRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Validation error",
          details: fromZodError(validationResult.error).toString(),
        });
      }

      const request: AiAnalysisRequest = validationResult.data;

      // Verify user has permission to analyze this order
      const userId = req.user.claims.sub;
      if (request.ecpId !== userId) {
        return res.status(403).json({
          error: "Unauthorized",
          message: "You can only analyze orders for your own organization",
        });
      }

      // Generate recommendations using AI Engine
      const recommendations = await AiEngineSynapse.analyzeOrder(request);

      // Return recommendations to client
      res.status(200).json({
        success: true,
        data: recommendations,
      });
    } catch (error: any) {
      console.error("Error analyzing order:", error);
      res.status(500).json({
        error: "Analysis failed",
        message: error.message || "Failed to analyze order",
      });
    }
  });

  /**
   * POST /api/ai/upload-catalog
   * 
   * Uploads ECP's product catalog (from CSV)
   * 
   * Request body:
   * {
   *   ecpId: string,
   *   csvData: [
   *     {
   *       sku: string,
   *       name: string,
   *       brand?: string,
   *       category?: string,
   *       lensType?: string,
   *       lensMaterial?: string,
   *       coating?: string,
   *       retailPrice: number,
   *       wholesalePrice?: number,
   *       stockQuantity: number
   *     }
   *   ]
   * }
   */
  app.post("/api/ai/upload-catalog", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;

      // Parse and validate
      const validationResult = ecpCatalogUploadSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Validation error",
          details: fromZodError(validationResult.error).toString(),
        });
      }

      const { ecpId, csvData } = validationResult.data;

      // Verify permission
      if (ecpId !== userId) {
        return res.status(403).json({
          error: "Unauthorized",
          message: "You can only upload catalogs for your own organization",
        });
      }

      // Upload catalog
      await EcpCatalogModel.uploadCatalog(ecpId, csvData as any);

      // Get price statistics
      const stats = await EcpCatalogModel.getPriceStatistics(ecpId);

      res.status(200).json({
        success: true,
        message: `Uploaded ${csvData.length} products to your catalog`,
        stats,
      });
    } catch (error: any) {
      console.error("Error uploading catalog:", error);
      res.status(500).json({
        error: "Upload failed",
        message: error.message || "Failed to upload catalog",
      });
    }
  });

  /**
   * GET /api/ai/recommendations/:orderId
   * 
   * Retrieves AI recommendations for an order
   */
  app.get("/api/ai/recommendations/:orderId", isAuthenticated, async (req: any, res: Response) => {
    try {
      const { orderId } = req.params;
      const userId = req.user.claims.sub;

      const recommendations = await AiEngineSynapse.getRecommendations(orderId);

      if (!recommendations) {
        return res.status(404).json({
          error: "Not found",
          message: "No recommendations found for this order",
        });
      }

      // Verify permission
      if (recommendations.ecpId !== userId) {
        return res.status(403).json({
          error: "Unauthorized",
        });
      }

      res.status(200).json({
        success: true,
        data: recommendations,
      });
    } catch (error: any) {
      console.error("Error retrieving recommendations:", error);
      res.status(500).json({
        error: "Retrieval failed",
        message: error.message || "Failed to retrieve recommendations",
      });
    }
  });

  /**
   * PUT /api/ai/recommendations/:id/accept
   * 
   * Marks a recommendation as accepted by the ECP
   * 
   * Request body:
   * {
   *   tier: "BEST" | "BETTER" | "GOOD",
   *   customization?: string // Optional customization notes
   * }
   */
  app.put("/api/ai/recommendations/:id/accept", isAuthenticated, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const { tier, customization } = req.body;

      if (!tier) {
        return res.status(400).json({
          error: "Missing required field: tier",
        });
      }

      // Update recommendation status
      await AiEngineSynapse.updateRecommendationStatus(
        id,
        "accepted",
        { tier },
        customization
      );

      res.status(200).json({
        success: true,
        message: "Recommendation accepted",
      });
    } catch (error: any) {
      console.error("Error accepting recommendation:", error);
      res.status(500).json({
        error: "Update failed",
        message: error.message || "Failed to accept recommendation",
      });
    }
  });

  /**
   * GET /api/ai/catalog
   * 
   * Retrieves the authenticated ECP's product catalog
   */
  app.get("/api/ai/catalog", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const catalog = await EcpCatalogModel.getCatalog(userId);
      const stats = await EcpCatalogModel.getPriceStatistics(userId);

      res.status(200).json({
        success: true,
        data: {
          products: catalog,
          statistics: stats,
        },
      });
    } catch (error: any) {
      console.error("Error retrieving catalog:", error);
      res.status(500).json({
        error: "Retrieval failed",
        message: error.message || "Failed to retrieve catalog",
      });
    }
  });

  /**
   * GET /api/ai/catalog/search
   * 
   * Search ECP's catalog
   * 
   * Query params:
   * ?query=search term
   */
  app.get("/api/ai/catalog/search", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { query } = req.query;

      if (!query || typeof query !== "string") {
        return res.status(400).json({
          error: "Missing or invalid query parameter",
        });
      }

      const results = await EcpCatalogModel.searchProducts(userId, query);

      res.status(200).json({
        success: true,
        data: results,
      });
    } catch (error: any) {
      console.error("Error searching catalog:", error);
      res.status(500).json({
        error: "Search failed",
        message: error.message || "Failed to search catalog",
      });
    }
  });

  /**
   * POST /api/ai/test/seed-lims-data
   * 
   * Development endpoint to seed sample LIMS analytics data
   * Only available in development mode
   */
  app.post("/api/ai/test/seed-lims-data", async (req: any, res: Response) => {
    if (process.env.NODE_ENV !== "development") {
      return res.status(403).json({
        error: "Forbidden",
        message: "This endpoint is only available in development mode",
      });
    }

    try {
      // Seed some sample LIMS data for testing
      const sampleData = [
        {
          lensType: "Progressive",
          lensMaterial: "Polycarbonate",
          coating: "Premium AR",
          totalOrdersAnalyzed: 1250,
          nonAdaptCount: 95,
          remakeCount: 45,
          successRate: 0.888,
          nonAdaptRate: 0.076,
          remakeRate: 0.036,
        },
        {
          lensType: "Progressive",
          lensMaterial: "Trivex",
          coating: "Vantage-BlueGuard AR",
          totalOrdersAnalyzed: 850,
          nonAdaptCount: 51,
          remakeCount: 25,
          successRate: 0.911,
          nonAdaptRate: 0.06,
          remakeRate: 0.029,
        },
        {
          lensType: "Single Vision",
          lensMaterial: "CR-39",
          coating: "Standard AR",
          totalOrdersAnalyzed: 2100,
          nonAdaptCount: 147,
          remakeCount: 63,
          successRate: 0.90,
          nonAdaptRate: 0.07,
          remakeRate: 0.03,
        },
      ];

      for (const data of sampleData) {
        await LimsModel.recordOrderOutcome(
          data.lensType,
          data.lensMaterial,
          data.coating,
          "success"
        );
      }

      res.status(200).json({
        success: true,
        message: `Seeded ${sampleData.length} sample LIMS records`,
      });
    } catch (error: any) {
      console.error("Error seeding LIMS data:", error);
      res.status(500).json({
        error: "Seeding failed",
        message: error.message,
      });
    }
  });

  /**
   * POST /api/ai/test/analyze-sample
   * 
   * Development endpoint to test AI analysis with sample data
   * Only available in development mode
   */
  app.post("/api/ai/test/analyze-sample", async (req: any, res: Response) => {
    if (process.env.NODE_ENV !== "development") {
      return res.status(403).json({
        error: "Forbidden",
        message: "This endpoint is only available in development mode",
      });
    }

    try {
      const sampleRequest: AiAnalysisRequest = {
        orderId: "sample-order-" + Date.now(),
        ecpId: "test-ecp-id",
        prescription: {
          odSphere: "+1.50",
          odCylinder: "-1.00",
          odAxis: "090",
          odAdd: "+2.25",
          osSphere: "+1.50",
          osCylinder: "-0.75",
          osAxis: "095",
          osAdd: "+2.25",
        },
        clinicalNotes: {
          rawNotes:
            "Pt. is a first-time progressive wearer, works on computer 8+ hrs/day, reports eye strain. Complains of glare during night driving.",
          patientAge: 48,
          occupation: "Software Developer",
        },
        frameData: {
          wrapAngle: 6.5,
          type: "Full Frame",
        },
      };

      const recommendations = await AiEngineSynapse.analyzeOrder(sampleRequest);

      res.status(200).json({
        success: true,
        data: recommendations,
      });
    } catch (error: any) {
      console.error("Error in sample analysis:", error);
      res.status(500).json({
        error: "Analysis failed",
        message: error.message,
      });
    }
  });
}
