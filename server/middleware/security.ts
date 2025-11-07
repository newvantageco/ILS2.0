import { Request, Response, NextFunction } from 'express';
import { createHmac } from 'crypto';
import type { TLSSocket } from 'tls';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { AuthenticatedRequest } from './auth';
import { eq } from 'drizzle-orm';
import * as schema from '@shared/schema';
import { db } from '../db';
import PasswordValidator from 'password-validator';

// Constants for security requirements
const REQUIRED_TLS_VERSION = 'TLSv1.3';
const MIN_PASSWORD_LENGTH = 12;

// Common passwords list (top 100 most common passwords)
const COMMON_PASSWORDS = [
  'password', '123456', '123456789', 'qwerty', '12345678', '111111', '123123',
  '1234567890', '1234567', 'password1', '12345', '1234', 'abc123', 'Password1',
  'password123', '123', 'admin', 'letmein', 'welcome', 'monkey', '1qaz2wsx',
  'dragon', 'master', 'login', 'princess', 'qwertyuiop', 'solo', 'passw0rd',
  'starwars', 'sunshine', 'iloveyou', 'football', 'shadow', 'superman', 'batman',
  'trustno1', 'whatever', 'charlie', 'michael', 'jennifer', '000000', 'jordan',
  'harley', 'hunter', 'zxcvbnm', 'corvette', 'freedom', 'mustang', 'rangers'
];

// Password validation schema
const passwordSchema = new PasswordValidator();

passwordSchema
  .is().min(12)
  .is().max(128)
  .has().uppercase()
  .has().lowercase()
  .has().digits()
  .has().symbols()
  .has().not().spaces()
  .is().not().oneOf(COMMON_PASSWORDS);

// Security headers middleware - Enhanced with helmet.js
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // unsafe-eval needed for Vite HMR in dev
      connectSrc: ["'self'", "https:", "wss:"],
      frameSrc: ["'self'", "https://js.stripe.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false, // Needed for some third-party integrations
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
});

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
interface SensitiveData {
  nhsNumber?: string;
  dateOfBirth?: string;
  email?: string;
  phone?: string;
  address?: string;
  postcode?: string;
  ssn?: string;
  [key: string]: any; // For additional dynamic fields
}

export const anonymizeData = <T extends SensitiveData>(data: T): T => {
  const sensitiveFields: (keyof SensitiveData)[] = [
    'nhsNumber', 'dateOfBirth', 'email', 'phone',
    'address', 'postcode', 'ssn'
  ];

  // Deep clone to prevent mutations
  const anonymized: any = JSON.parse(JSON.stringify(data));

  sensitiveFields.forEach(field => {
    const value = anonymized[field];
    if (typeof value === 'string' && value.length > 0) {
      anonymized[field] = '*'.repeat(value.length);
    }
  });

  return anonymized as T;
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
export const validatePassword = (
  password: string,
  userData?: { email?: string; name?: string }
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!password || password.length < 12) {
    errors.push('Password must be at least 12 characters');
  }

  const validationResult = passwordSchema.validate(password, { details: true });
  if (Array.isArray(validationResult)) {
    errors.push(...validationResult.map((err: any) => err.message));
  }

  // Check for user info in password
  if (userData) {
    const email = userData.email?.split('@')[0].toLowerCase();
    const name = userData.name?.toLowerCase();
    const lowerPassword = password.toLowerCase();

    if (email && lowerPassword.includes(email)) {
      errors.push('Password cannot contain your email');
    }
    if (name && lowerPassword.includes(name)) {
      errors.push('Password cannot contain your name');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

// ============== RATE LIMITING (DDoS Protection) ==============

/**
 * Global rate limiter for all API endpoints
 * Limits: 100 requests per 15 minutes per IP
 */
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => req.path === '/health',
});

/**
 * Strict rate limiter for authentication endpoints
 * Limits: 5 attempts per 15 minutes per IP
 * Prevents brute force attacks
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

/**
 * Rate limiter for write operations
 * Limits: 30 requests per 15 minutes per IP
 */
export const writeRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: {
    error: 'Too many write requests, please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => req.method === 'GET' || req.method === 'HEAD',
});

/**
 * Rate limiter for file uploads
 * Limits: 10 uploads per hour per IP
 */
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    error: 'Upload limit exceeded, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for AI endpoints
 * Limits: 20 requests per hour per IP (prevents API cost abuse)
 */
export const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: {
    error: 'AI request limit exceeded, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});