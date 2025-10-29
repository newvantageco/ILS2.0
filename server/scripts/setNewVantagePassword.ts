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
  const defaultPassword = 'NewVantage2025!'; // Change this to desired password
  
  try {
    console.log('Setting password for NEW VANTAGE CO LTD admin user...');
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    
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
    console.log('NEW VANTAGE CO LTD Login Credentials');
    console.log('================================================');
    console.log('Email:    ', email);
    console.log('Password: ', defaultPassword);
    console.log('');
    console.log('Company ID:', result[0].companyId);
    console.log('User ID:   ', result[0].id);
    console.log('Role:      ', result[0].role);
    console.log('================================================');
    console.log('');
    console.log('⚠️  IMPORTANT: Change this password after first login!');
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting password:', error);
    process.exit(1);
  }
}

setPassword();
