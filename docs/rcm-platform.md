# Revenue Cycle Management & Billing Automation Platform

## Overview

The Revenue Cycle Management (RCM) & Billing Automation Platform provides comprehensive financial management capabilities for healthcare organizations. This platform automates the entire revenue cycle from charge capture through payment processing and collections, ensuring efficient billing operations and optimal revenue capture.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Claims Management](#claims-management)
3. [Payment Processing](#payment-processing)
4. [Billing Automation](#billing-automation)
5. [API Reference](#api-reference)
6. [Integration Guide](#integration-guide)
7. [Best Practices](#best-practices)

## Architecture Overview

The RCM platform consists of three core services:

### 1. Claims Management Service
Manages the complete lifecycle of insurance claims from creation through adjudication and appeals.

**Key Features:**
- Electronic claim submission (EDI 837)
- ERA (Electronic Remittance Advice) processing
- Claim validation and scrubbing
- Denial management and appeals
- Batch claim submission
- Multi-payer support with configurable timely filing limits

### 2. Payment Processing Service
Handles all payment operations including insurance payments, patient payments, refunds, and payment plans.

**Key Features:**
- Multi-channel payment processing (credit card, ACH, check, cash)
- Payment plan management with installments
- Automated payment processing with gateway integration
- Refund management with approval workflows
- Patient statement generation with aging buckets
- Payment allocation across multiple claims

### 3. Billing Automation Service
Automates charge capture, billing rules, collections, and write-offs.

**Key Features:**
- Automated charge capture with configurable rules
- Fee schedule management
- Collections case management with aging buckets
- Collections activity tracking
- Write-off management with approval workflows
- Payer contract management
- Comprehensive aging reports

## Claims Management

### Claim Lifecycle

```
Draft → Ready to Submit → Submitted → Pending → Accepted/Rejected →
Partially Paid/Paid/Denied → Appealed (if denied) → Final Resolution
```

### Claim Statuses

- **draft**: Initial state, claim being prepared
- **ready_to_submit**: Validated and ready for submission
- **submitted**: Sent to payer
- **pending**: Under review by payer
- **accepted**: Payer accepted claim
- **rejected**: Claim rejected due to errors
- **partially_paid**: Partial payment received
- **paid**: Full payment received
- **denied**: Claim denied
- **appealed**: Appeal filed
- **voided**: Claim cancelled

### Creating a Claim

```typescript
const claim = ClaimsManagementService.createClaim({
  type: 'professional',
  patientId: 'patient-123',
  renderingProviderId: 'provider-456',
  billingProviderId: 'provider-456',
  primaryPayerId: 'payer-789',
  serviceDate: new Date('2024-01-15'),
  lineItems: [
    {
      procedureCode: '92004',
      description: 'Comprehensive eye exam, new patient',
      chargeAmount: 15000, // $150.00 in cents
      units: 1,
      diagnosisCodes: ['H52.13'],
      placeOfService: '11',
      revenueCode: '0510'
    }
  ],
  createdBy: 'user-123'
});
```

### Submitting Claims

**Single Claim Submission:**
```typescript
const validationResult = ClaimsManagementService.validateClaim(claimId);
if (validationResult.isValid) {
  const submittedClaim = ClaimsManagementService.submitClaim(
    claimId,
    'user-123'
  );
  console.log(`Claim submitted with ICN: ${submittedClaim.clearinghouseControlNumber}`);
}
```

**Batch Submission:**
```typescript
const result = ClaimsManagementService.submitClaimBatch(
  ['claim-1', 'claim-2', 'claim-3'],
  'user-123'
);
console.log(`Submitted: ${result.succeeded.length}, Failed: ${result.failed.length}`);
```

### Processing ERA (Electronic Remittance Advice)

```typescript
const result = ClaimsManagementService.processERA({
  payerId: 'payer-123',
  paymentNumber: 'PAY-456',
  paymentDate: new Date(),
  totalPaymentAmount: 45000, // $450.00
  claims: [
    {
      claimId: 'claim-1',
      claimNumber: 'CLM-1001',
      chargedAmount: 15000,
      allowedAmount: 12000,
      paidAmount: 12000,
      adjustments: [],
      denialCode: null,
      status: 'paid'
    }
  ]
});
```

### Filing Appeals

```typescript
const appeal = ClaimsManagementService.fileAppeal(
  claimId,
  'Additional documentation attached showing medical necessity',
  ['document-1.pdf', 'document-2.pdf'],
  'user-123'
);
```

### Default Payers

The system includes pre-configured payers:

| Payer | Type | Timely Filing Limit |
|-------|------|---------------------|
| Medicare | Medicare | 365 days |
| Medicaid | Medicaid | 180 days |
| Blue Cross Blue Shield | Commercial | 90 days |
| United Healthcare | Commercial | 90 days |
| Aetna | Commercial | 120 days |

### Denial Reason Codes

Common denial codes include:

- **CO-16**: Claim lacks information needed for adjudication
- **CO-18**: Exact duplicate claim/service
- **CO-22**: Reimbursement reduced because procedure was incomplete/not covered
- **CO-27**: Expenses incurred after coverage terminated
- **CO-29**: Time limit for filing has expired
- **CO-50**: Non-covered services
- **CO-96**: Non-covered charges
- **CO-97**: Benefit maximum reached
- **CO-109**: Claim not covered by this payer
- **CO-197**: Precertification/authorization absent

### Claims Statistics

```typescript
const statistics = ClaimsManagementService.getStatistics(
  new Date('2024-01-01'),
  new Date('2024-12-31'),
  'payer-123', // optional
  'provider-456' // optional
);

console.log(`Total submitted: $${statistics.totalChargedAmount / 100}`);
console.log(`Total paid: $${statistics.totalPaidAmount / 100}`);
console.log(`Collection rate: ${statistics.collectionRate}%`);
console.log(`Denial rate: ${statistics.denialRate}%`);
```

## Payment Processing

### Payment Types

- **insurance**: Payment from insurance payer
- **patient**: Patient responsibility payment
- **patient_copay**: Patient copayment
- **patient_deductible**: Patient deductible payment
- **patient_coinsurance**: Patient coinsurance payment

### Payment Methods

- **check**: Paper check
- **cash**: Cash payment
- **credit_card**: Credit card
- **debit_card**: Debit card
- **ach**: ACH/Electronic bank transfer
- **wire_transfer**: Wire transfer
- **electronic**: Generic electronic payment

### Recording Payments

```typescript
const payment = PaymentProcessingService.recordPayment({
  type: 'patient',
  method: 'credit_card',
  amount: 5000, // $50.00 in cents
  patientId: 'patient-123',
  claimIds: ['claim-1'],
  allocations: [
    {
      claimId: 'claim-1',
      amount: 5000
    }
  ],
  paymentDate: new Date(),
  recordedBy: 'user-123'
});
```

### Processing Payments

Automated payment processing with gateway integration:

```typescript
const result = await PaymentProcessingService.processPayment(
  paymentId,
  'user-123'
);

if (result.success) {
  console.log('Payment processed successfully');
} else {
  console.error(`Payment failed: ${result.error}`);
}
```

### Payment Plans

Create installment payment plans for patients:

```typescript
const plan = PaymentProcessingService.createPaymentPlan(
  'patient-123',
  100000, // $1,000.00 total
  20000, // $200.00 down payment
  8, // 8 monthly payments
  'monthly',
  'user-123'
);

// Record installment payments
const installment = PaymentProcessingService.recordInstallmentPayment(
  plan.id,
  plan.installments[0].id,
  paymentId,
  'user-123'
);

// Check for overdue installments
const overdue = PaymentProcessingService.checkOverdueInstallments(plan.id);
```

### Refund Processing

Request and process refunds with approval workflow:

```typescript
// Request refund
const refund = PaymentProcessingService.requestRefund(
  paymentId,
  5000, // $50.00
  'Duplicate payment',
  'user-123'
);

// Approve refund
const approvedRefund = PaymentProcessingService.approveRefund(
  refund.id,
  'manager-456'
);

// Process refund
const result = await PaymentProcessingService.processRefund(
  refund.id,
  'user-123'
);
```

### Patient Statements

Generate patient statements with aging buckets:

```typescript
const statement = PaymentProcessingService.generateStatement(
  'patient-123',
  50000, // Previous balance
  25000, // New charges
  15000, // Payments
  [
    {
      date: new Date('2024-01-15'),
      description: 'Office visit',
      charges: 15000,
      payments: 0,
      balance: 15000
    }
  ],
  'user-123'
);

// Statement includes aging buckets
console.log(`Current: $${statement.current / 100}`);
console.log(`30 days: $${statement.days30 / 100}`);
console.log(`60 days: $${statement.days60 / 100}`);
console.log(`90 days: $${statement.days90 / 100}`);
console.log(`120+ days: $${statement.days120Plus / 100}`);
```

## Billing Automation

### Auto-Capture Charges

Automatically capture charges based on encounter procedures:

```typescript
const charges = BillingAutomationService.autoCaptureCharges(
  'encounter-123',
  'patient-456',
  'provider-789',
  new Date('2024-01-15'),
  [
    {
      procedureCode: '92004',
      units: 1,
      diagnosisCodes: ['H52.13']
    },
    {
      procedureCode: '92134',
      units: 1,
      diagnosisCodes: ['H35.31']
    }
  ],
  'user-123'
);

console.log(`Captured ${charges.length} charges totaling $${
  charges.reduce((sum, c) => sum + c.amount, 0) / 100
}`);
```

### Default Fee Schedule

The system includes a default fee schedule with common ophthalmic procedures:

| CPT Code | Description | Amount |
|----------|-------------|--------|
| 92004 | Comprehensive eye exam, new patient | $150.00 |
| 92014 | Comprehensive eye exam, established patient | $100.00 |
| 92134 | OCT imaging | $75.00 |
| 92250 | Fundus photography | $50.00 |
| 66984 | Cataract surgery with IOL | $2,500.00 |
| 67228 | Intravitreal injection | $1,800.00 |
| 92015 | Refraction | $40.00 |

### Charge Capture Rules

Create automated rules for charge capture:

```typescript
const rule = BillingAutomationService.createChargeCaptureRule({
  name: 'Auto-bill routine exams',
  active: true,
  triggerEvent: 'appointment_completed',
  conditions: [
    {
      field: 'appointment.type',
      operator: 'equals',
      value: 'routine_exam'
    }
  ],
  actions: [
    {
      type: 'create_charge',
      parameters: {
        procedureCode: '92014',
        autoSubmit: true
      }
    }
  ],
  createdBy: 'user-123'
});
```

### Collections Management

Create and manage collections cases:

```typescript
// Create collections case
const collectionsCase = BillingAutomationService.createCollectionsCase({
  patientId: 'patient-123',
  originalBalance: 50000, // $500.00
  currentBalance: 50000,
  daysPastDue: 65,
  invoiceNumbers: ['INV-1001', 'INV-1002'],
  assignedTo: 'collector-456',
  createdBy: 'user-123'
});

// Add collections activity
const activity = BillingAutomationService.addCollectionsActivity(
  collectionsCase.id,
  {
    activityType: 'call',
    contactResult: 'answered',
    notes: 'Patient agreed to payment plan',
    promiseAmount: 10000,
    promiseDate: new Date('2024-02-01'),
    performedBy: 'collector-456'
  }
);
```

### Aging Buckets

Collections cases are automatically categorized by aging:

- **0-30 days**: New cases
- **31-60 days**: Follow-up required
- **61-90 days**: Active collections
- **91-120 days**: Escalated collections
- **120+ days**: Consider for write-off or legal action

### Write-Off Management

Request and approve write-offs:

```typescript
// Create write-off request
const writeOff = BillingAutomationService.createWriteOff({
  patientId: 'patient-123',
  type: 'bad_debt',
  amount: 25000, // $250.00
  reason: 'Patient unable to pay after 6 months of collections efforts',
  chargeIds: ['charge-1'],
  requestedBy: 'user-123'
});

// Approve write-off
const approved = BillingAutomationService.approveWriteOff(
  writeOff.id,
  'manager-456'
);

// Reject write-off
const rejected = BillingAutomationService.rejectWriteOff(
  writeOff.id,
  'manager-456',
  'Additional collections efforts required'
);
```

### Write-Off Types

- **bad_debt**: Uncollectible debt
- **courtesy**: Courtesy adjustment
- **contract_adjustment**: Contractual adjustment per payer contract
- **small_balance**: Small balance write-off (< threshold)

### Fee Schedules

Create custom fee schedules for different payers:

```typescript
const feeSchedule = BillingAutomationService.createFeeSchedule({
  name: 'Medicare Fee Schedule 2024',
  payerId: 'medicare-1',
  effectiveDate: new Date('2024-01-01'),
  expirationDate: new Date('2024-12-31'),
  items: [
    {
      procedureCode: '92004',
      description: 'Comprehensive eye exam, new patient',
      amount: 12000 // $120.00
    }
  ],
  createdBy: 'user-123'
});
```

### Payer Contracts

Manage payer contracts with reimbursement rates:

```typescript
const contract = BillingAutomationService.createPayerContract({
  payerId: 'payer-123',
  name: 'BCBS Network Contract 2024',
  contractNumber: 'BCBS-2024-001',
  effectiveDate: new Date('2024-01-01'),
  terminationDate: new Date('2024-12-31'),
  reimbursementRate: 80, // 80% of charges
  terms: 'Net 30 days payment terms',
  createdBy: 'user-123'
});
```

### Aging Reports

Generate comprehensive aging reports:

```typescript
const report = BillingAutomationService.generateAgingReport(
  new Date(), // as of date
  'patient-123' // optional: specific patient
);

console.log('Aging Summary:');
report.summary.byBucket.forEach(bucket => {
  console.log(`${bucket.bucket}: $${bucket.amount / 100} (${bucket.count} charges)`);
});

console.log(`\nTotal Outstanding: $${report.summary.totalOutstanding / 100}`);
console.log(`Average Days Past Due: ${report.summary.averageDaysPastDue}`);
```

## API Reference

### Claims Management Endpoints

#### Create Claim
```
POST /api/rcm/claims
Body: ClaimData
Response: { success: true, data: Claim }
```

#### Get Claim
```
GET /api/rcm/claims/:id
Response: { success: true, data: Claim }
```

#### Get Claims by Patient
```
GET /api/rcm/claims/patient/:patientId
Response: { success: true, data: Claim[], count: number }
```

#### Get Claims by Provider
```
GET /api/rcm/claims/provider/:providerId
Response: { success: true, data: Claim[], count: number }
```

#### Get Claims by Status
```
GET /api/rcm/claims/status/:status
Response: { success: true, data: Claim[], count: number }
```

#### Validate Claim
```
PUT /api/rcm/claims/:id/validate
Response: { success: true, data: ValidationResult }
```

#### Submit Claim
```
PUT /api/rcm/claims/:id/submit
Body: { submittedBy: string }
Response: { success: true, data: Claim }
```

#### Submit Batch
```
POST /api/rcm/claims/batch
Body: { claimIds: string[], submittedBy: string }
Response: { success: true, data: BatchResult }
```

#### File Appeal
```
POST /api/rcm/claims/:id/appeal
Body: { appealReason: string, supportingDocuments: string[], submittedBy: string }
Response: { success: true, data: Appeal }
```

#### Process ERA
```
POST /api/rcm/era/process
Body: ERAData
Response: { success: true, data: ProcessingResult }
```

#### Get Statistics
```
GET /api/rcm/claims/statistics?startDate=2024-01-01&endDate=2024-12-31
Response: { success: true, data: Statistics }
```

### Payment Processing Endpoints

#### Record Payment
```
POST /api/rcm/payments
Body: PaymentData
Response: { success: true, data: Payment }
```

#### Get Payment
```
GET /api/rcm/payments/:id
Response: { success: true, data: Payment }
```

#### Process Payment
```
PUT /api/rcm/payments/:id/process
Body: { processedBy: string }
Response: { success: true }
```

#### Request Refund
```
POST /api/rcm/payments/:id/refund
Body: { amount: number, reason: string, requestedBy: string }
Response: { success: true, data: Refund }
```

#### Approve Refund
```
PUT /api/rcm/refunds/:id/approve
Body: { approvedBy: string }
Response: { success: true, data: Refund }
```

#### Process Refund
```
PUT /api/rcm/refunds/:id/process
Body: { processedBy: string }
Response: { success: true }
```

#### Create Payment Plan
```
POST /api/rcm/payment-plans
Body: { patientId, totalAmount, downPayment, numberOfPayments, frequency, createdBy }
Response: { success: true, data: PaymentPlan }
```

#### Get Payment Plan
```
GET /api/rcm/payment-plans/:id
Response: { success: true, data: PaymentPlan }
```

#### Record Installment
```
POST /api/rcm/payment-plans/:id/installments
Body: { installmentId: string, paymentId: string, recordedBy: string }
Response: { success: true, data: Installment }
```

#### Generate Statement
```
POST /api/rcm/statements
Body: StatementData
Response: { success: true, data: Statement }
```

### Billing Automation Endpoints

#### Auto-Capture Charges
```
POST /api/rcm/charges/capture
Body: { encounterId, patientId, providerId, serviceDate, procedures, createdBy }
Response: { success: true, data: Charge[], count: number }
```

#### Create Charge
```
POST /api/rcm/charges
Body: ChargeData
Response: { success: true, data: Charge }
```

#### Get Charge
```
GET /api/rcm/charges/:id
Response: { success: true, data: Charge }
```

#### Create Charge Capture Rule
```
POST /api/rcm/charge-capture-rules
Body: ChargeCaptureRuleData
Response: { success: true, data: ChargeCaptureRule }
```

#### Create Collections Case
```
POST /api/rcm/collections/cases
Body: CollectionsCaseData
Response: { success: true, data: CollectionsCase }
```

#### Add Collections Activity
```
POST /api/rcm/collections/cases/:id/activities
Body: ActivityData
Response: { success: true, data: CollectionsActivity }
```

#### Create Write-Off
```
POST /api/rcm/write-offs
Body: WriteOffData
Response: { success: true, data: WriteOff }
```

#### Approve Write-Off
```
PUT /api/rcm/write-offs/:id/approve
Body: { approvedBy: string }
Response: { success: true, data: WriteOff }
```

#### Create Fee Schedule
```
POST /api/rcm/fee-schedules
Body: FeeScheduleData
Response: { success: true, data: FeeSchedule }
```

#### Create Payer Contract
```
POST /api/rcm/payer-contracts
Body: PayerContractData
Response: { success: true, data: PayerContract }
```

#### Generate Aging Report
```
POST /api/rcm/billing/aging-report
Body: { asOfDate?: Date, patientId?: string }
Response: { success: true, data: AgingReport }
```

## Integration Guide

### Integrating with EHR System

```typescript
// 1. Capture charges when appointment is completed
appointmentService.on('completed', async (appointment) => {
  const charges = BillingAutomationService.autoCaptureCharges(
    appointment.encounterId,
    appointment.patientId,
    appointment.providerId,
    appointment.date,
    appointment.procedures,
    'system'
  );

  // 2. Create claim for charges
  const claim = ClaimsManagementService.createClaim({
    type: 'professional',
    patientId: appointment.patientId,
    renderingProviderId: appointment.providerId,
    billingProviderId: appointment.providerId,
    primaryPayerId: appointment.patient.primaryInsurance.payerId,
    serviceDate: appointment.date,
    lineItems: charges.map(charge => ({
      procedureCode: charge.procedureCode,
      description: charge.description,
      chargeAmount: charge.amount,
      units: charge.units,
      diagnosisCodes: charge.diagnosisCodes,
      placeOfService: '11',
      revenueCode: charge.revenueCode
    })),
    createdBy: 'system'
  });

  // 3. Validate and submit
  const validation = ClaimsManagementService.validateClaim(claim.id);
  if (validation.isValid) {
    ClaimsManagementService.submitClaim(claim.id, 'system');
  }
});
```

### Payment Gateway Integration

```typescript
// Configure payment gateway
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Process credit card payment
async function processCreditCardPayment(paymentId: string) {
  const payment = PaymentProcessingService.getPaymentById(paymentId);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: payment.amount,
    currency: 'usd',
    payment_method: payment.paymentMethodToken,
    confirm: true
  });

  if (paymentIntent.status === 'succeeded') {
    await PaymentProcessingService.processPayment(paymentId, 'system');
  }
}
```

### Clearinghouse Integration

```typescript
// Submit claims to clearinghouse
async function submitToClearinghouse(claimIds: string[]) {
  const result = ClaimsManagementService.submitClaimBatch(claimIds, 'system');

  for (const claim of result.succeeded) {
    // Generate EDI 837 file
    const edi837 = generateEDI837(claim);

    // Submit to clearinghouse via SFTP/API
    await clearinghouse.submit(edi837);
  }

  return result;
}

// Process ERA from clearinghouse
async function processERAFile(eraFile: string) {
  const eraData = parseEDI835(eraFile);

  const result = ClaimsManagementService.processERA(eraData);

  // Create payments for paid claims
  for (const claim of result.claims) {
    if (claim.paidAmount > 0) {
      PaymentProcessingService.recordPayment({
        type: 'insurance',
        method: 'electronic',
        amount: claim.paidAmount,
        payerId: eraData.payerId,
        claimIds: [claim.claimId],
        allocations: [{ claimId: claim.claimId, amount: claim.paidAmount }],
        paymentDate: eraData.paymentDate,
        recordedBy: 'system'
      });
    }
  }
}
```

## Best Practices

### Claim Submission

1. **Always validate before submission**: Use `validateClaim()` to catch errors before submission
2. **Batch when possible**: Use batch submission for multiple claims to improve efficiency
3. **Monitor timely filing limits**: Track days since service date and submit before payer deadlines
4. **Clean claim submission**: Ensure all required fields are complete to minimize rejections
5. **Track clearinghouse status**: Monitor ICN and clearinghouse status for submission confirmation

### Payment Processing

1. **Allocate payments accurately**: Always allocate payments to specific claims
2. **Process same-day**: Process payments on the day they are received
3. **Reconcile daily**: Reconcile payment batches daily with bank deposits
4. **Secure payment data**: Never store full credit card numbers, use tokenization
5. **Track unapplied payments**: Monitor and resolve unapplied credit balances

### Collections

1. **Early intervention**: Start collections process at 30 days past due
2. **Document all contacts**: Record every phone call, email, and letter
3. **Offer payment plans**: Provide flexible payment options before escalation
4. **Escalate appropriately**: Move to legal action only after exhausting other options
5. **Comply with regulations**: Follow FDCPA and state collection laws

### Write-Offs

1. **Require approval**: All write-offs should require manager approval
2. **Document reason**: Clearly document the reason for each write-off
3. **Set thresholds**: Define clear policies for small balance write-offs
4. **Track trends**: Monitor write-off patterns to identify process improvements
5. **Consider alternatives**: Explore payment plans before writing off balances

### Financial Reporting

1. **Monitor KPIs**: Track denial rate, collection rate, days in AR
2. **Trend analysis**: Analyze trends over time to identify issues early
3. **Payer performance**: Monitor payer-specific metrics to identify problems
4. **Aging management**: Review aging reports weekly and act on old balances
5. **Revenue cycle metrics**: Track metrics at each stage of the revenue cycle

### Security and Compliance

1. **HIPAA compliance**: Ensure all PHI is properly protected
2. **Access controls**: Implement role-based access to financial data
3. **Audit trails**: Maintain complete audit trails for all financial transactions
4. **Data encryption**: Encrypt sensitive financial data at rest and in transit
5. **Regular audits**: Conduct regular audits of billing and coding accuracy

## Performance Metrics

### Key Performance Indicators

| Metric | Target | Formula |
|--------|--------|---------|
| Clean Claim Rate | >95% | (Claims accepted on first submission / Total claims submitted) × 100 |
| Denial Rate | <5% | (Claims denied / Total claims submitted) × 100 |
| Collection Rate | >95% | (Amount collected / Amount billed) × 100 |
| Days in A/R | <30 days | (Total A/R / Average daily charges) |
| First-Pass Resolution Rate | >90% | (Claims paid on first submission / Total claims submitted) × 100 |
| Appeal Success Rate | >60% | (Appeals approved / Total appeals filed) × 100 |
| Payment Plan Completion | >80% | (Payment plans completed / Total payment plans) × 100 |

### Monitoring Dashboard

```typescript
// Example dashboard metrics query
const startDate = new Date('2024-01-01');
const endDate = new Date('2024-12-31');

const claimStats = ClaimsManagementService.getStatistics(startDate, endDate);
const paymentStats = PaymentProcessingService.getStatistics(startDate, endDate);
const billingStats = BillingAutomationService.getStatistics(startDate, endDate);

const dashboard = {
  claims: {
    totalSubmitted: claimStats.totalClaims,
    totalCharged: claimStats.totalChargedAmount / 100,
    totalPaid: claimStats.totalPaidAmount / 100,
    collectionRate: claimStats.collectionRate,
    denialRate: claimStats.denialRate,
    averageDaysToPayment: claimStats.averageDaysToPayment
  },
  payments: {
    totalReceived: paymentStats.totalPayments / 100,
    averagePaymentAmount: paymentStats.averagePaymentAmount / 100,
    refundRate: paymentStats.refundRate,
    activePaymentPlans: paymentStats.activePaymentPlans
  },
  billing: {
    totalCharges: billingStats.totalCharges / 100,
    totalCollections: billingStats.totalCollections / 100,
    totalWriteOffs: billingStats.totalWriteOffs / 100,
    activeCollectionsCases: billingStats.activeCollectionsCases
  }
};
```

## Troubleshooting

### Common Issues

#### Claim Rejections

**Issue**: Claims rejected for missing information
**Solution**: Implement pre-submission validation and claim scrubbing

**Issue**: Timely filing denials
**Solution**: Monitor days since service date and implement automated alerts

**Issue**: Invalid diagnosis codes
**Solution**: Use current ICD-10 code sets and validate before submission

#### Payment Processing

**Issue**: Payment gateway failures
**Solution**: Implement retry logic with exponential backoff

**Issue**: Unapplied payments
**Solution**: Implement automatic claim matching and manual review workflow

**Issue**: Refund delays
**Solution**: Streamline approval workflow and process refunds daily

#### Collections

**Issue**: High aging balances
**Solution**: Implement early intervention at 30 days, offer payment plans

**Issue**: Low contact rates
**Solution**: Use multiple contact methods (phone, email, text, mail)

**Issue**: Compliance violations
**Solution**: Implement FDCPA-compliant scripts and tracking

## Support and Resources

### Additional Documentation

- [API Reference](/docs/api-reference.md)
- [Security Guide](/docs/security.md)
- [Integration Guide](/docs/integration.md)
- [Compliance Guide](/docs/compliance.md)

### System Requirements

- Node.js 18+
- TypeScript 5+
- Express.js 4+
- PostgreSQL 14+ (for production deployment)

### Related Modules

- Patient Management
- Appointment Scheduling
- Clinical Documentation
- Reporting & Analytics

---

**Version**: 1.0.0
**Last Updated**: January 2025
**Maintained by**: ILS 2.0 Development Team
