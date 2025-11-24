/**
 * NLP Intent Model (Leg 2 of the Three-Legged AI)
 * 
 * This model processes unstructured clinical notes from optometrists
 * and extracts clinical intent using Natural Language Processing.
 * 
 * Example input:
 * "Pt. is a first-time progressive wearer, works on computer 8+ hrs/day,
 *  reports eye strain. Complains of glare during night driving."
 * 
 * Example output:
 * [first_time_pal], [CVS_syndrome], [night_glare_complaint]
 */

import { db } from "../../db";
import type { NlpClinicalAnalysis, InsertNlpClinicalAnalysis } from "@shared/schema";
import { nlpClinicalAnalysis, nlpIntentTagEnum } from "@shared/schema";
import { eq } from "drizzle-orm";
import logger from '../../utils/logger';


interface NlpExtractionResult {
  intentTags: Array<{
    tag: string;
    confidence: number;
  }>;
  patientLifestyle: string;
  patientComplaints: string[];
  clinicalFlags: string[];
  clinicalSummary: string;
  recommendedLensCharacteristics: Record<string, boolean>;
  overallConfidence: number;
}

export class NlpModel {
  /**
   * Analyzes clinical notes and extracts clinical intent using NLP patterns
   * This simulates advanced NLP processing that would typically use
   * a model like BERT, GPT, or specialized medical NLP model
   */
  static async analyzeClinicalnotes(
    clinicalNotes: string,
    orderId: string,
    patientAge?: number,
    occupation?: string
  ): Promise<NlpExtractionResult> {
    try {
      const notesLower = clinicalNotes.toLowerCase();

      // Extract intent tags using pattern matching and keyword detection
      const intentTags = NlpModel.extractIntentTags(notesLower, patientAge, occupation);
      const patientLifestyle = NlpModel.extractPatientLifestyle(notesLower);
      const patientComplaints = NlpModel.extractComplaints(notesLower);
      const clinicalFlags = NlpModel.extractClinicalFlags(notesLower);
      const recommendedLensCharacteristics = NlpModel.determineLensCharacteristics(
        intentTags,
        patientComplaints,
        clinicalFlags
      );

      // Calculate overall confidence
      const overallConfidence = NlpModel.calculateConfidence(
        intentTags,
        clinicalFlags
      );

      // Generate clinical summary
      const clinicalSummary = NlpModel.generateClinicalSummary(
        intentTags,
        patientLifestyle,
        patientComplaints,
        clinicalFlags
      );

      return {
        intentTags,
        patientLifestyle,
        patientComplaints,
        clinicalFlags,
        clinicalSummary,
        recommendedLensCharacteristics,
        overallConfidence,
      };
    } catch (error) {
      logger.error("Error analyzing clinical notes:", error);
      throw new Error("Failed to analyze clinical notes");
    }
  }

  /**
   * Saves NLP analysis to database for future reference and model improvement
   */
  static async saveAnalysis(
    orderId: string,
    rawNotes: string,
    analysis: NlpExtractionResult
  ): Promise<NlpClinicalAnalysis> {
    try {
      const result = await db.insert(nlpClinicalAnalysis).values({
        orderId,
        rawClinicalNotes: rawNotes,
        intentTags: analysis.intentTags,
        patientLifestyle: analysis.patientLifestyle,
        patientComplaints: analysis.patientComplaints,
        clinicalFlags: analysis.clinicalFlags,
        clinicalSummary: analysis.clinicalSummary,
        recommendedLensCharacteristics: analysis.recommendedLensCharacteristics,
        confidence: analysis.overallConfidence.toString(),
      } as InsertNlpClinicalAnalysis).returning();

      return result[0];
    } catch (error) {
      logger.error("Error saving NLP analysis:", error);
      throw new Error("Failed to save NLP analysis");
    }
  }

  /**
   * Retrieves stored analysis for an order
   */
  static async getAnalysis(orderId: string): Promise<NlpClinicalAnalysis | null> {
    try {
      const result = await db.query.nlpClinicalAnalysis.findFirst({
        where: (fields: any) => eq(fields.orderId, orderId),
      });
      return result || null;
    } catch (error) {
      logger.error("Error retrieving NLP analysis:", error);
      return null;
    }
  }

  // ==================== PRIVATE HELPER METHODS ====================

  /**
   * Extract clinical intent tags from notes using keyword patterns
   */
  private static extractIntentTags(
    notesLower: string,
    patientAge?: number,
    occupation?: string
  ): Array<{ tag: string; confidence: number }> {
    const tags: Array<{ tag: string; confidence: number }> = [];

    // Pattern matching for various clinical scenarios
    const patterns: Record<string, { keywords: string[]; confidence: number }> = {
      first_time_pal: {
        keywords: [
          "first-time progressive",
          "first time progressive",
          "first progressive",
          "new to progressive",
          "first pair of progressives",
        ],
        confidence: 0.95,
      },
      first_time_progressive: {
        keywords: [
          "first-time progressive",
          "first time progressive",
          "first progressive",
        ],
        confidence: 0.95,
      },
      cvs_syndrome: {
        keywords: [
          "computer vision syndrome",
          "cvs",
          "digital eye strain",
          "eye strain",
          "screen fatigue",
        ],
        confidence: 0.85,
      },
      computer_heavy_use: {
        keywords: [
          "computer",
          "works on computer",
          "screen",
          "monitor",
          "coding",
          "programming",
          "office work",
          "desk job",
          "hrs/day",
          "hours per day",
        ],
        confidence: 0.9,
      },
      night_driving_complaint: {
        keywords: [
          "night driving",
          "night glare",
          "glare at night",
          "driving at night",
          "nocturnal glare",
          "headlights",
        ],
        confidence: 0.9,
      },
      glare_complaint: {
        keywords: [
          "glare",
          "glare complaint",
          "light sensitive",
          "bright light",
          "photophobia",
          "halos",
        ],
        confidence: 0.85,
      },
      near_work_focus: {
        keywords: [
          "near work",
          "reading",
          "close work",
          "detailed work",
          "small print",
        ],
        confidence: 0.8,
      },
      occupational_hazard: {
        keywords: [
          "occupational",
          "workplace hazard",
          "chemical exposure",
          "dust",
          "uv exposure",
          "outdoor work",
        ],
        confidence: 0.8,
      },
      sports_activity: {
        keywords: [
          "sports",
          "athletic",
          "active lifestyle",
          "impact resistant",
          "playing",
          "recreation",
        ],
        confidence: 0.85,
      },
      high_prescription: {
        keywords: [
          "high rx",
          "high prescription",
          "high myopia",
          "severe myopia",
          "strong prescription",
        ],
        confidence: 0.9,
      },
      presbyopia_onset: {
        keywords: [
          "presbyopia",
          "presbyopic",
          "age-related",
          "over 40",
          "reading difficulty",
        ],
        confidence: 0.85,
      },
      astigmatism_high: {
        keywords: [
          "high astigmatism",
          "significant astigmatism",
          "severe astigmatism",
          "astigmatic",
        ],
        confidence: 0.9,
      },
      anisometropia: {
        keywords: [
          "anisometropia",
          "unequal prescription",
          "different rx",
          "one eye stronger",
        ],
        confidence: 0.9,
      },
      monovision_candidate: {
        keywords: [
          "monovision",
          "one eye for distance",
          "one eye for near",
        ],
        confidence: 0.9,
      },
      light_sensitive: {
        keywords: [
          "light sensitive",
          "photophobic",
          "light intolerant",
          "sensitive to light",
        ],
        confidence: 0.85,
      },
      blue_light_concern: {
        keywords: [
          "blue light",
          "blue light filter",
          "screen blue light",
        ],
        confidence: 0.9,
      },
      uv_protection_needed: {
        keywords: [
          "uv protection",
          "outdoor",
          "sun exposure",
          "beach",
          "uv sensitive",
        ],
        confidence: 0.85,
      },
      anti_reflective_needed: {
        keywords: [
          "anti-reflective",
          "ar coating",
          "anti reflection",
          "reflections",
        ],
        confidence: 0.9,
      },
      scratch_resistant_needed: {
        keywords: [
          "scratch resistant",
          "scratches",
          "durable",
          "active lifestyle",
          "wear resistant",
        ],
        confidence: 0.8,
      },
      impact_resistant_needed: {
        keywords: [
          "impact resistant",
          "safety",
          "polycarbonate",
          "shatter resistant",
          "safety glasses",
        ],
        confidence: 0.85,
      },
    };

    // Check each pattern
    for (const [tag, { keywords, confidence }] of Object.entries(patterns)) {
      for (const keyword of keywords) {
        if (notesLower.includes(keyword)) {
          // Check if this tag already exists (avoid duplicates)
          if (!tags.find((t) => t.tag === tag)) {
            tags.push({ tag, confidence });
          }
          break;
        }
      }
    }

    // Age-based inferences
    if (patientAge && patientAge >= 40) {
      if (!tags.find((t) => t.tag === "presbyopia_onset")) {
        tags.push({ tag: "presbyopia_onset", confidence: 0.7 });
      }
    }

    // Occupation-based inferences
    if (occupation) {
      const occLower = occupation.toLowerCase();
      if (
        (occLower.includes("computer") || occLower.includes("developer")) &&
        !tags.find((t) => t.tag === "cvs_syndrome")
      ) {
        tags.push({ tag: "cvs_syndrome", confidence: 0.75 });
      }
      if (
        (occLower.includes("outdoor") || occLower.includes("construction")) &&
        !tags.find((t) => t.tag === "uv_protection_needed")
      ) {
        tags.push({ tag: "uv_protection_needed", confidence: 0.8 });
      }
    }

    return tags;
  }

  /**
   * Extract patient lifestyle information
   */
  private static extractPatientLifestyle(notesLower: string): string {
    const lifestyleKeywords = {
      "Heavy computer use": ["computer", "screen", "monitor", "desk", "office"],
      "Outdoor activities": ["outdoor", "sports", "active", "hiking", "beach"],
      "Night driving": ["night driving", "driving at night", "nocturnal"],
      "Near work focused": [
        "reading",
        "detailed work",
        "close work",
        "precision",
      ],
      "Manual labor": ["construction", "manual", "trades", "labor"],
      "Occupational hazard":
        ["chemical", "dust", "uv", "industrial", "manufacturing"],
    };

    for (const [lifestyle, keywords] of Object.entries(lifestyleKeywords)) {
      for (const keyword of keywords) {
        if (notesLower.includes(keyword)) {
          return lifestyle;
        }
      }
    }

    return "General lifestyle";
  }

  /**
   * Extract patient complaints/symptoms
   */
  private static extractComplaints(notesLower: string): string[] {
    const complaints: string[] = [];

    const complaintPatterns = {
      "Eye strain": ["eye strain", "strain", "fatigue"],
      Glare: ["glare", "light sensitive", "photophobia"],
      "Blurred vision": ["blur", "blurred", "fuzzy"],
      Headaches: ["headache", "headaches", "migraine"],
      Astigmatism: ["astigmatism", "astigmatic"],
      Presbyopia: ["presbyopia", "difficulty reading", "near focus"],
      "Dry eyes": ["dry", "dryness", "irritation"],
      "Night vision issues": ["night vision", "nocturnal", "dark"],
    };

    for (const [complaint, keywords] of Object.entries(complaintPatterns)) {
      for (const keyword of keywords) {
        if (notesLower.includes(keyword) && !complaints.includes(complaint)) {
          complaints.push(complaint);
          break;
        }
      }
    }

    return complaints;
  }

  /**
   * Extract clinical flags (medical/clinical indicators)
   */
  private static extractClinicalFlags(notesLower: string): string[] {
    const flags: string[] = [];

    if (notesLower.includes("first") || notesLower.includes("new")) {
      flags.push("new_wearer");
    }
    if (notesLower.includes("high rx") || notesLower.includes("strong")) {
      flags.push("high_rx");
    }
    if (
      notesLower.includes("astigmatism") &&
      notesLower.includes("high")
    ) {
      flags.push("high_astigmatism");
    }
    if (notesLower.includes("presbyopia") || notesLower.includes("add")) {
      flags.push("presbyopic");
    }
    if (notesLower.includes("monovision")) {
      flags.push("monovision_candidate");
    }
    if (notesLower.includes("anisometropia") || notesLower.includes("different")) {
      flags.push("anisometropia");
    }

    return flags;
  }

  /**
   * Determine recommended lens characteristics based on extracted data
   */
  private static determineLensCharacteristics(
    intentTags: Array<{ tag: string; confidence: number }>,
    complaints: string[],
    flags: string[]
  ): Record<string, boolean> {
    const characteristics: Record<string, boolean> = {
      softDesign: false,
      blueLight: false,
      antiReflective: false,
      antiGlare: false,
      impact: false,
      scratchResistant: false,
      uvProtection: false,
      lightweight: false,
      premium: false,
    };

    // Based on tags
    const tagSet = new Set(intentTags.map((t) => t.tag));

    if (
      tagSet.has("first_time_progressive") ||
      tagSet.has("first_time_pal")
    ) {
      characteristics.softDesign = true; // Easier adaptation
      characteristics.premium = true; // Better materials for new wearers
    }

    if (
      tagSet.has("cvs_syndrome") ||
      tagSet.has("computer_heavy_use") ||
      tagSet.has("blue_light_concern")
    ) {
      characteristics.blueLight = true;
      characteristics.antiReflective = true;
    }

    if (
      tagSet.has("glare_complaint") ||
      tagSet.has("night_driving_complaint")
    ) {
      characteristics.antiGlare = true;
      characteristics.antiReflective = true;
    }

    if (
      tagSet.has("sports_activity") ||
      tagSet.has("occupational_hazard")
    ) {
      characteristics.impact = true;
      characteristics.scratchResistant = true;
    }

    if (tagSet.has("uv_protection_needed")) {
      characteristics.uvProtection = true;
    }

    if (tagSet.has("high_prescription")) {
      characteristics.lightweight = true; // Reduce lens thickness
    }

    // Based on complaints
    if (complaints.includes("Glare")) {
      characteristics.antiGlare = true;
      characteristics.antiReflective = true;
    }

    // Based on flags
    if (flags.includes("new_wearer")) {
      characteristics.softDesign = true;
    }

    if (flags.includes("high_rx")) {
      characteristics.lightweight = true;
      characteristics.premium = true;
    }

    return characteristics;
  }

  /**
   * Calculate overall confidence in the NLP analysis
   */
  private static calculateConfidence(
    intentTags: Array<{ tag: string; confidence: number }>,
    flags: string[]
  ): number {
    if (intentTags.length === 0) {
      return 0.5; // Low confidence if no tags found
    }

    // Average confidence of tags, boosted by flag presence
    const avgTagConfidence =
      intentTags.reduce((sum, t) => sum + t.confidence, 0) / intentTags.length;
    const flagBoost = Math.min(flags.length * 0.05, 0.15); // Max 0.15 boost

    return Math.min(avgTagConfidence + flagBoost, 1.0);
  }

  /**
   * Generate human-readable clinical summary
   */
  private static generateClinicalSummary(
    intentTags: Array<{ tag: string; confidence: number }>,
    patientLifestyle: string,
    complaints: string[],
    flags: string[]
  ): string {
    const summaryParts: string[] = [];

    // Add demographic/lifestyle info
    summaryParts.push(`Patient lifestyle: ${patientLifestyle}.`);

    // Add complaints
    if (complaints.length > 0) {
      summaryParts.push(`Reported complaints: ${complaints.join(", ")}.`);
    }

    // Add clinical impression
    if (flags.includes("new_wearer")) {
      summaryParts.push("Patient is a new progressive wearer.");
    }

    if (flags.includes("presbyopic")) {
      summaryParts.push(
        "Presbyopic prescription with significant near-work demands."
      );
    }

    if (flags.includes("high_astigmatism")) {
      summaryParts.push(
        "High astigmatism noted - careful axis alignment essential."
      );
    }

    // Add tag insights
    const highConfidenceTags = intentTags.filter((t) => t.confidence >= 0.85);
    if (highConfidenceTags.length > 0) {
      const tagNames = highConfidenceTags.map((t) => t.tag.replace(/_/g, " "));
      summaryParts.push(`Clinical indicators: ${tagNames.join(", ")}.`);
    }

    return summaryParts.join(" ");
  }
}
