/**
 * Audit Logging Middleware
 * 
 * Implements comprehensive audit logging for HIPAA compliance
 * Automatically logs all API requests with special handling for PHI access
 * 
 * Requirements (per COMPREHENSIVE_SAAS_DOCUMENTATION Section 8.3):
 * - Log all data access events
 * - Track PHI (Protected Health Information) access
 * - Retain logs for 7+ years (GOC requirement)
 * - Capture before/after state for updates
 */

import { Request, Response, NextFunction } from 'express';
import { db } from '../../db';
import { auditLogs } from '../../shared/schema';
import type { InsertAuditLog } from '../../shared/schema';

// Resources that contain PHI (Protected Health Information)
const PHI_RESOURCES = [
  'patient',
  'patients',
  'order',
  'orders',
  'prescription',
  'prescriptions',
  'eye_examination',
  'eye_examinations',
  'medical_history',
];

// Fields that are considered PHI
const PHI_FIELDS = [
  'nhsNumber',
  'dateOfBirth',
  'email',
  'phone',
  'address',
  'fullAddress',
  'medicalHistory',
  'currentMedications',
  'familyOcularHistory',
  'gpName',
  'gpPractice',
  'gpAddress',
  'emergencyContactName',
  'emergencyContactPhone',
];

/**
 * Determine if a resource type contains PHI
 */
function isPHIResource(resourceType: string): boolean {
  return PHI_RESOURCES.some(phi => 
    resourceType.toLowerCase().includes(phi.toLowerCase())
  );
}

/**
 * Extract PHI fields from request/response data
 */
function extractPHIFields(data: any): string[] {
  if (!data || typeof data !== 'object') return [];
  
  const foundFields: string[] = [];
  
  for (const field of PHI_FIELDS) {
    if (field in data && data[field] != null) {
      foundFields.push(field);
    }
  }
  
  return foundFields;
}

/**
 * Extract resource information from request path
 * E.g., /api/patients/123 -> { type: 'patient', id: '123' }
 */
function extractResource(path: string): { type: string; id?: string } {
  const parts = path.split('/').filter(Boolean);
  
  // Skip 'api' prefix
  const relevantParts = parts.slice(1);
  
  if (relevantParts.length === 0) {
    return { type: 'unknown' };
  }
  
  const resourceType = relevantParts[0];
  const resourceId = relevantParts[1];
  
  return {
    type: resourceType,
    id: resourceId && resourceId !== 'search' && resourceId !== 'stats' ? resourceId : undefined,
  };
}

/**
 * Map HTTP method to audit event type
 */
function getEventType(method: string): InsertAuditLog['eventType'] {
  switch (method.toUpperCase()) {
    case 'POST':
      return 'create';
    case 'GET':
      return 'read';
    case 'PUT':
    case 'PATCH':
      return 'update';
    case 'DELETE':
      return 'delete';
    default:
      return 'access';
  }
}

/**
 * Generate human-readable action description
 */
function generateActionDescription(method: string, path: string, user?: any): string {
  const { type, id } = extractResource(path);
  const userName = user ? `${user.firstName} ${user.lastName}` : 'Anonymous';
  
  switch (method.toUpperCase()) {
    case 'POST':
      return `${userName} created ${type}${id ? ` ${id}` : ''}`;
    case 'GET':
      return `${userName} accessed ${type}${id ? ` ${id}` : ' list'}`;
    case 'PUT':
    case 'PATCH':
      return `${userName} updated ${type}${id ? ` ${id}` : ''}`;
    case 'DELETE':
      return `${userName} deleted ${type}${id ? ` ${id}` : ''}`;
    default:
      return `${userName} performed ${method} on ${path}`;
  }
}

/**
 * Calculate retention date (7 years from now, per GOC requirements)
 */
function calculateRetentionDate(): Date {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 7);
  return date;
}

/**
 * Main audit logging middleware
 * 
 * Captures request/response details and logs to audit_logs table
 */
export async function auditMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  // Skip audit logging for certain endpoints
  const skipPaths = ['/health', '/api/health', '/uploads', '/ws'];
  if (skipPaths.some(path => req.path.startsWith(path))) {
    return next();
  }

  const startTime = Date.now();
  const { type: resourceType, id: resourceId } = extractResource(req.path);
  
  // Capture request body for create/update operations
  const requestBody = ['POST', 'PUT', 'PATCH'].includes(req.method) ? req.body : undefined;
  
  // Store original res.json to capture response
  const originalJson = res.json.bind(res);
  let responseBody: any;
  
  res.json = function(body: any) {
    responseBody = body;
    return originalJson(body);
  };

  // Wait for response to complete
  res.on('finish', async () => {
    try {
      const user = (req as any).user;
      const duration = Date.now() - startTime;
      
      // Determine if PHI was accessed
      const phiAccessed = isPHIResource(resourceType);
      const phiFields = phiAccessed ? extractPHIFields(requestBody || responseBody) : undefined;
      
      // Prepare audit log entry
      const auditEntry: InsertAuditLog = {
        // Who
        userId: user?.id || null,
        userEmail: user?.email || null,
        userRole: user?.role || null,
        companyId: user?.companyId || null,
        
        // What
        eventType: getEventType(req.method),
        resourceType,
        resourceId: resourceId || null,
        action: generateActionDescription(req.method, req.path, user),
        
        // Where
        ipAddress: req.ip || req.socket.remoteAddress || null,
        userAgent: req.get('user-agent') || null,
        endpoint: req.path,
        method: req.method,
        
        // Result
        statusCode: res.statusCode,
        success: res.statusCode >= 200 && res.statusCode < 400,
        errorMessage: res.statusCode >= 400 && responseBody?.error ? responseBody.error : null,
        
        // Data changes
        changesBefore: req.method === 'PUT' || req.method === 'PATCH' ? requestBody : null,
        changesAfter: req.method === 'PUT' || req.method === 'PATCH' ? responseBody : null,
        metadata: {
          duration,
          contentType: req.get('content-type'),
          responseSize: res.get('content-length'),
        },
        
        // HIPAA
        phiAccessed,
        phiFields: phiFields && phiFields.length > 0 ? phiFields : null,
        justification: req.get('x-access-justification') || null, // Optional header
        
        // Retention
        retentionDate: calculateRetentionDate(),
      };
      
      // Insert audit log (fire and forget - don't block response)
      await db.insert(auditLogs).values(auditEntry);
      
    } catch (error) {
      // Log error but don't fail the request
      console.error('[AUDIT] Failed to create audit log:', error);
    }
  });

  next();
}

/**
 * Middleware to log authentication attempts
 * Should be called in auth routes before passport.authenticate
 */
export async function auditAuthAttempt(req: Request, email: string, success: boolean, errorMessage?: string): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      // Who
      userId: null, // Not authenticated yet
      userEmail: email,
      userRole: null,
      companyId: null,
      
      // What
      eventType: 'auth_attempt',
      resourceType: 'authentication',
      resourceId: null,
      action: success ? `Successful login for ${email}` : `Failed login attempt for ${email}`,
      
      // Where
      ipAddress: req.ip || req.socket.remoteAddress || null,
      userAgent: req.get('user-agent') || null,
      endpoint: req.path,
      method: req.method,
      
      // Result
      statusCode: success ? 200 : 401,
      success,
      errorMessage,
      
      // Data
      changesBefore: null,
      changesAfter: null,
      metadata: {
        timestamp: new Date().toISOString(),
      },
      
      // HIPAA
      phiAccessed: false,
      phiFields: null,
      justification: null,
      
      // Retention
      retentionDate: calculateRetentionDate(),
    });
  } catch (error) {
    console.error('[AUDIT] Failed to log auth attempt:', error);
  }
}

/**
 * Middleware to log user logout
 */
export async function auditLogout(userId: string, userEmail: string): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      userId,
      userEmail,
      userRole: null,
      companyId: null,
      eventType: 'logout',
      resourceType: 'authentication',
      resourceId: userId,
      action: `User ${userEmail} logged out`,
      ipAddress: null,
      userAgent: null,
      endpoint: '/api/auth/logout',
      method: 'POST',
      statusCode: 200,
      success: true,
      errorMessage: null,
      changesBefore: null,
      changesAfter: null,
      metadata: null,
      phiAccessed: false,
      phiFields: null,
      justification: null,
      retentionDate: calculateRetentionDate(),
    });
  } catch (error) {
    console.error('[AUDIT] Failed to log logout:', error);
  }
}

/**
 * Manual audit log helper for special cases
 */
export async function createAuditLog(entry: Partial<InsertAuditLog> & { 
  action: string;
  eventType: InsertAuditLog['eventType'];
  resourceType: string;
  success: boolean;
}): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      timestamp: new Date(),
      userId: entry.userId || null,
      userEmail: entry.userEmail || null,
      userRole: entry.userRole || null,
      companyId: entry.companyId || null,
      eventType: entry.eventType,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId || null,
      action: entry.action,
      ipAddress: entry.ipAddress || null,
      userAgent: entry.userAgent || null,
      endpoint: entry.endpoint || null,
      method: entry.method || null,
      statusCode: entry.statusCode || null,
      success: entry.success,
      errorMessage: entry.errorMessage || null,
      changesBefore: entry.changesBefore || null,
      changesAfter: entry.changesAfter || null,
      metadata: entry.metadata || null,
      phiAccessed: entry.phiAccessed || false,
      phiFields: entry.phiFields || null,
      justification: entry.justification || null,
      retentionDate: calculateRetentionDate(),
    });
  } catch (error) {
    console.error('[AUDIT] Failed to create manual audit log:', error);
  }
}

export default {
  auditMiddleware,
  auditAuthAttempt,
  auditLogout,
  createAuditLog,
};
