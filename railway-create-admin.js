#!/usr/bin/env node
/**
 * Create Platform Admin - Runs on Railway
 *
 * Usage: 
 *   ADMIN_EMAIL=admin@company.com ADMIN_PASSWORD='SecurePass123!' node railway-create-admin.js
 *
 * SECURITY: Never hardcode credentials. Always use environment variables.
 */

import pkg from 'pg';
const { Client } = pkg;
import bcrypt from 'bcryptjs';

const DATABASE_URL = process.env.DATABASE_URL;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_FIRST_NAME = process.env.ADMIN_FIRST_NAME || 'Platform';
const ADMIN_LAST_NAME = process.env.ADMIN_LAST_NAME || 'Admin';

if (!DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL environment variable not found');
  process.exit(1);
}

if (!ADMIN_EMAIL) {
  console.error('❌ ERROR: ADMIN_EMAIL environment variable required');
  console.error('Usage: ADMIN_EMAIL=admin@company.com ADMIN_PASSWORD=SecurePass123! node railway-create-admin.js');
  process.exit(1);
}

if (!ADMIN_PASSWORD) {
  console.error('❌ ERROR: ADMIN_PASSWORD environment variable required');
  console.error('Password must be at least 12 characters with mixed case, numbers, and symbols');
  process.exit(1);
}

if (ADMIN_PASSWORD.length < 12) {
  console.error('❌ ERROR: Password must be at least 12 characters');
  process.exit(1);
}

const client = new Client({
  connectionString: DATABASE_URL,
});

async function createPlatformAdmin() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Create company
    console.log('Creating platform admin company...');
    await client.query(`
      INSERT INTO companies (
        id, name, type, status, email,
        subscription_plan, is_subscription_exempt,
        created_at, updated_at
      ) VALUES (
        'platform-admin-company',
        'ILS Platform Administration',
        'hybrid', 'active', $1,
        'enterprise', true,
        NOW(), NOW()
      ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW()
    `, [ADMIN_EMAIL]);
    console.log('✅ Company created\n');

    // Create user
    console.log('Creating platform admin user...');
    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    await client.query(`
      INSERT INTO users (
        id, company_id, account_status, email, password,
        first_name, last_name, role, subscription_plan,
        is_active, is_verified, last_login_at,
        created_at, updated_at
      ) VALUES (
        gen_random_uuid(),
        'platform-admin-company',
        'active',
        $1,
        $2,
        $3, $4, 'platform_admin', 'enterprise',
        true, true, NOW(),
        NOW(), NOW()
      ) ON CONFLICT (email) DO UPDATE SET
        role = 'platform_admin',
        account_status = 'active',
        is_active = true,
        is_verified = true,
        password = $2,
        updated_at = NOW()
    `, [ADMIN_EMAIL, hashedPassword, ADMIN_FIRST_NAME, ADMIN_LAST_NAME]);
    console.log('✅ User created\n');

    // Verify
    const result = await client.query(
      `SELECT email, role, is_active, account_status FROM users WHERE email = $1`,
      [ADMIN_EMAIL]
    );

    console.log('═══════════════════════════════════════');
    console.log('✅ Platform Admin Created Successfully!');
    console.log('═══════════════════════════════════════\n');
    console.log('User Details:');
    console.log(result.rows[0]);
    console.log('\n📧 Login Information:');
    console.log('   Email:', ADMIN_EMAIL);
    console.log('   Password: <stored securely>');
    console.log('   Role: platform_admin');
    console.log('\n⚠️  IMPORTANT: Save your password securely. It cannot be retrieved.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createPlatformAdmin();
