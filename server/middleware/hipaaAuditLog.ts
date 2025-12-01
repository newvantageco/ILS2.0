/**
 * HIPAA-Compliant Audit Logging Middleware
 *
 * Provides comprehensive audit logging for healthcare data access
 * in compliance with HIPAA requirements (45 CFR 164.312(b)).
 *
 * Required fields per HIPAA:
 * - User identification
 * - Date and time of access
 * - Type of access (create, read, update, delete)
 * - Resource accessed
 * - Success/failure of access
 */

import { Request, Response, NextFunction } from 'express';
import { db } from "../../db";
import { sql } from "drizzle-orm";
import { createLogger } from "../utils/logger";

const logger = createLogger("HIPAAAudit");

// PHI field patterns for automatic detection
const PHI_FIELD_PATTERNS = [
  'ssn', 'social_security', 'socialSecurity',
  'dateOfBirth', 'date_of_birth', 'dob', 'birthDate',
  'medicalRecord', 'medical_record', 'mrn',
  'diagnosis', 'diagnoses', 'icd',
  'prescription', 'rx', 'medication',
  'insurance', 'healthPlan', 'health_plan', 'policyNumber',
  'address', 'street', 'city', 'zip', 'postal',
  'phone', 'mobile', 'telephone', 'fax',
  'email',
  'emergencyContact', 'emergency_contact',
  'employer', 'occupation',
  'healthHistory', 'health_history', 'medicalHistory',
  'allergi', // Matches allergies, allergy
  'immunization', 'vaccination',
  'labResult', 'lab_result', 'testResult',
  'vitalSign', 'vital_sign', 'bloodPressure', 'heartRate',
  'treatmentPlan', 'treatment_plan', 'carePlan',
  'clinicalNote', 'clinical_note', 'progressNote',
  'consent', 'hipaaConsent',
  'geneticInfo', 'genetic_info',
  'mentalHealth', 'mental_health', 'psychiatric',
  'substanceAbuse', 'substance_abuse',
  'sexualHealth', 'sexual_health', 'std', 'hiv'
];

/**
 * HIPAA Audit Entry Interface
 */
export interface HIPAAAuditEntry {
  timestamp: Date;
  userId: string | null;
  userRole: string | null;
  tenantId: string | null;
  action: string;
  method: string;
  path: string;
  resourceType: string;
  resourceId: string | null;
  phiAccessed: boolean;
  phiFields: string[];
  ipAddress: string;
  userAgent: string;
  outcome: 'success' | 'failure';
  statusCode: number;
  failureReason?: string;
  requestBody?: object;
  responseTime: number;
  sessionId?: string;
}

/**
 * Detect PHI fields in response data
 */
function detectPHIFields(data: any, path: string = ''): string[] {
  const found: string[] = [];

  if (!data || typeof data !== 'object') {
    return found;
  }

  for (const [key, value] of Object.entries(data)) {
    const currentPath = path ? `${path}.${key}` : key;
    const lowerKey = key.toLowerCase();

    // Check if field name matches PHI patterns
    const isPhiField = PHI_FIELD_PATTERNS.some(pattern =>
      lowerKey.includes(pattern.toLowerCase())
    );

    if (isPhiField && value !== null && value !== undefined) {
      found.push(currentPath);
    }

    // Recursively check nested objects
    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (typeof item === 'object') {
            found.push(...detectPHIFields(item, `${currentPath}[${index}]`));
          }
        });
      } else {
        found.push(...detectPHIFields(value, currentPath));
      }
    }
  }

  return found;
}

/**
 * Determine resource type from request path
 */
function getResourceType(path: string): string {
  const pathParts = path.split('/').filter(Boolean);

  // Skip 'api' prefix
  const relevantParts = pathParts.filter(p => p !== 'api');

  // Common healthcare resource mappings
  const resourceMappings: Record<string, string> = {
    'patients': 'patient',
    'prescriptions': 'prescription',
    'examinations': 'examination',
    'eye-examinations': 'eye_examination',
    'appointments': 'appointment',
    'claims': 'insurance_claim',
    'insurance': 'insurance',
    'medical-billing': 'medical_billing',
    'ehr': 'electronic_health_record',
    'rcm': 'revenue_cycle',
    'orders': 'order',
    'invoices': 'invoice',
    'consultations': 'consultation',
    'care-plans': 'care_plan',
    'health-records': 'health_record'
  };

  for (const part of relevantParts) {
    if (resourceMappings[part]) {
      return resourceMappings[part];
    }
  }

  return relevantParts[0] || 'unknown';
}

/**
 * Extract resource ID from path
 */
function getResourceId(path: string): string | null {
  const pathParts = path.split('/').filter(Boolean);

  // Look for UUID or ID patterns
  for (const part of pathParts) {
    // UUID pattern
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(part)) {
      return part;
    }
    // Numeric ID
    if (/^\d+$/.test(part) && part.length < 20) {
      return part;
    }
    // Alphanumeric ID (common pattern)
    if (/^[a-zA-Z0-9_-]{10,}$/.test(part) && pathParts.indexOf(part) > 0) {
      return part;
    }
  }

  return null;
}

/**
 * Sanitize request body for logging (remove sensitive data)
 */
function sanitizeRequestBody(body: any): object | undefined {
  if (!body || typeof body !== 'object') {
    return undefined;
  }

  const sensitiveFields = ['password', 'token', 'secret', 'key', 'apiKey', 'accessToken'];
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(body)) {
    if (sensitiveFields.some(f => key.toLowerCase().includes(f))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'string' && value.length > 1000) {
      sanitized[key] = `[TRUNCATED: ${value.length} chars]`;
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Write audit entry to database
 */
async function writeAuditEntry(entry: HIPAAAuditEntry): Promise<void> {
  try {
    await db.execute(sql`
      INSERT INTO hipaa_audit_logs (
        timestamp,
        user_id,
        user_role,
        tenant_id,
        action,
        method,
        path,
        resource_type,
        resource_id,
        phi_accessed,
        phi_fields,
        ip_address,
        user_agent,
        outcome,
        status_code,
        failure_reason,
        request_body,
        response_time,
        session_id
      ) VALUES (
        ${entry.timestamp},
        ${entry.userId},
        ${entry.userRole},
        ${entry.tenantId},
        ${entry.action},
        ${entry.method},
        ${entry.path},
        ${entry.resourceType},
        ${entry.resourceId},
        ${entry.phiAccessed},
        ${JSON.stringify(entry.phiFields)},
        ${entry.ipAddress},
        ${entry.userAgent},
        ${entry.outcome},
        ${entry.statusCode},
        ${entry.failureReason || null},
        ${entry.requestBody ? JSON.stringify(entry.requestBody) : null},
        ${entry.responseTime},
        ${entry.sessionId || null}
      )
    `);
  } catch (error) {
    // Log to file as backup if database write fails
    logger.error({
      err: error,
      auditEntry: entry
    }, 'Failed to write HIPAA audit entry to database');

    // Critical: Always log to file system as backup
    logger.info({
      type: 'HIPAA_AUDIT_BACKUP',
      entry
    }, 'HIPAA audit entry (database backup)');
  }
}

/**
 * Main HIPAA audit logging middleware
 */
export function hipaaAuditLog(resourceType?: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    // Capture original json method
    const originalJson = res.json.bind(res);
    let responseData: any = null;

    res.json = function(data: any) {
      responseData = data;
      return originalJson(data);
    };

    // On response finish
    res.on('finish', async () => {
      const responseTime = Date.now() - startTime;
      const user = (req as any).user;

      // Detect PHI fields in response
      const phiFields = responseData ? detectPHIFields(responseData) : [];

      const entry: HIPAAAuditEntry = {
        timestamp: new Date(),
        userId: user?.id || null,
        userRole: user?.role || null,
        tenantId: user?.companyId || (req as any).tenantId || null,
        action: `${req.method} ${req.path}`,
        method: req.method,
        path: req.path,
        resourceType: resourceType || getResourceType(req.path),
        resourceId: req.params.id || getResourceId(req.path),
        phiAccessed: phiFields.length > 0,
        phiFields,
        ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
        userAgent: req.get('user-agent') || 'unknown',
        outcome: res.statusCode < 400 ? 'success' : 'failure',
        statusCode: res.statusCode,
        failureReason: res.statusCode >= 400 ? responseData?.error?.message : undefined,
        requestBody: ['POST', 'PUT', 'PATCH'].includes(req.method)
          ? sanitizeRequestBody(req.body)
          : undefined,
        responseTime,
        sessionId: (req as any).sessionID
      };

      // Write to database (non-blocking)
      writeAuditEntry(entry).catch(err => {
        logger.error({ err }, 'Failed to write audit entry');
      });

      // High-priority logging for PHI access
      if (entry.phiAccessed) {
        logger.info({
          type: 'PHI_ACCESS',
          userId: entry.userId,
          resourceType: entry.resourceType,
          resourceId: entry.resourceId,
          phiFields: entry.phiFields,
          outcome: entry.outcome
        }, 'PHI data accessed');
      }
    });

    next();
  };
}

/**
 * Middleware specifically for healthcare routes with enhanced PHI tracking
 */
export function healthcareAuditLog() {
  return hipaaAuditLog('healthcare');
}

/**
 * Middleware for patient data access
 */
export function patientAuditLog() {
  return hipaaAuditLog('patient');
}

/**
 * Log explicit PHI access (for programmatic logging)
 */
export async function logPHIAccess(params: {
  userId: string;
  tenantId: string;
  resourceType: string;
  resourceId: string;
  action: string;
  phiFields: string[];
  reason?: string;
}): Promise<void> {
  const entry: HIPAAAuditEntry = {
    timestamp: new Date(),
    userId: params.userId,
    userRole: null,
    tenantId: params.tenantId,
    action: params.action,
    method: 'INTERNAL',
    path: `internal/${params.resourceType}/${params.resourceId}`,
    resourceType: params.resourceType,
    resourceId: params.resourceId,
    phiAccessed: true,
    phiFields: params.phiFields,
    ipAddress: 'internal',
    userAgent: 'system',
    outcome: 'success',
    statusCode: 200,
    responseTime: 0
  };

  await writeAuditEntry(entry);

  logger.info({
    type: 'PHI_ACCESS_EXPLICIT',
    ...params
  }, 'Explicit PHI access logged');
}

export default hipaaAuditLog;
