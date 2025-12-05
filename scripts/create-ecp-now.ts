/**
 * Quick script to create ECP test account
 */
import pg from 'pg';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const { Pool } = pg;

async function createECP() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('railway') ? { rejectUnauthorized: false } : undefined
  });

  try {
    const client = await pool.connect();

    const email = 'test.ecp@ils2.com';
    const password = 'TestECP123!';
    const companyName = 'Test Eye Care Practice';
    const gocNumber = 'GOC123456';

    console.log('🔍 Checking if user exists...');
    const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);

    if (existingUser.rows.length > 0) {
      console.log('✅ User already exists. Updating password...');
      const hashedPassword = await bcrypt.hash(password, 10);
      await client.query(
        'UPDATE users SET password = $1, account_status = $2, is_verified = $3, is_active = $4 WHERE email = $5',
        [hashedPassword, 'active', true, true, email]
      );
    } else {
      console.log('📦 Creating company...');
      const companyId = crypto.randomUUID();
      await client.query(
        `INSERT INTO companies (id, name, type, status, email, subscription_plan, is_subscription_exempt, goc_number, has_ecp_access, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
        [companyId, companyName, 'ecp', 'active', email, 'free_ecp', true, gocNumber, true]
      );

      console.log('👤 Creating ECP user...');
      const userId = crypto.randomUUID();
      const hashedPassword = await bcrypt.hash(password, 10);
      await client.query(
        `INSERT INTO users (id, company_id, account_status, email, password, first_name, last_name, role, subscription_plan, is_active, is_verified, goc_number, can_prescribe, can_dispense, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())`,
        [userId, companyId, 'active', email, hashedPassword, 'Test', 'ECP', 'ecp', 'full', true, true, gocNumber, true, true]
      );
    }

    console.log('\n═══════════════════════════════════════');
    console.log('✅ ECP Test Account Ready!');
    console.log('═══════════════════════════════════════');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('GOC Number:', gocNumber);
    console.log('Login URL: https://ils.newvantageco.com/login');
    console.log('═══════════════════════════════════════\n');

    client.release();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

createECP();
