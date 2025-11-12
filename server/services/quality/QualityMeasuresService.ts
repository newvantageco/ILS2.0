/**
 * Quality Measures Service
 * ✅ PRODUCTION-READY - FULLY DATABASE-BACKED ✅
 * MIGRATED: November 12, 2025
 *
 * Manages quality measures including HEDIS, MIPS, CQM, and Star Ratings.
 * All data is persisted to PostgreSQL database with multi-tenant isolation.
 *
 * Database Tables:
 * - quality_measures: Measure definitions (HEDIS, MIPS, CQM, etc.)
 * - measure_calculations: Calculation results and patient lists
 * - star_ratings: Medicare Star Ratings tracking
 * - quality_gap_analyses: Gap analysis and improvement opportunities
 * - quality_dashboards: Dashboard configurations
 */

import { v4 as uuidv4 } from 'uuid';
import logger from '../../utils/logger';
import { storage, type IStorage } from '../../storage';
import type {
  QualityMeasure,
  InsertQualityMeasure,
  MeasureCalculation,
  InsertMeasureCalculation,
  StarRating,
  InsertStarRating,
  QualityGapAnalysis,
  InsertQualityGapAnalysis,
  QualityDashboard,
  InsertQualityDashboard,
} from '../../../shared/schema';

// ============================================================================
// Additional Types (not in schema)
// ============================================================================

export type MeasureType = 'HEDIS' | 'MIPS' | 'CQM' | 'Star_Rating' | 'Core_Measure' | 'Custom';
export type MeasureDomain = 'effectiveness' | 'access' | 'experience' | 'utilization' | 'safety' | 'care_coordination';

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

// ============================================================================
// Quality Measures Service
// ============================================================================

export class QualityMeasuresService {
  private static db: IStorage = storage;

  /**
   * Legacy in-memory storage - REMOVED (November 12, 2025)
   * @deprecated No longer used - service is 100% database-backed
   */
  // All Maps removed - service now fully database-backed

  // ============================================================================
  // Quality Measure Management
  // ============================================================================

  static async createQualityMeasure(
    companyId: string,
    data: {
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
    }
  ): Promise<QualityMeasure> {
    const measure = await this.db.createQualityMeasure({
      companyId,
      measureId: data.measureId,
      name: data.name,
      type: data.type as any,
      domain: data.domain as any,
      description: data.description,
      numeratorCriteria: data.numeratorCriteria,
      denominatorCriteria: data.denominatorCriteria,
      exclusionCriteria: data.exclusionCriteria || null,
      targetRate: data.targetRate.toString(),
      reportingYear: data.reportingYear,
      active: true,
      evidenceSource: data.evidenceSource,
      steward: data.steward,
    });

    logger.info(`Quality measure created: ${data.measureId} - ${data.name} (Company: ${companyId})`);
    return measure;
  }

  static async getQualityMeasureById(id: string, companyId: string): Promise<QualityMeasure | undefined> {
    return this.db.getQualityMeasure(id, companyId);
  }

  static async getQualityMeasureByMeasureId(
    measureId: string,
    companyId: string
  ): Promise<QualityMeasure | undefined> {
    const measures = await this.db.getQualityMeasures(companyId, {});
    return measures.find((m) => m.measureId === measureId);
  }

  static async getQualityMeasures(
    companyId: string,
    type?: MeasureType,
    activeOnly: boolean = true
  ): Promise<QualityMeasure[]> {
    const filters: { type?: string; active?: boolean } = {};

    if (type) {
      filters.type = type;
    }

    if (activeOnly) {
      filters.active = true;
    }

    return this.db.getQualityMeasures(companyId, filters);
  }

  static async updateQualityMeasure(
    id: string,
    companyId: string,
    updates: Partial<QualityMeasure>
  ): Promise<QualityMeasure | undefined> {
    const updated = await this.db.updateQualityMeasure(id, companyId, updates);

    if (updated) {
      logger.info(`Quality measure updated: ${id} (Company: ${companyId})`);
    }

    return updated;
  }

  // ============================================================================
  // Measure Calculation
  // ============================================================================

  static async calculateMeasure(
    companyId: string,
    data: {
      measureId: string;
      reportingPeriodStart: Date;
      reportingPeriodEnd: Date;
      patientList: MeasurePatient[];
      calculatedBy: string;
    }
  ): Promise<MeasureCalculation> {
    const measure = await this.getQualityMeasureByMeasureId(data.measureId, companyId);

    if (!measure) {
      throw new Error(`Quality measure not found: ${data.measureId}`);
    }

    // Calculate numerator, denominator, and exclusions
    const denominator = data.patientList.filter((p) => p.inDenominator && !p.excluded).length;
    const numerator = data.patientList.filter((p) => p.inNumerator && !p.excluded).length;
    const exclusions = data.patientList.filter((p) => p.excluded).length;

    // Calculate rate
    const rate = denominator > 0 ? (numerator / denominator) * 100 : 0;
    const targetRate = parseFloat(measure.targetRate);

    // Calculate performance gap
    const performanceGap = targetRate - rate;

    const calculation = await this.db.createMeasureCalculation({
      companyId,
      measureId: data.measureId,
      calculationDate: new Date(),
      reportingPeriodStart: data.reportingPeriodStart,
      reportingPeriodEnd: data.reportingPeriodEnd,
      numerator,
      denominator,
      exclusions,
      rate: (Math.round(rate * 100) / 100).toString(),
      targetRate: measure.targetRate,
      performanceGap: (Math.round(performanceGap * 100) / 100).toString(),
      meetingTarget: rate >= targetRate,
      patientList: data.patientList as any,
      calculatedBy: data.calculatedBy,
    });

    logger.info(
      `Measure calculated: ${data.measureId} - Rate: ${calculation.rate}% (Target: ${measure.targetRate}%) (Company: ${companyId})`
    );

    return calculation;
  }

  static async getMeasureCalculationById(
    id: string,
    companyId: string
  ): Promise<MeasureCalculation | undefined> {
    return this.db.getMeasureCalculation(id, companyId);
  }

  static async getMeasureCalculations(
    companyId: string,
    measureId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<MeasureCalculation[]> {
    const filters: { measureId?: string; startDate?: Date; endDate?: Date } = {};

    if (measureId) {
      filters.measureId = measureId;
    }
    if (startDate) {
      filters.startDate = startDate;
    }
    if (endDate) {
      filters.endDate = endDate;
    }

    return this.db.getMeasureCalculations(companyId, filters);
  }

  static async getLatestCalculation(
    measureId: string,
    companyId: string
  ): Promise<MeasureCalculation | undefined> {
    const calculations = await this.getMeasureCalculations(companyId, measureId);

    if (calculations.length === 0) {
      return undefined;
    }

    // Sort by calculation date descending and return first
    return calculations.sort(
      (a, b) => new Date(b.calculationDate).getTime() - new Date(a.calculationDate).getTime()
    )[0];
  }

  static async updateMeasureCalculation(
    id: string,
    companyId: string,
    updates: Partial<MeasureCalculation>
  ): Promise<MeasureCalculation | undefined> {
    return this.db.updateMeasureCalculation(id, companyId, updates);
  }

  // ============================================================================
  // Gap Analysis
  // ============================================================================

  static async performGapAnalysis(
    companyId: string,
    data: {
      measureId: string;
      calculationId?: string;
      createdBy: string;
    }
  ): Promise<QualityGapAnalysis> {
    // Get latest calculation if not provided
    let calculation: MeasureCalculation | undefined;
    if (data.calculationId) {
      calculation = await this.getMeasureCalculationById(data.calculationId, companyId);
    } else {
      calculation = await this.getLatestCalculation(data.measureId, companyId);
    }

    if (!calculation) {
      throw new Error(`No calculation found for measure: ${data.measureId}`);
    }

    const measure = await this.getQualityMeasureByMeasureId(data.measureId, companyId);
    if (!measure) {
      throw new Error(`Measure not found: ${data.measureId}`);
    }

    const patientList = calculation.patientList as unknown as MeasurePatient[];

    // Analyze gaps
    const gaps = patientList.filter(
      (p) => p.inDenominator && !p.inNumerator && !p.excluded
    );
    const totalGaps = gaps.length;

    // Identify closable gaps (those with identified closure opportunities)
    const closableGaps = gaps.filter((p) => p.gapClosure?.gapIdentified).length;

    // Calculate potential rate improvement if all closable gaps are closed
    const potentialNumerator = calculation.numerator + closableGaps;
    const potentialRate = (potentialNumerator / calculation.denominator) * 100;
    const currentRate = parseFloat(calculation.rate);
    const potentialImprovement = potentialRate - currentRate;

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

    const analysis = await this.db.createQualityGapAnalysis({
      companyId,
      measureId: data.measureId,
      analysisDate: new Date(),
      totalGaps,
      closableGaps,
      potentialRateImprovement: (Math.round(potentialImprovement * 100) / 100).toString(),
      gapsByReason: gapsByReason as any,
      recommendedActions: recommendedActions as any,
      projectedImpact: {
        currentRate: currentRate,
        projectedRate: Math.round(potentialRate * 100) / 100,
        rateImprovement: Math.round(potentialImprovement * 100) / 100,
      } as any,
      createdBy: data.createdBy,
    });

    logger.info(
      `Gap analysis completed for ${data.measureId}: ${totalGaps} total gaps, ${closableGaps} closable (Company: ${companyId})`
    );

    return analysis;
  }

  static async getGapAnalysisById(
    id: string,
    companyId: string
  ): Promise<QualityGapAnalysis | undefined> {
    return this.db.getQualityGapAnalysis(id, companyId);
  }

  static async getGapAnalysesByMeasure(
    measureId: string,
    companyId: string
  ): Promise<QualityGapAnalysis[]> {
    return this.db.getQualityGapAnalyses(companyId, { measureId });
  }

  static async updateGapAnalysis(
    id: string,
    companyId: string,
    updates: Partial<QualityGapAnalysis>
  ): Promise<QualityGapAnalysis | undefined> {
    return this.db.updateQualityGapAnalysis(id, companyId, updates);
  }

  private static generateRecommendedActions(
    measure: QualityMeasure,
    calculation: MeasureCalculation,
    gapsByReason: { reason: string; count: number; percentage: number }[]
  ): string[] {
    const actions: string[] = [];
    const performanceGap = parseFloat(calculation.performanceGap);
    const rate = parseFloat(calculation.rate);
    const targetRate = parseFloat(measure.targetRate);

    // Generic recommendations based on performance gap
    if (performanceGap > 20) {
      actions.push('Implement systematic outreach program for all patients in denominator');
      actions.push('Review and update clinical workflows to improve measure compliance');
    } else if (performanceGap > 10) {
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

    if (rate < targetRate * 0.8) {
      actions.push('Consider implementing quality improvement initiative for this measure');
    }

    return actions;
  }

  // ============================================================================
  // Star Ratings
  // ============================================================================

  static async calculateStarRating(
    companyId: string,
    data: {
      contractId: string;
      measurementYear: number;
      measures: StarRatingMeasure[];
    }
  ): Promise<StarRating> {
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

    const starRating = await this.db.createStarRating({
      companyId,
      contractId: data.contractId,
      measurementYear: data.measurementYear,
      partCRating: partCRating.toString(),
      partDRating: partDRating.toString(),
      overallRating: overallRating.toString(),
      measures: data.measures as any,
      calculatedDate: new Date(),
      published: false,
    });

    logger.info(
      `Star rating calculated for contract ${data.contractId}: ${overallRating} stars (Company: ${companyId})`
    );

    return starRating;
  }

  static async getStarRatingById(
    id: string,
    companyId: string
  ): Promise<StarRating | undefined> {
    return this.db.getStarRating(id, companyId);
  }

  static async getStarRatingsByContract(
    contractId: string,
    companyId: string
  ): Promise<StarRating[]> {
    return this.db.getStarRatings(companyId, { contractId });
  }

  static async publishStarRating(
    id: string,
    companyId: string
  ): Promise<StarRating> {
    const rating = await this.getStarRatingById(id, companyId);
    if (!rating) {
      throw new Error('Star rating not found');
    }

    const updated = await this.db.updateStarRating(id, companyId, {
      published: true,
    });

    if (!updated) {
      throw new Error('Failed to publish star rating');
    }

    logger.info(`Star rating published for contract ${rating.contractId} (Company: ${companyId})`);
    return updated;
  }

  static async updateStarRating(
    id: string,
    companyId: string,
    updates: Partial<StarRating>
  ): Promise<StarRating | undefined> {
    return this.db.updateStarRating(id, companyId, updates);
  }

  // ============================================================================
  // Quality Dashboards
  // ============================================================================

  static async createQualityDashboard(
    companyId: string,
    data: {
      name: string;
      description: string;
      measures: string[];
      filters?: any;
      createdBy: string;
    }
  ): Promise<QualityDashboard> {
    const dashboard = await this.db.createQualityDashboard({
      companyId,
      name: data.name,
      description: data.description,
      measures: data.measures as any,
      filters: data.filters || {},
      createdBy: data.createdBy,
    });

    logger.info(`Quality dashboard created: ${data.name} (Company: ${companyId})`);
    return dashboard;
  }

  static async getQualityDashboardById(
    id: string,
    companyId: string
  ): Promise<QualityDashboard | undefined> {
    return this.db.getQualityDashboard(id, companyId);
  }

  static async getQualityDashboards(companyId: string): Promise<QualityDashboard[]> {
    return this.db.getQualityDashboards(companyId);
  }

  static async updateQualityDashboard(
    id: string,
    companyId: string,
    updates: Partial<QualityDashboard>
  ): Promise<QualityDashboard> {
    const dashboard = await this.getQualityDashboardById(id, companyId);
    if (!dashboard) {
      throw new Error('Quality dashboard not found');
    }

    const updated = await this.db.updateQualityDashboard(id, companyId, updates);
    if (!updated) {
      throw new Error('Failed to update quality dashboard');
    }

    logger.info(`Quality dashboard updated: ${id} (Company: ${companyId})`);
    return updated;
  }

  // ============================================================================
  // Default Data Initialization
  // ============================================================================

  /**
   * Initialize default quality measures for a company.
   * This should be called explicitly when a new company is onboarded.
   *
   * @param companyId - The company ID to initialize measures for
   */
  static async initializeDefaultMeasures(companyId: string): Promise<void> {
    logger.info(`Initializing default quality measures for company: ${companyId}`);

    // Check if measures already exist
    const existing = await this.getQualityMeasures(companyId, undefined, false);
    if (existing.length > 0) {
      logger.info(`Company ${companyId} already has ${existing.length} measures, skipping initialization`);
      return;
    }

    // HEDIS Measures
    await this.createQualityMeasure(companyId, {
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

    await this.createQualityMeasure(companyId, {
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

    await this.createQualityMeasure(companyId, {
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

    await this.createQualityMeasure(companyId, {
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

    await this.createQualityMeasure(companyId, {
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

    await this.createQualityMeasure(companyId, {
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
    await this.createQualityMeasure(companyId, {
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

    await this.createQualityMeasure(companyId, {
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

    await this.createQualityMeasure(companyId, {
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
    await this.createQualityMeasure(companyId, {
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

    await this.createQualityMeasure(companyId, {
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

    logger.info(`Default quality measures initialized for company: ${companyId}`);
  }

  // ============================================================================
  // Statistics and Reporting
  // ============================================================================

  static async getStatistics(
    companyId: string,
    startDate?: Date,
    endDate?: Date,
    measureType?: MeasureType
  ): Promise<{
    totalMeasures: number;
    activeMeasures: number;
    byType: { type: string; count: number }[];
    byDomain: { domain: string; count: number }[];
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
  }> {
    // Get measures from database
    const filters: { type?: string; active?: boolean } = {};
    if (measureType) {
      filters.type = measureType;
    }
    const measures = await this.db.getQualityMeasures(companyId, filters);

    // Group by type
    const byType = new Map<string, number>();
    for (const measure of measures) {
      const count = byType.get(measure.type) || 0;
      byType.set(measure.type, count + 1);
    }

    // Group by domain
    const byDomain = new Map<string, number>();
    for (const measure of measures) {
      const count = byDomain.get(measure.domain) || 0;
      byDomain.set(measure.domain, count + 1);
    }

    // Get calculations from database
    const calculationFilters: { measureId?: string; startDate?: Date; endDate?: Date } = {};
    if (startDate) {
      calculationFilters.startDate = startDate;
    }
    if (endDate) {
      calculationFilters.endDate = endDate;
    }
    const calculations = await this.db.getMeasureCalculations(companyId, calculationFilters);

    const meetingTarget = calculations.filter((c) => c.meetingTarget).length;
    const belowTarget = calculations.length - meetingTarget;
    const averageRate =
      calculations.length > 0
        ? calculations.reduce((sum, c) => sum + parseFloat(c.rate), 0) / calculations.length
        : 0;
    const averageGap =
      calculations.length > 0
        ? calculations.reduce((sum, c) => sum + Math.abs(parseFloat(c.performanceGap)), 0) /
          calculations.length
        : 0;

    // Get gap analyses from database
    const gapAnalyses = await this.db.getQualityGapAnalyses(companyId, {});
    const totalGaps = gapAnalyses.reduce((sum, a) => sum + a.totalGaps, 0);
    const closableGaps = gapAnalyses.reduce((sum, a) => sum + a.closableGaps, 0);
    const averagePotentialImprovement =
      gapAnalyses.length > 0
        ? gapAnalyses.reduce((sum, a) => sum + parseFloat(a.potentialRateImprovement), 0) /
          gapAnalyses.length
        : 0;

    // Get star ratings from database
    const starRatings = await this.db.getStarRatings(companyId, {});
    const publishedRatings = starRatings.filter((r) => r.published).length;
    const averageRating =
      starRatings.length > 0
        ? starRatings.reduce((sum, r) => sum + parseFloat(r.overallRating), 0) / starRatings.length
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
