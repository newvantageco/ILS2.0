# 🎯 Dispenser Role - Implementation Checklist

Use this checklist to track your progress from implementation to production.

## ✅ Phase 1: Backend Setup (Completed)

- [x] Create permissions migration (`add_dispenser_permissions.sql`)
- [x] Add 18 POS permissions
- [x] Add patient management permissions
- [x] Add clinical read-only permissions
- [x] Add order management permissions
- [x] Update DefaultRolesService with enhanced Dispenser role
- [x] Add cloneRole() function with description support
- [x] Add updateRolePermissions() function
- [x] Create POST /api/roles/:roleId/clone endpoint
- [x] Create POST /api/roles/:roleId/permissions endpoint
- [x] Create GET /api/roles/my/permissions endpoint
- [x] Create GET /api/examinations/recent endpoint
- [x] Test all API endpoints with Postman/curl

## ✅ Phase 2: Frontend Components (Completed)

- [x] Create PatientHandoffNotification component
- [x] Implement real-time polling (30s interval)
- [x] Add dismiss functionality
- [x] Create beautiful notification UI with gradients
- [x] Create usePermissions hook
- [x] Add hasPermission() function
- [x] Add hasAnyPermission() function
- [x] Add hasAllPermissions() function
- [x] Add RequirePermission component wrapper
- [x] Add RequireRole component wrapper

## 📋 Phase 3: Integration (Your Next Step)

### OpticalPOSPage Integration
- [ ] Import PatientHandoffNotification component
- [ ] Add notification to POS page layout
- [ ] Implement onSelectPatient handler
  - [ ] Load patient data from patientId
  - [ ] Filter products based on managementPlan
  - [ ] Pre-populate prescription fields
- [ ] Test notification → patient selection workflow
- [ ] Test product filtering logic

### Permission-Based UI Controls
- [ ] Add permission checks to POS buttons
  - [ ] Void Invoice button (requires `pos:invoices:void`)
  - [ ] Apply Discount button (requires `pos:invoices:apply_discount`)
  - [ ] Adjust Stock button (requires `pos:products:manage_stock`)
  - [ ] Delete Patient button (requires `patients:delete`)
- [ ] Hide features user doesn't have access to
- [ ] Show disabled state with tooltip for limited permissions
- [ ] Test with different role variants

### Settings Page Integration
- [ ] Create Roles management tab
- [ ] List all company roles with user counts
- [ ] Add "Clone Role" button
- [ ] Create role cloning modal
- [ ] Create permission editor modal
- [ ] Add checkboxes for each permission category
- [ ] Test role creation and cloning
- [ ] Test permission add/remove

## 🗄️ Phase 4: Database Setup (Action Required)

### Run Migrations
- [ ] Backup your database first!
- [ ] Set DATABASE_URL environment variable
- [ ] Run: `chmod +x scripts/setup_dispenser_role.sh`
- [ ] Run: `./scripts/setup_dispenser_role.sh`
- [ ] Verify no errors in output
- [ ] Check permission count: Should show 18+ POS permissions
- [ ] Check role count: Should show Dispenser role for all companies

### Assign Test Users
- [ ] Identify test user for Dispenser role
- [ ] Get user ID and Dispenser role ID from database
- [ ] Assign role via SQL or API
- [ ] Login as test user
- [ ] Verify POS access works
- [ ] Verify they see appropriate permissions

## 🧪 Phase 5: Testing (Critical)

### Test 1: Default Dispenser Permissions
- [ ] Login as Dispenser
- [ ] **CAN** search for patients ✓
- [ ] **CAN** create new patient ✓
- [ ] **CAN** view product catalog ✓
- [ ] **CAN** create invoice ✓
- [ ] **CAN** view prescriptions ✓
- [ ] **CAN** create lab order ✓
- [ ] **CAN** view sales reports ✓
- [ ] **CANNOT** delete patient ✗
- [ ] **CANNOT** void invoice ✗
- [ ] **CANNOT** apply discount ✗
- [ ] **CANNOT** edit product price ✗
- [ ] **CANNOT** adjust stock ✗

### Test 2: Role Cloning
- [ ] Login as Company Admin
- [ ] Clone "Dispenser" role
- [ ] Name it "Trainee Dispenser"
- [ ] Remove permissions:
  - [ ] `pos:invoices:create`
  - [ ] `orders:create`
- [ ] Assign to test user
- [ ] Login as Trainee
- [ ] **CAN** view products ✓
- [ ] **CAN** search patients ✓
- [ ] **CANNOT** complete sales ✗
- [ ] **CANNOT** create orders ✗

### Test 3: Dispensing Manager
- [ ] Clone "Dispenser" role
- [ ] Name it "Dispensing Manager"
- [ ] Add permissions:
  - [ ] `pos:invoices:void`
  - [ ] `pos:invoices:apply_discount`
  - [ ] `pos:products:update`
  - [ ] `pos:products:manage_stock`
  - [ ] `analytics:read_pos`
- [ ] Assign to test user
- [ ] Login as Manager
- [ ] **CAN** do everything Dispenser can ✓
- [ ] **CAN** void invoices ✓
- [ ] **CAN** apply discounts ✓
- [ ] **CAN** adjust stock ✓
- [ ] **CAN** view analytics dashboard ✓

### Test 4: Patient Handoff Workflow
- [ ] Login as Optometrist
- [ ] Create or select a patient
- [ ] Complete eye examination
- [ ] Add diagnosis (e.g., "Presbyopia")
- [ ] Add management plan (e.g., "Progressive Lenses")
- [ ] Set status to "Completed"
- [ ] Wait 30 seconds
- [ ] Login as Dispenser (different browser/incognito)
- [ ] Notification appears within 30 seconds ✓
- [ ] Notification shows correct patient name ✓
- [ ] Notification shows diagnosis ✓
- [ ] Notification shows management plan ✓
- [ ] Click "Begin Dispensing"
- [ ] Patient data loads automatically ✓
- [ ] Products filtered by recommendation ✓
- [ ] Prescription pre-populated ✓
- [ ] Complete sale successfully ✓

### Test 5: Permission Enforcement (API Level)
- [ ] Login as Dispenser (get auth token)
- [ ] Try to DELETE /api/patients/:id
  - [ ] Should return **403 Forbidden** ✗
- [ ] Try to POST /api/invoices/:id/void
  - [ ] Should return **403 Forbidden** ✗
- [ ] Try to PUT /api/products/:id (change price)
  - [ ] Should return **403 Forbidden** ✗
- [ ] Try to POST /api/inventory/adjust
  - [ ] Should return **403 Forbidden** ✗
- [ ] Try to POST /api/invoices (create)
  - [ ] Should return **200 OK** ✓
- [ ] Try to GET /api/prescriptions
  - [ ] Should return **200 OK** ✓

### Test 6: Multi-Role Users
- [ ] Create user with 2 roles: "Dispenser" + "Inventory Manager"
- [ ] Login as that user
- [ ] Verify they have permissions from BOTH roles
- [ ] Can create invoices (from Dispenser) ✓
- [ ] Can adjust stock (from Inventory Manager) ✓
- [ ] Check /api/roles/my/permissions
- [ ] Should show union of all permissions ✓

### Test 7: Owner Override
- [ ] Login as Company Owner
- [ ] Verify `isOwner: true` in /api/roles/my/permissions
- [ ] Try restricted actions (void, delete, adjust)
- [ ] All should work despite role restrictions ✓
- [ ] Owner bypasses all permission checks ✓

## 📊 Phase 6: Monitoring & Validation

### Database Audit
- [ ] Run: `SELECT COUNT(*) FROM permissions WHERE category = 'Point of Sale (POS)';`
  - [ ] Should be 18 or more
- [ ] Run: `SELECT COUNT(*) FROM dynamic_roles WHERE name = 'Dispenser';`
  - [ ] Should match number of companies
- [ ] Run: `SELECT * FROM role_change_audit ORDER BY timestamp DESC LIMIT 10;`
  - [ ] Should show role creation events
- [ ] Run: `SELECT * FROM user_dynamic_roles WHERE role_id IN (SELECT id FROM dynamic_roles WHERE name = 'Dispenser');`
  - [ ] Should show assigned Dispensers

### Performance Check
- [ ] Test /api/roles/my/permissions response time
  - [ ] Should be <200ms
- [ ] Test /api/examinations/recent response time
  - [ ] Should be <500ms
- [ ] Test PatientHandoffNotification polling
  - [ ] Should not cause UI lag
- [ ] Check database query execution plans
  - [ ] All queries should use indexes

### Security Audit
- [ ] Try to access other company's roles
  - [ ] Should return 404 or 403 ✗
- [ ] Try to assign permissions without `users:manage_roles`
  - [ ] Should return 403 ✗
- [ ] Try to clone system default Admin role
  - [ ] Should succeed (all roles are cloneable)
- [ ] Try to delete Dispenser role
  - [ ] Should fail (`is_deletable: false`) ✗
- [ ] Check audit logs are being written
  - [ ] Every permission change logged ✓

## 📚 Phase 7: Documentation & Training

### User Documentation
- [ ] Create "How to use the Dispenser role" guide
- [ ] Record video: "From Exam to Sale in 60 seconds"
- [ ] Create training doc for Trainee Dispensers
- [ ] Write knowledge base article on role customization
- [ ] Document common permission scenarios

### Developer Documentation
- [ ] Update API documentation with new endpoints
- [ ] Document permission enforcement patterns
- [ ] Add examples to API reference
- [ ] Create troubleshooting guide
- [ ] Document database schema changes

### Admin Documentation
- [ ] Guide for creating custom role variants
- [ ] How to assign roles to users
- [ ] Understanding the audit trail
- [ ] Best practices for permission management
- [ ] Plan-level permission gating explained

## 🚀 Phase 8: Deployment

### Pre-Production
- [ ] Run all tests on staging environment
- [ ] Load test with 100+ concurrent users
- [ ] Test with real practice data (anonymized)
- [ ] Get feedback from 2-3 beta practices
- [ ] Fix any reported issues
- [ ] Performance optimization if needed

### Production Deployment
- [ ] Schedule maintenance window
- [ ] Backup production database
- [ ] Run migration: `add_dispenser_permissions.sql`
- [ ] Run role creation script for all companies
- [ ] Verify migrations succeeded
- [ ] Test critical workflows
- [ ] Monitor error logs for 1 hour
- [ ] Send announcement to customers

### Post-Deployment
- [ ] Monitor Sentry/error tracking
- [ ] Watch for permission-related 403 errors
- [ ] Check API response times
- [ ] Collect user feedback
- [ ] Schedule follow-up calls with beta users
- [ ] Iterate on UI/UX based on feedback

## 🎉 Phase 9: Success Metrics (Week 1-4)

### Track These KPIs
- [ ] Time-per-sale before vs after
  - [ ] Target: 30% reduction
- [ ] Dispenser satisfaction score
  - [ ] Target: 8/10 or higher
- [ ] Number of permission-related support tickets
  - [ ] Target: <5 per week
- [ ] Patient handoff notification usage
  - [ ] Target: 80% of completed exams
- [ ] Role cloning adoption
  - [ ] Target: 30% of companies customize

### Review Meetings
- [ ] Week 1: Bug triage and hot fixes
- [ ] Week 2: User feedback review
- [ ] Week 3: Performance optimization
- [ ] Week 4: Feature enhancement planning

## 💡 Phase 10: Future Enhancements

### Quick Wins (Next Sprint)
- [ ] Add bulk role assignment
- [ ] Export role configuration as JSON
- [ ] Import role configuration
- [ ] Role usage analytics dashboard
- [ ] Permission search in role editor

### Medium Term (1-3 months)
- [ ] AI-powered product recommendations
- [ ] Face shape analysis for frames
- [ ] Commission tracking per Dispenser
- [ ] Performance leaderboards
- [ ] Automated upselling suggestions

### Long Term (3-6 months)
- [ ] Multi-location role inheritance
- [ ] Scheduled permission changes
- [ ] Time-based access control
- [ ] Advanced audit reporting
- [ ] Role templates marketplace

---

## 🆘 Troubleshooting

### Issue: Permissions not applying
**Check:**
1. [ ] User has role assigned in `user_dynamic_roles`
2. [ ] Role has permissions in `dynamic_role_permissions`
3. [ ] User has refreshed their session (logout/login)
4. [ ] Cache is not stale (check `/api/roles/my/permissions`)

### Issue: Notification not appearing
**Check:**
1. [ ] Exam status is `'completed'`
2. [ ] Exam has `diagnosis` and `managementPlan` in JSONB
3. [ ] Browser console shows no API errors
4. [ ] `/api/examinations/recent` returns data
5. [ ] Polling interval is working (network tab)

### Issue: Role cloning fails
**Check:**
1. [ ] User has `users:manage_roles` permission
2. [ ] Source role exists and belongs to company
3. [ ] New role name is unique
4. [ ] Database has no constraint violations
5. [ ] Check audit logs for error details

---

## ✅ Sign-Off

**Implementation Complete:**
- [ ] All backend services deployed
- [ ] All frontend components integrated
- [ ] All tests passing
- [ ] Documentation complete
- [ ] Training materials ready

**Approved By:**
- [ ] Tech Lead: _________________ Date: _______
- [ ] Product Manager: _________________ Date: _______
- [ ] QA Lead: _________________ Date: _______

**Production Ready:** ⬜ YES  ⬜ NO

**Notes:**
_____________________________________________________
_____________________________________________________
_____________________________________________________

---

**Good luck!** You're building something truly world-class. 🚀👓
