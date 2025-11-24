/**
 * Create Test Users with Different Roles
 * For testing the dynamic RBAC system
 * 
 * Run with: npx tsx server/scripts/createTestUsers.ts
 */

import bcrypt from 'bcryptjs';
import { db } from '../db';
import { sql } from 'drizzle-orm';

const TEST_PASSWORD = 'Test123!@#';
const COMPANY_ID = 'e635e4d5-0a44-4acf-a798-5ca3a450f601'; // Master Test Company

interface TestUser {
  email: string;
  firstName: string;
  lastName: string;
  roleName: string; // Name of the dynamic role to assign
}

const TEST_USERS: TestUser[] = [
  {
    email: 'admin@test.com',
    firstName: 'Admin',
    lastName: 'User',
    roleName: 'Admin'
  },
  {
    email: 'ecp@test.com',
    firstName: 'ECP',
    lastName: 'User',
    roleName: 'Eye Care Professional (ECP)'
  },
  {
    email: 'optometrist@test.com',
    firstName: 'Optometrist',
    lastName: 'User',
    roleName: 'Optometrist'
  },
  {
    email: 'dispenser@test.com',
    firstName: 'Dispenser',
    lastName: 'User',
    roleName: 'Dispenser'
  },
  {
    email: 'receptionist@test.com',
    firstName: 'Receptionist',
    lastName: 'User',
    roleName: 'Retail Assistant'
  },
  {
    email: 'lab@test.com',
    firstName: 'Lab',
    lastName: 'Technician',
    roleName: 'Lab Technician'
  }
];

async function createTestUsers() {
  console.log('🚀 Creating test users with different roles...\n');

  const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);

  for (const testUser of TEST_USERS) {
    try {
      console.log(`📝 Creating user: ${testUser.email} (${testUser.roleName})`);

      // Step 1: Get the role ID
      const roleResult = await db.execute(sql`
        SELECT id FROM dynamic_roles
        WHERE company_id = ${COMPANY_ID}
        AND name = ${testUser.roleName}
        LIMIT 1
      `);

      if (roleResult.rows.length === 0) {
        console.log(`   ⚠️  Role "${testUser.roleName}" not found, skipping...`);
        continue;
      }

      const roleId = roleResult.rows[0].id as string;

      // Step 2: Create or update user (using old role enum for now)
      const userResult = await db.execute(sql`
        INSERT INTO users (
          email,
          password,
          first_name,
          last_name,
          company_id,
          role,
          account_status,
          subscription_plan,
          is_active,
          is_verified,
          can_prescribe,
          can_dispense
        )
        VALUES (
          ${testUser.email},
          ${hashedPassword},
          ${testUser.firstName},
          ${testUser.lastName},
          ${COMPANY_ID},
          'ecp',
          'active',
          'enterprise',
          true,
          true,
          true,
          true
        )
        ON CONFLICT (email) DO UPDATE
        SET password = EXCLUDED.password,
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            updated_at = NOW()
        RETURNING id
      `);

      const userId = userResult.rows[0].id as string;

      // Step 3: Assign the dynamic role
      await db.execute(sql`
        INSERT INTO user_dynamic_roles (user_id, role_id, is_primary)
        VALUES (${userId}, ${roleId}, true)
        ON CONFLICT (user_id, role_id) DO UPDATE
        SET is_primary = true
      `);

      console.log(`   ✅ Created user: ${testUser.email}`);
      console.log(`      User ID: ${userId}`);
      console.log(`      Role ID: ${roleId}\n`);

    } catch (error: any) {
      console.error(`   ❌ Error creating user ${testUser.email}:`, error.message);
      console.error(`      Details:`, error.detail || error.cause?.message || 'Unknown error');
      console.log('');
    }
  }

  // Show summary
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 Test Users Summary');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log('🔑 All users have password: Test123!@#');
  console.log('');
  console.log('Test Users Created:');
  TEST_USERS.forEach(user => {
    console.log(`   • ${user.email} - ${user.roleName}`);
  });
  console.log('');
  console.log('Master User (Owner):');
  console.log('   • test@master.com - Full Access (Owner)');
  console.log('');
  console.log('🎯 Login at: http://localhost:5173');
  console.log('═══════════════════════════════════════════════════════════\n');

  process.exit(0);
}

createTestUsers().catch(error => {
  console.error('❌ Failed to create test users:', error);
  process.exit(1);
});
