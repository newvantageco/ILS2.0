/**
 * Permission Utilities
 * Centralized permission checking functions to ensure consistency across the platform
 */

import type { roleEnum } from '../../shared/schema';

type UserRole = typeof roleEnum.enumValues[number];

interface User {
  id: string;
  role: UserRole;
  companyId?: string;
  enhancedRole?: string;
}

/**
 * Check if user is an administrator (any type)
 * Includes: platform_admin, admin, company_admin
 */
export function isAdmin(user: User | null | undefined): boolean {
  if (!user) return false;
  return ['platform_admin', 'admin', 'company_admin'].includes(user.role);
}

/**
 * Check if user is a platform administrator
 * Only platform_admin role
 */
export function isPlatformAdmin(user: User | null | undefined): boolean {
  if (!user) return false;
  return user.role === 'platform_admin';
}

/**
 * Check if user is a company administrator
 * Includes: company_admin, platform_admin
 */
export function isCompanyAdmin(user: User | null | undefined): boolean {
  if (!user) return false;
  return user.role === 'company_admin' || user.role === 'platform_admin';
}

/**
 * Check if user is an Eye Care Professional (ECP/Optometrist)
 * Includes: ecp role, optometrist enhanced role, or any admin
 */
export function isECP(user: User | null | undefined): boolean {
  if (!user) return false;
  return (
    user.role === 'ecp' ||
    user.enhancedRole === 'optometrist' ||
    isAdmin(user)
  );
}

/**
 * Check if user can perform clinical examinations
 * Includes: ECPs and all administrators
 */
export function canPerformExaminations(user: User | null | undefined): boolean {
  return isECP(user);
}

/**
 * Check if user can edit examination records
 * Includes: ECPs and all administrators
 */
export function canEditExaminations(user: User | null | undefined): boolean {
  return isECP(user);
}

/**
 * Check if user can manage test rooms and equipment
 * Includes: all administrators (company_admin, admin, platform_admin)
 */
export function canManageTestRooms(user: User | null | undefined): boolean {
  return isAdmin(user);
}

/**
 * Check if user can create prescription templates
 * Includes: ECPs and all administrators
 */
export function canCreatePrescriptionTemplates(user: User | null | undefined): boolean {
  return isECP(user);
}

/**
 * Check if user can manage clinical protocols
 * Includes: ECPs and all administrators
 */
export function canManageClinicalProtocols(user: User | null | undefined): boolean {
  return isECP(user);
}

/**
 * Check if user can view audit logs
 * Includes: all administrators
 */
export function canViewAuditLogs(user: User | null | undefined): boolean {
  return isAdmin(user);
}

/**
 * Check if user can trigger scheduled emails
 * Includes: all administrators
 */
export function canTriggerScheduledEmails(user: User | null | undefined): boolean {
  return isAdmin(user);
}

/**
 * Check if user can manage company settings
 * Includes: company_admin and platform_admin
 */
export function canManageCompanySettings(user: User | null | undefined): boolean {
  return isCompanyAdmin(user);
}

/**
 * Check if user can manage platform-wide settings
 * Only platform_admin
 */
export function canManagePlatformSettings(user: User | null | undefined): boolean {
  return isPlatformAdmin(user);
}

/**
 * Helper for Express middleware - check admin permissions
 */
export function requireAdminMiddleware(user: User | null | undefined): boolean {
  return isAdmin(user);
}

/**
 * Helper for Express middleware - check ECP permissions
 */
export function requireECPMiddleware(user: User | null | undefined): boolean {
  return isECP(user);
}

/**
 * Get user role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    'platform_admin': 'Platform Administrator',
    'admin': 'Administrator',
    'company_admin': 'Company Administrator',
    'ecp': 'Eye Care Professional',
    'lab_tech': 'Lab Technician',
    'engineer': 'Engineer',
    'supplier': 'Supplier',
  };
  return roleNames[role] || role;
}
