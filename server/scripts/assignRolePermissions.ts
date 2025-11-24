/**
 * Assign Permissions to Default Roles
 * This fixes the issue where roles were created before permissions were seeded
 */

import { db } from '../db';
import { sql } from 'drizzle-orm';
import logger from '../utils/logger';


const COMPANY_ID = 'e635e4d5-0a44-4acf-a798-5ca3a450f601';

// Define which permissions each role should have
const ROLE_PERMISSIONS: Record<string, string[]> = {
  'Admin': [
    'company:view', 'company:edit', 'users:view', 'users:create', 'users:edit', 'users:delete',
    'users:manage_roles', 'patients:view', 'patients:create', 'patients:edit', 'patients:delete',
    'orders:view', 'orders:create', 'orders:edit', 'orders:delete', 'orders:view_all',
    'prescriptions:view', 'prescriptions:create', 'prescriptions:edit', 'prescriptions:sign',
    'inventory:view', 'inventory:adjust', 'inventory:order', 'lab:view_orders', 'lab:manage',
    'reports:view', 'reports:generate', 'ai:basic', 'ai:full'
  ],
  'Eye Care Professional (ECP)': [
    'company:view', 'users:view', 'patients:view', 'patients:create', 'patients:edit',
    'orders:view', 'orders:create', 'orders:edit', 'prescriptions:view', 'prescriptions:create',
    'prescriptions:edit', 'inventory:view', 'reports:view', 'ai:basic'
  ],
  'Optometrist': [
    'company:view', 'users:view', 'patients:view', 'patients:create', 'patients:edit',
    'prescriptions:view', 'prescriptions:create', 'prescriptions:edit', 'prescriptions:sign',
    'examinations:view', 'examinations:create', 'examinations:edit', 'orders:view', 'reports:view',
    'ai:basic', 'ai:full'
  ],
  'Dispenser': [
    'patients:view', 'patients:create', 'patients:edit', 'pos:access', 'pos:invoices:create',
    'pos:invoices:read', 'pos:invoices:update', 'pos:products:read', 'examinations:view',
    'prescriptions:view', 'orders:view', 'orders:create', 'pos:reports:read', 'company:view',
    'users:view'
  ],
  'Retail Assistant': [
    'company:view', 'patients:view', 'patients:create', 'orders:view', 'inventory:view',
    'pos:access', 'ai:basic'
  ],
  'Lab Technician': [
    'company:view', 'users:view', 'orders:view', 'orders:view_all', 'equipment:view',
    'inventory:view', 'inventory:adjust', 'reports:view', 'ai:basic'
  ],
  'Engineer': [
    'company:view', 'users:view', 'orders:view', 'orders:view_all', 'equipment:view',
    'equipment:manage', 'equipment:maintenance', 'inventory:view', 'inventory:adjust',
    'reports:view', 'ai:basic'
  ],
  'Supplier': [
    'company:view', 'orders:view', 'suppliers:view', 'inventory:view', 'reports:view'
  ]
};

async function assignRolePermissions() {
  logger.info('🔐 Assigning permissions to default roles...\n');

  for (const [roleName, permissionSlugs] of Object.entries(ROLE_PERMISSIONS)) {
    try {
      logger.info(`📋 Processing role: ${roleName}`);

      // Get role ID
      const roleResult = await db.execute(sql`
        SELECT id FROM dynamic_roles
        WHERE company_id = ${COMPANY_ID}
        AND name = ${roleName}
        LIMIT 1
      `);

      if (roleResult.rows.length === 0) {
        logger.info(`   ⚠️  Role not found, skipping...\n`);
        continue;
      }

      const roleId = roleResult.rows[0].id as string;
      let assigned = 0;
      let notFound = 0;

      // Assign each permission
      for (const slug of permissionSlugs) {
        // Get permission ID
        const permResult = await db.execute(sql`
          SELECT id FROM permissions WHERE permission_key = ${slug}
        `);

        if (permResult.rows.length === 0) {
          notFound++;
          continue;
        }

        const permissionId = permResult.rows[0].id as string;

        // Assign permission to role
        await db.execute(sql`
          INSERT INTO dynamic_role_permissions (role_id, permission_id)
          VALUES (${roleId}, ${permissionId})
          ON CONFLICT (role_id, permission_id) DO NOTHING
        `);

        assigned++;
      }

      logger.info(`   ✅ Assigned ${assigned} permissions`);
      if (notFound > 0) {
        logger.info(`   ⚠️  ${notFound} permissions not found in database`);
      }
      logger.info('');

    } catch (error: any) {
      logger.error(`   ❌ Error assigning permissions:`, error.message);
      logger.info('');
    }
  }

  // Verify the results
  logger.info('═══════════════════════════════════════════════════════════');
  logger.info('📊 Permission Assignment Summary');
  logger.info('═══════════════════════════════════════════════════════════\n');

  const summaryResult = await db.execute(sql`
    SELECT 
      dr.name as role,
      COUNT(drp.id) as permission_count
    FROM dynamic_roles dr
    LEFT JOIN dynamic_role_permissions drp ON dr.id = drp.role_id
    WHERE dr.company_id = ${COMPANY_ID}
    GROUP BY dr.name
    ORDER BY dr.name
  `);

  summaryResult.rows.forEach((row: any) => {
    logger.info(`   • ${row.role}: ${row.permission_count} permissions`);
  });

  logger.info('\n✅ Permission assignment complete!\n');
  process.exit(0);
}

assignRolePermissions().catch(error => {
  logger.error('❌ Failed to assign permissions:', error);
  process.exit(1);
});
