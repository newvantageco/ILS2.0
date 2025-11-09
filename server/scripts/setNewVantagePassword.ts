/**
 * Script to set password for NEW VANTAGE CO LTD admin user
 * Run with: npx tsx server/scripts/setNewVantagePassword.ts
 */

import bcrypt from 'bcrypt';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

async function setPassword() {
  const email = 'admin@newvantageco.com';
  const password = process.env.NEW_PASSWORD;

  if (!password) {
    console.error('❌ Error: NEW_PASSWORD environment variable is required');
    console.error('Usage: NEW_PASSWORD=your_secure_password npx tsx server/scripts/setNewVantagePassword.ts');
    process.exit(1);
  }

  if (password.length < 12) {
    console.error('❌ Error: Password must be at least 12 characters long');
    process.exit(1);
  }

  try {
    console.log('Setting password for NEW VANTAGE CO LTD admin user...');

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update the user with the hashed password
    const result = await db
      .update(users)
      .set({
        password: hashedPassword,
        isVerified: true,
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(users.email, email))
      .returning();
    
    if (result.length === 0) {
      console.error('❌ User not found with email:', email);
      console.error('Make sure the migration has been run first.');
      process.exit(1);
    }
    
    console.log('✅ Password set successfully!');
    console.log('');
    console.log('================================================');
    console.log('NEW VANTAGE CO LTD User Updated');
    console.log('================================================');
    console.log('Email:      ', email);
    console.log('Company ID: ', result[0].companyId);
    console.log('User ID:    ', result[0].id);
    console.log('Role:       ', result[0].role);
    console.log('================================================');
    console.log('');
    console.log('⚠️  IMPORTANT: Store credentials securely!');
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting password:', error);
    process.exit(1);
  }
}

setPassword();
