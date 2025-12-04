/**
 * Initialize Admin User - Runs on Railway
 * This script creates the default admin user in the database
 */

import { db } from '../server/db.js';
import { users } from '../shared/schema/coreLegacy.js';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

async function initializeAdmin() {
  try {
    console.log('🔄 Initializing admin user...');

    const adminEmail = 'admin@ils2.com';
    const adminPassword = 'Admin@123456';

    // Check if admin already exists
    const [existingAdmin] = await db.select().from(users).where(eq(users.email, adminEmail));

    if (existingAdmin) {
      console.log('✅ Admin user already exists, updating password...');
      // Update password
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      await db.update(users)
        .set({
          password: passwordHash,
          accountStatus: 'active',
          isEmailVerified: true,
          updatedAt: new Date()
        })
        .where(eq(users.email, adminEmail));
      console.log('✅ Admin password updated');
    } else {
      console.log('📝 Creating new admin user...');
      // Create new admin
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      await db.insert(users).values({
        username: 'admin',
        email: adminEmail,
        password: passwordHash,
        firstName: 'System',
        lastName: 'Administrator',
        role: 'platform_admin',
        accountStatus: 'active',
        isEmailVerified: true,
        isPhoneVerified: false,
        mustChangePassword: false,
      });
      console.log('✅ Admin user created');
    }

    console.log('');
    console.log('==========================================');
    console.log('✅ ADMIN USER INITIALIZED');
    console.log('==========================================');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    console.log('Login URL: https://ils.newvantageco.com/login');
    console.log('==========================================');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing admin:', error);
    process.exit(1);
  }
}

initializeAdmin();
