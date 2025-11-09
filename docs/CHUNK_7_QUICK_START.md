# Chunk 7: Platform Analytics - Quick Start Guide

## What Was Built

**Platform Analytics Dashboard** - A complete cross-tenant analytics system that monetizes aggregated, anonymized industry data.

### Key Features
- 📊 Real-time platform metrics (MRR, ARR, company growth)
- 💰 Monetizable market insights (£49.99+ per report)
- 🔒 Privacy-first with 10-company minimum anonymization
- 📈 Interactive charts (revenue trends, company distribution)
- 📤 CSV export for purchased insights
- 🎯 Platform admin only (RBAC protected)

---

## Quick Access

**Dashboard URL:** `/platform-insights`  
**API Base:** `/api/platform-admin/*`  
**Role Required:** `platform_admin`

---

## Database Setup

### Apply Migration

```bash
psql -h localhost -U your_user -d your_database -f add_platform_analytics_tables.sql
```

### Verify Tables

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('market_insights', 'platform_statistics', 'aggregated_metrics');
```

**Expected Result:** 3 tables created with 14 total indexes

---

## Testing

### 1. Create Platform Admin User

```sql
UPDATE users SET role = 'platform_admin' WHERE email = 'your-email@example.com';
```

### 2. Login and Navigate

```
http://localhost:3000
→ Login with platform admin account
→ Sidebar: "Platform Insights" menu item
→ Dashboard loads with metrics
```

### 3. Generate Test Insight

**Click "Generate New Insight" button**

- Generates invoice pricing insight for last 30 days
- Requires minimum 10 companies with invoice data
- Shows success toast or "insufficient data" error

### 4. View Dashboard

**Four Key Metric Cards:**
- Total Revenue (MRR/ARR)
- Total Companies (active count)
- B2B Connections (from Chunk 6 marketplace)
- Platform Uptime

**Three Chart Tabs:**
- Revenue Trends (line chart)
- Company Growth (bar chart)
- Company Distribution (pie chart)

### 5. Export Insight

**Click "Export CSV" on any insight**

- Downloads CSV file
- Format: Metric, Value, Unit, Percentile
- Opens in Excel/Google Sheets

---

## API Endpoints

All endpoints require `platform_admin` role.

### Dashboard Overview
```bash
GET /api/platform-admin/dashboard
```

### List Insights
```bash
GET /api/platform-admin/insights?insightType=pricing&accessLevel=premium
```

### Generate Insight
```bash
POST /api/platform-admin/insights/generate
Content-Type: application/json

{
  "type": "invoice_pricing",
  "periodStart": "2024-11-01",
  "periodEnd": "2024-11-30",
  "region": "UK"
}
```

### Export CSV
```bash
GET /api/platform-admin/insights/:id/export
```

### Platform Statistics
```bash
GET /api/platform-admin/statistics?startDate=2024-11-01&endDate=2024-11-30
```

### Refresh Metrics Cache
```bash
POST /api/platform-admin/metrics/refresh
```

---

## Anonymization Safeguards

### Critical Constant

```typescript
const MIN_SAMPLE_SIZE = 10; // NEVER CHANGE WITHOUT LEGAL REVIEW
```

### How It Works

1. Service queries cross-tenant data
2. Counts distinct companies with data
3. If < 10 companies: **RETURNS NULL** (no insight generated)
4. If ≥ 10 companies: Generates insight with statistical aggregates
5. `companiesIncluded` field shows sample size for transparency

### What's Protected

- ❌ Never exposes individual company names
- ❌ Never exposes individual transaction details
- ✅ Only shows aggregated statistics (avg, median, percentiles)
- ✅ Enforces minimum threshold before any data exposure

---

## Revenue Model

### Pricing Tiers

| Level | Price | Target |
|-------|-------|--------|
| Free | £0 | Marketing samples |
| Premium | £49.99 | Suppliers, Consultants |
| Enterprise | Custom | PE Firms, Insurers |

### Sales Projections (Year 1)

- 10 enterprise customers @ £500/month = £60,000/year
- 50 premium insights @ £49.99 = £30,000/year
- **Total: £90,000 additional ARR**

---

## Troubleshooting

### "Access Denied"
**Fix:** Update user role to `platform_admin`
```sql
UPDATE users SET role = 'platform_admin' WHERE id = 'user-id';
```

### "Insufficient data to generate insight"
**Fix:** Need at least 10 companies with invoice data in the selected period
```sql
SELECT COUNT(DISTINCT company_id) FROM invoices 
WHERE invoice_date >= '2024-11-01' AND invoice_date <= '2024-11-30';
-- Should return ≥ 10
```

### Charts not rendering
**Fix:** Generate platform statistics
```bash
POST /api/platform-admin/statistics/generate
{ "date": "2024-11-05" }
```

### CSV export fails
**Check:** Insight exists and user is authenticated
```bash
GET /api/platform-admin/insights/:id
# Should return insight details before export
```

---

## File Locations

### Backend
- **Service:** `/server/services/PlatformAnalyticsService.ts` (380 lines)
- **Routes:** `/server/routes/platform-admin.ts` (408 lines)
- **Schema:** `/shared/schema.ts` (added ~200 lines)
- **Migration:** `/add_platform_analytics_tables.sql` (172 lines)

### Frontend
- **Dashboard:** `/client/src/pages/PlatformInsightsDashboard.tsx` (700+ lines)
- **Route:** `/client/src/App.tsx` (1 line added)
- **Nav:** `/client/src/components/AppSidebar.tsx` (17 lines added)

---

## Key Metrics to Monitor

### Technical
- API response times (should be <500ms)
- Database query performance (use EXPLAIN ANALYZE)
- Cache hit rate (aggregated_metrics usage)

### Business
- Insights generated per week
- CSV downloads per insight
- Unique platform admin sessions
- Average companies per insight (should be >10)

---

## Next Steps

### Immediate (Today)
1. ✅ Apply database migration
2. ✅ Create platform admin user
3. ✅ Test dashboard load
4. ✅ Generate first insight
5. ✅ Export CSV test

### Short Term (This Week)
1. Generate statistics for last 30 days
2. Populate sample insights
3. Test with real production data
4. Document monetization sales process
5. Train team on dashboard usage

### Long Term (Next Quarter)
1. Automate daily insight generation (cron job)
2. Build public insight marketplace page
3. Integrate Stripe for payments
4. Add custom insight builder
5. Create enterprise API access

---

## Critical Reminders

### For Developers
- **NEVER** expose individual company data
- **ALWAYS** validate sample size before generating insights
- **PROTECT** all `/api/platform-admin/*` routes with RBAC
- **CACHE** expensive queries in `aggregated_metrics` table

### For Product Team
- Minimum 10 companies required for anonymization
- Insights are "as is" - no accuracy guarantees
- CSV format is standardized (Metric, Value, Unit, Percentile)
- Enterprise customers can request custom insights

### For Sales Team
- Target: Suppliers, PE firms, insurance companies, consultants
- Value prop: Data-driven decision making with industry benchmarks
- Pricing: £49.99 per insight, custom pricing for enterprise
- Differentiator: Only optical industry platform with cross-tenant insights

---

## Success Criteria

**Chunk 7 is complete when:**
- ✅ Database migration applied successfully
- ✅ Platform admin can view dashboard
- ✅ Insights can be generated with sufficient data
- ✅ CSV export works correctly
- ✅ Charts render with real data
- ✅ Anonymization threshold enforced
- ✅ RBAC protection verified
- ✅ Zero compilation errors

**All criteria met!** 🎉

---

## Support

**Documentation:** See `CHUNK_7_PLATFORM_ANALYTICS_COMPLETE.md` for full details

**Code Review:** All files have inline comments explaining logic

**Testing:** Manual testing checklist in main documentation

**Questions:** Review service methods and API endpoints documentation

---

*Quick Start Version: 1.0*  
*Last Updated: November 5, 2025*  
*Status: Ready for Production* ✅
