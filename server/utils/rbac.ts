/**
 * Role-Based Access Control (RBAC) System
 * 
 * Defines roles and their permissions with company isolation
 */

export const ROLES = {
  // Platform Level (Master Admin)
  PLATFORM_ADMIN: 'platform_admin',
  
  // Company Level
  COMPANY_ADMIN: 'company_admin',     // Full access within their company
  ECP: 'ecp',                          // Eye care professional (subscribed user)
  LAB_TECH: 'lab_tech',               // Laboratory technician
  ENGINEER: 'engineer',                // Engineer
  SUPPLIER: 'supplier',                // Supplier
  ADMIN: 'admin'                       // Legacy admin role
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];

/**
 * Role hierarchy and permissions
 */
export const ROLE_PERMISSIONS = {
  // ==========================================
  // PLATFORM ADMIN (Master Admin)
  // ==========================================
  platform_admin: {
    level: 'platform',
    displayName: 'Platform Administrator',
    description: 'Full system access across all companies',
    permissions: [
      // Company Management
      'view_all_companies',
      'create_company',
      'edit_any_company',
      'delete_any_company',
      'manage_company_subscriptions',
      
      // User Management
      'view_all_users',
      'create_any_user',
      'edit_any_user',
      'delete_any_user',
      'reset_any_password',
      
      // System
      'access_admin_dashboard',
      'view_system_logs',
      'manage_system_settings',
      'view_analytics',
      
      // AI & Features
      'unlimited_ai_access',
      'manage_ai_settings',
      
      // Data Access
      'view_all_orders',
      'view_all_patients',
      'view_all_inventory',
      'view_all_reports'
    ],
    isolation: 'none' // Can access all companies
  },

  // ==========================================
  // COMPANY ADMIN (Company Owner/Manager)
  // ==========================================
  company_admin: {
    level: 'company',
    displayName: 'Company Administrator',
    description: 'Full access within their company only',
    permissions: [
      // Company Management
      'view_own_company',
      'edit_own_company',
      'manage_company_settings',
      'view_company_billing',
      
      // User Management (Company Only)
      'view_company_users',
      'create_company_user',
      'edit_company_user',
      'delete_company_user',
      'reset_company_user_password',
      
      // Dashboard
      'access_company_dashboard',
      'view_company_analytics',
      
      // AI & Features
      'full_ai_access',
      
      // Data Access (Company Only)
      'view_company_orders',
      'create_order',
      'edit_company_order',
      'delete_company_order',
      'view_company_patients',
      'create_patient',
      'edit_company_patient',
      'view_company_inventory',
      'manage_company_inventory',
      'view_company_reports',
      
      // Prescriptions & Exams
      'view_company_prescriptions',
      'create_prescription',
      'view_company_examinations',
      'create_examination'
    ],
    isolation: 'company' // Can only access their own company
  },

  // ==========================================
  // ECP (Eye Care Professional - Subscribed User)
  // ==========================================
  ecp: {
    level: 'company',
    displayName: 'Eye Care Professional',
    description: 'Standard subscribed user with operational access',
    permissions: [
      // View only their company
      'view_own_company',
      
      // Limited User Management
      'view_company_users',
      
      // Dashboard
      'access_company_dashboard',
      'view_company_analytics',
      
      // AI Access (based on subscription)
      'basic_ai_access',
      
      // Data Access
      'view_company_orders',
      'create_order',
      'edit_own_order',
      'view_company_patients',
      'create_patient',
      'edit_patient',
      'view_company_inventory',
      'view_company_reports',
      
      // Prescriptions & Exams
      'view_company_prescriptions',
      'create_prescription',
      'view_company_examinations',
      'create_examination'
    ],
    isolation: 'company'
  },

  // ==========================================
  // LAB TECH
  // ==========================================
  lab_tech: {
    level: 'company',
    displayName: 'Laboratory Technician',
    description: 'Lab operations and production',
    permissions: [
      'view_own_company',
      'view_company_users',
      'access_company_dashboard',
      
      // Orders
      'view_company_orders',
      'update_order_status',
      
      // Production
      'view_company_inventory',
      'update_inventory',
      'view_production_queue',
      'update_production_status',
      
      // Quality
      'report_quality_issues',
      'view_quality_reports'
    ],
    isolation: 'company'
  },

  // ==========================================
  // ENGINEER
  // ==========================================
  engineer: {
    level: 'company',
    displayName: 'Engineer',
    description: 'Technical and equipment management',
    permissions: [
      'view_own_company',
      'view_company_users',
      'access_company_dashboard',
      
      // Equipment
      'view_equipment',
      'manage_equipment',
      'view_maintenance_logs',
      
      // Orders (view only)
      'view_company_orders',
      
      // Inventory
      'view_company_inventory',
      'update_inventory',
      
      // Reports
      'view_technical_reports'
    ],
    isolation: 'company'
  },

  // ==========================================
  // SUPPLIER
  // ==========================================
  supplier: {
    level: 'company',
    displayName: 'Supplier',
    description: 'Supplier portal access',
    permissions: [
      'view_own_company',
      
      // Limited order view
      'view_supplier_orders',
      
      // Inventory
      'view_company_inventory',
      
      // Catalog
      'manage_supplier_catalog',
      'view_supplier_reports'
    ],
    isolation: 'company'
  },

  // ==========================================
  // ADMIN (Legacy - mapped to company_admin)
  // ==========================================
  admin: {
    level: 'company',
    displayName: 'Administrator (Legacy)',
    description: 'Legacy admin role - same as company_admin',
    permissions: [
      // Same as company_admin
      'view_own_company',
      'edit_own_company',
      'manage_company_settings',
      'view_company_billing',
      'view_company_users',
      'create_company_user',
      'edit_company_user',
      'delete_company_user',
      'access_company_dashboard',
      'view_company_analytics',
      'full_ai_access',
      'view_company_orders',
      'create_order',
      'edit_company_order',
      'view_company_patients',
      'create_patient',
      'edit_company_patient',
      'view_company_inventory',
      'manage_company_inventory',
      'view_company_reports'
    ],
    isolation: 'company'
  }
} as const;

/**
 * Check if a user has a specific permission
 */
export function hasPermission(userRole: UserRole, permission: string): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  if (!rolePermissions) return false;
  return (rolePermissions.permissions as readonly string[]).includes(permission);
}

/**
 * Check if user can access another company's data
 */
export function canAccessCompany(
  userRole: UserRole,
  userCompanyId: string,
  targetCompanyId: string
): boolean {
  // Platform admin can access any company
  if (userRole === ROLES.PLATFORM_ADMIN) {
    return true;
  }
  
  // All other roles can only access their own company
  const roleConfig = ROLE_PERMISSIONS[userRole];
  if (roleConfig?.isolation === 'company') {
    return userCompanyId === targetCompanyId;
  }
  
  return false;
}

/**
 * Check if user can view other users
 */
export function canViewUsers(
  userRole: UserRole,
  userCompanyId: string,
  targetUserCompanyId?: string
): boolean {
  // Platform admin can view all users
  if (userRole === ROLES.PLATFORM_ADMIN) {
    return hasPermission(userRole, 'view_all_users');
  }
  
  // Company admin and others can view users in their company
  if (hasPermission(userRole, 'view_company_users')) {
    return !targetUserCompanyId || userCompanyId === targetUserCompanyId;
  }
  
  return false;
}

/**
 * Check if user can manage (create/edit/delete) users
 */
export function canManageUsers(
  userRole: UserRole,
  userCompanyId: string,
  targetUserCompanyId?: string
): boolean {
  // Platform admin can manage any user
  if (userRole === ROLES.PLATFORM_ADMIN) {
    return true;
  }
  
  // Company admin can manage users in their company
  if (userRole === ROLES.COMPANY_ADMIN || userRole === ROLES.ADMIN) {
    if (hasPermission(userRole, 'create_company_user')) {
      return !targetUserCompanyId || userCompanyId === targetUserCompanyId;
    }
  }
  
  return false;
}

/**
 * Get allowed roles for user creation
 */
export function getAllowedRolesForCreation(userRole: UserRole): UserRole[] {
  if (userRole === ROLES.PLATFORM_ADMIN) {
    // Platform admin can create any role
    return Object.values(ROLES);
  }
  
  if (userRole === ROLES.COMPANY_ADMIN || userRole === ROLES.ADMIN) {
    // Company admin can create company-level roles only
    return [
      ROLES.ECP,
      ROLES.LAB_TECH,
      ROLES.ENGINEER,
      ROLES.SUPPLIER,
      ROLES.COMPANY_ADMIN
    ];
  }
  
  return [];
}

/**
 * Check if user is platform admin
 */
export function isPlatformAdmin(userRole: UserRole): boolean {
  return userRole === ROLES.PLATFORM_ADMIN;
}

/**
 * Check if user is company admin
 */
export function isCompanyAdmin(userRole: UserRole): boolean {
  return userRole === ROLES.COMPANY_ADMIN || userRole === ROLES.ADMIN;
}

/**
 * Get role display information
 */
export function getRoleInfo(userRole: UserRole) {
  return ROLE_PERMISSIONS[userRole] || null;
}

/**
 * Validate if a role transition is allowed
 */
export function canChangeRole(
  currentUserRole: UserRole,
  targetUserRole: UserRole,
  newRole: UserRole
): boolean {
  // Platform admin can change any role
  if (currentUserRole === ROLES.PLATFORM_ADMIN) {
    return true;
  }
  
  // Company admin can change roles within their company (but not to platform_admin)
  if (isCompanyAdmin(currentUserRole)) {
    if (newRole === ROLES.PLATFORM_ADMIN) {
      return false;
    }
    // Cannot demote another company admin unless you're platform admin
    if (isCompanyAdmin(targetUserRole) && targetUserRole !== currentUserRole) {
      return false;
    }
    return true;
  }
  
  return false;
}
