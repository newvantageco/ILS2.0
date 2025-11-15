# SaaS Storage Methods Quick Reference

## Overview
Added 19 new methods to `DbStorage` class for querying SaaS metrics tables. All methods support multi-tenancy via `companyId` parameter.

---

## MRR / Revenue Tracking

### `getCompanySubscriptions(companyId: string, month?: Date)`
**Purpose**: Fetch all subscriptions for a company  
**Returns**: Array of subscription records from `subscriptionHistory`  
**Use Case**: Calculate MRR by summing subscription amounts
```typescript
const subs = await storage.getCompanySubscriptions(companyId);
const mrr = subs.reduce((sum, s) => sum + s.monthlyAmount, 0);
```

### `getMonthlyRecurringRevenue(companyId: string, year: number, month: number)`
**Purpose**: Query stored MRR data for specific month  
**Returns**: MRR record with breakdown by tier + movement metrics  
**Use Case**: Get historical MRR for trending
```typescript
const mrrData = await storage.getMonthlyRecurringRevenue(companyId, 2025, 11);
// { totalMRR: 15000, arr: 180000, momGrowth: 5.2, newMRR: 500, ... }
```

### `upsertMonthlyRecurringRevenue(companyId: string, data: any)`
**Purpose**: Store or update MRR data  
**Params**: 
- `year`, `month`: Period identifier
- `totalMRR`: Total monthly revenue
- `arr`: Annual recurring revenue
- `breakdown`: { tier: { subscriptions, mrr } }
- `newMRR`, `expansionMRR`, `contractionMRR`, `churnMRR`: Movement metrics
- `momGrowth`: Month-over-month growth %
```typescript
await storage.upsertMonthlyRecurringRevenue(companyId, {
  year: 2025,
  month: 11,
  totalMRR: 15000,
  arr: 180000,
  breakdown: { pro: { subscriptions: 50, mrr: 5000 }, ... },
  momGrowth: 5.2
});
```

---

## Health Scores

### `getCustomerHealthScore(companyId: string)`
**Purpose**: Fetch latest health score  
**Returns**: Latest health record with scores and history  
**Use Case**: Get current health status
```typescript
const health = await storage.getCustomerHealthScore(companyId);
// { overallScore: 75, engagementScore: 80, trend: 'improving', ... }
```

### `getAllCustomerHealthScores()`
**Purpose**: Fetch all health scores (admin)  
**Returns**: Array of all company health scores  
**Use Case**: Segmentation, bulk analysis
```typescript
const allScores = await storage.getAllCustomerHealthScores();
const atRisk = allScores.filter(s => s.riskLevel === 'at_risk');
```

### `upsertCustomerHealthScore(companyId: string, data: any)`
**Purpose**: Store or update health score  
**Params**:
- `overallScore`: 0-100
- `engagementScore`, `adoptionScore`, `satisfactionScore`: Component scores
- `scoreHistory`: Array of historical scores
- `trend`: 'improving' | 'stable' | 'declining'
- `riskLevel`: 'excellent' | 'good' | 'at_risk' | 'critical'
- `calculatedBy`: Service name
```typescript
await storage.upsertCustomerHealthScore(companyId, {
  overallScore: 75,
  engagementScore: 80,
  adoptionScore: 70,
  satisfactionScore: 65,
  trend: 'improving',
  riskLevel: 'good',
  calculatedBy: 'CustomerHealthService'
});
```

---

## Churn Prediction

### `getChurnPrediction(companyId: string)`
**Purpose**: Fetch latest churn prediction  
**Returns**: Churn prediction record with probability + risk factors  
**Use Case**: Check current churn risk
```typescript
const churn = await storage.getChurnPrediction(companyId);
// { churnProbability: 0.45, riskLevel: 'high', predictedChurnDate: Date, ... }
```

### `getAllChurnPredictions()`
**Purpose**: Fetch all churn predictions (admin)  
**Returns**: Array ordered by churn probability (highest first)  
**Use Case**: Admin dashboard, risk reports
```typescript
const allRisks = await storage.getAllChurnPredictions();
const critical = allRisks.filter(p => p.churnProbability > 0.7);
```

### `upsertChurnPrediction(companyId: string, data: any)`
**Purpose**: Store or update churn prediction  
**Params**:
- `churnProbability`: Decimal as string (0.0000 to 1.0000)
- `riskFactors`: Array of risk factor objects
- `recommendedActions`: Array of suggested actions
- `modelVersion`: ML model version
- `predictionScore`: 0-100 confidence
- `predictedChurnDate`: When they might churn
```typescript
await storage.upsertChurnPrediction(companyId, {
  churnProbability: '0.4500',
  riskFactors: [
    { factor: 'Usage decline', weight: 0.3, ... },
    { factor: 'Payment issues', weight: 0.3, ... }
  ],
  recommendedActions: [...],
  modelVersion: '1.0',
  predictionScore: 85,
  predictedChurnDate: new Date()
});
```

---

## Feature Usage

### `getCompanyFeatureUsage(companyId: string)`
**Purpose**: Get all feature usage metrics for company  
**Returns**: Array of feature usage records  
**Use Case**: Adoption analysis, identify underutilized features
```typescript
const features = await storage.getCompanyFeatureUsage(companyId);
// [
//   { featureName: 'ai_recommendations', usageCount: 450, activeUsers: 12, ... },
//   { featureName: 'advanced_reporting', usageCount: 8, activeUsers: 2, ... }
// ]
```

### `getFeatureUsage(companyId: string, featureName: string)`
**Purpose**: Get usage for specific feature  
**Returns**: Single feature usage record or null  
**Use Case**: Check if feature adopted, ROI calculation
```typescript
const aiFeat = await storage.getFeatureUsage(companyId, 'ai_recommendations');
const adopted = (aiFeat?.usageCount || 0) > 0;
```

### `trackFeatureUsage(companyId: string, featureName: string, userId?: string, metadata?: any)`
**Purpose**: Log a feature usage event (increments counters)  
**Side Effects**: 
- Updates `featureUsageMetrics.usageCount`
- Creates entry in `usageEvents` table
- Updates `lastUsedAt` timestamp
**Use Case**: Called whenever user accesses a feature
```typescript
await storage.trackFeatureUsage(
  companyId,
  'ai_recommendations',
  userId,
  { responseTime: 245, accuracy: 0.94 }
);
```

---

## Customer Acquisition

### `getCustomerAcquisitionSources(companyId: string)`
**Purpose**: Get all acquisition source data  
**Returns**: Array of acquisition sources with CAC, ROI, retention  
**Use Case**: Analyze which channels drive best customers
```typescript
const sources = await storage.getCustomerAcquisitionSources(companyId);
// [
//   { source: 'google_ads', cac: 45.50, roi: 2.3, avgChurnRate: 0.03, ... },
//   { source: 'organic', cac: 15.00, roi: 5.2, avgChurnRate: 0.01, ... }
// ]
```

### `recordCustomerAcquisitionSource(companyId: string, data: any)`
**Purpose**: Store acquisition source metrics  
**Params**: source, campaign, medium, content, totalCost, customersAcquired, revenueGenerated, avgLifetimeValue, avgMonthlyRetention, avgChurnRate, cac, roi, period, periodStart, periodEnd
**Use Case**: Record monthly acquisition data for each channel
```typescript
await storage.recordCustomerAcquisitionSource(companyId, {
  source: 'google_ads',
  campaign: 'Q4_Enterprise',
  medium: 'search',
  totalCost: 2250,
  customersAcquired: 5,
  revenueGenerated: 45000,
  cac: 450,
  roi: 19.0,
  period: 'monthly',
  periodStart: new Date('2025-11-01'),
  periodEnd: new Date('2025-11-30')
});
```

---

## Cohort Analysis

### `getCustomerCohort(companyId: string, cohortName: string)`
**Purpose**: Fetch specific cohort data  
**Returns**: Cohort with retention curve (12 months) + analysis  
**Use Case**: Analyze retention for specific cohort
```typescript
const cohort = await storage.getCustomerCohort(companyId, '2025-Q4-Enterprise');
// { month0Retention: 100, month1Retention: 92, month2Retention: 87, ... }
```

### `getCompanyCohorts(companyId: string)`
**Purpose**: Get all cohorts for company  
**Returns**: Array of cohorts ordered by period (newest first)  
**Use Case**: Retention trends across all cohorts
```typescript
const cohorts = await storage.getCompanyCohorts(companyId);
const latestCohort = cohorts[0]; // Most recent
```

### `upsertCustomerCohort(companyId: string, data: any)`
**Purpose**: Store or update cohort with retention curve  
**Params**:
- `cohortName`: e.g., "2025-Q4-Enterprise"
- `cohortPeriod`: 'monthly' | 'quarterly' | 'yearly'
- `periodStart`, `periodEnd`: Date range
- `totalCustomers`: Size at month 0
- `segment`: 'free' | 'pro' | 'enterprise' | etc.
- `retentionData`: { month0, month1, ... month12 } with %
- `avgRetentionRate`: Average across 12 months
- `lifetimeRetention`: Final retention %
```typescript
await storage.upsertCustomerCohort(companyId, {
  cohortName: '2025-Q4-Enterprise',
  cohortPeriod: 'quarterly',
  periodStart: new Date('2025-10-01'),
  periodEnd: new Date('2025-12-31'),
  totalCustomers: 45,
  segment: 'enterprise',
  retentionData: {
    month0: 100,
    month1: 92,
    month2: 87,
    month3: 84,
    month4: 82,
    // ...
    month12: 75
  },
  avgRetentionRate: 85.5,
  lifetimeRetention: 75
});
```

---

## Usage Events / Analytics

### `logUsageEvent(companyId: string, data: any)`
**Purpose**: Record a usage event for analytics  
**Params**:
- `userId`: User who triggered event
- `eventType`: 'feature_used' | 'order_created' | 'api_call' | etc.
- `eventName`: Specific event name
- `properties`: Custom event data
- `metadata`: Additional context
- `revenueImpact`: £ contributed by this event
**Use Case**: Audit trail, custom analytics, funnel tracking
```typescript
await storage.logUsageEvent(companyId, {
  userId: userIdOrNull,
  eventType: 'order_created',
  eventName: 'frames_order',
  properties: { frameCount: 15, totalValue: 450 },
  metadata: { source: 'api', version: '2.0' },
  revenueImpact: 450
});
```

### `getUsageEvents(companyId: string, limit: number = 100)`
**Purpose**: Fetch recent usage events  
**Returns**: Array of events ordered by date (newest first)  
**Use Case**: Recent activity feed, analytics
```typescript
const events = await storage.getUsageEvents(companyId, 50);
// Last 50 events for the company
```

### `getUsageEventsByType(companyId: string, eventType: string, limit: number = 100)`
**Purpose**: Fetch events filtered by type  
**Returns**: Array of specific event type  
**Use Case**: Funnel analysis, feature-specific metrics
```typescript
const orderEvents = await storage.getUsageEventsByType(
  companyId, 
  'order_created', 
  200
);
// All order creation events
```

---

## Type Definitions

### MRR Storage Format
```typescript
{
  companyId: string,
  year: number,
  month: number,
  totalMRR: Decimal,
  arr: Decimal,
  breakdown: { [tier]: { subscriptions, mrr } },
  newMRR: Decimal,
  expansionMRR: Decimal,
  contractionMRR: Decimal,
  churnMRR: Decimal,
  momGrowth: Decimal,
  updatedAt: Date
}
```

### Health Score Storage Format
```typescript
{
  companyId: string,
  overallScore: number,        // 0-100
  engagementScore: number,
  adoptionScore: number,
  satisfactionScore: number,
  scoreHistory: Array<{ date, score }>,
  trend: 'improving' | 'stable' | 'declining',
  riskLevel: 'excellent' | 'good' | 'at_risk' | 'critical',
  lastCalculatedAt: Date,
  calculatedBy: string
}
```

---

## Integration Patterns

### In Services
```typescript
// In SaaSMetricsService
async calculateMRR(companyId: string) {
  const subs = await storage.getCompanySubscriptions(companyId);
  const mrr = subs.reduce((sum, s) => sum + s.amount, 0);
  await storage.upsertMonthlyRecurringRevenue(companyId, { 
    year: now.getFullYear(), 
    month: now.getMonth() + 1,
    totalMRR: mrr 
  });
  return mrr;
}
```

### In Route Handlers
```typescript
// In saas-metrics.ts routes
router.get('/metrics/mrr', asyncHandler(async (req, res) => {
  const mrrData = await SaaSMetricsService.calculateMRR(req.user.companyId);
  res.json(mrrData);
}));
```

---

## Error Handling
All methods throw on database errors. Wrapped with `asyncHandler()` in routes for consistent error formatting.

```typescript
try {
  await storage.upsertCustomerHealthScore(companyId, data);
} catch (error) {
  logger.error('Health score update failed', error);
  // Route handler's asyncHandler will format response
}
```

---

## Performance Tips

1. **Batch Operations**: Use `getAllCustomerHealthScores()` instead of loop of `getCustomerHealthScore()`
2. **Index Usage**: All tables indexed on (companyId, createdAt) for fast filtered queries
3. **Limit Results**: Use `limit` parameter in getUsageEvents() and getUsageEventsByType()
4. **Caching**: Consider caching MRR data (updated monthly), not real-time
5. **Aggregation**: Store pre-calculated metrics (MRR, health) rather than computing on-the-fly

---

**Last Updated**: 15 November 2025  
**Status**: All methods tested and integrated ✅
