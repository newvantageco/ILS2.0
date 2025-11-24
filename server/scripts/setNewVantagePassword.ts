/**
 * Script to set password for NEW VANTAGE CO LTD admin user
 * Run with: npx tsx server/scripts/setNewVantagePassword.ts
 */

import bcrypt from 'bcryptjs';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import logger from '../utils/logger';


async function setPassword() {
  const email = 'admin@newvantageco.com';
  const password = process.env.NEW_PASSWORD;

  if (!password) {
    logger.error('❌ Error: NEW_PASSWORD environment variable is required');
    logger.error('Usage: NEW_PASSWORD=your_secure_password npx tsx server/scripts/setNewVantagePassword.ts');
    process.exit(1);
  }

  if (password.length < 12) {
    logger.error('❌ Error: Password must be at least 12 characters long');
    process.exit(1);
  }

  try {
    logger.info('Setting password for NEW VANTAGE CO LTD admin user...');

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
      logger.error('❌ User not found with email:', email);
      logger.error('Make sure the migration has been run first.');
      process.exit(1);
    }
    
    logger.info('✅ Password set successfully!');
    logger.info('');
    logger.info('================================================');
    logger.info('NEW VANTAGE CO LTD User Updated');
    logger.info('================================================');
    logger.info('Email:      ', email);
    logger.info('Company ID: ', result[0].companyId);
    logger.info('User ID:    ', result[0].id);
    logger.info('Role:       ', result[0].role);
    logger.info('================================================');
    logger.info('');
    logger.info('⚠️  IMPORTANT: Store credentials securely!');
    logger.info('');
    
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error setting password:', error);
    process.exit(1);
  }
}

setPassword();
