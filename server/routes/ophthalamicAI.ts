/**
 * Ophthalmic AI Assistant API Routes
 *
 * AI-powered assistance for optical practices:
 * - General ophthalmic queries
 * - Lens recommendations
 * - Contact lens recommendations
 * - Prescription explanations
 * - NHS guidance
 * - Business insights
 */

import { Router } from "express";
import { OphthalamicAIService } from "../services/OphthalamicAIService.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

/**
 * General AI query
 * POST /api/ophthalmic-ai/query
 */
router.post("/query", requireAuth, async (req, res) => {
  try {
    const { companyId } = req.user!;
    const { question, patientId, conversationHistory } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    const response = await OphthalamicAIService.query({
      question,
      context: {
        companyId,
        patientId,
        conversationHistory,
      },
    });

    res.json(response);
  } catch (error: any) {
    console.error("AI Query Error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get lens recommendations based on prescription
 * POST /api/ophthalmic-ai/lens-recommendations
 */
router.post("/lens-recommendations", requireAuth, async (req, res) => {
  try {
    const { companyId } = req.user!;
    const { prescriptionId, lifestyle } = req.body;

    if (!prescriptionId) {
      return res.status(400).json({ error: "prescriptionId is required" });
    }

    const recommendations = await OphthalamicAIService.getLensRecommendations(
      prescriptionId,
      companyId,
      lifestyle
    );

    res.json(recommendations);
  } catch (error: any) {
    console.error("Lens Recommendations Error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get contact lens recommendations
 * POST /api/ophthalmic-ai/contact-lens-recommendations
 */
router.post("/contact-lens-recommendations", requireAuth, async (req, res) => {
  try {
    const { companyId } = req.user!;
    const { patientId, assessment } = req.body;

    if (!patientId) {
      return res.status(400).json({ error: "patientId is required" });
    }

    const recommendations = await OphthalamicAIService.getContactLensRecommendations(
      patientId,
      companyId,
      assessment
    );

    res.json(recommendations);
  } catch (error: any) {
    console.error("Contact Lens Recommendations Error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Explain prescription to patient
 * GET /api/ophthalmic-ai/explain-prescription/:prescriptionId
 */
router.get("/explain-prescription/:prescriptionId", requireAuth, async (req, res) => {
  try {
    const { companyId } = req.user!;
    const { prescriptionId } = req.params;

    const explanation = await OphthalamicAIService.explainPrescription(
      prescriptionId,
      companyId
    );

    res.json(explanation);
  } catch (error: any) {
    console.error("Prescription Explanation Error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get NHS guidance for patient
 * GET /api/ophthalmic-ai/nhs-guidance/:patientId
 */
router.get("/nhs-guidance/:patientId", requireAuth, async (req, res) => {
  try {
    const { companyId } = req.user!;
    const { patientId } = req.params;

    const guidance = await OphthalamicAIService.getNhsGuidance(
      patientId,
      companyId
    );

    res.json(guidance);
  } catch (error: any) {
    console.error("NHS Guidance Error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get business insights
 * POST /api/ophthalmic-ai/business-insights
 */
router.post("/business-insights", requireAuth, async (req, res) => {
  try {
    const { companyId } = req.user!;
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: "query is required" });
    }

    const insights = await OphthalamicAIService.getBusinessInsights(
      companyId,
      query
    );

    res.json(insights);
  } catch (error: any) {
    console.error("Business Insights Error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
