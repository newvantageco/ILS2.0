/**
 * Create Test ECP Account
 *
 * Creates a test ECP (Eye Care Professional) account for testing purposes
 *
 * Usage:
 *   npx tsx scripts/create-test-ecp.ts
 *
 * Or with custom credentials:
 *   ECP_EMAIL=test@example.com ECP_PASSWORD=password123 npx tsx scripts/create-test-ecp.ts
 */

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import pg from 'pg';

const { Pool } = pg;

interface CreateECPInput {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  gocNumber?: string;
}

async function createTestECP(input: CreateECPInput) {
  const {
    email,
    password,
    firstName = 'Test',
    lastName = 'ECP',
    companyName = 'Test Eye Care Practice',
    gocNumber = 'GOC123456'
  } = input;

  console.log('🔧 Creating test ECP account...\n');

  // Get DATABASE_URL from environment
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable not found');
  }

  // Create database pool
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('railway') ? { rejectUnauthorized: false } : undefined
  });

  try {
    const client = await pool.connect();

    // Validate inputs
    if (!email || !email.includes('@')) {
      throw new Error('Valid email is required');
    }

    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    // Check if user already exists
    console.log('🔍 Checking if user exists...');
    const existingUserResult = await client.query(
      'SELECT id, email, role FROM users WHERE email = $1 LIMIT 1',
      [email]
    );

    if (existingUserResult.rows.length > 0) {
      const existingUser = existingUserResult.rows[0];
      console.log(`⚠️  User with email ${email} already exists.`);
      console.log(`   User ID: ${existingUser.id}`);
      console.log(`   Current role: ${existingUser.role}\n`);
      client.release();
      await pool.end();
      return existingUser;
    }

    // 1. Create ECP Company
    console.log('📦 Creating test ECP company...');
    const companyId = crypto.randomUUID();

    const companyResult = await client.query(
      `INSERT INTO companies (
        id, name, type, status, email, subscription_plan,
        is_subscription_exempt, goc_number, has_ecp_access,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()
      ) RETURNING *`,
      [
        companyId,
        companyName,
        'ecp',
        'active',
        email,
        'free_ecp',
        true,
        gocNumber,
        true
      ]
    );

    const company = companyResult.rows[0];
    console.log(`✅ Company created: ${company.name} (${company.id})\n`);

    // 2. Hash password
    console.log('🔒 Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('✅ Password hashed\n');

    // 3. Create ECP user
    console.log('👤 Creating ECP user...');
    const userId = crypto.randomUUID();

    const userResult = await client.query(
      `INSERT INTO users (
        id, company_id, account_status, email, password,
        first_name, last_name, role, subscription_plan,
        is_active, is_verified, goc_number, can_prescribe,
        can_dispense, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW()
      ) RETURNING *`,
      [
        userId,
        companyId,
        'active',
        email,
        hashedPassword,
        firstName,
        lastName,
        'ecp',
        'full',
        true,
        true,
        gocNumber,
        true,
        true
      ]
    );

    const user = userResult.rows[0];
    console.log('✅ ECP user created successfully!\n');

    // Summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ Test ECP Account Created\n');
    console.log('📋 Login Credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('\n👤 User Details:');
    console.log(`   Name: ${firstName} ${lastName}`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Role: ecp`);
    console.log(`   GOC Number: ${gocNumber}`);
    console.log('\n🏢 Company Details:');
    console.log(`   Name: ${company.name}`);
    console.log(`   Company ID: ${companyId}`);
    console.log(`   Type: ecp`);
    console.log('\n🔐 Security:');
    console.log('   ✅ Password is securely hashed');
    console.log('   ✅ Account is active and verified');
    console.log('   ✅ Can prescribe and dispense');
    console.log('═══════════════════════════════════════════════════════════\n');

    client.release();
    await pool.end();

    return user;

  } catch (error) {
    console.error('❌ Error creating test ECP:', error);
    await pool.end();
    throw error;
  }
}

// Run if called directly
const email = process.env.ECP_EMAIL || 'test.ecp@ils2.com';
const password = process.env.ECP_PASSWORD || 'TestECP123!';
const firstName = process.env.ECP_FIRST_NAME || 'Test';
const lastName = process.env.ECP_LAST_NAME || 'ECP';
const companyName = process.env.ECP_COMPANY_NAME || 'Test Eye Care Practice';
const gocNumber = process.env.ECP_GOC_NUMBER || 'GOC123456';

console.log('🚀 Creating test ECP account with default credentials...\n');

createTestECP({ email, password, firstName, lastName, companyName, gocNumber })
  .then(() => {
    console.log('✅ Complete! You can now log in with the credentials above.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed:', error.message);
    process.exit(1);
  });
