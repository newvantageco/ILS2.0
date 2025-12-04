#!/usr/bin/env tsx
import { Client } from 'pg';
import * as bcrypt from 'bcryptjs';

async function createMasterAdmin() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    const email = 'admin@newvantageco.com';
    const password = 'MasterAdmin2024!@#';
    const passwordHash = await bcrypt.hash(password, 10);

    const query = `
      INSERT INTO users (
        id,
        email,
        password_hash,
        first_name,
        last_name,
        role,
        is_active,
        is_email_verified,
        account_status,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        $1,
        $2,
        'Master',
        'Admin',
        'super_admin',
        true,
        true,
        'active',
        NOW(),
        NOW()
      )
      ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = 'super_admin',
        is_active = true,
        is_email_verified = true,
        account_status = 'active',
        updated_at = NOW()
      RETURNING id, email, role, account_status;
    `;

    const result = await client.query(query, [email, passwordHash]);

    console.log('\n===========================================');
    console.log('✅ MASTER ADMIN ACCOUNT CREATED/UPDATED');
    console.log('===========================================');
    console.log(`Email: ${result.rows[0].email}`);
    console.log(`Password: MasterAdmin2024!@#`);
    console.log(`Role: ${result.rows[0].role}`);
    console.log(`Status: ${result.rows[0].account_status}`);
    console.log(`User ID: ${result.rows[0].id}`);
    console.log('===========================================\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createMasterAdmin();
