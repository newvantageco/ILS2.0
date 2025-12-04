#!/usr/bin/env tsx
/**
 * Create Platform Admin Account
 *
 * Creates or updates a platform admin account with immediate access.
 * Run with: npx tsx scripts/create-admin.ts <email> <password>
 */

import bcrypt from 'bcryptjs';
import { storage } from '../server/storage.js';
import { createLogger } from '../server/utils/logger.js';

const logger = createLogger('create-admin');

async function createPlatformAdmin(email: string, password: string) {
  try {
    // Validate inputs
    if (!email || !email.includes('@')) {
      throw new Error('Invalid email address');
    }

    if (!password || password.length < 12) {
      throw new Error('Password must be at least 12 characters');
    }

    logger.info(`Creating/updating platform admin: ${email}`);

    // Check if user exists
    const existingUser = await storage.getUserByEmail(email.toLowerCase());

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    if (existingUser) {
      // Update existing user to platform admin with full access
      logger.info('User exists, updating to platform admin...');

      const updatedUser = await storage.updateUser(existingUser.id, {
        role: 'admin',
        passwordHash,
        isActive: true,
        isEmailVerified: true,
        accountStatus: 'active',
        subscriptionPlan: 'full',
        updatedAt: new Date()
      });

      if (!updatedUser) {
        throw new Error('Failed to update user');
      }

      logger.info('✅ Admin account updated successfully');
      console.log('\n===========================================');
      console.log('ADMIN ACCOUNT UPDATED');
      console.log('===========================================');
      console.log(`Email: ${email}`);
      console.log(`Password: [SET - ${password.length} characters]`);
      console.log(`Role: ${updatedUser.role}`);
      console.log(`Status: ${updatedUser.accountStatus}`);
      console.log(`Active: ${updatedUser.isActive}`);
      console.log('===========================================\n');

      return updatedUser;
    } else {
      // Create new admin user
      logger.info('Creating new platform admin...');

      // For new admins, we need a company first
      const company = await storage.createCompany({
        name: 'Platform Administration',
        type: 'lab',
        status: 'active',
        email: email,
        subscriptionPlan: 'full',
        gocNumber: null
      });

      const newUser = await storage.createUser({
        email: email.toLowerCase(),
        passwordHash,
        firstName: 'Platform',
        lastName: 'Admin',
        role: 'admin',
        companyId: company.id,
        isActive: true,
        isEmailVerified: true,
        accountStatus: 'active',
        subscriptionPlan: 'full',
        authProvider: 'email'
      });

      if (!newUser) {
        throw new Error('Failed to create user');
      }

      logger.info('✅ Admin account created successfully');
      console.log('\n===========================================');
      console.log('ADMIN ACCOUNT CREATED');
      console.log('===========================================');
      console.log(`Email: ${email}`);
      console.log(`Password: [SET - ${password.length} characters]`);
      console.log(`Role: ${newUser.role}`);
      console.log(`Status: ${newUser.accountStatus}`);
      console.log(`Active: ${newUser.isActive}`);
      console.log(`Company: ${company.name} (${company.id})`);
      console.log('===========================================\n');

      return newUser;
    }
  } catch (error) {
    logger.error('Failed to create/update admin:', error);
    console.error('\n❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Get credentials from command line or use defaults
const args = process.argv.slice(2);
const email = args[0] || 'admin@newvantageco.com';
const password = args[1] || 'AdminPassword123!';

console.log('\n🔐 Platform Admin Setup\n');

if (!args[0] || !args[1]) {
  console.log('Using default credentials...');
  console.log('Usage: npx tsx scripts/create-admin.ts <email> <password>\n');
}

createPlatformAdmin(email, password)
  .then(() => {
    console.log('\n✅ You can now login at: http://localhost:5005/login');
    console.log(`   Email: ${email}`);
    console.log('   Password: [as set above]\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
