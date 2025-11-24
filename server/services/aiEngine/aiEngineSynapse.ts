/**
 * AI Engine Synapse (The Three-Legged AI Fusion)
 * 
 * This is the "AI Dispensing Assistant" - the orchestrator that:
 * 1. Takes prescription Rx data
 * 2. Reads clinical notes (NLP model extracts intent)
 * 3. Queries LIMS for optimal lens/coating/material combinations
 * 4. Cross-references ECP's CSV catalog for pricing and availability
 * 5. Generates "Good, Better, Best" recommendations with full clinical justification
 */

import type {
  AiAnalysisRequest,
  AiRecommendationResponse,
  RecommendationTier,
  AiDispensingRecommendation as DbRecommendation,
} from "@shared/schema";
import { aiDispensingRecommendations } from "@shared/schema";
import { db } from "../../db";
import { LimsModel } from "./limsModel";
import { NlpModel } from "./nlpModel";
import { EcpCatalogModel } from "./ecpCatalogModel";
import { eq } from "drizzle-orm";
import logger from '../utils/logger';


interface RecommendationWithJustification {
  tier: "BEST" | "BETTER" | "GOOD";
  lens: {
    type: string;
    material: string;
    design: string;
  };
  coating: {
    name: string;
    features: string[];
  };
  retailPrice: number;
  matchScore: number;
  clinicalJustification: string;
  lifeStyleJustification: string;
  clinicalContext: Array<{
    tag: string;
    justification: string;
  }>;
  product?: {
    sku: string;
    name: string;
    inStock: boolean;
  };
}

export class AiEngineSynapse {
  /**
   * The main entry point for AI analysis
   * Orchestrates all three models to generate recommendations
   */
  static async analyzeOrder(
    request: AiAnalysisRequest
  ): Promise<AiRecommendationResponse> {
    try {
      // ===== LEG 2: Extract clinical intent from notes =====
      const nlpAnalysis = await NlpModel.analyzeClinicalnotes(
        request.clinicalNotes.rawNotes,
        request.orderId,
        request.clinicalNotes.patientAge,
        request.clinicalNotes.occupation
      );

      // Save NLP analysis
      const savedNlpAnalysis = await NlpModel.saveAnalysis(
        request.orderId,
        request.clinicalNotes.rawNotes,
        nlpAnalysis
      );

      // ===== LEG 1: Query LIMS for optimal configurations =====
      const limsAnalysis = await LimsModel.analyzePrescriptionPatterns(
        request.prescription,
        request.frameData?.wrapAngle
      );

      // ===== BUILD RECOMMENDATIONS =====
      // Score LIMS configurations based on NLP clinical characteristics
      const rankedConfigurations = AiEngineSynapse.rankConfigurationsByClinic(
        limsAnalysis.matchedConfigurations,
        nlpAnalysis
      );

      // ===== LEG 3: Match to ECP's catalog and pricing =====
      const tieredRecommendations = await AiEngineSynapse.buildTieredRecommendations(
        request.ecpId,
        rankedConfigurations,
        nlpAnalysis,
        request.prescription
      );

      // Calculate overall confidence
      const clinicalConfidenceScore =
        (nlpAnalysis.overallConfidence + limsAnalysis.matchedConfigurations[0]?.successRate || 0) / 2;

      // Save recommendations to database
      const savedRecommendations = await AiEngineSynapse.saveRecommendations(
        request.orderId,
        request.ecpId,
        savedNlpAnalysis.id,
        request.prescription,
        nlpAnalysis.intentTags,
        nlpAnalysis.clinicalSummary,
        tieredRecommendations,
        limsAnalysis,
        clinicalConfidenceScore
      );

      return {
        orderId: request.orderId,
        recommendations: tieredRecommendations,
        clinicalConfidenceScore,
        analysisMetadata: {
          nlpConfidence: nlpAnalysis.overallConfidence,
          limsMatchCount: limsAnalysis.matchedConfigurations.length,
          patternMatches: limsAnalysis.clinicalPatterns.map((p) => p.pattern),
        },
      };
    } catch (error) {
      logger.error("Error in AI Engine analysis:", error);
      throw new Error("Failed to generate recommendations");
    }
  }

  /**
   * Retrieve previously generated recommendations for an order
   */
  static async getRecommendations(
    orderId: string
  ): Promise<DbRecommendation | null> {
    try {
      const recommendations = await db.query.aiDispensingRecommendations.findFirst(
        {
          where: (fields: any) => eq(fields.orderId, orderId),
        }
      );
      return recommendations || null;
    } catch (error) {
      logger.error("Error retrieving recommendations:", error);
      return null;
    }
  }

  /**
   * Update recommendation status (e.g., when ECP accepts one)
   */
  static async updateRecommendationStatus(
    recommendationId: string,
    status: "accepted" | "rejected" | "customized",
    acceptedRecommendation?: any,
    customization?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        recommendationStatus: status,
        ...(acceptedRecommendation && {
          acceptedRecommation: acceptedRecommendation,
          acceptedAt: new Date(),
        }),
        ...(customization && {
          customizationApplied: customization,
          customizedAt: new Date(),
        }),
      };

      await db
        .update(aiDispensingRecommendations)
        .set(updateData)
        .where(eq(aiDispensingRecommendations.id, recommendationId));
    } catch (error) {
      logger.error("Error updating recommendation status:", error);
    }
  }

  // ==================== PRIVATE HELPER METHODS ====================

  /**
   * Rank LIMS configurations by how well they address clinical needs
   */
  private static rankConfigurationsByClinic(
    configurations: any[],
    nlpAnalysis: any
  ): any[] {
    return configurations.map((config) => {
      let clinicalScore = config.successRate;

      // Boost score if this configuration is marked as "good for" the patient's profile
      if (config.clinicalContext) {
        const tags = new Set(nlpAnalysis.intentTags.map((t: any) => t.tag));

        // Check if any clinical context keywords match NLP tags
        for (const contextTag of Object.keys(
          config.clinicalContext
        )) {
          if (tags.has(contextTag)) {
            clinicalScore += 0.1; // Boost for matched context
          }
        }
      }

      return {
        ...config,
        clinicalScore: Math.min(clinicalScore, 1.0),
      };
    });
  }

  /**
   * Build three-tiered (Good/Better/Best) recommendations
   */
  private static async buildTieredRecommendations(
    ecpId: string,
    rankedConfigurations: any[],
    nlpAnalysis: any,
    prescription: any
  ): Promise<RecommendationTier[]> {
    const recommendations: RecommendationTier[] = [];

    const tiers = ["BEST", "BETTER", "GOOD"] as const;
    const configsPerTier = 1; // Get one primary recommendation per tier

    for (let tierIdx = 0; tierIdx < tiers.length; tierIdx++) {
      const tier = tiers[tierIdx];
      const configIdx = tierIdx;

      if (configIdx >= rankedConfigurations.length) break;

      const config = rankedConfigurations[configIdx];

      // Find matching products in ECP's catalog
      const matchingProducts = await EcpCatalogModel.findMatchingProducts(
        ecpId,
        config.configuration.lensType,
        config.configuration.lensMaterial,
        config.configuration.coating,
        nlpAnalysis.recommendedLensCharacteristics
      );

      // Select best product for this tier
      const tieredProducts = matchingProducts.filter(
        (p) => p.tier === tier
      );
      const selectedProduct = tieredProducts[0] || matchingProducts[0];

      if (!selectedProduct) {
        continue; // Skip if no product found
      }

      // Generate clinical justification
      const clinicalJustification =
        AiEngineSynapse.generateClinicalJustification(
          tier,
          config,
          nlpAnalysis
        );

      // Generate lifestyle justification
      const lifeStyleJustification =
        AiEngineSynapse.generateLifestyleJustification(
          tier,
          selectedProduct.product,
          nlpAnalysis
        );

      // Map NLP tags to clinical context with justifications
      const clinicalContext = AiEngineSynapse.mapClinicaltags(
        nlpAnalysis.intentTags,
        config,
        prescription
      );

      const recommendation: RecommendationTier = {
        tier,
        lens: {
          type: config.configuration.lensType,
          material: config.configuration.lensMaterial,
          design: config.patternInsights?.design || "Standard",
        },
        coating: {
          name: config.configuration.coating,
          features: AiEngineSynapse.extractCoatingFeatures(
            config.configuration.coating,
            nlpAnalysis.recommendedLensCharacteristics
          ),
        },
        retailPrice: selectedProduct.retailPrice,
        matchScore: selectedProduct.matchScore,
        clinicalJustification,
        lifeStyleJustification,
        clinicalContext,
      };

      recommendations.push(recommendation);
    }

    return recommendations;
  }

  /**
   * Generate clinical justification for a recommendation
   */
  private static generateClinicalJustification(
    tier: "BEST" | "BETTER" | "GOOD",
    config: any,
    nlpAnalysis: any
  ): string {
    const parts: string[] = [];

    if (tier === "BEST") {
      parts.push(
        `This is our recommended solution based on your prescription and clinical needs.`
      );

      // Add success rate
      if (config.successRate) {
        parts.push(
          `Our LIMS data shows a ${(config.successRate * 100).toFixed(1)}% success rate with this configuration.`
        );
      }

      // Add specific clinical justifications
      if (nlpAnalysis.intentTags.some((t: any) => t.tag === "first_time_progressive")) {
        parts.push(
          `The soft-design lens reduces adaptation difficulty for progressive wearers - our data shows 30% better outcomes for first-time users.`
        );
      }

      if (nlpAnalysis.intentTags.some((t: any) => t.tag === "computer_heavy_use")) {
        parts.push(
          `The blue-light filtering coating reduces digital eye strain for computer users.`
        );
      }

      if (nlpAnalysis.intentTags.some((t: any) => t.tag === "night_driving_complaint")) {
        parts.push(
          `Premium anti-reflective coating provides 99.7% luminous transmission for optimal glare reduction.`
        );
      }
    } else if (tier === "BETTER") {
      parts.push(`This is an excellent alternative that fully meets your prescription needs.`);

      if (config.successRate) {
        parts.push(
          `Success rate: ${(config.successRate * 100).toFixed(1)}%.`
        );
      }

      if (config.remakeRate && config.remakeRate > 0) {
        parts.push(
          `Note: Historically ${(config.remakeRate * 100).toFixed(1)}% require remakes.`
        );
      }
    } else {
      parts.push(`This is a cost-effective option that meets your base prescription requirements.`);

      if (config.successRate) {
        parts.push(
          `Success rate: ${(config.successRate * 100).toFixed(1)}%.`
        );
      }

      parts.push(`Trade-offs: May not include all premium features.`);
    }

    return parts.join(" ");
  }

  /**
   * Generate lifestyle-based justification
   */
  private static generateLifestyleJustification(
    tier: "BEST" | "BETTER" | "GOOD",
    product: any,
    nlpAnalysis: any
  ): string {
    const parts: string[] = [];

    if (nlpAnalysis.patientLifestyle.includes("computer")) {
      parts.push(
        `For your computer-heavy work: ${tier === "BEST" ? "Blue-light filter reduces strain" : "Provides good screen visibility"}.`
      );
    }

    if (
      nlpAnalysis.patientComplaints.includes("Glare") ||
      nlpAnalysis.intentTags.some((t: any) => t.tag === "night_driving_complaint")
    ) {
      parts.push(
        `For your glare concerns: ${tier === "BEST" ? "Premium AR coating offers maximum glare reduction" : "Standard AR coating reduces glare"}.`
      );
    }

    if (nlpAnalysis.patientComplaints.includes("Eye strain")) {
      parts.push(
        `For eye strain relief: ${tier === "BEST" ? "Optimized design + coating minimizes fatigue" : "Provides adequate relief"}.`
      );
    }

    return parts.join(" ") || "Suitable for your lifestyle and needs.";
  }

  /**
   * Map NLP intent tags to clinical context with explanations
   */
  private static mapClinicaltags(
    tags: Array<{ tag: string; confidence: number }>,
    config: any,
    prescription: any
  ): Array<{ tag: string; justification: string }> {
    return tags
      .filter((t) => t.confidence >= 0.75) // Only high-confidence tags
      .map((t) => {
        let justification = "";

        switch (t.tag) {
          case "first_time_progressive":
            justification =
              "Soft-design lens with wider intermediate zone reduces adaptation period";
            break;
          case "computer_heavy_use":
            justification =
              "Blue-light filter reduces digital eye strain and supports 8+ hrs/day screen time";
            break;
          case "night_driving_complaint":
            justification =
              "Premium AR coating (99.7% transmission) eliminates headlight glare";
            break;
          case "cvs_syndrome":
            justification =
              "Anti-reflective + blue-light combination targets screen-induced fatigue";
            break;
          case "high_astigmatism":
            justification =
              "Precise manufacturing ensures accurate cylinder axis alignment";
            break;
          default:
            justification = `Clinical factor: ${t.tag.replace(/_/g, " ")}`;
        }

        return {
          tag: t.tag,
          justification,
        };
      });
  }

  /**
   * Extract coating features from coating name
   */
  private static extractCoatingFeatures(
    coatingName: string,
    recommendedCharacteristics: Record<string, boolean>
  ): string[] {
    const features: string[] = [];
    const lowerCoating = coatingName.toLowerCase();

    if (lowerCoating.includes("blue") || recommendedCharacteristics.blueLight) {
      features.push("Blue-Light Filter");
    }
    if (lowerCoating.includes("anti") || lowerCoating.includes("ar")) {
      features.push("Anti-Reflective");
    }
    if (lowerCoating.includes("scratch")) {
      features.push("Scratch-Resistant");
    }
    if (lowerCoating.includes("uv")) {
      features.push("UV Protection");
    }
    if (
      lowerCoating.includes("premium") &&
      recommendedCharacteristics.antiGlare
    ) {
      features.push("Premium Anti-Glare");
    }
    if (lowerCoating.includes("hydrophobic")) {
      features.push("Water-Resistant");
    }

    return features.length > 0 ? features : ["Standard Coating"];
  }

  /**
   * Save recommendations to database
   */
  private static async saveRecommendations(
    orderId: string,
    ecpId: string,
    nlpAnalysisId: string,
    prescription: any,
    intentTags: any[],
    clinicalSummary: string,
    recommendations: RecommendationTier[],
    limsAnalysis: any,
    confidenceScore: number
  ): Promise<any> {
    try {
      const result = await db
        .insert(aiDispensingRecommendations)
        .values({
          orderId,
          ecpId,
          nlpAnalysisId,
          rxData: prescription,
          clinicalIntentTags: intentTags,
          clinicalNotesSummary: clinicalSummary,
          recommendations: recommendations,
          limsPatternMatch: {
            topConfig: limsAnalysis.matchedConfigurations[0],
            riskFactors: limsAnalysis.riskFactors,
          },
          clinicalConfidenceScore: confidenceScore.toString(),
        })
        .returning();

      return result[0];
    } catch (error) {
      logger.error("Error saving recommendations:", error);
      throw error;
    }
  }
}
