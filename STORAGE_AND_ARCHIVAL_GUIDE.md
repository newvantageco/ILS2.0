# Storage and Archival System - Complete Guide

## Overview

The ILS 2.0 system now includes a comprehensive storage solution with full CRUD operations, soft deletes, historical data tracking, and the ability to retrieve old data and reports at will. No data is permanently lost - everything can be recovered and audited.

## ✨ Key Features

✅ **Full CRUD Operations** - Create, Read, Update, Delete for all entities
✅ **Soft Deletes** - Archive records instead of permanent deletion
✅ **Historical Snapshots** - Track all changes over time
✅ **Report Archival** - Store and retrieve generated reports
✅ **Data Export** - Export old records in various formats
✅ **Audit Trail** - Complete history of all operations
✅ **Point-in-Time Recovery** - View data as it was at any moment

---

## 🗄️ Architecture

### Core Components

1. **Storage Layer** (`server/storage.ts`)
   - Main database operations for all entities
   - Over 6,000 lines of CRUD methods
   - Comprehensive entity management

2. **Archival Service** (`server/services/ArchivalService.ts`)
   - Soft delete implementation
   - Historical snapshots
   - Report archival
   - Data export tracking
   - Audit trail management

3. **Archival Schema** (`shared/archived-schema.ts`)
   - `archived_records` - Soft-deleted data
   - `report_archives` - Historical reports
   - `historical_snapshots` - Point-in-time data
   - `data_export_logs` - Export tracking
   - `audit_trail` - Comprehensive audit log
   - `data_retention_policies` - Retention rules

4. **API Routes** (`server/routes/archival.ts`)
   - REST API for all archival operations
   - Secure, authenticated endpoints
   - Company-isolated data access

---

## 📊 Available Entities with CRUD

All major entities have full CRUD operations:

### Core Business Entities
- ✅ **Users** - Full management with role switching
- ✅ **Companies** - Multi-tenant support
- ✅ **Patients** - With privacy controls
- ✅ **Orders** - Complete lifecycle tracking
- ✅ **Invoices** - Billing and payments
- ✅ **Products** - Catalog management

### Clinical & Professional
- ✅ **Eye Examinations** - Clinical records
- ✅ **Prescriptions** - Rx management
- ✅ **Consult Logs** - Professional consultations
- ✅ **Test Rooms** - Booking and scheduling
- ✅ **Dispense Records** - Fulfillment tracking

### Supply Chain
- ✅ **Purchase Orders** - With line items
- ✅ **Technical Documents** - Supplier docs
- ✅ **Inventory** - Stock management
- ✅ **Equipment** - Asset tracking

### AI & Analytics
- ✅ **AI Conversations** - Chat history
- ✅ **AI Knowledge Base** - Learning data
- ✅ **AI Feedback** - Model improvement
- ✅ **Training Datasets** - ML data

### Insurance & Compliance
- ✅ **Insurance Claims** - Full claim lifecycle
- ✅ **Insurance Payers** - Payer management
- ✅ **Claim Appeals** - Appeal tracking
- ✅ **Quality Measures** - Compliance metrics

...and 100+ more entities!

---

## 🔄 Soft Delete System

### How It Works

Instead of permanently deleting records, we archive them:

```typescript
// Traditional delete (DANGEROUS - data lost forever)
DELETE FROM orders WHERE id = '123';

// Soft delete (SAFE - data archived and recoverable)
await archivalService.archiveRecord({
  tableName: 'orders',
  recordId: order.id,
  recordData: order,
  companyId: user.companyId,
  archivedBy: user.id,
  reason: 'Customer requested deletion',
  tags: ['gdpr', 'customer-request']
});
```

### Benefits

1. **Data Recovery** - Restore deleted records anytime
2. **Compliance** - Meet data retention requirements
3. **Audit Trail** - Know who deleted what and why
4. **Analytics** - Analyze deleted data for insights

### API Endpoints

```bash
# Get archived records
GET /api/archival/records?tableName=orders&limit=50

# Restore an archived record
POST /api/archival/records/:id/restore

# Permanently delete (admin only, after retention period)
DELETE /api/archival/records/:id/permanent
```

---

## 📸 Historical Snapshots

### Purpose

Captures the state of entities at specific points in time. Enables "time travel" queries to see how data looked in the past.

### Use Cases

1. **Regulatory Compliance** - Prove data at specific dates
2. **Dispute Resolution** - Show what customer saw
3. **Change Tracking** - See who changed what and when
4. **Rollback** - Restore previous versions

### How to Use

```typescript
// Create a snapshot when important changes occur
await archivalService.createSnapshot({
  snapshotType: 'order_update',
  entityType: 'orders',
  entityId: order.id,
  data: order,
  companyId: user.companyId,
  capturedBy: user.id,
  triggerEvent: 'status_change',
  changeType: 'updated'
});

// Get all snapshots for an order
const history = await archivalService.getSnapshotsForEntity(
  'orders',
  orderId,
  50
);

// Get order as it was on Jan 1, 2025
const snapshot = await archivalService.getEntityAtTime(
  'orders',
  orderId,
  new Date('2025-01-01')
);
```

### API Endpoints

```bash
# Get history for an entity
GET /api/archival/history/:entityType/:entityId?limit=50

# Get entity at specific time
GET /api/archival/history/:entityType/:entityId/at/:timestamp

# Create a snapshot
POST /api/archival/history
```

---

## 📄 Report Archival

### Purpose

Store generated reports for later retrieval without regenerating them. Save computation time and ensure consistency.

### Features

- Store reports in any format (PDF, Excel, CSV, JSON)
- Track access and download counts
- Expire old reports automatically
- Categorize and tag reports
- Full-text search

### How to Use

```typescript
// Archive a generated report
const report = await archivalService.archiveReport({
  reportType: 'sales_summary',
  reportName: 'Monthly Sales Report - January 2025',
  reportData: {
    totalSales: 145000,
    orderCount: 847,
    topProducts: [...]
  },
  parameters: {
    month: 'january',
    year: 2025
  },
  companyId: user.companyId,
  generatedBy: user.id,
  periodStart: new Date('2025-01-01'),
  periodEnd: new Date('2025-01-31'),
  fileUrl: 's3://reports/jan-2025.pdf',
  fileFormat: 'pdf',
  fileSize: 245678,
  tags: ['monthly', 'sales', 'executive'],
  category: 'financial',
  expiresAt: new Date('2026-01-31') // 1 year retention
});

// Retrieve old reports
const { reports, total } = await archivalService.getArchivedReports({
  companyId: user.companyId,
  reportType: 'sales_summary',
  periodStart: new Date('2024-01-01'),
  periodEnd: new Date('2024-12-31'),
  category: 'financial',
  limit: 50
});

// Get specific report (tracks access)
const report = await archivalService.getArchivedReport(reportId);
```

### API Endpoints

```bash
# Get archived reports
GET /api/archival/reports?reportType=sales_summary&category=financial

# Get specific report
GET /api/archival/reports/:id

# Archive a new report
POST /api/archival/reports
```

---

## 💾 Data Export System

### Purpose

Track all data exports for compliance (GDPR, HIPAA). Allow users to export old data in various formats.

### Supported Formats

- **CSV** - Spreadsheet-friendly
- **Excel (XLSX)** - Full formatting
- **JSON** - API/programmatic access
- **PDF** - Printable documents

### How to Use

```typescript
// Export old orders from 2024
const exportData = await generateExport({
  entityType: 'orders',
  filters: {
    year: 2024,
    status: 'completed'
  },
  format: 'xlsx'
});

// Log the export
await archivalService.logDataExport({
  exportType: 'orders_export',
  entityType: 'orders',
  recordCount: 1234,
  filters: { year: 2024, status: 'completed' },
  dateRange: {
    start: '2024-01-01',
    end: '2024-12-31'
  },
  fileUrl: 's3://exports/orders-2024.xlsx',
  fileFormat: 'xlsx',
  fileSize: 567890,
  companyId: user.companyId,
  exportedBy: user.id
});

// Track download
await archivalService.trackExportDownload(exportId);
```

### API Endpoints

```bash
# Get export history
GET /api/archival/exports?limit=50

# Log a new export
POST /api/archival/exports

# Track download
POST /api/archival/exports/:id/download
```

---

## 🔍 Audit Trail

### Purpose

Complete, immutable log of all operations. Required for HIPAA, SOC 2, and other compliance frameworks.

### What's Tracked

- All CRUD operations
- Who performed the action
- What changed (before/after)
- When it happened
- From what IP address
- User agent and request path
- Whether it succeeded or failed

### How to Use

```typescript
// Automatically logged for all operations via middleware
// Manual logging for custom operations:
await archivalService.logAudit({
  action: 'update',
  entityType: 'orders',
  entityId: order.id,
  beforeData: oldOrder,
  afterData: newOrder,
  companyId: user.companyId,
  userId: user.id,
  userRole: user.role,
  ipAddress: req.ip,
  userAgent: req.get('user-agent'),
  requestPath: req.path,
  requestMethod: req.method,
  success: true
});

// Query audit trail
const trail = await archivalService.getAuditTrail(
  'orders',
  orderId,
  100
);

// Company-wide audit with filters
const { entries, total } = await archivalService.getCompanyAuditTrail(
  companyId,
  {
    action: 'delete',
    entityType: 'patients',
    userId: specificUserId,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-01-31')
  },
  100,
  0
);
```

### API Endpoints

```bash
# Get audit trail for entity
GET /api/archival/audit/:entityType/:entityId?limit=100

# Company audit trail with filters
GET /api/archival/audit?action=delete&entityType=patients&startDate=2025-01-01
```

---

## 🗂️ Data Retention Policies

### Purpose

Define how long different types of data should be retained before automatic archival or deletion.

### Policy Types

1. **Active Retention** - How long data stays in primary tables
2. **Archive Retention** - How long to keep in archives
3. **Total Retention** - Maximum retention before permanent deletion

### Example Policies

```typescript
// Financial records: 7 years (legal requirement)
{
  entityType: 'invoices',
  activeRetentionDays: 365 * 2,     // 2 years active
  archiveRetentionDays: 365 * 5,    // 5 years archived
  totalRetentionDays: 365 * 7,      // 7 years total
  autoArchive: true,
  autoDelete: false  // Never auto-delete financial records
}

// Temporary data: 30 days
{
  entityType: 'temp_uploads',
  activeRetentionDays: 30,
  archiveRetentionDays: 0,
  totalRetentionDays: 30,
  autoArchive: false,
  autoDelete: true  // Auto-delete after 30 days
}

// Patient records: Indefinite (HIPAA)
{
  entityType: 'patients',
  activeRetentionDays: 365 * 10,    // 10 years active
  archiveRetentionDays: 999999,     // Archive forever
  totalRetentionDays: 999999,       // Keep forever
  autoArchive: true,
  autoDelete: false  // NEVER auto-delete
}
```

---

## 🚀 Usage Examples

### Example 1: Recover Deleted Order

```typescript
// User accidentally deleted an order
// 1. Search archived records
const { records } = await archivalService.getArchivedRecords({
  tableName: 'orders',
  companyId: user.companyId,
  limit: 50
});

// 2. Find the deleted order
const deletedOrder = records.find(r => r.originalId === orderId);

// 3. Restore it
await archivalService.restoreRecord(deletedOrder.id, user.id);

// 4. Re-insert into orders table
await storage.createOrder(deletedOrder.recordData);
```

### Example 2: Generate and Archive Monthly Report

```typescript
// Generate report
const reportData = await generateMonthlySalesReport(month, year);

// Archive it for future reference
const archivedReport = await archivalService.archiveReport({
  reportType: 'sales_summary',
  reportName: `Sales Report - ${month} ${year}`,
  reportData,
  companyId: user.companyId,
  generatedBy: user.id,
  periodStart: startOfMonth,
  periodEnd: endOfMonth,
  fileFormat: 'json',
  tags: ['monthly', 'sales'],
  expiresAt: new Date(+new Date() + 365 * 24 * 60 * 60 * 1000) // 1 year
});

// Later: Retrieve without regenerating
const oldReport = await archivalService.getArchivedReport(archivedReport.id);
```

### Example 3: Audit Trail Investigation

```typescript
// Customer disputes a charge
// View complete audit trail for their invoice
const trail = await archivalService.getAuditTrail('invoices', invoiceId, 100);

// Show customer:
trail.forEach(entry => {
  console.log(`${entry.performedAt}: ${entry.action} by ${entry.userId}`);
  console.log('Changed:', entry.changes);
});

// Prove what the invoice looked like when customer saw it
const invoiceAtTime = await archivalService.getEntityAtTime(
  'invoices',
  invoiceId,
  customerViewDate
);
```

### Example 4: GDPR Data Export

```typescript
// Customer requests all their data
const customerData = {
  patient: await storage.getPatient(patientId),
  orders: await storage.getOrders({ patientId }),
  examinations: await storage.getPatientExaminations(patientId),
  invoices: await storage.getInvoices({ patientId })
};

// Generate export file
const exportFile = await generateGDPRExport(customerData);

// Log the export
await archivalService.logDataExport({
  exportType: 'gdpr_export',
  entityType: 'patients',
  recordCount: 1,
  fileUrl: exportFile.url,
  fileFormat: 'json',
  companyId: user.companyId,
  exportedBy: user.id
});

// Send to customer
await emailService.sendGDPRExport(patient.email, exportFile);
```

---

## 🔒 Security & Compliance

### Company Isolation

All archival operations are **company-isolated**:
- Users can only access their company's archived data
- Automatic filtering by `companyId`
- No cross-tenant data leakage

### Authentication

All endpoints require authentication:
```typescript
router.use(isAuthenticated); // Applied to all archival routes
```

### Compliance Features

✅ **HIPAA** - Complete audit trail, secure storage
✅ **GDPR** - Right to be forgotten, data export
✅ **SOC 2** - Access logs, change tracking
✅ **ISO 27001** - Data retention policies

---

## 📱 Frontend Integration

### React Component Example

```tsx
import { useState, useEffect } from 'react';

function ArchivedRecordsView() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArchivedRecords();
  }, []);

  async function fetchArchivedRecords() {
    const response = await fetch('/api/archival/records?tableName=orders&limit=50');
    const data = await response.json();
    setRecords(data.records);
    setLoading(false);
  }

  async function restoreRecord(recordId) {
    await fetch(`/api/archival/records/${recordId}/restore`, {
      method: 'POST'
    });
    alert('Record restored successfully!');
    fetchArchivedRecords(); // Refresh list
  }

  return (
    <div>
      <h2>Archived Orders</h2>
      {loading ? <p>Loading...</p> : (
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Archived Date</th>
              <th>Archived By</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {records.map(record => (
              <tr key={record.id}>
                <td>{record.originalId}</td>
                <td>{new Date(record.archivedAt).toLocaleDateString()}</td>
                <td>{record.archivedBy}</td>
                <td>
                  <button onClick={() => restoreRecord(record.id)}>
                    Restore
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

---

## 🎯 Best Practices

### 1. Always Use Soft Delete

```typescript
// ❌ BAD: Permanent delete
await db.delete(orders).where(eq(orders.id, orderId));

// ✅ GOOD: Soft delete (archive)
const order = await storage.getOrder(orderId);
await archivalService.archiveRecord({
  tableName: 'orders',
  recordId: orderId,
  recordData: order,
  companyId: user.companyId,
  archivedBy: user.id,
  reason: 'User requested deletion'
});
```

### 2. Create Snapshots for Important Changes

```typescript
// Before updating critical data
const snapshot = await archivalService.createSnapshot({
  snapshotType: 'before_update',
  entityType: 'orders',
  entityId: order.id,
  data: order,
  capturedBy: user.id,
  triggerEvent: 'user_update'
});

// Make the change
await storage.updateOrder(orderId, updates);
```

### 3. Archive Generated Reports

```typescript
// After generating expensive reports
const report = await generateComplexReport();

await archivalService.archiveReport({
  reportType: 'complex_report',
  reportName: report.name,
  reportData: report.data,
  companyId: user.companyId,
  generatedBy: user.id,
  expiresAt: new Date(+new Date() + 30 * 24 * 60 * 60 * 1000) // 30 days
});
```

### 4. Log Audit Trail for Sensitive Operations

```typescript
await archivalService.logAudit({
  action: 'update',
  entityType: 'patients',
  entityId: patientId,
  beforeData: oldData,
  afterData: newData,
  companyId: user.companyId,
  userId: user.id,
  success: true
});
```

---

## 🔧 Database Schema

### Migration

Run this migration to create the archival tables:

```sql
-- See: db/migrations/001_create_archival_tables.sql
```

### Tables Created

1. `archived_records` - Soft-deleted data
2. `report_archives` - Historical reports
3. `historical_snapshots` - Point-in-time snapshots
4. `data_export_logs` - Export tracking
5. `audit_trail` - Comprehensive audit log
6. `data_retention_policies` - Retention rules

---

## 📊 Performance Considerations

### Indexes

All archival tables have proper indexes:
- `company_id` - For tenant isolation
- `original_table` - For filtering by entity type
- `archived_at` / `captured_at` - For time-based queries
- `entity_type` + `entity_id` - For entity lookups

### Pagination

All list endpoints support pagination:
```bash
GET /api/archival/records?limit=50&offset=100
```

### Cleanup

Old archived data can be cleaned up based on retention policies:
```typescript
// Run as a cron job
await cleanupExpiredArchives();
```

---

## 🆘 Troubleshooting

### Can't Find Deleted Record

1. Check archived records:
   ```bash
   GET /api/archival/records?tableName=orders&originalId=ORD-123
   ```

2. Check if it was permanently deleted (check `permanentlyDeletedAt`)

3. Search audit trail:
   ```bash
   GET /api/archival/audit?entityType=orders&entityId=ORD-123
   ```

### Report Not Loading

1. Check if report exists:
   ```bash
   GET /api/archival/reports/:id
   ```

2. Check if expired:
   - Look at `expiresAt` field
   - Include expired: `?includeExpired=true`

3. Check file URL is accessible

### Audit Trail Missing

1. Ensure middleware is installed
2. Check date range filters
3. Verify company isolation

---

## 📚 Summary

✅ **Complete CRUD** - All entities have full CRUD operations
✅ **Soft Deletes** - Nothing is permanently lost
✅ **Historical Data** - View data at any point in time
✅ **Report Archives** - Store and retrieve old reports
✅ **Data Export** - Export in multiple formats
✅ **Audit Trail** - Complete operation history
✅ **Compliance Ready** - HIPAA, GDPR, SOC 2

**Your data is safe, recoverable, and fully auditable!**

---

## 🔗 Related Files

- `shared/archived-schema.ts` - Database schema
- `server/services/ArchivalService.ts` - Core service
- `server/routes/archival.ts` - API endpoints
- `server/storage.ts` - Main storage layer (6000+ lines of CRUD)

## 📞 Need Help?

Contact the development team or refer to:
- API Documentation: `/api/documentation`
- Swagger UI: `/api-docs`
- GitHub Issues: [Repository Issues]
