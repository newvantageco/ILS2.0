/**
 * Face Analysis & Frame Recommendation API Routes
 *
 * Endpoints:
 * POST   /api/face-analysis/analyze        - Analyze face photo
 * GET    /api/face-analysis/:patientId     - Get patient's latest analysis
 * GET    /api/face-analysis/:patientId/history - Get analysis history
 * DELETE /api/face-analysis/:analysisId    - Delete analysis
 *
 * POST   /api/frame-recommendations/generate - Generate recommendations
 * GET    /api/frame-recommendations/:faceAnalysisId - Get recommendations
 * POST   /api/frame-recommendations/:id/track - Track interaction
 * GET    /api/frame-recommendations/analytics/:productId - Get product analytics
 */

import express, { Request, Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { FaceAnalysisService } from "../services/FaceAnalysisService.js";
import { FrameRecommendationService } from "../services/FrameRecommendationService.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../uploads/face-photos");
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "face-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files (JPEG, PNG, WebP) are allowed!"));
    }
  },
});

// ============== FACE ANALYSIS ENDPOINTS ==============

/**
 * POST /api/face-analysis/analyze
 * Analyze a face photo and return face shape + recommendations
 */
router.post(
  "/analyze",
  requireAuth,
  upload.single("photo"),
  async (req: Request, res: Response) => {
    try {
      const { patientId } = req.body;
      const user = (req as any).user;
      const companyId = user.companyId;

      if (!patientId) {
        return res.status(400).json({ error: "Patient ID is required" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "Photo is required" });
      }

      // Convert uploaded file to data URL for AI processing
      const photoBuffer = fs.readFileSync(req.file.path);
      const photoBase64 = photoBuffer.toString("base64");
      const photoDataUrl = `data:${req.file.mimetype};base64,${photoBase64}`;

      // Analyze face
      const analysis = await FaceAnalysisService.analyzeFacePhoto(photoDataUrl, {
        patientId,
        companyId,
      });

      // Save to database
      const photoUrl = `/uploads/face-photos/${req.file.filename}`;
      const savedAnalysis = await FaceAnalysisService.saveFaceAnalysis({
        patientId,
        companyId,
        analysis,
        photoUrl,
      });

      // Generate frame recommendations
      const recommendations = await FrameRecommendationService.generateRecommendations(
        savedAnalysis.id,
        companyId,
        { limit: 12 }
      );

      // Save recommendations
      await FrameRecommendationService.saveRecommendations(
        recommendations,
        savedAnalysis.id,
        patientId,
        companyId
      );

      res.json({
        analysis: savedAnalysis,
        recommendations,
      });
    } catch (error: any) {
      console.error("Face analysis error:", error);
      res.status(500).json({ error: error.message || "Failed to analyze face" });
    }
  }
);

/**
 * GET /api/face-analysis/:patientId
 * Get latest face analysis for a patient
 */
router.get("/:patientId", requireAuth, async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const user = (req as any).user;
    const companyId = user.companyId;

    const analysis = await FaceAnalysisService.getLatestAnalysis(patientId, companyId);

    if (!analysis) {
      return res.status(404).json({ error: "No face analysis found for this patient" });
    }

    res.json(analysis);
  } catch (error: any) {
    console.error("Get analysis error:", error);
    res.status(500).json({ error: error.message || "Failed to get analysis" });
  }
});

/**
 * GET /api/face-analysis/:patientId/history
 * Get face analysis history for a patient
 */
router.get("/:patientId/history", requireAuth, async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const user = (req as any).user;
    const companyId = user.companyId;

    const history = await FaceAnalysisService.getPatientAnalysisHistory(patientId, companyId);

    res.json(history);
  } catch (error: any) {
    console.error("Get history error:", error);
    res.status(500).json({ error: error.message || "Failed to get history" });
  }
});

/**
 * DELETE /api/face-analysis/:analysisId
 * Delete a face analysis
 */
router.delete("/:analysisId", requireAuth, async (req: Request, res: Response) => {
  try {
    const { analysisId } = req.params;
    const user = (req as any).user;
    const companyId = user.companyId;

    await FaceAnalysisService.deleteAnalysis(analysisId, companyId);

    res.json({ message: "Analysis deleted successfully" });
  } catch (error: any) {
    console.error("Delete analysis error:", error);
    res.status(500).json({ error: error.message || "Failed to delete analysis" });
  }
});

// ============== FRAME RECOMMENDATION ENDPOINTS ==============

/**
 * POST /api/frame-recommendations/generate
 * Generate frame recommendations for a face analysis
 */
router.post("/recommendations/generate", requireAuth, async (req: Request, res: Response) => {
  try {
    const { faceAnalysisId, options } = req.body;
    const user = (req as any).user;
    const companyId = user.companyId;

    if (!faceAnalysisId) {
      return res.status(400).json({ error: "Face analysis ID is required" });
    }

    const recommendations = await FrameRecommendationService.generateRecommendations(
      faceAnalysisId,
      companyId,
      options || {}
    );

    res.json(recommendations);
  } catch (error: any) {
    console.error("Generate recommendations error:", error);
    res.status(500).json({ error: error.message || "Failed to generate recommendations" });
  }
});

/**
 * GET /api/frame-recommendations/:faceAnalysisId
 * Get frame recommendations for a face analysis
 */
router.get("/recommendations/:faceAnalysisId", requireAuth, async (req: Request, res: Response) => {
  try {
    const { faceAnalysisId } = req.params;
    const user = (req as any).user;
    const companyId = user.companyId;

    const recommendations = await FrameRecommendationService.getRecommendations(
      faceAnalysisId,
      companyId
    );

    res.json(recommendations);
  } catch (error: any) {
    console.error("Get recommendations error:", error);
    res.status(500).json({ error: error.message || "Failed to get recommendations" });
  }
});

/**
 * POST /api/frame-recommendations/:id/track
 * Track user interaction with a recommendation
 */
router.post("/recommendations/:id/track", requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { interaction } = req.body;
    const user = (req as any).user;
    const companyId = user.companyId;

    if (!["view", "like", "purchase", "dismiss"].includes(interaction)) {
      return res.status(400).json({ error: "Invalid interaction type" });
    }

    await FrameRecommendationService.trackInteraction(id, interaction, companyId);

    res.json({ message: "Interaction tracked successfully" });
  } catch (error: any) {
    console.error("Track interaction error:", error);
    res.status(500).json({ error: error.message || "Failed to track interaction" });
  }
});

/**
 * GET /api/frame-recommendations/analytics/:productId
 * Get recommendation analytics for a product
 */
router.get("/recommendations/analytics/:productId", requireAuth, async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const user = (req as any).user;
    const companyId = user.companyId;

    const analytics = await FrameRecommendationService.getProductAnalytics(productId, companyId);

    res.json(analytics);
  } catch (error: any) {
    console.error("Get analytics error:", error);
    res.status(500).json({ error: error.message || "Failed to get analytics" });
  }
});

export default router;
