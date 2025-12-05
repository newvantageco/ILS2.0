/**
 * Debug ECP user creation and password
 */
import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;

async function debugECPUser() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('railway') ? { rejectUnauthorized: false } : undefined
  });

  try {
    const client = await pool.connect();

    const email = 'test.ecp@ils2.com';
    const password = 'TestECP12345';

    console.log('🔍 Checking user in database...');
    const userResult = await client.query(
      'SELECT id, email, password, role, is_active, is_verified, account_status, company_id FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      console.log('❌ User not found in database');
      client.release();
      await pool.end();
      process.exit(1);
    }

    const user = userResult.rows[0];
    console.log('\n📊 User Details:');
    console.log('ID:', user.id);
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('Active:', user.is_active);
    console.log('Verified:', user.is_verified);
    console.log('Status:', user.account_status);
    console.log('Company ID:', user.company_id);
    console.log('Password Hash (first 20 chars):', user.password?.substring(0, 20));

    // Test password
    console.log('\n🔐 Testing password comparison...');
    const isValid = await bcrypt.compare(password, user.password);
    console.log('Password matches:', isValid);

    // Create a fresh hash and update
    console.log('\n🔄 Creating fresh password hash...');
    const newHash = await bcrypt.hash(password, 10);
    console.log('New hash (first 20 chars):', newHash.substring(0, 20));

    // Update the user
    await client.query(
      'UPDATE users SET password = $1, is_active = $2, is_verified = $3, account_status = $4 WHERE email = $5',
      [newHash, true, true, 'active', email]
    );
    console.log('✅ Password hash updated');

    // Verify the update
    console.log('\n🔍 Verifying update...');
    const verifyResult = await client.query(
      'SELECT password FROM users WHERE email = $1',
      [email]
    );
    const newStoredHash = verifyResult.rows[0].password;
    const isNewValid = await bcrypt.compare(password, newStoredHash);
    console.log('New password validates:', isNewValid);

    console.log('\n═══════════════════════════════════════');
    console.log('✅ ECP User Fixed!');
    console.log('═══════════════════════════════════════');
    console.log('Email:', email);
    console.log('Password:', password);
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

debugECPUser();
