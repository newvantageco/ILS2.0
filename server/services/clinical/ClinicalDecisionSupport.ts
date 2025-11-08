/**
 * Clinical Decision Support Engine
 *
 * Rules-based clinical decision support system for generating
 * recommendations, alerts, and clinical guidance
 */

import { loggers } from '../../utils/logger.js';
import { db } from '../../db.js';
import { patients, orders } from '@shared/schema';
import { eq } from 'drizzle-orm';

const logger = loggers.api;

/**
 * Clinical Rule Definition
 */
export interface ClinicalRule {
  id: string;
  name: string;
  description: string;
  category: 'screening' | 'prevention' | 'treatment' | 'follow-up' | 'quality' | 'safety';
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  active: boolean;

  // Condition to evaluate
  condition: {
    type: 'age' | 'diagnosis' | 'medication' | 'test_result' | 'time_since' | 'custom';
    operator: '>' | '<' | '>=' | '<=' | '==' | '!=' | 'contains' | 'between';
    value: any;
    field?: string;
  };

  // Recommendation to generate if condition is met
  recommendation: {
    title: string;
    message: string;
    actionRequired: boolean;
    suggestedActions?: string[];
    references?: string[];
  };

  // Metadata
  evidenceLevel?: 'A' | 'B' | 'C' | 'D'; // Clinical evidence strength
  lastReviewed?: Date;
  createdBy?: string;
  createdAt: Date;
}

/**
 * Clinical Alert/Recommendation
 */
export interface ClinicalAlert {
  id: string;
  ruleId: string;
  ruleName: string;
  patientId: string;
  category: ClinicalRule['category'];
  severity: ClinicalRule['severity'];
  title: string;
  message: string;
  actionRequired: boolean;
  suggestedActions?: string[];
  references?: string[];

  // Status tracking
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedBy?: string;
  resolvedAt?: Date;
  dismissReason?: string;

  // Timestamps
  triggeredAt: Date;
  expiresAt?: Date;
}

/**
 * Patient Clinical Context
 */
export interface PatientContext {
  patientId: string;
  age: number;
  dateOfBirth: string;
  lastExamDate?: Date;
  diagnoses?: string[];
  medications?: string[];
  allergies?: string[];
  recentOrders?: any[];
  vitalSigns?: {
    bloodPressure?: string;
    pulse?: number;
    temperature?: number;
  };
}

/**
 * Clinical Decision Support Engine
 */
export class ClinicalDecisionSupport {
  /**
   * In-memory rule store (use database in production)
   */
  private static rules: Map<string, ClinicalRule> = new Map();

  /**
   * In-memory alert store (use database in production)
   */
  private static alerts: Map<string, ClinicalAlert> = new Map();

  /**
   * Initialize default clinical rules
   */
  static initializeDefaultRules(): void {
    const defaultRules: ClinicalRule[] = [
      // Age-based screening rules
      {
        id: 'rule_annual_exam_40plus',
        name: 'Annual Eye Exam for 40+',
        description: 'Patients 40 and older should have annual comprehensive eye exams',
        category: 'screening',
        severity: 'medium',
        active: true,
        condition: {
          type: 'age',
          operator: '>=',
          value: 40,
        },
        recommendation: {
          title: 'Annual Eye Exam Recommended',
          message: 'Patient is 40 or older and should have an annual comprehensive eye examination to detect early signs of eye disease.',
          actionRequired: true,
          suggestedActions: [
            'Schedule comprehensive eye exam',
            'Check for glaucoma screening',
            'Assess for age-related macular degeneration',
          ],
          references: ['American Optometric Association Guidelines'],
        },
        evidenceLevel: 'A',
        createdAt: new Date(),
      },

      {
        id: 'rule_pediatric_exam',
        name: 'Pediatric Eye Exam Schedule',
        description: 'Children should have eye exams at specific developmental milestones',
        category: 'screening',
        severity: 'medium',
        active: true,
        condition: {
          type: 'age',
          operator: '<',
          value: 18,
        },
        recommendation: {
          title: 'Pediatric Eye Exam Recommended',
          message: 'Child should have age-appropriate eye examination per pediatric guidelines.',
          actionRequired: true,
          suggestedActions: [
            'Schedule pediatric eye exam',
            'Check visual acuity',
            'Assess binocular vision',
            'Screen for amblyopia',
          ],
          references: ['AAP Vision Screening Guidelines'],
        },
        evidenceLevel: 'A',
        createdAt: new Date(),
      },

      {
        id: 'rule_diabetic_annual_exam',
        name: 'Diabetic Annual Eye Exam',
        description: 'Diabetic patients require annual dilated eye exams',
        category: 'prevention',
        severity: 'high',
        active: true,
        condition: {
          type: 'diagnosis',
          operator: 'contains',
          value: 'diabetes',
        },
        recommendation: {
          title: 'Diabetic Eye Exam Required',
          message: 'Diabetic patients require annual dilated comprehensive eye examinations to screen for diabetic retinopathy.',
          actionRequired: true,
          suggestedActions: [
            'Schedule dilated eye exam',
            'Perform retinal imaging',
            'Check for diabetic retinopathy',
            'Assess for macular edema',
          ],
          references: ['ADA Standards of Medical Care'],
        },
        evidenceLevel: 'A',
        createdAt: new Date(),
      },

      // Follow-up rules
      {
        id: 'rule_follow_up_overdue',
        name: 'Overdue Follow-up Appointment',
        description: 'Patient has not had follow-up within recommended timeframe',
        category: 'follow-up',
        severity: 'medium',
        active: true,
        condition: {
          type: 'time_since',
          operator: '>',
          value: 365, // days
          field: 'lastExamDate',
        },
        recommendation: {
          title: 'Follow-up Appointment Overdue',
          message: 'Patient has not had an examination in over 12 months. Schedule follow-up appointment.',
          actionRequired: true,
          suggestedActions: [
            'Contact patient to schedule appointment',
            'Send appointment reminder',
            'Update contact information if needed',
          ],
        },
        evidenceLevel: 'B',
        createdAt: new Date(),
      },

      // Quality and safety rules
      {
        id: 'rule_high_prescription',
        name: 'High Prescription Alert',
        description: 'Alert for unusually high prescription values',
        category: 'safety',
        severity: 'high',
        active: true,
        condition: {
          type: 'custom',
          operator: '>',
          value: 10.0, // Diopters
          field: 'prescription_sphere',
        },
        recommendation: {
          title: 'High Prescription Value Detected',
          message: 'Prescription sphere value exceeds 10.0D. Please verify accuracy and consider additional testing.',
          actionRequired: true,
          suggestedActions: [
            'Verify prescription measurement',
            'Repeat refraction if needed',
            'Consider specialized lens options',
            'Document clinical rationale',
          ],
        },
        evidenceLevel: 'C',
        createdAt: new Date(),
      },
    ];

    // Load default rules
    defaultRules.forEach(rule => {
      this.rules.set(rule.id, rule);
    });

    logger.info({ count: defaultRules.length }, 'Default clinical rules initialized');
  }

  /**
   * Add or update a clinical rule
   */
  static async addRule(rule: ClinicalRule): Promise<ClinicalRule> {
    this.rules.set(rule.id, rule);

    logger.info({ ruleId: rule.id, name: rule.name }, 'Clinical rule added');

    return rule;
  }

  /**
   * Get all active rules
   */
  static async getActiveRules(category?: ClinicalRule['category']): Promise<ClinicalRule[]> {
    const allRules = Array.from(this.rules.values()).filter(rule => rule.active);

    if (category) {
      return allRules.filter(rule => rule.category === category);
    }

    return allRules;
  }

  /**
   * Evaluate rules for a patient
   */
  static async evaluatePatient(patientId: string): Promise<ClinicalAlert[]> {
    // Get patient context
    const context = await this.getPatientContext(patientId);

    if (!context) {
      logger.warn({ patientId }, 'Patient not found for clinical evaluation');
      return [];
    }

    // Get active rules
    const rules = await this.getActiveRules();

    // Evaluate each rule
    const alerts: ClinicalAlert[] = [];

    for (const rule of rules) {
      const triggered = await this.evaluateRule(rule, context);

      if (triggered) {
        const alert = this.createAlert(rule, patientId);
        alerts.push(alert);

        // Store alert
        this.alerts.set(alert.id, alert);
      }
    }

    logger.info(
      { patientId, alertCount: alerts.length },
      'Clinical evaluation completed'
    );

    return alerts;
  }

  /**
   * Evaluate a single rule against patient context
   */
  private static async evaluateRule(
    rule: ClinicalRule,
    context: PatientContext
  ): Promise<boolean> {
    const { condition } = rule;

    switch (condition.type) {
      case 'age': {
        return this.compareValues(context.age, condition.operator, condition.value);
      }

      case 'diagnosis': {
        if (!context.diagnoses) return false;

        if (condition.operator === 'contains') {
          return context.diagnoses.some(d =>
            d.toLowerCase().includes(condition.value.toLowerCase())
          );
        }

        return false;
      }

      case 'medication': {
        if (!context.medications) return false;

        if (condition.operator === 'contains') {
          return context.medications.some(m =>
            m.toLowerCase().includes(condition.value.toLowerCase())
          );
        }

        return false;
      }

      case 'time_since': {
        if (!condition.field) return false;

        const lastDate = (context as any)[condition.field];
        if (!lastDate) return false;

        const daysSince = Math.floor(
          (Date.now() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24)
        );

        return this.compareValues(daysSince, condition.operator, condition.value);
      }

      case 'test_result':
      case 'custom': {
        // For custom rules, would need additional implementation
        return false;
      }

      default:
        return false;
    }
  }

  /**
   * Compare values using operator
   */
  private static compareValues(a: any, operator: string, b: any): boolean {
    switch (operator) {
      case '>': return a > b;
      case '<': return a < b;
      case '>=': return a >= b;
      case '<=': return a <= b;
      case '==': return a == b;
      case '!=': return a != b;
      case 'between': {
        if (Array.isArray(b) && b.length === 2) {
          return a >= b[0] && a <= b[1];
        }
        return false;
      }
      default: return false;
    }
  }

  /**
   * Create alert from rule
   */
  private static createAlert(rule: ClinicalRule, patientId: string): ClinicalAlert {
    return {
      id: `alert_${crypto.randomUUID()}`,
      ruleId: rule.id,
      ruleName: rule.name,
      patientId,
      category: rule.category,
      severity: rule.severity,
      title: rule.recommendation.title,
      message: rule.recommendation.message,
      actionRequired: rule.recommendation.actionRequired,
      suggestedActions: rule.recommendation.suggestedActions,
      references: rule.recommendation.references,
      status: 'active',
      triggeredAt: new Date(),
    };
  }

  /**
   * Get patient context for evaluation
   */
  private static async getPatientContext(patientId: string): Promise<PatientContext | null> {
    try {
      // Get patient data
      const [patient] = await db
        .select()
        .from(patients)
        .where(eq(patients.id, patientId))
        .limit(1);

      if (!patient) return null;

      // Calculate age
      const birthDate = new Date(patient.dateOfBirth || '1900-01-01');
      const age = Math.floor(
        (Date.now() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
      );

      // Get recent orders
      const recentOrders = await db
        .select()
        .from(orders)
        .where(eq(orders.patientId, patientId))
        .limit(10);

      // Extract last exam date
      const lastExamDate = patient.lastExaminationDate || undefined;

      return {
        patientId,
        age,
        dateOfBirth: patient.dateOfBirth || '',
        lastExamDate,
        recentOrders,
        // Additional fields would come from patient record
        diagnoses: [], // Would parse from medical history
        medications: [], // Would parse from current medications
        allergies: [], // Would parse from patient record
      };
    } catch (error) {
      logger.error({ patientId, error }, 'Failed to get patient context');
      return null;
    }
  }

  /**
   * Get alerts for a patient
   */
  static async getPatientAlerts(
    patientId: string,
    status?: ClinicalAlert['status']
  ): Promise<ClinicalAlert[]> {
    let alerts = Array.from(this.alerts.values()).filter(
      alert => alert.patientId === patientId
    );

    if (status) {
      alerts = alerts.filter(alert => alert.status === status);
    }

    // Sort by severity and date
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

    return alerts.sort((a, b) => {
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      return b.triggeredAt.getTime() - a.triggeredAt.getTime();
    });
  }

  /**
   * Acknowledge an alert
   */
  static async acknowledgeAlert(
    alertId: string,
    acknowledgedBy: string
  ): Promise<ClinicalAlert | null> {
    const alert = this.alerts.get(alertId);

    if (!alert) return null;

    alert.status = 'acknowledged';
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = new Date();

    this.alerts.set(alertId, alert);

    logger.info({ alertId, acknowledgedBy }, 'Clinical alert acknowledged');

    return alert;
  }

  /**
   * Resolve an alert
   */
  static async resolveAlert(
    alertId: string,
    resolvedBy: string
  ): Promise<ClinicalAlert | null> {
    const alert = this.alerts.get(alertId);

    if (!alert) return null;

    alert.status = 'resolved';
    alert.resolvedBy = resolvedBy;
    alert.resolvedAt = new Date();

    this.alerts.set(alertId, alert);

    logger.info({ alertId, resolvedBy }, 'Clinical alert resolved');

    return alert;
  }

  /**
   * Dismiss an alert
   */
  static async dismissAlert(
    alertId: string,
    reason: string
  ): Promise<ClinicalAlert | null> {
    const alert = this.alerts.get(alertId);

    if (!alert) return null;

    alert.status = 'dismissed';
    alert.dismissReason = reason;

    this.alerts.set(alertId, alert);

    logger.info({ alertId, reason }, 'Clinical alert dismissed');

    return alert;
  }

  /**
   * Get alert statistics
   */
  static async getAlertStatistics(companyId?: string): Promise<{
    total: number;
    active: number;
    acknowledged: number;
    resolved: number;
    dismissed: number;
    byCategory: Record<string, number>;
    bySeverity: Record<string, number>;
  }> {
    const allAlerts = Array.from(this.alerts.values());

    const stats = {
      total: allAlerts.length,
      active: allAlerts.filter(a => a.status === 'active').length,
      acknowledged: allAlerts.filter(a => a.status === 'acknowledged').length,
      resolved: allAlerts.filter(a => a.status === 'resolved').length,
      dismissed: allAlerts.filter(a => a.status === 'dismissed').length,
      byCategory: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
    };

    // Count by category
    allAlerts.forEach(alert => {
      stats.byCategory[alert.category] = (stats.byCategory[alert.category] || 0) + 1;
      stats.bySeverity[alert.severity] = (stats.bySeverity[alert.severity] || 0) + 1;
    });

    return stats;
  }
}

// Initialize default rules on module load
ClinicalDecisionSupport.initializeDefaultRules();
