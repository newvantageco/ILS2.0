/**
 * Clinical Decision Support Service
 *
 * ⚠️  ⚠️  ⚠️  DEVELOPMENT VERSION - HARDCODED DATA ONLY  ⚠️  ⚠️  ⚠️
 *
 * CRITICAL LIMITATIONS:
 * - Drug database is hardcoded static data
 * - NO real drug interaction API integration
 * - NO database persistence
 * - NOT suitable for clinical use
 * - Mock clinical guidelines only
 *
 * STATUS: Demonstration prototype
 * TODO: Integrate with real drug database API (OpenFDA, RxNorm)
 *
 * WARNING: Do NOT use for actual patient care
 *
 * AI-powered clinical decision support including drug interactions,
 * treatment recommendations, and diagnostic assistance
 */

import { loggers } from '../../utils/logger.js';
import crypto from 'crypto';

const logger = loggers.api;

// ========== Types & Interfaces ==========

/**
 * Alert severity
 */
export type AlertSeverity = 'info' | 'warning' | 'critical';

/**
 * Drug interaction severity
 */
export type InteractionSeverity = 'minor' | 'moderate' | 'major' | 'contraindicated';

/**
 * Recommendation confidence
 */
export type ConfidenceLevel = 'low' | 'medium' | 'high' | 'very_high';

/**
 * Drug
 */
export interface Drug {
  id: string;
  name: string;
  genericName: string;
  brandNames: string[];
  drugClass: string;
  interactions: string[]; // Drug IDs that interact
  contraindications: string[];
  sideEffects: string[];
  dosageRange?: {
    min: number;
    max: number;
    unit: string;
  };
}

/**
 * Drug interaction
 */
export interface DrugInteraction {
  id: string;
  drug1: Drug;
  drug2: Drug;
  severity: InteractionSeverity;
  description: string;
  clinicalEffects: string[];
  management: string;
  references: string[];
}

/**
 * Allergy alert
 */
export interface AllergyAlert {
  id: string;
  severity: AlertSeverity;
  allergen: string;
  drug: Drug;
  message: string;
  crossReactivity?: string[];
}

/**
 * Clinical guideline
 */
export interface ClinicalGuideline {
  id: string;
  name: string;
  condition: string;
  organization: string; // e.g., "AAO", "AHA", "CDC"
  version: string;
  lastUpdated: Date;
  recommendations: GuidelineRecommendation[];
}

/**
 * Guideline recommendation
 */
export interface GuidelineRecommendation {
  id: string;
  title: string;
  description: string;
  strengthOfRecommendation: 'A' | 'B' | 'C' | 'D'; // A=strong, D=weak
  qualityOfEvidence: 'high' | 'moderate' | 'low' | 'very_low';
  applicableCriteria?: string[];
  contraindications?: string[];
}

/**
 * Treatment recommendation
 */
export interface TreatmentRecommendation {
  id: string;
  patientId: string;
  condition: string;
  diagnosis: string;
  recommendations: {
    treatment: string;
    rationale: string;
    confidence: ConfidenceLevel;
    evidenceLevel: string;
    alternatives?: string[];
    contraindications?: string[];
    expectedOutcome?: string;
    monitoringRequired?: string[];
  }[];
  guidelineReferences: string[];
  createdAt: Date;
}

/**
 * Diagnostic suggestion
 */
export interface DiagnosticSuggestion {
  id: string;
  patientId: string;
  symptoms: string[];
  labResults?: Record<string, any>;
  vitalSigns?: Record<string, number>;
  possibleDiagnoses: {
    condition: string;
    icd10Code: string;
    probability: number; // 0-100
    supportingFactors: string[];
    differentialDiagnoses: string[];
    recommendedTests?: string[];
    urgency: 'routine' | 'urgent' | 'emergency';
  }[];
  confidence: ConfidenceLevel;
  createdAt: Date;
}

/**
 * Lab result interpretation
 */
export interface LabInterpretation {
  id: string;
  testName: string;
  value: number;
  unit: string;
  referenceRange: {
    min: number;
    max: number;
  };
  status: 'normal' | 'low' | 'high' | 'critical';
  interpretation: string;
  clinicalSignificance: string;
  recommendedActions?: string[];
  relatedConditions?: string[];
}

/**
 * Clinical alert
 */
export interface ClinicalAlert {
  id: string;
  patientId: string;
  type: 'drug_interaction' | 'allergy' | 'lab_critical' | 'guideline_deviation' | 'risk_factor';
  severity: AlertSeverity;
  message: string;
  details: string;
  recommendations: string[];
  requiresAcknowledgment: boolean;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  createdAt: Date;
}

/**
 * Clinical Decision Support Service
 */
export class ClinicalDecisionSupportService {
  /**
   * In-memory stores (use database in production)
   */
  private static drugs = new Map<string, Drug>();
  private static interactions = new Map<string, DrugInteraction>();
  private static guidelines = new Map<string, ClinicalGuideline>();
  private static alerts: ClinicalAlert[] = [];
  private static recommendations: TreatmentRecommendation[] = [];
  private static diagnosticSuggestions: DiagnosticSuggestion[] = [];

  /**
   * Configuration
   */
  private static readonly ALERT_RETENTION_DAYS = 90;

  /**
   * Initialize default data
   */
  static {
    this.initializeDrugDatabase();
    this.initializeGuidelines();
  }

  // ========== Drug Database ==========

  /**
   * Initialize drug database
   */
  private static initializeDrugDatabase(): void {
    // Common ophthalmic drugs
    const latanoprost: Drug = {
      id: 'drug-latanoprost',
      name: 'Latanoprost',
      genericName: 'latanoprost',
      brandNames: ['Xalatan', 'Monoprost'],
      drugClass: 'Prostaglandin Analog',
      interactions: ['drug-timolol'],
      contraindications: ['pregnancy', 'macular_edema'],
      sideEffects: ['iris_pigmentation', 'eyelash_growth', 'hyperemia'],
      dosageRange: { min: 0.005, max: 0.005, unit: '%' },
    };

    const timolol: Drug = {
      id: 'drug-timolol',
      name: 'Timolol',
      genericName: 'timolol',
      brandNames: ['Timoptic', 'Betimol'],
      drugClass: 'Beta Blocker',
      interactions: ['drug-latanoprost'],
      contraindications: ['asthma', 'copd', 'heart_block', 'bradycardia'],
      sideEffects: ['bradycardia', 'bronchospasm', 'fatigue'],
      dosageRange: { min: 0.25, max: 0.5, unit: '%' },
    };

    const prednisolone: Drug = {
      id: 'drug-prednisolone',
      name: 'Prednisolone Acetate',
      genericName: 'prednisolone',
      brandNames: ['Pred Forte', 'Omnipred'],
      drugClass: 'Corticosteroid',
      interactions: ['drug-nsaid'],
      contraindications: ['viral_keratitis', 'fungal_infection'],
      sideEffects: ['iop_elevation', 'cataract', 'delayed_healing'],
      dosageRange: { min: 0.12, max: 1.0, unit: '%' },
    };

    const ketorolac: Drug = {
      id: 'drug-nsaid',
      name: 'Ketorolac',
      genericName: 'ketorolac',
      brandNames: ['Acular', 'Acuvail'],
      drugClass: 'NSAID',
      interactions: ['drug-prednisolone'],
      contraindications: ['bleeding_disorders', 'aspirin_allergy'],
      sideEffects: ['burning', 'stinging', 'delayed_healing'],
      dosageRange: { min: 0.4, max: 0.5, unit: '%' },
    };

    const atropine: Drug = {
      id: 'drug-atropine',
      name: 'Atropine',
      genericName: 'atropine',
      brandNames: ['Isopto Atropine'],
      drugClass: 'Mydriatic/Cycloplegic',
      interactions: [],
      contraindications: ['narrow_angle_glaucoma', 'adhesions'],
      sideEffects: ['photophobia', 'blurred_vision', 'increased_iop'],
      dosageRange: { min: 0.5, max: 1.0, unit: '%' },
    };

    // Store drugs
    [latanoprost, timolol, prednisolone, ketorolac, atropine].forEach((drug) => {
      this.drugs.set(drug.id, drug);
    });

    // Define interactions
    this.interactions.set('int-latanoprost-timolol', {
      id: 'int-latanoprost-timolol',
      drug1: latanoprost,
      drug2: timolol,
      severity: 'moderate',
      description: 'Additive IOP-lowering effect when used together',
      clinicalEffects: ['Enhanced IOP reduction', 'Potential systemic beta-blocker effects'],
      management: 'Monitor IOP closely. Consider fixed-dose combination product.',
      references: ['AAO Preferred Practice Pattern'],
    });

    this.interactions.set('int-prednisolone-nsaid', {
      id: 'int-prednisolone-nsaid',
      drug1: prednisolone,
      drug2: ketorolac,
      severity: 'minor',
      description: 'Combined use may increase risk of delayed wound healing',
      clinicalEffects: ['Delayed corneal healing', 'Increased risk of infection'],
      management: 'Monitor healing progress. Avoid prolonged concurrent use post-surgery.',
      references: ['Clinical trials data'],
    });

    logger.info('Drug database initialized with sample data');
  }

  /**
   * Register drug
   */
  static registerDrug(drug: Omit<Drug, 'id'>): Drug {
    const newDrug: Drug = {
      id: crypto.randomUUID(),
      ...drug,
    };

    this.drugs.set(newDrug.id, newDrug);

    logger.info({ drugId: newDrug.id, name: drug.name }, 'Drug registered');

    return newDrug;
  }

  /**
   * Get drug
   */
  static getDrug(drugId: string): Drug | null {
    return this.drugs.get(drugId) || null;
  }

  /**
   * Search drugs
   */
  static searchDrugs(query: string): Drug[] {
    const searchTerm = query.toLowerCase();

    return Array.from(this.drugs.values()).filter(
      (drug) =>
        drug.name.toLowerCase().includes(searchTerm) ||
        drug.genericName.toLowerCase().includes(searchTerm) ||
        drug.brandNames.some((brand) => brand.toLowerCase().includes(searchTerm))
    );
  }

  // ========== Drug Interaction Checking ==========

  /**
   * Check drug interactions
   */
  static checkDrugInteractions(drugIds: string[]): DrugInteraction[] {
    const interactions: DrugInteraction[] = [];

    // Check all pairs
    for (let i = 0; i < drugIds.length; i++) {
      for (let j = i + 1; j < drugIds.length; j++) {
        const drug1 = this.drugs.get(drugIds[i]);
        const drug2 = this.drugs.get(drugIds[j]);

        if (!drug1 || !drug2) {
          continue;
        }

        // Check if interaction exists
        const interaction = Array.from(this.interactions.values()).find(
          (int) =>
            (int.drug1.id === drug1.id && int.drug2.id === drug2.id) ||
            (int.drug1.id === drug2.id && int.drug2.id === drug1.id)
        );

        if (interaction) {
          interactions.push(interaction);
        }
      }
    }

    return interactions.sort((a, b) => {
      const severityOrder = { contraindicated: 4, major: 3, moderate: 2, minor: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  /**
   * Check allergies
   */
  static checkAllergies(patientAllergies: string[], drugId: string): AllergyAlert[] {
    const drug = this.drugs.get(drugId);

    if (!drug) {
      return [];
    }

    const alerts: AllergyAlert[] = [];

    for (const allergy of patientAllergies) {
      const allergyLower = allergy.toLowerCase();

      // Check direct match
      if (
        drug.name.toLowerCase().includes(allergyLower) ||
        drug.genericName.toLowerCase().includes(allergyLower) ||
        drug.brandNames.some((brand) => brand.toLowerCase().includes(allergyLower))
      ) {
        alerts.push({
          id: crypto.randomUUID(),
          severity: 'critical',
          allergen: allergy,
          drug,
          message: `Patient has documented allergy to ${allergy}`,
        });
      }

      // Check drug class
      if (drug.drugClass.toLowerCase().includes(allergyLower)) {
        alerts.push({
          id: crypto.randomUUID(),
          severity: 'warning',
          allergen: allergy,
          drug,
          message: `Patient has allergy to ${allergy} - ${drug.name} is in same class`,
          crossReactivity: [drug.drugClass],
        });
      }
    }

    return alerts;
  }

  // ========== Clinical Guidelines ==========

  /**
   * Initialize guidelines
   */
  private static initializeGuidelines(): void {
    const glaucomaGuideline: ClinicalGuideline = {
      id: 'guideline-glaucoma',
      name: 'Primary Open-Angle Glaucoma',
      condition: 'glaucoma',
      organization: 'AAO',
      version: '2020',
      lastUpdated: new Date('2020-01-01'),
      recommendations: [
        {
          id: 'rec-glaucoma-1',
          title: 'Initial IOP Reduction Target',
          description: 'Reduce IOP by at least 25% from baseline',
          strengthOfRecommendation: 'A',
          qualityOfEvidence: 'high',
          applicableCriteria: ['newly_diagnosed', 'mild_to_moderate'],
        },
        {
          id: 'rec-glaucoma-2',
          title: 'Prostaglandin Analog as First-Line',
          description: 'Prostaglandin analogs recommended as first-line therapy',
          strengthOfRecommendation: 'A',
          qualityOfEvidence: 'high',
        },
        {
          id: 'rec-glaucoma-3',
          title: 'Fixed Combination Therapy',
          description: 'Consider fixed combination if monotherapy insufficient',
          strengthOfRecommendation: 'B',
          qualityOfEvidence: 'moderate',
          applicableCriteria: ['inadequate_response_monotherapy'],
        },
      ],
    };

    const diabeticRetinopathyGuideline: ClinicalGuideline = {
      id: 'guideline-dr',
      name: 'Diabetic Retinopathy',
      condition: 'diabetic_retinopathy',
      organization: 'AAO',
      version: '2019',
      lastUpdated: new Date('2019-01-01'),
      recommendations: [
        {
          id: 'rec-dr-1',
          title: 'Annual Dilated Eye Exam',
          description: 'All diabetic patients should have annual comprehensive eye exam',
          strengthOfRecommendation: 'A',
          qualityOfEvidence: 'high',
        },
        {
          id: 'rec-dr-2',
          title: 'Anti-VEGF for DME',
          description: 'Anti-VEGF injections for center-involved diabetic macular edema',
          strengthOfRecommendation: 'A',
          qualityOfEvidence: 'high',
          applicableCriteria: ['center_involved_dme', 'vision_loss'],
        },
        {
          id: 'rec-dr-3',
          title: 'Panretinal Photocoagulation',
          description: 'PRP for proliferative diabetic retinopathy',
          strengthOfRecommendation: 'A',
          qualityOfEvidence: 'high',
          applicableCriteria: ['pdr', 'high_risk_characteristics'],
        },
      ],
    };

    this.guidelines.set(glaucomaGuideline.id, glaucomaGuideline);
    this.guidelines.set(diabeticRetinopathyGuideline.id, diabeticRetinopathyGuideline);

    logger.info('Clinical guidelines initialized');
  }

  /**
   * Get guideline
   */
  static getGuideline(guidelineId: string): ClinicalGuideline | null {
    return this.guidelines.get(guidelineId) || null;
  }

  /**
   * Search guidelines
   */
  static searchGuidelines(condition: string): ClinicalGuideline[] {
    const conditionLower = condition.toLowerCase();

    return Array.from(this.guidelines.values()).filter(
      (guideline) =>
        guideline.condition.toLowerCase().includes(conditionLower) ||
        guideline.name.toLowerCase().includes(conditionLower)
    );
  }

  /**
   * Get applicable recommendations
   */
  static getApplicableRecommendations(
    guidelineId: string,
    patientCriteria: string[]
  ): GuidelineRecommendation[] {
    const guideline = this.guidelines.get(guidelineId);

    if (!guideline) {
      return [];
    }

    return guideline.recommendations.filter((rec) => {
      // If no criteria specified, recommendation applies to all
      if (!rec.applicableCriteria || rec.applicableCriteria.length === 0) {
        return true;
      }

      // Check if patient meets any applicable criteria
      return rec.applicableCriteria.some((criteria) =>
        patientCriteria.includes(criteria)
      );
    });
  }

  // ========== Treatment Recommendations ==========

  /**
   * Generate treatment recommendations
   */
  static generateTreatmentRecommendations(
    patientId: string,
    condition: string,
    diagnosis: string,
    patientCriteria: string[]
  ): TreatmentRecommendation {
    const guidelines = this.searchGuidelines(condition);
    const recommendations: TreatmentRecommendation['recommendations'] = [];
    const guidelineReferences: string[] = [];

    // Get recommendations from guidelines
    for (const guideline of guidelines) {
      const applicable = this.getApplicableRecommendations(
        guideline.id,
        patientCriteria
      );

      for (const rec of applicable) {
        recommendations.push({
          treatment: rec.title,
          rationale: rec.description,
          confidence: this.mapEvidenceToConfidence(rec.qualityOfEvidence),
          evidenceLevel: `${rec.strengthOfRecommendation} (${rec.qualityOfEvidence})`,
          contraindications: rec.contraindications,
        });

        if (!guidelineReferences.includes(guideline.name)) {
          guidelineReferences.push(`${guideline.organization} - ${guideline.name}`);
        }
      }
    }

    const recommendation: TreatmentRecommendation = {
      id: crypto.randomUUID(),
      patientId,
      condition,
      diagnosis,
      recommendations,
      guidelineReferences,
      createdAt: new Date(),
    };

    this.recommendations.push(recommendation);

    logger.info(
      { patientId, condition, recommendationCount: recommendations.length },
      'Treatment recommendations generated'
    );

    return recommendation;
  }

  /**
   * Map evidence quality to confidence level
   */
  private static mapEvidenceToConfidence(
    evidenceQuality: GuidelineRecommendation['qualityOfEvidence']
  ): ConfidenceLevel {
    const mapping = {
      high: 'very_high' as ConfidenceLevel,
      moderate: 'high' as ConfidenceLevel,
      low: 'medium' as ConfidenceLevel,
      very_low: 'low' as ConfidenceLevel,
    };

    return mapping[evidenceQuality];
  }

  // ========== Diagnostic Assistance ==========

  /**
   * Generate diagnostic suggestions
   */
  static generateDiagnosticSuggestions(
    patientId: string,
    symptoms: string[],
    labResults?: Record<string, any>,
    vitalSigns?: Record<string, number>
  ): DiagnosticSuggestion {
    const possibleDiagnoses: DiagnosticSuggestion['possibleDiagnoses'] = [];

    // Simple rule-based diagnostic suggestions (in production, use ML model)

    // Check for glaucoma indicators
    if (
      symptoms.includes('vision_loss') ||
      symptoms.includes('peripheral_vision_loss') ||
      (vitalSigns?.['iop'] && vitalSigns['iop'] > 21)
    ) {
      possibleDiagnoses.push({
        condition: 'Primary Open-Angle Glaucoma',
        icd10Code: 'H40.11',
        probability: 75,
        supportingFactors: [
          vitalSigns?.['iop'] ? `Elevated IOP: ${vitalSigns['iop']} mmHg` : '',
          symptoms.includes('peripheral_vision_loss') ? 'Peripheral vision loss' : '',
        ].filter(Boolean),
        differentialDiagnoses: ['Normal-tension glaucoma', 'Angle-closure glaucoma'],
        recommendedTests: ['Visual field test', 'OCT', 'Gonioscopy', 'Pachymetry'],
        urgency: vitalSigns?.['iop'] && vitalSigns['iop'] > 30 ? 'urgent' : 'routine',
      });
    }

    // Check for diabetic retinopathy
    if (
      symptoms.includes('blurred_vision') &&
      (labResults?.['hba1c'] && labResults['hba1c'] > 7.0)
    ) {
      possibleDiagnoses.push({
        condition: 'Diabetic Retinopathy',
        icd10Code: 'E11.319',
        probability: 70,
        supportingFactors: [
          labResults?.['hba1c'] ? `Elevated HbA1c: ${labResults['hba1c']}%` : '',
          'Blurred vision',
          'History of diabetes',
        ].filter(Boolean),
        differentialDiagnoses: ['Diabetic macular edema', 'Cataract', 'Refractive error'],
        recommendedTests: ['Fundus photography', 'OCT', 'Fluorescein angiography'],
        urgency: 'routine',
      });
    }

    // Check for dry eye
    if (
      symptoms.includes('burning') ||
      symptoms.includes('itching') ||
      symptoms.includes('foreign_body_sensation')
    ) {
      possibleDiagnoses.push({
        condition: 'Dry Eye Disease',
        icd10Code: 'H04.123',
        probability: 65,
        supportingFactors: symptoms.filter((s) =>
          ['burning', 'itching', 'foreign_body_sensation', 'redness'].includes(s)
        ),
        differentialDiagnoses: ['Allergic conjunctivitis', 'Blepharitis', 'Meibomian gland dysfunction'],
        recommendedTests: ['Tear breakup time', 'Schirmer test', 'Meibography'],
        urgency: 'routine',
      });
    }

    // Sort by probability
    possibleDiagnoses.sort((a, b) => b.probability - a.probability);

    const suggestion: DiagnosticSuggestion = {
      id: crypto.randomUUID(),
      patientId,
      symptoms,
      labResults,
      vitalSigns,
      possibleDiagnoses,
      confidence: possibleDiagnoses.length > 0 ? 'medium' : 'low',
      createdAt: new Date(),
    };

    this.diagnosticSuggestions.push(suggestion);

    logger.info(
      { patientId, diagnosisCount: possibleDiagnoses.length },
      'Diagnostic suggestions generated'
    );

    return suggestion;
  }

  // ========== Lab Result Interpretation ==========

  /**
   * Interpret lab result
   */
  static interpretLabResult(
    testName: string,
    value: number,
    unit: string
  ): LabInterpretation {
    // Define reference ranges for common tests
    const referenceRanges: Record<
      string,
      { min: number; max: number; critical?: { low: number; high: number } }
    > = {
      'glucose': { min: 70, max: 100, critical: { low: 50, high: 200 } },
      'hba1c': { min: 4.0, max: 5.6, critical: { low: 0, high: 9.0 } },
      'cholesterol': { min: 0, max: 200 },
      'hdl': { min: 40, max: 1000 },
      'ldl': { min: 0, max: 100 },
      'triglycerides': { min: 0, max: 150 },
      'hemoglobin': { min: 12.0, max: 16.0, critical: { low: 7.0, high: 20.0 } },
      'wbc': { min: 4.5, max: 11.0, critical: { low: 2.0, high: 30.0 } },
    };

    const testNameLower = testName.toLowerCase();
    const range = referenceRanges[testNameLower] || { min: 0, max: 100 };

    let status: LabInterpretation['status'] = 'normal';
    let interpretation = '';
    let clinicalSignificance = '';
    const recommendedActions: string[] = [];
    const relatedConditions: string[] = [];

    // Determine status
    if (range.critical && (value <= range.critical.low || value >= range.critical.high)) {
      status = 'critical';
    } else if (value < range.min) {
      status = 'low';
    } else if (value > range.max) {
      status = 'high';
    }

    // Generate interpretation
    switch (testNameLower) {
      case 'hba1c':
        if (value < 5.7) {
          interpretation = 'Normal glucose metabolism';
          clinicalSignificance = 'Low risk of diabetes';
        } else if (value < 6.5) {
          interpretation = 'Pre-diabetes range';
          clinicalSignificance = 'Increased risk of developing type 2 diabetes';
          recommendedActions.push('Lifestyle modifications', 'Repeat test in 3 months');
          relatedConditions.push('Diabetic retinopathy risk');
        } else {
          interpretation = 'Diabetes range';
          clinicalSignificance = 'Diagnostic for diabetes mellitus';
          recommendedActions.push(
            'Initiate diabetes management',
            'Comprehensive eye exam',
            'Referral to endocrinologist'
          );
          relatedConditions.push('Diabetic retinopathy', 'Diabetic macular edema');
        }
        break;

      case 'glucose':
        if (value < 70) {
          interpretation = 'Hypoglycemia';
          clinicalSignificance = 'Low blood sugar - may cause symptoms';
          recommendedActions.push('Check for medications causing hypoglycemia');
        } else if (value <= 100) {
          interpretation = 'Normal fasting glucose';
        } else if (value <= 125) {
          interpretation = 'Impaired fasting glucose';
          recommendedActions.push('HbA1c test', 'Lifestyle modifications');
        } else {
          interpretation = 'Hyperglycemia';
          recommendedActions.push('Confirm with repeat test', 'HbA1c test');
        }
        break;

      default:
        interpretation = `Value is ${status}`;
        clinicalSignificance = `${value} ${unit} (normal range: ${range.min}-${range.max} ${unit})`;
    }

    return {
      id: crypto.randomUUID(),
      testName,
      value,
      unit,
      referenceRange: range,
      status,
      interpretation,
      clinicalSignificance,
      recommendedActions: recommendedActions.length > 0 ? recommendedActions : undefined,
      relatedConditions: relatedConditions.length > 0 ? relatedConditions : undefined,
    };
  }

  // ========== Clinical Alerts ==========

  /**
   * Create clinical alert
   */
  static createAlert(
    patientId: string,
    type: ClinicalAlert['type'],
    severity: AlertSeverity,
    message: string,
    details: string,
    recommendations: string[],
    requiresAcknowledgment: boolean = false
  ): ClinicalAlert {
    const alert: ClinicalAlert = {
      id: crypto.randomUUID(),
      patientId,
      type,
      severity,
      message,
      details,
      recommendations,
      requiresAcknowledgment,
      createdAt: new Date(),
    };

    this.alerts.push(alert);

    // Clean up old alerts
    const cutoff = new Date(Date.now() - this.ALERT_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    this.alerts = this.alerts.filter((a) => a.createdAt >= cutoff);

    logger.warn({ alertId: alert.id, patientId, type, severity }, 'Clinical alert created');

    return alert;
  }

  /**
   * Get alerts
   */
  static getAlerts(
    patientId?: string,
    type?: ClinicalAlert['type'],
    severity?: AlertSeverity
  ): ClinicalAlert[] {
    let alerts = this.alerts;

    if (patientId) {
      alerts = alerts.filter((a) => a.patientId === patientId);
    }

    if (type) {
      alerts = alerts.filter((a) => a.type === type);
    }

    if (severity) {
      alerts = alerts.filter((a) => a.severity === severity);
    }

    return alerts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Acknowledge alert
   */
  static acknowledgeAlert(alertId: string, userId: string): ClinicalAlert | null {
    const alert = this.alerts.find((a) => a.id === alertId);

    if (!alert) {
      return null;
    }

    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = userId;

    logger.info({ alertId, userId }, 'Clinical alert acknowledged');

    return alert;
  }

  // ========== Statistics ==========

  /**
   * Get statistics
   */
  static getStatistics(): {
    totalDrugs: number;
    totalInteractions: number;
    totalGuidelines: number;
    totalAlerts: number;
    criticalAlerts: number;
    unacknowledgedAlerts: number;
  } {
    const criticalAlerts = this.alerts.filter((a) => a.severity === 'critical').length;
    const unacknowledgedAlerts = this.alerts.filter((a) => !a.acknowledgedAt).length;

    return {
      totalDrugs: this.drugs.size,
      totalInteractions: this.interactions.size,
      totalGuidelines: this.guidelines.size,
      totalAlerts: this.alerts.length,
      criticalAlerts,
      unacknowledgedAlerts,
    };
  }
}
