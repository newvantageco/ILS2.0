/**
 * Seed Test Users Script
 *
 * Creates test accounts for development and testing
 *
 * Usage:
 *   npx tsx server/scripts/seed-test-users.ts
 *
 * SECURITY: Only run in development/staging environments!
 */

import bcrypt from 'bcryptjs';
import { db } from '../db/index.js';
import { users, companies } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';

// Test user IDs (fixed for consistency across tests)
export const TEST_USER_IDS = {
  COMPANY_ADMIN: 'test-user-company-admin',
  PLATFORM_ADMIN: 'test-user-platform-admin'
} as const;

export const TEST_COMPANY_IDS = {
  TEST_OPTICAL: 'test-company-001',
  PLATFORM_ADMIN: 'platform-admin-company'
} as const;

// Test credentials
const TEST_CREDENTIALS = {
  COMPANY_ADMIN: {
    email: 'admin@testoptical.com',
    password: 'TestAdmin123!'
  },
  PLATFORM_ADMIN: {
    email: 'platform@ils.com',
    password: 'PlatformAdmin123!'
  }
};

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function seedTestUsers() {
  console.log('🌱 Seeding test users...\n');

  try {
    // 1. Create Test Company
    console.log('📦 Creating test company...');
    const [testCompany] = await db
      .insert(companies)
      .values({
        id: TEST_COMPANY_IDS.TEST_OPTICAL,
        name: 'Test Optical Practice',
        type: 'ecp',
        status: 'active',
        email: 'contact@testoptical.com',
        phone: '+44 20 1234 5678',
        website: 'https://testoptical.com',
        address: {
          street: '123 Test Street',
          city: 'London',
          postcode: 'SW1A 1AA',
          country: 'UK'
        },
        registrationNumber: 'OC123456',
        gocNumber: 'GOC-12345',
        subscriptionPlan: 'professional',
        subscriptionStartDate: new Date(),
        billingEmail: 'billing@testoptical.com',
        isSubscriptionExempt: true, // Exempt from subscription checks for testing
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: companies.id,
        set: {
          name: 'Test Optical Practice',
          status: 'active',
          updatedAt: new Date()
        }
      })
      .returning();

    console.log(`✅ Test company created: ${testCompany.name} (${testCompany.id})\n`);

    // 2. Create Company Admin User
    console.log('👤 Creating company admin user...');
    const companyAdminPassword = await hashPassword(TEST_CREDENTIALS.COMPANY_ADMIN.password);

    const [companyAdmin] = await db
      .insert(users)
      .values({
        id: TEST_USER_IDS.COMPANY_ADMIN,
        companyId: TEST_COMPANY_IDS.TEST_OPTICAL,
        accountStatus: 'active',
        email: TEST_CREDENTIALS.COMPANY_ADMIN.email,
        password: companyAdminPassword,
        firstName: 'Test',
        lastName: 'Admin',
        role: 'admin',
        subscriptionPlan: 'professional',
        gocRegistrationNumber: 'GOC-12345',
        gocRegistrationType: 'Optometrist',
        professionalQualifications: 'BSc Optometry, MCOptom',
        canPrescribe: true,
        canDispense: true,
        isActive: true,
        isVerified: true,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          companyId: TEST_COMPANY_IDS.TEST_OPTICAL,
          accountStatus: 'active',
          role: 'admin',
          isActive: true,
          isVerified: true,
          updatedAt: new Date()
        }
      })
      .returning();

    console.log(`✅ Company admin created:`);
    console.log(`   Email: ${TEST_CREDENTIALS.COMPANY_ADMIN.email}`);
    console.log(`   Password: ${TEST_CREDENTIALS.COMPANY_ADMIN.password}`);
    console.log(`   ID: ${TEST_USER_IDS.COMPANY_ADMIN}`);
    console.log(`   Company: ${testCompany.name}\n`);

    // 3. Create Platform Admin Company
    console.log('📦 Creating platform admin company...');
    const [platformCompany] = await db
      .insert(companies)
      .values({
        id: TEST_COMPANY_IDS.PLATFORM_ADMIN,
        name: 'ILS Platform Administration',
        type: 'hybrid',
        status: 'active',
        email: 'platform@ils.com',
        phone: '+44 20 9999 9999',
        subscriptionPlan: 'enterprise',
        isSubscriptionExempt: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: companies.id,
        set: {
          name: 'ILS Platform Administration',
          status: 'active',
          updatedAt: new Date()
        }
      })
      .returning();

    console.log(`✅ Platform company created: ${platformCompany.name} (${platformCompany.id})\n`);

    // 4. Create Platform Admin User
    console.log('🔧 Creating platform admin user...');
    const platformAdminPassword = await hashPassword(TEST_CREDENTIALS.PLATFORM_ADMIN.password);

    const [platformAdmin] = await db
      .insert(users)
      .values({
        id: TEST_USER_IDS.PLATFORM_ADMIN,
        companyId: TEST_COMPANY_IDS.PLATFORM_ADMIN,
        accountStatus: 'active',
        email: TEST_CREDENTIALS.PLATFORM_ADMIN.email,
        password: platformAdminPassword,
        firstName: 'Platform',
        lastName: 'Administrator',
        role: 'platform_admin',
        subscriptionPlan: 'enterprise',
        isActive: true,
        isVerified: true,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          companyId: TEST_COMPANY_IDS.PLATFORM_ADMIN,
          accountStatus: 'active',
          role: 'platform_admin',
          isActive: true,
          isVerified: true,
          updatedAt: new Date()
        }
      })
      .returning();

    console.log(`✅ Platform admin created:`);
    console.log(`   Email: ${TEST_CREDENTIALS.PLATFORM_ADMIN.email}`);
    console.log(`   Password: ${TEST_CREDENTIALS.PLATFORM_ADMIN.password}`);
    console.log(`   ID: ${TEST_USER_IDS.PLATFORM_ADMIN}`);
    console.log(`   Company: ${platformCompany.name}\n`);

    // Summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ Test users seeded successfully!\n');
    console.log('📋 Summary:');
    console.log('   • Test Company: Test Optical Practice');
    console.log('   • Company Admin: admin@testoptical.com / TestAdmin123!');
    console.log('   • Platform Admin: platform@ils.com / PlatformAdmin123!');
    console.log('\n⚠️  WARNING: These are test accounts with known passwords.');
    console.log('   NEVER use these in production!');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Export test IDs for use in tests
    console.log('📝 Test IDs for use in code:');
    console.log(`   TEST_USER_IDS.COMPANY_ADMIN = "${TEST_USER_IDS.COMPANY_ADMIN}"`);
    console.log(`   TEST_USER_IDS.PLATFORM_ADMIN = "${TEST_USER_IDS.PLATFORM_ADMIN}"`);
    console.log(`   TEST_COMPANY_IDS.TEST_OPTICAL = "${TEST_COMPANY_IDS.TEST_OPTICAL}"`);
    console.log(`   TEST_COMPANY_IDS.PLATFORM_ADMIN = "${TEST_COMPANY_IDS.PLATFORM_ADMIN}"\n`);

  } catch (error) {
    console.error('❌ Error seeding test users:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedTestUsers()
    .then(() => {
      console.log('✅ Seeding complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

export { seedTestUsers, TEST_CREDENTIALS };
