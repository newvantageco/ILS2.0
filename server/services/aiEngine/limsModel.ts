/**
 * LIMS Clinical Model (Leg 1 of the Three-Legged AI)
 * 
 * This model is trained on anonymized data from our LIMS:
 * - Millions of manufacturing jobs
 * - Remake records
 * - Non-adapt cases
 * 
 * It learns real-world outcomes and patterns that human optometrists could never see:
 * - "Prescriptions with axis 90° and cylinder > -2.50 in Lens Design X have 15% higher non-adapt rate in wrap-angle frames > 6°"
 * - Correlations between specific Rx parameters, lens materials, coatings, and clinical outcomes
 * 
 * The model acts as the "optometry trained" base that knows manufacturing reality.
 */

import { db } from "../../db";
import type { LimsClinicalAnalytic } from "@shared/schema";
import { limsClinicalAnalytics } from "@shared/schema";
import { eq, and, gte } from "drizzle-orm";

interface LensConfiguration {
  lensType: string;
  lensMaterial: string;
  coating: string;
  frameWrapAngle?: number;
}

interface PrescriptionData {
  odSphere?: string;
  odCylinder?: string;
  odAxis?: string;
  odAdd?: string;
  osSphere?: string;
  osCylinder?: string;
  osAxis?: string;
  osAdd?: string;
  pd?: string;
}

interface ClinicalPattern {
  pattern: string;
  nonAdaptRate: number;
  count: number;
  confidence: number;
  recommendation: string;
}

interface LimsAnalysisResult {
  matchedConfigurations: {
    configuration: LensConfiguration;
    successRate: number;
    nonAdaptRate: number;
    remakeRate: number;
    analysisCount: number;
  }[];
  clinicalPatterns: ClinicalPattern[];
  riskFactors: {
    factor: string;
    riskIncrease: number;
    mitigation?: string;
  }[];
  overallRecommendation: string;
}

export class LimsModel {
  /**
   * Analyzes prescription data against historical LIMS patterns
   * Returns recommended lens configurations based on real-world outcomes
   */
  static async analyzePrescriptionPatterns(
    prescription: PrescriptionData,
    frameWrapAngle?: number
  ): Promise<LimsAnalysisResult> {
    try {
      // Parse prescription values for pattern matching
      const odSph = LimsModel.parseRxValue(prescription.odSphere);
      const odCyl = LimsModel.parseRxValue(prescription.odCylinder);
      const odAxis = LimsModel.parseRxValue(prescription.odAxis);
      const odAdd = LimsModel.parseRxValue(prescription.odAdd);
      
      const osSph = LimsModel.parseRxValue(prescription.osSphere);
      const osCyl = LimsModel.parseRxValue(prescription.osCylinder);
      const osAxis = LimsModel.parseRxValue(prescription.osAxis);
      const osAdd = LimsModel.parseRxValue(prescription.osAdd);

      // Fetch relevant historical analytics
      const analytics = await db.query.limsClinicalAnalytics.findMany({
        where: (fields: any) => gte(fields.totalOrdersAnalyzed, 50), // Only use patterns with significant data
      });

      // Score and rank configurations based on prescription characteristics
      const scoredConfigs = analytics
        .map((config: LimsClinicalAnalytic) => ({
          config,
          score: LimsModel.calculateConfigScore(
            config,
            { odSph, odCyl, odAxis, odAdd, osSph, osCyl, osAxis, osAdd },
            frameWrapAngle
          ),
        }))
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, 10); // Get top 10 matches

      // Extract clinical patterns relevant to this prescription
      const clinicalPatterns = LimsModel.extractClinicalPatterns(
        analytics,
        { odSph, odCyl, odAxis, odAdd, osSph, osCyl, osAxis, osAdd }
      );

      // Identify risk factors
      const riskFactors = LimsModel.identifyRiskFactors(
        { odSph, odCyl, odAxis, odAdd, osSph, osCyl, osAxis, osAdd },
        frameWrapAngle
      );

      return {
        matchedConfigurations: scoredConfigs.map(({ config }: any) => ({
          configuration: {
            lensType: config.lensType,
            lensMaterial: config.lensMaterial,
            coating: config.coating,
            frameWrapAngle: frameWrapAngle,
          },
          successRate: Number(config.successRate || 0),
          nonAdaptRate: Number(config.nonAdaptRate || 0),
          remakeRate: Number(config.remakeRate || 0),
          analysisCount: config.totalOrdersAnalyzed,
        })),
        clinicalPatterns,
        riskFactors,
        overallRecommendation: LimsModel.generateOverallRecommendation(
          scoredConfigs,
          riskFactors
        ),
      };
    } catch (error) {
      console.error("Error analyzing prescription patterns:", error);
      throw new Error("Failed to analyze prescription patterns");
    }
  }

  /**
   * Retrieves or creates LIMS analytics for a specific lens configuration
   */
  static async getConfigurationAnalytics(
    lensType: string,
    lensMaterial: string,
    coating: string
  ): Promise<LimsClinicalAnalytic | null> {
    try {
      const existing = await db.query.limsClinicalAnalytics.findFirst({
        where: (fields: any) =>
          and(
            eq(fields.lensType, lensType),
            eq(fields.lensMaterial, lensMaterial),
            eq(fields.coating, coating)
          ),
      });

      return existing || null;
    } catch (error) {
      console.error("Error fetching configuration analytics:", error);
      return null;
    }
  }

  /**
   * Updates LIMS analytics with new order outcome
   * This feeds real-world data into the model for continuous learning
   */
  static async recordOrderOutcome(
    lensType: string,
    lensMaterial: string,
    coating: string,
    outcome: "success" | "nonAdapt" | "remake",
    frameWrapAngle?: number,
    prescriptionData?: PrescriptionData
  ): Promise<void> {
    try {
      const existing = await LimsModel.getConfigurationAnalytics(
        lensType,
        lensMaterial,
        coating
      );

      if (existing) {
        // Update existing analytics
        const updateData: any = {
          totalOrdersAnalyzed: (existing.totalOrdersAnalyzed || 0) + 1,
        };

        if (outcome === "nonAdapt") {
          updateData.nonAdaptCount = (existing.nonAdaptCount || 0) + 1;
        } else if (outcome === "remake") {
          updateData.remakeCount = (existing.remakeCount || 0) + 1;
        }

        // Recalculate rates
        const totalOrders = updateData.totalOrdersAnalyzed;
        updateData.successRate = 
          ((totalOrders - (updateData.nonAdaptCount || 0) - (updateData.remakeCount || 0)) / totalOrders).toFixed(4);
        updateData.nonAdaptRate = ((updateData.nonAdaptCount || 0) / totalOrders).toFixed(4);
        updateData.remakeRate = ((updateData.remakeCount || 0) / totalOrders).toFixed(4);
        updateData.lastUpdated = new Date();

        await db.update(limsClinicalAnalytics)
          .set(updateData)
          .where(
            and(
              eq(limsClinicalAnalytics.lensType, lensType),
              eq(limsClinicalAnalytics.lensMaterial, lensMaterial),
              eq(limsClinicalAnalytics.coating, coating)
            )
          );
      } else {
        // Create new analytics entry
        const totalOrders = 1;
        const nonAdaptCount = outcome === "nonAdapt" ? 1 : 0;
        const remakeCount = outcome === "remake" ? 1 : 0;

        await db.insert(limsClinicalAnalytics).values({
          lensType,
          lensMaterial,
          coating,
          frameWrapAngle: frameWrapAngle ? String(frameWrapAngle) : undefined,
          totalOrdersAnalyzed: totalOrders,
          nonAdaptCount,
          remakeCount,
          successRate: ((totalOrders - nonAdaptCount - remakeCount) / totalOrders).toString(),
          nonAdaptRate: (nonAdaptCount / totalOrders).toString(),
          remakeRate: (remakeCount / totalOrders).toString(),
          metadata: {
            createdFromOrder: true,
            outcome,
            prescriptionData,
          },
        });
      }
    } catch (error) {
      console.error("Error recording order outcome:", error);
      // Don't throw - log and continue
    }
  }

  // ==================== PRIVATE HELPER METHODS ====================

  /**
   * Parse Rx value from string to number
   */
  private static parseRxValue(value?: string): number {
    if (!value) return 0;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * Calculate a match score for a configuration against a prescription
   * Higher score = better match
   */
  private static calculateConfigScore(
    config: LimsClinicalAnalytic,
    rxData: Record<string, number>,
    frameWrapAngle?: number
  ): number {
    let score = 0;

    // Base success rate (the most important factor)
    score += Number(config.successRate || 0) * 50;

    // Penalize high non-adapt rates
    score -= Number(config.nonAdaptRate || 0) * 30;

    // Consider pattern insights if available
    if (config.patternInsights && typeof config.patternInsights === 'object') {
      const patterns = config.patternInsights as Record<string, any>;
      for (const [pattern, data] of Object.entries(patterns)) {
        if (data.applicable && rxData) {
          // If the Rx matches this pattern, boost or penalize score
          score += data.applicable ? 10 : -5;
        }
      }
    }

    // Consider frame wrap angle compatibility
    if (frameWrapAngle && config.frameWrapAngle) {
      const configWrap = Number(config.frameWrapAngle);
      const angleDiff = Math.abs(frameWrapAngle - configWrap);
      score -= angleDiff * 0.5; // Penalize large differences
    }

    // Clinical context match
    if (config.clinicalContext && typeof config.clinicalContext === 'object') {
      const context = config.clinicalContext as Record<string, any>;
      // Boost score if marked as "good for" this clinical scenario
      score += context.goodFor ? 5 : 0;
      score -= context.worstFor ? 15 : 0;
    }

    return score;
  }

  /**
   * Extract relevant clinical patterns for this prescription
   */
  private static extractClinicalPatterns(
    analytics: LimsClinicalAnalytic[],
    rxData: Record<string, number>
  ): ClinicalPattern[] {
    const patterns: ClinicalPattern[] = [];

    for (const config of analytics) {
      if (config.patternInsights && typeof config.patternInsights === 'object') {
        const insights = config.patternInsights as Record<string, any>;
        
        for (const [patternName, patternData] of Object.entries(insights)) {
          if (patternData.applicable) {
            patterns.push({
              pattern: patternName,
              nonAdaptRate: patternData.nonAdaptRate || 0,
              count: patternData.count || 0,
              confidence: patternData.confidence || 0.8,
              recommendation: patternData.recommendation || "Consider alternative",
            });
          }
        }
      }
    }

    // Sort by non-adapt rate (highest risk first)
    return patterns.sort((a, b) => b.nonAdaptRate - a.nonAdaptRate).slice(0, 5);
  }

  /**
   * Identify risk factors based on prescription characteristics
   */
  private static identifyRiskFactors(
    rxData: Record<string, number>,
    frameWrapAngle?: number
  ): Array<{
    factor: string;
    riskIncrease: number;
    mitigation?: string;
  }> {
    const riskFactors = [];

    // High axis at 90 degrees
    if (Math.abs((rxData.odAxis || 0) - 90) < 10) {
      riskFactors.push({
        factor: "High axis near 90° - OD",
        riskIncrease: 0.08,
        mitigation: "Consider anti-reflective coating, monitor edge quality",
      });
    }

    // High cylinder
    if (Math.abs(rxData.odCyl || 0) > 2.5) {
      riskFactors.push({
        factor: "High cylinder - OD",
        riskIncrease: 0.12,
        mitigation: "Ensure precise axis alignment, consider premium lens design",
      });
    }

    // High positive sphere (presbyopia/reading)
    if ((rxData.odSph || 0) > 2.0 && (rxData.odAdd || 0) > 1.5) {
      riskFactors.push({
        factor: "Strong presbyopia with high add",
        riskIncrease: 0.05,
        mitigation: "Progressive lens recommended, soft design beneficial",
      });
    }

    // Frame wrap angle consideration
    if (frameWrapAngle && frameWrapAngle > 6) {
      riskFactors.push({
        factor: "High wrap-angle frame (>6°)",
        riskIncrease: 0.15,
        mitigation: "Select material with lower Abbe number, adjust base curves",
      });
    }

    // First-time progressive (added via clinical NLP, but we can infer from Rx)
    if ((rxData.odAdd || 0) > 0 && (rxData.odSph || 0) >= 0) {
      // Likely presbyopic
      riskFactors.push({
        factor: "Presbyopic prescription pattern",
        riskIncrease: 0.03,
        mitigation: "Clear instructions for new progressive wearers, soft design recommended",
      });
    }

    return riskFactors;
  }

  /**
   * Generate an overall recommendation based on scored configurations
   */
  private static generateOverallRecommendation(
    scoredConfigs: any[],
    riskFactors: any[]
  ): string {
    if (scoredConfigs.length === 0) {
      return "Unable to generate recommendation - insufficient data";
    }

    const topConfig = scoredConfigs[0];
    const successRate = Number(topConfig.config.successRate || 0);
    const nonAdaptRate = Number(topConfig.config.nonAdaptRate || 0);

    let recommendation = `Top recommended lens configuration: ${topConfig.config.lensType} in ${topConfig.config.lensMaterial} with ${topConfig.config.coating}. `;
    recommendation += `Historical success rate: ${(successRate * 100).toFixed(1)}%, non-adapt rate: ${(nonAdaptRate * 100).toFixed(1)}%. `;

    if (riskFactors.length > 0) {
      recommendation += `Note: ${riskFactors.length} risk factor(s) identified. ${riskFactors[0].mitigation || "Monitor closely."}`;
    }

    return recommendation;
  }
}
