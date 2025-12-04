#!/usr/bin/env node
/**
 * Create Platform Admin - Runs on Railway
 *
 * Usage: node railway-create-admin.js
 */

import pkg from 'pg';
const { Client } = pkg;
import bcrypt from 'bcryptjs';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL environment variable not found');
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
        'hybrid', 'active', 'care@newvantageco.com',
        'enterprise', true,
        NOW(), NOW()
      ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW()
    `);
    console.log('✅ Company created\n');

    // Create user
    console.log('Creating platform admin user...');
    const hashedPassword = '$2b$10$Nntnf2NncPMEZ2qo5opUIuEVFmGFaWRD67ac/GGKdLVkJ0HA5bLCS';

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
        'care@newvantageco.com',
        $1,
        'Platform', 'Admin', 'platform_admin', 'enterprise',
        true, true, NOW(),
        NOW(), NOW()
      ) ON CONFLICT (email) DO UPDATE SET
        role = 'platform_admin',
        account_status = 'active',
        is_active = true,
        is_verified = true,
        updated_at = NOW()
    `, [hashedPassword]);
    console.log('✅ User created\n');

    // Verify
    const result = await client.query(
      `SELECT email, role, is_active, account_status FROM users WHERE email = 'care@newvantageco.com'`
    );

    console.log('═══════════════════════════════════════');
    console.log('✅ Platform Admin Created Successfully!');
    console.log('═══════════════════════════════════════\n');
    console.log('User Details:');
    console.log(result.rows[0]);
    console.log('\n📧 Login Credentials:');
    console.log('   Email: care@newvantageco.com');
    console.log('   Password: Eyecloud123');
    console.log('   Role: platform_admin\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createPlatformAdmin();
