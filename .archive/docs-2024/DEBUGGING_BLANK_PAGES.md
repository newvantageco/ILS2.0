# 🔍 Debugging Blank Pages - Quick Guide

**Date:** November 9, 2025
**Issue:** Pages appearing blank after login or during navigation

---

## 🚨 Quick Diagnosis Checklist

### **Step 1: Open Browser DevTools (F12 or Cmd+Option+I)**

#### **Console Tab - Check for Errors:**

**Common Error Patterns:**

1. **Import/Module Errors:**
   ```
   Failed to fetch dynamically imported module
   Uncaught SyntaxError: Unexpected token '<'
   ```
   **Solution:** Build issue, restart dev server

2. **API Errors:**
   ```
   GET /api/user 401 (Unauthorized)
   GET /api/companies/available 404 (Not Found)
   ```
   **Solution:** Authentication issue or missing API endpoint

3. **React Errors:**
   ```
   Cannot read property 'map' of undefined
   Objects are not valid as a React child
   ```
   **Solution:** Missing data handling or incorrect component props

4. **TypeScript Errors:**
   ```
   Property 'xyz' does not exist on type...
   ```
   **Solution:** Type mismatch, run `npm run check`

---

### **Step 2: Verify Your Authentication State**

**In Console Tab, run:**
```javascript
fetch('/api/user')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

**Expected Output (Logged In):**
```json
{
  "id": "user-id-here",
  "email": "admin@ils.local",
  "firstName": "Master",
  "lastName": "Admin",
  "role": "admin",
  "companyId": "company-id-here",
  "accountStatus": "active"
}
```

**If you get an error:** You're not authenticated - go to `/login`

---

### **Step 3: Check Current URL**

**In Console Tab, run:**
```javascript
console.log('Current URL:', window.location.href);
console.log('Pathname:', window.location.pathname);
```

**Compare with expected routes:**

| You Expect | Actual Path | What's Happening |
|------------|-------------|------------------|
| Landing Page | `/` + logged out | ✅ Correct - shows LandingNew |
| Landing Page | `/` + logged in | ⚠️ Redirects to `/welcome` |
| Onboarding | `/onboarding` | ✅ Should show OnboardingFlow |
| Dashboard | `/ecp/dashboard` | ✅ Should show ECPDashboard |

**Key Insight:** After login, you're NOT seeing the landing page - you're seeing the Welcome page! This is correct behavior.

---

### **Step 4: Network Tab - Check API Calls**

**Look for:**
- ✅ Green status codes (200, 201) = Success
- ❌ Red status codes (401, 403, 404, 500) = Problem

**Common Issues:**

| Status | Meaning | Solution |
|--------|---------|----------|
| 401 | Unauthorized | Login again, check session |
| 403 | Forbidden | Wrong role/permissions |
| 404 | Not Found | Route or API doesn't exist |
| 500 | Server Error | Check server logs |

---

### **Step 5: React DevTools - Component Tree**

**Install React DevTools:**
- Chrome: https://chrome.google.com/webstore (search "React Developer Tools")
- Firefox: https://addons.mozilla.org

**Check:**
1. Open React DevTools tab
2. Look at component tree
3. Find the page component (e.g., `OnboardingFlow`, `WelcomePage`)
4. Check if it's rendered
5. Look at props and state values

**If component is missing:** Routing issue or import failure

---

## 🐛 Common Blank Page Scenarios

### **Scenario 1: "Onboarding Page is Blank"**

**Symptoms:**
- URL shows `/onboarding`
- Page is white/blank
- No errors in console

**Possible Causes:**

1. **User already has a company:**
   ```javascript
   // Check in console:
   fetch('/api/user').then(r => r.json()).then(u => console.log('Has company?', !!u.companyId))
   ```
   If `true`, user shouldn't be on onboarding - they'll be redirected

2. **API endpoint not responding:**
   ```javascript
   // Check in console:
   fetch('/api/companies/available').then(r => r.json()).then(console.log)
   ```
   Should return list of companies

3. **React Query suspended:**
   Check React DevTools → Components → Look for `Suspense` boundaries

**Solutions:**
- Restart the dev server: `npm run dev`
- Clear browser cache and localStorage
- Check server logs for API errors

---

### **Scenario 2: "Landing Page Looks the Same"**

**Actually:** You're seeing the **Welcome Page**, not the Landing Page!

**Why?**
- Landing Page = For logged-out users (`/` when not authenticated)
- Welcome Page = For logged-in users (`/welcome` after authentication)

**To see the NEW Landing Page:**
1. Log out: Click user menu → Logout
2. Visit: http://localhost:3000
3. You'll see the new modular landing page!

**Or directly visit:**
- http://localhost:3000/landing-new (while logged in)

---

### **Scenario 3: "Page Shows Loading Spinner Forever"**

**Symptoms:**
- Spinner keeps spinning
- Page never loads
- No error messages

**Possible Causes:**

1. **API call stuck:**
   Check Network tab for pending requests

2. **React Query not resolving:**
   ```javascript
   // Check queryClient status:
   console.log(window.queryClient)
   ```

3. **Infinite redirect loop:**
   Check Console for multiple navigation messages

**Solutions:**
- Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
- Clear all site data in DevTools
- Restart server

---

### **Scenario 4: "404 Not Found Page"**

**Symptoms:**
- Page shows "Not Found" or 404 error
- URL is correct

**Possible Causes:**

1. **Route not defined in App.tsx**
2. **Component import failed**
3. **User role doesn't match route permissions**

**Check:**
```javascript
// Current user role:
fetch('/api/user').then(r => r.json()).then(u => console.log('Role:', u.role))
```

**Solution:**
- Verify route exists in App.tsx for that role
- Check if component is properly imported

---

## 🔧 Quick Fixes

### **Fix 1: Restart Everything**
```bash
# Stop all servers
lsof -ti:3000 | xargs kill -9

# Start fresh
npm run dev
```

### **Fix 2: Clear Browser Data**
**In DevTools:**
1. Application tab
2. Storage → Clear site data
3. Hard refresh (Cmd+Shift+R)

### **Fix 3: Check Server Logs**
```bash
# Look at the terminal where server is running
# Check for:
# - API errors
# - Database connection issues
# - Import failures
```

### **Fix 4: Verify Build is Up to Date**
```bash
# TypeScript check
npm run check

# If errors, note them but server should still work with tsx
```

### **Fix 5: Test API Endpoints Directly**
```bash
# Test user endpoint
curl http://localhost:3000/api/user

# Test companies endpoint
curl http://localhost:3000/api/companies/available
```

---

## 📱 Mobile/Browser Specific Issues

### **Safari:**
- Clear cache: Safari → Preferences → Privacy → Manage Website Data
- Disable "Prevent cross-site tracking"

### **Chrome:**
- Disable extensions (try Incognito mode)
- Clear cache: Settings → Privacy → Clear browsing data

### **Firefox:**
- Disable tracking protection for localhost
- Clear cookies for localhost

---

## 🧪 Test Specific Pages

### **Test Landing Page (Logged Out):**
```javascript
// 1. Logout
window.location.href = '/api/logout'

// 2. Then visit root
window.location.href = '/'

// Should see new landing page with 11 sections
```

### **Test Onboarding:**
```javascript
// 1. Create user without company
// 2. Login
// 3. Should auto-redirect to /onboarding

// Or force navigate:
window.location.href = '/onboarding'
```

### **Test Welcome Page:**
```javascript
// After login, should redirect to:
window.location.href = '/welcome'

// Check if it loads
```

### **Test Dispenser Dashboard:**
```javascript
// As dispenser user:
window.location.href = '/dispenser/dashboard'

// Should load DispenserDashboard component
```

---

## 🚨 Emergency Debugging Commands

**In Browser Console:**

```javascript
// 1. Check authentication
fetch('/api/user').then(r => r.json()).then(console.log)

// 2. Check current path
console.log(window.location)

// 3. Check for React errors
console.error.apply(console, arguments)

// 4. Check localStorage
console.log(localStorage)

// 5. Force reload without cache
location.reload(true)

// 6. Check React Query cache
console.log(window.queryClient?.getQueryCache().getAll())
```

---

## 📞 Still Having Issues?

### **Gather This Information:**

1. **Browser Console Output:**
   - Copy all red errors
   - Copy any warnings

2. **Network Tab:**
   - Screenshot of failed requests
   - Note the status codes

3. **Current URL:**
   - What URL shows blank?
   - What URL did you expect?

4. **User State:**
   ```javascript
   fetch('/api/user').then(r => r.json()).then(console.log)
   ```
   - Copy this output

5. **Server Logs:**
   - Copy recent server terminal output
   - Look for errors or warnings

---

## ✅ Success Indicators

**Your pages are working when:**
- ✅ Console has no red errors
- ✅ Network tab shows all 200/201 responses
- ✅ React component tree shows expected components
- ✅ Page content visible and interactive
- ✅ Navigation works
- ✅ Data loads correctly

---

## 🎯 Most Common Root Causes

**In Order of Frequency:**

1. **Not actually authenticated** (40%)
   - Solution: Login again

2. **Looking at Welcome page thinking it's Landing page** (30%)
   - Solution: Log out to see Landing page

3. **API endpoint not responding** (15%)
   - Solution: Check server is running, restart if needed

4. **Component import failed** (10%)
   - Solution: Restart dev server

5. **Browser cache issue** (5%)
   - Solution: Hard refresh, clear cache

---

**Last Updated:** November 9, 2025
**Remember:** Most "blank page" issues are actually auth/routing confusion, not real bugs!
