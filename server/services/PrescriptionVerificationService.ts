import { db } from "../db";
import { prescriptionUploads, prescriptions, patients } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface PrescriptionData {
  // Right Eye (OD)
  sphereOD: number | null;
  cylinderOD: number | null;
  axisOD: number | null;
  addOD: number | null;

  // Left Eye (OS)
  sphereOS: number | null;
  cylinderOS: number | null;
  axisOS: number | null;
  addOS: number | null;

  // Additional Info
  prescriptionDate: string | null;
  expiryDate: string | null;
  practitionerName: string | null;
  practitionerGocNumber: string | null;
  pd: number | null; // Pupillary Distance
}

interface AIExtractionResult {
  prescriptionData: PrescriptionData;
  confidence: number;
  requiresReview: boolean;
  reviewNotes: string[];
}

export class PrescriptionVerificationService {
  /**
   * Upload and process a prescription image
   */
  static async uploadPrescription(data: {
    companyId: string;
    shopifyOrderId?: string;
    patientId?: string;
    fileUrl: string;
    fileName: string;
    fileType: string;
    fileSize: number;
  }) {
    // Create prescription upload record
    const [upload] = await db
      .insert(prescriptionUploads)
      .values({
        companyId: data.companyId,
        shopifyOrderId: data.shopifyOrderId || null,
        patientId: data.patientId || null,
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        fileType: data.fileType,
        fileSize: data.fileSize,
        verificationStatus: "pending",
      })
      .returning();

    // Extract prescription data using AI
    try {
      const extractionResult = await this.extractPrescriptionDataAI(data.fileUrl);

      // Update upload with AI extraction
      const [updated] = await db
        .update(prescriptionUploads)
        .set({
          aiExtractedData: extractionResult.prescriptionData as any,
          aiExtractionConfidence: String(extractionResult.confidence),
          prescriptionData: extractionResult.prescriptionData as any,
          requiresReview: extractionResult.requiresReview,
          reviewNotes: extractionResult.reviewNotes.join("; "),
          updatedAt: new Date(),
        })
        .where(eq(prescriptionUploads.id, upload.id))
        .returning();

      return updated;
    } catch (error: any) {
      console.error("AI extraction failed:", error);

      // Mark as requiring review
      await db
        .update(prescriptionUploads)
        .set({
          requiresReview: true,
          reviewNotes: `AI extraction failed: ${error.message}`,
          updatedAt: new Date(),
        })
        .where(eq(prescriptionUploads.id, upload.id));

      throw error;
    }
  }

  /**
   * Extract prescription data from image using GPT-4 Vision
   */
  private static async extractPrescriptionDataAI(imageUrl: string): Promise<AIExtractionResult> {
    const systemPrompt = `You are an expert optometrist analyzing prescription images.
Extract all prescription data with high accuracy.

Important guidelines:
- Sphere values: range from -20.00 to +20.00 (negative = myopia, positive = hyperopia)
- Cylinder values: range from -6.00 to +6.00 (always negative for minus cylinder notation)
- Axis values: range from 1 to 180 degrees (only present if cylinder exists)
- Add/Addition: range from +0.75 to +3.50 (for reading/presbyopia)
- PD (Pupillary Distance): typically 54-74mm for adults
- Date format: YYYY-MM-DD
- GOC number: 6-digit practitioner registration number

Look for:
- Right Eye (OD/R) and Left Eye (OS/L) values
- Date of prescription
- Expiry date (typically 2 years from prescription date)
- Practitioner name and GOC registration number
- Any special notes or instructions

Respond in JSON format with extracted values and confidence score.`;

    const userMessage = `Extract the prescription data from this image. Provide:
1. All sphere, cylinder, axis, and add values for both eyes
2. Prescription date and expiry date
3. Practitioner name and GOC number
4. PD if available
5. Overall confidence score (0-1)
6. List any values you're uncertain about

Return as JSON with structure:
{
  "prescriptionData": {
    "sphereOD": number | null,
    "cylinderOD": number | null,
    "axisOD": number | null,
    "addOD": number | null,
    "sphereOS": number | null,
    "cylinderOS": number | null,
    "axisOS": number | null,
    "addOS": number | null,
    "pd": number | null,
    "prescriptionDate": "YYYY-MM-DD" | null,
    "expiryDate": "YYYY-MM-DD" | null,
    "practitionerName": "string" | null,
    "practitionerGocNumber": "string" | null
  },
  "confidence": number,
  "uncertainValues": string[],
  "notes": string[]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: userMessage },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
      max_tokens: 1000,
      temperature: 0.1, // Low temperature for accuracy
    });

    const content = response.choices[0].message.content || "{}";
    const result = JSON.parse(content);

    // Validate and sanitize extracted data
    const prescriptionData = this.validatePrescriptionData(result.prescriptionData);
    const confidence = result.confidence || 0;
    const uncertainValues = result.uncertainValues || [];
    const notes = result.notes || [];

    // Determine if manual review is needed
    const requiresReview = confidence < 0.85 || uncertainValues.length > 0;
    const reviewNotes = [];

    if (confidence < 0.85) {
      reviewNotes.push(`Low confidence score: ${(confidence * 100).toFixed(0)}%`);
    }
    if (uncertainValues.length > 0) {
      reviewNotes.push(`Uncertain values: ${uncertainValues.join(", ")}`);
    }
    if (notes.length > 0) {
      reviewNotes.push(...notes);
    }

    return {
      prescriptionData,
      confidence,
      requiresReview,
      reviewNotes,
    };
  }

  /**
   * Validate and sanitize prescription data
   */
  private static validatePrescriptionData(data: any): PrescriptionData {
    const validate = (value: any, min: number, max: number): number | null => {
      if (value === null || value === undefined) return null;
      const num = parseFloat(value);
      if (isNaN(num) || num < min || num > max) return null;
      return Math.round(num * 100) / 100; // Round to 2 decimals
    };

    return {
      sphereOD: validate(data.sphereOD, -20, 20),
      cylinderOD: validate(data.cylinderOD, -6, 6),
      axisOD: validate(data.axisOD, 1, 180),
      addOD: validate(data.addOD, 0.75, 3.5),
      sphereOS: validate(data.sphereOS, -20, 20),
      cylinderOS: validate(data.cylinderOS, -6, 6),
      axisOS: validate(data.axisOS, 1, 180),
      addOS: validate(data.addOS, 0.75, 3.5),
      pd: validate(data.pd, 50, 80),
      prescriptionDate: data.prescriptionDate || null,
      expiryDate: data.expiryDate || null,
      practitionerName: data.practitionerName || null,
      practitionerGocNumber: data.practitionerGocNumber || null,
    };
  }

  /**
   * Verify a prescription (manual approval)
   */
  static async verifyPrescription(
    uploadId: string,
    companyId: string,
    verifiedBy: string,
    prescriptionData?: PrescriptionData
  ) {
    // Get upload
    const [upload] = await db
      .select()
      .from(prescriptionUploads)
      .where(and(eq(prescriptionUploads.id, uploadId), eq(prescriptionUploads.companyId, companyId)))
      .limit(1);

    if (!upload) {
      throw new Error("Prescription upload not found");
    }

    // Update with verified data
    const finalData = prescriptionData || (upload.prescriptionData as any);

    const [verified] = await db
      .update(prescriptionUploads)
      .set({
        verificationStatus: "verified",
        verifiedBy,
        verifiedAt: new Date(),
        prescriptionData: finalData as any,
        updatedAt: new Date(),
      })
      .where(eq(prescriptionUploads.id, uploadId))
      .returning();

    // If linked to patient, create prescription record
    if (upload.patientId && finalData) {
      await this.createPrescriptionRecord(upload.patientId, companyId, finalData);
    }

    return verified;
  }

  /**
   * Reject a prescription
   */
  static async rejectPrescription(
    uploadId: string,
    companyId: string,
    verifiedBy: string,
    rejectionReason: string
  ) {
    const [rejected] = await db
      .update(prescriptionUploads)
      .set({
        verificationStatus: "rejected",
        verifiedBy,
        verifiedAt: new Date(),
        rejectionReason,
        updatedAt: new Date(),
      })
      .where(
        and(eq(prescriptionUploads.id, uploadId), eq(prescriptionUploads.companyId, companyId))
      )
      .returning();

    if (!rejected) {
      throw new Error("Prescription upload not found");
    }

    return rejected;
  }

  /**
   * Create prescription record in ILS
   */
  private static async createPrescriptionRecord(
    patientId: string,
    companyId: string,
    data: PrescriptionData
  ) {
    // Check if patient exists
    const [patient] = await db
      .select()
      .from(patients)
      .where(and(eq(patients.id, patientId), eq(patients.companyId, companyId)))
      .limit(1);

    if (!patient) {
      throw new Error("Patient not found");
    }

    // Create prescription
    const [prescription] = await db
      .insert(prescriptions)
      .values({
        companyId,
        patientId,
        ecpId: patient.ecpId,
        prescriptionDate: data.prescriptionDate || new Date().toISOString().split("T")[0],
        expiryDate: data.expiryDate || null,
        sphereOD: data.sphereOD ? String(data.sphereOD) : null,
        cylinderOD: data.cylinderOD ? String(data.cylinderOD) : null,
        axisOD: data.axisOD || null,
        sphereOS: data.sphereOS ? String(data.sphereOS) : null,
        cylinderOS: data.cylinderOS ? String(data.cylinderOS) : null,
        axisOS: data.axisOS || null,
        addPower: data.addOD || data.addOS ? String(data.addOD || data.addOS) : null,
        pd: data.pd ? String(data.pd) : null,
      })
      .returning();

    return prescription;
  }

  /**
   * Get prescription upload by ID
   */
  static async getUpload(uploadId: string, companyId: string) {
    const [upload] = await db
      .select()
      .from(prescriptionUploads)
      .where(and(eq(prescriptionUploads.id, uploadId), eq(prescriptionUploads.companyId, companyId)))
      .limit(1);

    if (!upload) {
      throw new Error("Prescription upload not found");
    }

    return upload;
  }

  /**
   * Get all uploads for review
   */
  static async getUploadsRequiringReview(companyId: string) {
    return await db
      .select()
      .from(prescriptionUploads)
      .where(
        and(
          eq(prescriptionUploads.companyId, companyId),
          eq(prescriptionUploads.requiresReview, true),
          eq(prescriptionUploads.verificationStatus, "pending")
        )
      )
      .orderBy(prescriptionUploads.uploadedAt);
  }

  /**
   * Get uploads by status
   */
  static async getUploadsByStatus(companyId: string, status: string) {
    return await db
      .select()
      .from(prescriptionUploads)
      .where(
        and(
          eq(prescriptionUploads.companyId, companyId),
          eq(prescriptionUploads.verificationStatus, status as any)
        )
      )
      .orderBy(prescriptionUploads.uploadedAt);
  }

  /**
   * Check if prescription is expired
   */
  static isPrescriptionExpired(expiryDate: string | null): boolean {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  }

  /**
   * Calculate expiry date (2 years from prescription date)
   */
  static calculateExpiryDate(prescriptionDate: string): string {
    const date = new Date(prescriptionDate);
    date.setFullYear(date.getFullYear() + 2);
    return date.toISOString().split("T")[0];
  }
}
