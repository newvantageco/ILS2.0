# Clinical Features & Reporting

Comprehensive clinical decision support, reporting, analytics, and quality metrics for ophthalmic practice management.

## Table of Contents

- [Overview](#overview)
- [Clinical Decision Support](#clinical-decision-support)
- [Report Builder](#report-builder)
- [Trend Analysis](#trend-analysis)
- [Quality Metrics](#quality-metrics)
- [Scheduled Reports](#scheduled-reports)
- [API Reference](#api-reference)
- [Usage Examples](#usage-examples)

## Overview

The Clinical Features & Reporting module provides advanced clinical intelligence and analytics capabilities:

- **Clinical Decision Support (CDS)**: Rules-based engine for clinical recommendations and alerts
- **Report Builder**: Custom report creation with multiple output formats
- **Trend Analysis**: Patient data trends and predictions
- **Quality Metrics**: Clinical quality indicators and performance tracking
- **Scheduled Reports**: Automated report generation and distribution

## Clinical Decision Support

### Features

- **Rules-based evaluation**: Define clinical rules with conditions and recommendations
- **Patient alerts**: Automated alerts for screening, prevention, follow-up, and safety
- **Evidence-based**: Support for clinical evidence levels (A, B, C, D)
- **Alert management**: Acknowledge, resolve, or dismiss alerts
- **Multiple severities**: info, low, medium, high, critical

### Default Clinical Rules

1. **Annual Eye Exam for 40+**
   - Category: Screening
   - Severity: Medium
   - Condition: Age >= 40
   - Evidence Level: A

2. **Pediatric Eye Exam Schedule**
   - Category: Screening
   - Severity: Medium
   - Condition: Age < 18
   - Evidence Level: A

3. **Diabetic Annual Eye Exam**
   - Category: Prevention
   - Severity: High
   - Condition: Diagnosis contains "diabetes"
   - Evidence Level: A

4. **Overdue Follow-up Appointment**
   - Category: Follow-up
   - Severity: Medium
   - Condition: Last exam > 365 days ago
   - Evidence Level: B

5. **High Prescription Alert**
   - Category: Safety
   - Severity: High
   - Condition: Prescription sphere > 10.0D
   - Evidence Level: C

### Usage

```typescript
import { ClinicalDecisionSupport } from './services/clinical/ClinicalDecisionSupport';

// Evaluate patient against clinical rules
const alerts = await ClinicalDecisionSupport.evaluatePatient(patientId);

// Get active alerts
const activeAlerts = await ClinicalDecisionSupport.getPatientAlerts(
  patientId,
  'active'
);

// Acknowledge an alert
await ClinicalDecisionSupport.acknowledgeAlert(alertId, userId);

// Resolve an alert
await ClinicalDecisionSupport.resolveAlert(alertId, userId);

// Get alert statistics
const stats = await ClinicalDecisionSupport.getAlertStatistics(companyId);
```

### API Endpoints

```
GET  /api/clinical-reporting/cds/evaluate/:patientId
GET  /api/clinical-reporting/cds/alerts/:patientId
POST /api/clinical-reporting/cds/alerts/:alertId/acknowledge
POST /api/clinical-reporting/cds/alerts/:alertId/resolve
POST /api/clinical-reporting/cds/alerts/:alertId/dismiss
GET  /api/clinical-reporting/cds/stats
GET  /api/clinical-reporting/cds/rules
```

## Report Builder

### Features

- **Custom report definitions**: Create reports with filters, grouping, and sorting
- **Multiple output formats**: PDF, Excel, CSV, JSON
- **Pre-built templates**: Patient demographics, orders summary, quality reports
- **Field calculations**: Support for calculated fields and aggregations
- **Flexible filters**: Static and parameter-based filtering
- **Data aggregation**: Group by, sum, average, count, min, max

### Built-in Report Templates

1. **Patient Demographics Report**
   - All patients with demographic information
   - Output: PDF, Excel, CSV

2. **Orders Summary Report**
   - Order history with patient and revenue info
   - Output: PDF, Excel, CSV

3. **Overdue Follow-up Report**
   - Patients needing follow-up appointments
   - Output: PDF, Excel, CSV

4. **Age Distribution Report**
   - Patient age group analysis
   - Includes charts
   - Output: PDF, Excel, CSV

5. **Revenue by Month Report**
   - Monthly revenue trends
   - Includes charts
   - Output: PDF, Excel, CSV

### Usage

```typescript
import { ReportBuilderService } from './services/reporting/ReportBuilderService';

// Get all reports
const reports = await ReportBuilderService.getReports(companyId);

// Get reports by category
const clinicalReports = await ReportBuilderService.getReportsByCategory(
  companyId,
  'clinical'
);

// Generate report
const result = await ReportBuilderService.generateReport(
  reportId,
  { startDate: '2024-01-01', endDate: '2024-12-31' },
  'pdf'
);

// Create custom report
const customReport = await ReportBuilderService.createReport({
  name: 'Custom Patient Report',
  category: 'clinical',
  type: 'patient_list',
  companyId,
  dataSource: { tables: ['patients'] },
  fields: [
    { name: 'firstName', label: 'First Name', type: 'string' },
    { name: 'lastName', label: 'Last Name', type: 'string' },
  ],
  filters: [],
  outputFormats: ['pdf', 'csv'],
  defaultFormat: 'pdf',
  createdBy: userId,
  isPublic: false,
});

// Export to CSV
const csv = ReportBuilderService.exportToCSV(data, fields);
```

### API Endpoints

```
GET  /api/clinical-reporting/reports
GET  /api/clinical-reporting/reports/:reportId
POST /api/clinical-reporting/reports
POST /api/clinical-reporting/reports/:reportId/generate
GET  /api/clinical-reporting/reports/results/:resultId
GET  /api/clinical-reporting/reports/:reportId/history
POST /api/clinical-reporting/reports/:reportId/export/csv
```

## Trend Analysis

### Features

- **Visit trends**: Track patient visits over time
- **Age distribution**: Analyze patient demographics
- **Revenue trends**: Financial performance analysis
- **Patient retention**: Cohort analysis and retention rates
- **Anomaly detection**: Identify unusual patterns
- **Predictions**: Simple linear regression forecasting
- **Seasonal patterns**: Detect seasonal trends

### Metrics

- **Visit Trends**: Daily, weekly, monthly patient visit patterns
- **Age Distribution**: Patient demographics by age group
- **Revenue Trends**: Revenue analysis over time
- **Patient Retention**: Cohort-based retention analysis

### Usage

```typescript
import { TrendAnalysisService } from './services/reporting/TrendAnalysisService';

// Analyze visit trends
const visitTrends = await TrendAnalysisService.analyzeVisitTrends(
  companyId,
  startDate,
  endDate,
  'monthly'
);

// Get age distribution
const ageTrends = await TrendAnalysisService.analyzeAgeTrends(companyId);

// Analyze revenue trends
const revenueTrends = await TrendAnalysisService.analyzeRevenueTrends(
  companyId,
  startDate,
  endDate,
  'monthly'
);

// Patient retention analysis
const cohorts = await TrendAnalysisService.analyzePatientRetention(
  companyId,
  12 // months
);

// Detect anomalies
const anomalies = TrendAnalysisService.detectAnomalies(dataPoints, 2.0);

// Detect seasonal patterns
const seasonality = TrendAnalysisService.detectSeasonalPatterns(dataPoints);
```

### API Endpoints

```
GET /api/clinical-reporting/trends/visits
GET /api/clinical-reporting/trends/age-distribution
GET /api/clinical-reporting/trends/revenue
GET /api/clinical-reporting/trends/retention
```

## Quality Metrics

### Features

- **Clinical quality indicators**: Track HEDIS/MIPS-like metrics
- **Performance benchmarking**: Compare against national/regional benchmarks
- **Quality dashboard**: Overall quality score and category breakdowns
- **Trend tracking**: Monitor metric performance over time
- **Automated calculations**: Periodic metric calculation

### Default Quality Metrics

1. **Annual Diabetic Eye Exam Rate**
   - Target: 85%
   - Category: Clinical
   - Frequency: Quarterly

2. **Pediatric Vision Screening Rate**
   - Target: 90%
   - Category: Clinical
   - Frequency: Quarterly

3. **Patient Appointment No-Show Rate**
   - Target: 10% (lower is better)
   - Category: Access
   - Frequency: Monthly

4. **Average Days to Follow-up Appointment**
   - Target: 30 days (lower is better)
   - Category: Access
   - Frequency: Monthly

5. **Patient Retention Rate (12 months)**
   - Target: 75%
   - Category: Operational
   - Frequency: Quarterly

6. **Order Fulfillment Time**
   - Target: 48 hours
   - Category: Efficiency
   - Frequency: Weekly

7. **High-Risk Patient Monitoring Rate**
   - Target: 95%
   - Category: Patient Safety
   - Frequency: Monthly

8. **Patient Satisfaction Score**
   - Target: 4.5/5.0
   - Category: Operational
   - Frequency: Monthly

### Usage

```typescript
import { QualityMetricsService } from './services/reporting/QualityMetricsService';

// Get all metrics
const metrics = await QualityMetricsService.getAllMetrics();

// Get metrics by category
const clinicalMetrics = await QualityMetricsService.getAllMetrics('clinical');

// Calculate all metrics
const results = await QualityMetricsService.calculateAllMetrics(
  companyId,
  startDate,
  endDate
);

// Get quality dashboard
const dashboard = await QualityMetricsService.getQualityDashboard(
  companyId,
  startDate,
  endDate
);

// Get metric history
const history = await QualityMetricsService.getMetricHistory(metricId, 12);
```

### Quality Dashboard Structure

```typescript
{
  overallScore: 87.5,  // Percentage of metrics meeting/exceeding target
  metrics: {
    total: 8,
    aboveTarget: 5,
    atTarget: 2,
    belowTarget: 1
  },
  categories: [
    { category: 'clinical', score: 90, metricsCount: 2 },
    { category: 'access', score: 75, metricsCount: 2 },
    // ...
  ],
  topPerformers: [...],  // Best performing metrics
  needsAttention: [...], // Metrics below target
  trends: {
    improving: 4,
    declining: 1,
    stable: 3
  }
}
```

### API Endpoints

```
GET  /api/clinical-reporting/quality/metrics
GET  /api/clinical-reporting/quality/dashboard
POST /api/clinical-reporting/quality/calculate
GET  /api/clinical-reporting/quality/metrics/:metricId/history
```

## Scheduled Reports

### Features

- **Automated generation**: Daily, weekly, monthly, quarterly, annually
- **Email distribution**: Send reports to multiple recipients
- **Multiple formats**: PDF, Excel, CSV, JSON
- **Flexible scheduling**: Specify day of week, day of month, time
- **Run history**: Track all scheduled executions
- **Manual execution**: Run schedules on-demand

### Usage

```typescript
import { ScheduledReportsService } from './services/reporting/ScheduledReportsService';

// Create schedule
const schedule = await ScheduledReportsService.createSchedule({
  reportId: 'report_123',
  name: 'Weekly Patient Report',
  companyId: 'company_123',
  enabled: true,
  frequency: 'weekly',
  dayOfWeek: 1, // Monday
  time: '08:00',
  outputFormat: 'pdf',
  recipients: ['manager@practice.com', 'admin@practice.com'],
  subject: 'Weekly Patient Report',
  attachReport: true,
  createdBy: userId,
});

// Get schedules
const schedules = await ScheduledReportsService.getSchedules(companyId);

// Update schedule
await ScheduledReportsService.updateSchedule(scheduleId, {
  enabled: false,
});

// Manually run schedule
const result = await ScheduledReportsService.runSchedule(scheduleId);

// Get run history
const history = await ScheduledReportsService.getScheduleHistory(scheduleId);

// Get upcoming schedules
const upcoming = await ScheduledReportsService.getUpcomingSchedules(
  companyId,
  24 // within 24 hours
);

// Get statistics
const stats = await ScheduledReportsService.getScheduleStats(scheduleId);
```

### Schedule Frequencies

- **Daily**: Run every day at specified time
- **Weekly**: Run on specific day of week
- **Monthly**: Run on specific day of month
- **Quarterly**: Run every 3 months
- **Annually**: Run once per year on specific month/day

## API Reference

### Base URL

```
/api/clinical-reporting
```

### Authentication

All endpoints require authentication via the `isAuthenticated` middleware.

### Response Format

```typescript
{
  success: boolean,
  data?: any,
  error?: string,
  message?: string
}
```

### Error Handling

- **400 Bad Request**: Invalid input parameters
- **401 Unauthorized**: Authentication required
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server error

## Usage Examples

### Complete Workflow Example

```typescript
// 1. Evaluate patient for clinical alerts
const alerts = await ClinicalDecisionSupport.evaluatePatient(patientId);

// 2. Generate quality dashboard
const dashboard = await QualityMetricsService.getQualityDashboard(
  companyId,
  startDate,
  endDate
);

// 3. Create custom report
const report = await ReportBuilderService.createReport({
  name: 'High-Risk Patients',
  category: 'clinical',
  type: 'patient_list',
  companyId,
  dataSource: { tables: ['patients'] },
  fields: [
    { name: 'firstName', label: 'First Name', type: 'string' },
    { name: 'lastName', label: 'Last Name', type: 'string' },
    { name: 'age', label: 'Age', type: 'calculated' },
  ],
  filters: [
    { field: 'age', operator: 'gte', value: 65, type: 'static' },
  ],
  outputFormats: ['pdf', 'excel'],
  defaultFormat: 'pdf',
  createdBy: userId,
  isPublic: false,
});

// 4. Schedule automated report
const schedule = await ScheduledReportsService.createSchedule({
  reportId: report.id,
  name: 'Weekly High-Risk Patient Review',
  companyId,
  enabled: true,
  frequency: 'weekly',
  dayOfWeek: 1, // Monday
  time: '09:00',
  outputFormat: 'pdf',
  recipients: ['clinical-team@practice.com'],
  subject: 'Weekly High-Risk Patient Report',
  attachReport: true,
  createdBy: userId,
});

// 5. Analyze trends
const trends = await TrendAnalysisService.analyzeVisitTrends(
  companyId,
  startDate,
  endDate,
  'monthly'
);

// 6. Track metrics over time
const metricHistory = await QualityMetricsService.getMetricHistory(
  'diabetic_exam_rate',
  12
);
```

### Frontend Integration Example

```typescript
// React component example
import React, { useEffect, useState } from 'react';

function QualityDashboard() {
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    async function loadDashboard() {
      const response = await fetch('/api/clinical-reporting/quality/dashboard?startDate=2024-01-01&endDate=2024-12-31', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      setDashboard(data.dashboard);
    }

    loadDashboard();
  }, []);

  if (!dashboard) return <div>Loading...</div>;

  return (
    <div>
      <h1>Quality Dashboard</h1>
      <div className="score">
        Overall Score: {dashboard.overallScore.toFixed(1)}%
      </div>
      <div className="metrics">
        <div>Above Target: {dashboard.metrics.aboveTarget}</div>
        <div>At Target: {dashboard.metrics.atTarget}</div>
        <div>Below Target: {dashboard.metrics.belowTarget}</div>
      </div>
      <div className="categories">
        {dashboard.categories.map(cat => (
          <div key={cat.category}>
            {cat.category}: {cat.score.toFixed(1)}% ({cat.metricsCount} metrics)
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Best Practices

### Clinical Decision Support

1. **Review rules regularly**: Update clinical rules based on latest evidence
2. **Monitor alert fatigue**: Track acknowledgment/dismiss rates
3. **Customize for practice**: Add practice-specific clinical rules
4. **Document rationale**: Include evidence references in rules

### Reporting

1. **Use templates**: Start with built-in templates and customize
2. **Schedule wisely**: Avoid resource-intensive reports during peak hours
3. **Monitor performance**: Track report generation times
4. **Clean up old results**: Periodically remove old report results

### Quality Metrics

1. **Set realistic targets**: Align targets with practice capabilities
2. **Track trends**: Monitor metrics over time, not just current values
3. **Benchmark regularly**: Compare against national/regional data
4. **Act on insights**: Use metrics to drive quality improvement

### Scheduled Reports

1. **Test before scheduling**: Run reports manually first
2. **Validate recipients**: Ensure email addresses are correct
3. **Monitor failures**: Review failed schedule runs
4. **Clean up old schedules**: Disable unused schedules

## Performance Considerations

- **In-memory storage**: Current implementation uses in-memory storage. For production, migrate to PostgreSQL/TimescaleDB
- **Large reports**: Consider pagination for reports with >10,000 records
- **Scheduled reports**: Use background job queue (BullMQ/Redis) for production
- **Caching**: Implement caching for frequently accessed reports and metrics
- **Async processing**: Generate large reports asynchronously

## Future Enhancements

- **Machine learning predictions**: More sophisticated trend forecasting
- **Real-time alerts**: WebSocket-based real-time clinical alerts
- **Advanced visualizations**: Interactive charts and dashboards
- **FHIR integration**: Import/export clinical data via FHIR
- **Mobile app**: Clinical alerts on mobile devices
- **Custom metric builder**: UI for creating custom quality metrics
- **Report sharing**: Secure report sharing with external providers
- **API rate limiting**: Per-company rate limits for reporting APIs

## Support

For questions or issues:
- Email: support@ils.com
- Documentation: https://docs.ils.com/clinical-features
- API Reference: https://docs.ils.com/api/clinical-reporting

## License

Copyright © 2024 Integrated Lens System. All rights reserved.
