/**
 * Unified Role System for ILS 2.0
 *
 * A clear, hierarchical role system for optical practices with:
 * - Intuitive role names
 * - Clear permission boundaries
 * - Easy to understand hierarchy
 * - Flexible for multi-location practices
 */

export const ROLES = {
  // Platform Level (Super Admin)
  PLATFORM_ADMIN: 'platform_admin',

  // Practice Owner/Management Level
  PRACTICE_OWNER: 'practice_owner',
  PRACTICE_MANAGER: 'practice_manager',

  // Clinical Staff
  OPTOMETRIST: 'optometrist',
  DISPENSING_OPTICIAN: 'dispensing_optician',
  CONTACT_LENS_OPTICIAN: 'contact_lens_optician',

  // Retail & Front Desk
  RECEPTIONIST: 'receptionist',
  RETAIL_ASSISTANT: 'retail_assistant',

  // Laboratory
  LAB_MANAGER: 'lab_manager',
  LAB_TECHNICIAN: 'lab_technician',
  QUALITY_CONTROL: 'quality_control',

  // Supply Chain
  SUPPLIER: 'supplier',
  INVENTORY_MANAGER: 'inventory_manager',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

/**
 * Role Display Names - User-friendly labels
 */
export const ROLE_LABELS: Record<Role, string> = {
  [ROLES.PLATFORM_ADMIN]: 'Platform Administrator',
  [ROLES.PRACTICE_OWNER]: 'Practice Owner',
  [ROLES.PRACTICE_MANAGER]: 'Practice Manager',
  [ROLES.OPTOMETRIST]: 'Optometrist',
  [ROLES.DISPENSING_OPTICIAN]: 'Dispensing Optician',
  [ROLES.CONTACT_LENS_OPTICIAN]: 'Contact Lens Optician',
  [ROLES.RECEPTIONIST]: 'Receptionist',
  [ROLES.RETAIL_ASSISTANT]: 'Retail Assistant',
  [ROLES.LAB_MANAGER]: 'Laboratory Manager',
  [ROLES.LAB_TECHNICIAN]: 'Laboratory Technician',
  [ROLES.QUALITY_CONTROL]: 'Quality Control Specialist',
  [ROLES.SUPPLIER]: 'Supplier',
  [ROLES.INVENTORY_MANAGER]: 'Inventory Manager',
};

/**
 * Role Descriptions - What each role does
 */
export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  [ROLES.PLATFORM_ADMIN]: 'Full system access across all practices',
  [ROLES.PRACTICE_OWNER]: 'Full practice access, financial reports, staff management',
  [ROLES.PRACTICE_MANAGER]: 'Practice operations, scheduling, inventory, reports',
  [ROLES.OPTOMETRIST]: 'Eye examinations, prescriptions, clinical records',
  [ROLES.DISPENSING_OPTICIAN]: 'Spectacle dispensing, adjustments, measurements',
  [ROLES.CONTACT_LENS_OPTICIAN]: 'Contact lens fittings, trials, aftercare',
  [ROLES.RECEPTIONIST]: 'Appointments, patient check-in, basic admin',
  [ROLES.RETAIL_ASSISTANT]: 'Frame sales, payments, inventory',
  [ROLES.LAB_MANAGER]: 'Lab operations, quality oversight, staff supervision',
  [ROLES.LAB_TECHNICIAN]: 'Lens manufacturing, edging, quality checks',
  [ROLES.QUALITY_CONTROL]: 'Quality inspection, standards compliance',
  [ROLES.SUPPLIER]: 'View orders, update delivery status, product catalog',
  [ROLES.INVENTORY_MANAGER]: 'Stock management, ordering, supplier coordination',
};

/**
 * Permission Categories
 */
export const PERMISSIONS = {
  // Appointments & Scheduling
  APPOINTMENTS_VIEW: 'appointments:view',
  APPOINTMENTS_CREATE: 'appointments:create',
  APPOINTMENTS_EDIT: 'appointments:edit',
  APPOINTMENTS_CANCEL: 'appointments:cancel',
  APPOINTMENTS_MANAGE_ALL: 'appointments:manage_all',

  // Patients
  PATIENTS_VIEW: 'patients:view',
  PATIENTS_CREATE: 'patients:create',
  PATIENTS_EDIT: 'patients:edit',
  PATIENTS_DELETE: 'patients:delete',
  PATIENTS_VIEW_SENSITIVE: 'patients:view_sensitive',

  // Clinical
  EXAMINATIONS_PERFORM: 'examinations:perform',
  EXAMINATIONS_VIEW: 'examinations:view',
  EXAMINATIONS_EDIT: 'examinations:edit',
  PRESCRIPTIONS_CREATE: 'prescriptions:create',
  PRESCRIPTIONS_VERIFY: 'prescriptions:verify',
  PRESCRIPTIONS_DISPENSE: 'prescriptions:dispense',

  // Retail & POS
  POS_ACCESS: 'pos:access',
  POS_PROCESS_PAYMENT: 'pos:process_payment',
  POS_REFUND: 'pos:refund',
  POS_VIEW_REPORTS: 'pos:view_reports',

  // Inventory
  INVENTORY_VIEW: 'inventory:view',
  INVENTORY_ADJUST: 'inventory:adjust',
  INVENTORY_ORDER: 'inventory:order',
  INVENTORY_RECEIVE: 'inventory:receive',

  // Laboratory
  LAB_VIEW_ORDERS: 'lab:view_orders',
  LAB_PROCESS_ORDERS: 'lab:process_orders',
  LAB_QUALITY_CHECK: 'lab:quality_check',
  LAB_MANAGE: 'lab:manage',

  // Financial
  FINANCE_VIEW_REPORTS: 'finance:view_reports',
  FINANCE_MANAGE: 'finance:manage',
  FINANCE_VIEW_ALL: 'finance:view_all',

  // Staff & Practice Management
  STAFF_VIEW: 'staff:view',
  STAFF_MANAGE: 'staff:manage',
  PRACTICE_SETTINGS: 'practice:settings',
  PRACTICE_MANAGE_ALL: 'practice:manage_all',

  // System Administration
  SYSTEM_ADMIN: 'system:admin',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

/**
 * Role-Based Permissions Matrix
 * Defines what each role can do
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [ROLES.PLATFORM_ADMIN]: Object.values(PERMISSIONS),

  [ROLES.PRACTICE_OWNER]: [
    PERMISSIONS.APPOINTMENTS_MANAGE_ALL,
    PERMISSIONS.PATIENTS_VIEW,
    PERMISSIONS.PATIENTS_CREATE,
    PERMISSIONS.PATIENTS_EDIT,
    PERMISSIONS.PATIENTS_VIEW_SENSITIVE,
    PERMISSIONS.EXAMINATIONS_VIEW,
    PERMISSIONS.PRESCRIPTIONS_VERIFY,
    PERMISSIONS.POS_ACCESS,
    PERMISSIONS.POS_PROCESS_PAYMENT,
    PERMISSIONS.POS_REFUND,
    PERMISSIONS.POS_VIEW_REPORTS,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_ADJUST,
    PERMISSIONS.INVENTORY_ORDER,
    PERMISSIONS.LAB_VIEW_ORDERS,
    PERMISSIONS.LAB_MANAGE,
    PERMISSIONS.FINANCE_VIEW_ALL,
    PERMISSIONS.FINANCE_MANAGE,
    PERMISSIONS.STAFF_MANAGE,
    PERMISSIONS.PRACTICE_MANAGE_ALL,
  ],

  [ROLES.PRACTICE_MANAGER]: [
    PERMISSIONS.APPOINTMENTS_MANAGE_ALL,
    PERMISSIONS.PATIENTS_VIEW,
    PERMISSIONS.PATIENTS_CREATE,
    PERMISSIONS.PATIENTS_EDIT,
    PERMISSIONS.EXAMINATIONS_VIEW,
    PERMISSIONS.POS_ACCESS,
    PERMISSIONS.POS_VIEW_REPORTS,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_ADJUST,
    PERMISSIONS.INVENTORY_ORDER,
    PERMISSIONS.LAB_VIEW_ORDERS,
    PERMISSIONS.FINANCE_VIEW_REPORTS,
    PERMISSIONS.STAFF_VIEW,
    PERMISSIONS.PRACTICE_SETTINGS,
  ],

  [ROLES.OPTOMETRIST]: [
    PERMISSIONS.APPOINTMENTS_VIEW,
    PERMISSIONS.APPOINTMENTS_CREATE,
    PERMISSIONS.APPOINTMENTS_EDIT,
    PERMISSIONS.PATIENTS_VIEW,
    PERMISSIONS.PATIENTS_CREATE,
    PERMISSIONS.PATIENTS_EDIT,
    PERMISSIONS.PATIENTS_VIEW_SENSITIVE,
    PERMISSIONS.EXAMINATIONS_PERFORM,
    PERMISSIONS.EXAMINATIONS_VIEW,
    PERMISSIONS.EXAMINATIONS_EDIT,
    PERMISSIONS.PRESCRIPTIONS_CREATE,
    PERMISSIONS.PRESCRIPTIONS_VERIFY,
    PERMISSIONS.INVENTORY_VIEW,
  ],

  [ROLES.DISPENSING_OPTICIAN]: [
    PERMISSIONS.APPOINTMENTS_VIEW,
    PERMISSIONS.APPOINTMENTS_CREATE,
    PERMISSIONS.PATIENTS_VIEW,
    PERMISSIONS.PATIENTS_CREATE,
    PERMISSIONS.PATIENTS_EDIT,
    PERMISSIONS.EXAMINATIONS_VIEW,
    PERMISSIONS.PRESCRIPTIONS_DISPENSE,
    PERMISSIONS.POS_ACCESS,
    PERMISSIONS.POS_PROCESS_PAYMENT,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_ADJUST,
  ],

  [ROLES.CONTACT_LENS_OPTICIAN]: [
    PERMISSIONS.APPOINTMENTS_VIEW,
    PERMISSIONS.APPOINTMENTS_CREATE,
    PERMISSIONS.PATIENTS_VIEW,
    PERMISSIONS.PATIENTS_EDIT,
    PERMISSIONS.EXAMINATIONS_VIEW,
    PERMISSIONS.PRESCRIPTIONS_CREATE,
    PERMISSIONS.PRESCRIPTIONS_DISPENSE,
    PERMISSIONS.POS_ACCESS,
    PERMISSIONS.INVENTORY_VIEW,
  ],

  [ROLES.RECEPTIONIST]: [
    PERMISSIONS.APPOINTMENTS_VIEW,
    PERMISSIONS.APPOINTMENTS_CREATE,
    PERMISSIONS.APPOINTMENTS_EDIT,
    PERMISSIONS.APPOINTMENTS_CANCEL,
    PERMISSIONS.PATIENTS_VIEW,
    PERMISSIONS.PATIENTS_CREATE,
    PERMISSIONS.POS_ACCESS,
    PERMISSIONS.POS_PROCESS_PAYMENT,
  ],

  [ROLES.RETAIL_ASSISTANT]: [
    PERMISSIONS.APPOINTMENTS_VIEW,
    PERMISSIONS.PATIENTS_VIEW,
    PERMISSIONS.POS_ACCESS,
    PERMISSIONS.POS_PROCESS_PAYMENT,
    PERMISSIONS.INVENTORY_VIEW,
  ],

  [ROLES.LAB_MANAGER]: [
    PERMISSIONS.LAB_VIEW_ORDERS,
    PERMISSIONS.LAB_PROCESS_ORDERS,
    PERMISSIONS.LAB_QUALITY_CHECK,
    PERMISSIONS.LAB_MANAGE,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_ADJUST,
    PERMISSIONS.STAFF_VIEW,
  ],

  [ROLES.LAB_TECHNICIAN]: [
    PERMISSIONS.LAB_VIEW_ORDERS,
    PERMISSIONS.LAB_PROCESS_ORDERS,
    PERMISSIONS.LAB_QUALITY_CHECK,
    PERMISSIONS.INVENTORY_VIEW,
  ],

  [ROLES.QUALITY_CONTROL]: [
    PERMISSIONS.LAB_VIEW_ORDERS,
    PERMISSIONS.LAB_QUALITY_CHECK,
  ],

  [ROLES.SUPPLIER]: [
    PERMISSIONS.LAB_VIEW_ORDERS,
    PERMISSIONS.INVENTORY_VIEW,
  ],

  [ROLES.INVENTORY_MANAGER]: [
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_ADJUST,
    PERMISSIONS.INVENTORY_ORDER,
    PERMISSIONS.INVENTORY_RECEIVE,
    PERMISSIONS.FINANCE_VIEW_REPORTS,
  ],
};

/**
 * Role Hierarchy - Higher roles can see data from lower roles
 */
export const ROLE_HIERARCHY: Record<Role, number> = {
  [ROLES.PLATFORM_ADMIN]: 100,
  [ROLES.PRACTICE_OWNER]: 90,
  [ROLES.PRACTICE_MANAGER]: 80,
  [ROLES.LAB_MANAGER]: 70,
  [ROLES.OPTOMETRIST]: 60,
  [ROLES.DISPENSING_OPTICIAN]: 50,
  [ROLES.CONTACT_LENS_OPTICIAN]: 50,
  [ROLES.INVENTORY_MANAGER]: 50,
  [ROLES.LAB_TECHNICIAN]: 40,
  [ROLES.QUALITY_CONTROL]: 40,
  [ROLES.RECEPTIONIST]: 30,
  [ROLES.RETAIL_ASSISTANT]: 20,
  [ROLES.SUPPLIER]: 10,
};

/**
 * Helper Functions
 */

/**
 * Check if a user has a specific permission
 */
export function hasPermission(userRole: Role, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[userRole];
  return permissions.includes(permission);
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(userRole: Role, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(userRole: Role, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission));
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if one role is higher in hierarchy than another
 */
export function isRoleHigherThan(role1: Role, role2: Role): boolean {
  return ROLE_HIERARCHY[role1] > ROLE_HIERARCHY[role2];
}

/**
 * Get user-friendly role label
 */
export function getRoleLabel(role: Role): string {
  return ROLE_LABELS[role] || role;
}

/**
 * Get role description
 */
export function getRoleDescription(role: Role): string {
  return ROLE_DESCRIPTIONS[role] || '';
}

/**
 * Migration helper: Map old roles to new unified system
 */
export const LEGACY_ROLE_MAPPING: Record<string, Role> = {
  'ecp': ROLES.OPTOMETRIST,
  'admin': ROLES.PRACTICE_MANAGER,
  'lab_tech': ROLES.LAB_TECHNICIAN,
  'engineer': ROLES.LAB_MANAGER,
  'supplier': ROLES.SUPPLIER,
  'platform_admin': ROLES.PLATFORM_ADMIN,
  'company_admin': ROLES.PRACTICE_OWNER,
  'owner': ROLES.PRACTICE_OWNER,
  'optometrist': ROLES.OPTOMETRIST,
  'dispenser': ROLES.DISPENSING_OPTICIAN,
  'retail_assistant': ROLES.RETAIL_ASSISTANT,
};

/**
 * Convert legacy role to new unified role
 */
export function mapLegacyRole(legacyRole: string): Role {
  return LEGACY_ROLE_MAPPING[legacyRole] || ROLES.RETAIL_ASSISTANT;
}
