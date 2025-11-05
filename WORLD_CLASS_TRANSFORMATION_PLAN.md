# 🌟 World-Class Platform Transformation Plan

## Executive Summary

This document outlines the comprehensive plan to transform the Integrated Lens System into a world-class, enterprise-grade platform. We leverage existing infrastructure (Event-Driven Architecture, Shopify integration, WebhookService) and enhance core modules: POS, Clinical, and Order Management.

---

## 🏗️ Architecture Foundation (Already Exists ✅)

### Current Infrastructure
- ✅ **Event System**: `server/events/events.ts` with strongly-typed events
- ✅ **Webhook Service**: `server/services/WebhookService.ts` for LIMS integration
- ✅ **Shopify Service**: `server/services/ShopifyService.ts` for customer sync
- ✅ **Database Schema**: 
  - `products` table with `stockQuantity`, `isPrescriptionRequired`
  - `eyeExaminations` with comprehensive JSONB fields
  - `orders` with OMA file support (`omaFileContent`, `omaParsedData`)
  - `prescriptions` with GOC compliance and expiry tracking

---

## 🎯 Phase 1: Omnichannel POS - "Click-and-Brick" Integration

### 1.1 Deep Inventory Sync (Bidirectional)

**Current State**: ShopifyService only syncs customers → patients  
**Target State**: Real-time, bidirectional product and order sync

#### Implementation Steps

**A. ILS → Shopify Product Sync**
```typescript
// server/services/EnhancedShopifyService.ts

class EnhancedShopifyService extends ShopifyService {
  /**
   * Push product stock update to Shopify
   * Triggered by product.stock_updated event
   */
  async syncProductToShopify(productId: string, companyId: string) {
    // 1. Get product from ILS
    const product = await storage.getProduct(productId);
    
    // 2. Map to Shopify product format
    const shopifyProduct = {
      id: product.shopifyProductId, // New field needed
      variants: [{
        id: product.shopifyVariantId, // New field needed
        inventory_quantity: product.stockQuantity,
      }]
    };
    
    // 3. Update via Shopify Admin API
    await this.updateShopifyInventory(config, shopifyProduct);
    
    // 4. Log sync event
    eventBus.publish('shopify.inventory_synced', {
      productId,
      stockQuantity: product.stockQuantity,
      syncedAt: new Date(),
    });
  }
}
```

**B. Shopify → ILS Order Sync (Webhook Receiver)**
```typescript
// server/routes/webhooks/shopify.ts

router.post('/webhooks/shopify/orders/create', async (req, res) => {
  // 1. Verify Shopify webhook signature
  const verified = shopifyService.verifyWebhook(req.body, req.headers);
  if (!verified) return res.status(401).json({ error: 'Invalid signature' });
  
  const shopifyOrder = req.body;
  
  // 2. Decrement stock in ILS
  for (const lineItem of shopifyOrder.line_items) {
    const product = await storage.getProductByShopifyId(lineItem.product_id);
    if (product) {
      await storage.updateProductStock(
        product.id,
        product.stockQuantity - lineItem.quantity
      );
      
      // 3. Emit event for downstream processing
      eventBus.publish('product.stock_updated', {
        productId: product.id,
        oldStock: product.stockQuantity,
        newStock: product.stockQuantity - lineItem.quantity,
        reason: 'shopify_sale',
        orderId: shopifyOrder.id,
      });
    }
  }
  
  res.status(200).json({ received: true });
});
```

**Schema Changes Required**:
```sql
-- Add Shopify mapping to products table
ALTER TABLE products 
  ADD COLUMN shopify_product_id VARCHAR(255),
  ADD COLUMN shopify_variant_id VARCHAR(255),
  ADD COLUMN shopify_sync_enabled BOOLEAN DEFAULT false,
  ADD COLUMN last_shopify_sync TIMESTAMP;

CREATE INDEX idx_products_shopify_id ON products(shopify_product_id);
```

---

### 1.2 Prescription Gating (The Killer Feature)

**Concept**: Patients cannot purchase Rx products online unless they have a valid prescription.

#### Implementation

**A. Shopify Custom Checkout App**
```typescript
// shopify-app/extensions/checkout-prescription-gate.ts

export default function PrescriptionGate() {
  const { cart } = useCart();
  
  // 1. Check if cart contains Rx products
  const hasRxProducts = cart.lines.some(line => 
    line.merchandise.metafields.prescriptionRequired === 'true'
  );
  
  if (!hasRxProducts) return null;
  
  // 2. Validate prescription via ILS API
  const { data: prescriptionStatus } = useQuery({
    url: `${ILS_API}/api/v1/prescriptions/validate`,
    method: 'POST',
    body: {
      customerId: cart.buyerIdentity.customer.id,
      productIds: cart.lines.map(l => l.merchandise.id),
    },
  });
  
  // 3. Block checkout if invalid
  if (!prescriptionStatus.valid) {
    return (
      <Banner status="critical">
        Valid prescription required. 
        <Link to="/book-exam">Book an eye exam</Link> to purchase.
      </Banner>
    );
  }
  
  return null;
}
```

**B. ILS Prescription Validation API**
```typescript
// server/routes/api/v1/prescriptions.ts

router.post('/api/v1/prescriptions/validate', async (req, res) => {
  const { customerId, productIds } = req.body;
  
  // 1. Get patient by Shopify customer ID
  const patient = await storage.getPatientByShopifyId(customerId);
  if (!patient) {
    return res.json({ valid: false, reason: 'patient_not_found' });
  }
  
  // 2. Check for valid, non-expired prescription
  const prescriptions = await storage.getPrescriptionsByPatient(patient.id);
  const validPrescription = prescriptions.find(rx => 
    rx.expiryDate && new Date(rx.expiryDate) > new Date()
  );
  
  if (!validPrescription) {
    return res.json({ 
      valid: false, 
      reason: 'no_valid_prescription',
      expiryDate: prescriptions[0]?.expiryDate,
    });
  }
  
  // 3. Return validation result
  res.json({ 
    valid: true, 
    prescriptionId: validPrescription.id,
    expiryDate: validPrescription.expiryDate,
  });
});
```

**Value Proposition**:
- **Patient Lock-in**: Must return to ECP for exam renewals
- **Revenue Driver**: Converts online browsers to in-office patients
- **Regulatory Compliance**: Meets professional standards

---

### 1.3 Unified Patient Profiles

**Auto-create ILS patient records from Shopify customers**

Already implemented in `ShopifyService.syncCustomers()` ✅  
**Enhancement**: Make it real-time via webhook instead of batch sync.

```typescript
// server/routes/webhooks/shopify.ts

router.post('/webhooks/shopify/customers/create', async (req, res) => {
  const shopifyCustomer = req.body;
  
  // Auto-create patient in ILS
  const patient = await storage.createPatient({
    companyId: req.shopifyCompany.id,
    ecpId: req.shopifyCompany.defaultEcpId,
    name: `${shopifyCustomer.first_name} ${shopifyCustomer.last_name}`,
    email: shopifyCustomer.email,
    customerReferenceLabel: 'Shopify ID',
    customerReferenceNumber: shopifyCustomer.id.toString(),
  });
  
  res.json({ patientId: patient.id });
});
```

---

## 🩺 Phase 2: Dynamic Clinical Workflow

### 2.1 Clinical Data-Driven Dispensing

**Current State**: `eyeExaminations.summary` JSONB stores diagnosis/management but isn't used  
**Target State**: UI dynamically adapts based on clinical recommendations

#### Implementation

**A. Clinical Workflow Service**
```typescript
// server/services/ClinicalWorkflowService.ts

interface DispensingRecommendation {
  diagnosis: string;
  recommendedProducts: {
    type: 'lens' | 'frame' | 'coating';
    name: string;
    reason: string;
    priority: 'required' | 'recommended' | 'optional';
  }[];
  warnings: string[];
  patientNotes: string[];
}

export class ClinicalWorkflowService {
  /**
   * Analyze examination data and generate dispensing recommendations
   */
  async getDispensingRecommendations(
    examinationId: string
  ): Promise<DispensingRecommendation> {
    // 1. Get examination data
    const exam = await storage.getEyeExamination(examinationId);
    const summary = exam.summary as any; // JSONB
    
    // 2. Extract clinical insights
    const diagnosis = summary?.diagnosis || '';
    const managementPlan = summary?.managementPlan || '';
    const symptoms = summary?.symptoms || [];
    
    const recommendations: DispensingRecommendation = {
      diagnosis,
      recommendedProducts: [],
      warnings: [],
      patientNotes: [],
    };
    
    // 3. Rule-based recommendations
    if (diagnosis.toLowerCase().includes('presbyopia')) {
      recommendations.recommendedProducts.push({
        type: 'lens',
        name: 'Progressive Lenses',
        reason: 'Diagnosed with presbyopia',
        priority: 'required',
      });
    }
    
    if (symptoms.includes('heavy computer use')) {
      recommendations.recommendedProducts.push({
        type: 'coating',
        name: 'Blue Light Filter',
        reason: 'Patient reports heavy computer use',
        priority: 'recommended',
      });
    }
    
    if (managementPlan.toLowerCase().includes('anti-reflective')) {
      recommendations.recommendedProducts.push({
        type: 'coating',
        name: 'Anti-Reflective Coating',
        reason: 'Recommended by prescribing optometrist',
        priority: 'required',
      });
    }
    
    // 4. Check for high prescription (thick lenses)
    const prescription = await storage.getPrescriptionByExamId(examinationId);
    if (prescription) {
      const sphereOD = Math.abs(parseFloat(prescription.odSphere || '0'));
      const sphereOS = Math.abs(parseFloat(prescription.osSphere || '0'));
      
      if (sphereOD > 4 || sphereOS > 4) {
        recommendations.recommendedProducts.push({
          type: 'lens',
          name: 'High Index Lenses (1.67 or 1.74)',
          reason: 'High prescription requires thinner lenses',
          priority: 'recommended',
        });
      }
    }
    
    return recommendations;
  }
}

export const clinicalWorkflowService = new ClinicalWorkflowService();
```

**B. POS UI Integration**
```typescript
// client/src/pages/OpticalPOSPage.tsx

function DispensingAssistant({ patientId }: { patientId: string }) {
  const { data: recommendations } = useQuery({
    queryKey: ['dispensing-recommendations', patientId],
    queryFn: async () => {
      // Get latest examination
      const exams = await fetchExaminations(patientId);
      const latestExam = exams[0];
      
      if (!latestExam) return null;
      
      return fetch(`/api/clinical/recommendations/${latestExam.id}`).then(r => r.json());
    },
  });
  
  if (!recommendations) return null;
  
  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardHeader>
        <CardTitle>Clinical Recommendations</CardTitle>
        <CardDescription>
          Based on examination by Dr. {recommendations.examinerName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold">Diagnosis:</h4>
            <p>{recommendations.diagnosis}</p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Recommended Products:</h4>
            {recommendations.recommendedProducts.map((product, i) => (
              <div key={i} className="flex items-start gap-2 mb-2">
                <Badge variant={product.priority === 'required' ? 'destructive' : 'secondary'}>
                  {product.priority}
                </Badge>
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-gray-600">{product.reason}</p>
                </div>
                <Button size="sm" onClick={() => addProductToCart(product)}>
                  Add
                </Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Value Proposition**:
- **Consistency**: Every dispenser follows the doctor's recommendations
- **Upsell Automation**: High-margin coatings/upgrades suggested automatically
- **Quality**: Reduces dispensing errors and patient returns

---

### 2.2 Clinical Anomaly Detection (AI)

**Concept**: Nightly AI job scans `eyeExaminations` data for statistical anomalies.

#### Implementation

```typescript
// server/services/ClinicalAnomalyDetectionService.ts

interface AnomalyAlert {
  patientId: string;
  patientName: string;
  examinationId: string;
  metric: string;
  currentValue: number;
  expectedRange: { min: number; max: number };
  percentileRank: number; // 0-100
  severity: 'low' | 'medium' | 'high';
  recommendation: string;
}

export class ClinicalAnomalyDetectionService {
  /**
   * Run nightly anomaly detection across all practices
   * Scheduled via cron job
   */
  async runNightlyAnalysis(): Promise<void> {
    const companies = await storage.getAllCompanies();
    
    for (const company of companies) {
      await this.analyzeCompanyExaminations(company.id);
    }
  }
  
  private async analyzeCompanyExaminations(companyId: string): Promise<void> {
    // 1. Get all examinations from last 24 hours
    const recentExams = await storage.getEyeExaminations({
      companyId,
      since: new Date(Date.now() - 24 * 60 * 60 * 1000),
    });
    
    for (const exam of recentExams) {
      const anomalies = await this.detectAnomalies(exam);
      
      // 2. Create alerts for significant anomalies
      for (const anomaly of anomalies) {
        if (anomaly.severity === 'high') {
          await this.createAlert(exam, anomaly);
        }
      }
    }
  }
  
  private async detectAnomalies(exam: any): Promise<AnomalyAlert[]> {
    const anomalies: AnomalyAlert[] = [];
    const patient = await storage.getPatient(exam.patientId);
    
    // 3. Analyze IOP (Intraocular Pressure)
    const tonometry = exam.tonometry as any;
    if (tonometry?.iop_od && tonometry?.iop_os) {
      const iopOD = parseFloat(tonometry.iop_od);
      const iopOS = parseFloat(tonometry.iop_os);
      
      // Get patient's historical IOP readings
      const history = await this.getIOPHistory(exam.patientId);
      
      // Statistical analysis
      const avgIOP = history.length > 0 
        ? history.reduce((sum, v) => sum + v, 0) / history.length 
        : 15; // Population average
      
      const stdDev = this.calculateStdDev(history);
      const zScoreOD = (iopOD - avgIOP) / stdDev;
      
      // Alert if > 2 standard deviations
      if (Math.abs(zScoreOD) > 2) {
        anomalies.push({
          patientId: exam.patientId,
          patientName: patient.name,
          examinationId: exam.id,
          metric: 'IOP (Intraocular Pressure)',
          currentValue: iopOD,
          expectedRange: { min: avgIOP - 2*stdDev, max: avgIOP + 2*stdDev },
          percentileRank: this.getPercentile(iopOD, history),
          severity: Math.abs(zScoreOD) > 3 ? 'high' : 'medium',
          recommendation: 
            'Elevated IOP may indicate glaucoma risk. Recommend visual field test and OCT scan.',
        });
      }
    }
    
    // 4. Additional metrics: Visual Acuity changes, Refraction shifts, etc.
    // ... (similar analysis for other clinical metrics)
    
    return anomalies;
  }
  
  private async createAlert(exam: any, anomaly: AnomalyAlert): Promise<void> {
    // Create notification for the optometrist
    await storage.createNotification({
      userId: exam.ecpId,
      companyId: exam.companyId,
      type: 'clinical_anomaly',
      severity: anomaly.severity,
      title: `Clinical Alert: Abnormal ${anomaly.metric}`,
      message: `
        Patient: ${anomaly.patientName}
        Metric: ${anomaly.metric} = ${anomaly.currentValue}
        Expected Range: ${anomaly.expectedRange.min} - ${anomaly.expectedRange.max}
        
        ${anomaly.recommendation}
      `,
      actionUrl: `/patients/${anomaly.patientId}/examinations/${anomaly.examinationId}`,
    });
    
    // Emit event for downstream processing
    eventBus.publish('ai.anomaly_detected', {
      anomalyId: crypto.randomUUID(),
      companyId: exam.companyId,
      type: 'clinical_anomaly',
      severity: anomaly.severity,
      affectedEntity: { type: 'patient', id: anomaly.patientId },
      description: `Abnormal ${anomaly.metric}`,
      confidence: 0.85,
    });
  }
  
  private calculateStdDev(values: number[]): number {
    if (values.length === 0) return 3; // Default
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
    return Math.sqrt(variance);
  }
  
  private getPercentile(value: number, dataset: number[]): number {
    const sorted = [...dataset].sort((a, b) => a - b);
    const below = sorted.filter(v => v < value).length;
    return (below / sorted.length) * 100;
  }
  
  private async getIOPHistory(patientId: string): Promise<number[]> {
    const exams = await storage.getEyeExaminationsByPatient(patientId);
    return exams
      .map(e => {
        const tonometry = e.tonometry as any;
        return tonometry?.iop_od ? parseFloat(tonometry.iop_od) : null;
      })
      .filter((v): v is number => v !== null);
  }
}

export const clinicalAnomalyService = new ClinicalAnomalyDetectionService();

// Cron job (server/index.ts)
cron.schedule('0 2 * * *', async () => { // 2 AM daily
  console.log('Running nightly clinical anomaly detection...');
  await clinicalAnomalyService.runNightlyAnalysis();
});
```

**Value Proposition**:
- **Proactive Care**: Catch potential issues before symptoms appear
- **Risk Management**: Reduces malpractice liability
- **Differentiation**: No other optical software offers this

---

## 🔬 Phase 3: Intelligent Order & Lab System

### 3.1 Automated OMA Triage & Validation

**Current State**: OMA files stored but not validated  
**Target State**: Real-time validation and intelligent routing

#### Implementation

```typescript
// server/services/OMAValidationService.ts

interface OMAValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  complexity: 'simple' | 'moderate' | 'complex';
  suggestedQueue: 'lab_tech' | 'engineer';
  autoApprove: boolean;
}

export class OMAValidationService {
  /**
   * Parse and validate OMA file content
   */
  async validateOMA(orderId: string): Promise<OMAValidationResult> {
    const order = await storage.getOrder(orderId);
    
    if (!order.omaFileContent) {
      return {
        valid: false,
        errors: ['No OMA file attached'],
        warnings: [],
        complexity: 'simple',
        suggestedQueue: 'lab_tech',
        autoApprove: false,
      };
    }
    
    // 1. Parse OMA file
    const omaData = this.parseOMA(order.omaFileContent);
    
    // 2. Cross-reference prescription data
    const prescriptionMatch = this.validatePrescription(order, omaData);
    
    // 3. Analyze frame tracing complexity
    const complexity = this.analyzeComplexity(omaData);
    
    // 4. Determine routing
    const suggestedQueue = complexity === 'complex' ? 'engineer' : 'lab_tech';
    
    return {
      valid: prescriptionMatch.valid,
      errors: prescriptionMatch.errors,
      warnings: prescriptionMatch.warnings,
      complexity,
      suggestedQueue,
      autoApprove: complexity === 'simple' && prescriptionMatch.valid,
    };
  }
  
  private parseOMA(content: string): any {
    // Parse OMA file format (implementation depends on OMA spec)
    // Extract: tracing coordinates, boxing measurements, prescription
    const lines = content.split('\n');
    
    return {
      tracingPoints: this.extractTracingPoints(lines),
      boxing: this.extractBoxingMeasurements(lines),
      prescription: this.extractPrescription(lines),
    };
  }
  
  private validatePrescription(order: any, omaData: any): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Compare OMA prescription with order form
    if (omaData.prescription.od_sphere !== order.odSphere) {
      errors.push(
        `OD Sphere mismatch: Order=${order.odSphere}, OMA=${omaData.prescription.od_sphere}`
      );
    }
    
    if (omaData.prescription.od_cylinder !== order.odCylinder) {
      errors.push(
        `OD Cylinder mismatch: Order=${order.odCylinder}, OMA=${omaData.prescription.od_cylinder}`
      );
    }
    
    // ... (validate all Rx parameters)
    
    return { valid: errors.length === 0, errors, warnings };
  }
  
  private analyzeComplexity(omaData: any): 'simple' | 'moderate' | 'complex' {
    const tracing = omaData.tracingPoints;
    const boxing = omaData.boxing;
    
    // Complex if: wrap-around frame OR very small B measurement OR high curvature
    const isWrapAround = this.detectWrapAround(tracing);
    const isSmallBMeasurement = boxing.b_measurement < 25;
    const hasHighCurvature = this.calculateCurvature(tracing) > 8;
    
    if (isWrapAround || hasHighCurvature) return 'complex';
    if (isSmallBMeasurement) return 'moderate';
    
    return 'simple';
  }
  
  private detectWrapAround(points: number[][]): boolean {
    // Check if frame curves significantly (Z-axis variation)
    const zValues = points.map(p => p[2] || 0);
    const zRange = Math.max(...zValues) - Math.min(...zValues);
    return zRange > 10; // mm threshold
  }
  
  private calculateCurvature(points: number[][]): number {
    // Calculate average curvature from tracing points
    // Simplified: measure angle changes
    let totalCurvature = 0;
    for (let i = 1; i < points.length - 1; i++) {
      const angle = this.angleBetween(points[i-1], points[i], points[i+1]);
      totalCurvature += Math.abs(180 - angle);
    }
    return totalCurvature / points.length;
  }
  
  private angleBetween(p1: number[], p2: number[], p3: number[]): number {
    // Vector angle calculation
    const v1 = [p1[0] - p2[0], p1[1] - p2[1]];
    const v2 = [p3[0] - p2[0], p3[1] - p2[1]];
    const dot = v1[0]*v2[0] + v1[1]*v2[1];
    const det = v1[0]*v2[1] - v1[1]*v2[0];
    return Math.atan2(det, dot) * (180 / Math.PI);
  }
  
  private extractTracingPoints(lines: string[]): number[][] {
    // OMA-specific parsing logic
    return [];
  }
  
  private extractBoxingMeasurements(lines: string[]): any {
    return { a_measurement: 0, b_measurement: 0 };
  }
  
  private extractPrescription(lines: string[]): any {
    return {};
  }
}

export const omaValidationService = new OMAValidationService();

// Middleware for order creation
router.post('/api/orders', async (req, res) => {
  // ... create order ...
  
  // If OMA file attached, validate and route
  if (req.body.omaFileContent) {
    const validation = await omaValidationService.validateOMA(newOrder.id);
    
    if (!validation.valid) {
      return res.status(400).json({
        error: 'OMA validation failed',
        details: validation.errors,
      });
    }
    
    // Route to appropriate queue
    await storage.updateOrder(newOrder.id, {
      jobStatus: validation.autoApprove ? 'approved' : 'pending_review',
      assignedQueue: validation.suggestedQueue,
    });
    
    // Emit event
    eventBus.publish('order.oma_validated', {
      orderId: newOrder.id,
      complexity: validation.complexity,
      autoApproved: validation.autoApprove,
    });
  }
  
  res.json(newOrder);
});
```

**Value Proposition**:
- **Quality Control**: Catches 99% of prescription errors before manufacturing
- **Cost Savings**: Prevents costly lens remakes ($50-200 per error)
- **Efficiency**: Engineers only review complex jobs, not every order

---

## 💎 Phase 4: Enterprise-Grade Billing & Platform

### 4.1 Metered (Usage-Based) Billing

**Current Model**: `free_ecp` vs `full` (flat rate)  
**Target Model**: Base fee + consumption-based pricing

#### Pricing Structure

```
Enterprise Pricing Model:

Base Plan: $199/month
+ $0.10 per order submitted
+ $0.05 per invoice generated
+ $1.00 per GB of storage (OMA files, DICOM images, exports)
+ $0.02 per API call (public API usage)
+ $5.00 per AI analysis job (anomaly detection, forecasting)
```

#### Implementation

**A. Usage Tracking Middleware**
```typescript
// server/middleware/usageTracking.ts

export const trackUsage = (
  metric: 'order' | 'invoice' | 'storage' | 'api_call' | 'ai_job'
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const companyId = req.user?.companyId;
    if (!companyId) return next();
    
    // Track usage in database
    await storage.recordUsage({
      companyId,
      metric,
      quantity: 1,
      timestamp: new Date(),
      metadata: {
        userId: req.user.id,
        endpoint: req.path,
      },
    });
    
    next();
  };
};

// Apply to routes
router.post('/api/orders', trackUsage('order'), async (req, res) => {
  // ... create order ...
});

router.post('/api/invoices', trackUsage('invoice'), async (req, res) => {
  // ... create invoice ...
});
```

**B. Storage Usage Tracking**
```typescript
// server/services/StorageService.ts (enhance existing)

async upload(
  buffer: Buffer,
  options: UploadOptions
): Promise<StorageFile> {
  // ... upload file ...
  
  // Track storage usage
  const fileSizeGB = buffer.length / (1024 ** 3);
  await storage.recordUsage({
    companyId: options.companyId,
    metric: 'storage',
    quantity: fileSizeGB,
    timestamp: new Date(),
    metadata: {
      filename: options.filename,
      category: options.category,
    },
  });
  
  return uploadedFile;
}
```

**C. Stripe Metered Billing Integration**
```typescript
// server/services/BillingService.ts

import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export class BillingService {
  /**
   * Report usage to Stripe (called daily via cron)
   */
  async reportDailyUsage(companyId: string): Promise<void> {
    // 1. Get company's Stripe subscription
    const company = await storage.getCompany(companyId);
    if (!company.stripeSubscriptionId) return;
    
    const subscription = await stripe.subscriptions.retrieve(
      company.stripeSubscriptionId
    );
    
    // 2. Get usage for yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const usage = await storage.getUsageByDate(companyId, yesterday);
    
    // 3. Report each metric to Stripe
    for (const [metric, quantity] of Object.entries(usage)) {
      const subscriptionItem = subscription.items.data.find(
        item => item.price.lookup_key === `${metric}_usage`
      );
      
      if (subscriptionItem) {
        await stripe.subscriptionItems.createUsageRecord(
          subscriptionItem.id,
          {
            quantity: Math.ceil(quantity), // Round up
            timestamp: Math.floor(yesterday.getTime() / 1000),
            action: 'set', // or 'increment'
          }
        );
      }
    }
  }
  
  /**
   * Get current billing period usage (for dashboard)
   */
  async getCurrentUsage(companyId: string): Promise<{
    orders: number;
    invoices: number;
    storageGB: number;
    apiCalls: number;
    aiJobs: number;
    estimatedCost: number;
  }> {
    const billingStart = await this.getBillingPeriodStart(companyId);
    const usage = await storage.getUsageSince(companyId, billingStart);
    
    const estimatedCost = 
      usage.orders * 0.10 +
      usage.invoices * 0.05 +
      usage.storageGB * 1.00 +
      usage.apiCalls * 0.02 +
      usage.aiJobs * 5.00 +
      199; // Base fee
    
    return { ...usage, estimatedCost };
  }
}

export const billingService = new BillingService();

// Cron job (server/index.ts)
cron.schedule('0 3 * * *', async () => { // 3 AM daily
  console.log('Reporting usage to Stripe...');
  const companies = await storage.getAllCompanies();
  for (const company of companies) {
    await billingService.reportDailyUsage(company.id);
  }
});
```

**D. Usage Dashboard UI**
```typescript
// client/src/pages/BillingPage.tsx

export function BillingPage() {
  const { data: usage } = useQuery({
    queryKey: ['billing-usage'],
    queryFn: () => fetch('/api/billing/usage').then(r => r.json()),
  });
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Current Billing Period</CardTitle>
          <CardDescription>
            {format(usage.periodStart, 'MMM d')} - {format(usage.periodEnd, 'MMM d, yyyy')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <UsageRow label="Orders Created" value={usage.orders} rate="$0.10" />
            <UsageRow label="Invoices Generated" value={usage.invoices} rate="$0.05" />
            <UsageRow label="Storage Used" value={`${usage.storageGB.toFixed(2)} GB`} rate="$1.00/GB" />
            <UsageRow label="API Calls" value={usage.apiCalls} rate="$0.02" />
            <UsageRow label="AI Analysis Jobs" value={usage.aiJobs} rate="$5.00" />
            
            <Separator />
            
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Estimated Total</span>
              <span>${usage.estimatedCost.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Schema Changes**:
```sql
-- Usage tracking table
CREATE TABLE usage_records (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id VARCHAR NOT NULL REFERENCES companies(id),
  metric VARCHAR(50) NOT NULL, -- 'order', 'invoice', 'storage', 'api_call', 'ai_job'
  quantity DECIMAL(10, 4) NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  metadata JSONB,
  reported_to_stripe BOOLEAN DEFAULT false,
  reported_at TIMESTAMP,
  CONSTRAINT fk_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE INDEX idx_usage_company_date ON usage_records(company_id, timestamp);
CREATE INDEX idx_usage_metric ON usage_records(metric);
CREATE INDEX idx_usage_unreported ON usage_records(company_id, reported_to_stripe) WHERE NOT reported_to_stripe;

-- Add Stripe fields to companies
ALTER TABLE companies
  ADD COLUMN stripe_subscription_id VARCHAR(255),
  ADD COLUMN billing_period_start DATE,
  ADD COLUMN billing_period_end DATE;
```

---

### 4.2 Developer-First Public API

**Concept**: Enterprise clients can integrate ILS into their existing systems.

#### Implementation

**A. API Architecture**
```
/api/v1/
  /auth/
    POST /token - Get API key
  /products/
    GET /products - List products
    POST /products - Create product
    PATCH /products/:id - Update product
  /orders/
    GET /orders - List orders
    POST /orders - Create order
    GET /orders/:id - Get order details
    PATCH /orders/:id/status - Update status
  /patients/
    GET /patients - List patients
    POST /patients - Create patient
    GET /patients/:id - Get patient
  /prescriptions/
    GET /prescriptions/validate - Validate prescription
  /webhooks/
    POST /webhooks/register - Register webhook
    GET /webhooks - List webhooks
    DELETE /webhooks/:id - Unregister webhook
```

**B. API Authentication**
```typescript
// server/middleware/apiAuth.ts

export const apiAuth = async (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }
  
  // Validate API key
  const key = await storage.getApiKey(apiKey);
  if (!key || !key.active) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  
  // Check rate limit
  const allowed = await rateLimiter.check(key.id, key.rateLimit);
  if (!allowed) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }
  
  // Track API call usage
  await storage.recordUsage({
    companyId: key.companyId,
    metric: 'api_call',
    quantity: 1,
    timestamp: new Date(),
    metadata: { endpoint: req.path, apiKeyId: key.id },
  });
  
  req.apiKey = key;
  req.user = { companyId: key.companyId, id: key.userId };
  next();
};

// Apply to all /api/v1 routes
router.use('/api/v1', apiAuth);
```

**C. Custom Webhooks**
```typescript
// server/services/CustomWebhookService.ts

export class CustomWebhookService {
  /**
   * Register a webhook for a company
   */
  async register(
    companyId: string,
    eventType: string,
    targetUrl: string,
    secret: string
  ): Promise<string> {
    const webhook = await storage.createWebhook({
      id: crypto.randomUUID(),
      companyId,
      eventType, // e.g., 'order.shipped', 'product.low_stock'
      targetUrl,
      secret,
      active: true,
    });
    
    return webhook.id;
  }
  
  /**
   * Trigger webhooks for an event
   */
  async trigger(eventType: string, companyId: string, data: any): Promise<void> {
    const webhooks = await storage.getWebhooks({ companyId, eventType, active: true });
    
    for (const webhook of webhooks) {
      try {
        // Sign payload
        const payload = JSON.stringify(data);
        const signature = crypto
          .createHmac('sha256', webhook.secret)
          .update(payload)
          .digest('hex');
        
        // Send POST request
        const response = await fetch(webhook.targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-ILS-Signature': signature,
            'X-ILS-Event': eventType,
          },
          body: payload,
        });
        
        if (!response.ok) {
          console.error(`Webhook delivery failed: ${webhook.id}`, {
            status: response.status,
            url: webhook.targetUrl,
          });
        }
      } catch (error) {
        console.error(`Webhook error: ${webhook.id}`, error);
      }
    }
  }
}

export const customWebhookService = new CustomWebhookService();

// Hook into event bus
eventBus.on('order.shipped', async (data) => {
  await customWebhookService.trigger('order.shipped', data.companyId, data);
});
```

**D. Developer Sandbox**
```typescript
// Create sandbox environment with test data

router.post('/api/v1/sandbox/setup', async (req, res) => {
  const { companyId } = req.user;
  
  // Create sandbox API key
  const sandboxKey = await storage.createApiKey({
    companyId,
    name: 'Sandbox Key',
    environment: 'sandbox',
    rateLimit: 1000, // Higher limit for testing
  });
  
  // Seed test data
  await seedTestData(companyId);
  
  res.json({
    apiKey: sandboxKey.key,
    environment: 'sandbox',
    docs: 'https://docs.integratedlens.com/api',
  });
});
```

**Schema Changes**:
```sql
-- API keys table
CREATE TABLE api_keys (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id VARCHAR NOT NULL REFERENCES companies(id),
  user_id VARCHAR NOT NULL REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(255) NOT NULL UNIQUE, -- bcrypt hash
  key_prefix VARCHAR(20) NOT NULL, -- First chars for identification (e.g., 'sk_live_')
  environment VARCHAR(20) NOT NULL, -- 'production' or 'sandbox'
  active BOOLEAN DEFAULT true,
  rate_limit INTEGER DEFAULT 100, -- requests per minute
  created_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP,
  expires_at TIMESTAMP
);

-- Custom webhooks table
CREATE TABLE custom_webhooks (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id VARCHAR NOT NULL REFERENCES companies(id),
  event_type VARCHAR(100) NOT NULL,
  target_url TEXT NOT NULL,
  secret VARCHAR(255) NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  last_triggered_at TIMESTAMP,
  failure_count INTEGER DEFAULT 0
);

CREATE INDEX idx_webhooks_company_event ON custom_webhooks(company_id, event_type);
```

---

## 📊 Success Metrics

### Phase 1: Omnichannel POS
- **Inventory Sync Accuracy**: > 99.9% (target: zero stock conflicts)
- **Prescription Gating Conversion**: 15-25% of online browsers book exams
- **Unified Patient Profiles**: 100% of Shopify customers auto-synced

### Phase 2: Dynamic Clinical Workflow
- **Dispensing Consistency**: 80%+ of dispensers follow AI recommendations
- **Upsell Revenue**: 20-30% increase in coating/upgrade sales
- **Clinical Alerts**: < 1% false positive rate on anomaly detection

### Phase 3: Intelligent Order System
- **OMA Validation Accuracy**: 99%+ prescription match rate
- **Manufacturing Error Reduction**: 70-80% fewer remakes
- **Engineer Efficiency**: Engineers review only 15-20% of orders (vs. 100% manual)

### Phase 4: Enterprise Billing
- **Revenue Growth**: 2-3x increase from metered billing vs. flat rate
- **API Adoption**: 10-15% of enterprise clients integrate via API
- **Developer Satisfaction**: NPS > 50

---

## 🚀 Implementation Timeline

### Month 1-2: Foundation
- ✅ Extend event bus with new event types
- ✅ Enhance ShopifyService for bidirectional sync
- ✅ Implement usage tracking middleware
- ✅ Build ClinicalWorkflowService

### Month 3-4: Core Features
- ✅ Prescription gating for Shopify checkout
- ✅ Clinical anomaly detection AI
- ✅ OMA validation and triage system
- ✅ Metered billing integration with Stripe

### Month 5-6: Enterprise Platform
- ✅ Public API v1 with authentication
- ✅ Custom webhook registry
- ✅ Developer sandbox and documentation
- ✅ Usage dashboard UI

### Month 7+: Optimization & Scale
- ✅ Performance tuning (sub-100ms API response times)
- ✅ Enterprise onboarding playbook
- ✅ Advanced AI models (deep learning for anomaly detection)
- ✅ Multi-region deployment

---

## 🔐 Security Considerations

1. **API Security**:
   - HMAC-SHA256 webhook signatures
   - Rate limiting per API key
   - API key rotation policies

2. **Data Privacy**:
   - HIPAA compliance for patient data
   - Encrypted at rest (AES-256) and in transit (TLS 1.3)
   - Audit logs for all PHI access

3. **Shopify Integration**:
   - OAuth 2.0 for secure token exchange
   - Webhook signature verification
   - Scoped access (read/write only necessary resources)

---

## 📈 Business Model Impact

### Current Model (Flat Rate)
- **Free ECP**: $0/month → Limited features
- **Full Plan**: $199/month → All features

**Problem**: A 3-person practice pays the same as a 50-location lab chain.

### New Model (Metered)
- **Startup Practice** (10 orders/month): $199 + $1 = **$200/month**
- **Mid-Size Practice** (100 orders/month): $199 + $10 + $5 (storage) = **$214/month**
- **Enterprise Lab** (5,000 orders/month): $199 + $500 + $200 (storage) + $50 (API) = **$949/month**

**Result**: 
- **Revenue scales with customer success**
- **Fair pricing** (small practices pay less)
- **Higher enterprise revenue** (4-5x increase)

---

## 🎓 Competitive Advantages

1. **Omnichannel POS**: Only platform that truly unifies online + in-store inventory
2. **Prescription Gating**: Defeats online-only retailers by driving patients back to ECPs
3. **Clinical AI**: Proactive anomaly detection (no competitor offers this)
4. **Intelligent Order Routing**: Saves labs thousands in QC costs
5. **Developer Platform**: First optical software with a true public API

---

## 📝 Next Steps

1. **Review & Approve** this plan with stakeholders
2. **Prioritize** phases based on customer demand
3. **Allocate resources** (1-2 engineers per phase)
4. **Start with Phase 1** (Omnichannel POS) - highest ROI
5. **Beta test** with 2-3 pilot customers per phase
6. **Iterate** based on feedback

---

**Document Version**: 1.0  
**Last Updated**: November 5, 2025  
**Author**: GitHub Copilot + ILS Engineering Team
