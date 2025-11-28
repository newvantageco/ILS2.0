/**
 * PHI/PII Encryption Migration Script
 * 
 * Encrypts existing plaintext PHI/PII data in the database.
 * 
 * IMPORTANT: This is a DESTRUCTIVE operation. Follow these steps:
 * 
 * 1. Schedule maintenance window (estimate: 30-60 minutes for 10,000 records)
 * 2. Create full database backup
 * 3. Set DB_ENCRYPTION_KEY environment variable
 * 4. Run this script: npm run migrate:encrypt-phi
 * 5. Verify encryption: npm run verify:encryption
 * 6. Monitor application for 30 days
 * 7. Drop plaintext columns (manual SQL after verification)
 * 
 * Compliance: HIPAA Security Rule §164.312(a)(2)(iv)
 */

import { db } from '../server/db';
import { patients, users, prescriptions, examinations } from '@shared/schema';
import { eq, isNull, isNotNull, sql } from 'drizzle-orm';
import { encryptField, isEncrypted } from '../server/utils/encryption';
import { logger } from '../server/utils/logger';

interface MigrationStats {
  table: string;
  totalRecords: number;
  encryptedRecords: number;
  failedRecords: number;
  skippedRecords: number;
  duration: number;
}

const stats: MigrationStats[] = [];

/**
 * Validate environment before migration
 */
function validateEnvironment(): void {
  if (!process.env.DB_ENCRYPTION_KEY) {
    throw new Error(
      '❌ DB_ENCRYPTION_KEY not set.\n\n' +
      'Generate a key:\n' +
      '  openssl rand -base64 32\n\n' +
      'Set environment variable:\n' +
      '  export DB_ENCRYPTION_KEY="<generated-key>"\n' +
      '  export DB_ENCRYPTION_KEY_VERSION="v1"'
    );
  }
  
  if (process.env.NODE_ENV === 'production' && !process.env.DB_BACKUP_CONFIRMED) {
    throw new Error(
      '❌ Production database backup not confirmed.\n\n' +
      'Create backup first:\n' +
      '  pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql\n\n' +
      'Then set:\n' +
      '  export DB_BACKUP_CONFIRMED=true'
    );
  }
  
  logger.info('✅ Environment validation passed');
}

/**
 * Encrypt patients table PHI
 */
async function encryptPatientsTable(): Promise<MigrationStats> {
  const startTime = Date.now();
  const tableName = 'patients';
  
  logger.info(`Starting encryption for ${tableName} table...`);
  
  // Get all patients with unencrypted NHS numbers
  const patientsToEncrypt = await db
    .select({
      id: patients.id,
      nhsNumber: patients.nhsNumber,
      dateOfBirth: patients.dateOfBirth,
      email: patients.email,
      phone: patients.phone,
      address: patients.address,
      postcode: patients.postcode,
      nhsNumberEncrypted: patients.nhsNumberEncrypted,
    })
    .from(patients)
    .where(isNull(patients.nhsNumberEncrypted));
  
  const totalRecords = patientsToEncrypt.length;
  let encryptedRecords = 0;
  let failedRecords = 0;
  let skippedRecords = 0;
  
  logger.info(`Found ${totalRecords} patients to encrypt`);
  
  for (const patient of patientsToEncrypt) {
    try {
      // Skip if already encrypted
      if (patient.nhsNumberEncrypted && isEncrypted(patient.nhsNumberEncrypted)) {
        skippedRecords++;
        continue;
      }
      
      const updates: any = {};
      
      // Encrypt NHS number
      if (patient.nhsNumber) {
        updates.nhsNumberEncrypted = encryptField(patient.nhsNumber);
      }
      
      // Encrypt date of birth
      if (patient.dateOfBirth) {
        updates.dateOfBirthEncrypted = encryptField(patient.dateOfBirth.toISOString());
      }
      
      // Encrypt email
      if (patient.email) {
        updates.emailEncrypted = encryptField(patient.email);
      }
      
      // Encrypt phone
      if (patient.phone) {
        updates.phoneEncrypted = encryptField(patient.phone);
      }
      
      // Encrypt address
      if (patient.address) {
        updates.addressEncrypted = encryptField(patient.address);
      }
      
      // Encrypt postcode
      if (patient.postcode) {
        updates.postcodeEncrypted = encryptField(patient.postcode);
      }
      
      // Update database
      await db
        .update(patients)
        .set(updates)
        .where(eq(patients.id, patient.id));
      
      encryptedRecords++;
      
      // Log progress every 100 records
      if (encryptedRecords % 100 === 0) {
        logger.info(`Progress: ${encryptedRecords}/${totalRecords} patients encrypted`);
      }
      
    } catch (error) {
      failedRecords++;
      logger.error({ 
        error, 
        patientId: patient.id 
      }, 'Failed to encrypt patient record');
    }
  }
  
  const duration = Date.now() - startTime;
  
  const result: MigrationStats = {
    table: tableName,
    totalRecords,
    encryptedRecords,
    failedRecords,
    skippedRecords,
    duration,
  };
  
  logger.info({ stats: result }, `Completed encryption for ${tableName} table`);
  
  return result;
}

/**
 * Encrypt users table PII
 */
async function encryptUsersTable(): Promise<MigrationStats> {
  const startTime = Date.now();
  const tableName = 'users';
  
  logger.info(`Starting encryption for ${tableName} table...`);
  
  const usersToEncrypt = await db
    .select({
      id: users.id,
      email: users.email,
      phone: users.phone,
      emailEncrypted: users.emailEncrypted,
    })
    .from(users)
    .where(isNull(users.emailEncrypted));
  
  const totalRecords = usersToEncrypt.length;
  let encryptedRecords = 0;
  let failedRecords = 0;
  let skippedRecords = 0;
  
  logger.info(`Found ${totalRecords} users to encrypt`);
  
  for (const user of usersToEncrypt) {
    try {
      if (user.emailEncrypted && isEncrypted(user.emailEncrypted)) {
        skippedRecords++;
        continue;
      }
      
      const updates: any = {};
      
      if (user.email) {
        updates.emailEncrypted = encryptField(user.email);
      }
      
      if (user.phone) {
        updates.phoneEncrypted = encryptField(user.phone);
      }
      
      await db
        .update(users)
        .set(updates)
        .where(eq(users.id, user.id));
      
      encryptedRecords++;
      
      if (encryptedRecords % 100 === 0) {
        logger.info(`Progress: ${encryptedRecords}/${totalRecords} users encrypted`);
      }
      
    } catch (error) {
      failedRecords++;
      logger.error({ 
        error, 
        userId: user.id 
      }, 'Failed to encrypt user record');
    }
  }
  
  const duration = Date.now() - startTime;
  
  const result: MigrationStats = {
    table: tableName,
    totalRecords,
    encryptedRecords,
    failedRecords,
    skippedRecords,
    duration,
  };
  
  logger.info({ stats: result }, `Completed encryption for ${tableName} table`);
  
  return result;
}

/**
 * Verify encryption results
 */
async function verifyEncryption(): Promise<void> {
  logger.info('Verifying encryption...');
  
  // Check patients
  const [patientsResult] = await db
    .select({
      total: sql<number>`COUNT(*)`,
      encrypted: sql<number>`COUNT(${patients.nhsNumberEncrypted})`,
      unencrypted: sql<number>`COUNT(${patients.nhsNumber}) - COUNT(${patients.nhsNumberEncrypted})`,
    })
    .from(patients);
  
  logger.info({ patientsResult }, 'Patients encryption status');
  
  // Check users
  const [usersResult] = await db
    .select({
      total: sql<number>`COUNT(*)`,
      encrypted: sql<number>`COUNT(${users.emailEncrypted})`,
      unencrypted: sql<number>`COUNT(${users.email}) - COUNT(${users.emailEncrypted})`,
    })
    .from(users);
  
  logger.info({ usersResult }, 'Users encryption status');
  
  // Verify format (should start with version prefix)
  const [formatCheck] = await db.execute(sql`
    SELECT 
      LEFT(nhs_number_encrypted, 3) as prefix,
      COUNT(*) as count
    FROM patients
    WHERE nhs_number_encrypted IS NOT NULL
    GROUP BY LEFT(nhs_number_encrypted, 3)
  `);
  
  logger.info({ formatCheck }, 'Encryption format verification');
  
  // Check for any remaining plaintext
  const [plaintextCheck] = await db
    .select({
      plaintextRemaining: sql<number>`COUNT(*)`,
    })
    .from(patients)
    .where(
      sql`${patients.nhsNumber} IS NOT NULL 
          AND ${patients.nhsNumberEncrypted} IS NULL`
    );
  
  if (plaintextCheck.plaintextRemaining > 0) {
    logger.warn({ 
      count: plaintextCheck.plaintextRemaining 
    }, '⚠️  Plaintext records still exist');
  } else {
    logger.info('✅ All records encrypted successfully');
  }
}

/**
 * Main migration execution
 */
async function main() {
  try {
    logger.info('🔐 Starting PHI/PII encryption migration...');
    logger.info('');
    
    // Validate environment
    validateEnvironment();
    
    // Confirm with user in production
    if (process.env.NODE_ENV === 'production') {
      logger.warn('⚠️  PRODUCTION ENVIRONMENT DETECTED');
      logger.warn('This will encrypt all PHI/PII data in the database');
      logger.warn('Press Ctrl+C to cancel, or wait 10 seconds to continue...');
      
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
    
    // Run migrations
    stats.push(await encryptPatientsTable());
    stats.push(await encryptUsersTable());
    // Add more tables as needed:
    // stats.push(await encryptPrescriptionsTable());
    // stats.push(await encryptExaminationsTable());
    
    // Verify results
    await verifyEncryption();
    
    // Print summary
    logger.info('');
    logger.info('═══════════════════════════════════════════════');
    logger.info('           ENCRYPTION MIGRATION COMPLETE        ');
    logger.info('═══════════════════════════════════════════════');
    logger.info('');
    
    for (const stat of stats) {
      logger.info(`${stat.table}:`);
      logger.info(`  Total records:     ${stat.totalRecords}`);
      logger.info(`  Encrypted:         ${stat.encryptedRecords}`);
      logger.info(`  Failed:            ${stat.failedRecords}`);
      logger.info(`  Skipped:           ${stat.skippedRecords}`);
      logger.info(`  Duration:          ${(stat.duration / 1000).toFixed(2)}s`);
      logger.info('');
    }
    
    const totalDuration = stats.reduce((sum, s) => sum + s.duration, 0);
    const totalEncrypted = stats.reduce((sum, s) => sum + s.encryptedRecords, 0);
    const totalFailed = stats.reduce((sum, s) => sum + s.failedRecords, 0);
    
    logger.info(`Total encrypted:   ${totalEncrypted} records`);
    logger.info(`Total failed:      ${totalFailed} records`);
    logger.info(`Total duration:    ${(totalDuration / 1000).toFixed(2)}s`);
    logger.info('');
    
    if (totalFailed > 0) {
      logger.error('❌ Migration completed with errors');
      logger.error('Review logs above for failed records');
      process.exit(1);
    } else {
      logger.info('✅ Migration completed successfully');
      logger.info('');
      logger.info('Next steps:');
      logger.info('1. Monitor application for 30 days');
      logger.info('2. Verify all encrypted fields decrypt correctly');
      logger.info('3. After verification, drop plaintext columns:');
      logger.info('   ALTER TABLE patients DROP COLUMN nhs_number;');
      logger.info('   ALTER TABLE patients RENAME COLUMN nhs_number_encrypted TO nhs_number;');
    }
    
  } catch (error) {
    logger.fatal({ error }, '❌ Migration failed');
    process.exit(1);
  }
}

// Run migration
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(error => {
      logger.fatal({ error }, 'Unhandled error in migration');
      process.exit(1);
    });
}

export { main as migrateEncryptPHI };
