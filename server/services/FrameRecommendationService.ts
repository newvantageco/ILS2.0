/**
 * FrameRecommendationService
 *
 * Intelligent frame recommendation engine that matches frames to face shapes.
 * Uses a combination of rule-based algorithms and AI learning.
 *
 * Frame Recommendation Rules (Optician Best Practices):
 *
 * OVAL FACE (Balanced, ideal proportions):
 * - Lucky! Most frame styles work
 * - Best: Geometric, rectangular, or slightly angular frames
 * - Avoid: None, but oversized frames can overwhelm
 *
 * ROUND FACE (Soft curves, full cheeks):
 * - Best: Angular, rectangular, square frames (add definition)
 * - Avoid: Round frames (emphasize roundness)
 * - Goal: Create length and angles
 *
 * SQUARE FACE (Strong jawline, angular):
 * - Best: Round, oval, cat-eye frames (soften angles)
 * - Avoid: Square, rectangular frames (too harsh)
 * - Goal: Soften sharp features
 *
 * HEART FACE (Wide forehead, narrow chin):
 * - Best: Bottom-heavy frames, aviators, cat-eye
 * - Avoid: Top-heavy or overly decorative top bars
 * - Goal: Balance width at bottom
 *
 * DIAMOND FACE (Narrow forehead/jaw, wide cheeks):
 * - Best: Oval, cat-eye, rimless, frames with detailing
 * - Avoid: Narrow frames
 * - Goal: Highlight eyes, soften cheekbones
 *
 * OBLONG FACE (Long and narrow):
 * - Best: Large, round, or geometric frames with depth
 * - Avoid: Small, narrow frames
 * - Goal: Add width, shorten appearance
 *
 * TRIANGLE FACE (Narrow forehead, wide jaw):
 * - Best: Cat-eye, top-heavy frames, semi-rimless
 * - Avoid: Bottom-heavy frames
 * - Goal: Add width at top
 */

import { db } from "../../db/index.js";
import {
  frameRecommendations,
  frameCharacteristics,
  products,
  patientFaceAnalysis,
  frameRecommendationAnalytics,
} from "../../shared/schema.js";
import { eq, and, desc, inArray, sql } from "drizzle-orm";

// Frame style compatibility matrix
const FACE_FRAME_COMPATIBILITY: Record<
  string,
  {
    best: string[];
    good: string[];
    avoid: string[];
  }
> = {
  oval: {
    best: ["rectangle", "square", "geometric", "wayfarer", "browline"],
    good: ["round", "oval", "cat_eye", "aviator"],
    avoid: [], // Oval works with most styles
  },
  round: {
    best: ["rectangle", "square", "geometric", "wayfarer"],
    good: ["browline", "cat_eye", "aviator"],
    avoid: ["round"],
  },
  square: {
    best: ["round", "oval", "cat_eye", "aviator"],
    good: ["rimless", "semi_rimless"],
    avoid: ["square", "rectangle", "geometric"],
  },
  heart: {
    best: ["aviator", "cat_eye", "round", "oval"],
    good: ["rimless", "semi_rimless"],
    avoid: ["browline"], // Top-heavy styles
  },
  diamond: {
    best: ["oval", "cat_eye", "rimless", "semi_rimless"],
    good: ["round", "geometric"],
    avoid: ["rectangle"], // Too narrow
  },
  oblong: {
    best: ["round", "geometric", "aviator", "wrap"],
    good: ["square", "wayfarer"],
    avoid: ["rectangle"], // Makes face look longer
  },
  triangle: {
    best: ["cat_eye", "browline", "semi_rimless"],
    good: ["aviator", "round"],
    avoid: ["rectangle", "square"], // Bottom-heavy
  },
};

export interface RecommendationOptions {
  limit?: number;
  minMatchScore?: number;
  includeOutOfStock?: boolean;
  priceRange?: {
    min?: number;
    max?: number;
  };
  styles?: string[];
  materials?: string[];
  gender?: string;
}

export interface FrameRecommendation {
  id: string;
  product: any;
  characteristics: any;
  matchScore: number;
  matchReason: string;
  rank: number;
}

export class FrameRecommendationService {
  /**
   * Generate frame recommendations for a patient based on face analysis
   */
  static async generateRecommendations(
    faceAnalysisId: string,
    companyId: string,
    options: RecommendationOptions = {}
  ): Promise<FrameRecommendation[]> {
    const {
      limit = 10,
      minMatchScore = 50,
      includeOutOfStock = false,
      priceRange,
      styles,
      materials,
      gender,
    } = options;

    // 1. Get face analysis
    const [analysis] = await db
      .select()
      .from(patientFaceAnalysis)
      .where(
        and(
          eq(patientFaceAnalysis.id, faceAnalysisId),
          eq(patientFaceAnalysis.companyId, companyId)
        )
      )
      .limit(1);

    if (!analysis) {
      throw new Error("Face analysis not found");
    }

    // 2. Get all frame products with characteristics
    const framesQuery = db
      .select({
        product: products,
        characteristics: frameCharacteristics,
      })
      .from(products)
      .innerJoin(frameCharacteristics, eq(products.id, frameCharacteristics.productId))
      .where(
        and(
          eq(products.companyId, companyId),
          eq(products.isActive, true),
          eq(products.category, "frames")
        )
      );

    const frames = await framesQuery;

    if (frames.length === 0) {
      return [];
    }

    // 3. Score each frame
    const scoredFrames = frames
      .map((frame) => {
        const { product, characteristics } = frame;
        const score = this.calculateMatchScore(analysis.faceShape, characteristics);

        // Apply filters
        if (score.matchScore < minMatchScore) return null;
        if (!includeOutOfStock && product.stockQuantity === 0) return null;
        if (priceRange?.min && parseFloat(product.unitPrice) < priceRange.min) return null;
        if (priceRange?.max && parseFloat(product.unitPrice) > priceRange.max) return null;
        if (styles && !styles.includes(characteristics.frameStyle)) return null;
        if (materials && !materials.includes(characteristics.frameMaterial)) return null;
        if (gender && characteristics.gender !== gender && characteristics.gender !== "unisex")
          return null;

        return {
          id: crypto.randomUUID(),
          product,
          characteristics,
          matchScore: score.matchScore,
          matchReason: score.matchReason,
          rank: 0, // Will be set after sorting
        };
      })
      .filter((item): item is FrameRecommendation => item !== null);

    // 4. Sort by match score (descending)
    scoredFrames.sort((a, b) => b.matchScore - a.matchScore);

    // 5. Assign ranks
    scoredFrames.forEach((frame, index) => {
      frame.rank = index + 1;
    });

    // 6. Limit results
    return scoredFrames.slice(0, limit);
  }

  /**
   * Calculate match score for a frame based on face shape
   */
  private static calculateMatchScore(
    faceShape: string,
    characteristics: any
  ): { matchScore: number; matchReason: string } {
    const compatibility = FACE_FRAME_COMPATIBILITY[faceShape];
    if (!compatibility) {
      return {
        matchScore: 50,
        matchReason: "Universal style that works with most face shapes",
      };
    }

    const frameStyle = characteristics.frameStyle;
    let baseScore = 50; // Starting score
    let reason = "";

    // Check if in best match
    if (compatibility.best.includes(frameStyle)) {
      baseScore = 90;
      reason = this.getMatchReason(faceShape, frameStyle, "best");
    }
    // Check if in good match
    else if (compatibility.good.includes(frameStyle)) {
      baseScore = 75;
      reason = this.getMatchReason(faceShape, frameStyle, "good");
    }
    // Check if in avoid list
    else if (compatibility.avoid.includes(frameStyle)) {
      baseScore = 30;
      reason = this.getMatchReason(faceShape, frameStyle, "avoid");
    }
    // Neutral
    else {
      baseScore = 60;
      reason = "Compatible style that complements your face shape";
    }

    // Adjust score based on additional factors
    const adjustments: string[] = [];

    // Popularity bonus (max +5)
    const popularityBonus = Math.min(parseFloat(characteristics.popularityScore || "0") / 20, 5);
    baseScore += popularityBonus;
    if (popularityBonus > 2) {
      adjustments.push("popular choice");
    }

    // Material bonus
    if (["titanium", "carbon_fiber"].includes(characteristics.frameMaterial)) {
      baseScore += 3;
      adjustments.push("premium material");
    }

    // Feature bonuses
    if (characteristics.isAdjustable) {
      baseScore += 2;
      adjustments.push("adjustable fit");
    }

    // Cap at 100
    baseScore = Math.min(baseScore, 100);

    // Add adjustments to reason
    if (adjustments.length > 0) {
      reason += ` Plus: ${adjustments.join(", ")}.`;
    }

    return {
      matchScore: Math.round(baseScore),
      matchReason: reason,
    };
  }

  /**
   * Get human-readable match reason
   */
  private static getMatchReason(
    faceShape: string,
    frameStyle: string,
    matchType: "best" | "good" | "avoid"
  ): string {
    const reasons: Record<string, Record<string, string>> = {
      oval: {
        best: `${this.formatStyle(frameStyle)} frames add definition to your balanced features.`,
        good: `${this.formatStyle(frameStyle)} frames complement your versatile face shape.`,
      },
      round: {
        best: `${this.formatStyle(frameStyle)} frames add angles and length to your soft features.`,
        good: `${this.formatStyle(frameStyle)} frames provide subtle definition.`,
        avoid: `${this.formatStyle(frameStyle)} frames may emphasize roundness.`,
      },
      square: {
        best: `${this.formatStyle(frameStyle)} frames soften your strong, angular features beautifully.`,
        good: `${this.formatStyle(frameStyle)} frames balance your face shape nicely.`,
        avoid: `${this.formatStyle(frameStyle)} frames may be too angular for your face.`,
      },
      heart: {
        best: `${this.formatStyle(frameStyle)} frames balance your wider forehead with your delicate chin.`,
        good: `${this.formatStyle(frameStyle)} frames complement your heart-shaped features.`,
        avoid: `${this.formatStyle(frameStyle)} frames may draw too much attention to the forehead.`,
      },
      diamond: {
        best: `${this.formatStyle(frameStyle)} frames highlight your eyes and balance your unique features.`,
        good: `${this.formatStyle(frameStyle)} frames work well with your distinct face shape.`,
        avoid: `${this.formatStyle(frameStyle)} frames may be too narrow for your features.`,
      },
      oblong: {
        best: `${this.formatStyle(frameStyle)} frames add width and balance to your elegant long face.`,
        good: `${this.formatStyle(frameStyle)} frames complement your face proportions.`,
        avoid: `${this.formatStyle(frameStyle)} frames may make your face appear longer.`,
      },
      triangle: {
        best: `${this.formatStyle(frameStyle)} frames balance your strong jawline by adding width at the top.`,
        good: `${this.formatStyle(frameStyle)} frames work nicely with your face shape.`,
        avoid: `${this.formatStyle(frameStyle)} frames may emphasize the jaw area too much.`,
      },
    };

    return reasons[faceShape]?.[matchType] || "Compatible with your face shape.";
  }

  /**
   * Format frame style name for display
   */
  private static formatStyle(style: string): string {
    const formatted = style
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    return formatted;
  }

  /**
   * Save recommendations to database
   */
  static async saveRecommendations(
    recommendations: FrameRecommendation[],
    faceAnalysisId: string,
    patientId: string,
    companyId: string
  ) {
    if (recommendations.length === 0) return [];

    const values = recommendations.map((rec) => ({
      faceAnalysisId,
      patientId,
      productId: rec.product.id,
      companyId,
      matchScore: rec.matchScore.toString(),
      matchReason: rec.matchReason,
      rank: rec.rank,
    }));

    return await db.insert(frameRecommendations).values(values).returning();
  }

  /**
   * Get recommendations for a patient
   */
  static async getRecommendations(faceAnalysisId: string, companyId: string) {
    return await db
      .select({
        recommendation: frameRecommendations,
        product: products,
        characteristics: frameCharacteristics,
      })
      .from(frameRecommendations)
      .innerJoin(products, eq(frameRecommendations.productId, products.id))
      .leftJoin(frameCharacteristics, eq(products.id, frameCharacteristics.productId))
      .where(
        and(
          eq(frameRecommendations.faceAnalysisId, faceAnalysisId),
          eq(frameRecommendations.companyId, companyId)
        )
      )
      .orderBy(frameRecommendations.rank);
  }

  /**
   * Track user interaction (view, like, purchase, dismiss)
   */
  static async trackInteraction(
    recommendationId: string,
    interaction: "view" | "like" | "purchase" | "dismiss",
    companyId: string
  ) {
    const updates: any = {};

    switch (interaction) {
      case "view":
        updates.viewed = true;
        updates.viewedAt = new Date();
        updates.clickCount = sql`${frameRecommendations.clickCount} + 1`;
        break;
      case "like":
        updates.liked = true;
        updates.likedAt = new Date();
        break;
      case "purchase":
        updates.purchased = true;
        updates.purchasedAt = new Date();
        break;
      case "dismiss":
        updates.dismissed = true;
        updates.dismissedAt = new Date();
        break;
    }

    await db
      .update(frameRecommendations)
      .set(updates)
      .where(
        and(
          eq(frameRecommendations.id, recommendationId),
          eq(frameRecommendations.companyId, companyId)
        )
      );
  }

  /**
   * Get recommendation analytics for a product
   */
  static async getProductAnalytics(productId: string, companyId: string) {
    const recs = await db
      .select()
      .from(frameRecommendations)
      .where(
        and(
          eq(frameRecommendations.productId, productId),
          eq(frameRecommendations.companyId, companyId)
        )
      );

    const total = recs.length;
    const views = recs.filter((r) => r.viewed).length;
    const likes = recs.filter((r) => r.liked).length;
    const purchases = recs.filter((r) => r.purchased).length;
    const dismissals = recs.filter((r) => r.dismissed).length;

    return {
      totalRecommendations: total,
      totalViews: views,
      totalLikes: likes,
      totalPurchases: purchases,
      totalDismissals: dismissals,
      viewRate: total > 0 ? ((views / total) * 100).toFixed(2) : "0",
      likeRate: views > 0 ? ((likes / views) * 100).toFixed(2) : "0",
      purchaseRate: views > 0 ? ((purchases / views) * 100).toFixed(2) : "0",
      dismissalRate: views > 0 ? ((dismissals / views) * 100).toFixed(2) : "0",
      avgMatchScore:
        total > 0
          ? (recs.reduce((sum, r) => sum + parseFloat(r.matchScore), 0) / total).toFixed(2)
          : "0",
    };
  }
}
