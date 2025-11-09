/**
 * Intelligent Lens Recommendation Service
 *
 * Advanced lens recommendation engine that considers:
 * - Prescription values (sphere, cylinder, axis)
 * - Patient lifestyle and activities
 * - Visual requirements (computer work, driving, reading)
 * - Age and health conditions
 * - Budget and preferences
 * - Frame selection
 */

import { db } from "../../../db/index.js";
import { prescriptions, patients } from "../../../shared/schema.js";
import { eq, desc } from "drizzle-orm";

export interface PrescriptionData {
  odSphere: number;
  odCylinder: number;
  odAxis?: number;
  osSphere: number;
  osCylinder: number;
  osAxis?: number;
  addition?: number;
  pd?: number;
}

export interface LifestyleProfile {
  occupation: string;
  computerHoursPerDay: number;
  sportsActivities: string[];
  hobbies: string[];
  drivingFrequency: 'daily' | 'weekly' | 'occasional' | 'never';
  outdoorTime: number; // hours per day
  readingFrequency: 'heavy' | 'moderate' | 'light';
  specialRequirements: string[];
}

export interface LensRecommendation {
  lensType: string;
  lensDesign: string;
  coatings: string[];
  material: string;
  index: number;
  reasoning: string[];
  priority: 'essential' | 'recommended' | 'optional';
  estimatedPrice: string;
  benefits: string[];
}

export interface FrameConsideration {
  minCenterThickness: number;
  edgeThickness: number;
  recommendedFrameTypes: string[];
  frameSizeGuidance: string;
}

export class IntelligentLensRecommendationService {
  /**
   * Generate comprehensive lens recommendations
   */
  async generateRecommendations(
    prescriptionData: PrescriptionData,
    lifestyle: LifestyleProfile,
    age: number,
    budget?: { min: number; max: number }
  ): Promise<{
    recommendations: LensRecommendation[];
    frameConsiderations: FrameConsideration;
    summary: string;
  }> {
    const recommendations: LensRecommendation[] = [];

    // 1. Determine Primary Lens Type
    const lensType = this.determineLensType(prescriptionData, age);

    // 2. Analyze Prescription Complexity
    const prescriptionAnalysis = this.analyzePrescription(prescriptionData);

    // 3. Determine Optimal Lens Material & Index
    const materialRecommendation = this.recommendMaterial(prescriptionData, lifestyle);

    // 4. Recommend Coatings Based on Lifestyle
    const coatings = this.recommendCoatings(lifestyle, age);

    // 5. Recommend Lens Design
    const design = this.recommendLensDesign(prescriptionData, lifestyle, age);

    // Build primary recommendation
    recommendations.push({
      lensType: lensType.type,
      lensDesign: design.design,
      coatings: coatings.essential,
      material: materialRecommendation.material,
      index: materialRecommendation.index,
      reasoning: [
        ...lensType.reasoning,
        ...design.reasoning,
        ...materialRecommendation.reasoning,
      ],
      priority: 'essential',
      estimatedPrice: this.estimatePrice(materialRecommendation.index, coatings.essential, design.design),
      benefits: lensType.benefits,
    });

    // Add optional enhancement recommendations
    if (coatings.recommended.length > 0) {
      recommendations.push({
        lensType: lensType.type,
        lensDesign: design.design,
        coatings: [...coatings.essential, ...coatings.recommended],
        material: materialRecommendation.material,
        index: materialRecommendation.index,
        reasoning: ['Enhanced protection and comfort', ...coatings.recommendedReasons],
        priority: 'recommended',
        estimatedPrice: this.estimatePrice(
          materialRecommendation.index,
          [...coatings.essential, ...coatings.recommended],
          design.design
        ),
        benefits: ['All essential benefits', ...coatings.recommendedBenefits],
      });
    }

    // Frame considerations based on prescription
    const frameConsiderations = this.calculateFrameConsiderations(prescriptionData);

    // Generate summary
    const summary = this.generateSummary(prescriptionData, lifestyle, recommendations, age);

    return {
      recommendations,
      frameConsiderations,
      summary,
    };
  }

  /**
   * Determine if single vision, bifocal, or progressive
   */
  private determineLensType(rx: PrescriptionData, age: number): {
    type: string;
    reasoning: string[];
    benefits: string[];
  } {
    if (rx.addition && rx.addition > 0) {
      if (age >= 45 || rx.addition >= 1.0) {
        return {
          type: 'Progressive (Varifocal)',
          reasoning: [
            'Addition power detected, indicating presbyopia',
            `Age ${age} suggests need for reading correction`,
            'Progressive lenses provide smooth transition between distances',
          ],
          benefits: [
            'Natural vision at all distances',
            'No visible line on lens',
            'Youthful appearance',
            'Seamless transition from distance to near',
          ],
        };
      } else {
        return {
          type: 'Bifocal',
          reasoning: [
            'Low addition power detected',
            'Bifocals offer good value for basic near/distance needs',
          ],
          benefits: [
            'Clear distance and reading zones',
            'Cost-effective solution',
            'Easy to adapt to',
          ],
        };
      }
    }

    return {
      type: 'Single Vision',
      reasoning: [
        'No addition power - single distance correction needed',
        'Most versatile lens type for your prescription',
      ],
      benefits: [
        'Wide field of view',
        'Thinnest possible lens',
        'Most affordable option',
        'Suitable for all day wear',
      ],
    };
  }

  /**
   * Analyze prescription complexity
   */
  private analyzePrescription(rx: PrescriptionData): {
    complexity: 'low' | 'moderate' | 'high';
    features: string[];
  } {
    const maxSphere = Math.max(Math.abs(rx.odSphere), Math.abs(rx.osSphere));
    const maxCylinder = Math.max(Math.abs(rx.odCylinder), Math.abs(rx.osCylinder));

    if (maxSphere > 6 || maxCylinder > 2) {
      return {
        complexity: 'high',
        features: ['High prescription', 'Requires high-index lens', 'Edge thickness considerations'],
      };
    } else if (maxSphere > 3 || maxCylinder > 1) {
      return {
        complexity: 'moderate',
        features: ['Moderate prescription', 'Mid-index lens recommended', 'Standard thickness'],
      };
    }

    return {
      complexity: 'low',
      features: ['Low prescription', 'Standard lens options', 'Minimal thickness'],
    };
  }

  /**
   * Recommend optimal lens material and index
   */
  private recommendMaterial(rx: PrescriptionData, lifestyle: LifestyleProfile): {
    material: string;
    index: number;
    reasoning: string[];
  } {
    const maxSphere = Math.max(Math.abs(rx.odSphere), Math.abs(rx.osSphere));
    const activeSports = lifestyle.sportsActivities.length > 0;

    // High prescription or active lifestyle
    if (maxSphere > 6) {
      return {
        material: 'Polycarbonate',
        index: 1.74,
        reasoning: [
          'High-index 1.74 for maximum thinness with strong prescription',
          'Up to 50% thinner than standard lenses',
          'Lighter weight for comfort',
        ],
      };
    } else if (maxSphere > 4 || activeSports) {
      return {
        material: 'Polycarbonate',
        index: 1.67,
        reasoning: [
          activeSports
            ? 'Impact-resistant polycarbonate for sports safety'
            : 'High-index 1.67 balances thinness and value',
          'Approximately 35% thinner than standard',
          'Built-in UV protection',
        ],
      };
    } else if (maxSphere > 2) {
      return {
        material: 'CR-39 or Polycarbonate',
        index: 1.60,
        reasoning: [
          'Mid-index 1.60 ideal for moderate prescriptions',
          'Good balance of cost and cosmetics',
          '25% thinner than standard',
        ],
      };
    }

    // Low prescription
    if (activeSports || lifestyle.specialRequirements.includes('impact_resistance')) {
      return {
        material: 'Polycarbonate',
        index: 1.59,
        reasoning: [
          'Polycarbonate for impact resistance',
          'Ideal for active lifestyle',
          'Lightweight and safe',
        ],
      };
    }

    return {
      material: 'CR-39 (Standard Plastic)',
      index: 1.50,
      reasoning: [
        'Standard CR-39 suitable for low prescription',
        'Excellent optical clarity',
        'Most economical choice',
      ],
    };
  }

  /**
   * Recommend coatings based on lifestyle
   */
  private recommendCoatings(lifestyle: LifestyleProfile, age: number): {
    essential: string[];
    recommended: string[];
    recommendedReasons: string[];
    recommendedBenefits: string[];
  } {
    const essential: string[] = [];
    const recommended: string[] = [];
    const recommendedReasons: string[] = [];
    const recommendedBenefits: string[] = [];

    // Anti-reflective is always essential
    essential.push('Anti-Reflective (AR)');

    // Scratch resistance is always essential
    essential.push('Scratch-Resistant Hardcoat');

    // UV protection essential for outdoor exposure
    if (lifestyle.outdoorTime > 2) {
      essential.push('UV Protection');
    } else {
      recommended.push('UV Protection');
      recommendedReasons.push('Additional UV protection for eye health');
      recommendedBenefits.push('Protects eyes from harmful UV rays');
    }

    // Blue light filtering for screen work
    if (lifestyle.computerHoursPerDay >= 4) {
      essential.push('Blue Light Filter');
    } else if (lifestyle.computerHoursPerDay >= 2) {
      recommended.push('Blue Light Filter');
      recommendedReasons.push('Reduces digital eye strain from screen use');
      recommendedBenefits.push('Reduced eye fatigue', 'Better sleep quality');
    }

    // Water/oil repellent for active lifestyle
    if (lifestyle.sportsActivities.length > 0 || lifestyle.outdoorTime > 3) {
      recommended.push('Hydrophobic (Water-Repellent)');
      recommendedReasons.push('Easier cleaning for active lifestyle');
      recommendedBenefits.push('Water beads off', 'Less smudging');
    }

    // Anti-fog for sports
    if (lifestyle.sportsActivities.includes('cycling') || lifestyle.sportsActivities.includes('running')) {
      recommended.push('Anti-Fog');
      recommendedReasons.push('Prevents fogging during physical activity');
      recommendedBenefits.push('Clear vision during sports');
    }

    // Photochromic for drivers/outdoor workers
    if (lifestyle.drivingFrequency === 'daily' || lifestyle.outdoorTime > 4) {
      recommended.push('Photochromic (Transitions)');
      recommendedReasons.push('Adapts to changing light conditions');
      recommendedBenefits.push('No need for separate sunglasses', 'Eye comfort in bright conditions');
    }

    return { essential, recommended, recommendedReasons, recommendedBenefits };
  }

  /**
   * Recommend lens design based on usage
   */
  private recommendLensDesign(rx: PrescriptionData, lifestyle: LifestyleProfile, age: number): {
    design: string;
    reasoning: string[];
  } {
    const maxCylinder = Math.max(Math.abs(rx.odCylinder), Math.abs(rx.osCylinder));

    // Aspheric design for high prescriptions or presbyopes
    if (Math.max(Math.abs(rx.odSphere), Math.abs(rx.osSphere)) > 4 || (age > 45 && rx.addition)) {
      return {
        design: 'Aspheric',
        reasoning: [
          'Aspheric design reduces distortion in peripheral vision',
          'Flatter, more cosmetically appealing lens profile',
          'Reduces magnification/minification effect',
        ],
      };
    }

    // Digital/Freeform for computer users
    if (lifestyle.computerHoursPerDay >= 6) {
      return {
        design: 'Digital Freeform',
        reasoning: [
          'Digitally surfaced for precision optics',
          'Optimized for computer working distance',
          'Wider useful viewing zones',
          'Reduced eye strain from extended screen use',
        ],
      };
    }

    // Aspheric for moderate prescriptions with astigmatism
    if (maxCylinder > 1.5) {
      return {
        design: 'Aspheric',
        reasoning: [
          'Aspheric design improves image quality with astigmatism',
          'Better peripheral optics',
        ],
      };
    }

    return {
      design: 'Standard Spherical',
      reasoning: [
        'Standard design suitable for your prescription',
        'Proven optical performance',
      ],
    };
  }

  /**
   * Calculate frame considerations based on prescription
   */
  private calculateFrameConsiderations(rx: PrescriptionData): FrameConsideration {
    const maxSphere = Math.max(Math.abs(rx.odSphere), Math.abs(rx.osSphere));

    if (maxSphere > 6) {
      return {
        minCenterThickness: 2.0,
        edgeThickness: 8.0,
        recommendedFrameTypes: ['Full-rim', 'Thick acetate frames', 'Small eye-size frames'],
        frameSizeGuidance: 'Smaller frames (48-50mm eye size) will minimize lens thickness at edges',
      };
    } else if (maxSphere > 4) {
      return {
        minCenterThickness: 1.8,
        edgeThickness: 5.0,
        recommendedFrameTypes: ['Full-rim', 'Semi-rimless', 'Medium-sized frames'],
        frameSizeGuidance: 'Medium frames (50-52mm) work well with high-index lenses',
      };
    } else if (maxSphere > 2) {
      return {
        minCenterThickness: 1.5,
        edgeThickness: 3.0,
        recommendedFrameTypes: ['Any frame type', 'Rimless suitable'],
        frameSizeGuidance: 'Wide range of frame styles will work well',
      };
    }

    return {
      minCenterThickness: 1.0,
      edgeThickness: 2.0,
      recommendedFrameTypes: ['Any frame type', 'Rimless excellent choice'],
      frameSizeGuidance: 'All frame sizes suitable - choose based on style preference',
    };
  }

  /**
   * Estimate price based on specifications
   */
  private estimatePrice(index: number, coatings: string[], design: string): string {
    let basePrice = 50;

    // Index pricing
    if (index >= 1.74) basePrice += 150;
    else if (index >= 1.67) basePrice += 100;
    else if (index >= 1.60) basePrice += 50;

    // Coating pricing
    basePrice += coatings.length * 25;

    // Design pricing
    if (design.includes('Freeform')) basePrice += 100;
    else if (design.includes('Aspheric')) basePrice += 50;

    const minPrice = basePrice;
    const maxPrice = basePrice + 50;

    return `£${minPrice} - £${maxPrice}`;
  }

  /**
   * Generate human-readable summary
   */
  private generateSummary(
    rx: PrescriptionData,
    lifestyle: LifestyleProfile,
    recommendations: LensRecommendation[],
    age: number
  ): string {
    const primary = recommendations[0];

    let summary = `Based on your prescription and lifestyle, we recommend ${primary.lensType} lenses `;
    summary += `in ${primary.material} (index ${primary.index}). `;

    if (lifestyle.computerHoursPerDay >= 4) {
      summary += `Since you spend ${lifestyle.computerHoursPerDay} hours daily on a computer, `;
      summary += `we've included blue light filtering to reduce eye strain. `;
    }

    if (lifestyle.drivingFrequency === 'daily') {
      summary += `As a daily driver, consider adding photochromic lenses for comfort in varying light conditions. `;
    }

    if (age >= 45 && rx.addition) {
      summary += `Progressive lenses will give you natural vision at all distances without visible lines. `;
    }

    return summary;
  }

  /**
   * Get recommendations for an existing patient
   */
  async getRecommendationsForPatient(patientId: string): Promise<any> {
    const [patient] = await db.select().from(patients).where(eq(patients.id, patientId)).limit(1);
    if (!patient) throw new Error('Patient not found');

    const [latestRx] = await db.select()
      .from(prescriptions)
      .where(eq(prescriptions.patientId, patientId))
      .orderBy(desc(prescriptions.prescriptionDate))
      .limit(1);

    if (!latestRx) throw new Error('No prescription found');

    // Mock lifestyle data (in production, this would come from a patient questionnaire)
    const lifestyle: LifestyleProfile = {
      occupation: patient.notes?.occupation || 'Office worker',
      computerHoursPerDay: 6,
      sportsActivities: [],
      hobbies: ['reading'],
      drivingFrequency: 'daily',
      outdoorTime: 2,
      readingFrequency: 'moderate',
      specialRequirements: [],
    };

    const prescriptionData: PrescriptionData = {
      odSphere: latestRx.odSphere || 0,
      odCylinder: latestRx.odCylinder || 0,
      odAxis: latestRx.odAxis,
      osSphere: latestRx.osSphere || 0,
      osCylinder: latestRx.osCylinder || 0,
      osAxis: latestRx.osAxis,
      addition: latestRx.addition,
      pd: latestRx.pd,
    };

    const age = patient.dateOfBirth
      ? new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()
      : 40;

    return this.generateRecommendations(prescriptionData, lifestyle, age);
  }
}

export const intelligentLensRecommendationService = new IntelligentLensRecommendationService();
