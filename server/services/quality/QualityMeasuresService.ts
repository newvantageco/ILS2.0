/**
 * Quality Measures Service
 *
 * STATUS: Database infrastructure ready, service migration in progress
 *
 * ✅ COMPLETED:
 * - Database tables created (quality_measures, measure_calculations, star_ratings, etc.)
 * - Storage CRUD methods implemented
 *
 * ⏳ TODO: Migrate service methods from in-memory Maps to database
 * - Update createQualityMeasure to use db.createQualityMeasure
 * - Update getQualityMeasures to use db.getQualityMeasures
 * - Update all other methods to use database
 *
 * TEMPORARY: Service still uses in-memory Maps (data loss risk remains)
 */

import { v4 as uuidv4 } from 'uuid';
import logger from '../../utils/logger';
import { storage, type IStorage } from '../../storage';

// ============================================================================
// Quality Measures Types
// ============================================================================

export type MeasureType = 'HEDIS' | 'MIPS' | 'CQM' | 'Star_Rating' | 'Core_Measure' | 'Custom';
export type MeasureDomain = 'effectiveness' | 'access' | 'experience' | 'utilization' | 'safety' | 'care_coordination';

export interface QualityMeasure {
  id: string;
  measureId: string;
  name: string;
  type: MeasureType;
  domain: MeasureDomain;
  description: string;
  numeratorCriteria: string;
  denominatorCriteria: string;
  exclusionCriteria?: string;
  targetRate: number;
  reportingYear: number;
  active: boolean;
  evidenceSource: string;
  steward: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MeasureCalculation {
  id: string;
  measureId: string;
  calculationDate: Date;
  reportingPeriodStart: Date;
  reportingPeriodEnd: Date;
  numerator: number;
  denominator: number;
  exclusions: number;
  rate: number;
  targetRate: number;
  performanceGap: number;
  meetingTarget: boolean;
  patientList: MeasurePatient[];
  calculatedBy: string;
  createdAt: Date;
}

export interface MeasurePatient {
  patientId: string;
  inDenominator: boolean;
  inNumerator: boolean;
  excluded: boolean;
  exclusionReason?: string;
  complianceDate?: Date;
  gapClosure?: {
    gapIdentified: boolean;
    gapClosureDate?: Date;
    interventions: string[];
  };
}

export interface HEDISMeasure extends QualityMeasure {
  hedisVersion: string;
  productLine: 'Commercial' | 'Medicaid' | 'Medicare';
  category: string;
}

export interface MIPSMeasure extends QualityMeasure {
  mipsId: string;
  qualityId: string;
  measureType: 'process' | 'outcome' | 'structure' | 'efficiency' | 'patient_reported_outcome';
  highPriority: boolean;
  inverseIndicator: boolean;
  points: number;
}

export interface StarRating {
  id: string;
  contractId: string;
  measurementYear: number;
  partCRating: number;
  partDRating: number;
  overallRating: number;
  measures: StarRatingMeasure[];
  calculatedDate: Date;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StarRatingMeasure {
  measureId: string;
  measureName: string;
  domain: string;
  weight: number;
  score: number;
  stars: number;
  cut1: number;
  cut2: number;
  cut3: number;
  cut4: number;
  cut5: number;
}

export interface ClinicalQualityMeasure {
  id: string;
  cmsId: string;
  nqfId?: string;
  name: string;
  description: string;
  measureSet: string;
  reportingMethod: 'eCQM' | 'MIPS_CQM' | 'Registry' | 'Claims';
  version: string;
  active: boolean;
  createdAt: Date;
}

export interface QualityGapAnalysis {
  id: string;
  measureId: string;
  analysisDate: Date;
  totalGaps: number;
  closableGaps: number;
  potentialRateImprovement: number;
  gapsByReason: {
    reason: string;
    count: number;
    percentage: number;
  }[];
  recommendedActions: string[];
  projectedImpact: {
    currentRate: number;
    projectedRate: number;
    rateImprovement: number;
  };
  createdBy: string;
  createdAt: Date;
}

export interface QualityDashboard {
  id: string;
  name: string;
  description: string;
  measures: string[];
  filters: {
    provider?: string;
    location?: string;
    payerType?: string;
    dateRange?: {
      start: Date;
      end: Date;
    };
  };
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Quality Measures Service
// ============================================================================

export class QualityMeasuresService {
  private static db: IStorage = storage;

  /**
   * Legacy in-memory storage - TO BE REMOVED
   * @deprecated Database tables and storage methods are ready. Service methods need migration.
   * WARNING: Data stored in these Maps will be lost on server restart.
   */
  private static qualityMeasures: Map<string, QualityMeasure> = new Map();
  private static measureCalculations: Map<string, MeasureCalculation> = new Map();
  private static starRatings: Map<string, StarRating> = new Map();
  private static gapAnalyses: Map<string, QualityGapAnalysis> = new Map();
  private static dashboards: Map<string, QualityDashboard> = new Map();

  // Initialize with default measures
  static {
    this.initializeDefaultMeasures();
  }

  // ============================================================================
  // Quality Measure Management
  // ============================================================================

  static createQualityMeasure(data: {
    measureId: string;
    name: string;
    type: MeasureType;
    domain: MeasureDomain;
    description: string;
    numeratorCriteria: string;
    denominatorCriteria: string;
    exclusionCriteria?: string;
    targetRate: number;
    reportingYear: number;
    evidenceSource: string;
    steward: string;
  }): QualityMeasure {
    const id = uuidv4();

    const measure: QualityMeasure = {
      id,
      measureId: data.measureId,
      name: data.name,
      type: data.type,
      domain: data.domain,
      description: data.description,
      numeratorCriteria: data.numeratorCriteria,
      denominatorCriteria: data.denominatorCriteria,
      exclusionCriteria: data.exclusionCriteria,
      targetRate: data.targetRate,
      reportingYear: data.reportingYear,
      active: true,
      evidenceSource: data.evidenceSource,
      steward: data.steward,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.qualityMeasures.set(id, measure);
    logger.info(`Quality measure created: ${data.measureId} - ${data.name}`);

    return measure;
  }

  static getQualityMeasureById(id: string): QualityMeasure | undefined {
    return this.qualityMeasures.get(id);
  }

  static getQualityMeasureByMeasureId(measureId: string): QualityMeasure | undefined {
    return Array.from(this.qualityMeasures.values()).find((m) => m.measureId === measureId);
  }

  static getQualityMeasures(
    type?: MeasureType,
    activeOnly: boolean = true
  ): QualityMeasure[] {
    let measures = Array.from(this.qualityMeasures.values());

    if (type) {
      measures = measures.filter((m) => m.type === type);
    }

    if (activeOnly) {
      measures = measures.filter((m) => m.active);
    }

    return measures;
  }

  // ============================================================================
  // Measure Calculation
  // ============================================================================

  static calculateMeasure(data: {
    measureId: string;
    reportingPeriodStart: Date;
    reportingPeriodEnd: Date;
    patientList: MeasurePatient[];
    calculatedBy: string;
  }): MeasureCalculation {
    const id = uuidv4();
    const measure = this.getQualityMeasureByMeasureId(data.measureId);

    if (!measure) {
      throw new Error(`Quality measure not found: ${data.measureId}`);
    }

    // Calculate numerator, denominator, and exclusions
    const denominator = data.patientList.filter((p) => p.inDenominator && !p.excluded).length;
    const numerator = data.patientList.filter((p) => p.inNumerator && !p.excluded).length;
    const exclusions = data.patientList.filter((p) => p.excluded).length;

    // Calculate rate
    const rate = denominator > 0 ? (numerator / denominator) * 100 : 0;

    // Calculate performance gap
    const performanceGap = measure.targetRate - rate;

    const calculation: MeasureCalculation = {
      id,
      measureId: data.measureId,
      calculationDate: new Date(),
      reportingPeriodStart: data.reportingPeriodStart,
      reportingPeriodEnd: data.reportingPeriodEnd,
      numerator,
      denominator,
      exclusions,
      rate: Math.round(rate * 100) / 100,
      targetRate: measure.targetRate,
      performanceGap: Math.round(performanceGap * 100) / 100,
      meetingTarget: rate >= measure.targetRate,
      patientList: data.patientList,
      calculatedBy: data.calculatedBy,
      createdAt: new Date(),
    };

    this.measureCalculations.set(id, calculation);
    logger.info(
      `Measure calculated: ${data.measureId} - Rate: ${calculation.rate}% (Target: ${measure.targetRate}%)`
    );

    return calculation;
  }

  static getMeasureCalculationById(id: string): MeasureCalculation | undefined {
    return this.measureCalculations.get(id);
  }

  static getMeasureCalculations(
    measureId?: string,
    startDate?: Date,
    endDate?: Date
  ): MeasureCalculation[] {
    let calculations = Array.from(this.measureCalculations.values());

    if (measureId) {
      calculations = calculations.filter((c) => c.measureId === measureId);
    }

    if (startDate) {
      calculations = calculations.filter((c) => c.calculationDate >= startDate);
    }

    if (endDate) {
      calculations = calculations.filter((c) => c.calculationDate <= endDate);
    }

    return calculations.sort((a, b) => b.calculationDate.getTime() - a.calculationDate.getTime());
  }

  static getLatestCalculation(measureId: string): MeasureCalculation | undefined {
    const calculations = this.getMeasureCalculations(measureId);
    return calculations[0];
  }

  // ============================================================================
  // Gap Analysis
  // ============================================================================

  static performGapAnalysis(data: {
    measureId: string;
    calculationId?: string;
    createdBy: string;
  }): QualityGapAnalysis {
    const id = uuidv4();

    // Get latest calculation if not provided
    let calculation: MeasureCalculation | undefined;
    if (data.calculationId) {
      calculation = this.measureCalculations.get(data.calculationId);
    } else {
      calculation = this.getLatestCalculation(data.measureId);
    }

    if (!calculation) {
      throw new Error(`No calculation found for measure: ${data.measureId}`);
    }

    const measure = this.getQualityMeasureByMeasureId(data.measureId);
    if (!measure) {
      throw new Error(`Measure not found: ${data.measureId}`);
    }

    // Analyze gaps
    const gaps = calculation.patientList.filter(
      (p) => p.inDenominator && !p.inNumerator && !p.excluded
    );
    const totalGaps = gaps.length;

    // Identify closable gaps (those with identified closure opportunities)
    const closableGaps = gaps.filter((p) => p.gapClosure?.gapIdentified).length;

    // Calculate potential rate improvement if all closable gaps are closed
    const potentialNumerator = calculation.numerator + closableGaps;
    const potentialRate = (potentialNumerator / calculation.denominator) * 100;
    const potentialImprovement = potentialRate - calculation.rate;

    // Analyze gaps by reason
    const gapReasons = new Map<string, number>();
    for (const gap of gaps) {
      if (gap.gapClosure?.interventions) {
        for (const intervention of gap.gapClosure.interventions) {
          const count = gapReasons.get(intervention) || 0;
          gapReasons.set(intervention, count + 1);
        }
      } else {
        const count = gapReasons.get('unspecified') || 0;
        gapReasons.set('unspecified', count + 1);
      }
    }

    const gapsByReason = Array.from(gapReasons.entries()).map(([reason, count]) => ({
      reason,
      count,
      percentage: Math.round((count / totalGaps) * 100),
    }));

    // Generate recommended actions
    const recommendedActions = this.generateRecommendedActions(
      measure,
      calculation,
      gapsByReason
    );

    const analysis: QualityGapAnalysis = {
      id,
      measureId: data.measureId,
      analysisDate: new Date(),
      totalGaps,
      closableGaps,
      potentialRateImprovement: Math.round(potentialImprovement * 100) / 100,
      gapsByReason,
      recommendedActions,
      projectedImpact: {
        currentRate: calculation.rate,
        projectedRate: Math.round(potentialRate * 100) / 100,
        rateImprovement: Math.round(potentialImprovement * 100) / 100,
      },
      createdBy: data.createdBy,
      createdAt: new Date(),
    };

    this.gapAnalyses.set(id, analysis);
    logger.info(
      `Gap analysis completed for ${data.measureId}: ${totalGaps} total gaps, ${closableGaps} closable`
    );

    return analysis;
  }

  static getGapAnalysisById(id: string): QualityGapAnalysis | undefined {
    return this.gapAnalyses.get(id);
  }

  static getGapAnalysesByMeasure(measureId: string): QualityGapAnalysis[] {
    return Array.from(this.gapAnalyses.values())
      .filter((a) => a.measureId === measureId)
      .sort((a, b) => b.analysisDate.getTime() - a.analysisDate.getTime());
  }

  private static generateRecommendedActions(
    measure: QualityMeasure,
    calculation: MeasureCalculation,
    gapsByReason: { reason: string; count: number; percentage: number }[]
  ): string[] {
    const actions: string[] = [];

    // Generic recommendations based on performance gap
    if (calculation.performanceGap > 20) {
      actions.push('Implement systematic outreach program for all patients in denominator');
      actions.push('Review and update clinical workflows to improve measure compliance');
    } else if (calculation.performanceGap > 10) {
      actions.push('Target outreach to patients with identified gaps');
      actions.push('Provide point-of-care reminders for measure compliance');
    }

    // Specific recommendations based on gap reasons
    const topReasons = gapsByReason.slice(0, 3);
    for (const reason of topReasons) {
      if (reason.percentage > 20) {
        actions.push(`Address ${reason.reason} gaps (${reason.percentage}% of total gaps)`);
      }
    }

    // Measure-specific recommendations
    if (measure.type === 'HEDIS') {
      actions.push('Review HEDIS technical specifications for compliance opportunities');
    }

    if (calculation.rate < measure.targetRate * 0.8) {
      actions.push('Consider implementing quality improvement initiative for this measure');
    }

    return actions;
  }

  // ============================================================================
  // Star Ratings
  // ============================================================================

  static calculateStarRating(data: {
    contractId: string;
    measurementYear: number;
    measures: StarRatingMeasure[];
  }): StarRating {
    const id = uuidv4();

    // Calculate weighted scores for Part C and Part D
    let partCWeightedScore = 0;
    let partCTotalWeight = 0;
    let partDWeightedScore = 0;
    let partDTotalWeight = 0;

    for (const measure of data.measures) {
      const weightedStars = measure.stars * measure.weight;

      if (measure.domain.includes('Part C') || measure.domain.includes('Health')) {
        partCWeightedScore += weightedStars;
        partCTotalWeight += measure.weight;
      }

      if (measure.domain.includes('Part D') || measure.domain.includes('Drug')) {
        partDWeightedScore += weightedStars;
        partDTotalWeight += measure.weight;
      }
    }

    const partCRating =
      partCTotalWeight > 0
        ? Math.round((partCWeightedScore / partCTotalWeight) * 10) / 10
        : 0;
    const partDRating =
      partDTotalWeight > 0
        ? Math.round((partDWeightedScore / partDTotalWeight) * 10) / 10
        : 0;

    // Overall rating is weighted average of Part C and Part D
    const overallRating = Math.round(((partCRating + partDRating) / 2) * 10) / 10;

    const starRating: StarRating = {
      id,
      contractId: data.contractId,
      measurementYear: data.measurementYear,
      partCRating,
      partDRating,
      overallRating,
      measures: data.measures,
      calculatedDate: new Date(),
      published: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.starRatings.set(id, starRating);
    logger.info(
      `Star rating calculated for contract ${data.contractId}: ${overallRating} stars`
    );

    return starRating;
  }

  static getStarRatingById(id: string): StarRating | undefined {
    return this.starRatings.get(id);
  }

  static getStarRatingsByContract(contractId: string): StarRating[] {
    return Array.from(this.starRatings.values())
      .filter((r) => r.contractId === contractId)
      .sort((a, b) => b.measurementYear - a.measurementYear);
  }

  static publishStarRating(id: string): StarRating {
    const rating = this.starRatings.get(id);
    if (!rating) {
      throw new Error('Star rating not found');
    }

    rating.published = true;
    rating.updatedAt = new Date();

    this.starRatings.set(id, rating);
    logger.info(`Star rating published for contract ${rating.contractId}`);

    return rating;
  }

  // ============================================================================
  // Quality Dashboards
  // ============================================================================

  static createQualityDashboard(data: {
    name: string;
    description: string;
    measures: string[];
    filters?: QualityDashboard['filters'];
    createdBy: string;
  }): QualityDashboard {
    const id = uuidv4();

    const dashboard: QualityDashboard = {
      id,
      name: data.name,
      description: data.description,
      measures: data.measures,
      filters: data.filters || {},
      createdBy: data.createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.dashboards.set(id, dashboard);
    logger.info(`Quality dashboard created: ${data.name}`);

    return dashboard;
  }

  static getQualityDashboardById(id: string): QualityDashboard | undefined {
    return this.dashboards.get(id);
  }

  static getQualityDashboards(): QualityDashboard[] {
    return Array.from(this.dashboards.values());
  }

  static updateQualityDashboard(
    id: string,
    updates: Partial<Omit<QualityDashboard, 'id' | 'createdBy' | 'createdAt'>>
  ): QualityDashboard {
    const dashboard = this.dashboards.get(id);
    if (!dashboard) {
      throw new Error('Quality dashboard not found');
    }

    Object.assign(dashboard, updates);
    dashboard.updatedAt = new Date();

    this.dashboards.set(id, dashboard);
    logger.info(`Quality dashboard updated: ${id}`);

    return dashboard;
  }

  // ============================================================================
  // Default Data Initialization
  // ============================================================================

  private static initializeDefaultMeasures(): void {
    // HEDIS Measures
    this.createQualityMeasure({
      measureId: 'CDC',
      name: 'Comprehensive Diabetes Care - HbA1c Control (<8%)',
      type: 'HEDIS',
      domain: 'effectiveness',
      description: 'Percentage of patients 18-75 years of age with diabetes (type 1 and type 2) whose HbA1c was <8.0% during the measurement year',
      numeratorCriteria: 'HbA1c <8.0% or HbA1c <8.0% documented during the measurement year',
      denominatorCriteria: 'Patients 18-75 years with diabetes',
      exclusionCriteria: 'Polycystic ovarian syndrome or steroid-induced diabetes',
      targetRate: 60,
      reportingYear: 2024,
      evidenceSource: 'HEDIS 2024 Technical Specifications',
      steward: 'NCQA',
    });

    this.createQualityMeasure({
      measureId: 'CDC-BP',
      name: 'Comprehensive Diabetes Care - Blood Pressure Control (<140/90)',
      type: 'HEDIS',
      domain: 'effectiveness',
      description: 'Percentage of patients 18-75 years of age with diabetes whose BP was <140/90 mmHg during the measurement year',
      numeratorCriteria: 'Most recent BP <140/90 mmHg',
      denominatorCriteria: 'Patients 18-75 years with diabetes',
      targetRate: 65,
      reportingYear: 2024,
      evidenceSource: 'HEDIS 2024 Technical Specifications',
      steward: 'NCQA',
    });

    this.createQualityMeasure({
      measureId: 'CDC-EYE',
      name: 'Comprehensive Diabetes Care - Eye Exam',
      type: 'HEDIS',
      domain: 'effectiveness',
      description: 'Percentage of patients 18-75 years of age with diabetes who had a retinal or dilated eye exam',
      numeratorCriteria: 'Retinal or dilated eye exam during the measurement year or year prior',
      denominatorCriteria: 'Patients 18-75 years with diabetes',
      targetRate: 55,
      reportingYear: 2024,
      evidenceSource: 'HEDIS 2024 Technical Specifications',
      steward: 'NCQA',
    });

    this.createQualityMeasure({
      measureId: 'CBP',
      name: 'Controlling High Blood Pressure',
      type: 'HEDIS',
      domain: 'effectiveness',
      description: 'Percentage of patients 18-85 years of age with hypertension whose BP was <140/90 mmHg',
      numeratorCriteria: 'Most recent BP <140/90 mmHg',
      denominatorCriteria: 'Patients 18-85 years with hypertension',
      targetRate: 60,
      reportingYear: 2024,
      evidenceSource: 'HEDIS 2024 Technical Specifications',
      steward: 'NCQA',
    });

    this.createQualityMeasure({
      measureId: 'BCS',
      name: 'Breast Cancer Screening',
      type: 'HEDIS',
      domain: 'effectiveness',
      description: 'Percentage of women 50-74 years of age who had a mammogram to screen for breast cancer',
      numeratorCriteria: 'Mammogram during measurement year or year prior',
      denominatorCriteria: 'Women 50-74 years',
      exclusionCriteria: 'Bilateral mastectomy or history of breast cancer',
      targetRate: 70,
      reportingYear: 2024,
      evidenceSource: 'HEDIS 2024 Technical Specifications',
      steward: 'NCQA',
    });

    this.createQualityMeasure({
      measureId: 'COL',
      name: 'Colorectal Cancer Screening',
      type: 'HEDIS',
      domain: 'effectiveness',
      description: 'Percentage of adults 50-75 years who had appropriate screening for colorectal cancer',
      numeratorCriteria: 'Colonoscopy in past 10 years, FIT in past year, or other appropriate screening',
      denominatorCriteria: 'Adults 50-75 years',
      exclusionCriteria: 'Colorectal cancer or total colectomy',
      targetRate: 65,
      reportingYear: 2024,
      evidenceSource: 'HEDIS 2024 Technical Specifications',
      steward: 'NCQA',
    });

    // MIPS Measures
    this.createQualityMeasure({
      measureId: 'MIPS001',
      name: 'Diabetes: Hemoglobin A1c (HbA1c) Poor Control (>9%)',
      type: 'MIPS',
      domain: 'effectiveness',
      description: 'Percentage of patients 18-75 years with diabetes who had HbA1c >9.0% during the measurement period',
      numeratorCriteria: 'Most recent HbA1c >9.0%',
      denominatorCriteria: 'Patients 18-75 years with diabetes',
      targetRate: 20, // Lower is better (inverse measure)
      reportingYear: 2024,
      evidenceSource: 'MIPS 2024 Quality Measures',
      steward: 'CMS',
    });

    this.createQualityMeasure({
      measureId: 'MIPS236',
      name: 'Controlling High Blood Pressure',
      type: 'MIPS',
      domain: 'effectiveness',
      description: 'Percentage of patients 18-85 years with hypertension whose BP was <140/90 mmHg',
      numeratorCriteria: 'Most recent BP <140/90 mmHg',
      denominatorCriteria: 'Patients 18-85 years with hypertension diagnosis',
      targetRate: 60,
      reportingYear: 2024,
      evidenceSource: 'MIPS 2024 Quality Measures',
      steward: 'CMS',
    });

    this.createQualityMeasure({
      measureId: 'MIPS130',
      name: 'Documentation of Current Medications',
      type: 'MIPS',
      domain: 'safety',
      description: 'Percentage of visits with documentation of current medications using all immediate resources',
      numeratorCriteria: 'Current medications documented',
      denominatorCriteria: 'All patient visits',
      targetRate: 90,
      reportingYear: 2024,
      evidenceSource: 'MIPS 2024 Quality Measures',
      steward: 'CMS',
    });

    // CQM Measures
    this.createQualityMeasure({
      measureId: 'CMS122',
      name: 'Diabetes: Hemoglobin A1c (HbA1c) Poor Control (>9%)',
      type: 'CQM',
      domain: 'effectiveness',
      description: 'Percentage of patients 18-75 years with diabetes who had HbA1c >9.0%',
      numeratorCriteria: 'Most recent HbA1c >9.0%',
      denominatorCriteria: 'Patients 18-75 years with diabetes',
      targetRate: 20, // Lower is better
      reportingYear: 2024,
      evidenceSource: 'eCQM 2024 Specifications',
      steward: 'CMS',
    });

    this.createQualityMeasure({
      measureId: 'CMS165',
      name: 'Controlling High Blood Pressure',
      type: 'CQM',
      domain: 'effectiveness',
      description: 'Percentage of patients 18-85 years with hypertension whose BP was <140/90 mmHg',
      numeratorCriteria: 'Most recent BP <140/90 mmHg during measurement period',
      denominatorCriteria: 'Patients 18-85 years with essential hypertension',
      targetRate: 60,
      reportingYear: 2024,
      evidenceSource: 'eCQM 2024 Specifications',
      steward: 'CMS',
    });

    logger.info('Default quality measures initialized');
  }

  // ============================================================================
  // Statistics and Reporting
  // ============================================================================

  static getStatistics(
    startDate?: Date,
    endDate?: Date,
    measureType?: MeasureType
  ): {
    totalMeasures: number;
    activeMeasures: number;
    byType: { type: MeasureType; count: number }[];
    byDomain: { domain: MeasureDomain; count: number }[];
    calculations: {
      total: number;
      meetingTarget: number;
      belowTarget: number;
      averageRate: number;
      averageGap: number;
    };
    gapAnalyses: {
      total: number;
      totalGaps: number;
      closableGaps: number;
      averagePotentialImprovement: number;
    };
    starRatings: {
      total: number;
      published: number;
      averageRating: number;
    };
  } {
    // Filter measures
    let measures = Array.from(this.qualityMeasures.values());
    if (measureType) {
      measures = measures.filter((m) => m.type === measureType);
    }

    // Group by type
    const byType = new Map<MeasureType, number>();
    for (const measure of measures) {
      const count = byType.get(measure.type) || 0;
      byType.set(measure.type, count + 1);
    }

    // Group by domain
    const byDomain = new Map<MeasureDomain, number>();
    for (const measure of measures) {
      const count = byDomain.get(measure.domain) || 0;
      byDomain.set(measure.domain, count + 1);
    }

    // Filter calculations
    let calculations = Array.from(this.measureCalculations.values());
    if (startDate) {
      calculations = calculations.filter((c) => c.calculationDate >= startDate);
    }
    if (endDate) {
      calculations = calculations.filter((c) => c.calculationDate <= endDate);
    }

    const meetingTarget = calculations.filter((c) => c.meetingTarget).length;
    const belowTarget = calculations.length - meetingTarget;
    const averageRate =
      calculations.length > 0
        ? calculations.reduce((sum, c) => sum + c.rate, 0) / calculations.length
        : 0;
    const averageGap =
      calculations.length > 0
        ? calculations.reduce((sum, c) => sum + Math.abs(c.performanceGap), 0) /
          calculations.length
        : 0;

    // Gap analyses
    const gapAnalyses = Array.from(this.gapAnalyses.values());
    const totalGaps = gapAnalyses.reduce((sum, a) => sum + a.totalGaps, 0);
    const closableGaps = gapAnalyses.reduce((sum, a) => sum + a.closableGaps, 0);
    const averagePotentialImprovement =
      gapAnalyses.length > 0
        ? gapAnalyses.reduce((sum, a) => sum + a.potentialRateImprovement, 0) /
          gapAnalyses.length
        : 0;

    // Star ratings
    const starRatings = Array.from(this.starRatings.values());
    const publishedRatings = starRatings.filter((r) => r.published).length;
    const averageRating =
      starRatings.length > 0
        ? starRatings.reduce((sum, r) => sum + r.overallRating, 0) / starRatings.length
        : 0;

    return {
      totalMeasures: measures.length,
      activeMeasures: measures.filter((m) => m.active).length,
      byType: Array.from(byType.entries()).map(([type, count]) => ({ type, count })),
      byDomain: Array.from(byDomain.entries()).map(([domain, count]) => ({ domain, count })),
      calculations: {
        total: calculations.length,
        meetingTarget,
        belowTarget,
        averageRate: Math.round(averageRate * 100) / 100,
        averageGap: Math.round(averageGap * 100) / 100,
      },
      gapAnalyses: {
        total: gapAnalyses.length,
        totalGaps,
        closableGaps,
        averagePotentialImprovement: Math.round(averagePotentialImprovement * 100) / 100,
      },
      starRatings: {
        total: starRatings.length,
        published: publishedRatings,
        averageRating: Math.round(averageRating * 10) / 10,
      },
    };
  }
}
