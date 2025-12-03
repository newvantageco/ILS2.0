# ILS 2.0 - Immediate Action Plan
**Priority**: Fix critical issues before production deployment
**Timeline**: 2 weeks
**Status**: Ready to begin

---

## CRITICAL ISSUES (P0) - MUST FIX BEFORE PRODUCTION

### Issue 1: Tenant Isolation Security Gaps ⚠️ CRITICAL
**Risk**: Cross-company data leakage
**Timeline**: 3 days
**Assignee**: Backend Team Lead

#### Tasks:
- [ ] Day 1: Audit all 105 route files for `companyId` validation
  - Create checklist of routes
  - Identify routes missing validation
  - Document findings

- [ ] Day 2: Create `requireCompanyContext` middleware
  ```typescript
  // server/middleware/requireCompanyContext.ts
  export const requireCompanyContext = (req: Request, res: Response, next: NextFunction) => {
    const companyId = req.user?.companyId;
    if (!companyId) {
      return res.status(403).json({ error: 'Company context required' });
    }
    req.companyId = companyId;
    next();
  };
  ```

- [ ] Day 3: Apply middleware to all multi-tenant routes
  - Update route files
  - Remove duplicate checks (e.g., `inventory.ts` lines 47-56)
  - Test all routes

- [ ] Day 3: Add integration tests
  ```typescript
  describe('Tenant Isolation', () => {
    it('blocks cross-tenant data access', async () => {
      const companyA_user = await createUser({ companyId: 'A' });
      const companyB_order = await createOrder({ companyId: 'B' });

      const response = await request(app)
        .get(`/api/orders/${companyB_order.id}`)
        .set('Authorization', `Bearer ${companyA_user.token}`);

      expect(response.status).toBe(403);
    });
  });
  ```

**Verification**:
- [ ] All 105 routes have company context validation
- [ ] Integration tests pass
- [ ] Manual penetration test attempt fails

---

### Issue 2: Authentication Standardization ⚠️ CRITICAL
**Risk**: Inconsistent security posture
**Timeline**: 4 days
**Assignee**: Security Team Lead

#### Tasks:
- [ ] Day 1: Create migration guide
  - Document current auth patterns
  - Define new standard pattern
  - Create migration checklist

- [ ] Day 2-3: Migrate all routes to `auth-jwt.ts`
  - Replace `authenticateUser` with `authenticateJWT`
  - Replace `requireRole` with `requirePermission`
  - Update 105 route files

- [ ] Day 3: Remove deprecated middleware
  - Delete `auth-hybrid.ts`
  - Delete `localAuth.ts`
  - Update imports

- [ ] Day 4: Update and run all tests
  - Update test fixtures
  - Run full integration test suite
  - Fix any failures

**Standard Pattern**:
```typescript
// OLD (inconsistent)
router.use(authenticateUser, requireRole(['ecp']));
router.use(authenticateHybrid);

// NEW (standardized)
router.use(authenticateJWT, requirePermission('patients:view'));
```

**Verification**:
- [ ] All routes use `authenticateJWT`
- [ ] All authorization uses `requirePermission`
- [ ] Old middleware files deleted
- [ ] Tests pass

---

### Issue 3: Communication Tracking Tables ⚠️ DATA LOSS
**Risk**: WhatsApp/SMS messages not tracked
**Timeline**: 2 days
**Assignee**: Database Team Lead

#### Tasks:
- [ ] Day 1 Morning: Create migration file
  ```sql
  -- migrations/20251203_0001_add_communication_tracking_tables.sql

  CREATE TABLE communication_logs (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id VARCHAR NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    patient_id VARCHAR REFERENCES patients(id),
    channel VARCHAR NOT NULL CHECK (channel IN ('email', 'sms', 'whatsapp', 'push', 'in_app')),
    message_type VARCHAR NOT NULL,
    subject VARCHAR,
    body TEXT NOT NULL,
    status VARCHAR NOT NULL CHECK (status IN ('queued', 'sending', 'sent', 'delivered', 'failed', 'bounced')),
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    opened_at TIMESTAMP,
    clicked_at TIMESTAMP,
    failed_at TIMESTAMP,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE INDEX idx_comm_logs_company ON communication_logs(company_id);
  CREATE INDEX idx_comm_logs_patient ON communication_logs(patient_id);
  CREATE INDEX idx_comm_logs_channel ON communication_logs(channel);
  CREATE INDEX idx_comm_logs_status ON communication_logs(status);

  CREATE TABLE whatsapp_messages (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    communication_log_id VARCHAR NOT NULL REFERENCES communication_logs(id) ON DELETE CASCADE,
    twilio_message_sid VARCHAR UNIQUE,
    from_number VARCHAR NOT NULL,
    to_number VARCHAR NOT NULL,
    message_body TEXT,
    media_urls TEXT[],
    whatsapp_status VARCHAR,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE INDEX idx_whatsapp_twilio_sid ON whatsapp_messages(twilio_message_sid);

  CREATE TABLE sms_messages (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    communication_log_id VARCHAR NOT NULL REFERENCES communication_logs(id) ON DELETE CASCADE,
    twilio_message_sid VARCHAR UNIQUE,
    from_number VARCHAR NOT NULL,
    to_number VARCHAR NOT NULL,
    message_body TEXT,
    sms_status VARCHAR,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE INDEX idx_sms_twilio_sid ON sms_messages(twilio_message_sid);
  ```

- [ ] Day 1 Afternoon: Update schema.ts
  - Add table definitions
  - Export types
  - Update Drizzle schema

- [ ] Day 2 Morning: Update CommunicationsService
  ```typescript
  async deliverWhatsAppMessage(message: WhatsAppMessage) {
    // Send via Twilio
    const result = await twilioClient.messages.create({...});

    // NEW: Track in database
    await db.insert(communicationLogs).values({
      companyId: message.companyId,
      patientId: message.patientId,
      channel: 'whatsapp',
      messageType: message.type,
      body: message.body,
      status: 'sent',
      sentAt: new Date()
    });

    await db.insert(whatsappMessages).values({
      communicationLogId: log.id,
      twilioMessageSid: result.sid,
      fromNumber: result.from,
      toNumber: result.to,
      messageBody: result.body
    });
  }
  ```

- [ ] Day 2 Afternoon: Test delivery and tracking
  - Send test WhatsApp message
  - Verify database insert
  - Check status updates

**Verification**:
- [ ] Migration runs successfully
- [ ] WhatsApp messages tracked
- [ ] SMS messages tracked
- [ ] Status updates working

---

### Issue 4: GDPR Right to Deletion ⚠️ COMPLIANCE
**Risk**: EU/UK legal non-compliance
**Timeline**: 4 days
**Assignee**: Compliance Team Lead

#### Tasks:
- [ ] Day 1: Create deletion request table
  ```sql
  CREATE TABLE gdpr_deletion_requests (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id VARCHAR NOT NULL REFERENCES patients(id),
    requested_by VARCHAR NOT NULL REFERENCES users(id),
    request_date TIMESTAMP NOT NULL DEFAULT NOW(),
    approval_status VARCHAR NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    approved_by VARCHAR REFERENCES users(id),
    approval_date TIMESTAMP,
    scheduled_execution_date TIMESTAMP,
    executed_date TIMESTAMP,
    execution_notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );
  ```

- [ ] Day 2: Create GDPRDeletionService
  ```typescript
  export class GDPRDeletionService {
    async requestPatientDeletion(patientId: string, requestedBy: string) {
      // Validate patient exists
      // Create deletion request
      // Schedule execution (30 days from now)
      // Notify admin for approval
      // Send confirmation email to patient
    }

    async approveRequest(requestId: string, approvedBy: string) {
      // Validate approver has permission
      // Update approval status
      // Queue deletion job
    }

    async executePatientDeletion(patientId: string) {
      // Archive patient data to encrypted backup
      // Delete from all tables:
      //   - patients, eyeExaminations, prescriptions
      //   - orders, appointments, communications
      // Anonymize financial records (keep for tax compliance)
      // Update deletion request status
      // Log execution
    }
  }
  ```

- [ ] Day 3: Add API routes
  ```typescript
  // POST /api/gdpr/deletion-request
  router.post('/deletion-request',
    authenticateJWT,
    requirePermission('gdpr:request_deletion'),
    async (req, res) => {
      const { patientId } = req.body;
      await GDPRDeletionService.requestPatientDeletion(patientId, req.user.id);
      res.json({ success: true });
    }
  );

  // POST /api/gdpr/approve/:requestId
  router.post('/approve/:requestId',
    authenticateJWT,
    requirePermission('gdpr:approve_deletion'),
    async (req, res) => {
      await GDPRDeletionService.approveRequest(req.params.requestId, req.user.id);
      res.json({ success: true });
    }
  );
  ```

- [ ] Day 4: Add UI components
  - Patient profile: "Request Data Deletion" button
  - Admin dashboard: Deletion requests queue
  - Approval workflow UI

**Verification**:
- [ ] Can request patient deletion
- [ ] Approval workflow works
- [ ] Deletion executes correctly
- [ ] Data backup created
- [ ] Audit trail complete

---

### Issue 5: Consolidate Rate Limiting ⚠️ SECURITY
**Risk**: Conflicting configurations
**Timeline**: 1 day
**Assignee**: Infrastructure Team Lead

#### Tasks:
- [ ] Morning: Compare implementations
  - Review `rateLimiter.ts`
  - Review `rateLimiting.ts`
  - Identify differences
  - Choose canonical version

- [ ] Midday: Merge implementations
  - Consolidate into single `rateLimiter.ts`
  - Preserve best features from both
  - Update configuration

- [ ] Afternoon: Update imports
  - Find all imports of deprecated file
  - Update to use new file
  - Delete deprecated file

- [ ] Evening: Test rate limiting
  - Test API endpoints
  - Verify rate limits work
  - Check bypass prevention

**Verification**:
- [ ] Single rate limiter file
- [ ] All imports updated
- [ ] Tests pass
- [ ] Rate limits enforced

---

## EXECUTION SCHEDULE

### Week 1
| Day | Tasks | Owner |
|-----|-------|-------|
| Monday | Issue 1 Day 1: Tenant isolation audit | Backend Lead |
| Monday | Issue 2 Day 1: Auth migration guide | Security Lead |
| Tuesday | Issue 1 Day 2: Create middleware | Backend Lead |
| Tuesday | Issue 2 Day 2: Start route migration | Security Lead |
| Wednesday | Issue 1 Day 3: Apply middleware + tests | Backend Lead |
| Wednesday | Issue 2 Day 3: Continue route migration | Security Lead |
| Thursday | Issue 3 Day 1: Communication tables | Database Lead |
| Thursday | Issue 2 Day 4: Finish auth migration | Security Lead |
| Friday | Issue 3 Day 2: Update services | Backend Lead |
| Friday | Issue 5: Rate limiting consolidation | Infrastructure Lead |

### Week 2
| Day | Tasks | Owner |
|-----|-------|-------|
| Monday | Issue 4 Day 1: GDPR deletion tables | Compliance Lead |
| Tuesday | Issue 4 Day 2: GDPR service implementation | Compliance Lead |
| Wednesday | Issue 4 Day 3: GDPR API routes | Backend Lead |
| Thursday | Issue 4 Day 4: GDPR UI components | Frontend Lead |
| Friday | Final testing and verification | All Teams |

---

## TESTING CHECKLIST

### Security Testing
- [ ] Tenant isolation tests pass (all 105 routes)
- [ ] Authentication tests pass
- [ ] Permission escalation attempt fails
- [ ] Rate limiting blocks excessive requests
- [ ] SQL injection prevention verified
- [ ] XSS prevention verified

### Integration Testing
- [ ] WhatsApp message delivery and tracking
- [ ] SMS message delivery and tracking
- [ ] GDPR deletion workflow end-to-end
- [ ] Email continues to work
- [ ] Queue processing continues

### Manual Testing
- [ ] Create patient in Company A
- [ ] Login as Company B user
- [ ] Attempt to access Company A patient
- [ ] Verify 403 Forbidden response

---

## ROLLOUT PLAN

### Pre-Deployment
- [ ] All P0 issues fixed and tested
- [ ] Database migration dry run successful
- [ ] Rollback plan documented
- [ ] Team briefed on changes

### Deployment
- [ ] Backup production database
- [ ] Run database migrations
- [ ] Deploy new code
- [ ] Verify health checks
- [ ] Monitor error rates (first 30 minutes)

### Post-Deployment
- [ ] Run smoke tests
- [ ] Verify tenant isolation
- [ ] Check communication tracking
- [ ] Review error logs
- [ ] User acceptance testing

### Rollback Criteria
- [ ] Error rate > 5%
- [ ] Database migration failure
- [ ] Critical feature broken
- [ ] Security vulnerability discovered

---

## SUCCESS CRITERIA

At the end of 2 weeks, all of the following must be TRUE:

- [x] ✅ All 105 routes enforce tenant isolation
- [x] ✅ All routes use standardized JWT authentication
- [x] ✅ WhatsApp/SMS messages tracked in database
- [x] ✅ GDPR deletion mechanism implemented
- [x] ✅ Single rate limiting middleware
- [x] ✅ All integration tests pass
- [x] ✅ Security penetration test passed
- [x] ✅ Production deployment successful

**If ALL criteria met**: ✅ **PRODUCTION READY**

---

## CONTACTS & ESCALATION

**Project Manager**: [Name]
**Backend Team Lead**: [Name]
**Frontend Team Lead**: [Name]
**Database Team Lead**: [Name]
**Security Team Lead**: [Name]
**Compliance Team Lead**: [Name]

**Escalation Path**:
1. Team Lead (for technical issues)
2. Project Manager (for timeline/resource issues)
3. CTO (for critical blockers)

**Daily Standup**: 9:00 AM (15 minutes)
**Weekly Review**: Friday 2:00 PM (1 hour)

---

## NEXT STEPS

### Immediate (Today)
1. [ ] Review this action plan with all team leads
2. [ ] Assign specific developers to each issue
3. [ ] Schedule daily standups
4. [ ] Create tracking board (Jira/Linear)
5. [ ] Begin Issue 1 (tenant isolation audit)

### Tomorrow
1. [ ] Continue Issue 1
2. [ ] Start Issue 2 (auth standardization)
3. [ ] Daily standup: review progress
4. [ ] Update tracking board

### End of Week 1
1. [ ] Issues 1, 2, 3, 5 complete
2. [ ] Friday review meeting
3. [ ] Prepare for Week 2 (GDPR deletion)

### End of Week 2
1. [ ] All P0 issues complete
2. [ ] All tests passing
3. [ ] Production deployment
4. [ ] Celebration! 🎉

---

**Document Created**: December 3, 2025
**Target Start**: Immediately
**Target Completion**: December 17, 2025 (2 weeks)
**Status**: READY TO BEGIN
