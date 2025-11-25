/**
 * Migration Script: Add ECP Role to Company Admins
 *
 * This script adds the 'ecp' role to all existing company_admin users
 * to enable role switching between company_admin and ecp.
 *
 * Usage: npx tsx server/scripts/add-ecp-role-to-company-admins.ts
 */

import { db } from '../db';
import { users, userRoles } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { createLogger } from '../utils/logger';

const logger = createLogger('add-ecp-role-migration');

async function addEcpRoleToCompanyAdmins() {
  try {
    logger.info('Starting migration: Add ECP role to company admins');

    // Find all company_admin users
    const companyAdmins = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.role, 'company_admin'));

    logger.info({ count: companyAdmins.length }, 'Found company admin users');

    let updatedCount = 0;
    let skippedCount = 0;

    for (const admin of companyAdmins) {
      // Check if they already have both roles
      const existingRoles = await db
        .select()
        .from(userRoles)
        .where(eq(userRoles.userId, admin.id));

      const roleNames = new Set(existingRoles.map(r => r.role));
      const hasCompanyAdmin = roleNames.has('company_admin');
      const hasEcp = roleNames.has('ecp');

      const rolesToAdd = [];
      if (!hasCompanyAdmin) {
        rolesToAdd.push({ userId: admin.id, role: 'company_admin' as const });
      }
      if (!hasEcp) {
        rolesToAdd.push({ userId: admin.id, role: 'ecp' as const });
      }

      if (rolesToAdd.length > 0) {
        await db.insert(userRoles).values(rolesToAdd);
        logger.info(
          {
            userId: admin.id,
            email: admin.email,
            addedRoles: rolesToAdd.map(r => r.role)
          },
          'Added roles for company admin'
        );
        updatedCount++;
      } else {
        logger.debug({ userId: admin.id, email: admin.email }, 'User already has all roles');
        skippedCount++;
      }
    }

    logger.info(
      {
        total: companyAdmins.length,
        updated: updatedCount,
        skipped: skippedCount
      },
      'Migration completed successfully'
    );

    return {
      success: true,
      total: companyAdmins.length,
      updated: updatedCount,
      skipped: skippedCount,
    };
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Migration failed');
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  addEcpRoleToCompanyAdmins()
    .then((result) => {
      console.log('✅ Migration completed:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

export { addEcpRoleToCompanyAdmins };
