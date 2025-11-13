# 🚀 Quickstart: New Features

## Recent Enhancements

ILS 2.0 has been significantly enhanced with two major feature sets:

1. **Python Real Data Integration** - Python services now use real database instead of mock data
2. **Comprehensive Storage & Archival System** - Full CRUD with soft deletes and historical tracking

---

## 🐍 Python Real Data Integration

### What Changed

All Python microservices now connect to your PostgreSQL database and return **real data** instead of mock/example data.

### Affected Services

#### 1. Python Analytics Service (`python-service/`)
- ✅ `/api/v1/analytics/order-trends` - Real order data
- ✅ `/api/v1/analytics/batch-report` - Real batch analytics
- ✅ `/api/v1/qc/analyze` - Enhanced validation rules
- ✅ `/api/v1/ml/predict-production-time` - Production-ready predictions

#### 2. AI Service (`ai-service/`)
- ✅ Multi-tenant RAG queries with real database
- ✅ Secure tenant isolation
- ✅ Sales, inventory, and patient analytics

### Setup (2 Minutes)

1. **Configure Database URL**
```bash
# Add to your .env file
DATABASE_URL=postgresql://user:password@host:5432/database
PYTHON_SERVICE_URL=http://localhost:8000
```

2. **Install Python Dependencies**
```bash
cd python-service
pip install -r requirements.txt
```

3. **Start Python Service**
```bash
python main.py
```

4. **Verify Integration**
```bash
# Should return real data (no "_note" field)
curl http://localhost:8000/api/v1/analytics/order-trends?days=30
```

### Development vs Production

**Development (No Database):**
- Returns example data with `"_note": "Using example data..."`
- Allows development without database setup

**Production (With Database):**
- Returns real data from PostgreSQL
- No `_note` field in responses
- Live analytics and predictions

### Documentation

See complete guide: [`PYTHON_REAL_DATA_INTEGRATION.md`](./PYTHON_REAL_DATA_INTEGRATION.md)

---

## 🗄️ Storage & Archival System

### What You Get

A complete enterprise-grade archival solution with:
- ✅ **Soft Deletes** - Never lose data permanently
- ✅ **Historical Snapshots** - Time-travel queries
- ✅ **Report Archives** - Store expensive reports
- ✅ **Audit Trail** - Complete operation history
- ✅ **Data Export** - GDPR/HIPAA compliance

### Setup (5 Minutes)

1. **Run Database Migration**
```bash
chmod +x scripts/run-archival-migration.sh
./scripts/run-archival-migration.sh
```

This creates 6 new tables:
- `archived_records`
- `report_archives`
- `historical_snapshots`
- `data_export_logs`
- `audit_trail`
- `data_retention_policies`

2. **Start Using It**

No code changes needed! Use the new endpoints:

```bash
# List archived records
curl http://localhost:5000/api/archival/records

# Get archived reports
curl http://localhost:5000/api/archival/reports

# View audit trail
curl http://localhost:5000/api/archival/audit
```

### Quick Examples

#### Soft Delete an Order
```typescript
import { archivalUtils } from './server/utils/archivalUtils';

// Instead of permanently deleting
await archivalUtils.softDelete({
  tableName: 'orders',
  record: order,
  companyId: user.companyId,
  userId: user.id,
  reason: 'Customer requested deletion'
});
```

#### Restore Deleted Order
```typescript
// Customer changed their mind
const restoredData = await archivalUtils.findAndRestoreRecord({
  tableName: 'orders',
  originalId: 'ORD-2025-123456',
  companyId: user.companyId,
  userId: user.id
});
```

#### Archive a Report
```typescript
// Generate expensive report once
const report = await generateMonthlySalesReport();

// Archive for reuse
await archivalUtils.archiveGeneratedReport({
  reportType: 'sales_summary',
  reportName: 'Monthly Sales - Jan 2025',
  reportData: report,
  companyId: user.companyId,
  userId: user.id,
  retentionDays: 365
});

// Retrieve later without regenerating
const oldReport = await archivalService.getArchivedReport(reportId);
```

#### View History
```typescript
// See all changes to an order
const history = await archivalUtils.getEntityHistory('orders', orderId);

// View order as it was 6 months ago
const snapshot = await archivalService.getEntityAtTime(
  'orders',
  orderId,
  new Date('2024-07-01')
);
```

### API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/archival/records` | List archived (deleted) records |
| `POST /api/archival/records/:id/restore` | Restore deleted record |
| `GET /api/archival/reports` | List archived reports |
| `GET /api/archival/reports/:id` | Get specific report |
| `POST /api/archival/reports` | Archive new report |
| `GET /api/archival/history/:type/:id` | View entity history |
| `GET /api/archival/history/:type/:id/at/:time` | Time-travel query |
| `GET /api/archival/exports` | Export history (GDPR) |
| `GET /api/archival/audit/:type/:id` | Audit trail for entity |
| `GET /api/archival/audit` | Company audit trail |

### Compliance

✅ **HIPAA** - Complete audit trail
✅ **GDPR** - Data export and right to be forgotten
✅ **SOC 2** - Access logs and change tracking
✅ **ISO 27001** - Data retention policies

### Documentation

See complete guide: [`STORAGE_AND_ARCHIVAL_GUIDE.md`](./STORAGE_AND_ARCHIVAL_GUIDE.md)

---

## 🎯 Quick Wins

### 1. Never Lose Data Again
Replace all `delete` operations with `archivalUtils.softDelete()`. Everything becomes recoverable.

### 2. Instant Report Retrieval
Archive expensive reports once and retrieve them instantly forever.

### 3. Dispute Resolution
Use time-travel queries to see exactly what data looked like in the past.

### 4. Compliance Made Easy
Automatic audit trails and export tracking for HIPAA/GDPR.

### 5. Real-Time Analytics
Python services now provide live data from your database instead of mock data.

---

## 📚 Additional Resources

### Documentation
- [`PYTHON_REAL_DATA_INTEGRATION.md`](./PYTHON_REAL_DATA_INTEGRATION.md) - Python data integration guide
- [`STORAGE_AND_ARCHIVAL_GUIDE.md`](./STORAGE_AND_ARCHIVAL_GUIDE.md) - Complete archival system guide
- [`examples/archival-examples.ts`](./examples/archival-examples.ts) - 12 practical examples

### Utilities
- `server/utils/archivalUtils.ts` - Helper functions for common operations
- `server/services/ArchivalService.ts` - Core archival service
- `scripts/run-archival-migration.sh` - Database migration script

### Database
- `db/migrations/001_create_archival_tables.sql` - Archival tables migration
- `shared/archived-schema.ts` - TypeScript schema definitions

---

## 🆘 Troubleshooting

### Python Service Returns Mock Data

**Problem:** API returns `"_note": "Using example data..."`

**Solution:** Set `DATABASE_URL` in `.env` file:
```bash
DATABASE_URL=postgresql://user:password@host:5432/database
```

### Archival Endpoints Return 404

**Problem:** `/api/archival/*` endpoints not found

**Solution:** Run database migration:
```bash
./scripts/run-archival-migration.sh
```

### Can't Restore Deleted Record

**Problem:** Record was permanently deleted (not soft-deleted)

**Solution:** Check audit trail to see if record was archived:
```bash
GET /api/archival/audit?entityType=orders&action=archive
```

---

## 🎉 What's Next?

1. ✅ Python services use real data
2. ✅ Complete archival system deployed
3. 🔄 Integrate soft deletes throughout application
4. 🔄 Build frontend UI for archived records
5. 🔄 Add ML models for enhanced Python analytics
6. 🔄 Implement automated retention policies

---

## 📞 Support

- **Documentation:** See guides in project root
- **Examples:** Check `examples/archival-examples.ts`
- **Issues:** Report bugs via GitHub Issues
- **Questions:** Contact development team

---

**Last Updated:** January 2025
**Version:** 2.0.0
**Status:** ✅ Production Ready
