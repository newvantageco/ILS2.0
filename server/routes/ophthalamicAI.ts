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

import { Router, Request } from "express";
import { OphthalamicAIService } from "../services/OphthalamicAIService.js";
import { requireAuth } from "../middleware/auth.js";
import { createLogger } from "../utils/logger.js";

const router = Router();
const logger = createLogger('ophthalamicAI');

// Helper to get and validate companyId from request
const getCompanyId = (req: Request): string => {
  const companyId = req.user?.companyId;
  if (!companyId) {
    throw new Error('Company ID is required');
  }
  return companyId;
};

/**
 * @swagger
 * /api/ophthalmic-ai/query:
 *   post:
 *     summary: General ophthalmic AI query
 *     description: Ask general questions about optometry, eyecare, and optical practice management
 *     tags:
 *       - Ophthalmic AI
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - question
 *             properties:
 *               question:
 *                 type: string
 *                 description: The ophthalmic question to ask
 *                 example: "What is astigmatism and how is it corrected?"
 *               patientId:
 *                 type: string
 *                 description: Optional patient ID for context
 *               conversationHistory:
 *                 type: array
 *                 description: Previous conversation messages for context
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: AI-generated answer
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 answer:
 *                   type: string
 *                   description: AI response to the question
 *                 confidence:
 *                   type: number
 *                   description: Confidence score (0-1)
 *                 sources:
 *                   type: array
 *                   description: Referenced sources
 *                   items:
 *                     type: string
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/query", requireAuth, async (req, res) => {
  try {
    const companyId = getCompanyId(req);
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
    logger.error({ error, question, companyId }, 'AI Query Error');
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/ophthalmic-ai/lens-recommendations:
 *   post:
 *     summary: Get AI-powered lens recommendations
 *     description: |
 *       Get personalized lens recommendations based on prescription and lifestyle.
 *       Returns Good/Better/Best tier recommendations with detailed explanations.
 *     tags:
 *       - Ophthalmic AI
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prescriptionId
 *             properties:
 *               prescriptionId:
 *                 type: string
 *                 description: Patient's prescription ID
 *                 example: "rx-123abc"
 *               lifestyle:
 *                 type: object
 *                 description: Patient lifestyle information
 *                 properties:
 *                   occupation:
 *                     type: string
 *                     example: "Software Developer"
 *                   hobbies:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["reading", "sports"]
 *                   screenTime:
 *                     type: string
 *                     enum: [low, moderate, high]
 *                     example: "high"
 *     responses:
 *       200:
 *         description: Lens recommendations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 recommendations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       tier:
 *                         type: string
 *                         enum: [GOOD, BETTER, BEST]
 *                       lensType:
 *                         type: string
 *                         example: "Progressive Lenses"
 *                       lensMaterial:
 *                         type: string
 *                         example: "Polycarbonate"
 *                       coating:
 *                         type: string
 *                         example: "Premium AR + Blue Light"
 *                       features:
 *                         type: array
 *                         items:
 *                           type: string
 *                       reason:
 *                         type: string
 *                       estimatedPrice:
 *                         type: number
 *                 confidence:
 *                   type: number
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/lens-recommendations", requireAuth, async (req, res) => {
  try {
    const companyId = getCompanyId(req);
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
    logger.error({ error, prescriptionId, companyId }, 'Lens Recommendations Error');
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/ophthalmic-ai/contact-lens-recommendations:
 *   post:
 *     summary: Get contact lens recommendations
 *     description: Get AI-powered contact lens recommendations based on patient assessment
 *     tags:
 *       - Ophthalmic AI
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patientId
 *             properties:
 *               patientId:
 *                 type: string
 *                 description: Patient ID
 *                 example: "pat-456xyz"
 *               assessment:
 *                 type: object
 *                 description: Contact lens fitting assessment data
 *                 properties:
 *                   tearFilm:
 *                     type: string
 *                     enum: [dry, normal, excessive]
 *                   cornealCurvature:
 *                     type: object
 *                   wearingSchedule:
 *                     type: string
 *                     enum: [daily, weekly, monthly]
 *     responses:
 *       200:
 *         description: Contact lens recommendations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 recommendations:
 *                   type: array
 *                   items:
 *                     type: object
 *                 suitabilityScore:
 *                   type: number
 *                 warnings:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/contact-lens-recommendations", requireAuth, async (req, res) => {
  try {
    const companyId = getCompanyId(req);
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
    logger.error({ error, patientId, companyId }, 'Contact Lens Recommendations Error');
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/ophthalmic-ai/explain-prescription/{prescriptionId}:
 *   get:
 *     summary: Explain prescription to patient
 *     description: Get a patient-friendly explanation of their prescription in simple terms
 *     tags:
 *       - Ophthalmic AI
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: prescriptionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Prescription ID to explain
 *     responses:
 *       200:
 *         description: Prescription explanation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 explanation:
 *                   type: string
 *                   description: Simple explanation of the prescription
 *                 summary:
 *                   type: object
 *                   description: Key points about vision correction
 *                   properties:
 *                     condition:
 *                       type: string
 *                       example: "Moderate myopia with slight astigmatism"
 *                     whatItMeans:
 *                       type: string
 *                       example: "You are nearsighted with some blurriness"
 *                     howItHelps:
 *                       type: string
 *                       example: "Lenses will help you see clearly at distance"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Prescription not found
 *       500:
 *         description: Server error
 */
router.get("/explain-prescription/:prescriptionId", requireAuth, async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    const { prescriptionId } = req.params;

    const explanation = await OphthalamicAIService.explainPrescription(
      prescriptionId,
      companyId
    );

    res.json(explanation);
  } catch (error: any) {
    logger.error({ error, prescriptionId, companyId }, 'Prescription Explanation Error');
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/ophthalmic-ai/nhs-guidance/{patientId}:
 *   get:
 *     summary: Get NHS guidance for patient
 *     description: |
 *       Get AI-powered NHS guidance including voucher eligibility,
 *       exemptions, and claims assistance for UK optical practices
 *     tags:
 *       - Ophthalmic AI
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient ID
 *     responses:
 *       200:
 *         description: NHS guidance and eligibility information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 voucherEligibility:
 *                   type: object
 *                   properties:
 *                     eligible:
 *                       type: boolean
 *                     voucherType:
 *                       type: string
 *                       example: "GOS1"
 *                     voucherValue:
 *                       type: number
 *                     reason:
 *                       type: string
 *                 exemptions:
 *                   type: array
 *                   items:
 *                     type: object
 *                 claimsGuidance:
 *                   type: string
 *                   description: Step-by-step claims guidance
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Patient not found
 *       500:
 *         description: Server error
 */
router.get("/nhs-guidance/:patientId", requireAuth, async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    const { patientId } = req.params;

    const guidance = await OphthalamicAIService.getNhsGuidance(
      patientId,
      companyId
    );

    res.json(guidance);
  } catch (error: any) {
    logger.error({ error, patientId, companyId }, 'NHS Guidance Error');
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/ophthalmic-ai/business-insights:
 *   post:
 *     summary: Get business insights
 *     description: |
 *       Get AI-powered business insights and analytics for your optical practice.
 *       Analyzes trends, makes recommendations, and identifies opportunities.
 *     tags:
 *       - Ophthalmic AI
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 description: Business question or analysis request
 *                 example: "What are my best-selling lens types this quarter?"
 *     responses:
 *       200:
 *         description: Business insights and recommendations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 insights:
 *                   type: string
 *                   description: AI-generated insights
 *                 recommendations:
 *                   type: array
 *                   description: Actionable recommendations
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       impact:
 *                         type: string
 *                         enum: [low, medium, high]
 *                 metrics:
 *                   type: object
 *                   description: Relevant metrics and data points
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/business-insights", requireAuth, async (req, res) => {
  try {
    const companyId = getCompanyId(req);
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
    logger.error({ error, companyId, query }, 'Business Insights Error');
    res.status(500).json({ error: error.message });
  }
});

export default router;
