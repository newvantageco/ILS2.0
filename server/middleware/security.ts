import { Request, Response, NextFunction } from 'express';
import { createHmac } from 'crypto';
import type { TLSSocket } from 'tls';
import { AuthenticatedRequest } from './auth';
import { eq } from 'drizzle-orm';
import * as schema from '@shared/schema';
import { db } from '../db';

// Constants for security requirements
const REQUIRED_TLS_VERSION = 'TLSv1.3';
const MIN_PASSWORD_LENGTH = 12;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Set security headers
  res.set({
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  });
  next();
};

// Enforce TLS version
export const enforceTLS = (req: Request, res: Response, next: NextFunction) => {
  const protocol = req.protocol;
  if (protocol !== 'https') {
    return res.status(403).json({ error: 'HTTPS required' });
  }
  
  // Check TLS version
  const tlsSocket = req.socket as TLSSocket;
  const negotiatedProtocol = typeof tlsSocket.getProtocol === 'function' ? tlsSocket.getProtocol() : null;
  if (negotiatedProtocol && negotiatedProtocol !== REQUIRED_TLS_VERSION) {
    return res.status(403).json({ error: `TLS ${REQUIRED_TLS_VERSION} required` });
  }
  
  next();
};

// Data anonymization for sensitive fields
export const anonymizeData = (data: any) => {
  const sensitiveFields = ['nhsNumber', 'dateOfBirth', 'email'];
  const anonymized = { ...data };
  
  sensitiveFields.forEach(field => {
    if (anonymized[field]) {
      anonymized[field] = anonymized[field].replace(/./g, '*');
    }
  });
  
  return anonymized;
};

// Audit logging middleware
export const auditLog = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;

    const logEntry = {
      timestamp: new Date(),
      userId: req.user?.id ?? null,
      userRole: req.user?.role ?? null,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? null
    };

    if (process.env.NODE_ENV !== 'test') {
      console.info('request.audit', logEntry);
    }
  });

  next();
};

// Patient data access control
export const enforcePatientDataAccess = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const patientId = req.params.patientId || req.body.patientId;
  
  if (!patientId) {
    return next();
  }
  
  try {
    // Check if user has access to patient data
    const patient = await db.select()
      .from(schema.patients)
      .where(eq(schema.patients.id, patientId))
      .execute();
    
    if (!patient || patient.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    // ECP can only access their own patients
    if (req.user?.role === 'ecp' && patient[0].ecpId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied to patient data' });
    }
    
    next();
  } catch (error) {
    console.error('Error checking patient access:', error);
    res.status(500).json({ error: 'Failed to verify patient access' });
  }
};

// Data retention policy enforcement
export const enforceRetentionPolicy = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // GOC requires retention of records for at least 7 years
  const RETENTION_PERIOD = 7 * 365 * 24 * 60 * 60 * 1000; // 7 years in milliseconds
  
  try {
    // Check if accessing historical data
    const recordDate = req.query.date ? new Date(req.query.date as string) : null;
    
    if (recordDate && Date.now() - recordDate.getTime() > RETENTION_PERIOD) {
      return res.status(410).json({ error: 'Record expired per retention policy' });
    }
    
    next();
  } catch (error) {
    console.error('Error enforcing retention policy:', error);
    res.status(500).json({ error: 'Failed to verify retention policy' });
  }
};

// Data encryption helper
export const encryptSensitiveData = (data: string, key: string): string => {
  const hmac = createHmac('sha256', key);
  return hmac.update(data).digest('hex');
};

// Password policy enforcement
export const validatePassword = (password: string): boolean => {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return false;
  }
  
  return PASSWORD_PATTERN.test(password);
};