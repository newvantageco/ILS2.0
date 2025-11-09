# Marketplace Testing Guide (Chunk 6)

## ✅ Server Status

The development server is running and all marketplace routes are registered:
- Server: http://localhost:3000
- Health Check: ✅ `{"status":"ok"}`
- Marketplace Routes: ✅ Responding with "Unauthorized" (correct behavior)

## 🎯 Testing Checklist

### Phase 1: Basic Navigation
- [ ] **Login to the application**
  - Navigate to http://localhost:3000
  - Login with your credentials
  
- [ ] **Find Marketplace in Sidebar**
  - Look for "Marketplace" section in the left sidebar
  - Should show two menu items:
    - Marketplace
    - My Connections

### Phase 2: MarketplacePage Testing
**URL**: http://localhost:3000/marketplace

#### Search & Filter
- [ ] **Search functionality**
  - Type company name in search bar
  - Verify results update in real-time
  - Clear search and verify all companies return

- [ ] **Tab navigation**
  - Click "All" tab - should show all companies
  - Click "Labs" tab - should filter to labs only
  - Click "Suppliers" tab - should filter to suppliers
  - Click "ECPs" tab - should filter to ECPs

- [ ] **View mode toggle**
  - Click grid view icon - should show cards in grid
  - Click list view icon - should show compact list
  - Verify both views display same data

#### Stats Cards
- [ ] Verify stats display at top:
  - Total Companies count
  - Total Connections count
  - Total Labs count

#### Company Cards
- [ ] **Grid View Cards**
  - Verify company name displayed
  - Verify company type badge (Lab/Supplier/ECP)
  - Verify connection status badge
  - Verify "Connect" button appears for non-connected companies
  - Verify "Connected" badge for existing connections
  - Verify "Pending" badge for pending requests

- [ ] **List View Items**
  - Verify compact layout
  - Verify same information as cards
  - Verify actions available

#### Connection Requests
- [ ] **Send Connection Request**
  - Click "Connect" button on a company
  - Verify dialog opens
  - Enter a custom message
  - Click "Send Request"
  - Verify success toast appears
  - Verify button changes to "Pending"

- [ ] **View Profile**
  - Click on any company card
  - Verify navigation to profile page

### Phase 3: CompanyProfilePage Testing
**URL**: http://localhost:3000/marketplace/companies/:id

#### Profile Display
- [ ] **Header Section**
  - Verify company name
  - Verify company type badge
  - Verify verification badge (if applicable)
  - Verify connection count

- [ ] **About Section**
  - Verify headline displayed
  - Verify description text
  - Verify formatting preserved

- [ ] **Specialties Section**
  - Verify specialty badges displayed
  - Verify badge colors
  - Verify all specialties shown

- [ ] **Certifications Section**
  - Verify certifications list with checkmarks
  - Verify proper formatting

- [ ] **Equipment Section**
  - Verify equipment displayed in grid
  - Verify 2-column layout on desktop
  - Verify responsive on mobile

- [ ] **Contact Information Sidebar**
  - Verify email address
  - Verify phone number
  - Verify website link (clickable)
  - Verify service area

#### Connection Actions
- [ ] **Connect Button (Not Connected)**
  - Click "Connect" button
  - Verify dialog opens
  - Enter custom message (optional)
  - Click "Send Request"
  - Verify success toast
  - Verify button updates to "Pending"

- [ ] **Connected State**
  - For connected companies, verify "Connected" badge
  - Verify no "Connect" button shows

- [ ] **Pending State**
  - For pending requests, verify "Pending" badge
  - Verify appropriate message

- [ ] **Own Company**
  - Navigate to your own company profile
  - Verify "Edit Profile" button appears
  - Verify no "Connect" button shows

#### Navigation
- [ ] **Back Button**
  - Click "Back to Marketplace" button
  - Verify returns to marketplace listing

### Phase 4: MyConnectionsPage Testing
**URL**: http://localhost:3000/marketplace/my-connections

#### Stats Dashboard
- [ ] Verify three stat cards display:
  - Active Connections count
  - Incoming Requests count
  - Pending Requests count

#### Connections Tab
- [ ] **Active Connections Display**
  - Click "Connections" tab
  - Verify all active connections listed
  - Verify company name, type badge, contact info
  - Verify connection date displayed

- [ ] **View Profile Action**
  - Click "View Profile" button
  - Verify navigates to company profile
  - Return to connections page

- [ ] **Disconnect Action**
  - Click "Disconnect" button
  - Verify confirmation dialog appears
  - Cancel - verify no change
  - Confirm - verify connection removed
  - Verify success toast
  - Verify stats update

- [ ] **Empty State**
  - If no connections, verify empty state message
  - Verify "Browse Marketplace" button

#### Incoming Tab
- [ ] **Incoming Requests Display**
  - Click "Incoming" tab
  - Verify pending incoming requests listed
  - Verify company name, type, message
  - Verify request date and expiration date

- [ ] **Approve Request**
  - Click "Approve" button
  - Verify approval dialog opens
  - Verify message from sender displayed
  - Click "Approve Connection"
  - Verify success toast
  - Verify request removed from incoming
  - Verify connection added to Connections tab
  - Verify stats update

- [ ] **Reject Request**
  - Click "Reject" button
  - Verify success toast
  - Verify request removed from list
  - Verify stats update

- [ ] **Empty State**
  - If no incoming requests, verify empty state message

#### Outgoing Tab
- [ ] **Outgoing Requests Display**
  - Click "Outgoing" tab
  - Verify pending outgoing requests listed
  - Verify company name, type
  - Verify request date and expiration
  - Verify "Pending" badge

- [ ] **Cancel Request**
  - Click "Cancel Request" button
  - Verify success toast
  - Verify request removed from list
  - Verify stats update

- [ ] **View Expiration**
  - Verify expiration dates displayed
  - Verify warning styling for near-expiration

- [ ] **Empty State**
  - If no outgoing requests, verify empty state message

### Phase 5: Connection Workflow Testing

#### Complete End-to-End Flow
- [ ] **Step 1: Discovery**
  - Go to Marketplace
  - Search for a company
  - View their profile

- [ ] **Step 2: Request Connection**
  - Click "Connect" from profile
  - Enter message: "Let's collaborate!"
  - Submit request
  - Verify success notification

- [ ] **Step 3: View Outgoing Request**
  - Go to My Connections > Outgoing tab
  - Verify request appears
  - Note expiration date

- [ ] **Step 4: Approve (as other company)**
  - Login as the target company
  - Go to My Connections > Incoming tab
  - See the request with message
  - Click "Approve"
  - Verify connection created

- [ ] **Step 5: Verify Connection**
  - Check Connections tab
  - Verify both companies see each other
  - Verify connection counts updated
  - Verify profile shows "Connected" status

- [ ] **Step 6: Disconnect**
  - Click "Disconnect" from either side
  - Confirm action
  - Verify connection removed for both
  - Verify counts updated

### Phase 6: Error Handling & Edge Cases

#### Invalid Actions
- [ ] **Duplicate Requests**
  - Try sending connection request to same company twice
  - Verify error message

- [ ] **Self Connection**
  - Try connecting to own company
  - Verify prevented

- [ ] **Invalid Company Types**
  - Try connecting incompatible types (e.g., ECP to Supplier)
  - Verify validation error

#### Network Errors
- [ ] **Failed Request**
  - Simulate network error (disconnect WiFi briefly)
  - Try action
  - Verify error toast
  - Reconnect and retry

#### Loading States
- [ ] **Page Load**
  - Verify loading spinners display
  - Verify smooth transition to content

- [ ] **Action Loading**
  - Click action button
  - Verify button shows loading state
  - Verify button disabled during action

#### Empty States
- [ ] **No Search Results**
  - Search for non-existent company
  - Verify "No results" message

- [ ] **No Connections**
  - Check with new account
  - Verify empty state message and CTA

### Phase 7: Responsive Design

#### Mobile Testing (< 768px)
- [ ] Open browser DevTools
- [ ] Toggle device toolbar
- [ ] Select mobile device (iPhone/Android)
- [ ] Test all pages:
  - [ ] Marketplace - verify single column grid
  - [ ] Company Profile - verify stacked layout
  - [ ] My Connections - verify tabs scroll
- [ ] Test navigation - verify sidebar becomes drawer
- [ ] Test all actions work on mobile

#### Tablet Testing (768px - 1024px)
- [ ] Set viewport to tablet size
- [ ] Test marketplace grid (should be 2 columns)
- [ ] Test all layouts adapt properly

#### Desktop Testing (> 1024px)
- [ ] Verify 3-column grid on marketplace
- [ ] Verify proper spacing and alignment
- [ ] Test all features at full width

### Phase 8: Performance Testing

#### Load Time
- [ ] **Marketplace Page**
  - Open DevTools Network tab
  - Load marketplace
  - Verify loads in < 2 seconds
  - Check API call count (should be 2: search + stats)

- [ ] **Company Profile**
  - Load profile page
  - Verify loads in < 1 second
  - Check API calls (should be 1: company details)

- [ ] **My Connections**
  - Load connections page
  - Verify loads in < 2 seconds
  - Check API calls (should be 1: requests list)

#### Large Datasets
- [ ] Test with 100+ companies
- [ ] Verify search remains fast
- [ ] Verify scroll performance
- [ ] Consider pagination if slow

### Phase 9: Browser Compatibility

Test in multiple browsers:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

For each browser, verify:
- [ ] All pages load
- [ ] All buttons work
- [ ] Dialogs display correctly
- [ ] Styles render properly
- [ ] No console errors

### Phase 10: Security Testing

#### Authentication
- [ ] Try accessing marketplace without login
  - Verify redirects to login
- [ ] Login and verify access granted

#### Authorization
- [ ] Try accessing another company's edit profile
  - Verify prevented
- [ ] Try approving own outgoing request
  - Verify prevented (would need 2 accounts)

#### Input Validation
- [ ] Try XSS in message field
  - Enter `<script>alert('xss')</script>`
  - Verify sanitized/escaped
- [ ] Try SQL injection in search
  - Enter `'; DROP TABLE companies; --`
  - Verify handled safely

## 🐛 Known Issues to Check

1. **TypeScript Compilation Errors**
   - Server had import errors for marketplace.ts
   - Verify no console errors in browser
   - Check Network tab for 500 errors

2. **Date Formatting**
   - Verify dates display in correct timezone
   - Verify expiration dates calculate correctly

3. **Connection Counts**
   - Verify counts update immediately after actions
   - Verify sync between database and display

4. **Bidirectional Relationships**
   - Verify both companies see connection
   - Verify disconnect works from either side

## ✅ Success Criteria

All of the following must pass:
- ✅ All 3 pages load without errors
- ✅ All navigation works smoothly
- ✅ Search and filters work correctly
- ✅ Connection workflow completes successfully
- ✅ All CRUD operations work (Create, Read, Update, Delete)
- ✅ Error handling displays appropriate messages
- ✅ Loading states show during async operations
- ✅ Responsive design works on all screen sizes
- ✅ No console errors in browser DevTools
- ✅ No TypeScript compilation errors
- ✅ All API endpoints return correct data

## 📊 Test Results Template

```
Date: _______________
Tester: _______________

Phase 1: Basic Navigation     [ PASS / FAIL ] Notes: _____________
Phase 2: MarketplacePage      [ PASS / FAIL ] Notes: _____________
Phase 3: CompanyProfilePage   [ PASS / FAIL ] Notes: _____________
Phase 4: MyConnectionsPage    [ PASS / FAIL ] Notes: _____________
Phase 5: Connection Workflow  [ PASS / FAIL ] Notes: _____________
Phase 6: Error Handling       [ PASS / FAIL ] Notes: _____________
Phase 7: Responsive Design    [ PASS / FAIL ] Notes: _____________
Phase 8: Performance          [ PASS / FAIL ] Notes: _____________
Phase 9: Browser Compat       [ PASS / FAIL ] Notes: _____________
Phase 10: Security            [ PASS / FAIL ] Notes: _____________

Overall Result: [ PASS / FAIL ]

Critical Issues Found:
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

Minor Issues Found:
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

Recommendations:
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________
```

## 🚀 Next Steps After Testing

1. **Fix Critical Issues**
   - Address any blocking bugs
   - Verify fixes with retesting

2. **Polish UI**
   - Add animations
   - Improve empty states
   - Enhance loading indicators

3. **Optimize Performance**
   - Add pagination if needed
   - Implement caching
   - Optimize database queries

4. **Add Analytics**
   - Track marketplace usage
   - Monitor connection rates
   - Analyze search patterns

5. **Prepare for Production**
   - Update documentation
   - Create user guides
   - Plan rollout strategy

## 📝 Testing Notes

Use this space to document findings during testing:

_______________________________________________
_______________________________________________
_______________________________________________
_______________________________________________
_______________________________________________
