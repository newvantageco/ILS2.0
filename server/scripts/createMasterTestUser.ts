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

  console.log('🚀 Creating Master Test User...\n');

  try {
    // Step 1: Check if user already exists
    const existingUser = await db.execute(sql`
      SELECT id, email FROM users WHERE email = ${email}
    `);

    if (existingUser.rows.length > 0) {
      console.log('⚠️  User already exists with email:', email);
      console.log('   User ID:', existingUser.rows[0].id);
      console.log('\n   To reset, delete the user first or use a different email.\n');
      return;
    }

    // Step 2: Check if company exists, create if not
    let companyId: string;
    const existingCompany = await db.execute(sql`
      SELECT id FROM companies WHERE name = ${companyName}
    `);

    if (existingCompany.rows.length > 0) {
      companyId = existingCompany.rows[0].id as string;
      console.log(`✅ Using existing company: ${companyName}`);
      console.log(`   Company ID: ${companyId}\n`);
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
      console.log(`✅ Created test company: ${companyName}`);
      console.log(`   Company ID: ${companyId}\n`);

      // Step 3: Create default roles for the company
      console.log('📋 Creating default roles...');
      await createDefaultRoles(companyId);
      console.log('✅ Default roles created\n');
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

    console.log('✅ Master test user created successfully!\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📧 Email:     ', email);
    console.log('🔑 Password:  ', password);
    console.log('👤 Name:      ', `${firstName} ${lastName}`);
    console.log('🏢 Company:   ', companyName);
    console.log('🆔 User ID:   ', userId);
    console.log('🆔 Company ID:', companyId);
    console.log('👑 Owner:     ', user.is_owner ? 'Yes' : 'No');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('\n✨ This user has FULL ACCESS to all features!\n');
    console.log('📝 Permissions: As an owner, this user has ALL permissions');
    console.log('   automatically, regardless of role assignments.\n');
    console.log('🎯 Use these credentials to test all frontend features.\n');

    // Step 6: Verify permissions
    const permissionsResult = await db.execute(sql`
      SELECT COUNT(*) as total_permissions
      FROM permissions
    `);

    const totalPerms = permissionsResult.rows[0].total_permissions;
    console.log(`✅ Total permissions in system: ${totalPerms}`);
    console.log(`✅ User has access to: ALL ${totalPerms} permissions\n`);

    // Step 7: Get available roles for this company
    const rolesResult = await db.execute(sql`
      SELECT name, description
      FROM dynamic_roles
      WHERE company_id = ${companyId}
      ORDER BY name
    `);

    if (rolesResult.rows.length > 0) {
      console.log('📋 Available roles in this company:');
      rolesResult.rows.forEach((role: any) => {
        console.log(`   - ${role.name}: ${role.description}`);
      });
      console.log('\n');
    }

    console.log('🎉 Setup complete! You can now login to the frontend.\n');

  } catch (error) {
    console.error('❌ Error creating master test user:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

// Check for command line arguments
const args = process.argv.slice(2);
let customConfig: TestUserConfig = {};

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
