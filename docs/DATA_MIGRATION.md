# Data Migration Guide

Comprehensive guide for migrating data from legacy systems to ILS 2.0.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Data Import System](#data-import-system)
- [Preparing Data for Migration](#preparing-data-for-migration)
- [Migration Process](#migration-process)
- [Validation and Testing](#validation-and-testing)
- [Monitoring and Troubleshooting](#monitoring-and-troubleshooting)
- [Rollback Procedures](#rollback-procedures)
- [Best Practices](#best-practices)
- [FAQ](#faq)

---

## Overview

The ILS 2.0 data migration system provides a robust, validated, and auditable way to import data from legacy systems, CSV files, Excel spreadsheets, or other databases.

### Key Features

- **Multi-format support**: CSV, Excel (XLS, XLSX)
- **Automatic validation**: Data quality checks before import
- **Field mapping**: Map legacy field names to ILS 2.0 schema
- **Duplicate detection**: Skip or update existing records
- **Batch processing**: Handle large datasets efficiently
- **Progress tracking**: Real-time import status monitoring
- **Error handling**: Continue on error with detailed error reporting
- **Rollback capability**: Undo imports if needed
- **Audit trail**: Complete import history and logging

### Supported Data Types

1. **Patients**: Patient demographics, contact information, medical history
2. **Orders**: Lab orders, test results, clinical data

---

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────────┐
│                     Data Import System                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  CSV Parser  │  │Excel Parser  │  │  API Import  │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                  │                  │                  │
│         └──────────────────┴──────────────────┘                  │
│                            │                                      │
│                   ┌────────▼────────┐                           │
│                   │  Data Transform │                           │
│                   │     Service     │                           │
│                   └────────┬────────┘                           │
│                            │                                      │
│                   ┌────────▼────────┐                           │
│                   │     Validator   │                           │
│                   └────────┬────────┘                           │
│                            │                                      │
│                   ┌────────▼────────┐                           │
│                   │  Import Service │                           │
│                   │ (Batch Processing,│                         │
│                   │  Status Tracking)│                          │
│                   └────────┬────────┘                           │
│                            │                                      │
│                   ┌────────▼────────┐                           │
│                   │    Database     │                           │
│                   └─────────────────┘                           │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Parse**: Read data from CSV/Excel/API
2. **Transform**: Map fields and apply transformations
3. **Validate**: Check data quality and format
4. **Process**: Insert/update in batches
5. **Track**: Monitor progress and errors
6. **Audit**: Log all activities

---

## Prerequisites

### System Requirements

- Node.js 20+
- PostgreSQL 14+
- Minimum 4GB RAM for large imports
- Sufficient disk space for temporary files

### Database Preparation

```bash
# Backup database before migration
./scripts/backup/backup-database.sh

# Verify database connectivity
psql $DATABASE_URL -c "SELECT version();"

# Check available disk space
df -h
```

### Environment Setup

```bash
# Install dependencies
npm install csv-parse xlsx

# Configure environment
cp .env.example .env

# Required environment variables
DATABASE_URL=postgresql://user:pass@host:5432/ils_db
LOG_LEVEL=info
```

---

## Data Import System

### API Endpoints

#### Preview Import File

**POST** `/api/import/preview`

Upload a file to preview data and get field mapping suggestions.

```bash
curl -X POST http://localhost:5000/api/import/preview \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@patients.csv" \
  -F "type=patients" \
  -F "sampleSize=10"
```

Response:
```json
{
  "success": true,
  "preview": {
    "headers": ["firstName", "lastName", "dateOfBirth", "email"],
    "records": [...],
    "totalRows": 1000,
    "suggestedMappings": [...]
  }
}
```

#### Start Import

**POST** `/api/import/start`

Start an import job.

```bash
curl -X POST http://localhost:5000/api/import/start \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@patients.csv" \
  -F "type=patients" \
  -F "source=legacy_system" \
  -F 'options={"skipDuplicates":true,"batchSize":100}' \
  -F 'fieldMappings=[...]'
```

Response:
```json
{
  "success": true,
  "jobId": "123e4567-e89b-12d3-a456-426614174000",
  "message": "Import job started"
}
```

#### Check Import Status

**GET** `/api/import/status/:jobId`

Get import job status and progress.

```bash
curl http://localhost:5000/api/import/status/JOB_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response:
```json
{
  "success": true,
  "status": {
    "id": "JOB_ID",
    "status": "processing",
    "progress": {
      "total": 1000,
      "processed": 500,
      "successful": 480,
      "failed": 10,
      "skipped": 10
    },
    "errors": [...]
  }
}
```

#### Rollback Import

**POST** `/api/import/rollback/:jobId`

Rollback an import job.

```bash
curl -X POST http://localhost:5000/api/import/rollback/JOB_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Command Line Scripts

#### Migrate from CSV

```bash
npx tsx scripts/data-migration/migrate-from-csv.ts patients data/patients.csv
```

#### Migrate with Options

```bash
npx tsx scripts/data-migration/migrate-from-csv.ts patients data/patients.csv \
  --dry-run \
  --batch-size=100 \
  --skip-duplicates \
  --continue-on-error
```

---

## Preparing Data for Migration

### Data Format Requirements

#### Patient Data

**Required Fields**:
- `firstName` - Patient first name
- `lastName` - Patient last name
- `dateOfBirth` - Birth date (YYYY-MM-DD format)

**Optional Fields**:
- `mrn` - Medical Record Number (unique identifier)
- `email` - Email address
- `phone` - Phone number
- `gender` - Gender (male, female, other, unknown)
- `address`, `city`, `state`, `zipCode`, `country`
- `externalId` - ID from legacy system
- `importSource` - Name of source system
- `notes` - Additional notes

**Example CSV**:
```csv
firstName,lastName,dateOfBirth,mrn,email,phone,gender
John,Doe,1980-05-15,MRN001,john@example.com,555-0100,male
Jane,Smith,1975-08-22,MRN002,jane@example.com,555-0101,female
```

#### Order Data

**Required Fields**:
- `patientIdentifier` - Patient MRN, email, or external ID
- `orderNumber` - Unique order number
- `orderDate` - Order date (YYYY-MM-DD)
- `testType` - Type of test/exam

**Optional Fields**:
- `status` - Order status (pending, in_progress, completed, cancelled, failed)
- `priority` - Priority level (routine, urgent, stat)
- `orderingProvider` - Provider name
- `facility` - Facility name
- `department` - Department name
- `resultDate`, `resultValue`, `resultUnit`, `interpretation`
- `externalId`, `importSource`, `notes`

**Example CSV**:
```csv
patientIdentifier,orderNumber,orderDate,testType,status,priority
MRN001,ORD-001,2024-01-15,Complete Eye Exam,completed,routine
MRN002,ORD-002,2024-01-16,Contact Lens Fitting,pending,urgent
```

### Data Cleaning

Before migration, ensure data quality:

1. **Remove duplicates** in source data
2. **Validate dates** (use YYYY-MM-DD format)
3. **Normalize phone numbers** (remove special characters)
4. **Validate email addresses**
5. **Handle null values** appropriately
6. **Check character encoding** (use UTF-8)
7. **Remove invalid characters** from text fields

### Field Mapping

If your legacy system uses different field names:

**Create**: `field-mappings.json`
```json
{
  "mappings": [
    {
      "sourceField": "patient_first_name",
      "targetField": "firstName",
      "transform": "trim",
      "required": true
    },
    {
      "sourceField": "patient_last_name",
      "targetField": "lastName",
      "transform": "trim",
      "required": true
    },
    {
      "sourceField": "birth_date",
      "targetField": "dateOfBirth",
      "transform": "date_format",
      "required": true
    },
    {
      "sourceField": "patient_email",
      "targetField": "email",
      "transform": "lowercase"
    },
    {
      "sourceField": "phone_number",
      "targetField": "phone",
      "transform": "phone_format"
    }
  ]
}
```

**Use mapping**:
```bash
npx tsx scripts/data-migration/migrate-from-csv.ts patients data.csv \
  --mappings=field-mappings.json
```

### Available Transformations

| Transform | Description | Example |
|-----------|-------------|---------|
| `none` | No transformation | - |
| `trim` | Remove whitespace | `" John "` → `"John"` |
| `uppercase` | Convert to uppercase | `"john"` → `"JOHN"` |
| `lowercase` | Convert to lowercase | `"JOHN"` → `"john"` |
| `date_format` | Format to YYYY-MM-DD | `"01/15/2024"` → `"2024-01-15"` |
| `phone_format` | Format phone number | `"5550100"` → `"(555) 010-0"` |
| `gender_normalize` | Normalize gender | `"M"` → `"male"` |
| `boolean_convert` | Convert to boolean | `"yes"` → `true` |
| `empty_to_null` | Convert empty to null | `""` → `null` |

---

## Migration Process

### Step-by-Step Guide

#### Step 1: Prepare and Validate

```bash
# 1. Backup database
./scripts/backup/backup-database.sh

# 2. Validate data file
npx tsx scripts/data-migration/migrate-from-csv.ts patients data.csv --validate-only

# 3. Preview data
curl -X POST http://localhost:5000/api/import/preview \
  -F "file=@data.csv" -F "type=patients"
```

#### Step 2: Test with Sample

```bash
# Create sample file with first 100 rows
head -n 101 data.csv > sample.csv

# Test import with sample
npx tsx scripts/data-migration/migrate-from-csv.ts patients sample.csv --dry-run

# If successful, import sample
npx tsx scripts/data-migration/migrate-from-csv.ts patients sample.csv
```

#### Step 3: Full Migration

```bash
# Import full dataset
npx tsx scripts/data-migration/migrate-from-csv.ts patients data.csv \
  --batch-size=100 \
  --skip-duplicates \
  --continue-on-error
```

#### Step 4: Verify Results

```bash
# Check import status
curl http://localhost:5000/api/import/status/JOB_ID

# Verify record counts
psql $DATABASE_URL -c "SELECT COUNT(*) FROM patients;"

# Sample verification
psql $DATABASE_URL -c "SELECT * FROM patients LIMIT 10;"
```

---

## Validation and Testing

### Pre-Migration Validation

```bash
# Validate data without importing
npx tsx scripts/data-migration/migrate-from-csv.ts patients data.csv --validate-only
```

### Post-Migration Verification

```sql
-- Count total records
SELECT COUNT(*) FROM patients;

-- Check for duplicates
SELECT mrn, COUNT(*)
FROM patients
GROUP BY mrn
HAVING COUNT(*) > 1;

-- Verify date formats
SELECT * FROM patients
WHERE date_of_birth !~ '^\d{4}-\d{2}-\d{2}$'
LIMIT 10;

-- Check for null required fields
SELECT * FROM patients
WHERE name IS NULL OR date_of_birth IS NULL
LIMIT 10;
```

### Data Quality Checks

```sql
-- Email format validation
SELECT * FROM patients
WHERE email IS NOT NULL
  AND email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'
LIMIT 10;

-- Date range validation
SELECT * FROM patients
WHERE date_of_birth < '1900-01-01'
   OR date_of_birth > CURRENT_DATE;

-- Orphaned orders (orders without patients)
SELECT o.*
FROM orders o
LEFT JOIN patients p ON o.patient_id = p.id
WHERE p.id IS NULL;
```

---

## Monitoring and Troubleshooting

### Monitor Import Progress

#### Via API
```bash
# Poll for status
while true; do
  curl -s http://localhost:5000/api/import/status/JOB_ID | jq '.status.progress'
  sleep 5
done
```

#### Via Script
```typescript
import { ImportService } from './server/services/import/ImportService';

const jobId = 'YOUR_JOB_ID';
const interval = setInterval(() => {
  const status = ImportService.getImportStatus(jobId);

  if (!status) {
    clearInterval(interval);
    return;
  }

  console.log(`Progress: ${status.progress.processed}/${status.progress.total}`);

  if (status.status === 'completed' || status.status === 'failed') {
    clearInterval(interval);
  }
}, 1000);
```

### Common Issues

#### Issue: Validation Errors

**Symptoms**: Import fails with validation errors

**Solutions**:
1. Check date formats (must be YYYY-MM-DD)
2. Verify required fields are present
3. Check field lengths (e.g., email < 255 chars)
4. Review transformation rules

#### Issue: Duplicate Records

**Symptoms**: Records being skipped

**Solutions**:
1. Check MRN/email uniqueness in source data
2. Use `--update-existing` to update instead of skip
3. Review duplicate detection logic

#### Issue: Patient Not Found (Orders)

**Symptoms**: Order import fails with "Patient not found"

**Solutions**:
1. Ensure patients are imported first
2. Verify patientIdentifier matches MRN/email/externalId
3. Check for case sensitivity in identifiers

#### Issue: Memory Errors

**Symptoms**: Out of memory errors during large imports

**Solutions**:
1. Reduce batch size: `--batch-size=50`
2. Increase Node memory: `NODE_OPTIONS="--max-old-space-size=4096"`
3. Split large files into smaller chunks

---

## Rollback Procedures

### Automatic Rollback

```bash
# Via API
curl -X POST http://localhost:5000/api/import/rollback/JOB_ID

# Via script
npx tsx scripts/data-migration/rollback-import.ts JOB_ID
```

### Manual Rollback

```sql
-- Identify imported records by import source
DELETE FROM patients
WHERE import_source = 'csv_migration_1234567890';

-- Restore from backup
./scripts/backup/restore-database.sh backup_20240115.sql.gz
```

**⚠️ Warning**: Automatic rollback only works for records imported in that specific job. For comprehensive rollback, use database backup restoration.

---

## Best Practices

### Data Migration

1. **Always backup first** - Create database backup before any import
2. **Start small** - Test with sample data before full migration
3. **Validate thoroughly** - Use `--validate-only` and `--dry-run`
4. **Monitor actively** - Watch import progress and errors
5. **Document everything** - Keep records of migration parameters
6. **Test rollback** - Verify rollback procedures work

### Performance

1. **Optimize batch size** - Balance speed vs. memory (50-100 recommended)
2. **Process during off-hours** - Minimize impact on production
3. **Monitor resources** - Watch CPU, memory, database connections
4. **Use indexes** - Ensure unique indexes on MRN, email for faster lookups
5. **Disable triggers temporarily** - If safe, for faster inserts

### Data Quality

1. **Clean source data** - Fix issues before import
2. **Validate formats** - Especially dates and emails
3. **Handle nulls consistently** - Define null handling strategy
4. **Check duplicates** - In both source and target
5. **Verify relationships** - Import patients before orders

---

## FAQ

### Can I import data while users are active?

Yes, but it's recommended to import during off-hours. The import system uses batch processing and won't block regular operations, but may impact performance.

### What happens if the import fails midway?

The system continues processing or stops based on the `--continue-on-error` flag. You can rollback completed records using the rollback endpoint.

### How do I handle very large files (>1GB)?

Split large files into smaller chunks (e.g., 100K records each) and import sequentially. Monitor memory usage and adjust batch size accordingly.

### Can I resume a failed import?

Not directly. You'll need to identify failed records and re-import them. The import system logs all errors for easy identification.

### How do I import data from multiple legacy systems?

Use different `importSource` values for each system. This helps track data provenance and facilitates system-specific rollbacks.

### What if field names don't match?

Create a field mappings JSON file with source-to-target mappings and use the `--mappings` option.

### Can I customize data transformations?

Yes, use the `custom` transform type with a JavaScript function in your field mapping configuration.

### How long are import jobs retained?

Import jobs are retained for 24 hours by default. Call `ImportService.cleanupOldJobs()` to customize retention.

---

## Support and Resources

- **Migration Scripts**: `scripts/data-migration/`
- **API Documentation**: `/api-docs`
- **Production Cutover**: `docs/PRODUCTION_CUTOVER_PLAN.md`
- **Runbooks**: `docs/RUNBOOKS.md`
- **Issues**: Report migration issues via support channels

---

**Document Version**: 1.0
**Last Updated**: 2024-01-15
**Next Review**: After first production migration
