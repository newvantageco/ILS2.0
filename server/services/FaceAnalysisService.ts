/**
 * FaceAnalysisService
 *
 * AI-powered face shape analysis service for frame recommendations.
 * Uses TensorFlow.js Face Mesh for facial landmark detection and
 * custom algorithms for face shape classification.
 *
 * Face Shape Classification:
 * - Oval: Balanced proportions, slightly longer than wide
 * - Round: Width and length nearly equal, soft curves
 * - Square: Angular jawline, width and length similar
 * - Heart: Wider forehead, narrower pointed chin
 * - Diamond: Narrow forehead and chin, wide cheekbones
 * - Oblong: Significantly longer than wide
 * - Triangle: Narrow forehead, wide jawline
 */

import { db } from "../../db/index.js";
import { patientFaceAnalysis } from "../../shared/schema.js";
import { eq, and, desc } from "drizzle-orm";
import OpenAI from "openai";
import logger from '../utils/logger';


/**
 * Note: This service uses OpenAI directly (not ExternalAIService) because:
 * 1. It requires GPT-4 Vision API for image analysis
 * 2. Vision API needs special content format (image_url) not yet supported by ExternalAIService
 * 3. This is a specialized use case distinct from general chat/text AI
 *
 * Future: Consider extending ExternalAIService to support vision/multimodal inputs
 */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export interface FaceMeasurements {
  faceLength: number;
  faceWidth: number;
  jawlineWidth: number;
  foreheadWidth: number;
  cheekboneWidth: number;
  pupillaryDistance?: number; // PD in millimeters
  pupillaryDistanceMono?: { // Monocular PD
    right: number; // Right eye to nose center
    left: number; // Left eye to nose center
  };
}

export interface FaceAnalysisResult {
  faceShape: "oval" | "round" | "square" | "heart" | "diamond" | "oblong" | "triangle";
  faceShapeConfidence: number; // 0-100
  measurements: FaceMeasurements;
  skinTone?: "warm" | "cool" | "neutral";
  hairColor?: string;
  eyeColor?: string;
  landmarkPoints?: any;
  processingTime: number;
}

export class FaceAnalysisService {
  /**
   * Analyze a face photo and return face shape classification
   */
  static async analyzeFacePhoto(
    photoDataUrl: string,
    options: {
      patientId: string;
      companyId: string;
    }
  ): Promise<FaceAnalysisResult> {
    const startTime = Date.now();

    try {
      // Use OpenAI Vision API for face analysis
      const analysis = await this.analyzeWithOpenAI(photoDataUrl);

      const processingTime = Date.now() - startTime;

      return {
        ...analysis,
        processingTime,
      };
    } catch (error: any) {
      logger.error("Face analysis error:", error);
      throw new Error(`Face analysis failed: ${error.message}`);
    }
  }

  /**
   * Measure Pupillary Distance (PD) from a frontal face photo
   * Requires: Credit card or ID card in photo for scale reference (85.6mm x 53.98mm standard)
   */
  static async measurePupillaryDistance(
    photoDataUrl: string,
    options: {
      patientId: string;
      companyId: string;
      referenceObjectType?: "credit_card" | "id_card" | "ruler" | "coin";
      referenceObjectSize?: number; // in mm, if custom
    }
  ): Promise<{
    pupillaryDistance: number;
    pupillaryDistanceMono: { right: number; left: number };
    confidence: number;
    accuracy: string;
    calibrationDetails: any;
  }> {
    const startTime = Date.now();

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "system",
            content: `You are an expert optometrist with expertise in measuring pupillary distance (PD) from photos.

PD is the distance between the centers of the pupils in millimeters. Normal adult PD ranges from 54-74mm, with average being 63mm.

Monocular PD is the distance from each pupil to the center of the nose bridge.

IMPORTANT: You MUST use the reference object (credit card, ID card, ruler, or coin) visible in the photo for accurate scale calibration.

Standard reference sizes:
- Credit card: 85.6mm width, 53.98mm height
- UK ID card: 85.6mm width
- UK £1 coin: 22.5mm diameter
- UK £2 coin: 28.4mm diameter
- Ruler: Use visible mm markings

Respond ONLY with valid JSON in this exact format:
{
  "pupillaryDistance": 63.5,
  "pupillaryDistanceMono": {
    "right": 31.5,
    "left": 32.0
  },
  "confidence": 90,
  "accuracy": "±0.5mm",
  "calibration": {
    "referenceObjectDetected": true,
    "referenceObjectType": "credit_card",
    "referenceObjectWidthPixels": 450,
    "referenceObjectWidthMm": 85.6,
    "pixelsPerMm": 5.25,
    "pupilLeftX": 200,
    "pupilRightX": 534,
    "noseCenterX": 367,
    "pupilDistancePixels": 334
  }
}

Steps:
1. Detect reference object in photo and measure its width in pixels
2. Calculate pixels-per-mm scale factor
3. Locate left pupil center, right pupil center, and nose bridge center
4. Measure pixel distance between pupils
5. Convert to millimeters using scale factor
6. Calculate monocular PD (left pupil to nose, right pupil to nose)
7. Assess confidence based on photo quality, face angle, reference object visibility

Photo quality requirements:
- Frontal view (eyes level, face perpendicular to camera)
- Eyes open and looking straight ahead
- Good lighting (no shadows on eyes)
- Reference object clearly visible and in same plane as face
- Minimal head tilt or rotation`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Please measure the pupillary distance from this photo. Reference object: ${options.referenceObjectType || "credit_card"}`,
              },
              {
                type: "image_url",
                image_url: {
                  url: photoDataUrl,
                },
              },
            ],
          },
        ],
        max_tokens: 800,
      });

      const content = response.choices[0]?.message?.content || "{}";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Invalid response format from OpenAI");
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate PD is within reasonable range
      if (parsed.pupillaryDistance < 50 || parsed.pupillaryDistance > 80) {
        throw new Error(`Invalid PD measurement: ${parsed.pupillaryDistance}mm. Normal range is 54-74mm. Please retake photo with proper reference object.`);
      }

      // Save PD measurement to database
      await this.savePDMeasurement({
        patientId: options.patientId,
        companyId: options.companyId,
        pupillaryDistance: parsed.pupillaryDistance,
        pupillaryDistanceMono: parsed.pupillaryDistanceMono,
        confidence: parsed.confidence,
        photoUrl: photoDataUrl,
        calibrationData: parsed.calibration,
        processingTime: Date.now() - startTime,
      });

      return {
        pupillaryDistance: parsed.pupillaryDistance,
        pupillaryDistanceMono: parsed.pupillaryDistanceMono,
        confidence: parsed.confidence,
        accuracy: parsed.accuracy || "±1mm",
        calibrationDetails: parsed.calibration,
      };
    } catch (error: any) {
      logger.error("PD measurement error:", error);
      throw new Error(`PD measurement failed: ${error.message}`);
    }
  }

  /**
   * Analyze face using OpenAI Vision API
   */
  private static async analyzeWithOpenAI(photoDataUrl: string): Promise<FaceAnalysisResult> {
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "system",
          content: `You are an expert optician and face shape analyst. Analyze the face in the image and provide:
1. Face shape classification (oval, round, square, heart, diamond, oblong, or triangle)
2. Confidence score (0-100)
3. Face measurements (relative proportions, not absolute values)
4. Additional characteristics (skin tone, hair color, eye color if visible)
5. If possible, also measure pupillary distance (PD) in mm if a reference object is visible

Respond ONLY with valid JSON in this exact format:
{
  "faceShape": "oval",
  "confidence": 85,
  "measurements": {
    "faceLength": 1.2,
    "faceWidth": 1.0,
    "jawlineWidth": 0.85,
    "foreheadWidth": 0.95,
    "cheekboneWidth": 1.0,
    "pupillaryDistance": 63.5,
    "pupillaryDistanceMono": {
      "right": 31.5,
      "left": 32.0
    }
  },
  "skinTone": "warm",
  "hairColor": "brown",
  "eyeColor": "brown"
}

Face shape classification guide:
- Oval: Balanced, length 1.1-1.3x width, gentle curves
- Round: Length ≈ width (ratio < 1.1), full cheeks
- Square: Angular jaw, length ≈ width, strong features
- Heart: Wide forehead, narrow chin, ratio > 1.1
- Diamond: Narrow forehead and chin, wide cheeks
- Oblong: Very long face (ratio > 1.4)
- Triangle: Narrow forehead, wide jaw`,
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: photoDataUrl,
              },
            },
          ],
        },
      ],
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content || "{}";

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid response format from OpenAI");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      faceShape: parsed.faceShape,
      faceShapeConfidence: parsed.confidence,
      measurements: {
        faceLength: parsed.measurements.faceLength,
        faceWidth: parsed.measurements.faceWidth,
        jawlineWidth: parsed.measurements.jawlineWidth,
        foreheadWidth: parsed.measurements.foreheadWidth,
        cheekboneWidth: parsed.measurements.cheekboneWidth,
      },
      skinTone: parsed.skinTone,
      hairColor: parsed.hairColor,
      eyeColor: parsed.eyeColor,
      processingTime: 0, // Will be set by caller
    };
  }

  /**
   * Fallback: Rule-based face shape classification
   * Used when AI service is unavailable
   */
  private static classifyFaceShapeRuleBased(measurements: FaceMeasurements): {
    faceShape: FaceAnalysisResult["faceShape"];
    confidence: number;
  } {
    const { faceLength, faceWidth, jawlineWidth, foreheadWidth, cheekboneWidth } = measurements;

    const lengthToWidthRatio = faceLength / faceWidth;
    const jawToForeheadRatio = jawlineWidth / foreheadWidth;

    // Oval: balanced proportions
    if (
      lengthToWidthRatio >= 1.1 &&
      lengthToWidthRatio <= 1.3 &&
      Math.abs(jawToForeheadRatio - 1) < 0.15
    ) {
      return { faceShape: "oval", confidence: 85 };
    }

    // Round: nearly equal length and width
    if (lengthToWidthRatio < 1.1 && cheekboneWidth > jawlineWidth * 0.95) {
      return { faceShape: "round", confidence: 80 };
    }

    // Square: angular, similar length and width
    if (
      lengthToWidthRatio < 1.2 &&
      Math.abs(jawlineWidth - foreheadWidth) < 0.1 &&
      jawlineWidth > 0.9
    ) {
      return { faceShape: "square", confidence: 80 };
    }

    // Heart: wide forehead, narrow chin
    if (foreheadWidth > jawlineWidth * 1.15 && lengthToWidthRatio >= 1.1) {
      return { faceShape: "heart", confidence: 75 };
    }

    // Diamond: narrow forehead and jaw, wide cheeks
    if (
      cheekboneWidth > foreheadWidth * 1.1 &&
      cheekboneWidth > jawlineWidth * 1.1
    ) {
      return { faceShape: "diamond", confidence: 75 };
    }

    // Oblong: very long face
    if (lengthToWidthRatio > 1.4) {
      return { faceShape: "oblong", confidence: 80 };
    }

    // Triangle: narrow forehead, wide jaw
    if (jawlineWidth > foreheadWidth * 1.15) {
      return { faceShape: "triangle", confidence: 70 };
    }

    // Default to oval if uncertain
    return { faceShape: "oval", confidence: 50 };
  }

  /**
   * Save face analysis to database
   */
  static async saveFaceAnalysis(data: {
    patientId: string;
    companyId: string;
    analysis: FaceAnalysisResult;
    photoUrl: string;
    thumbnailUrl?: string;
  }) {
    const { patientId, companyId, analysis, photoUrl, thumbnailUrl } = data;

    const [result] = await db
      .insert(patientFaceAnalysis)
      .values({
        patientId,
        companyId,
        faceShape: analysis.faceShape,
        faceShapeConfidence: analysis.faceShapeConfidence.toString(),
        faceLength: analysis.measurements.faceLength.toString(),
        faceWidth: analysis.measurements.faceWidth.toString(),
        jawlineWidth: analysis.measurements.jawlineWidth.toString(),
        foreheadWidth: analysis.measurements.foreheadWidth.toString(),
        cheekboneWidth: analysis.measurements.cheekboneWidth.toString(),
        skinTone: analysis.skinTone,
        hairColor: analysis.hairColor,
        eyeColor: analysis.eyeColor,
        photoUrl,
        thumbnailUrl,
        aiModel: "gpt-4-vision",
        processingTime: analysis.processingTime,
        landmarkPoints: analysis.landmarkPoints,
        rawAnalysisData: analysis as any,
      })
      .returning();

    return result;
  }

  /**
   * Get latest face analysis for a patient
   */
  static async getLatestAnalysis(patientId: string, companyId: string) {
    const [result] = await db
      .select()
      .from(patientFaceAnalysis)
      .where(
        and(
          eq(patientFaceAnalysis.patientId, patientId),
          eq(patientFaceAnalysis.companyId, companyId)
        )
      )
      .orderBy(desc(patientFaceAnalysis.analyzedAt))
      .limit(1);

    return result || null;
  }

  /**
   * Get all face analyses for a patient
   */
  static async getPatientAnalysisHistory(patientId: string, companyId: string) {
    return await db
      .select()
      .from(patientFaceAnalysis)
      .where(
        and(
          eq(patientFaceAnalysis.patientId, patientId),
          eq(patientFaceAnalysis.companyId, companyId)
        )
      )
      .orderBy(desc(patientFaceAnalysis.analyzedAt));
  }

  /**
   * Delete a face analysis
   */
  static async deleteAnalysis(analysisId: string, companyId: string) {
    await db
      .delete(patientFaceAnalysis)
      .where(
        and(
          eq(patientFaceAnalysis.id, analysisId),
          eq(patientFaceAnalysis.companyId, companyId)
        )
      );
  }

  /**
   * Save PD measurement to database
   */
  private static async savePDMeasurement(data: {
    patientId: string;
    companyId: string;
    pupillaryDistance: number;
    pupillaryDistanceMono: { right: number; left: number };
    confidence: number;
    photoUrl: string;
    calibrationData: any;
    processingTime: number;
  }) {
    // Store PD measurement in face analysis table with special flag
    // Or create separate PD measurements table if preferred
    const [result] = await db
      .insert(patientFaceAnalysis)
      .values({
        patientId: data.patientId,
        companyId: data.companyId,
        faceShape: "unknown" as any, // Not measuring face shape in PD-only analysis
        faceShapeConfidence: data.confidence.toString(),
        faceLength: "0",
        faceWidth: "0",
        jawlineWidth: "0",
        foreheadWidth: "0",
        cheekboneWidth: "0",
        photoUrl: data.photoUrl,
        aiModel: "gpt-4-vision-pd-measurement",
        processingTime: data.processingTime,
        rawAnalysisData: {
          type: "pd_measurement",
          pupillaryDistance: data.pupillaryDistance,
          pupillaryDistanceMono: data.pupillaryDistanceMono,
          calibration: data.calibrationData,
        } as any,
      })
      .returning();

    return result;
  }

  /**
   * Get latest PD measurement for a patient
   */
  static async getLatestPDMeasurement(patientId: string, companyId: string) {
    const [result] = await db
      .select()
      .from(patientFaceAnalysis)
      .where(
        and(
          eq(patientFaceAnalysis.patientId, patientId),
          eq(patientFaceAnalysis.companyId, companyId),
          eq(patientFaceAnalysis.aiModel, "gpt-4-vision-pd-measurement")
        )
      )
      .orderBy(desc(patientFaceAnalysis.analyzedAt))
      .limit(1);

    if (!result) return null;

    const rawData = result.rawAnalysisData as any;
    return {
      pupillaryDistance: rawData.pupillaryDistance,
      pupillaryDistanceMono: rawData.pupillaryDistanceMono,
      confidence: parseFloat(result.faceShapeConfidence),
      calibration: rawData.calibration,
      analyzedAt: result.analyzedAt,
      photoUrl: result.photoUrl,
    };
  }
}
