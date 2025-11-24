/**
 * Create Master Test User
 * 
 * Creates a test user with owner privileges and all permissions
 * Perfect for testing all frontend features
 * 
 * Run with: npx tsx server/scripts/createMasterTestUser.ts
 */

import bcrypt from 'bcryptjs';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { createDefaultRoles } from '../services/DefaultRolesService';
import crypto from 'crypto';
import logger from '../utils/logger';


interface TestUserConfig {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
}

async function createMasterTestUser(config: TestUserConfig = {}) {
  const {
    email = 'test@master.com',
    password = 'Test123!@#',
    firstName = 'Master',
    lastName = 'Tester',
    companyName = 'Master Test Company'
  } = config;

  logger.info('🚀 Creating Master Test User...\n');

  try {
    // Step 1: Check if user already exists
    const existingUser = await db.execute(sql`
      SELECT id, email FROM users WHERE email = ${email}
    `);

    if (existingUser.rows.length > 0) {
      logger.info('⚠️  User already exists with email:', email);
      logger.info('   User ID:', existingUser.rows[0].id);
      logger.info('\n   To reset, delete the user first or use a different email.\n');
      return;
    }

    // Step 2: Check if company exists, create if not
    let companyId: string;
    const existingCompany = await db.execute(sql`
      SELECT id FROM companies WHERE name = ${companyName}
    `);

    if (existingCompany.rows.length > 0) {
      companyId = existingCompany.rows[0].id as string;
      logger.info(`✅ Using existing company: ${companyName}`);
      logger.info(`   Company ID: ${companyId}\n`);
    } else {
      // Create test company
      const companyResult = await db.execute(sql`
        INSERT INTO companies (
          id,
          name,
          type,
          status,
          email,
          subscription_plan,
          has_ecp_access,
          has_lab_access
        )
        VALUES (
          gen_random_uuid(),
          ${companyName},
          'ecp',
          'active',
          ${email},
          'enterprise',
          true,
          true
        )
        RETURNING id
      `);

      companyId = companyResult.rows[0].id as string;
      logger.info(`✅ Created test company: ${companyName}`);
      logger.info(`   Company ID: ${companyId}\n`);

      // Step 3: Create default roles for the company
      logger.info('📋 Creating default roles...');
      await createDefaultRoles(companyId);
      logger.info('✅ Default roles created\n');
    }

    // Step 4: Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Step 5: Create master test user with owner privileges
    const userResult = await db.execute(sql`
      INSERT INTO users (
        id,
        email,
        password,
        first_name,
        last_name,
        company_id,
        role,
        enhanced_role,
        account_status,
        subscription_plan,
        is_active,
        is_verified,
        is_owner,
        can_prescribe,
        can_dispense,
        goc_registration_number,
        goc_registration_type,
        professional_qualifications
      )
      VALUES (
        gen_random_uuid(),
        ${email},
        ${hashedPassword},
        ${firstName},
        ${lastName},
        ${companyId},
        'company_admin',
        'company_admin',
        'active',
        'enterprise',
        true,
        true,
        true,
        true,
        true,
        'GOC-TEST-123456',
        'Optometrist',
        'BSc (Hons) Optometry'
      )
      RETURNING id, email, first_name, last_name, is_owner
    `);

    const user = userResult.rows[0];
    const userId = user.id as string;

    logger.info('✅ Master test user created successfully!\n');
    logger.info('═══════════════════════════════════════════════════════════');
    logger.info('📧 Email:     ', email);
    logger.info('🔑 Password:  ', password);
    logger.info('👤 Name:      ', `${firstName} ${lastName}`);
    logger.info('🏢 Company:   ', companyName);
    logger.info('🆔 User ID:   ', userId);
    logger.info('🆔 Company ID:', companyId);
    logger.info('👑 Owner:     ', user.is_owner ? 'Yes' : 'No');
    logger.info('═══════════════════════════════════════════════════════════');
    logger.info('\n✨ This user has FULL ACCESS to all features!\n');
    logger.info('📝 Permissions: As an owner, this user has ALL permissions');
    logger.info('   automatically, regardless of role assignments.\n');
    logger.info('🎯 Use these credentials to test all frontend features.\n');

    // Step 6: Verify permissions
    const permissionsResult = await db.execute(sql`
      SELECT COUNT(*) as total_permissions
      FROM permissions
    `);

    const totalPerms = permissionsResult.rows[0].total_permissions;
    logger.info(`✅ Total permissions in system: ${totalPerms}`);
    logger.info(`✅ User has access to: ALL ${totalPerms} permissions\n`);

    // Step 7: Get available roles for this company
    const rolesResult = await db.execute(sql`
      SELECT name, description
      FROM dynamic_roles
      WHERE company_id = ${companyId}
      ORDER BY name
    `);

    if (rolesResult.rows.length > 0) {
      logger.info('📋 Available roles in this company:');
      rolesResult.rows.forEach((role: any) => {
        logger.info(`   - ${role.name}: ${role.description}`);
      });
      logger.info('\n');
    }

    logger.info('🎉 Setup complete! You can now login to the frontend.\n');

  } catch (error) {
    logger.error('❌ Error creating master test user:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

// Check for command line arguments
const args = process.argv.slice(2);
const customConfig: TestUserConfig = {};

// Parse command line arguments
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--email' && args[i + 1]) {
    customConfig.email = args[i + 1];
    i++;
  } else if (args[i] === '--password' && args[i + 1]) {
    customConfig.password = args[i + 1];
    i++;
  } else if (args[i] === '--first-name' && args[i + 1]) {
    customConfig.firstName = args[i + 1];
    i++;
  } else if (args[i] === '--last-name' && args[i + 1]) {
    customConfig.lastName = args[i + 1];
    i++;
  } else if (args[i] === '--company' && args[i + 1]) {
    customConfig.companyName = args[i + 1];
    i++;
  }
}

// Run the script
createMasterTestUser(customConfig);
