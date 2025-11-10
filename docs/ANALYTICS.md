# Analytics & Business Intelligence Platform

## Overview

The Analytics & Business Intelligence Platform provides comprehensive data insights across all platform operations through metrics tracking, customizable dashboards, and Key Performance Indicators (KPIs).

## Features

### Analytics Engine
- Custom metric registration and tracking
- Time-series data aggregation
- Real-time query execution with caching
- Multiple aggregation types: sum, avg, min, max, count, distinct
- Cohort analysis and funnel tracking
- Flexible filtering and grouping

### Dashboard System
- Customizable dashboard creation
- 9 widget types: metric cards, line charts, bar charts, pie charts, tables, heatmaps, gauges, funnels, trends
- Drag-and-drop layout (12x12 grid)
- Dashboard templates (Executive, Clinical, Financial)
- Share dashboards with team members
- Auto-refresh capabilities
- Export/import configurations

### KPI Metrics
- 15+ pre-defined healthcare KPIs
- Four status levels: Excellent, Good, Warning, Critical
- Customizable targets and thresholds
- Trend analysis and comparisons
- KPI scorecard with overall health

## Architecture

```
┌──────────────────────────────────────────────────────┐
│              Business Intelligence UI                 │
│  (Dashboards, Charts, Reports - to be implemented)   │
└────────────────────┬─────────────────────────────────┘
                     │
                     ↓
┌──────────────────────────────────────────────────────┐
│              Analytics API Routes                     │
│  /api/analytics/*                                    │
└────────────────────┬─────────────────────────────────┘
                     │
        ┌────────────┼────────────┬──────────────┐
        ↓            ↓            ↓              ↓
┌─────────────┐ ┌──────────┐ ┌─────────┐ ┌───────────┐
│Analytics    │ │Dashboard │ │KPI      │ │Database   │
│Engine       │ │Service   │ │Metrics  │ │           │
│Service      │ │          │ │Service  │ │           │
└─────────────┘ └──────────┘ └─────────┘ └───────────┘
```

## Pre-Defined KPIs

### Revenue (3 KPIs)
- **Total Revenue**: Monthly revenue target $100,000
- **Revenue per Patient**: Average $250 per visit
- **Collection Rate**: 95% collection target

### Patients (3 KPIs)
- **Active Patients**: 5,000 active patients
- **New Patients**: 200 new patients monthly
- **Patient Retention Rate**: 80% retention quarterly

### Appointments (3 KPIs)
- **Appointments Today**: 50 daily appointments
- **Appointment Show Rate**: 90% show-up rate
- **Average Wait Time**: 15 minutes or less

### Clinical (2 KPIs)
- **Patient Satisfaction Score**: 4.5/5.0 rating
- **Average Visit Duration**: 30 minutes

### Telehealth (2 KPIs)
- **Telehealth Adoption Rate**: 25% of visits
- **Telehealth Completion Rate**: 95% successful completion

### Operational (2 KPIs)
- **Staff Utilization Rate**: 80% utilization
- **Inventory Turnover**: 6x annually

## API Reference

### Metrics

**Register Metric**
```http
POST /api/analytics/metrics
{
  "name": "Patient Visits",
  "description": "Total patient visits",
  "category": "clinical",
  "unit": "count",
  "aggregation": "count",
  "datasource": "visits",
  "refreshInterval": 3600,
  "enabled": true
}
```

**List Metrics**
```http
GET /api/analytics/metrics?category=revenue
```

**Get Metric Value**
```http
GET /api/analytics/metrics/{metricId}?period=month
```

**Get Time Series**
```http
GET /api/analytics/metrics/{metricId}/timeseries?period=month&granularity=day
```

**Execute Query**
```http
POST /api/analytics/query
{
  "metrics": ["metric-id-1", "metric-id-2"],
  "timePeriod": "month",
  "granularity": "day",
  "filters": [
    {
      "field": "provider",
      "operator": "eq",
      "value": "provider-123"
    }
  ]
}
```

### Dashboards

**Create Dashboard**
```http
POST /api/analytics/dashboards
{
  "name": "My Dashboard",
  "category": "custom",
  "description": "Custom business metrics",
  "isPublic": false,
  "layout": { "columns": 12, "rows": 12 },
  "theme": "light"
}
```

**List Dashboards**
```http
GET /api/analytics/dashboards?category=executive
```

**Get Dashboard with Widgets**
```http
GET /api/analytics/dashboards/{dashboardId}
```

**Add Widget**
```http
POST /api/analytics/dashboards/{dashboardId}/widgets
{
  "type": "metric_card",
  "title": "Total Revenue",
  "position": { "x": 0, "y": 0, "width": 3, "height": 2 },
  "config": {
    "metricIds": ["revenue-metric-id"],
    "showLegend": true
  }
}
```

**Refresh Dashboard**
```http
POST /api/analytics/dashboards/{dashboardId}/refresh
```

**Create from Template**
```http
POST /api/analytics/dashboards/from-template
{
  "templateId": "executive",
  "name": "Executive Overview"
}
```

### KPIs

**Get All KPIs**
```http
GET /api/analytics/kpis
```

**Get KPIs by Category**
```http
GET /api/analytics/kpis/category/revenue
```

**Get KPI Scorecard**
```http
GET /api/analytics/kpis/scorecard

Response:
{
  "success": true,
  "scorecard": {
    "categories": [
      {
        "category": "revenue",
        "kpis": [...],
        "overallStatus": "good"
      }
    ],
    "overallScore": 3.2,
    "overallStatus": "good",
    "totalKPIs": 15,
    "criticalKPIs": 1,
    "excellentKPIs": 6
  }
}
```

**Get Specific KPI**
```http
GET /api/analytics/kpis/{metricId}

Response:
{
  "success": true,
  "kpi": {
    "metric": {
      "id": "metric-id",
      "name": "Total Revenue",
      "category": "revenue"
    },
    "currentValue": 95000,
    "targetValue": 100000,
    "status": "warning",
    "percentOfTarget": 95,
    "trend": "up",
    "lastUpdated": "2025-01-20T10:00:00Z"
  }
}
```

**Set KPI Target**
```http
PUT /api/analytics/kpis/{metricId}/target
{
  "targetValue": 120000,
  "threshold": {
    "critical": 70000,
    "warning": 90000,
    "good": 110000,
    "excellent": 130000
  },
  "period": "monthly"
}
```

## Widget Types

### 1. Metric Card
Simple KPI display with current value, target, and trend.

```javascript
{
  "type": "metric_card",
  "title": "Total Revenue",
  "config": {
    "metricIds": ["revenue-total"]
  }
}
```

### 2. Line Chart
Time-series visualization.

```javascript
{
  "type": "line_chart",
  "title": "Revenue Trend",
  "config": {
    "metricIds": ["revenue-total"],
    "showLegend": true,
    "colors": ["#3B82F6"]
  }
}
```

### 3. Bar Chart
Compare metrics across categories.

```javascript
{
  "type": "bar_chart",
  "title": "Appointments by Type",
  "config": {
    "metricIds": ["appointments"],
    "showLabels": true
  }
}
```

### 4. Pie Chart
Show proportions and distributions.

```javascript
{
  "type": "pie_chart",
  "title": "Revenue by Service",
  "config": {
    "metricIds": ["revenue"],
    "showLegend": true
  }
}
```

### 5. Table
Detailed data display.

```javascript
{
  "type": "table",
  "title": "Top Performing Providers",
  "config": {
    "metricIds": ["revenue", "patient-count"]
  }
}
```

### 6. Gauge
Show progress toward target.

```javascript
{
  "type": "gauge",
  "title": "Collection Rate",
  "config": {
    "metricIds": ["collection-rate"],
    "minValue": 0,
    "maxValue": 100
  }
}
```

## Dashboard Templates

### Executive Dashboard
High-level business metrics for leadership.

**Widgets**:
- Total Revenue (metric card)
- Active Patients (metric card)
- Appointments Today (metric card)
- Revenue per Patient (metric card)
- Revenue Trend (line chart)
- Appointments by Type (bar chart)

### Clinical Dashboard
Patient care and operational metrics.

**Widgets**:
- Patient Visits Today (metric card)
- Average Wait Time (metric card)
- Patient Satisfaction (metric card)

### Financial Dashboard
Revenue and financial performance.

**Widgets**:
- Monthly Revenue (metric card)
- Outstanding AR (metric card)
- Collection Rate (metric card)
- Claims Pending (metric card)

## Time Periods

- `today`: Current day
- `yesterday`: Previous day
- `week`: Last 7 days
- `month`: Last 30 days
- `quarter`: Last 90 days
- `year`: Last 365 days
- `custom`: Specify start and end dates

## Aggregation Types

- `sum`: Total of all values
- `avg`: Average of all values
- `min`: Minimum value
- `max`: Maximum value
- `count`: Count of records
- `distinct_count`: Count of unique values

## KPI Status Levels

| Status | Description | Color |
|--------|-------------|-------|
| **Excellent** | At or above excellent threshold | Green |
| **Good** | At or above good threshold | Blue |
| **Warning** | At or above warning threshold | Yellow |
| **Critical** | Below warning threshold | Red |

## Implementation Notes

**Current Status**:
- ✅ Analytics engine with caching
- ✅ Dashboard management system
- ✅ 15+ pre-defined KPIs
- ✅ Complete API endpoints
- ✅ 3 dashboard templates

**Using In-Memory Storage** (migrate to database):
- Metrics and metric values
- Dashboards and widgets
- KPI targets
- Query cache

**Database Schema**:
```sql
CREATE TABLE analytics_metrics (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  unit VARCHAR(50),
  aggregation VARCHAR(50),
  datasource VARCHAR(100),
  refresh_interval INTEGER,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE dashboards (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  owner_id UUID REFERENCES users(id),
  is_public BOOLEAN DEFAULT false,
  layout JSONB,
  refresh_interval INTEGER,
  theme VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE dashboard_widgets (
  id UUID PRIMARY KEY,
  dashboard_id UUID REFERENCES dashboards(id),
  type VARCHAR(50),
  title VARCHAR(255),
  position JSONB,
  config JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE kpi_targets (
  metric_id UUID PRIMARY KEY REFERENCES analytics_metrics(id),
  target_value DECIMAL(15,2),
  threshold JSONB,
  period VARCHAR(20)
);
```

## Next Steps

1. **Data Collection**: Implement data collectors for each metric
2. **Real-time Updates**: WebSocket support for live dashboard updates
3. **Advanced Analytics**: Predictive analytics and machine learning
4. **Reporting**: PDF/Excel export of dashboards and reports
5. **Alerts**: Automated alerts when KPIs fall below thresholds
6. **Data Warehouse**: Integration with data warehouse for historical analysis

## License

Copyright © 2024 ILS 2.0. All rights reserved.
