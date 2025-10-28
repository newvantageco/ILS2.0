import { db } from '../db';
import { and, desc, eq, gte, lte, sql, isNull } from 'drizzle-orm';
import {
  prescriptionAlerts,
  rxFrameLensAnalytics,
  orders,
  users,
  nonAdapts,
  analyticsEvents,
} from '../../shared/schema';
import { createLogger, type Logger } from '../utils/logger';

interface RxProfile {
  odSphere: number;
  odCylinder: number;
  odAxis: number;
  odAdd: number;
  osSphere: number;
  osCylinder: number;
  osAxis: number;
  osAdd: number;
  pd: number;
}

interface OrderAnalysisContext {
  orderId: string;
  ecpId: string;
  lensType: string;
  lensMaterial: string;
  frameType?: string;
  coating: string;
  rxProfile: RxProfile;
}

interface AlertAnalysis {
  severity: 'info' | 'warning' | 'critical';
  alertType: string;
  riskScore: number; // 0-1
  historicalNonAdaptRate?: number;
  recommendation?: {
    lensType?: string;
    material?: string;
    coating?: string;
    explanation: string;
  };
}

export class PredictiveNonAdaptService {
  private static instance: PredictiveNonAdaptService;
  private logger: Logger;
  private readonly HIGH_WRAP_THRESHOLD = 0.3; // Frame wrap threshold in degrees
  private readonly HIGH_ADD_THRESHOLD = 2.5; // Add power threshold
  private readonly HIGH_POWER_THRESHOLD = 6.0; // Sphere/Cylinder power threshold
  private readonly CRITICAL_RISK_THRESHOLD = 0.45;
  private readonly HIGH_RISK_THRESHOLD = 0.30;

  private constructor() {
    this.logger = createLogger('PredictiveNonAdaptService');
  }

  public static getInstance(): PredictiveNonAdaptService {
    if (!PredictiveNonAdaptService.instance) {
      PredictiveNonAdaptService.instance = new PredictiveNonAdaptService();
    }
    return PredictiveNonAdaptService.instance;
  }

  /**
   * Analyzes an order prescription for non-adapt risk factors
   * Returns a detailed alert with risk assessment and recommendations
   */
  async analyzeOrderForRisk(context: OrderAnalysisContext): Promise<AlertAnalysis | null> {
    try {
      this.logger.info('Analyzing order for non-adapt risk', {
        orderId: context.orderId,
        lensType: context.lensType,
      });

      // Calculate risk factors
      const riskFactors = this.calculateRiskFactors(context.rxProfile, context.frameType);

      if (!riskFactors || riskFactors.totalRiskScore === 0) {
        return null;
      }

      // Get historical data for this combination
      const historicalData = await this.getHistoricalNonAdaptRate(
        context.lensType,
        context.lensMaterial,
        context.frameType || 'standard'
      );

      // Determine severity and generate recommendation
      const severity = this.determineSeverity(riskFactors.totalRiskScore);
      const recommendation = this.generateRecommendation(riskFactors, historicalData);

      const analysis: AlertAnalysis = {
        severity,
        alertType: riskFactors.primaryRiskType,
        riskScore: riskFactors.totalRiskScore,
        historicalNonAdaptRate: historicalData?.nonAdaptRate,
        recommendation,
      };

      this.logger.debug('Risk analysis complete', {
        orderId: context.orderId,
        analysis,
      });

      return analysis;
    } catch (error) {
      this.logger.error('Error analyzing order for risk', error as Error, {
        orderId: context.orderId,
      });
      return null;
    }
  }

  /**
   * Creates and stores a prescription alert in the database
   */
  async createAlert(
    context: OrderAnalysisContext,
    analysis: AlertAnalysis
  ): Promise<any> {
    try {
      const alert = await db.insert(prescriptionAlerts).values({
        orderId: context.orderId,
        ecpId: context.ecpId,
        severity: analysis.severity,
        alertType: analysis.alertType,
        riskScore: analysis.riskScore.toString(),
        historicalNonAdaptRate: analysis.historicalNonAdaptRate?.toString(),
        recommendedLensType: analysis.recommendation?.lensType,
        recommendedMaterial: analysis.recommendation?.material,
        recommendedCoating: analysis.recommendation?.coating,
        explanation: analysis.recommendation?.explanation || this.generateExplanation(analysis),
        metadata: {
          analyzedAt: new Date().toISOString(),
          rxProfile: context.rxProfile,
          frameType: context.frameType,
        },
      }).returning();

      // Create analytics event
      await db.insert(analyticsEvents).values({
        eventType: 'order_created',
        sourceId: context.orderId,
        sourceType: 'order',
        data: {
          alertId: alert[0]?.id,
          severity: analysis.severity,
          riskScore: analysis.riskScore,
        },
        organizationId: (await db.query.users.findFirst({
          where: eq(users.id, context.ecpId),
          columns: { organizationId: true }
        }))?.organizationId || ''
      });

      this.logger.info('Prescription alert created', {
        orderId: context.orderId,
        alertId: alert[0]?.id,
        severity: analysis.severity,
      });

      return alert[0];
    } catch (error) {
      this.logger.error('Error creating alert', error as Error, {
        orderId: context.orderId,
      });
      throw error;
    }
  }

  /**
   * Retrieves active alerts for an ECP
   */
  async getActiveAlerts(ecpId: string, limit: number = 50): Promise<any[]> {
    try {
      return await db
        .select()
        .from(prescriptionAlerts)
        .where(
          and(
            eq(prescriptionAlerts.ecpId, ecpId),
            isNull(prescriptionAlerts.dismissedAt)
          )
        )
        .orderBy(desc(prescriptionAlerts.severity))
        .limit(limit);
    } catch (error) {
      this.logger.error('Error fetching active alerts', error as Error, {
        ecpId,
      });
      throw error;
    }
  }

  /**
   * Dismisses an alert
   */
  async dismissAlert(
    alertId: string,
    userId: string,
    actionTaken?: string
  ): Promise<void> {
    try {
      await db
        .update(prescriptionAlerts)
        .set({
          dismissedAt: new Date(),
          dismissedBy: userId,
          actionTaken: actionTaken,
          actionTakenAt: actionTaken ? new Date() : undefined,
        })
        .where(eq(prescriptionAlerts.id, alertId));

      this.logger.info('Alert dismissed', { alertId, userId });
    } catch (error) {
      this.logger.error('Error dismissing alert', error as Error, { alertId });
      throw error;
    }
  }

  /**
   * Updates historical non-adapt analytics when a non-adapt is reported
   */
  async updateAnalyticsOnNonAdapt(orderId: string): Promise<void> {
    try {
      const order = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
      });

      if (!order) {
        this.logger.warn('Order not found for non-adapt update', { orderId });
        return;
      }

      const frameType = order.frameType || 'standard';
      const key = `${order.lensType}|${order.lensMaterial}|${frameType}`;

      // Update or create analytics record
      const existing = await db.query.rxFrameLensAnalytics.findFirst({
        where: and(
          eq(rxFrameLensAnalytics.lensType, order.lensType),
          eq(rxFrameLensAnalytics.lensMaterial, order.lensMaterial),
          eq(rxFrameLensAnalytics.frameType, frameType)
        ),
      });

      if (existing) {
        const newNonAdaptCount = existing.nonAdaptCount + 1;
        const newNonAdaptRate = newNonAdaptCount / existing.totalOrders;

        await db
          .update(rxFrameLensAnalytics)
          .set({
            nonAdaptCount: newNonAdaptCount,
            nonAdaptRate: newNonAdaptRate.toString(),
            lastUpdated: new Date(),
            historicalDataPoints: sql`jsonb_set(${rxFrameLensAnalytics.historicalDataPoints}, '{last_update}', '"' || now()::text || '"')`,
          })
          .where(eq(rxFrameLensAnalytics.id, existing.id));
      } else {
        // Create new analytics record
        await db.insert(rxFrameLensAnalytics).values({
          lensType: order.lensType,
          lensMaterial: order.lensMaterial,
          frameType: frameType,
          totalOrders: 1,
          nonAdaptCount: 1,
          nonAdaptRate: '1',
          metadata: {
            createdFromNonAdapt: true,
            orderId,
          },
        });
      }

      this.logger.info('Analytics updated for non-adapt', {
        orderId,
        key,
      });
    } catch (error) {
      this.logger.error('Error updating analytics', error as Error, {
        orderId,
      });
    }
  }

  /**
   * Calculate risk factors from prescription profile
   */
  private calculateRiskFactors(
    rxProfile: RxProfile,
    frameType?: string
  ): { totalRiskScore: number; primaryRiskType: string } | null {
    let riskScore = 0;
    let primaryRiskType = 'general';

    // Check for high add power (progressive lens complexity)
    if (rxProfile.odAdd && rxProfile.odAdd > this.HIGH_ADD_THRESHOLD) {
      riskScore += 0.25;
      primaryRiskType = 'high_add_progressive';
    }

    // Check for high sphere/cylinder power
    const maxPowerOD = Math.abs(parseFloat(rxProfile.odSphere.toString())) +
      Math.abs(parseFloat(rxProfile.odCylinder.toString()));
    const maxPowerOS = Math.abs(parseFloat(rxProfile.osSphere.toString())) +
      Math.abs(parseFloat(rxProfile.osCylinder.toString()));

    if (maxPowerOD > this.HIGH_POWER_THRESHOLD || maxPowerOS > this.HIGH_POWER_THRESHOLD) {
      riskScore += 0.20;
      if (primaryRiskType === 'general') primaryRiskType = 'high_power';
    }

    // Check for high wrap frame
    if (frameType && (frameType.toLowerCase().includes('wrap') || frameType.toLowerCase().includes('sport'))) {
      riskScore += 0.15;
      if (primaryRiskType === 'general') primaryRiskType = 'high_wrap_frame';
    }

    // Check for astigmatism complexity
    if (Math.abs(parseFloat(rxProfile.odCylinder.toString())) > 2.0 ||
      Math.abs(parseFloat(rxProfile.osCylinder.toString())) > 2.0) {
      riskScore += 0.15;
      if (primaryRiskType === 'general') primaryRiskType = 'high_astigmatism';
    }

    // Check for high PD variation (binocular issues)
    if (rxProfile.pd && (parseFloat(rxProfile.pd.toString()) < 58 || parseFloat(rxProfile.pd.toString()) > 74)) {
      riskScore += 0.10;
    }

    return riskScore > 0 ? { totalRiskScore: Math.min(riskScore, 1), primaryRiskType } : null;
  }

  /**
   * Determine severity based on risk score and historical data
   */
  private determineSeverity(riskScore: number): 'info' | 'warning' | 'critical' {
    if (riskScore >= this.CRITICAL_RISK_THRESHOLD) {
      return 'critical';
    } else if (riskScore >= this.HIGH_RISK_THRESHOLD) {
      return 'warning';
    }
    return 'info';
  }

  /**
   * Generate a specific recommendation based on the risk factors
   */
  private generateRecommendation(
    riskFactors: any,
    historicalData: any
  ): { lensType?: string; material?: string; coating?: string; explanation: string } {
    const recommendation: any = {};

    if (riskFactors.primaryRiskType === 'high_add_progressive') {
      recommendation.lensType = 'Progressive';
      recommendation.material = '1.67';
      recommendation.coating = 'anti-reflective';
    } else if (riskFactors.primaryRiskType === 'high_wrap_frame') {
      recommendation.material = 'Polycarbonate';
      recommendation.coating = 'hard-coat';
    } else if (riskFactors.primaryRiskType === 'high_astigmatism') {
      recommendation.material = '1.74';
      recommendation.lensType = 'Aspheric';
    }

    recommendation.explanation = this.generateExplanation({ alertType: riskFactors.primaryRiskType, riskScore: riskFactors.totalRiskScore });

    return recommendation;
  }

  /**
   * Generate human-readable explanation for the alert
   */
  private generateExplanation(analysis: any): string {
    const typeDescriptions: Record<string, string> = {
      high_add_progressive: 'High add power in progressive lens may cause adaptation issues',
      high_power: 'High sphere/cylinder power increases complexity',
      high_wrap_frame: 'High-wrap frame combined with this prescription has elevated risk',
      high_astigmatism: 'High astigmatism requires careful lens selection',
      general: 'Complex prescription parameters detected',
    };

    const baseExplanation = typeDescriptions[analysis.alertType] || 'Complex prescription parameters detected';
    const riskPercentage = Math.round(analysis.riskScore * 100);

    return `${baseExplanation}. Estimated risk score: ${riskPercentage}%. Our Principal Engineer recommends reviewing lens options to minimize adaptation time.`;
  }

  /**
   * Get historical non-adapt rate for a lens/material/frame combination
   */
  private async getHistoricalNonAdaptRate(
    lensType: string,
    material: string,
    frameType: string
  ): Promise<any> {
    try {
      const analytics = await db.query.rxFrameLensAnalytics.findFirst({
        where: and(
          eq(rxFrameLensAnalytics.lensType, lensType),
          eq(rxFrameLensAnalytics.lensMaterial, material),
          eq(rxFrameLensAnalytics.frameType, frameType)
        ),
      });

      return analytics || null;
    } catch (error) {
      this.logger.warn('Error fetching historical data', error as Error);
      return null;
    }
  }
}
