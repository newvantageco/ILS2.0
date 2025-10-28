# ILS Application Testing Guide

**Date:** October 28, 2025  
**Application:** Integrated Lens System (ILS)  
**Test Server:** http://localhost:3000

> **⚠️ IMPORTANT:** The server runs on port **3000** by default, not 5000.  
> Port 5000 is typically reserved by macOS AirPlay Receiver.  
> If you need to use port 5000, disable AirPlay Receiver in System Settings.

---

## 📋 Testing Checklist Overview

- [ ] Frontend UI Testing (All Roles)
- [ ] Backend API Testing
- [ ] Database Integrity Testing
- [ ] End-to-End Workflow Testing
- [ ] Automated Test Suite Execution
- [ ] Performance & Load Testing
- [ ] Security & RBAC Testing

---

## 🖥️ Step 1: Frontend Testing (React)

### 1.1 Public Pages

#### Landing Page (`/`)
- [ ] Page loads without errors
- [ ] Hero section displays correctly
- [ ] Feature cards render properly
- [ ] CTA buttons work (Login/Signup)
- [ ] Responsive design (mobile/tablet/desktop)

#### Login Page (`/login` or `/email-login`)
- [ ] Form renders correctly
- [ ] Email validation works (empty, invalid format)
- [ ] Password validation works (empty, weak)
- [ ] Error messages display properly
- [ ] "Forgot Password" link works
- [ ] "Sign Up" link redirects correctly
- [ ] Replit Auth integration works (if configured)
- [ ] Successful login redirects to correct dashboard

**Test Credentials:**
```
Admin:
Email: admin@ils.com
Password: [admin password]

ECP:
Email: ecp@test.com
Password: [ecp password]

Lab Tech:
Email: labtech@test.com
Password: [labtech password]
```

#### Signup Page (`/signup` or `/email-signup`)
- [ ] Form renders correctly
- [ ] Role selection dropdown works
- [ ] Organization name input works
- [ ] Email/password validation
- [ ] Password strength indicator
- [ ] Terms & conditions checkbox
- [ ] Signup creates user correctly
- [ ] Pending approval flow works

---

### 1.2 ECP (Eye Care Professional) Pages

**Base Path:** `/ecp`

#### ECP Dashboard (`/ecp/dashboard`)
- [ ] Dashboard loads without errors
- [ ] Recent orders displayed
- [ ] Order statistics widgets render
- [ ] Quick action buttons work
- [ ] Charts/graphs display correctly
- [ ] Real-time updates work (WebSocket)

#### Patients Page (`/ecp/patients`)
- [ ] Patient list displays
- [ ] Add new patient button works
- [ ] Search functionality works
- [ ] Filter options work
- [ ] Patient details modal opens
- [ ] Edit patient works
- [ ] Delete patient (if allowed)

#### Eye Test Page (`/ecp/patient/:id/test`)
- [ ] Eye examination form renders
- [ ] Prescription fields validate correctly
- [ ] Sphere/Cylinder/Axis inputs work
- [ ] Add/Prism values work
- [ ] PD (Pupillary Distance) input works
- [ ] Save examination works
- [ ] Generate prescription works

#### Prescriptions Page (`/ecp/prescriptions`)
- [ ] Prescription list displays
- [ ] Filter by patient works
- [ ] Search functionality works
- [ ] View prescription details works
- [ ] Edit prescription works
- [ ] Generate PDF works
- [ ] Email prescription works

#### New Order Page (`/ecp/new-order`)
- [ ] Order form renders correctly
- [ ] Patient selection dropdown works
- [ ] Prescription auto-fill works
- [ ] Lens type selection works
- [ ] Coating options work
- [ ] OMA file upload works
- [ ] Frame trace upload works
- [ ] Form validation (Zod schema)
- [ ] Submit order succeeds
- [ ] Order confirmation displays

**OMA File Upload Test:**
- [ ] Valid OMA file uploads successfully
- [ ] Invalid file rejected with error
- [ ] File size validation works
- [ ] File parsing extracts data correctly

#### Inventory Page (`/ecp/inventory`)
- [ ] Inventory list displays
- [ ] Add new item works
- [ ] Update stock levels works
- [ ] Low stock alerts display
- [ ] Search/filter functionality

#### POS Page (`/ecp/pos`)
- [ ] POS interface renders
- [ ] Add items to cart works
- [ ] Apply discounts works
- [ ] Calculate totals correctly
- [ ] Process payment works
- [ ] Generate invoice works
- [ ] Print receipt works

---

### 1.3 Lab Technician Pages

**Base Path:** `/lab`

#### Lab Dashboard (`/lab/dashboard`)
- [ ] Dashboard loads without errors
- [ ] Production queue displays
- [ ] Active orders shown
- [ ] Status update buttons work
- [ ] QC approval workflow
- [ ] Real-time status updates (WebSocket)

#### Order Queue Page (`/lab/queue`)
- [ ] Full order queue displays
- [ ] Filter by status works
- [ ] Sort by priority/date works
- [ ] Assign to technician works
- [ ] Bulk actions work

#### Production Tracking (`/lab/production`)
- [ ] Real-time production monitoring
- [ ] Stage progress tracking
- [ ] Bottleneck alerts display
- [ ] Equipment status shows

#### Quality Control (`/lab/quality`)
- [ ] QC inspection form works
- [ ] Pass/fail radio buttons
- [ ] Add QC notes works
- [ ] Approve order works
- [ ] Reject order with reason works
- [ ] Re-inspection tracking

#### Analytics Hub (`/lab/analytics`)
- [ ] Analytics dashboard loads
- [ ] Root cause analysis tools
- [ ] Data correlation charts
- [ ] Export reports works

#### Equipment Management (`/lab/equipment`)
- [ ] Equipment list displays
- [ ] Calibration tracking
- [ ] Maintenance scheduling
- [ ] Equipment status updates

---

### 1.4 Engineer Pages

**Base Path:** `/lab` (same as Lab Tech)

Engineers have same access as Lab Techs plus additional features:
- [ ] Advanced analytics access
- [ ] R&D project management
- [ ] Experimental order tracking
- [ ] System configuration access

---

### 1.5 Supplier Pages

**Base Path:** `/supplier`

#### Supplier Dashboard (`/supplier/dashboard`)
- [ ] Dashboard loads without errors
- [ ] Purchase orders displayed
- [ ] Order statistics widgets
- [ ] Action buttons work

#### Orders Page (`/supplier/orders`)
- [ ] PO list displays
- [ ] View PO details works
- [ ] Update delivery status works
- [ ] Mark as shipped works
- [ ] Add tracking number works

#### Product Library (`/supplier/library`)
- [ ] Product catalog displays
- [ ] Add new product works
- [ ] Edit product details works
- [ ] Upload product images works
- [ ] Manage inventory works

---

### 1.6 Admin Pages

**Base Path:** `/admin`

#### Admin Dashboard (`/admin/dashboard`)
- [ ] Dashboard loads without errors
- [ ] User management section
- [ ] Pending approvals count
- [ ] System statistics widgets

#### User Management (`/admin/users`)
- [ ] User list displays
- [ ] Search users works
- [ ] Filter by role works
- [ ] View user details works
- [ ] Approve pending users works
- [ ] Suspend users works
- [ ] Delete users works (soft delete)
- [ ] Reset user password works

#### Platform Settings (`/admin/platform`)
- [ ] Platform configuration form
- [ ] Update settings works
- [ ] Feature flags work
- [ ] Subscription plans configuration

---

### 1.7 Common UI Components

#### Navigation
- [ ] Sidebar toggle works
- [ ] Menu items render correctly
- [ ] Active route highlighted
- [ ] Role-based menu items show
- [ ] Logout button works

#### Theme Toggle
- [ ] Light/dark mode switch works
- [ ] Theme persists on refresh
- [ ] All components adapt to theme

#### Role Switcher (Demo Mode)
- [ ] Role switcher dropdown works
- [ ] Switching role updates UI
- [ ] Correct dashboard displays

#### Modals/Dialogs
- [ ] Open/close animations work
- [ ] Click outside to close works
- [ ] Escape key closes modal
- [ ] Form submission works

#### Forms
- [ ] Input validation (Zod schemas)
- [ ] Error messages display
- [ ] Required fields marked
- [ ] Submit/cancel buttons work
- [ ] Form reset works

#### Toasts/Notifications
- [ ] Success toasts display
- [ ] Error toasts display
- [ ] Warning toasts display
- [ ] Auto-dismiss works
- [ ] Close button works

---

### 1.8 Responsive Design Testing

Use Chrome DevTools Device Toolbar to test:

**Mobile (375x667 - iPhone SE)**
- [ ] Navigation collapses to hamburger
- [ ] Forms are usable on small screens
- [ ] Tables scroll horizontally
- [ ] Buttons are tappable (44px min)
- [ ] Text is readable (16px min)

**Tablet (768x1024 - iPad)**
- [ ] Layout adjusts appropriately
- [ ] Sidebar behavior correct
- [ ] Forms utilize space well
- [ ] Charts/graphs resize

**Desktop (1920x1080)**
- [ ] Full layout displays correctly
- [ ] No excessive white space
- [ ] Content not stretched
- [ ] Sidebar always visible

---

### 1.9 Browser Console Check

Open DevTools Console (F12) and check for:
- [ ] No JavaScript errors
- [ ] No React warnings
- [ ] No failed network requests
- [ ] No 404 errors
- [ ] WebSocket connection successful
- [ ] No memory leaks (prolonged use)

---

## 🔌 Step 2: Backend API Testing

### 2.1 Testing Tools

**Recommended:** Postman, Insomnia, or Thunder Client (VS Code extension)

**Base URL:** `http://localhost:5000/api`

### 2.2 Authentication Endpoints

#### GET `/api/auth/user`
- **Purpose:** Get current authenticated user
- **Auth Required:** Yes
- **Expected Response:**
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "role": "ecp",
  "accountStatus": "active",
  "organizationId": "org_id"
}
```
- [ ] Returns 401 when not authenticated
- [ ] Returns user data when authenticated
- [ ] User data matches database

#### POST `/api/auth/complete-signup`
- **Purpose:** Complete user signup with role selection
- **Auth Required:** Yes
- **Request Body:**
```json
{
  "role": "ecp",
  "organizationName": "Test Clinic",
  "subscriptionPlan": "free_ecp"
}
```
- [ ] Creates user with correct role
- [ ] Sets account status to pending
- [ ] Returns updated user object
- [ ] Validates role values
- [ ] Validates subscription plan

#### POST `/api/auth/logout`
- **Purpose:** Logout user
- **Auth Required:** Yes
- [ ] Clears session
- [ ] Redirects to login page
- [ ] Cannot access protected routes after logout

---

### 2.3 Order Endpoints

#### GET `/api/orders`
- **Purpose:** Get all orders for organization
- **Auth Required:** Yes
- **Query Params:** `?status=pending&limit=50`
- [ ] Returns array of orders
- [ ] Filters by status work
- [ ] Pagination works
- [ ] ECP sees only their orders
- [ ] Lab sees all orders
- [ ] Admin sees all orders

#### POST `/api/orders`
- **Purpose:** Create new lens order
- **Auth Required:** Yes (ECP role)
- **Request Body:**
```json
{
  "patientName": "John Doe",
  "prescriptionId": "rx_123",
  "lensType": "single_vision",
  "rightSphere": -2.50,
  "leftSphere": -2.75,
  "coating": ["anti_reflective", "scratch_resistant"],
  "omaFile": "base64_encoded_file"
}
```
- [ ] Creates order successfully
- [ ] Validates required fields
- [ ] Returns order ID
- [ ] Sets status to "pending"
- [ ] Non-ECP users get 403 error

#### GET `/api/orders/:id`
- **Purpose:** Get order details
- **Auth Required:** Yes
- [ ] Returns order details
- [ ] Includes related data (patient, prescription)
- [ ] Returns 404 for non-existent order
- [ ] RBAC enforced (can't see other org orders)

#### PUT `/api/orders/:id/status`
- **Purpose:** Update order status
- **Auth Required:** Yes (Lab Tech, Engineer)
- **Request Body:**
```json
{
  "status": "in_production",
  "notes": "Started production"
}
```
- [ ] Updates status correctly
- [ ] Triggers WebSocket broadcast
- [ ] Validates status transitions
- [ ] ECP users get 403 error

---

### 2.4 User Management Endpoints (Admin)

#### GET `/api/users`
- **Auth Required:** Yes (Admin role)
- [ ] Returns list of users
- [ ] Filters work (role, status)
- [ ] Pagination works
- [ ] Non-admin users get 403

#### POST `/api/users`
- **Purpose:** Admin creates new user
- **Request Body:**
```json
{
  "email": "newuser@test.com",
  "role": "lab_tech",
  "organizationId": "org_123"
}
```
- [ ] Creates user successfully
- [ ] Sends invitation email
- [ ] Validates email format
- [ ] Prevents duplicate emails

#### PUT `/api/users/:id/approve`
- **Purpose:** Approve pending user
- [ ] Changes status to "active"
- [ ] Sends approval email
- [ ] Returns updated user

#### PUT `/api/users/:id/suspend`
- **Purpose:** Suspend user account
- **Request Body:**
```json
{
  "reason": "Violation of terms"
}
```
- [ ] Changes status to "suspended"
- [ ] Logs out user immediately
- [ ] User cannot login again

---

### 2.5 File Upload Endpoints

#### POST `/api/upload/oma`
- **Purpose:** Upload OMA file
- **Auth Required:** Yes
- **Content-Type:** multipart/form-data
- [ ] Accepts valid OMA files
- [ ] Rejects invalid files
- [ ] Returns parsed data
- [ ] File size limit enforced (10MB)

#### POST `/api/upload/frame-trace`
- **Purpose:** Upload frame trace file
- [ ] Accepts image files (PNG, JPG)
- [ ] Returns file URL
- [ ] File size validation

---

### 2.6 PDF Generation Endpoints

#### POST `/api/pdf/purchase-order`
- **Purpose:** Generate PO PDF
- **Auth Required:** Yes
- **Request Body:**
```json
{
  "purchaseOrderId": "po_123"
}
```
- [ ] Generates PDF successfully
- [ ] Returns PDF blob or URL
- [ ] Includes all order details
- [ ] Formatted correctly

#### POST `/api/pdf/prescription`
- **Purpose:** Generate prescription PDF
- [ ] Generates PDF successfully
- [ ] Includes patient info
- [ ] Includes prescription details
- [ ] Formatted for printing

---

### 2.7 Notification Endpoints

#### GET `/api/notifications`
- **Auth Required:** Yes
- [ ] Returns user notifications
- [ ] Marks as read works
- [ ] Filters work (unread only)

#### POST `/api/notifications/send`
- **Purpose:** Send notification
- [ ] Sends in-app notification
- [ ] Sends email (if enabled)
- [ ] Broadcasts via WebSocket

---

### 2.8 WebSocket Testing

#### WebSocket Connection: `ws://localhost:5000/ws`

**Connection URL:**
```
ws://localhost:5000/ws?userId=user_123&organizationId=org_456&roles=ecp
```

**Test Steps:**
1. [ ] Open WebSocket connection
2. [ ] Receive welcome message
3. [ ] Submit order in UI
4. [ ] Receive `order_status` message
5. [ ] Update order status
6. [ ] Receive real-time update
7. [ ] Test heartbeat/ping-pong
8. [ ] Verify room isolation (org-specific messages)

**Message Types to Test:**
- [ ] `order_status` - Order status updates
- [ ] `anomaly_alert` - System anomaly alerts
- [ ] `bottleneck_alert` - Production bottleneck alerts
- [ ] `metric_update` - Dashboard metric updates
- [ ] `lims_sync` - LIMS synchronization events

---

### 2.9 Error Handling Tests

#### Test Invalid Inputs
- [ ] Empty required fields → 400 Bad Request
- [ ] Invalid email format → 422 Unprocessable Entity
- [ ] SQL injection attempts → Sanitized
- [ ] XSS attempts → Escaped

#### Test Unauthorized Access
- [ ] No auth token → 401 Unauthorized
- [ ] Wrong role → 403 Forbidden
- [ ] Expired session → 401 Unauthorized

#### Test Edge Cases
- [ ] Very long strings (>1000 chars)
- [ ] Special characters in inputs
- [ ] Null/undefined values
- [ ] Concurrent requests
- [ ] Duplicate submissions

---

## 🗄️ Step 3: Database Testing

### 3.1 Database Connection

**Check Database Connection:**
```bash
# Check if DATABASE_URL is set
echo $DATABASE_URL

# Test database connection
psql $DATABASE_URL -c "SELECT version();"
```

### 3.2 Verify Tables Exist

```sql
-- List all tables
\dt

-- Expected tables:
-- users, organizations, orders, prescriptions, patients
-- purchase_orders, suppliers, consult_logs, technical_documents
-- analytics_events, notifications, etc.
```

- [ ] All required tables exist
- [ ] Tables have correct columns
- [ ] Indexes are created
- [ ] Foreign keys are set up

### 3.3 Test Data Integrity

#### User Table
```sql
SELECT * FROM users LIMIT 5;
```
- [ ] Users created correctly
- [ ] Passwords are hashed
- [ ] Emails are normalized
- [ ] Role assignments correct
- [ ] Account status accurate

#### Order Table
```sql
SELECT * FROM orders WHERE status = 'pending' LIMIT 10;
```
- [ ] Orders linked to correct customer
- [ ] Foreign keys valid
- [ ] Timestamps accurate
- [ ] Status values valid

#### Relationship Tests
```sql
-- Check orders with customer details
SELECT o.id, o.status, u.email, org.name
FROM orders o
JOIN users u ON o.customer_id = u.id
JOIN organizations org ON u.organization_id = org.id
LIMIT 5;
```
- [ ] Joins work correctly
- [ ] No orphaned records
- [ ] Cascading deletes work (if configured)

### 3.4 Test Zod Schema Validation

#### Verify Schema Enforcement
- [ ] Insert valid data succeeds
- [ ] Insert invalid data fails
- [ ] Type mismatches rejected
- [ ] Required fields enforced
- [ ] Enum values validated

**Test Script:**
```typescript
// Test invalid order creation
const invalidOrder = {
  status: "invalid_status", // Should fail
  customerName: 123, // Should fail (expects string)
};

// This should throw Zod validation error
insertOrderSchema.parse(invalidOrder);
```

---

## 🔄 Step 4: End-to-End Workflow Testing

### Workflow 1: ECP Orders Lens → Lab Processes → Shipped

**Actors:** ECP, Lab Tech, Engineer, Supplier, Admin

#### Step 1: ECP Creates Order
1. [ ] Login as ECP
2. [ ] Navigate to `/ecp/new-order`
3. [ ] Select patient
4. [ ] Upload OMA file
5. [ ] Fill prescription details
6. [ ] Submit order
7. [ ] Verify order appears in dashboard
8. [ ] Check email notification sent

#### Step 2: Lab Tech Receives Order
1. [ ] Login as Lab Tech
2. [ ] Verify order appears in queue
3. [ ] Real-time WebSocket notification received
4. [ ] Click on order to view details
5. [ ] Assign to self
6. [ ] Update status to "in_production"
7. [ ] Verify ECP sees status update

#### Step 3: Production Process
1. [ ] Lab tech logs production stages
2. [ ] QC checkpoints recorded
3. [ ] Any issues logged in consult log
4. [ ] Engineer approves QC (if required)
5. [ ] Status updated to "quality_check"

#### Step 4: Quality Approval
1. [ ] Engineer reviews order
2. [ ] Performs QC inspection
3. [ ] Approves order
4. [ ] Status updated to "completed"
5. [ ] WebSocket notifies all parties

#### Step 5: Shipping
1. [ ] Lab tech initiates shipment
2. [ ] System generates purchase order (if supplier involved)
3. [ ] PDF generated and emailed to supplier
4. [ ] Tracking number added
5. [ ] Status updated to "shipped"
6. [ ] ECP receives shipment notification

#### Step 6: Admin Monitoring
1. [ ] Login as Admin
2. [ ] View audit logs
3. [ ] Check analytics dashboard
4. [ ] Verify no errors in system logs

**Verification Points:**
- [ ] Each status change triggers WebSocket broadcast
- [ ] Email notifications sent at appropriate stages
- [ ] PDF generation works
- [ ] All timestamps recorded correctly
- [ ] No data loss between stages
- [ ] RBAC enforced throughout workflow

---

### Workflow 2: New User Signup → Approval → First Login

#### Step 1: User Signs Up
1. [ ] Navigate to `/signup`
2. [ ] Fill registration form
3. [ ] Select role (e.g., "lab_tech")
4. [ ] Submit signup
5. [ ] Redirected to pending approval page
6. [ ] Check email sent (if configured)

#### Step 2: Admin Reviews
1. [ ] Login as Admin
2. [ ] Navigate to `/admin/users`
3. [ ] See pending user
4. [ ] Review user details
5. [ ] Approve user
6. [ ] Approval email sent

#### Step 3: User First Login
1. [ ] User receives approval email
2. [ ] Navigate to `/login`
3. [ ] Login with credentials
4. [ ] Redirected to role-specific dashboard
5. [ ] Can access permitted pages
6. [ ] Cannot access restricted pages

---

### Workflow 3: File Upload → Processing → Display

#### Step 1: Upload OMA File
1. [ ] Login as ECP
2. [ ] Go to new order page
3. [ ] Select OMA file from computer
4. [ ] Upload file
5. [ ] File validation runs
6. [ ] Progress indicator shows

#### Step 2: Server Processing
1. [ ] Server receives file
2. [ ] File parsed (OMA parser)
3. [ ] Data extracted
4. [ ] Stored in database
5. [ ] File saved to storage

#### Step 3: Display Results
1. [ ] Order form auto-populated with OMA data
2. [ ] Preview shows extracted prescription
3. [ ] User can review/edit
4. [ ] Submit order with OMA data

**Verification:**
- [ ] Valid OMA files process correctly
- [ ] Invalid files rejected with clear error
- [ ] Large files handled (within limits)
- [ ] File names sanitized
- [ ] No path traversal vulnerabilities

---

## 🤖 Step 5: Automated Testing

### 5.1 Run Existing Test Suite

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode (for development)
npm run test:watch
```

**Expected Results:**
- [ ] All tests pass
- [ ] No failing tests
- [ ] Coverage > 70% (ideally 80%+)
- [ ] No flaky tests (run multiple times)

### 5.2 Review Test Coverage

```bash
# Open coverage report
open coverage/lcov-report/index.html
```

**Check Coverage For:**
- [ ] Critical services (OrderService, AuthService)
- [ ] API routes
- [ ] Utility functions
- [ ] Validation schemas

### 5.3 Identify Missing Tests

**Areas That Need Tests:**
- [ ] Authentication flows
- [ ] Order creation workflow
- [ ] File upload handlers
- [ ] PDF generation
- [ ] Email sending
- [ ] WebSocket broadcasting
- [ ] Database transactions
- [ ] Error handling paths

### 5.4 Write Additional Tests (If Needed)

**Example Test Structure:**
```typescript
// test/OrderService.test.ts
describe('OrderService', () => {
  describe('createOrder', () => {
    it('should create order with valid data', async () => {
      // Test implementation
    });
    
    it('should reject order with invalid prescription', async () => {
      // Test implementation
    });
    
    it('should enforce RBAC - ECP only', async () => {
      // Test implementation
    });
  });
});
```

---

## 🔒 Step 6: Security & RBAC Testing

### 6.1 Role-Based Access Control (RBAC)

#### Test ECP Permissions
- [ ] Can create orders
- [ ] Can view own orders only
- [ ] Cannot update order status
- [ ] Cannot access admin routes
- [ ] Cannot access lab production pages
- [ ] Cannot manage users

#### Test Lab Tech Permissions
- [ ] Can view all orders
- [ ] Can update order status
- [ ] Can log consult notes
- [ ] Cannot create orders (ECP only)
- [ ] Cannot access admin routes
- [ ] Cannot manage users

#### Test Engineer Permissions
- [ ] Same as Lab Tech +
- [ ] Can approve QC
- [ ] Can access analytics
- [ ] Can manage equipment
- [ ] Can access R&D projects

#### Test Supplier Permissions
- [ ] Can view assigned POs
- [ ] Can update delivery status
- [ ] Can manage product library
- [ ] Cannot view lab production
- [ ] Cannot access admin routes

#### Test Admin Permissions
- [ ] Can manage all users
- [ ] Can approve/suspend accounts
- [ ] Can view all orders
- [ ] Can access all dashboards
- [ ] Can modify platform settings
- [ ] Full system access

### 6.2 Authentication Security
- [ ] Passwords hashed with bcrypt
- [ ] Session cookies httpOnly
- [ ] Session cookies secure (in production)
- [ ] CSRF protection enabled
- [ ] Rate limiting on login attempts
- [ ] Logout invalidates session

### 6.3 Input Validation & Sanitization
- [ ] SQL injection prevented (parameterized queries)
- [ ] XSS prevented (input escaping)
- [ ] Path traversal prevented (file uploads)
- [ ] Command injection prevented
- [ ] CORS configured correctly

---

## ⚡ Step 7: Performance Testing

### 7.1 Page Load Times
- [ ] Landing page < 2 seconds
- [ ] Dashboard < 3 seconds
- [ ] Order details page < 2 seconds
- [ ] Large lists (100+ items) < 4 seconds

### 7.2 API Response Times
- [ ] GET requests < 500ms
- [ ] POST requests < 1 second
- [ ] File uploads < 5 seconds (10MB)
- [ ] PDF generation < 3 seconds

### 7.3 WebSocket Performance
- [ ] Connection established < 1 second
- [ ] Message delivery < 100ms (sub-second promise)
- [ ] Handles 100+ concurrent connections
- [ ] No dropped messages

### 7.4 Database Query Performance
```sql
-- Check slow queries
EXPLAIN ANALYZE SELECT * FROM orders WHERE status = 'pending';
```
- [ ] All queries use indexes
- [ ] No full table scans on large tables
- [ ] Joins optimized

---

## 🐛 Step 8: Bug Tracking & Reporting

### 8.1 Create Issues for Bugs Found

**Issue Template:**
```markdown
## Bug Description
[Clear description of the issue]

## Steps to Reproduce
1. Navigate to...
2. Click on...
3. See error...

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happens]

## Screenshots
[If applicable]

## Environment
- Browser: Chrome 119
- OS: macOS 14.0
- User Role: ECP
- Server: localhost:5000

## Console Errors
[Any errors from browser console]

## Priority
- [ ] Critical (blocks major functionality)
- [ ] High (important feature broken)
- [ ] Medium (minor issue)
- [ ] Low (cosmetic)
```

### 8.2 Track Test Results

Create a test results spreadsheet:

| Test ID | Feature | Expected | Actual | Status | Priority | Notes |
|---------|---------|----------|--------|--------|----------|-------|
| FE-001 | Login Page | Form validates | ✅ Pass | Pass | - | - |
| FE-002 | ECP Dashboard | Loads < 3s | ✅ 2.1s | Pass | - | - |
| FE-003 | OMA Upload | Parses file | ❌ Fail | Fail | High | Error parsing multi-line |
| BE-001 | Create Order | Returns 201 | ✅ Pass | Pass | - | - |

---

## 📊 Step 9: Final Checklist

### Application Health
- [ ] Development server running stable
- [ ] No memory leaks detected
- [ ] No console errors in normal operation
- [ ] WebSocket connection stable
- [ ] Database connection pool healthy

### Feature Completeness
- [ ] All role-specific pages accessible
- [ ] All CRUD operations work
- [ ] File uploads functional
- [ ] PDF generation works
- [ ] Email notifications sent (or queued)
- [ ] Real-time updates via WebSocket
- [ ] Role-based access control enforced

### Code Quality
- [ ] ESLint/TypeScript checks pass
- [ ] No build warnings
- [ ] Test suite passes
- [ ] Test coverage acceptable
- [ ] Code follows conventions

### Documentation
- [ ] README up to date
- [ ] API endpoints documented
- [ ] Environment variables documented
- [ ] Setup instructions clear
- [ ] Known issues documented

### Deployment Readiness
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] SSL certificates configured (production)
- [ ] CORS configured correctly
- [ ] Error logging configured
- [ ] Health check endpoint works

---

## 🛠️ Troubleshooting Common Issues

### Issue: Port 5000 Already in Use
```bash
# Find process using port 5000
lsof -i :5000

# Kill process
kill -9 [PID]

# Or change port in .env
PORT=5001
```

### Issue: Database Connection Failed
```bash
# Check DATABASE_URL
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1;"

# Check if database exists
psql $DATABASE_URL -c "\l"
```

### Issue: WebSocket Not Connecting
- [ ] Check if server is running
- [ ] Check browser console for errors
- [ ] Verify WebSocket URL correct
- [ ] Check CORS configuration
- [ ] Test with WebSocket client tool

### Issue: Tests Failing
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Jest cache
npm test -- --clearCache

# Run tests with verbose output
npm test -- --verbose
```

### Issue: Build Fails
```bash
# Check TypeScript errors
npm run check

# Clear build cache
rm -rf dist .vite

# Rebuild
npm run build
```

---

## 📝 Testing Notes & Observations

### Date: [Today's Date]
**Tester:** [Your Name]  
**Test Session Duration:** [X hours]

#### Summary of Findings
- Total tests executed: [X]
- Passed: [X]
- Failed: [X]
- Blocked: [X]

#### Critical Issues Found
1. [Issue 1 description]
2. [Issue 2 description]

#### Recommendations
1. [Recommendation 1]
2. [Recommendation 2]

#### Next Steps
- [ ] Fix critical bugs
- [ ] Add missing tests
- [ ] Improve error handling
- [ ] Update documentation

---

## 🎯 AI-Assisted Testing Workflow

When you encounter an error, use AI to help debug:

**Prompt Template:**
```
I'm testing the ILS application and encountered this issue:

**Error:**
[Paste error message or unexpected behavior]

**Expected Behavior:**
[What should happen]

**Context:**
- Page: [URL or component name]
- User Role: [ECP/Lab Tech/etc.]
- Action Taken: [What you were doing]
- Browser Console: [Any errors]

Please:
1. Identify the root cause
2. Explain why it happened
3. Provide the minimal fix
4. Suggest how to prevent similar issues
```

**After Receiving Fix:**
1. Apply the fix
2. Restart dev server if needed
3. Retest the scenario
4. Verify fix works
5. Check for any new issues introduced
6. Document the fix

---

## ✅ Sign-Off

**Date Completed:** __________  
**Tested By:** __________  
**Application Version:** __________  
**Test Environment:** Development (localhost:5000)

**Overall Status:**
- [ ] Ready for Production
- [ ] Ready with Minor Issues
- [ ] Needs Significant Work
- [ ] Not Ready

**Notes:**
[Any final comments or observations]

---

**End of Testing Guide**
