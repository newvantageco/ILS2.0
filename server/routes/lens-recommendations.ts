/**
 * Intelligent Lens Recommendation API Routes
 */

import express from "express";
import { intelligentLensRecommendationService } from "../services/recommendations/IntelligentLensRecommendationService.js";
import { authenticateUser } from "../middleware/auth.js";
import { createLogger } from "../utils/logger.js";

const router = express.Router();
const logger = createLogger('lens-recommendations');

/**
 * Get lens recommendations for a patient
 * GET /api/lens-recommendations/:patientId
 */
router.get("/:patientId", authenticateUser, async (req, res) => {
  try {
    const { patientId } = req.params;

    const recommendations = await intelligentLensRecommendationService.getRecommendationsForPatient(
      patientId
    );

    res.json({ recommendations });
  } catch (error: any) {
    logger.error({ error }, 'Error generating recommendations');
    res.status(500).json({ error: error.message || "Failed to generate recommendations" });
  }
});

/**
 * Generate recommendations from prescription data
 * POST /api/lens-recommendations/generate
 */
router.post("/generate", authenticateUser, async (req, res) => {
  try {
    const { prescription, lifestyle, age, budget } = req.body;

    if (!prescription || !lifestyle || !age) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const recommendations = await intelligentLensRecommendationService.generateRecommendations(
      prescription,
      lifestyle,
      age,
      budget
    );

    res.json({ recommendations });
  } catch (error: any) {
    logger.error({ error }, 'Error generating recommendations');
    res.status(500).json({ error: error.message || "Failed to generate recommendations" });
  }
});

export default router;
