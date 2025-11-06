/**
 * Default Roles Creation Service
 * 
 * Creates company-specific default roles based on templates
 * Called when a new company signs up
 */

import { db } from '../db';
import { sql } from 'drizzle-orm';

/**
 * Role templates define which permissions each default role gets
 */
interface RoleTemplate {
  name: string;
  description: string;
  isDeletable: boolean;
  permissionSlugs: string[]; // List of permission slugs this role should have
}

/**
 * Master template for all default roles
 * These are created for every new company
 */
const DEFAULT_ROLE_TEMPLATES: RoleTemplate[] = [
  {
    name: 'Admin',
    description: 'Full administrative access to company settings and all features',
    isDeletable: false, // Protected role - cannot be deleted
    permissionSlugs: [
      // Company Management
      'company:view',
      'company:edit',
      'company:manage_billing',
      'company:manage_integrations',
      
      // User Management
      'users:view',
      'users:create',
      'users:edit',
      'users:delete',
      'users:manage_roles',
      'users:reset_password',
      
      // Patients
      'patients:view',
      'patients:create',
      'patients:edit',
      'patients:delete',
      'patients:export',
      
      // Orders
      'orders:view',
      'orders:create',
      'orders:edit',
      'orders:delete',
      'orders:view_all',
      
      // Prescriptions
      'prescriptions:view',
      'prescriptions:create',
      'prescriptions:edit',
      'prescriptions:delete',
      
      // Examinations
      'examinations:view',
      'examinations:create',
      'examinations:edit',
      'examinations:delete',
      
      // Inventory
      'inventory:view',
      'inventory:manage',
      'inventory:transfer',
      'inventory:adjust',
      
      // Suppliers
      'suppliers:view',
      'suppliers:manage',
      'purchasing:view',
      'purchasing:create',
      'purchasing:approve',
      
      // Reports
      'reports:view',
      'analytics:view',
      'analytics:export',
      'reports:custom',
      
      // AI
      'ai:basic',
      'ai:full',
      'ai:insights',
      'ai:predictive',
      
      // Integrations
      'integrations:shopify',
      'integrations:api',
      
      // POS
      'pos:access',
      'pos:refunds',
      'pos:reports'
    ]
  },
  {
    name: 'Eye Care Professional (ECP)',
    description: 'Standard eye care professional with patient and order management',
    isDeletable: true,
    permissionSlugs: [
      'company:view',
      
      // User - view only
      'users:view',
      
      // Patients
      'patients:view',
      'patients:create',
      'patients:edit',
      'patients:export',
      
      // Orders
      'orders:view',
      'orders:create',
      'orders:edit',
      'orders:view_all',
      
      // Prescriptions
      'prescriptions:view',
      'prescriptions:create',
      'prescriptions:edit',
      'prescriptions:sign',
      
      // Examinations
      'examinations:view',
      'examinations:create',
      'examinations:edit',
      
      // Inventory - view only
      'inventory:view',
      
      // Reports
      'reports:view',
      
      // AI
      'ai:basic',
      'ai:full',
      
      // POS
      'pos:access',
      'pos:reports'
    ]
  },
  {
    name: 'Lab Technician',
    description: 'Lab production, quality control, and order processing',
    isDeletable: true,
    permissionSlugs: [
      'company:view',
      'users:view',
      
      // Orders - view and update status
      'orders:view',
      'orders:update_status',
      'orders:view_all',
      
      // Lab Production
      'lab:view_queue',
      'lab:manage_production',
      'lab:quality_control',
      'lab:shipping',
      
      // Inventory
      'inventory:view',
      'inventory:adjust',
      
      // Reports
      'reports:view',
      
      // AI
      'ai:basic'
    ]
  },
  {
    name: 'Engineer',
    description: 'Equipment management, maintenance, and technical operations',
    isDeletable: true,
    permissionSlugs: [
      'company:view',
      'users:view',
      
      // Orders - view only
      'orders:view',
      'orders:view_all',
      
      // Equipment
      'equipment:view',
      'equipment:manage',
      'equipment:maintenance',
      
      // Inventory
      'inventory:view',
      'inventory:adjust',
      
      // Reports
      'reports:view',
      
      // AI
      'ai:basic'
    ]
  },
  {
    name: 'Supplier',
    description: 'Supplier portal with limited access to orders and catalog',
    isDeletable: true,
    permissionSlugs: [
      'company:view',
      
      // Orders - limited view
      'orders:view',
      
      // Suppliers
      'suppliers:view',
      
      // Inventory - view only
      'inventory:view',
      
      // Reports - limited
      'reports:view'
    ]
  },
  {
    name: 'Optometrist',
    description: 'Clinical optometrist with prescription and examination focus',
    isDeletable: true,
    permissionSlugs: [
      'company:view',
      'users:view',
      
      // Patients
      'patients:view',
      'patients:create',
      'patients:edit',
      
      // Prescriptions - full access
      'prescriptions:view',
      'prescriptions:create',
      'prescriptions:edit',
      'prescriptions:sign',
      
      // Examinations - full access
      'examinations:view',
      'examinations:create',
      'examinations:edit',
      
      // Orders - view only
      'orders:view',
      
      // Reports
      'reports:view',
      
      // AI
      'ai:basic',
      'ai:full'
    ]
  },
  {
    name: 'Dispenser',
    description: 'Optical dispenser with frame selection and order creation',
    isDeletable: true,
    permissionSlugs: [
      'company:view',
      'users:view',
      
      // Patients - view and edit
      'patients:view',
      'patients:edit',
      
      // Orders
      'orders:view',
      'orders:create',
      'orders:edit',
      
      // Prescriptions - view only
      'prescriptions:view',
      
      // Inventory
      'inventory:view',
      
      // POS
      'pos:access',
      'pos:reports',
      
      // AI
      'ai:basic'
    ]
  },
  {
    name: 'Retail Assistant',
    description: 'Front desk and point of sale operations',
    isDeletable: true,
    permissionSlugs: [
      'company:view',
      
      // Patients - basic
      'patients:view',
      'patients:create',
      
      // Orders - view
      'orders:view',
      
      // Inventory - view
      'inventory:view',
      
      // POS
      'pos:access',
      
      // AI
      'ai:basic'
    ]
  }
];

/**
 * Create default roles for a new company
 */
export async function createDefaultRoles(companyId: string): Promise<void> {
  console.log(`🏭 Creating default roles for company: ${companyId}`);

  try {
    for (const template of DEFAULT_ROLE_TEMPLATES) {
      // Step 1: Create the role
      const roleResult = await db.execute(sql`
        INSERT INTO dynamic_roles (
          company_id,
          name,
          description,
          is_system_default,
          is_deletable
        )
        VALUES (
          ${companyId},
          ${template.name},
          ${template.description},
          true,
          ${template.isDeletable}
        )
        ON CONFLICT (company_id, name) DO UPDATE
        SET description = EXCLUDED.description,
            is_deletable = EXCLUDED.is_deletable
        RETURNING id
      `);

      const roleId = roleResult.rows[0].id as string;

      // Step 2: Get permission IDs for this role's slugs
      const permissionIds: string[] = [];
      
      for (const slug of template.permissionSlugs) {
        const permResult = await db.execute(sql`
          SELECT id FROM permissions WHERE permission_key = ${slug}
        `);
        
        if (permResult.rows.length > 0) {
          permissionIds.push(permResult.rows[0].id as string);
        } else {
          console.warn(`⚠️  Permission not found: ${slug} for role ${template.name}`);
        }
      }

      // Step 3: Assign all permissions to the role
      for (const permissionId of permissionIds) {
        await db.execute(sql`
          INSERT INTO dynamic_role_permissions (role_id, permission_id)
          VALUES (${roleId}, ${permissionId})
          ON CONFLICT (role_id, permission_id) DO NOTHING
        `);
      }

      console.log(`✅ Created role: ${template.name} with ${permissionIds.length} permissions`);
    }

    console.log(`🎉 Successfully created ${DEFAULT_ROLE_TEMPLATES.length} default roles\n`);

  } catch (error) {
    console.error('❌ Failed to create default roles:', error);
    throw error;
  }
}

/**
 * Clone a role (for when users want to customize)
 */
export async function cloneRole(
  sourceRoleId: string,
  newName: string,
  companyId: string,
  createdByUserId?: string
): Promise<string> {
  try {
    // Get source role details
    const sourceRole = await db.execute(sql`
      SELECT * FROM dynamic_roles WHERE id = ${sourceRoleId}
    `);

    if (sourceRole.rows.length === 0) {
      throw new Error('Source role not found');
    }

    const source = sourceRole.rows[0];

    // Create new role
    const newRoleResult = await db.execute(sql`
      INSERT INTO dynamic_roles (
        company_id,
        name,
        description,
        is_system_default,
        is_deletable
      )
      VALUES (
        ${companyId},
        ${newName},
        ${source.description},
        false,
        true
      )
      RETURNING id
    `);

    const newRoleId = newRoleResult.rows[0].id as string;

    // Copy all permissions from source role
    await db.execute(sql`
      INSERT INTO dynamic_role_permissions (role_id, permission_id)
      SELECT ${newRoleId}, permission_id
      FROM dynamic_role_permissions
      WHERE role_id = ${sourceRoleId}
    `);

    // Audit log
    await db.execute(sql`
      INSERT INTO role_change_audit (
        company_id,
        changed_by,
        action_type,
        role_id,
        details
      )
      VALUES (
        ${companyId},
        ${createdByUserId},
        'role_created',
        ${newRoleId},
        ${JSON.stringify({ clonedFrom: sourceRoleId, sourceName: source.name })}
      )
    `);

    console.log(`✅ Cloned role: ${source.name} -> ${newName}`);
    return newRoleId;

  } catch (error) {
    console.error('❌ Failed to clone role:', error);
    throw error;
  }
}

/**
 * Get role templates (for documentation/UI)
 */
export function getRoleTemplates() {
  return DEFAULT_ROLE_TEMPLATES;
}

/**
 * Helper: Assign default "Admin" role to company owner on signup
 */
export async function assignDefaultAdminRole(userId: string, companyId: string): Promise<void> {
  try {
    // Get the Admin role for this company
    const adminRole = await db.execute(sql`
      SELECT id FROM dynamic_roles
      WHERE company_id = ${companyId}
      AND name = 'Admin'
      LIMIT 1
    `);

    if (adminRole.rows.length === 0) {
      throw new Error('Admin role not found for company. Run createDefaultRoles first.');
    }

    const roleId = adminRole.rows[0].id as string;

    // Assign role to user
    await db.execute(sql`
      INSERT INTO user_dynamic_roles (user_id, role_id, is_primary, assigned_by)
      VALUES (${userId}, ${roleId}, true, ${userId})
      ON CONFLICT (user_id, role_id) DO UPDATE
      SET is_primary = true
    `);

    // Mark user as owner
    await db.execute(sql`
      UPDATE users
      SET is_owner = true
      WHERE id = ${userId}
    `);

    console.log(`✅ Assigned Admin role to user ${userId} and marked as owner`);

  } catch (error) {
    console.error('❌ Failed to assign admin role:', error);
    throw error;
  }
}

/**
 * Export for use in company registration
 */
export {
  DEFAULT_ROLE_TEMPLATES,
  RoleTemplate
};
