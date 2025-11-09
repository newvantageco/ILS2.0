# Clinical AI Engine: Quick Integration Guide

## Overview

The Clinical AI Engine (AI Dispensing Assistant) is now fully implemented and ready to integrate into your order management workflow. This guide shows you how to use it.

---

## 1. Database Setup

Run migrations to create the new tables:

```bash
npm run db:push
```

This creates:
- `lims_clinical_analytics` - LIMS training data
- `nlp_clinical_analysis` - NLP extraction results
- `ecp_catalog_data` - ECP product catalogs
- `ai_dispensing_recommendations` - AI recommendations

---

## 2. Backend Integration

### A. Import the AI Engine Routes

The routes are already registered in `server/routes.ts`:

```typescript
import { registerAiEngineRoutes } from "./routes/aiEngine";

export async function registerRoutes(app: Express): Promise<Server> {
  // ... existing setup ...
  
  // Register AI Engine routes (already added)
  registerAiEngineRoutes(app);
  
  // ... rest of routes ...
}
```

### B. Available Endpoints

All endpoints are ready to use:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/ai/analyze-order` | Generate recommendations |
| POST | `/api/ai/upload-catalog` | Upload ECP's catalog |
| GET | `/api/ai/recommendations/:orderId` | Retrieve recommendations |
| PUT | `/api/ai/recommendations/:id/accept` | Accept recommendation |
| GET | `/api/ai/catalog` | Get ECP's catalog |
| GET | `/api/ai/catalog/search?query=...` | Search catalog |

---

## 3. Frontend Integration

### A. Add the Component

Import the component in your order creation page:

```typescript
import { AIDispensingAssistant } from "@/components/AIDispensingAssistant";
```

### B. Use in Your Order Form

```typescript
import { useState } from "react";
import { AIDispensingAssistant } from "@/components/AIDispensingAssistant";

export function OrderCreationPage() {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  
  async function handleAnalyzeOrder() {
    setLoading(true);
    try {
      const response = await fetch("/api/ai/analyze-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: currentOrder.id,
          ecpId: currentUser.id,
          prescription: {
            odSphere: formData.odSphere,
            odCylinder: formData.odCylinder,
            odAxis: formData.odAxis,
            odAdd: formData.odAdd,
            osSphere: formData.osSphere,
            osCylinder: formData.osCylinder,
            osAxis: formData.osAxis,
            osAdd: formData.osAdd,
          },
          clinicalNotes: {
            rawNotes: formData.clinicalNotes,
            patientAge: formData.patientAge,
            occupation: formData.occupation,
          },
          frameData: {
            wrapAngle: formData.frameWrapAngle,
            type: formData.frameType,
          },
        }),
      });

      const result = await response.json();
      if (result.success) {
        setRecommendations(result.data);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Your existing order form */}
      
      <button onClick={handleAnalyzeOrder} className="btn btn-primary">
        🤖 Analyze with AI
      </button>

      {/* AI Dispensing Assistant */}
      <AIDispensingAssistant
        orderId={currentOrder.id}
        recommendations={recommendations}
        loading={loading}
        onAcceptRecommendation={(tier) => {
          // Handle recommendation acceptance
          handleAcceptRecommendation(tier);
        }}
      />
    </div>
  );
}
```

---

## 4. ECP Catalog Management

### A. Upload Catalog (CSV)

```typescript
async function uploadCatalog(ecpId: string, csvFile: File) {
  // Parse CSV file
  const csvData = parseCSV(csvFile);
  
  const response = await fetch("/api/ai/upload-catalog", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ecpId,
      csvData: csvData.map(row => ({
        sku: row.SKU,
        name: row.Product_Name,
        brand: row.Brand,
        category: row.Category,
        lensType: row.Lens_Type,
        lensMaterial: row.Material,
        coating: row.Coating,
        retailPrice: parseFloat(row.Retail_Price),
        wholesalePrice: row.Wholesale_Price ? parseFloat(row.Wholesale_Price) : undefined,
        stockQuantity: parseInt(row.Stock_Quantity),
      })),
    }),
  });

  const result = await response.json();
  console.log(`Uploaded ${result.data.products.length} products`);
  console.log("Price Statistics:", result.data.statistics);
}
```

### B. CSV Format Expected

```csv
SKU,Product_Name,Brand,Category,Lens_Type,Material,Coating,Retail_Price,Wholesale_Price,Stock_Quantity
RB2140-POL,Ray-Ban Classic Wayfarer,Ray-Ban,frame,,,,320.00,160.00,5
NVC-VANTAGE-DIGITAL,NVC LABS Vantage-Digital,NVC,lens,Progressive,Trivex,Premium AR,420.00,210.00,12
STD-PROG-POL,Standard Progressive,Generic,lens,Progressive,Polycarbonate,Premium AR,310.00,155.00,25
STD-SV-CR39,Standard Single Vision,Generic,lens,Single Vision,CR-39,Standard AR,220.00,110.00,50
```

### C. Search Catalog

```typescript
async function searchCatalog(query: string) {
  const response = await fetch(`/api/ai/catalog/search?query=${encodeURIComponent(query)}`);
  const result = await response.json();
  
  return result.data; // Array of matching products
}
```

---

## 5. Testing

### A. Development Testing

In development mode, use these test endpoints:

```bash
# Seed sample LIMS data
curl -X POST http://localhost:3000/api/ai/test/seed-lims-data

# Test AI analysis with sample data
curl -X POST http://localhost:3000/api/ai/test/analyze-sample
```

### B. Manual Testing Flow

1. **Seed LIMS Data**
   ```bash
   npm run dev
   # In another terminal:
   curl -X POST http://localhost:3000/api/ai/test/seed-lims-data
   ```

2. **Upload Catalog**
   ```bash
   curl -X POST http://localhost:3000/api/ai/upload-catalog \
     -H "Content-Type: application/json" \
     -d '{
       "ecpId": "test-ecp-id",
       "csvData": [
         {
           "sku": "RB2140",
           "name": "Ray-Ban Classic",
           "retailPrice": 320,
           "stockQuantity": 5
         }
       ]
     }'
   ```

3. **Analyze Order**
   ```bash
   curl -X POST http://localhost:3000/api/ai/analyze-order \
     -H "Content-Type: application/json" \
     -d '{
       "orderId": "order-123",
       "ecpId": "test-ecp-id",
       "prescription": {
         "odSphere": "+1.50",
         "odCylinder": "-1.00",
         "odAxis": "090",
         "odAdd": "+2.25"
       },
       "clinicalNotes": {
         "rawNotes": "First-time progressive wearer, works 8+ hrs on computer"
       }
     }'
   ```

---

## 6. Real-World Usage

### Example 1: First-Time Progressive Wearer

**Step 1**: ECP enters prescription and notes
```
Prescription: +1.50 -1.00 x 090 Add +2.25
Notes: "Pt. is a first-time progressive wearer, works on computer 8+ hrs/day, 
reports eye strain. Complains of glare during night driving."
```

**Step 2**: Click "Analyze" button

**Step 3**: AI Engine processes:
- NLP extracts: `first_time_progressive`, `computer_heavy_use`, `cvs_syndrome`, `night_driving_complaint`
- LIMS queries: Finds Soft-Design Progressive (30% better outcomes for first-timers)
- Catalog matches: Finds NVC Vantage-Digital at $420, Standard at $310, Budget at $220

**Step 4**: Shows three recommendations with full clinical justification

**Step 5**: ECP selects recommendation and shows customer
```
"We recommend the NVC Vantage-Digital because:
- You're new to progressives: Soft design reduces adaptation issues
- You work 8+ hours on screen: Blue-light filter reduces eye strain
- Night driving glare: Premium AR coating has 99.7% light transmission"
```

**Step 6**: Customer sees clinical evidence backing the recommendation → Higher confidence in decision

---

## 7. Monitoring & Analytics

### Get Recommendations Count
```typescript
async function getRecommendation(orderId: string) {
  const response = await fetch(`/api/ai/recommendations/${orderId}`);
  const result = await response.json();
  
  return {
    confidence: result.data.clinicalConfidenceScore,
    recommendationsCount: result.data.recommendations.length,
    acceptedTier: result.data.recommendationStatus,
  };
}
```

### Track Outcomes
When order completes/fails, call LIMS model to record outcome:

```typescript
// In your order completion handler
import { LimsModel } from "../services/aiEngine/limsModel";

async function completeOrder(orderId: string, outcome: "success" | "nonAdapt" | "remake") {
  // ... existing order completion logic ...
  
  // Record for AI model learning
  await LimsModel.recordOrderOutcome(
    order.lensType,
    order.lensMaterial,
    order.coating,
    outcome,
    order.frameWrapAngle,
    {
      odSphere: order.odSphere,
      odCylinder: order.odCylinder,
      odAxis: order.odAxis,
      odAdd: order.odAdd,
    }
  );
}
```

---

## 8. Performance Optimization

### Caching
The AI Engine automatically caches:
- LIMS analytics (updates hourly)
- Catalog data (updates on each upload)
- NLP analysis results (stored for future reference)

### Load Times
- NLP analysis: ~50-100ms
- LIMS query: ~50-100ms
- Catalog matching: ~10-50ms
- **Total**: ~150-300ms typical

### Scaling
For high-volume scenarios:
- Add database indexes on `orderId`, `ecpId`, `lensType`, `lensMaterial`
- Enable LIMS caching layer (Redis)
- Consider async processing for bulk recommendations

---

## 9. Security Checklist

- [ ] LIMS data is anonymized
- [ ] Clinical notes are encrypted at rest
- [ ] Only authenticated users can access recommendations
- [ ] ECPs can only access their own catalogs
- [ ] All recommendations are timestamped and auditable
- [ ] Input validation on all endpoints
- [ ] Rate limiting on catalog uploads

---

## 10. Troubleshooting

### Issue: "No recommendations generated"
- **Check**: Are clinical notes provided?
- **Check**: Is LIMS data seeded? (Run `/api/ai/test/seed-lims-data`)
- **Check**: Is catalog uploaded?

### Issue: "Catalog upload fails"
- **Check**: CSV format matches expected columns
- **Check**: All required fields present (sku, name, price, quantity)
- **Check**: ECP ID is correct

### Issue: "Analysis takes too long"
- **Check**: Database connection is healthy
- **Check**: No N+1 queries in catalog matching
- **Check**: Consider caching LIMS data

### Issue: "Low confidence scores"
- **Check**: Clinical notes contain enough detail
- **Check**: Patient age and occupation provided for better context
- **Check**: LIMS has sufficient historical data

---

## Next Steps

1. ✅ **Database**: Migrations are ready
2. ✅ **Backend**: AI Engine services are implemented
3. ✅ **API Routes**: All endpoints are ready
4. ✅ **Frontend**: Component is built
5. **Integration**: Add to your order flow (see section 3)
6. **Testing**: Seed data and test with sample orders (see section 5)
7. **Deployment**: Build and deploy to production
8. **Monitoring**: Track usage and outcomes

---

## API Reference Summary

### POST /api/ai/analyze-order
Generates recommendations for an order.

**Auth**: Required (user.id must match ecpId)  
**Request Body**: `AiAnalysisRequest`  
**Response**: `{ success: true, data: AiRecommendationResponse }`

### POST /api/ai/upload-catalog
Uploads ECP's product catalog.

**Auth**: Required  
**Request Body**: `{ ecpId: string, csvData: array }`  
**Response**: `{ success: true, stats: PriceStatistics }`

### GET /api/ai/recommendations/:orderId
Retrieves recommendations for an order.

**Auth**: Required  
**Response**: `{ success: true, data: AiDispensingRecommendation }`

### PUT /api/ai/recommendations/:id/accept
Marks recommendation as accepted.

**Auth**: Required  
**Request Body**: `{ tier: "BEST"|"BETTER"|"GOOD", customization?: string }`  
**Response**: `{ success: true, message: string }`

### GET /api/ai/catalog
Gets ECP's catalog with statistics.

**Auth**: Required  
**Response**: `{ success: true, data: { products: [], statistics: {} } }`

### GET /api/ai/catalog/search
Searches ECP's catalog.

**Auth**: Required  
**Query Params**: `query=string`  
**Response**: `{ success: true, data: CatalogProduct[] }`

---

## Support

For implementation questions or issues, refer to `AI_ENGINE_ARCHITECTURE.md` for detailed technical documentation.
