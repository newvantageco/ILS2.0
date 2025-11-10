/**
 * Test Database Utilities
 * Helper functions for setting up and tearing down test database
 */

import { db } from '../../server/db';
import { sql } from 'drizzle-orm';
import * as schema from '../../shared/schema';

/**
 * Clear all tables in test database
 */
export async function clearDatabase() {
  // Disable foreign key checks temporarily
  await db.execute(sql`SET session_replication_role = 'replica'`);

  // Get all table names from schema
  const tables = Object.keys(schema).filter(key =>
    schema[key as keyof typeof schema]?.constructor?.name === 'PgTable'
  );

  // Delete from all tables
  for (const tableName of tables) {
    const table = schema[tableName as keyof typeof schema] as any;
    if (table) {
      try {
        await db.delete(table);
      } catch (error) {
        console.warn(`Warning: Could not clear table ${tableName}:`, error);
      }
    }
  }

  // Re-enable foreign key checks
  await db.execute(sql`SET session_replication_role = 'origin'`);
}

/**
 * Create test company
 */
export async function createTestCompany(data?: Partial<typeof schema.companies.$inferInsert>) {
  const [company] = await db.insert(schema.companies).values({
    id: data?.id || `test-company-${Date.now()}`,
    name: data?.name || 'Test Optical Practice',
    email: data?.email || 'test@optical.com',
    phone: data?.phone || '0123456789',
    address: data?.address || { line1: '123 Test St', city: 'London', postcode: 'SW1A 1AA' },
    subscriptionPlan: data?.subscriptionPlan || 'full',
    subscriptionStatus: data?.subscriptionStatus || 'active',
    aiEnabled: data?.aiEnabled ?? true,
    aiQueriesLimit: data?.aiQueriesLimit ?? 1000,
    aiQueriesUsed: data?.aiQueriesUsed ?? 0,
    createdAt: new Date(),
    ...data,
  }).returning();

  return company;
}

/**
 * Create test user
 */
export async function createTestUser(data?: Partial<typeof schema.users.$inferInsert>) {
  const [user] = await db.insert(schema.users).values({
    id: data?.id || `test-user-${Date.now()}`,
    email: data?.email || `test-${Date.now()}@example.com`,
    password: data?.password || 'hashed_password',
    firstName: data?.firstName || 'Test',
    lastName: data?.lastName || 'User',
    role: data?.role || 'ecp',
    enhancedRole: data?.enhancedRole || 'optometrist',
    isActive: data?.isActive ?? true,
    isVerified: data?.isVerified ?? true,
    createdAt: new Date(),
    ...data,
  }).returning();

  return user;
}

/**
 * Create test patient
 */
export async function createTestPatient(companyId: string, data?: Partial<typeof schema.patients.$inferInsert>) {
  const [patient] = await db.insert(schema.patients).values({
    id: data?.id || `test-patient-${Date.now()}`,
    companyId,
    firstName: data?.firstName || 'John',
    lastName: data?.lastName || 'Doe',
    email: data?.email || `patient-${Date.now()}@example.com`,
    phone: data?.phone || '07123456789',
    dateOfBirth: data?.dateOfBirth || new Date('1990-01-01'),
    address: data?.address || { line1: '456 Patient St', city: 'London', postcode: 'E1 6AN' },
    nhsNumber: data?.nhsNumber || '1234567890',
    createdAt: new Date(),
    ...data,
  }).returning();

  return patient;
}

/**
 * Create test order
 */
export async function createTestOrder(companyId: string, patientId: string, data?: Partial<typeof schema.orders.$inferInsert>) {
  const [order] = await db.insert(schema.orders).values({
    id: data?.id || `test-order-${Date.now()}`,
    companyId,
    patientId,
    orderNumber: data?.orderNumber || `ORD-${Date.now()}`,
    status: data?.status || 'pending',
    lensType: data?.lensType || 'single_vision',
    lensMaterial: data?.lensMaterial || 'cr39',
    coating: data?.coating || 'standard_ar',
    totalPrice: data?.totalPrice || '150.00',
    createdAt: new Date(),
    ...data,
  }).returning();

  return order;
}

/**
 * Create test prescription
 */
export async function createTestPrescription(patientId: string, companyId: string, data?: Partial<typeof schema.prescriptions.$inferInsert>) {
  const [prescription] = await db.insert(schema.prescriptions).values({
    id: data?.id || `test-prescription-${Date.now()}`,
    patientId,
    companyId,
    prescribedBy: data?.prescribedBy || 'test-doctor',
    odSphere: data?.odSphere || '+1.00',
    odCylinder: data?.odCylinder || '-0.50',
    odAxis: data?.odAxis || '90',
    osSphere: data?.osSphere || '+1.00',
    osCylinder: data?.osCylinder || '-0.50',
    osAxis: data?.osAxis || '90',
    pd: data?.pd || '64',
    prescriptionType: data?.prescriptionType || 'spectacles',
    issuedDate: data?.issuedDate || new Date(),
    expiryDate: data?.expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    createdAt: new Date(),
    ...data,
  }).returning();

  return prescription;
}

/**
 * Setup test environment
 * Call this before each test
 */
export async function setupTest() {
  // Clear database
  await clearDatabase();

  // Create default test company and user
  const company = await createTestCompany();
  const user = await createTestUser({ companyId: company.id });

  return { company, user };
}

/**
 * Teardown test environment
 * Call this after each test
 */
export async function teardownTest() {
  await clearDatabase();
}
