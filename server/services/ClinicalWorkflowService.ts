/**
 * Clinical Workflow Service
 * 
 * Bridges the gap between clinical examinations and retail dispensing.
 * Analyzes eye examination data and generates intelligent product recommendations
 * for dispensers based on the optometrist's diagnosis and management plan.
 * 
 * Key Features:
 * - Parses examination JSONB data (diagnosis, symptoms, management)
 * - Rule-based product recommendations (lenses, coatings, frames)
 * - Prescription analysis (high power, prism, special requirements)
 * - Patient history consideration
 * - Compliance with optometrist's instructions
 */

import { storage } from '../storage';
import { eventBus } from './EventBus';
import { createLogger, type Logger } from '../utils/logger';

interface DispensingRecommendation {
  examinationId: string;
  patientId: string;
  patientName: string;
  examinerName: string;
  examinationDate: Date;
  diagnosis: string;
  managementPlan: string;
  recommendedProducts: RecommendedProduct[];
  warnings: string[];
  patientNotes: string[];
  prescriptionAnalysis: PrescriptionAnalysis;
}

interface RecommendedProduct {
  type: 'lens' | 'frame' | 'coating' | 'accessory';
  name: string;
  reason: string;
  priority: 'required' | 'recommended' | 'optional';
  category?: string;
  estimatedPrice?: number;
}

interface PrescriptionAnalysis {
  isHighPower: boolean;
  hasAstigmatism: boolean;
  hasPrism: boolean;
  requiresVarifocals: boolean;
  requiresReading: boolean;
  sphereOD: number;
  sphereOS: number;
  cylinderOD: number;
  cylinderOS: number;
  add?: number;
  recommendations: string[];
}

export class ClinicalWorkflowService {
  private logger: Logger;

  constructor() {
    this.logger = createLogger('ClinicalWorkflowService');
    this.initializeEventHandlers();
  }

  /**
   * Initialize event handlers
   */
  private initializeEventHandlers(): void {
    // Listen for completed examinations
    eventBus.subscribe('examination.completed', async (data) => {
      this.logger.info('Examination completed, generating recommendations', {
        examinationId: data.examinationId,
        patientId: data.patientId,
      });

      // Pre-generate recommendations for faster dispensing
      await this.getDispensingRecommendations(data.examinationId);
    });

    this.logger.info('Clinical workflow event handlers initialized');
  }

  /**
   * Get dispensing recommendations for a completed examination
   */
  async getDispensingRecommendations(
    examinationId: string
  ): Promise<DispensingRecommendation> {
    try {
      // 1. Fetch examination data
      const exam = await storage.getEyeExamination(examinationId);
      if (!exam) {
        throw new Error(`Examination not found: ${examinationId}`);
      }

      // 2. Fetch patient data
      const patient = await storage.getPatient(exam.patientId);
      const examiner = await storage.getUser(exam.ecpId);

      // 3. Parse examination summary (JSONB)
      const summary = (exam.summary as any) || {};
      const diagnosis = summary.diagnosis || summary.clinicalImpression || '';
      const managementPlan = summary.managementPlan || summary.recommendations || '';
      const symptoms = summary.symptoms || summary.chiefComplaint || [];

      // 4. Get prescription if available
      let prescription = null;
      if (exam.id) {
        // Get prescriptions for this examination
        const prescriptions = await storage.getPrescriptions(exam.ecpId, exam.companyId);
        prescription = prescriptions.find(p => p.examinationId === exam.id) || prescriptions[0];
      }

      // 5. Analyze prescription
      const prescriptionAnalysis = prescription
        ? this.analyzePrescription(prescription)
        : this.getDefaultPrescriptionAnalysis();

      // 6. Generate recommendations
      const recommendations: DispensingRecommendation = {
        examinationId: exam.id,
        patientId: exam.patientId,
        patientName: patient?.name || 'Unknown Patient',
        examinerName: examiner?.email || 'Unknown',
        examinationDate: exam.examinationDate,
        diagnosis,
        managementPlan,
        recommendedProducts: [],
        warnings: [],
        patientNotes: [],
        prescriptionAnalysis,
      };

      // 7. Apply recommendation rules
      this.applyDiagnosisRules(recommendations, diagnosis);
      this.applyManagementRules(recommendations, managementPlan);
      this.applySymptomRules(recommendations, symptoms);
      this.applyPrescriptionRules(recommendations, prescriptionAnalysis);
      await this.applyPatientHistoryRules(recommendations, patient);

      // 8. Log and return
      this.logger.info('Generated dispensing recommendations', {
        examinationId,
        productCount: recommendations.recommendedProducts.length,
      });

      return recommendations;
    } catch (error) {
      this.logger.error('Failed to generate recommendations', error as Error, {
        examinationId,
      });
      throw error;
    }
  }

  /**
   * Analyze prescription and determine special requirements
   */
  private analyzePrescription(prescription: any): PrescriptionAnalysis {
    const sphereOD = this.parseFloat(prescription.odSphere);
    const sphereOS = this.parseFloat(prescription.osSphere);
    const cylinderOD = this.parseFloat(prescription.odCylinder);
    const cylinderOS = this.parseFloat(prescription.osCylinder);
    const add = this.parseFloat(prescription.odAdd);

    const isHighPower =
      Math.abs(sphereOD) > 4 || Math.abs(sphereOS) > 4;
    const hasAstigmatism =
      Math.abs(cylinderOD) > 0.5 || Math.abs(cylinderOS) > 0.5;
    const hasPrism =
      prescription.odPrismHorizontal ||
      prescription.odPrismVertical ||
      prescription.osPrismHorizontal ||
      prescription.osPrismVertical;
    const requiresVarifocals = add > 0.75;
    const requiresReading = add > 0;

    const recommendations: string[] = [];

    if (isHighPower) {
      recommendations.push('High index lenses (1.67 or 1.74) for thinner lenses');
    }
    if (hasAstigmatism) {
      recommendations.push('Aspheric lens design for better optics');
    }
    if (hasPrism) {
      recommendations.push('Specialist fitting required for prism correction');
    }
    if (requiresVarifocals) {
      recommendations.push('Varifocal/progressive lenses for near vision');
    }

    return {
      isHighPower,
      hasAstigmatism,
      hasPrism,
      requiresVarifocals,
      requiresReading,
      sphereOD,
      sphereOS,
      cylinderOD,
      cylinderOS,
      add,
      recommendations,
    };
  }

  /**
   * Apply diagnosis-based rules
   */
  private applyDiagnosisRules(
    recommendations: DispensingRecommendation,
    diagnosis: string
  ): void {
    const diagnosisLower = diagnosis.toLowerCase();

    // Presbyopia
    if (diagnosisLower.includes('presbyopia')) {
      recommendations.recommendedProducts.push({
        type: 'lens',
        name: 'Progressive/Varifocal Lenses',
        reason: 'Diagnosed with presbyopia - requires near vision correction',
        priority: 'required',
        category: 'multifocal',
      });
    }

    // Myopia (high)
    if (diagnosisLower.includes('high myopia') || diagnosisLower.includes('severe myopia')) {
      recommendations.recommendedProducts.push({
        type: 'lens',
        name: 'High Index Lenses (1.74)',
        reason: 'High myopia requires ultra-thin lenses',
        priority: 'recommended',
        category: 'high-index',
      });
    }

    // Dry eyes
    if (diagnosisLower.includes('dry eye') || diagnosisLower.includes('dry eyes')) {
      recommendations.recommendedProducts.push({
        type: 'accessory',
        name: 'Preservative-Free Eye Drops',
        reason: 'Dry eye diagnosis requires regular lubrication',
        priority: 'recommended',
      });
      recommendations.patientNotes.push('Patient has dry eyes - recommend wraparound frames');
    }

    // Cataracts
    if (diagnosisLower.includes('cataract')) {
      recommendations.warnings.push(
        'Patient has cataracts - spectacle prescription may be temporary. Consider referral timeline.'
      );
    }

    // Glaucoma
    if (diagnosisLower.includes('glaucoma')) {
      recommendations.warnings.push(
        'Glaucoma patient - ensure regular follow-ups are scheduled.'
      );
    }
  }

  /**
   * Apply management plan rules
   */
  private applyManagementRules(
    recommendations: DispensingRecommendation,
    managementPlan: string
  ): void {
    const planLower = managementPlan.toLowerCase();

    // Progressive lenses
    if (planLower.includes('progressive') || planLower.includes('varifocal')) {
      if (!recommendations.recommendedProducts.some((p) => p.name.includes('Progressive'))) {
        recommendations.recommendedProducts.push({
          type: 'lens',
          name: 'Progressive Lenses',
          reason: 'Recommended by prescribing optometrist',
          priority: 'required',
          category: 'multifocal',
        });
      }
    }

    // Anti-reflective coating
    if (planLower.includes('anti-reflective') || planLower.includes('anti reflective')) {
      recommendations.recommendedProducts.push({
        type: 'coating',
        name: 'Anti-Reflective Coating',
        reason: 'Recommended by prescribing optometrist',
        priority: 'required',
      });
    }

    // Blue light filter
    if (planLower.includes('blue light') || planLower.includes('blue filter')) {
      recommendations.recommendedProducts.push({
        type: 'coating',
        name: 'Blue Light Filter',
        reason: 'Recommended by prescribing optometrist',
        priority: 'required',
      });
    }

    // Photochromic
    if (planLower.includes('photochromic') || planLower.includes('transition')) {
      recommendations.recommendedProducts.push({
        type: 'lens',
        name: 'Photochromic Lenses',
        reason: 'Recommended by prescribing optometrist',
        priority: 'recommended',
      });
    }

    // Polarized sunglasses
    if (planLower.includes('polarized') || planLower.includes('sunglasses')) {
      recommendations.recommendedProducts.push({
        type: 'frame',
        name: 'Polarized Prescription Sunglasses',
        reason: 'Recommended by prescribing optometrist',
        priority: 'recommended',
      });
    }
  }

  /**
   * Apply symptom-based rules
   */
  private applySymptomRules(
    recommendations: DispensingRecommendation,
    symptoms: string | string[]
  ): void {
    const symptomList = Array.isArray(symptoms) ? symptoms : [symptoms];
    const symptomsLower = symptomList.map((s) => s.toLowerCase()).join(' ');

    // Computer use / digital eye strain
    if (
      symptomsLower.includes('computer') ||
      symptomsLower.includes('screen') ||
      symptomsLower.includes('digital')
    ) {
      recommendations.recommendedProducts.push({
        type: 'coating',
        name: 'Blue Light Filter',
        reason: 'Patient reports heavy computer/screen use',
        priority: 'recommended',
      });
      recommendations.patientNotes.push(
        'Heavy digital device user - recommend blue light protection'
      );
    }

    // Night driving
    if (symptomsLower.includes('night driving') || symptomsLower.includes('driving at night')) {
      recommendations.recommendedProducts.push({
        type: 'coating',
        name: 'Anti-Reflective Coating (Premium)',
        reason: 'Patient reports night driving difficulties',
        priority: 'recommended',
      });
    }

    // Glare sensitivity
    if (symptomsLower.includes('glare') || symptomsLower.includes('bright light')) {
      recommendations.recommendedProducts.push({
        type: 'lens',
        name: 'Photochromic Lenses',
        reason: 'Patient is sensitive to glare',
        priority: 'recommended',
      });
    }

    // Headaches
    if (symptomsLower.includes('headache') || symptomsLower.includes('eye strain')) {
      recommendations.warnings.push(
        'Patient reports headaches - ensure accurate PD measurement and frame fitting'
      );
    }
  }

  /**
   * Apply prescription-based rules
   */
  private applyPrescriptionRules(
    recommendations: DispensingRecommendation,
    analysis: PrescriptionAnalysis
  ): void {
    // High power
    if (analysis.isHighPower) {
      if (!recommendations.recommendedProducts.some((p) => p.name.includes('High Index'))) {
        recommendations.recommendedProducts.push({
          type: 'lens',
          name: 'High Index Lenses (1.67 or 1.74)',
          reason: `High prescription (${Math.max(Math.abs(analysis.sphereOD), Math.abs(analysis.sphereOS)).toFixed(2)}D) requires thin lenses`,
          priority: 'recommended',
        });
      }
      recommendations.patientNotes.push(
        'High prescription - recommend smaller frame sizes to minimize lens thickness'
      );
    }

    // Astigmatism
    if (analysis.hasAstigmatism) {
      recommendations.recommendedProducts.push({
        type: 'lens',
        name: 'Aspheric Lens Design',
        reason: 'Astigmatism correction benefits from aspheric design',
        priority: 'recommended',
      });
    }

    // Prism
    if (analysis.hasPrism) {
      recommendations.warnings.push(
        'Prism correction required - ensure specialist fitting and careful frame selection'
      );
      recommendations.patientNotes.push(
        'Prism Rx - avoid rimless or semi-rimless frames'
      );
    }

    // Varifocals
    if (analysis.requiresVarifocals) {
      recommendations.patientNotes.push(
        'First-time varifocal wearer may need adaptation period - provide usage instructions'
      );
    }
  }

  /**
   * Apply patient history rules
   */
  private async applyPatientHistoryRules(
    recommendations: DispensingRecommendation,
    patient: any
  ): Promise<void> {
    // Get previous orders for this patient
    const allOrders = await storage.getOrders(patient.companyId);
    const previousOrders = allOrders.filter(o => o.patientId === patient.id);

    if (previousOrders.length > 0) {
      const lastOrder = previousOrders[0]; // Most recent

      // If they bought photochromic before, remind them
      if (lastOrder.lensType?.toLowerCase().includes('photochromic')) {
        recommendations.patientNotes.push(
          'Patient previously purchased photochromic lenses - may want again'
        );
      }

      // If they bought blue light filter before
      if (lastOrder.coating?.toLowerCase().includes('blue')) {
        recommendations.patientNotes.push(
          'Patient previously had blue light filter coating'
        );
      }
    }

    // Check medical history from examination
    // (This would require parsing medicalHistory JSONB - placeholder for now)
  }

  /**
   * Get default prescription analysis when prescription is missing
   */
  private getDefaultPrescriptionAnalysis(): PrescriptionAnalysis {
    return {
      isHighPower: false,
      hasAstigmatism: false,
      hasPrism: false,
      requiresVarifocals: false,
      requiresReading: false,
      sphereOD: 0,
      sphereOS: 0,
      cylinderOD: 0,
      cylinderOS: 0,
      recommendations: ['No prescription data available'],
    };
  }

  /**
   * Safe float parsing
   */
  private parseFloat(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }
}

// Singleton instance
export const clinicalWorkflowService = new ClinicalWorkflowService();
