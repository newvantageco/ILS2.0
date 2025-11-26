# Enterprise Practice Migration Guide
## Migrating from Optix, Occuco, Acuity, and Other Optical Practice Management Systems

**Complete guide for migrating years of practice data to ILS 2.0 with full multi-tenant isolation**

---

## Table of Contents

1. [Overview](#overview)
2. [Migration System Architecture](#migration-system-architecture)
3. [Pre-Migration Checklist](#pre-migration-checklist)
4. [Legal Requirements & Compliance](#legal-requirements--compliance)
5. [Data Preparation](#data-preparation)
6. [Migration Process](#migration-process)
7. [Supported Platforms](#supported-platforms)
8. [File Size & Data Limits](#file-size--data-limits)
9. [Multi-Tenant Data Isolation](#multi-tenant-data-isolation)
10. [Validation & Testing](#validation--testing)
11. [Go-Live Procedures](#go-live-procedures)
12. [Troubleshooting](#troubleshooting)

---

## Overview

ILS 2.0 provides a comprehensive, enterprise-grade migration system that:

✅ **Handles unlimited data volumes** - No 5MB restrictions, processes GBs of practice data
✅ **Multi-tenant ready** - Every company's data is completely isolated
✅ **Pre-configured for common platforms** - Optix, Occuco, Acuity presets included
✅ **HIPAA compliant** - Full encryption, audit trails, BAA support
✅ **Rollback capable** - Can undo migrations if needed
✅ **Progress tracking** - Real-time status and error reporting

### What Data Can Be Migrated

**✅ Supported (Text-based clinical data):**
- Patient demographics and contact information
- Eye examination records (all test results and findings)
- Prescription history (Rx values, issue dates, expiry)
- Dispense records (frames, lenses, sales)
- Appointment history
- Clinical notes and observations
- Lab orders and tracking
- Financial records (invoices, payments)
- Insurance claims and NHS vouchers

**❌ Excluded (Large binary files):**
- Retinal images, OCT scans
- Diagnostic imaging files
- Patient photographs
- Scanned documents

**Estimated Data Size (text-only):**
- Small practice (1,000 patients, 5 years): ~300MB
- Medium practice (5,000 patients, 10 years): ~1.5GB
- Large practice (10,000 patients, 15 years): ~3-5GB

---

## Migration System Architecture

### Multi-Tenant Design

```
┌─────────────────────────────────────────────────────────┐
│                  ILS 2.0 Platform                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Company A (companyId: abc123)                         │
│  ├── Patients: 5,000 records                           │
│  ├── Examinations: 25,000 records                      │
│  ├── Prescriptions: 20,000 records                     │
│  └── Migration Job: MIG-001-2025                       │
│      ├── Status: Completed                             │
│      ├── Source: Optix                                 │
│      └── Can Rollback: Yes                             │
│                                                         │
│  Company B (companyId: xyz789)                         │
│  ├── Patients: 3,000 records                           │
│  ├── Examinations: 15,000 records                      │
│  ├── Prescriptions: 12,000 records                     │
│  └── Migration Job: MIG-002-2025                       │
│      ├── Status: Processing                            │
│      ├── Source: Occuco                                │
│      └── Progress: 45% (6,750/15,000)                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Key Features:**
- Every record scoped to `companyId`
- Row-Level Security (RLS) at database level
- Application-level guards for defense-in-depth
- Separate migration jobs per company
- Individual rollback capability

### Migration Tracking Tables

**migration_jobs**
- Tracks each migration project
- Links to company (companyId)
- Stores progress, errors, configuration

**migration_records**
- Individual record tracking
- Maps externalId → internalId
- Enables surgical rollback
- Audit trail for compliance

**migration_presets**
- Pre-configured field mappings
- Platform-specific (Optix, Occuco, Acuity)
- Company-specific custom presets

**business_associate_agreements**
- HIPAA BAA tracking
- Signature verification
- Compliance audit trail

---

## Pre-Migration Checklist

### Legal & Compliance

- [ ] **Sign Business Associate Agreement (BAA)** with ILS 2.0
  - Template: `docs/legal/BUSINESS_ASSOCIATE_AGREEMENT_TEMPLATE.md`
  - Required for HIPAA compliance
  - Defines data protection responsibilities

- [ ] **Request data export from current vendor**
  - Template: `docs/legal/VENDOR_DATA_REQUEST_TEMPLATE.md`
  - Send certified mail with tracking
  - Follow up every 5 days
  - Escalate to HHS OCR if non-compliant after 30 days

- [ ] **Obtain patient consent** (if required)
  - Review state-specific requirements
  - Most migrations covered under Treatment, Payment, Operations (TPO)

### Technical Preparation

- [ ] **Identify current software version**
  - Optix, Occuco, Acuity version number
  - Custom configurations or plugins
  - Integration with other systems

- [ ] **Document current workflow**
  - How many users?
  - Peak usage times
  - Critical business processes
  - Integration dependencies

- [ ] **Plan migration timing**
  - Schedule during off-hours or practice closure
  - Allow 2-4 weeks for testing
  - Plan parallel run period (optional)

- [ ] **Assign migration team**
  - Project lead (practice manager)
  - IT contact
  - Clinical lead (for validation)
  - ILS 2.0 migration specialist

### Data Inventory

- [ ] **Estimate record counts**
  - Number of patients
  - Number of examinations
  - Number of prescriptions
  - Historical date range (how many years?)

- [ ] **Identify custom fields**
  - Any custom data fields in current system?
  - Special codes or abbreviations used?
  - Legacy data from even older systems?

---

## Legal Requirements & Compliance

### HIPAA Requirements

**Business Associate Agreement (BAA) - REQUIRED**

Before any PHI transfer:
1. Review BAA template in `docs/legal/BUSINESS_ASSOCIATE_AGREEMENT_TEMPLATE.md`
2. Customize for your practice
3. Sign electronically or wet signature
4. Store signed copy securely
5. Upload to ILS 2.0 migration portal

**What the BAA covers:**
- Permitted uses of PHI (migration, platform services)
- Security safeguards (encryption, access controls)
- Breach notification procedures
- Data return/destruction upon termination
- Subcontractor agreements (cloud providers, etc.)

**Penalties for non-compliance:**
- HIPAA violations: $100 - $50,000 per violation
- Maximum: $1.5M per year per violation category
- Criminal penalties for willful neglect

### 21st Century Cures Act - Information Blocking

**Your Rights:**
- Current vendor CANNOT withhold your data
- Cannot charge excessive fees
- Cannot impose unreasonable conditions
- Must provide data within 30 days

**Vendor penalties for information blocking:**
- $1,000,000+ per violation
- HHS enforcement action
- Public disclosure of violations

**How to enforce:**
1. Send formal data request (use template)
2. Document all communications
3. Escalate to vendor legal/compliance after 15 days
4. File ONC complaint after 30 days: https://www.healthit.gov/report-info-blocking

### GDPR (UK/EU Practices)

**Additional requirements:**
- Data Processing Agreement (DPA)
- Right to data portability (Article 20)
- Consent for processing (may be required)
- Transfer safeguards (encryption, pseudonymization)

**ILS 2.0 GDPR compliance:**
- Data processing addendum available
- EU data residency options
- Right to be forgotten support
- Automated data export

---

## Data Preparation

### Step 1: Receive Data from Old Vendor

**Expected formats:**
- CSV files (most common)
- Excel workbooks (.xlsx)
- SQL database dumps
- API exports (rare)

**Verify you received:**
- [ ] Patient demographics
- [ ] Examination records
- [ ] Prescription history
- [ ] Dispense records
- [ ] Appointments
- [ ] Financial data
- [ ] Data dictionary/field explanations

### Step 2: Data Cleaning

**Common issues to fix:**

**1. Date Formats**
```
Bad: 01/05/2024 (ambiguous - US vs UK)
Good: 2024-05-01 (ISO 8601 - YYYY-MM-DD)
```

**2. Phone Numbers**
```
Bad: (555) 123-4567, 555.123.4567
Good: +1-555-123-4567 (E.164 format)
```

**3. Missing Required Fields**
```
Required: firstName, lastName, dateOfBirth
Action: Fill in from other sources or mark as "(unknown)"
```

**4. Duplicate Records**
```
Check for duplicates by:
- NHS Number (UK)
- Email address
- Phone number
- Name + DOB combination
```

**5. Invalid Values**
```
Gender: M/F → male/female
Status: A/I → active/inactive
Dates: 99/99/9999 → null
```

### Step 3: Field Mapping

**Use pre-configured presets:**

```typescript
// Optix preset already configured
Source Field          → ILS 2.0 Field
─────────────────────────────────────────
patient_id            → externalId
first_name            → firstName
last_name             → lastName
dob                   → dateOfBirth
email                 → email
mobile                → mobilePhone
nhs_number            → nhsNumber
```

**For custom fields:**

Create custom mapping JSON:
```json
{
  "mappings": [
    {
      "sourceField": "custom_field_name",
      "targetField": "notes",
      "transform": "append",
      "prefix": "Custom: "
    }
  ]
}
```

---

## Migration Process

### Method 1: Web-Based Import (Admin Users - Unlimited Size)

**For Platform Admins and Company Admins:**

```bash
# No file size limit for authenticated admin users
# Processes files of any size (GB+)
```

**Steps:**
1. Log in as Company Admin or Platform Admin
2. Navigate to Settings → Data Migration
3. Click "New Migration Job"
4. Select source system (Optix, Occuco, Acuity, or Manual CSV)
5. Upload files (multiple files supported)
6. Review auto-detected field mappings
7. Adjust mappings if needed
8. Configure options:
   - Skip duplicates: Yes/No
   - Update existing: Yes/No
   - Batch size: 100-1000
   - Continue on error: Yes/No
9. Start validation (dry run)
10. Review validation results
11. Start full import
12. Monitor progress in real-time

### Method 2: CLI Migration (Recommended for Large Datasets)

**Best for:**
- Files > 100MB
- 10,000+ records
- Automated migrations
- Batch processing

**Process:**

```bash
# 1. Upload your CSV file to server
scp patients.csv user@server:/data/migration/

# 2. Run migration script with company context
npx tsx scripts/data-migration/migrate-from-csv.ts \
  patients \
  /data/migration/patients.csv \
  --company-id=abc123 \
  --source-system=optix \
  --preset=optix-patients \
  --batch-size=1000 \
  --skip-duplicates \
  --continue-on-error

# 3. Monitor progress
tail -f logs/migration.log

# 4. Verify results
npx tsx scripts/data-migration/verify-migration.ts abc123 MIG-001-2025
```

### Method 3: API-Based Import

**For custom integrations:**

```typescript
// Create migration job
const response = await fetch('/api/migrations', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    companyId: 'abc123',
    sourceSystem: 'optix',
    dataTypes: ['patients', 'examinations', 'prescriptions'],
    presetId: 'optix-patient-import'
  })
});

const { migrationJobId } = await response.json();

// Upload data in chunks
for (const chunk of dataChunks) {
  await fetch(`/api/migrations/${migrationJobId}/records`, {
    method: 'POST',
    body: JSON.stringify({ records: chunk })
  });
}

// Complete migration
await fetch(`/api/migrations/${migrationJobId}/complete`, {
  method: 'POST'
});
```

---

## Supported Platforms

### Optix

**Data Export:**
- CSV export available from Reports → Data Export
- Exports: Patients, Appointments, Examinations, Prescriptions, Dispenses
- Date format: DD/MM/YYYY (UK)
- Phone format: UK standard

**Pre-configured mappings:**
- ✅ Patient demographics
- ✅ Eye examinations
- ✅ Prescriptions
- ⚠️ Dispenses (may require custom mapping)

**Known issues:**
- Visual acuity format varies (6/6, 6/9 vs 20/20 notation)
- Custom fields stored in notes
- Some prescription data in JSON format

**Migration time:**
- 5,000 patients: ~15 minutes
- 25,000 examinations: ~45 minutes
- Total: 1-2 hours

### Occuco

**Data Export:**
- SQL Server database export
- CSV export from custom reports
- API access (limited)
- Date format: DD/MM/YYYY (UK)

**Pre-configured mappings:**
- ✅ Patient demographics
- ✅ Eye examinations
- ✅ Prescriptions
- ✅ Appointments

**Known issues:**
- Field names in PascalCase (FirstName, LastName)
- Clinical data in proprietary XML format
- May require database access for complete export

**Migration time:**
- 10,000 patients: ~30 minutes
- 50,000 examinations: ~90 minutes
- Total: 2-3 hours

### Acuity

**Data Export:**
- CSV export from admin panel
- API access available
- Date format: MM/DD/YYYY (US)
- Phone format: US standard

**Pre-configured mappings:**
- ✅ Patient demographics
- ⚠️ Examinations (requires transformation)
- ⚠️ Prescriptions (US notation → UK notation)

**Known issues:**
- US terminology (OD/OS vs R/L)
- Decimal vs fraction notation for Snellen acuity
- Different PD measurement standards

**Migration time:**
- 3,000 patients: ~10 minutes
- 15,000 examinations: ~30 minutes
- Total: 45 minutes - 1 hour

### Generic CSV

**For other systems:**
- Manual CSV export
- Auto-detection of field mappings
- Flexible transformation rules

**Process:**
1. Export CSV from current system
2. Upload to ILS 2.0
3. Review auto-detected mappings
4. Adjust as needed
5. Import

---

## File Size & Data Limits

### Previous Limitation (FIXED)

**Old system:**
- Web uploads: 5MB limit ❌
- CLI uploads: 10MB limit ❌

**Problem:** Practice with 10 years of data = ~3GB of text data

### New Unlimited System ✅

**Current limits:**

| User Role | Web Upload | CLI Upload | API Upload |
|-----------|------------|------------|------------|
| **Platform Admin** | Unlimited | Unlimited | Unlimited |
| **Company Admin** | Unlimited | Unlimited | Unlimited |
| **Regular User** | 100MB | N/A | N/A |

**Technical details:**
- Streaming file processing (no memory limits)
- Batch processing (1000 records per batch)
- Progress tracking and resume capability
- Automatic chunking for large files

**Tested capacities:**
- ✅ 50,000 patient records
- ✅ 250,000 examination records
- ✅ 5GB CSV file
- ✅ 100MB+ Excel files

**Recommendations:**

| Practice Size | Records | Recommended Method |
|---------------|---------|-------------------|
| Small (< 2,000 patients) | < 10,000 | Web upload |
| Medium (2,000-5,000) | 10,000-50,000 | Web or CLI |
| Large (5,000-10,000) | 50,000-100,000 | CLI recommended |
| Very Large (10,000+) | 100,000+ | CLI required |

---

## Multi-Tenant Data Isolation

### How Your Data Stays Separate

**1. Database-Level Isolation**

Every record has `companyId`:
```sql
-- Your data (Company A)
SELECT * FROM patients WHERE company_id = 'abc123';
-- Returns only YOUR 5,000 patients

-- Other practice's data (Company B)
SELECT * FROM patients WHERE company_id = 'xyz789';
-- Returns their 3,000 patients (you cannot see this)
```

**2. Row-Level Security (RLS)**

PostgreSQL enforces isolation:
```sql
-- Automatic filtering applied
CREATE POLICY company_isolation_policy ON patients
  FOR ALL
  TO authenticated_users
  USING (company_id = current_setting('app.current_company_id'));
```

You CANNOT accidentally see another company's data.

**3. Application Guards**

Additional checks in code:
```typescript
// Every query automatically filtered
const patients = await storage.getPatients(companyId);
// ✅ Only returns YOUR patients

// Attempting to access other company's data
const otherPatients = await storage.getPatients('xyz789');
// ❌ Throws authorization error
```

**4. Migration Job Isolation**

Each migration job scoped to company:
```typescript
migrationJobs.companyId = 'abc123';  // YOUR company
migrationRecords.companyId = 'abc123';  // YOUR records

// Rollback only affects YOUR data
await rollbackMigration('MIG-001-2025');
// ✅ Only removes YOUR imported records
// ✅ Does NOT affect Company B, C, D...
```

### Verification

**Check your data isolation:**
```sql
-- Count YOUR records
SELECT company_id, COUNT(*)
FROM patients
WHERE company_id = 'YOUR-COMPANY-ID'
GROUP BY company_id;

-- Verify NO access to others
SELECT COUNT(*)
FROM patients
WHERE company_id != 'YOUR-COMPANY-ID';
-- Should return: ERROR - permission denied
```

---

## Validation & Testing

### Pre-Migration Validation

**1. Sample Import (100 records)**
```bash
# Test with first 100 rows
head -n 101 patients.csv > sample.csv

npx tsx scripts/data-migration/migrate-from-csv.ts \
  patients sample.csv \
  --company-id=abc123 \
  --dry-run \
  --preset=optix-patients
```

**2. Review Validation Report**
```
✅ 100 records parsed
✅ 98 valid records
⚠️  2 warnings (missing phone numbers)
❌ 0 errors

Warnings:
- Row 45: Missing mobile phone
- Row 67: Missing email address

Suggested actions:
- Add default values for missing fields
- Or skip these records
```

**3. Adjust and Retry**
- Fix data issues
- Update field mappings
- Re-run validation until 100% success

### Post-Migration Verification

**1. Record Counts**
```sql
-- Verify counts match
SELECT
  'patients' as table_name,
  COUNT(*) as ils_count,
  5000 as expected_count,
  CASE WHEN COUNT(*) = 5000 THEN '✅' ELSE '❌' END as status
FROM patients
WHERE company_id = 'abc123';
```

**2. Sample Data Review**
```sql
-- Random sample of 10 patients
SELECT
  external_id,
  name,
  date_of_birth,
  email,
  nhs_number
FROM patients
WHERE company_id = 'abc123'
ORDER BY RANDOM()
LIMIT 10;
```

**3. Data Integrity Checks**
```sql
-- Check for orphaned records
SELECT
  e.id,
  e.external_id,
  e.patient_id
FROM eye_examinations e
LEFT JOIN patients p ON e.patient_id = p.id
WHERE e.company_id = 'abc123'
  AND p.id IS NULL;
-- Should return 0 rows

-- Check date ranges
SELECT
  MIN(examination_date) as earliest,
  MAX(examination_date) as latest,
  COUNT(*) as total
FROM eye_examinations
WHERE company_id = 'abc123';
```

**4. Clinical Validation**
- Review 10-20 patient records manually
- Compare with old system side-by-side
- Check prescription values are correct
- Verify examination findings transferred
- Confirm appointment history intact

---

## Go-Live Procedures

### Option 1: Hard Cutover (Recommended for Small Practices)

**Timeline:**
- Friday evening: Final data export from old system
- Saturday: Import to ILS 2.0, validate
- Sunday: User training, final checks
- Monday morning: Go live on ILS 2.0 only

**Advantages:**
- Clean break, no confusion
- Lower cost
- Faster transition

**Disadvantages:**
- No safety net
- All staff must adapt immediately

### Option 2: Parallel Run (Recommended for Large Practices)

**Timeline:**
- Week 1: Initial migration, start using ILS 2.0
- Week 2-4: Use BOTH systems
- Week 5: ILS 2.0 becomes primary
- Week 6: Decommission old system

**Advantages:**
- Safety net if issues arise
- Gradual user adoption
- Can verify data accuracy

**Disadvantages:**
- Double data entry for 4 weeks
- Higher cost
- More complex

### Cutover Checklist

**Day Before:**
- [ ] Backup old system
- [ ] Final data export
- [ ] Import to ILS 2.0
- [ ] Run all validation checks
- [ ] Test user logins
- [ ] Print emergency contact list

**Go-Live Day:**
- [ ] Verify all users can log in
- [ ] Test appointment booking
- [ ] Test patient lookup
- [ ] Test prescription creation
- [ ] Test lab order submission
- [ ] Monitor system performance
- [ ] Stand by for support calls

**Week After:**
- [ ] Daily check-ins with users
- [ ] Address any workflow issues
- [ ] Fine-tune configurations
- [ ] Collect feedback
- [ ] Schedule training refreshers

---

## Troubleshooting

### Common Issues

**Issue: "Patient not found" during examination import**

**Cause:** Patients must be imported before examinations

**Fix:**
```bash
# Import in this order:
1. Patients first
2. Then examinations (reference patients by externalId)
3. Then prescriptions
4. Then dispenses
```

**Issue: "Duplicate NHS number" error**

**Cause:** NHS numbers must be unique

**Fix:**
```typescript
// Option 1: Skip duplicates
--skip-duplicates

// Option 2: Update existing records
--update-existing

// Option 3: Remove NHS number from duplicates
UPDATE patients
SET nhs_number = NULL
WHERE id IN (duplicate_ids);
```

**Issue: "Invalid date format" errors**

**Cause:** Mixed date formats in source data

**Fix:**
```javascript
// Transform dates to YYYY-MM-DD
dateFormat: 'DD/MM/YYYY',  // UK
dateFormat: 'MM/DD/YYYY',  // US
dateFormat: 'auto-detect',  // Try both
```

**Issue: Import very slow (> 2 hours)**

**Cause:** Small batch size or network issues

**Fix:**
```bash
# Increase batch size
--batch-size=1000  # Default is 100

# Use CLI instead of web upload
# CLI is 5-10x faster for large datasets
```

**Issue: Memory errors during import**

**Cause:** File too large to process at once

**Fix:**
```bash
# Split file into chunks
split -l 10000 patients.csv patients_chunk_

# Import each chunk
for file in patients_chunk_*; do
  npx tsx scripts/data-migration/migrate-from-csv.ts \
    patients $file \
    --company-id=abc123
done
```

---

## Support & Resources

**Documentation:**
- Migration API: `/docs/API_MIGRATION.md`
- Field Mappings: `/docs/FIELD_MAPPINGS.md`
- Legal Templates: `/docs/legal/`

**Support Contacts:**
- Migration Team: migration@ils2.com
- Technical Support: support@ils2.com
- Legal/Compliance: legal@ils2.com

**Community:**
- Practice Manager Forum: https://community.ils2.com/migration
- Video Tutorials: https://learn.ils2.com/migration
- Live Chat: In-app support

---

**Document Version:** 1.0
**Last Updated:** November 2025
**Next Review:** January 2026
