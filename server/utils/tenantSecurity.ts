/**
 * Tenant Security Utilities
 *
 * Centralized utilities for multi-tenant security and resource ownership verification
 */

import { db } from '../db';
import { eq, and } from 'drizzle-orm';
import {
  orders,
  patients,
  appointments,
  eyeExaminations,
  prescriptions,
  testRoomBookings,
  remoteSessions,
  products
} from '../../shared/schema';

/**
 * Resource types that can be verified for ownership
 */
export type ResourceType =
  | 'order'
  | 'patient'
  | 'appointment'
  | 'examination'
  | 'prescription'
  | 'test_room_booking'
  | 'remote_session'
  | 'product';

/**
 * Result of resource ownership verification
 */
export interface OwnershipVerificationResult {
  isOwned: boolean;
  exists: boolean;
  resource?: any;
}

/**
 * Verify that a resource belongs to the specified company
 *
 * This function provides centralized ownership verification to prevent
 * cross-tenant data access attacks.
 *
 * @param resourceId - The ID of the resource to verify
 * @param resourceType - The type of resource
 * @param companyId - The company ID to verify against
 * @returns Promise with verification result
 *
 * @example
 * const result = await verifyResourceOwnership(orderId, 'order', companyId);
 * if (!result.isOwned) {
 *   return res.status(404).json({ error: 'Resource not found' });
 * }
 */
export async function verifyResourceOwnership(
  resourceId: string,
  resourceType: ResourceType,
  companyId: string
): Promise<OwnershipVerificationResult> {
  try {
    let resource: any = null;

    switch (resourceType) {
      case 'order':
        [resource] = await db
          .select()
          .from(orders)
          .where(and(
            eq(orders.id, resourceId),
            eq(orders.companyId, companyId)
          ))
          .limit(1);
        break;

      case 'patient':
        [resource] = await db
          .select()
          .from(patients)
          .where(and(
            eq(patients.id, resourceId),
            eq(patients.companyId, companyId)
          ))
          .limit(1);
        break;

      case 'appointment':
        [resource] = await db
          .select()
          .from(appointments)
          .where(and(
            eq(appointments.id, resourceId),
            eq(appointments.companyId, companyId)
          ))
          .limit(1);
        break;

      case 'examination':
        [resource] = await db
          .select()
          .from(eyeExaminations)
          .where(and(
            eq(eyeExaminations.id, resourceId),
            eq(eyeExaminations.companyId, companyId)
          ))
          .limit(1);
        break;

      case 'prescription':
        [resource] = await db
          .select()
          .from(prescriptions)
          .where(and(
            eq(prescriptions.id, resourceId),
            eq(prescriptions.companyId, companyId)
          ))
          .limit(1);
        break;

      case 'test_room_booking':
        [resource] = await db
          .select()
          .from(testRoomBookings)
          .where(and(
            eq(testRoomBookings.id, resourceId),
            eq(testRoomBookings.companyId, companyId)
          ))
          .limit(1);
        break;

      case 'remote_session':
        [resource] = await db
          .select()
          .from(remoteSessions)
          .where(and(
            eq(remoteSessions.id, resourceId),
            eq(remoteSessions.companyId, companyId)
          ))
          .limit(1);
        break;

      case 'product':
        [resource] = await db
          .select()
          .from(products)
          .where(and(
            eq(products.id, resourceId),
            eq(products.companyId, companyId)
          ))
          .limit(1);
        break;

      default:
        throw new Error(`Unknown resource type: ${resourceType}`);
    }

    // Check if resource was found AND belongs to company
    const exists = !!resource;
    const isOwned = exists && resource.companyId === companyId;

    return {
      isOwned,
      exists,
      resource: isOwned ? resource : undefined
    };
  } catch (error) {
    console.error(`[Tenant Security] Error verifying ${resourceType} ownership:`, error);
    return {
      isOwned: false,
      exists: false
    };
  }
}

/**
 * Verify multiple resources belong to the same company
 *
 * Useful for operations that involve multiple resources (e.g., linking order to patient)
 *
 * @param verifications - Array of verification checks to perform
 * @param companyId - The company ID to verify against
 * @returns Promise that resolves to true if all resources are owned, false otherwise
 *
 * @example
 * const allOwned = await verifyMultipleResources([
 *   { id: patientId, type: 'patient' },
 *   { id: appointmentId, type: 'appointment' }
 * ], companyId);
 */
export async function verifyMultipleResources(
  verifications: Array<{ id: string; type: ResourceType }>,
  companyId: string
): Promise<boolean> {
  const results = await Promise.all(
    verifications.map(v => verifyResourceOwnership(v.id, v.type, companyId))
  );

  return results.every(r => r.isOwned);
}

/**
 * Audit log entry for security events
 */
export interface SecurityAuditLog {
  userId: string;
  companyId: string;
  action: string;
  resourceType: ResourceType;
  resourceId: string;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

/**
 * Log security-relevant events for audit trail
 *
 * @param log - Security audit log entry
 */
export async function logSecurityEvent(log: SecurityAuditLog): Promise<void> {
  try {
    // In production, this should write to a dedicated audit log table
    // For now, log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Security Audit]', {
        ...log,
        timestamp: log.timestamp.toISOString()
      });
    }

    // TODO: Implement proper audit logging to database
    // await db.insert(auditLogs).values(log);
  } catch (error) {
    console.error('[Security Audit] Failed to log event:', error);
    // Don't throw - audit logging failures shouldn't break the application
  }
}

/**
 * Check if a user has platform admin privileges
 *
 * Platform admins can bypass tenant isolation for administrative purposes
 *
 * @param userRole - The user's role
 * @returns true if user is a platform admin
 */
export function isPlatformAdmin(userRole?: string): boolean {
  return userRole === 'platform_admin' || userRole === 'system_admin';
}

/**
 * Sanitize data for cross-tenant operations
 *
 * Removes sensitive fields that shouldn't be exposed across tenants
 *
 * @param data - Data to sanitize
 * @returns Sanitized data safe for cross-tenant viewing
 */
export function sanitizeCrossTenantData<T extends Record<string, any>>(data: T): Partial<T> {
  const sensitiveFields = [
    'apiKey',
    'apiSecret',
    'stripeCustomerId',
    'stripeSubscriptionId',
    'password',
    'passwordHash',
    'encryptedData',
    'nhsApiKey',
    'twilioAuthToken'
  ];

  const sanitized = { ...data };

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      delete sanitized[field];
    }
  }

  return sanitized;
}

/**
 * Generate a secure audit trail message
 *
 * @param userId - User performing the action
 * @param action - Action being performed
 * @param resourceType - Type of resource
 * @param resourceId - ID of resource
 * @param success - Whether the action succeeded
 * @returns Formatted audit message
 */
export function generateAuditMessage(
  userId: string,
  action: string,
  resourceType: ResourceType,
  resourceId: string,
  success: boolean
): string {
  const status = success ? 'SUCCESS' : 'FAILED';
  return `[${status}] User ${userId} attempted to ${action} ${resourceType} ${resourceId}`;
}
