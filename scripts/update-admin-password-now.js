const { Client } = require('pg');
const bcrypt = require('bcryptjs');

(async () => {
  try {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    console.log('✅ Connected to database');

    // Hash the new password
    const newPassword = 'Admin@123456';
    const hash = await bcrypt.hash(newPassword, 10);

    // Update the admin user's password
    const result = await client.query(`
      UPDATE users
      SET password_hash = $1, updated_at = NOW()
      WHERE email = 'admin@ils2.com'
      RETURNING id, email, role
    `, [hash]);

    if (result.rows.length > 0) {
      console.log('\n========================================');
      console.log('✅ ADMIN PASSWORD UPDATED SUCCESSFULLY');
      console.log('========================================');
      console.log('Email:', result.rows[0].email);
      console.log('New Password: Admin@123456');
      console.log('Role:', result.rows[0].role);
      console.log('========================================\n');
      console.log('You can now login at: https://ils.newvantageco.com/login');
    } else {
      console.log('❌ Admin user not found');
    }

    await client.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
