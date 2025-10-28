# Intelligent System Features Implementation Guide

## Overview

Two powerful features have been added to the ILS platform that represent the competitive moat described in your vision:

1. **Predictive Non-Adapt Alert System** - Real-time prescription complexity analysis
2. **Intelligent Purchasing Assistant** - Data-driven business intelligence for ECPs

## Feature 1: Predictive Non-Adapt Alert System

### Purpose
Analyzes prescription parameters in real-time to identify complex combinations that have high historical non-adaptation rates. Provides intelligent recommendations to prevent problems before they occur.

### How It Works

#### Risk Analysis Algorithm
The system evaluates prescriptions for complexity factors:

- **High Add Power** (Add > 2.5): Risk factor +0.25
- **High Sphere/Cylinder Power** (Total > 6.0): Risk factor +0.20
- **High-Wrap Frames** (wrap/sport frame types): Risk factor +0.15
- **High Astigmatism** (Cylinder > 2.0): Risk factor +0.15
- **PD Variation** (PD < 58 or > 74): Risk factor +0.10

Total risk score is capped at 1.0 (0-100%).

#### Severity Levels
- **Critical** (Risk ≥ 45%): Order requires immediate attention
- **Warning** (Risk 30-45%): Review recommended
- **Info** (Risk < 30%): FYI only

### Database Schema

```typescript
// rx_frame_lens_analytics - Historical tracking
- lensType, lensMaterial, frameType
- totalOrders, nonAdaptCount, nonAdaptRate
- remakeRate, averageRemakeDays
- historicalDataPoints (JSONB)

// prescription_alerts - Real-time alerts
- orderId, ecpId
- severity, alertType, riskScore
- historicalNonAdaptRate
- recommendedLensType, recommendedMaterial, recommendedCoating
- explanation
- dismissedAt, actionTaken
```

### API Endpoints

#### Get Active Alerts
```
GET /api/alerts/prescriptions
Authorization: Bearer <token>
```

Returns all active (non-dismissed) alerts for the authenticated ECP.

**Example Response:**
```json
[
  {
    "id": "uuid",
    "orderId": "order123",
    "severity": "warning",
    "alertType": "high_add_progressive",
    "riskScore": 0.38,
    "historicalNonAdaptRate": 0.32,
    "explanation": "High add power in progressive lens may cause adaptation issues...",
    "recommendedLensType": "Progressive",
    "recommendedMaterial": "1.67",
    "recommendedCoating": "anti-reflective"
  }
]
```

#### Dismiss Alert
```
POST /api/alerts/prescriptions/:id/dismiss
Authorization: Bearer <token>
Content-Type: application/json

{
  "actionTaken": "recommendation_accepted" // optional
}
```

#### Analyze Order Risk (Pre-Order Check)
```
POST /api/orders/analyze-risk
Authorization: Bearer <token>
Content-Type: application/json

{
  "lensType": "Progressive",
  "lensMaterial": "1.60",
  "frameType": "Sport Wrap",
  "coating": "AR",
  "odSphere": "+2.50",
  "odCylinder": "-0.75",
  "odAxis": "180",
  "odAdd": "2.75",
  "osSphere": "+2.75",
  "osCylinder": "-0.50",
  "osAxis": "170",
  "osAdd": "2.75",
  "pd": "62"
}
```

**Response:**
```json
{
  "analysis": {
    "severity": "warning",
    "alertType": "high_add_progressive",
    "riskScore": 0.38,
    "recommendation": {
      "lensType": "Progressive",
      "material": "1.67",
      "coating": "anti-reflective",
      "explanation": "..."
    }
  }
}
```

### UI Components

#### `PrescriptionAlertsWidget.tsx`
- Displays active alerts with severity color-coding
- Shows risk score as visual progress bar
- Lists recommended lens options
- Allows dismissing alerts with actions

**Usage:**
```tsx
<PrescriptionAlertsWidget
  alerts={alerts}
  isLoading={isLoading}
  onDismiss={(alertId, actionTaken) => {...}}
/>
```

---

## Feature 2: Intelligent Purchasing Assistant

### Purpose
Analyzes ECP's POS sales data combined with LIMS order data to provide actionable business intelligence for:
- Optimizing inventory stocking
- Reducing breakage rates
- Identifying cross-sell opportunities
- Reducing order errors

### How It Works

#### Data Sources
1. **POS Data** (invoices + products):
   - Top-selling frames and accessories
   - Monthly sales trends
   - Revenue per product
   
2. **LIMS Data** (orders):
   - Frame/lens combinations with errors
   - Remake rates by material/frame type
   - Error patterns

#### Recommendation Types

**1. Stocking Recommendations**
- Identifies best-sellers (>20 units/year threshold)
- Suggests increasing stock 20-30%
- Shows monthly demand patterns
- Estimates revenue lift from reduced stockouts

**2. Cross-Sell Recommendations**
- Analyzes product pairings
- Suggests bundled packages
- Example: "Your top frame (Ray-Ban) sells 25/month → bundle with premium lens materials"

**3. Breakage Reduction**
- Analyzes frame types with high remake rates
- Recommends materials/coatings that reduce breakage
- Example: "Wrap frames show 40% breakage. Switch to Trivex + hard-coat"

**4. Error Reduction**
- Identifies problematic Rx/frame combinations
- Recommends consulting lab engineer
- Tracks improvement over time

**5. Upsell Opportunities**
- Shows complementary products customers commonly buy
- Suggests staff training focus areas

### Database Schema

```typescript
// ecp_product_sales_analytics - Aggregated sales data
- ecpId, productType, productBrand, productModel
- totalSalesCount, totalRevenue, averageOrderValue
- monthlyTrend (JSONB: { "2025-10": 120, ... })
- topPairings (JSONB: [ { item1, item2, count } ])

// bi_recommendations - Generated recommendations
- ecpId
- recommendationType: 'stocking' | 'upsell' | 'cross_sell' | 'breakage_reduction' | 'error_reduction'
- priority: 'low' | 'medium' | 'high'
- title, description, impact
- actionItems (JSONB array)
- estimatedRevenueLift, estimatedErrorReduction
- acknowledged, implementationStartedAt, implementationCompletedAt
```

### API Endpoints

#### Get Active BI Recommendations
```
GET /api/recommendations/bi
Authorization: Bearer <token>
```

Returns active (not yet acknowledged) recommendations.

**Example Response:**
```json
[
  {
    "id": "rec123",
    "recommendationType": "stocking",
    "priority": "high",
    "title": "Optimize stocking: Ray-Ban Aviator",
    "description": "You sold 45 units of Ray-Ban Aviator frames over 12 months...",
    "impact": "Potential revenue lift from reduced stockouts...",
    "actionItems": [
      {
        "action": "Increase monthly stock order for Ray-Ban by 20-30%",
        "details": "Current estimated demand: 4 units/month"
      }
    ],
    "estimatedRevenueLift": 5000,
    "acknowledged": false
  }
]
```

#### Run BI Analysis
```
POST /api/recommendations/bi/analyze
Authorization: Bearer <token>
```

Triggers fresh analysis of ECP's data. Creates new recommendations.

#### Acknowledge Recommendation
```
POST /api/recommendations/bi/:id/acknowledge
Authorization: Bearer <token>
```

Marks recommendation as reviewed by ECP.

#### Start Implementation
```
POST /api/recommendations/bi/:id/start-implementation
Authorization: Bearer <token>
```

Marks recommendation as being implemented.

#### Complete Implementation
```
POST /api/recommendations/bi/:id/complete-implementation
Authorization: Bearer <token>
```

Marks recommendation as fully implemented.

### UI Components

#### `BIRecommendationsWidget.tsx`
- Filters recommendations by status (Pending, In Progress, Completed)
- Shows key metrics (revenue lift, error reduction %)
- Expandable details with action items
- Status tracking (Pending → Acknowledged → Implemented → Completed)

**Usage:**
```tsx
<BIRecommendationsWidget
  recommendations={recommendations}
  isLoading={isLoading}
  onAcknowledge={(id) => {...}}
  onStartImplementation={(id) => {...}}
  onCompleteImplementation={(id) => {...}}
/>
```

#### `IntelligentSystemDashboard.tsx`
- Dashboard page showing both features
- Run analysis button
- Statistics cards
- Tabbed interface for alerts vs. recommendations

---

## Integration Points

### Order Creation Flow
When an ECP creates an order:

1. POST `/api/orders` is called with prescription data
2. System can optionally call `/api/orders/analyze-risk` first to get alerts
3. If risk score > threshold, alert is created and returned to ECP
4. ECP can modify prescription parameters and recheck
5. After order creation, analytics data is updated

### Webhook Integration
When a non-adapt is reported via existing non-adapt tracking:
- System calls `PredictiveNonAdaptService.updateAnalyticsOnNonAdapt()`
- Historical data is updated
- Future risk calculations improve

---

## Example User Flows

### Flow 1: Preventing Non-Adapt Before Order
```
ECP enters complex prescription (high-add progressive, wrap frame)
  ↓
System shows alert: "45% non-adapt risk"
  ↓
Recommends: "Try Progressive lens in 1.67 material"
  ↓
ECP modifies prescription and rechecks
  ↓
System shows alert: "12% risk" ✓
  ↓
Order proceeds
```

### Flow 2: Inventory Optimization
```
BI Analysis runs monthly
  ↓
System sees: "Ray-Ban Aviator: 45 units sold/year"
  ↓
Generates recommendation: "Increase stocking by 25%"
  ↓
Estimates: "+$5,000 annual revenue from reduced stockouts"
  ↓
ECP acknowledges and starts implementation
  ↓
After 3 months: Marks as complete
```

---

## Technical Architecture

### Services

**PredictiveNonAdaptService**
- Singleton pattern
- Methods:
  - `analyzeOrderForRisk()` - Calculate risk factors
  - `createAlert()` - Store alert in DB
  - `getActiveAlerts()` - Fetch for ECP
  - `dismissAlert()` - Mark as reviewed
  - `updateAnalyticsOnNonAdapt()` - Learn from non-adapts

**IntelligentPurchasingAssistantService**
- Singleton pattern
- Methods:
  - `analyzeEcpForRecommendations()` - Run full analysis
  - `createRecommendation()` - Store in DB
  - `getActiveRecommendations()` - Fetch for ECP
  - `acknowledgeRecommendation()` - Mark as reviewed
  - `startImplementation()` - Track start
  - `completeImplementation()` - Track completion

### Data Flow
```
Order/Sales Data → Services → Algorithms → Risk/Recommendations
                                             ↓
                                           DB Storage
                                             ↓
                                           API Endpoints
                                             ↓
                                           React Components
```

---

## Configuration & Customization

### Risk Score Thresholds (PredictiveNonAdaptService)
Modify these in the service to adjust sensitivity:
```typescript
private readonly HIGH_WRAP_THRESHOLD = 0.3;
private readonly HIGH_ADD_THRESHOLD = 2.5;
private readonly HIGH_POWER_THRESHOLD = 6.0;
private readonly CRITICAL_RISK_THRESHOLD = 0.45;
private readonly HIGH_RISK_THRESHOLD = 0.30;
```

### BI Analysis Thresholds
Modify in IntelligentPurchasingAssistantService methods:
- Stocking recommendation: `if (product.count > 20)` 
- Error tracking: `if (error.error_count > 5)`

---

## Monitoring & Analytics

Both services create `analyticsEvents` records for:
- Alert creation (with severity)
- Recommendation creation (with type/priority)
- Implementation tracking

This data can be used for:
- Effectiveness analysis
- User engagement metrics
- Feature usage reporting

---

## Future Enhancements

1. **ML Model Integration**: Replace rule-based risk scoring with trained ML model
2. **Patient-Level Preferences**: Learn individual patient adaptation patterns
3. **Competitive Benchmarking**: Compare ECP's metrics to industry averages
4. **Predictive Restocking**: Auto-predict when to reorder based on trends
5. **Prescription Templates**: Save successful Rx/frame combinations as templates
6. **Automated Implementation Tracking**: Integration with inventory systems
7. **Export/Reporting**: CSV exports for analysis in external tools

---

## Testing

### Unit Tests
Example test for risk calculation:
```typescript
test('High add progressive should trigger warning', () => {
  const alert = analyzeOrderForRisk({
    rxProfile: { odAdd: 3.0, ... },
    frameType: 'Sport'
  });
  expect(alert.severity).toBe('warning');
  expect(alert.riskScore).toBeGreaterThan(0.30);
});
```

### Integration Tests
- Create order with complex Rx → Verify alert created
- Run BI analysis → Verify recommendations populated
- Acknowledge recommendation → Verify state changes

### E2E Tests
- ECP workflow: Create order → See alert → Modify Rx → Recheck
- BI workflow: Run analysis → Acknowledge → Start impl → Complete
