/**
 * Clinical Anomaly Detection Service
 * 
 * AI-powered service that analyzes eye examination data to detect
 * statistical anomalies and potential health risks.
 * 
 * Key Features:
 * - Nightly batch analysis of all examinations
 * - Statistical analysis (z-scores, percentiles)
 * - IOP (Intraocular Pressure) trend detection
 * - Visual acuity changes
 * - Refraction shift detection
 * - Automated alerts to optometrists
 * 
 * Runs as a scheduled cron job
 */

import { storage } from '../storage';
import { eventBus } from './EventBus';
import { createLogger, type Logger } from '../utils/logger';

interface AnomalyAlert {
  examinationId: string;
  patientId: string;
  patientName: string;
  metric: string;
  currentValue: number;
  expectedRange: { min: number; max: number };
  percentileRank: number; // 0-100
  zScore: number;
  severity: 'low' | 'medium' | 'high';
  anomalyType: 'statistical_outlier' | 'rapid_change' | 'threshold_exceeded';
  recommendation: string;
  confidence: number; // 0-1
}

interface MetricHistory {
  date: Date;
  value: number;
}

export class ClinicalAnomalyDetectionService {
  private logger: Logger;

  constructor() {
    this.logger = createLogger('ClinicalAnomalyDetection');
  }

  /**
   * Run nightly anomaly detection across all companies
   * Called by cron job
   */
  async runNightlyAnalysis(): Promise<void> {
    this.logger.info('Starting nightly clinical anomaly detection');

    try {
      // Get all companies
      const companies = await storage.getCompanies();
      let totalAnomalies = 0;

      for (const company of companies) {
        const anomalies = await this.analyzeCompanyExaminations(company.id);
        totalAnomalies += anomalies;
      }

      this.logger.info('Nightly anomaly detection completed', {
        companiesAnalyzed: companies.length,
        totalAnomalies,
      });
    } catch (error) {
      this.logger.error('Nightly anomaly detection failed', error as Error);
      throw error;
    }
  }

  /**
   * Analyze examinations for a specific company
   */
  private async analyzeCompanyExaminations(companyId: string): Promise<number> {
    try {
      // Get examinations from last 24 hours
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const allExaminations = await storage.getEyeExaminations(companyId);
      const recentExams = allExaminations.filter((exam: any) => 
        new Date(exam.createdAt) >= yesterday && exam.finalized
      );

      this.logger.info('Analyzing company examinations', {
        companyId,
        recentExamCount: recentExams.length,
      });

      let anomalyCount = 0;

      for (const exam of recentExams) {
        const anomalies = await this.detectAnomalies(exam);

        for (const anomaly of anomalies) {
          // Only alert on medium/high severity
          if (anomaly.severity === 'medium' || anomaly.severity === 'high') {
            await this.createAlert(exam, anomaly);
            anomalyCount++;
          }
        }
      }

      return anomalyCount;
    } catch (error) {
      this.logger.error('Failed to analyze company examinations', error as Error, {
        companyId,
      });
      return 0;
    }
  }

  /**
   * Detect anomalies in a single examination
   */
  private async detectAnomalies(exam: any): Promise<AnomalyAlert[]> {
    const anomalies: AnomalyAlert[] = [];

    try {
      const patient = await storage.getPatient(exam.patientId);

      // 1. Analyze IOP (Intraocular Pressure)
      const iopAnomalies = await this.analyzeIOP(exam, patient);
      anomalies.push(...iopAnomalies);

      // 2. Analyze Visual Acuity
      const vaAnomalies = await this.analyzeVisualAcuity(exam, patient);
      anomalies.push(...vaAnomalies);

      // 3. Analyze Refraction Changes
      const refractionAnomalies = await this.analyzeRefractionShift(exam, patient);
      anomalies.push(...refractionAnomalies);

    } catch (error) {
      this.logger.error('Failed to detect anomalies', error as Error, {
        examinationId: exam.id,
      });
    }

    return anomalies;
  }

  /**
   * Analyze Intraocular Pressure (IOP) for glaucoma risk
   */
  private async analyzeIOP(exam: any, patient: any): Promise<AnomalyAlert[]> {
    const anomalies: AnomalyAlert[] = [];

    const tonometry = (exam.tonometry as any) || {};
    const iopOD = this.parseFloat(tonometry.iop_od);
    const iopOS = this.parseFloat(tonometry.iop_os);

    if (!iopOD && !iopOS) return anomalies;

    // Get patient's IOP history
    const history = await this.getIOPHistory(exam.patientId, exam.companyId);

    // Analyze right eye (OD)
    if (iopOD) {
      const analysis = this.performStatisticalAnalysis(iopOD, history);

      // Check for abnormal IOP
      if (iopOD > 21 || analysis.zScore > 2) {
        anomalies.push({
          examinationId: exam.id,
          patientId: exam.patientId,
          patientName: patient?.name || 'Unknown',
          metric: 'IOP (Right Eye)',
          currentValue: iopOD,
          expectedRange: { min: 10, max: 21 },
          percentileRank: analysis.percentile,
          zScore: analysis.zScore,
          severity: this.calculateIOPSeverity(iopOD, analysis.zScore),
          anomalyType: analysis.zScore > 2 ? 'statistical_outlier' : 'threshold_exceeded',
          recommendation: this.getIOPRecommendation(iopOD, analysis.zScore, history),
          confidence: this.calculateConfidence(history.length, analysis.zScore),
        });
      }
    }

    // Analyze left eye (OS)
    if (iopOS) {
      const analysis = this.performStatisticalAnalysis(iopOS, history);

      if (iopOS > 21 || analysis.zScore > 2) {
        anomalies.push({
          examinationId: exam.id,
          patientId: exam.patientId,
          patientName: patient?.name || 'Unknown',
          metric: 'IOP (Left Eye)',
          currentValue: iopOS,
          expectedRange: { min: 10, max: 21 },
          percentileRank: analysis.percentile,
          zScore: analysis.zScore,
          severity: this.calculateIOPSeverity(iopOS, analysis.zScore),
          anomalyType: analysis.zScore > 2 ? 'statistical_outlier' : 'threshold_exceeded',
          recommendation: this.getIOPRecommendation(iopOS, analysis.zScore, history),
          confidence: this.calculateConfidence(history.length, analysis.zScore),
        });
      }
    }

    return anomalies;
  }

  /**
   * Analyze visual acuity changes
   */
  private async analyzeVisualAcuity(exam: any, patient: any): Promise<AnomalyAlert[]> {
    const anomalies: AnomalyAlert[] = [];

    const visualAcuity = (exam.visualAcuity as any) || {};
    const distanceVA_OD = visualAcuity.distance_va_od;
    const distanceVA_OS = visualAcuity.distance_va_os;

    // Get previous examination for comparison
    const allExams = await storage.getEyeExaminations(exam.companyId);
    const patientExams = allExams
      .filter((e: any) => e.patientId === exam.patientId && e.id !== exam.id)
      .sort((a: any, b: any) => 
        new Date(b.examinationDate).getTime() - new Date(a.examinationDate).getTime()
      );

    if (patientExams.length === 0) return anomalies; // No history to compare

    const previousExam = patientExams[0];
    const prevVA = (previousExam.visualAcuity as any) || {};

    // Check for significant VA drop (more than 2 lines on Snellen chart)
    if (distanceVA_OD && prevVA.distance_va_od) {
      const currentVA = this.snellenToDecimal(distanceVA_OD);
      const previousVA = this.snellenToDecimal(prevVA.distance_va_od);

      if (previousVA - currentVA > 0.2) { // Significant drop
        anomalies.push({
          examinationId: exam.id,
          patientId: exam.patientId,
          patientName: patient?.name || 'Unknown',
          metric: 'Visual Acuity (Right Eye)',
          currentValue: currentVA,
          expectedRange: { min: previousVA - 0.1, max: previousVA + 0.1 },
          percentileRank: 0,
          zScore: 0,
          severity: 'high',
          anomalyType: 'rapid_change',
          recommendation: 
            'Significant decrease in visual acuity detected. Recommend thorough retinal examination and consider referral if uncorrected.',
          confidence: 0.85,
        });
      }
    }

    return anomalies;
  }

  /**
   * Analyze refraction shift (prescription changes)
   */
  private async analyzeRefractionShift(exam: any, patient: any): Promise<AnomalyAlert[]> {
    const anomalies: AnomalyAlert[] = [];

    // Get current prescription
    const prescriptions = await storage.getPrescriptions(exam.ecpId, exam.companyId);
    const currentRx = prescriptions.find((p: any) => p.examinationId === exam.id);

    if (!currentRx) return anomalies;

    // Get previous prescription
    const previousRx = prescriptions
      .filter((p: any) => p.patientId === exam.patientId && p.id !== currentRx.id)
      .sort((a: any, b: any) => 
        new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()
      )[0];

    if (!previousRx) return anomalies;

    // Calculate sphere shift
    const currentSphereOD = this.parseFloat(currentRx.odSphere);
    const previousSphereOD = this.parseFloat(previousRx.odSphere);
    const sphereShift = Math.abs(currentSphereOD - previousSphereOD);

    // Rapid myopia progression (> 1.00D change)
    if (sphereShift > 1.0 && currentSphereOD < previousSphereOD) {
      anomalies.push({
        examinationId: exam.id,
        patientId: exam.patientId,
        patientName: patient?.name || 'Unknown',
        metric: 'Myopia Progression',
        currentValue: currentSphereOD,
        expectedRange: { min: previousSphereOD - 0.5, max: previousSphereOD + 0.5 },
        percentileRank: 95,
        zScore: 2.5,
        severity: 'medium',
        anomalyType: 'rapid_change',
        recommendation: 
          'Rapid myopia progression detected. Consider myopia control strategies (orthokeratology, atropine, multifocal lenses).',
        confidence: 0.8,
      });
    }

    return anomalies;
  }

  /**
   * Create alert and store in database
   */
  private async createAlert(exam: any, anomaly: AnomalyAlert): Promise<void> {
    try {
      // Store in clinical_anomalies table
      await storage.createClinicalAnomaly({
        examinationId: anomaly.examinationId,
        patientId: anomaly.patientId,
        companyId: exam.companyId,
        ecpId: exam.ecpId,
        metric: anomaly.metric,
        currentValue: anomaly.currentValue,
        expectedMin: anomaly.expectedRange.min,
        expectedMax: anomaly.expectedRange.max,
        percentileRank: anomaly.percentileRank,
        zScore: anomaly.zScore,
        severity: anomaly.severity,
        anomalyType: anomaly.anomalyType,
        confidence: anomaly.confidence,
        recommendation: anomaly.recommendation,
        followUpRequired: anomaly.severity === 'high',
        status: 'pending',
      });

      // Create notification for optometrist
      await storage.createNotification({
        userId: exam.ecpId,
        companyId: exam.companyId,
        type: 'clinical_anomaly',
        severity: anomaly.severity,
        title: `Clinical Alert: ${anomaly.metric}`,
        message: `
Patient: ${anomaly.patientName}
Metric: ${anomaly.metric} = ${anomaly.currentValue}
Expected Range: ${anomaly.expectedRange.min} - ${anomaly.expectedRange.max}
Z-Score: ${anomaly.zScore.toFixed(2)}

${anomaly.recommendation}
        `.trim(),
        actionUrl: `/patients/${anomaly.patientId}/examinations/${anomaly.examinationId}`,
      });

      // Emit event
      eventBus.publish('clinical.anomaly_detected', {
        anomalyId: crypto.randomUUID(),
        examinationId: anomaly.examinationId,
        patientId: anomaly.patientId,
        companyId: exam.companyId,
        ecpId: exam.ecpId,
        metric: anomaly.metric,
        currentValue: anomaly.currentValue,
        expectedRange: anomaly.expectedRange,
        severity: anomaly.severity,
        recommendation: anomaly.recommendation,
      });

      this.logger.info('Clinical anomaly alert created', {
        examinationId: anomaly.examinationId,
        metric: anomaly.metric,
        severity: anomaly.severity,
      });
    } catch (error) {
      this.logger.error('Failed to create anomaly alert', error as Error);
    }
  }

  /**
   * Get IOP history for a patient
   */
  private async getIOPHistory(
    patientId: string,
    companyId: string
  ): Promise<MetricHistory[]> {
    const allExams = await storage.getEyeExaminations(companyId);
    const patientExams = allExams.filter((e: any) => e.patientId === patientId);

    const history: MetricHistory[] = [];

    for (const exam of patientExams) {
      const tonometry = (exam.tonometry as any) || {};
      const iopOD = this.parseFloat(tonometry.iop_od);
      const iopOS = this.parseFloat(tonometry.iop_os);

      if (iopOD) {
        history.push({
          date: new Date(exam.examinationDate),
          value: iopOD,
        });
      }
      if (iopOS) {
        history.push({
          date: new Date(exam.examinationDate),
          value: iopOS,
        });
      }
    }

    return history.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Perform statistical analysis on a metric
   */
  private performStatisticalAnalysis(
    currentValue: number,
    history: MetricHistory[]
  ): { zScore: number; percentile: number } {
    if (history.length === 0) {
      return { zScore: 0, percentile: 50 };
    }

    const values = history.map((h) => h.value);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance =
      values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance) || 3; // Default stdDev if 0

    const zScore = (currentValue - mean) / stdDev;

    // Calculate percentile
    const sortedValues = [...values].sort((a, b) => a - b);
    const below = sortedValues.filter((v) => v < currentValue).length;
    const percentile = (below / sortedValues.length) * 100;

    return { zScore, percentile };
  }

  /**
   * Calculate IOP severity based on value and z-score
   */
  private calculateIOPSeverity(
    iop: number,
    zScore: number
  ): 'low' | 'medium' | 'high' {
    if (iop > 30 || zScore > 3) return 'high';
    if (iop > 24 || zScore > 2.5) return 'medium';
    return 'low';
  }

  /**
   * Generate IOP recommendation
   */
  private getIOPRecommendation(
    iop: number,
    zScore: number,
    history: MetricHistory[]
  ): string {
    if (iop > 30) {
      return 'URGENT: Severely elevated IOP. Immediate referral to ophthalmologist for glaucoma assessment.';
    }

    if (iop > 24) {
      return 'Elevated IOP detected. Recommend visual field test, OCT scan, and close monitoring.';
    }

    if (zScore > 2.5 && history.length > 2) {
      const trend = this.calculateTrend(history);
      if (trend === 'increasing') {
        return 'IOP showing increasing trend. Recommend baseline visual field and OCT, follow up in 3 months.';
      }
    }

    return 'IOP slightly elevated. Monitor at next routine examination.';
  }

  /**
   * Calculate trend from history
   */
  private calculateTrend(history: MetricHistory[]): 'increasing' | 'decreasing' | 'stable' {
    if (history.length < 3) return 'stable';

    const recent = history.slice(-3);
    const diffs = [];
    for (let i = 1; i < recent.length; i++) {
      diffs.push(recent[i].value - recent[i - 1].value);
    }

    const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;

    if (avgDiff > 1) return 'increasing';
    if (avgDiff < -1) return 'decreasing';
    return 'stable';
  }

  /**
   * Calculate confidence based on data availability
   */
  private calculateConfidence(historyLength: number, zScore: number): number {
    let confidence = 0.5;

    // More history = more confidence
    if (historyLength >= 5) confidence += 0.2;
    else if (historyLength >= 3) confidence += 0.1;

    // Higher z-score = more confidence
    if (Math.abs(zScore) > 3) confidence += 0.2;
    else if (Math.abs(zScore) > 2) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  /**
   * Convert Snellen notation to decimal
   */
  private snellenToDecimal(snellen: string): number {
    // Parse formats like "6/6", "6/9", "20/20", etc.
    const match = snellen.match(/(\d+)\/(\d+)/);
    if (!match) return 1.0;

    const numerator = parseInt(match[1]);
    const denominator = parseInt(match[2]);

    return numerator / denominator;
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
export const clinicalAnomalyService = new ClinicalAnomalyDetectionService();
