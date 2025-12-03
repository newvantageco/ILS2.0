# NHS Claims Service - Production Implementation Plan

**Status**: Analysis Complete - Ready for Implementation
**Priority**: CRITICAL - Blocks 40% UK Market Revenue
**Estimated Time**: 2-3 days

---

## 📊 Current Status Analysis

### ✅ What's Already Implemented (90% Complete!)

The NhsClaimsService is surprisingly comprehensive:

1. **Core Claim Management**
   - ✅ Claim creation with GOC validation
   - ✅ Unique claim number generation (NHS-{COMPANY}-{DATE}-{SEQ})
   - ✅ Status tracking (draft → submitted → accepted → paid)
   - ✅ Soft delete with healthcare compliance

2. **PCSE API Integration**
   - ✅ Full PCSE API submission (`submitToPCSE`)
   - ✅ Proper authentication with Bearer token
   - ✅ Error handling and logging
   - ✅ XML fallback generation if API fails
   - ✅ Reference number tracking

3. **Validation**
   - ✅ NHS number validation (Modulus 11 checksum)
   - ✅ GOC registration expiry checks
   - ✅ GOS claim type validation
   - ✅ 6-month submission window enforcement
   - ✅ Exemption evidence requirements

4. **Business Logic**
   - ✅ GOS claim amounts (£23.19 - £59.05)
   - ✅ Batch submission support
   - ✅ Payment reconciliation
   - ✅ Claims summary statistics
   - ✅ Processing time analytics

5. **Query Operations**
   - ✅ Get claim by ID
   - ✅ Get company claims with filtering
   - ✅ Get patient claims
   - ✅ Claims summary with statistics

---

## 🔧 Missing Components (10% - Critical for Production)

### 1. Patient Data Integration (HIGH PRIORITY)
**File**: `server/services/NhsClaimsService.ts:233-236`
**Issue**: Patient data returns empty strings
**Impact**: Claims cannot be submitted without patient details

```typescript
// Current (line 233-236):
patientFirstName: '', // Would be joined from patients table
patientLastName: '',
patientDateOfBirth: '',
patientAddress: {},
```

**Solution**: Join with patients table in `buildPCSEClaimData`

### 2. Organization Data Integration (HIGH PRIORITY)
**File**: `server/services/NhsClaimsService.ts:251-252`
**Issue**: Missing ODS code and organization name
**Impact**: PCSE requires organization identification

```typescript
// Current (line 251-252):
organisationOdsCode: '', // Would come from company settings
organisationName: '',
```

**Solution**: Fetch from company settings/profile

### 3. Prescription Data Integration (HIGH PRIORITY)
**File**: `server/services/NhsClaimsService.ts:239-247`
**Issue**: Missing prescription values and visual acuity
**Impact**: GOS claims require examination findings

```typescript
// Current:
visualAcuity: '',
odSphere: null,
odCylinder: null,
// ... etc
```

**Solution**: Join with prescriptions/examinations table

### 4. PCSE Status Webhook (MEDIUM PRIORITY)
**Issue**: No automated status updates from PCSE
**Impact**: Manual polling required, delayed status updates

**Solution**: Create webhook endpoint for PCSE callbacks

### 5. Retry Logic & Queue (MEDIUM PRIORITY)
**Issue**: Failed submissions not automatically retried
**Impact**: Manual intervention needed for transient failures

**Solution**: Implement retry queue with exponential backoff

### 6. Notification System (MEDIUM PRIORITY)
**Issue**: No notifications for claim status changes
**Impact**: Users unaware of rejections/payments

**Solution**: Integrate with existing EmailService

### 7. Rate Limiting (LOW PRIORITY)
**Issue**: No PCSE API rate limit handling
**Impact**: Potential API throttling

**Solution**: Add rate limiting middleware

---

## 🎯 Implementation Plan

### Phase 1: Critical Data Integration (Day 1 - 6 hours)

#### Task 1.1: Patient Data Integration
- Join patients table in `buildPCSEClaimData`
- Fetch: firstName, lastName, dateOfBirth, address
- Handle missing patient data gracefully
- **Lines to modify**: 219-254
- **Estimated time**: 2 hours

#### Task 1.2: Organization Data Integration
- Add companySettings lookup for ODS code
- Fetch organization name from companies table
- Environment variable fallback for testing
- **Lines to modify**: 219-254
- **Estimated time**: 1 hour

#### Task 1.3: Prescription Data Integration
- Join examinations/prescriptions table
- Fetch visual acuity and prescription values
- Handle cases where no prescription exists
- **Lines to modify**: 219-254
- **Estimated time**: 2 hours

#### Task 1.4: Testing & Validation
- Test with real patient data
- Validate XML output format
- Test PCSE API payload structure
- **Estimated time**: 1 hour

---

### Phase 2: Webhook Integration (Day 2 - 4 hours)

#### Task 2.1: PCSE Webhook Endpoint
- Create `/api/webhooks/pcse/claims` endpoint
- Validate PCSE webhook signature
- Handle status updates: accepted, rejected, paid, queried
- **New file**: `server/routes/webhooks/pcse.ts`
- **Estimated time**: 2 hours

#### Task 2.2: Status Update Handler
- Update claim status from webhook data
- Parse PCSE response data
- Handle rejection reasons
- Log all webhook events
- **Estimated time**: 1 hour

#### Task 2.3: Webhook Security
- HMAC signature validation
- IP whitelist for PCSE servers
- Rate limiting on webhook endpoint
- **Estimated time**: 1 hour

---

### Phase 3: Retry Logic & Notifications (Day 2-3 - 6 hours)

#### Task 3.1: Retry Queue Implementation
- Add `nhsClaimsRetryQueue` table to schema
- Implement exponential backoff (1h, 4h, 24h)
- Background job to process retry queue
- **New file**: `server/services/NhsClaimsRetryService.ts`
- **Estimated time**: 3 hours

#### Task 3.2: Email Notifications
- Claim submitted notification
- Claim accepted notification
- Claim rejected notification (with reason)
- Payment received notification
- Integrate with existing EmailService
- **Lines to modify**: Multiple locations
- **Estimated time**: 2 hours

#### Task 3.3: Admin Dashboard Integration
- Add NHS claims stats to AdminDashboard
- Claims by status chart
- Recent claim activity
- Payment reconciliation summary
- **New component**: `NhsClaimsWidget.tsx`
- **Estimated time**: 1 hour

---

### Phase 4: API Rate Limiting & Polish (Day 3 - 2 hours)

#### Task 4.1: Rate Limiting
- Implement PCSE API rate limiter
- Queue submissions if rate limit hit
- Respect PCSE rate limits (documented in their API)
- **Estimated time**: 1 hour

#### Task 4.2: Documentation
- API endpoint documentation
- GOS claim flow diagram
- Testing guide for sandbox/production
- Environment variable setup guide
- **Estimated time**: 1 hour

---

## 📋 Database Schema Additions Needed

### 1. Add Missing Fields to nhsClaims

```sql
ALTER TABLE nhs_claims ADD COLUMN IF NOT EXISTS domiciliary_justification TEXT;
ALTER TABLE nhs_claims ADD COLUMN IF NOT EXISTS visual_acuity VARCHAR(50);
ALTER TABLE nhs_claims ADD COLUMN IF NOT EXISTS od_sphere DECIMAL(4,2);
ALTER TABLE nhs_claims ADD COLUMN IF NOT EXISTS od_cylinder DECIMAL(4,2);
ALTER TABLE nhs_claims ADD COLUMN IF NOT EXISTS od_axis INTEGER;
ALTER TABLE nhs_claims ADD COLUMN IF NOT EXISTS od_add DECIMAL(4,2);
ALTER TABLE nhs_claims ADD COLUMN IF NOT EXISTS os_sphere DECIMAL(4,2);
ALTER TABLE nhs_claims ADD COLUMN IF NOT EXISTS os_cylinder DECIMAL(4,2);
ALTER TABLE nhs_claims ADD COLUMN IF NOT EXISTS os_axis INTEGER;
ALTER TABLE nhs_claims ADD COLUMN IF NOT EXISTS os_add DECIMAL(4,2);
ALTER TABLE nhs_claims ADD COLUMN IF NOT EXISTS nhs_voucher_code VARCHAR(20);
```

### 2. Create Retry Queue Table

```sql
CREATE TABLE IF NOT EXISTS nhs_claims_retry_queue (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id VARCHAR NOT NULL REFERENCES nhs_claims(id),
  company_id VARCHAR NOT NULL,
  retry_count INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMP,
  next_retry_at TIMESTAMP NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_retry_queue_next_retry ON nhs_claims_retry_queue(next_retry_at);
CREATE INDEX idx_retry_queue_claim ON nhs_claims_retry_queue(claim_id);
```

### 3. Add Company ODS Code

```sql
ALTER TABLE companies ADD COLUMN IF NOT EXISTS nhs_ods_code VARCHAR(20);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS nhs_organization_name VARCHAR(255);
```

---

## 🔐 Environment Variables Required

```bash
# PCSE API Configuration
PCSE_API_URL=https://api.pcse.nhs.uk/v1  # Production
PCSE_API_URL_SANDBOX=https://sandbox.pcse.nhs.uk/v1  # Testing
PCSE_API_KEY=your_pcse_api_key_here
PCSE_WEBHOOK_SECRET=your_webhook_secret_here

# NHS Configuration
NHS_CLAIMS_ENABLED=true
NHS_CLAIMS_AUTO_RETRY=true
NHS_CLAIMS_MAX_RETRIES=3
```

---

## 🧪 Testing Strategy

### 1. Unit Tests
- NHS number validation (valid/invalid cases)
- Claim validation rules
- PCSE payload building
- XML generation

### 2. Integration Tests
- Patient data fetching
- Organization data fetching
- Prescription data fetching
- Full claim submission flow

### 3. Sandbox Testing
- Submit test claims to PCSE sandbox
- Verify XML format accepted
- Test webhook callbacks
- Test retry logic

### 4. Production Smoke Tests
- Submit 1 real GOS1 claim
- Monitor PCSE response
- Verify webhook updates
- Confirm payment reconciliation

---

## 📊 Success Metrics

### Technical Metrics
- ✅ 100% of claims submitted successfully (no validation errors)
- ✅ <2 second claim submission latency
- ✅ 95%+ automatic retry success rate
- ✅ Zero data loss (all claims tracked in DB)

### Business Metrics
- ✅ Enable NHS claims for UK practices
- ✅ 40% revenue opportunity unlocked
- ✅ Average 14-day payment cycle (PCSE standard)
- ✅ <1% claim rejection rate

---

## 🚨 Risks & Mitigations

### Risk 1: PCSE API Changes
**Mitigation**: Implement version checking, maintain XML fallback

### Risk 2: Invalid Patient Data
**Mitigation**: Strict validation before submission, clear error messages

### Risk 3: Rate Limiting
**Mitigation**: Queue system, exponential backoff, respect API limits

### Risk 4: Data Privacy (GDPR)
**Mitigation**: Soft deletes, audit logging, data retention policies

---

## 📅 Implementation Timeline

**Day 1**:
- Morning: Patient, Organization, Prescription data integration
- Afternoon: Testing & validation

**Day 2**:
- Morning: PCSE webhook endpoint & security
- Afternoon: Retry queue & email notifications

**Day 3**:
- Morning: Rate limiting & admin dashboard
- Afternoon: Documentation & production deployment

**Total**: 18 hours development time across 3 days

---

## ✅ Definition of Done

- [ ] All patient/org/prescription data fetched correctly
- [ ] PCSE API submissions working in sandbox
- [ ] Webhook endpoint processing status updates
- [ ] Retry queue handling failed submissions
- [ ] Email notifications sent for all status changes
- [ ] Rate limiting prevents API throttling
- [ ] Unit tests >80% coverage
- [ ] Integration tests passing
- [ ] Documentation complete
- [ ] Production smoke test successful
- [ ] NHS claims enabled for UK practices

---

**Next Step**: Begin Phase 1 - Critical Data Integration
