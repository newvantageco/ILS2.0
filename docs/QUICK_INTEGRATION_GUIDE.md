# Quick Integration Guide

## Adding Alerts to Order Creation Flow

To integrate the Predictive Non-Adapt Alert into your existing order creation UI, add this code to your order form component:

### Step 1: Add Risk Analysis Hook

```typescript
// In your OrderForm component

const [riskAnalysis, setRiskAnalysis] = useState<any>(null);
const [isAnalyzing, setIsAnalyzing] = useState(false);

const handleAnalyzeRisk = async () => {
  setIsAnalyzing(true);
  try {
    const response = await fetch('/api/orders/analyze-risk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lensType: formData.lensType,
        lensMaterial: formData.lensMaterial,
        frameType: formData.frameType,
        coating: formData.coating,
        odSphere: formData.odSphere,
        // ... all other Rx fields
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      setRiskAnalysis(data.analysis);
    }
  } catch (error) {
    console.error('Risk analysis failed:', error);
  } finally {
    setIsAnalyzing(false);
  }
};
```

### Step 2: Add UI for Risk Check

```jsx
{/* After prescription input section */}
<button
  onClick={handleAnalyzeRisk}
  disabled={isAnalyzing}
  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
>
  {isAnalyzing ? 'Analyzing Risk...' : 'Check Prescription Complexity'}
</button>

{/* Show results if available */}
{riskAnalysis && (
  <div className="mt-4 p-4 border rounded-lg bg-blue-50">
    <h4 className="font-semibold text-lg mb-2">
      Risk Analysis: {Math.round(riskAnalysis.riskScore * 100)}%
    </h4>
    
    {riskAnalysis.severity === 'critical' && (
      <div className="p-3 bg-red-100 border border-red-300 rounded mb-3">
        <p className="text-red-800">⚠️ Critical Risk - Review Recommended</p>
      </div>
    )}
    
    {riskAnalysis.recommendation && (
      <div className="p-3 bg-green-100 border border-green-300 rounded">
        <p className="font-semibold text-green-900">Recommendations:</p>
        <ul className="list-disc pl-5 text-green-800">
          {riskAnalysis.recommendation.lensType && (
            <li>Lens Type: {riskAnalysis.recommendation.lensType}</li>
          )}
          {riskAnalysis.recommendation.material && (
            <li>Material: {riskAnalysis.recommendation.material}</li>
          )}
          {riskAnalysis.recommendation.coating && (
            <li>Coating: {riskAnalysis.recommendation.coating}</li>
          )}
        </ul>
      </div>
    )}
  </div>
)}
```

### Step 3: Add Dashboard Link

Add link to intelligent system dashboard in main navigation:

```jsx
<NavLink to="/intelligent-system">
  <Brain className="w-5 h-5" />
  <span>AI Dashboard</span>
</NavLink>
```

---

## Database Migrations

Run these commands to set up the new tables:

```bash
# Generate migration files from schema
npm run db:generate

# Review the generated migration
# Check migrations/ folder for the new migration file

# Apply to database
npm run db:migrate

# Verify tables were created
psql $DATABASE_URL -c "\dt" | grep -E "prescription_alerts|bi_recommendations|ecp_product_sales|rx_frame_lens"
```

---

## Testing the Features

### Test 1: Prescription Alert

```bash
curl -X POST http://localhost:3000/api/orders/analyze-risk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "lensType": "Progressive",
    "lensMaterial": "1.60",
    "frameType": "Sport Wrap",
    "coating": "AR",
    "odSphere": "3.50",
    "odCylinder": "-0.75",
    "odAxis": "180",
    "odAdd": "3.00",
    "osSphere": "3.75",
    "osCylinder": "-0.50",
    "osAxis": "170",
    "osAdd": "3.00",
    "pd": "62"
  }'
```

Expected response:
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

### Test 2: BI Analysis

```bash
curl -X POST http://localhost:3000/api/recommendations/bi/analyze \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected response:
```json
{
  "message": "Created 3 new recommendations",
  "recommendations": [...]
}
```

### Test 3: View Dashboard

Navigate to: `http://localhost:3000/intelligent-system`

---

## Configuration Tuning

### Adjust Risk Sensitivity

Edit `PredictiveNonAdaptService.ts`:

```typescript
// More aggressive (catch more risks)
private readonly CRITICAL_RISK_THRESHOLD = 0.35; // was 0.45
private readonly HIGH_RISK_THRESHOLD = 0.20;    // was 0.30

// Less aggressive (fewer alerts)
private readonly CRITICAL_RISK_THRESHOLD = 0.60; // was 0.45
private readonly HIGH_RISK_THRESHOLD = 0.45;    // was 0.30
```

### Adjust BI Analysis Thresholds

Edit `IntelligentPurchasingAssistantService.ts`:

```typescript
// Stocking recommendations - only for products sold > X units/year
if (product.count > 50) { // was 20

// Error recommendations - only if > X errors
if (error.error_count > 10) { // was 5
```

---

## Monitoring & Logging

### Check Service Logs

Services log to console with context:
```
[PredictiveNonAdaptService:INFO] Analyzing order for non-adapt risk
[IntelligentPurchasingAssistantService:INFO] Analyzing ECP for BI recommendations
```

### Track Analytics Events

Check `analyticsEvents` table to see:
- When alerts are created
- When recommendations are generated
- Alert severity distribution
- Recommendation type distribution

```sql
SELECT 
  eventType,
  COUNT(*) as count,
  DATE(timestamp) as date
FROM analytics_events
WHERE eventType IN ('order_created', 'order_updated')
GROUP BY eventType, date
ORDER BY date DESC;
```

---

## Common Issues & Solutions

### Issue: "No recommendations generated"
**Solution:** 
- Ensure ECP has invoice/order data in the system
- Run analysis again after creating a few test orders
- Check that products are properly created with ecpId

### Issue: "Risk score always 0"
**Solution:**
- Check that prescription values are valid numbers
- Add, sphere, cylinder should be numeric
- Frame type must be provided for wrap detection

### Issue: Alerts not showing in dashboard
**Solution:**
- Clear browser cache
- Check that prescription alerts were actually created
- Verify correct ECP ID is being used in API calls
- Check browser console for fetch errors

---

## Performance Tuning

### For Large ECPs (500+ orders/year)

1. **Add database indexes:**
```sql
CREATE INDEX idx_orders_ecp_date 
  ON orders(ecp_id, order_date DESC);

CREATE INDEX idx_bi_recs_ecp_priority 
  ON bi_recommendations(ecp_id, priority);
```

2. **Schedule BI analysis for off-peak hours:**
```typescript
// In a cron job service
schedule('0 2 * * *', async () => { // 2 AM daily
  const activeEcps = await db.query.users
    .findMany({ where: eq(users.role, 'ecp') });
  
  for (const ecp of activeEcps) {
    await biService.analyzeEcpForRecommendations(ecp.id);
  }
});
```

3. **Cache recommendation queries:**
```typescript
// Add 5-minute cache for BI recommendations
const cacheKey = `bi-recs:${ecpId}`;
const cached = await cache.get(cacheKey);
if (cached) return cached;

const recs = await biService.getActiveRecommendations(ecpId);
await cache.set(cacheKey, recs, 300); // 5 min TTL
```

---

## Success Checklist

After integration:

- [ ] Risk analysis endpoint returns correct severity levels
- [ ] Alert widget displays in order creation form
- [ ] Can dismiss alerts and proceed with order
- [ ] BI analysis generates recommendations
- [ ] Dashboard filters work correctly
- [ ] Implementation tracking updates properly
- [ ] All TypeScript compiles without errors
- [ ] Mobile view is responsive
- [ ] Dark mode works correctly

---

## Support & Customization

For customizations:

1. **Add new risk factor:**
   - Update `calculateRiskFactors()` in PredictiveNonAdaptService
   - Add weight factor (0-1 range)
   - Update explanation text

2. **Add new recommendation type:**
   - Update schema: `recommendationType` enum
   - Add generate method in IntelligentPurchasingAssistantService
   - Add UI handling in BIRecommendationsWidget

3. **Change alert severity colors:**
   - Edit `severityColors` object in PrescriptionAlertCard
   - Edit `priorityColors` object in BIRecommendationCard

---

**Ready to deploy! Contact your development team with any questions about integration points.**
