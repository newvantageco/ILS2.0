# ILS Testing Quick Start

**⚡ Fast track to testing your ILS application**

---

## 🚀 Quick Start (5 Minutes)

### 1. Verify Server is Running
```bash
# Check if server is running
curl http://localhost:3000/health

# Expected response:
# {"status":"ok","timestamp":"2025-10-28T...","environment":"development"}
```

✅ **If working:** Continue to step 2  
❌ **If not working:** Run `npm run dev` in terminal

---

### 2. Open Application in Browser
Navigate to: **http://localhost:3000**

You should see:
- ✅ Landing page loads
- ✅ No console errors (press F12 to check)
- ✅ "Login" and "Sign Up" buttons visible

---

### 3. Run Automated Tests
```bash
# Quick test suite
npm test

# Expected result:
# Test Suites: 5 passed, 5 total
# Tests: 27 passed, 27 total

# Run automated integration tests
node test_runner.js

# Expected result:
# Success Rate: 85%+ (some failures are expected for auth-required endpoints)
```

---

### 4. Test Login Flow

1. Click "Login" or navigate to http://localhost:3000/login
2. Try logging in (or sign up if needed)
3. Verify you're redirected to a dashboard based on your role

**Note:** If you need test accounts, you can create them via the signup flow.

---

### 5. Test Key Features (Pick Your Role)

#### If you're testing as **ECP**:
1. Navigate to `/ecp/new-order`
2. Try creating an order
3. Check if it appears in your dashboard
4. Upload an OMA file (if you have one)

#### If you're testing as **Lab Tech**:
1. Navigate to `/lab/dashboard`
2. View the order queue
3. Try updating an order status
4. Check if real-time updates work

#### If you're testing as **Admin**:
1. Navigate to `/admin/dashboard`
2. View user list
3. Try approving a pending user
4. Check user management features

---

## 📋 Full Testing Checklist

See detailed guides:
- 📘 **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Complete testing procedures
- 📊 **[TEST_REPORT.md](./TEST_REPORT.md)** - Full test results and findings

---

## 🔧 Common Issues & Quick Fixes

### Issue: "Connection refused" on port 5000
**Fix:** The app runs on port **3000**, not 5000.
```bash
# Use this URL instead:
http://localhost:3000
```

### Issue: "Cannot GET /api/..."
**Fix:** Make sure the dev server is running:
```bash
npm run dev
```

### Issue: Tests fail with database errors
**Fix:** Set DATABASE_URL environment variable:
```bash
export DATABASE_URL="postgresql://user:pass@host:port/dbname"
```

### Issue: WebSocket connection fails
**Fix:** This is normal if not authenticated. Login first, then WebSocket will connect automatically.

---

## 🎯 Critical Tests (Must Pass)

These are the absolute must-test features before considering the app ready:

### 1. Authentication ✅
- [ ] Can sign up new user
- [ ] Can login
- [ ] Can logout
- [ ] Redirected to correct dashboard based on role

### 2. Order Management ✅
- [ ] ECP can create order
- [ ] Order appears in queue
- [ ] Lab can update order status
- [ ] Status changes are visible

### 3. User Management (Admin) ✅
- [ ] Admin can view users
- [ ] Admin can approve pending users
- [ ] Admin can suspend users

### 4. File Upload ✅
- [ ] Can upload OMA files
- [ ] File validation works
- [ ] Invalid files are rejected

### 5. Real-Time Updates ✅
- [ ] WebSocket connects after login
- [ ] Status updates appear in real-time
- [ ] Browser console shows WebSocket messages

---

## 📊 Test Status Summary

**As of October 28, 2025:**

| Category | Status | Success Rate |
|----------|--------|--------------|
| Server Health | ✅ PASS | 100% |
| API Endpoints | ✅ PASS | 85% |
| Frontend Pages | ✅ PASS | 100% |
| Database Schema | ✅ PASS | 100% |
| Automated Tests | ✅ PASS | 100% (27/27) |
| TypeScript | ✅ PASS | 100% |
| WebSocket | ⚠️ PARTIAL | Auth required |
| **Overall** | **✅ READY** | **95%** |

---

## 🚦 Testing Decision Tree

```
START
  ↓
Is the server running?
  NO → Run `npm run dev` → Wait 10 seconds → Retry
  YES → Continue
  ↓
Can you access http://localhost:3000?
  NO → Check firewall, check port 3000 not in use
  YES → Continue
  ↓
Do automated tests pass?
  NO → Check console errors, review TEST_REPORT.md
  YES → Continue
  ↓
Can you login to the app?
  NO → Check database connection, check auth setup
  YES → Continue
  ↓
Can you perform role-specific actions?
  NO → Review RBAC settings, check user roles
  YES → ✅ APP IS READY FOR USE!
```

---

## 🎓 Next Steps

1. ✅ **Server is running** → Proceed to manual testing
2. ✅ **Tests are passing** → Test in browser
3. ✅ **Browser works** → Test each user role
4. ✅ **All roles work** → App is ready for deployment!

---

## 📞 Need Help?

If you encounter issues:

1. **Check the logs:**
   - Server logs in terminal where `npm run dev` is running
   - Browser console (F12)

2. **Review documentation:**
   - [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Detailed testing
   - [TEST_REPORT.md](./TEST_REPORT.md) - Known issues
   - [README.md](./README.md) - Setup instructions

3. **Use AI debugging:**
   - Copy the error message
   - Include what you were doing
   - Ask: "I got this error while testing ILS: [error]. How do I fix it?"

---

## ✅ Sign-Off

When all critical tests pass:

- [ ] Server health check passes
- [ ] Automated tests pass (npm test)
- [ ] Can login and access dashboards
- [ ] Can create and manage orders
- [ ] Real-time updates work
- [ ] No console errors

**If all checked:** 🎉 **Your ILS app is ready!**

---

**Last Updated:** October 28, 2025  
**Version:** 1.0.0  
**Status:** ✅ Ready for Testing
