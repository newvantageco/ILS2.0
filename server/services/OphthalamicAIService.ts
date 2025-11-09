/**
 * Ophthalmic AI Assistant Service
 *
 * Comprehensive AI assistant for optical practices with expertise in:
 * - Ophthalmic knowledge (prescriptions, eye health, products)
 * - Clinical workflows (eye exams, CL fitting, dispensing)
 * - NHS guidance (eligibility, vouchers, claims)
 * - Business insights (inventory, analytics, recommendations)
 * - Patient education (explaining prescriptions, product selection)
 *
 * Powered by GPT-4 with context-aware responses and system integration.
 */

import { ExternalAIService, type AIMessage } from "./ExternalAIService.js";
import { db } from "../../db/index.js";
import {
  patients,
  prescriptions,
  contactLensPrescriptions,
  nhsPatientExemptions,
  contactLensInventory,
  companies,
} from "../../shared/schema.js";
import { eq, and, desc, sql } from "drizzle-orm";
import { ContactLensService } from "./ContactLensService.js";
import { NhsExemptionService } from "./NhsExemptionService.js";
import { NhsVoucherService } from "./NhsVoucherService.js";

// Use ExternalAIService for multi-provider support and automatic fallback
const externalAI = new ExternalAIService();

export interface AIQuery {
  question: string;
  context?: {
    patientId?: string;
    companyId: string;
    conversationHistory?: Array<{
      role: "user" | "assistant";
      content: string;
    }>;
  };
}

export interface AIResponse {
  answer: string;
  recommendations?: Array<{
    type: string;
    title: string;
    description: string;
    action?: string;
  }>;
  relatedTopics?: string[];
  confidence: number;
}

export class OphthalamicAIService {
  /**
   * Main AI query handler
   */
  static async query(data: AIQuery): Promise<AIResponse> {
    const { question, context } = data;

    // Build context-aware system prompt
    const systemPrompt = await this.buildSystemPrompt(context);

    // Gather relevant context data
    const contextData = context ? await this.gatherContextData(context) : null;

    // Build user message with context
    const userMessage = this.buildUserMessage(question, contextData);

    // Build conversation history
    const messages: AIMessage[] = [
      { role: "system", content: systemPrompt },
    ];

    // Add conversation history if provided
    if (context?.conversationHistory) {
      messages.push(
        ...context.conversationHistory.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }))
      );
    }

    // Add current question
    messages.push({ role: "user", content: userMessage });

    // Call AI via ExternalAIService (supports OpenAI, Anthropic, Ollama with automatic fallback)
    const response = await externalAI.generateResponse(messages, {
      provider: "openai",
      model: "gpt-4-turbo-preview",
      maxTokens: 1500,
      temperature: 0.7,
    });

    // Parse JSON response (GPT-4 supports JSON mode via system prompt instruction)
    const aiResponse = JSON.parse(response.content || "{}");

    return {
      answer: aiResponse.answer || "I apologize, but I couldn't generate a response.",
      recommendations: aiResponse.recommendations || [],
      relatedTopics: aiResponse.relatedTopics || [],
      confidence: aiResponse.confidence || 0.7,
    };
  }

  /**
   * Get lens recommendations based on prescription
   */
  static async getLensRecommendations(
    prescriptionId: string,
    companyId: string,
    lifestyle?: {
      occupation?: string;
      hobbies?: string;
      screenTime?: string;
      budget?: string;
    }
  ) {
    // Get prescription
    const [prescription] = await db
      .select()
      .from(prescriptions)
      .where(
        and(
          eq(prescriptions.id, prescriptionId),
          eq(prescriptions.companyId, companyId)
        )
      )
      .limit(1);

    if (!prescription) {
      throw new Error("Prescription not found");
    }

    const systemPrompt = `You are an expert optician specialized in lens recommendations.
Analyze the prescription and lifestyle factors to recommend the best lens types, materials, and coatings.

Response format (JSON):
{
  "recommendations": [
    {
      "lensType": "Progressive (Varifocal)",
      "material": "Polycarbonate",
      "coatings": ["Anti-reflective", "Blue light filter", "UV protection"],
      "reason": "Explanation of why this is recommended",
      "price": "£200-£350",
      "confidence": 0.95
    }
  ],
  "keyConsiderations": ["Factor 1", "Factor 2"],
  "alternatives": ["Alternative option 1", "Alternative option 2"]
}`;

    const userMessage = `Prescription:
- Right Eye (OD): SPH ${prescription.sphereOD}, CYL ${prescription.cylinderOD}, AXIS ${prescription.axisOD}, ADD ${prescription.addOD}
- Left Eye (OS): SPH ${prescription.sphereOS}, CYL ${prescription.cylinderOS}, AXIS ${prescription.axisOS}, ADD ${prescription.addOS}
- PD: ${prescription.pd}

${lifestyle ? `Lifestyle:
- Occupation: ${lifestyle.occupation || "Not specified"}
- Hobbies: ${lifestyle.hobbies || "Not specified"}
- Screen time: ${lifestyle.screenTime || "Not specified"}
- Budget: ${lifestyle.budget || "Not specified"}` : ""}

What lens types, materials, and coatings would you recommend?`;

    const response = await externalAI.generateResponse(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      {
        provider: "openai",
        model: "gpt-4-turbo-preview",
        maxTokens: 1000,
        temperature: 0.7,
      }
    );

    return JSON.parse(response.content || "{}");
  }

  /**
   * Get contact lens recommendations
   */
  static async getContactLensRecommendations(
    patientId: string,
    companyId: string,
    assessment?: {
      tearQuality?: string;
      dryEyes?: boolean;
      occupation?: string;
      hobbies?: string;
      motivationReason?: string;
    }
  ) {
    // Get latest CL assessment if available
    const latestAssessment = await ContactLensService.getLatestAssessment(
      patientId,
      companyId
    );

    // Get spectacle prescription for reference
    const [spectaclePrescription] = await db
      .select()
      .from(prescriptions)
      .where(
        and(
          eq(prescriptions.patientId, patientId),
          eq(prescriptions.companyId, companyId)
        )
      )
      .orderBy(desc(prescriptions.prescriptionDate))
      .limit(1);

    const systemPrompt = `You are an expert contact lens specialist.
Analyze the patient's eye health, lifestyle, and prescription to recommend suitable contact lenses.

Consider:
- Tear quality and dry eye status
- Lifestyle and occupation
- Previous CL experience
- Prescription requirements (sphere, cylinder, add)

Response format (JSON):
{
  "recommendations": [
    {
      "brand": "Acuvue Oasys",
      "lensType": "Soft",
      "design": "Spherical/Toric/Multifocal",
      "replacementSchedule": "Daily/Two-weekly/Monthly",
      "reason": "Explanation",
      "baseCurve": "8.4",
      "diameter": "14.0",
      "confidence": 0.9
    }
  ],
  "careSystemRecommendation": "Multipurpose solution recommended",
  "wearingSchedule": "Daily wear recommended",
  "contraindications": ["Issue 1 if any"],
  "followUpAdvice": "Advice for patient"
}`;

    const userMessage = `Patient Assessment:
${latestAssessment ? `
- Previous CL wearer: ${latestAssessment.previousClWearer ? "Yes" : "No"}
- Tear quality: ${latestAssessment.tearQuality || "Unknown"}
- Dry eyes: ${latestAssessment.dryEyes ? "Yes" : "No"}
- Motivation: ${latestAssessment.motivationReason || "Not specified"}
` : ""}
${assessment ? `
- Occupation: ${assessment.occupation || "Not specified"}
- Hobbies: ${assessment.hobbies || "Not specified"}
` : ""}
${spectaclePrescription ? `
Spectacle Prescription:
- OD: SPH ${spectaclePrescription.sphereOD}, CYL ${spectaclePrescription.cylinderOD}
- OS: SPH ${spectaclePrescription.sphereOS}, CYL ${spectaclePrescription.cylinderOS}
- ADD: ${spectaclePrescription.addOD || "None"}
` : ""}

What contact lenses would you recommend for this patient?`;

    const response = await externalAI.generateResponse(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      {
        provider: "openai",
        model: "gpt-4-turbo-preview",
        maxTokens: 1000,
        temperature: 0.7,
      }
    );

    return JSON.parse(response.content || "{}");
  }

  /**
   * Explain prescription to patient
   */
  static async explainPrescription(prescriptionId: string, companyId: string) {
    const [prescription] = await db
      .select()
      .from(prescriptions)
      .where(
        and(
          eq(prescriptions.id, prescriptionId),
          eq(prescriptions.companyId, companyId)
        )
      )
      .limit(1);

    if (!prescription) {
      throw new Error("Prescription not found");
    }

    const systemPrompt = `You are a friendly optometrist explaining a prescription to a patient in simple, easy-to-understand language.
Avoid jargon. Use analogies. Be reassuring.

Response format (JSON):
{
  "explanation": "Simple explanation of what the prescription means",
  "conditionType": "Myopia/Hyperopia/Presbyopia/Astigmatism",
  "severity": "Mild/Moderate/Severe",
  "whatItMeans": "What this means for daily life",
  "correctionOptions": ["Glasses", "Contact lenses", "etc"],
  "tips": ["Helpful tip 1", "Helpful tip 2"]
}`;

    const userMessage = `Prescription values:
- Right Eye (OD): SPH ${prescription.sphereOD}, CYL ${prescription.cylinderOD}, AXIS ${prescription.axisOD}${prescription.addOD ? `, ADD ${prescription.addOD}` : ""}
- Left Eye (OS): SPH ${prescription.sphereOS}, CYL ${prescription.cylinderOS}, AXIS ${prescription.axisOS}${prescription.addOS ? `, ADD ${prescription.addOS}` : ""}
- PD: ${prescription.pd}

Please explain this prescription to the patient in simple terms.`;

    const response = await externalAI.generateResponse(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      {
        provider: "openai",
        model: "gpt-4-turbo-preview",
        maxTokens: 800,
        temperature: 0.7,
      }
    );

    return JSON.parse(response.content || "{}");
  }

  /**
   * NHS eligibility guidance
   */
  static async getNhsGuidance(patientId: string, companyId: string) {
    // Get patient
    const [patient] = await db
      .select()
      .from(patients)
      .where(and(eq(patients.id, patientId), eq(patients.companyId, companyId)))
      .limit(1);

    if (!patient) {
      throw new Error("Patient not found");
    }

    // Check exemptions
    const exemptionCheck = await NhsExemptionService.checkExemption(
      patientId,
      companyId
    );

    // Auto-detect potential exemptions
    const autoDetect = await NhsExemptionService.autoDetectExemptions(
      patientId,
      companyId
    );

    // Check CL eligibility
    const clEligibility = await ContactLensService.checkNhsEligibility(
      patientId,
      companyId
    );

    const systemPrompt = `You are an NHS guidance expert helping optical practices and patients understand NHS funding.

Response format (JSON):
{
  "eligibilityStatus": "Eligible/Not Eligible/Potentially Eligible",
  "explanation": "Clear explanation of NHS eligibility",
  "availableBenefits": ["Benefit 1", "Benefit 2"],
  "requiredEvidence": ["Evidence type 1", "Evidence type 2"],
  "nextSteps": ["Step 1", "Step 2"],
  "voucherValue": "Estimated voucher value if applicable",
  "additionalInfo": "Any additional helpful information"
}`;

    const userMessage = `Patient Information:
- Age: ${patient.dateOfBirth ? this.calculateAge(patient.dateOfBirth) : "Unknown"}
- Has exemptions: ${exemptionCheck.hasValidExemption ? "Yes" : "No"}
${exemptionCheck.hasValidExemption ? `- Active exemptions: ${exemptionCheck.exemptions.map((e) => e.exemptionReason).join(", ")}` : ""}
${autoDetect.detectedExemptions.length > 0 ? `- Potentially eligible for: ${autoDetect.detectedExemptions.join(", ")}` : ""}
- NHS CL eligible: ${clEligibility.isEligible ? "Yes" : "No"}

What NHS funding is available for this patient?`;

    const response = await externalAI.generateResponse(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      {
        provider: "openai",
        model: "gpt-4-turbo-preview",
        maxTokens: 800,
        temperature: 0.6,
      }
    );

    return JSON.parse(response.content || "{}");
  }

  /**
   * Business insights and analytics
   */
  static async getBusinessInsights(companyId: string, query: string) {
    // Get company info
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    // Get inventory status
    const lowStockItems = await ContactLensService.getLowStockItems(companyId);

    // Get recent statistics
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const today = new Date().toISOString().split("T")[0];
    const startDate = thirtyDaysAgo.toISOString().split("T")[0];

    const clStats = await ContactLensService.getStatistics(
      companyId,
      startDate,
      today
    );

    const systemPrompt = `You are a business analytics expert for optical practices.
Provide actionable insights, identify trends, and suggest improvements.

Response format (JSON):
{
  "insights": ["Insight 1", "Insight 2", "Insight 3"],
  "recommendations": [
    {
      "title": "Recommendation title",
      "description": "Detailed description",
      "priority": "High/Medium/Low",
      "impact": "Expected business impact"
    }
  ],
  "metrics": {
    "key": "value"
  },
  "trends": ["Trend 1", "Trend 2"]
}`;

    const userMessage = `Practice: ${company?.organizationName || "Unknown"}

Recent Performance (Last 30 days):
- CL Prescriptions: ${clStats.totalPrescriptions}
- NHS-funded CLs: ${clStats.nhsFundedPrescriptions}
- Aftercare appointments: ${clStats.aftercareStats.totalAppointments}
- No-shows: ${clStats.aftercareStats.noShows}
- Low stock items: ${lowStockItems.length}

Question: ${query}`;

    const response = await externalAI.generateResponse(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      {
        provider: "openai",
        model: "gpt-4-turbo-preview",
        maxTokens: 1000,
        temperature: 0.7,
      }
    );

    return JSON.parse(response.content || "{}");
  }

  /**
   * Build comprehensive system prompt
   */
  private static async buildSystemPrompt(
    context?: AIQuery["context"]
  ): Promise<string> {
    return `You are an expert Ophthalmic AI Assistant for optical practices in the UK.

Your expertise includes:
- Ophthalmic knowledge (prescriptions, eye conditions, treatments)
- Optical products (spectacles, contact lenses, coatings, materials)
- Clinical workflows (eye examinations, CL fitting, dispensing)
- NHS funding (GOS claims, vouchers, exemptions, eligibility)
- Business operations (inventory, patient management, analytics)
- Patient education (explaining prescriptions, product selection, eye health)

Guidelines:
- Provide accurate, professional advice
- Use simple language for patients, technical language for practitioners
- Always prioritize patient safety
- Reference UK standards (GOC, NHS, ISO)
- Be helpful, empathetic, and reassuring
- Suggest next steps when appropriate

Response format: Always respond in valid JSON with this structure:
{
  "answer": "Your detailed response here",
  "recommendations": [
    {
      "type": "product/action/referral",
      "title": "Recommendation title",
      "description": "Description",
      "action": "Optional action to take"
    }
  ],
  "relatedTopics": ["Related topic 1", "Related topic 2"],
  "confidence": 0.9
}`;
  }

  /**
   * Gather context data from database
   */
  private static async gatherContextData(context: AIQuery["context"]) {
    if (!context) return null;

    const data: any = {};

    // Get patient data if provided
    if (context.patientId) {
      const [patient] = await db
        .select()
        .from(patients)
        .where(
          and(
            eq(patients.id, context.patientId),
            eq(patients.companyId, context.companyId)
          )
        )
        .limit(1);

      if (patient) {
        data.patient = {
          age: patient.dateOfBirth ? this.calculateAge(patient.dateOfBirth) : null,
          medicalHistory: patient.medicalHistory,
        };

        // Get latest prescription
        const [latestRx] = await db
          .select()
          .from(prescriptions)
          .where(
            and(
              eq(prescriptions.patientId, context.patientId),
              eq(prescriptions.companyId, context.companyId)
            )
          )
          .orderBy(desc(prescriptions.prescriptionDate))
          .limit(1);

        if (latestRx) {
          data.latestPrescription = latestRx;
        }

        // Check NHS exemptions
        const exemptions = await NhsExemptionService.checkExemption(
          context.patientId,
          context.companyId
        );
        data.nhsEligibility = exemptions;
      }
    }

    return data;
  }

  /**
   * Build user message with context
   */
  private static buildUserMessage(question: string, contextData: any): string {
    let message = question;

    if (contextData) {
      message += "\n\nContext:";

      if (contextData.patient) {
        message += `\n- Patient age: ${contextData.patient.age || "Unknown"}`;
      }

      if (contextData.latestPrescription) {
        message += `\n- Has prescription on file`;
      }

      if (contextData.nhsEligibility?.hasValidExemption) {
        message += `\n- NHS exempt: ${contextData.nhsEligibility.exemptions.map((e: any) => e.exemptionReason).join(", ")}`;
      }
    }

    return message;
  }

  /**
   * Calculate age from date of birth
   */
  private static calculateAge(dateOfBirth: string): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  }
}
