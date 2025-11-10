# Data Migration Scripts

Example scripts for migrating data from legacy systems to ILS 2.0.

## Overview

These scripts demonstrate how to use the ILS 2.0 data import system to migrate data from various legacy systems.

## Prerequisites

```bash
# Ensure dependencies are installed
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and set DATABASE_URL and other required variables
```

## Available Scripts

### 1. Migrate from CSV Files

**Script**: `migrate-from-csv.ts`

Migrates patients and orders from CSV files.

**Usage**:
```bash
# Migrate patients
npx tsx scripts/data-migration/migrate-from-csv.ts patients /path/to/patients.csv

# Migrate orders
npx tsx scripts/data-migration/migrate-from-csv.ts orders /path/to/orders.csv

# Dry run (validate without importing)
npx tsx scripts/data-migration/migrate-from-csv.ts patients /path/to/patients.csv --dry-run

# With custom field mappings
npx tsx scripts/data-migration/migrate-from-csv.ts patients /path/to/patients.csv --mappings=mappings.json
```

### 2. Migrate from Legacy Database

**Script**: `migrate-from-database.ts`

Migrates data directly from a legacy database.

**Usage**:
```bash
# Configure legacy database connection
export LEGACY_DB_URL="postgresql://user:pass@host:5432/legacy_db"

# Migrate all patients
npx tsx scripts/data-migration/migrate-from-database.ts patients

# Migrate orders for a date range
npx tsx scripts/data-migration/migrate-from-database.ts orders --from=2024-01-01 --to=2024-12-31

# Batch size (default: 100)
npx tsx scripts/data-migration/migrate-from-database.ts patients --batch-size=500
```

### 3. Migrate from Excel

**Script**: `migrate-from-excel.ts`

Migrates data from Excel spreadsheets.

**Usage**:
```bash
# Migrate from specific sheet
npx tsx scripts/data-migration/migrate-from-excel.ts /path/to/data.xlsx --type=patients --sheet="Patient List"

# Auto-detect sheet
npx tsx scripts/data-migration/migrate-from-excel.ts /path/to/data.xlsx --type=patients
```

## CSV File Format

### Patients CSV Template

```csv
firstName,lastName,dateOfBirth,mrn,email,phone,gender,address,city,state,zipCode,country
John,Doe,1980-05-15,MRN001,john.doe@example.com,555-0100,male,123 Main St,Springfield,IL,62701,USA
Jane,Smith,1975-08-22,MRN002,jane.smith@example.com,555-0101,female,456 Oak Ave,Chicago,IL,60601,USA
```

### Orders CSV Template

```csv
patientIdentifier,orderNumber,orderDate,testType,status,priority,orderingProvider,facility
MRN001,ORD-2024-001,2024-01-15,Complete Eye Exam,completed,routine,Dr. Smith,Main Clinic
MRN002,ORD-2024-002,2024-01-16,Contact Lens Fitting,pending,urgent,Dr. Jones,North Branch
```

**Patient Identifier** can be:
- MRN (Medical Record Number)
- Email address
- External ID from legacy system

## Field Mappings

If your CSV/Excel files have different column names, create a field mappings JSON file:

**Example**: `patient-mappings.json`
```json
{
  "mappings": [
    {
      "sourceField": "first_name",
      "targetField": "firstName",
      "transform": "trim",
      "required": true
    },
    {
      "sourceField": "last_name",
      "targetField": "lastName",
      "transform": "trim",
      "required": true
    },
    {
      "sourceField": "dob",
      "targetField": "dateOfBirth",
      "transform": "date_format",
      "required": true
    },
    {
      "sourceField": "patient_email",
      "targetField": "email",
      "transform": "lowercase"
    }
  ]
}
```

Available transformations:
- `none` - No transformation
- `trim` - Remove whitespace
- `uppercase` - Convert to uppercase
- `lowercase` - Convert to lowercase
- `date_format` - Format date to YYYY-MM-DD
- `phone_format` - Format phone number
- `gender_normalize` - Normalize gender values
- `custom` - Custom JavaScript function

## Import Options

All migration scripts support these options:

### Skip Duplicates
```bash
--skip-duplicates
```
Skip records that already exist (default: true)

### Update Existing
```bash
--update-existing
```
Update existing records instead of skipping

### Validate Only
```bash
--validate-only
```
Validate data without importing

### Dry Run
```bash
--dry-run
```
Simulate import without making changes

### Batch Size
```bash
--batch-size=100
```
Number of records to process at once (default: 100)

### Continue on Error
```bash
--continue-on-error
```
Continue processing even if some records fail

## Monitoring Import Progress

### Via API

```bash
# Get import job status
curl http://localhost:5000/api/import/status/JOB_ID

# List all import jobs
curl http://localhost:5000/api/import/jobs
```

### Via Script

```typescript
import { ImportService } from './server/services/import/ImportService';

// Get job status
const status = ImportService.getImportStatus(jobId);

console.log(`Progress: ${status.progress.processed}/${status.progress.total}`);
console.log(`Successful: ${status.progress.successful}`);
console.log(`Failed: ${status.progress.failed}`);
console.log(`Skipped: ${status.progress.skipped}`);
```

## Rollback

If an import goes wrong, you can roll it back:

```bash
# Via API
curl -X POST http://localhost:5000/api/import/rollback/JOB_ID

# Via script
npx tsx scripts/data-migration/rollback-import.ts JOB_ID
```

**Note**: Rollback only works for records imported in that specific job.

## Error Handling

If imports fail, check the error log:

```typescript
const status = ImportService.getImportStatus(jobId);

status.errors.forEach((error) => {
  console.log(`Row ${error.row}: ${error.message}`);
  if (error.field) {
    console.log(`Field: ${error.field}`);
  }
  if (error.data) {
    console.log(`Data:`, error.data);
  }
});
```

Common errors:
- **Validation errors**: Data doesn't match expected format
- **Duplicate records**: Record already exists (if skip-duplicates is false)
- **Patient not found**: For order imports, patient doesn't exist
- **Date format errors**: Invalid date format (use YYYY-MM-DD)
- **Required field missing**: Required field is empty

## Best Practices

1. **Always start with a dry run**
   ```bash
   --dry-run
   ```

2. **Test with a small sample first**
   ```bash
   --batch-size=10
   ```

3. **Validate your data before importing**
   ```bash
   --validate-only
   ```

4. **Back up your database before large imports**
   ```bash
   ./scripts/backup/backup-database.sh
   ```

5. **Monitor import progress**
   - Use the API to check status
   - Review error logs
   - Monitor system resources

6. **Handle errors gracefully**
   - Use `--continue-on-error` for large imports
   - Review failed records
   - Fix and re-import failed records

7. **Clean up old import jobs**
   ```typescript
   ImportService.cleanupOldJobs(24); // Clean up jobs older than 24 hours
   ```

## Performance Tips

1. **Batch size**: Adjust based on your system
   - Small batches (50-100): Safer, easier to troubleshoot
   - Large batches (500-1000): Faster, uses more memory

2. **Database connections**: Monitor connection pool usage

3. **Memory**: Large imports may require more memory
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" npx tsx script.ts
   ```

4. **Parallel imports**: Don't run multiple large imports simultaneously

## Troubleshooting

### Import is slow
- Reduce batch size
- Check database performance
- Monitor system resources

### Out of memory errors
- Reduce batch size
- Increase Node.js memory limit
- Process in smaller chunks

### Validation errors
- Check CSV/Excel format
- Verify field mappings
- Review date formats
- Check required fields

### Duplicate detection not working
- Verify unique identifiers (MRN, email, externalId)
- Check for data quality issues
- Review matching logic

## Support

For issues or questions:
1. Check the logs in `logs/import.log`
2. Review the API error responses
3. Consult the main documentation at `docs/DATA_MIGRATION.md`
4. Check the production cutover plan at `docs/PRODUCTION_CUTOVER_PLAN.md`
