#!/usr/bin/env node
/**
 * CSV Data Migration Script
 *
 * Migrates patients or orders from CSV files to ILS 2.0
 */

import { parseImportFile } from '../../server/utils/import-parsers.js';
import { ImportService } from '../../server/services/import/ImportService.js';
import { DataTransformService } from '../../server/services/import/DataTransformService.js';
import type { BatchImportRequest, FieldMapping } from '../../server/validation/import.js';
import { readFile } from 'fs/promises';
import { resolve } from 'path';

interface MigrationOptions {
  type: 'patients' | 'orders';
  filePath: string;
  mappingsPath?: string;
  dryRun?: boolean;
  skipDuplicates?: boolean;
  updateExisting?: boolean;
  batchSize?: number;
  continueOnError?: boolean;
}

/**
 * Parse command line arguments
 */
function parseArgs(): MigrationOptions {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: migrate-from-csv.ts <type> <file-path> [options]');
    console.error('');
    console.error('Arguments:');
    console.error('  type         Type of data: patients or orders');
    console.error('  file-path    Path to CSV file');
    console.error('');
    console.error('Options:');
    console.error('  --mappings=<path>      Path to field mappings JSON file');
    console.error('  --dry-run              Validate without importing');
    console.error('  --skip-duplicates      Skip duplicate records (default: true)');
    console.error('  --update-existing      Update existing records');
    console.error('  --batch-size=<n>       Batch size (default: 100)');
    console.error('  --continue-on-error    Continue on errors');
    console.error('');
    console.error('Examples:');
    console.error('  migrate-from-csv.ts patients data/patients.csv');
    console.error('  migrate-from-csv.ts orders data/orders.csv --dry-run');
    console.error('  migrate-from-csv.ts patients data/patients.csv --mappings=mappings.json');
    process.exit(1);
  }

  const type = args[0] as 'patients' | 'orders';
  const filePath = args[1];

  if (!['patients', 'orders'].includes(type)) {
    console.error('Error: Type must be "patients" or "orders"');
    process.exit(1);
  }

  const options: MigrationOptions = {
    type,
    filePath,
  };

  // Parse optional arguments
  for (const arg of args.slice(2)) {
    if (arg.startsWith('--mappings=')) {
      options.mappingsPath = arg.split('=')[1];
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--skip-duplicates') {
      options.skipDuplicates = true;
    } else if (arg === '--update-existing') {
      options.updateExisting = true;
    } else if (arg.startsWith('--batch-size=')) {
      options.batchSize = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--continue-on-error') {
      options.continueOnError = true;
    }
  }

  return options;
}

/**
 * Load field mappings from JSON file
 */
async function loadMappings(path: string): Promise<FieldMapping[]> {
  try {
    const content = await readFile(path, 'utf-8');
    const json = JSON.parse(content);
    return json.mappings || [];
  } catch (error) {
    console.error(`Error loading mappings from ${path}:`, error);
    throw error;
  }
}

/**
 * Display progress
 */
function displayProgress(jobId: string) {
  const interval = setInterval(() => {
    const status = ImportService.getImportStatus(jobId);

    if (!status) {
      clearInterval(interval);
      return;
    }

    const { progress } = status;
    const percentage = Math.round((progress.processed / progress.total) * 100);

    console.log(
      `Progress: ${progress.processed}/${progress.total} (${percentage}%) | ` +
      `✓ ${progress.successful} | ✗ ${progress.failed} | ⊘ ${progress.skipped}`
    );

    if (status.status === 'completed' || status.status === 'failed' || status.status === 'cancelled') {
      clearInterval(interval);
    }
  }, 1000);

  return interval;
}

/**
 * Main migration function
 */
async function migrate(options: MigrationOptions): Promise<void> {
  console.log('='.repeat(80));
  console.log('CSV DATA MIGRATION');
  console.log('='.repeat(80));
  console.log();
  console.log(`Type:      ${options.type}`);
  console.log(`File:      ${options.filePath}`);
  console.log(`Dry Run:   ${options.dryRun ? 'Yes' : 'No'}`);
  console.log();

  // Resolve file path
  const filePath = resolve(options.filePath);

  // Parse CSV file
  console.log('📁 Parsing CSV file...');
  const parseResult = await parseImportFile(filePath);

  if (parseResult.errors.length > 0) {
    console.error('❌ CSV parsing failed:');
    parseResult.errors.forEach((error) => {
      console.error(`  Row ${error.row}: ${error.message}`);
    });
    process.exit(1);
  }

  console.log(`✓ Parsed ${parseResult.totalRows} rows (${parseResult.records.length} data rows)`);
  console.log(`  Headers: ${parseResult.headers.join(', ')}`);
  console.log();

  // Load field mappings if provided
  let fieldMappings: FieldMapping[] | undefined;

  if (options.mappingsPath) {
    console.log('📋 Loading field mappings...');
    fieldMappings = await loadMappings(options.mappingsPath);
    console.log(`✓ Loaded ${fieldMappings.length} field mappings`);
    console.log();
  } else {
    // Auto-detect field mappings
    console.log('🔍 Auto-detecting field mappings...');
    fieldMappings = DataTransformService.autoDetectMappings(
      options.type,
      parseResult.headers
    );
    console.log(`✓ Detected ${fieldMappings.length} field mappings`);

    if (fieldMappings.length > 0) {
      console.log('  Mappings:');
      fieldMappings.forEach((mapping) => {
        console.log(`    ${mapping.sourceField} → ${mapping.targetField} (${mapping.transform})`);
      });
    }
    console.log();
  }

  // Transform records
  console.log('🔄 Transforming records...');
  const transformedRecords = DataTransformService.transformBatch(
    parseResult.records,
    options.type,
    fieldMappings
  );
  console.log(`✓ Transformed ${transformedRecords.length} records`);
  console.log();

  // Create import request
  const importRequest: BatchImportRequest = {
    type: options.type,
    source: `csv_migration_${Date.now()}`,
    options: {
      skipDuplicates: options.skipDuplicates ?? true,
      updateExisting: options.updateExisting ?? false,
      validateOnly: false,
      batchSize: options.batchSize ?? 100,
      continueOnError: options.continueOnError ?? false,
      dryRun: options.dryRun ?? false,
    },
    metadata: {
      description: `CSV migration from ${options.filePath}`,
      importedBy: 'migration-script',
      tags: ['csv', 'migration'],
    },
  };

  // Create and execute import job
  console.log('🚀 Starting import...');
  const jobId = await ImportService.createImportJob(
    options.type,
    transformedRecords,
    importRequest,
    'migration-script'
  );

  console.log(`Job ID: ${jobId}`);
  console.log();

  // Display progress
  const progressInterval = displayProgress(jobId);

  // Execute import
  const finalStatus = await ImportService.executeImport(jobId);

  // Clear progress interval
  clearInterval(progressInterval);

  // Display final results
  console.log();
  console.log('='.repeat(80));
  console.log('MIGRATION RESULTS');
  console.log('='.repeat(80));
  console.log();
  console.log(`Status:     ${finalStatus.status.toUpperCase()}`);
  console.log(`Total:      ${finalStatus.progress.total}`);
  console.log(`Processed:  ${finalStatus.progress.processed}`);
  console.log(`Successful: ${finalStatus.progress.successful}`);
  console.log(`Failed:     ${finalStatus.progress.failed}`);
  console.log(`Skipped:    ${finalStatus.progress.skipped}`);
  console.log();

  if (finalStatus.errors.length > 0) {
    console.log('Errors:');
    finalStatus.errors.slice(0, 10).forEach((error) => {
      console.log(`  Row ${error.row}: [${error.field}] ${error.message}`);
    });

    if (finalStatus.errors.length > 10) {
      console.log(`  ... and ${finalStatus.errors.length - 10} more errors`);
    }
    console.log();
  }

  // Exit with appropriate code
  if (finalStatus.status === 'completed' && finalStatus.progress.failed === 0) {
    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } else if (finalStatus.status === 'completed' && finalStatus.progress.failed > 0) {
    console.log('⚠️  Migration completed with errors');
    process.exit(1);
  } else {
    console.log('❌ Migration failed');
    process.exit(1);
  }
}

// Run migration
const options = parseArgs();
migrate(options).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
