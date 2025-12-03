/**
 * Create Platform Admin User
 *
 * Creates a platform admin account for production use
 *
 * Usage:
 *   npx tsx server/scripts/create-platform-admin.ts
 *
 * Environment Variables Required:
 *   ADMIN_EMAIL - Email for platform admin
 *   ADMIN_PASSWORD - Strong password for platform admin
 *   ADMIN_FIRST_NAME - First name (optional, default: Platform)
 *   ADMIN_LAST_NAME - Last name (optional, default: Admin)
 */

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from '../db/index.js';
import { users, companies } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';

interface CreateAdminInput {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

async function createPlatformAdmin(input: CreateAdminInput) {
  const { email, password, firstName = 'Platform', lastName = 'Admin' } = input;

  console.log('🔧 Creating platform admin user...\n');

  try {
    // Validate inputs
    if (!email || !email.includes('@')) {
      throw new Error('Valid email is required');
    }

    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      console.log(`⚠️  User with email ${email} already exists.`);
      console.log(`   User ID: ${existingUser[0].id}`);
      console.log(`   Current role: ${existingUser[0].role}`);

      // Ask if they want to update to platform_admin
      if (existingUser[0].role !== 'platform_admin') {
        console.log('\n🔄 Updating existing user to platform_admin role...');

        await db
          .update(users)
          .set({
            role: 'platform_admin',
            accountStatus: 'active',
            isActive: true,
            isVerified: true,
            updatedAt: new Date()
          })
          .where(eq(users.id, existingUser[0].id));

        console.log('✅ User updated to platform_admin role');
      } else {
        console.log('✅ User is already a platform_admin');
      }

      return existingUser[0];
    }

    // 1. Create or get Platform Admin Company
    console.log('📦 Creating/getting platform admin company...');

    const platformCompanyId = 'platform-admin-company';
    const [platformCompany] = await db
      .insert(companies)
      .values({
        id: platformCompanyId,
        name: 'ILS Platform Administration',
        type: 'hybrid',
        status: 'active',
        email: email,
        subscriptionPlan: 'enterprise',
        isSubscriptionExempt: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: companies.id,
        set: {
          name: 'ILS Platform Administration',
          email: email,
          status: 'active',
          updatedAt: new Date()
        }
      })
      .returning();

    console.log(`✅ Platform company: ${platformCompany.name} (${platformCompany.id})\n`);

    // 2. Hash password
    console.log('🔒 Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('✅ Password hashed\n');

    // 3. Create platform admin user
    console.log('👤 Creating platform admin user...');
    const userId = crypto.randomUUID();

    const [adminUser] = await db
      .insert(users)
      .values({
        id: userId,
        companyId: platformCompanyId,
        accountStatus: 'active',
        email: email,
        password: hashedPassword,
        firstName: firstName,
        lastName: lastName,
        role: 'platform_admin',
        subscriptionPlan: 'enterprise',
        isActive: true,
        isVerified: true,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    console.log('✅ Platform admin user created successfully!\n');

    // Summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ Platform Admin Created\n');
    console.log('📋 Details:');
    console.log(`   Email: ${email}`);
    console.log(`   Name: ${firstName} ${lastName}`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Role: platform_admin`);
    console.log(`   Company: ${platformCompany.name}`);
    console.log('\n🔐 Security:');
    console.log('   ✅ Password is securely hashed');
    console.log('   ✅ Account is active and verified');
    console.log('   ✅ Subscription exempt for platform use');
    console.log('═══════════════════════════════════════════════════════════\n');

    return adminUser;

  } catch (error) {
    console.error('❌ Error creating platform admin:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  // Get credentials from environment variables
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const firstName = process.env.ADMIN_FIRST_NAME;
  const lastName = process.env.ADMIN_LAST_NAME;

  if (!email || !password) {
    console.error('❌ Error: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required\n');
    console.log('Usage:');
    console.log('  ADMIN_EMAIL=admin@yourcompany.com ADMIN_PASSWORD=YourSecurePassword npx tsx server/scripts/create-platform-admin.ts\n');
    console.log('Optional:');
    console.log('  ADMIN_FIRST_NAME=John ADMIN_LAST_NAME=Doe\n');
    process.exit(1);
  }

  createPlatformAdmin({ email, password, firstName, lastName })
    .then(() => {
      console.log('✅ Complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Failed:', error);
      process.exit(1);
    });
}

export { createPlatformAdmin };
