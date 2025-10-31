# Eye Examination System - Testing Checklist

## Server Status
✅ **Server Running**: http://localhost:3000

## Test 1: Multi-Tenancy Isolation

### Prerequisites
- Two different companies in the system
- Users from different companies
- Test data: At least 1 patient per company

### Steps to Test Multi-Tenancy

#### Step 1.1: Login as Company A User
1. Navigate to http://localhost:3000
2. Login with Company A credentials (e.g., saban@newvantageco.com)
3. Switch to ECP role if needed
4. Verify you see Company A's dashboard

#### Step 1.2: Create Examination for Company A
1. Go to **Patients** page
2. Select a patient from Company A
3. Click **"New Examination"** button
4. Verify:
   - ✅ Patient is auto-selected
   - ✅ Full-width UI with horizontal tabs visible
   - ✅ All 10 tabs accessible
5. Fill in basic information:
   - **General History Tab**:
     - Date: (auto-filled)
     - Seen By: Your name
     - Healthcare: Private/NHS
     - Reason for Visit: "Routine checkup"
6. Click **Save** button
7. Note the examination ID or patient name

#### Step 1.3: Verify Company A Can See Their Data
1. Go to **Examinations** list
2. Verify you see the examination you just created
3. Note: Only Company A's examinations should be visible

#### Step 1.4: Switch to Company B User
1. Logout from current session
2. Login with Company B user credentials
3. Switch to ECP role
4. Go to **Examinations** list

#### Step 1.5: Verify Data Isolation
Expected Results:
- ❌ Should NOT see Company A's examination
- ✅ Should only see Company B's examinations
- ✅ Cannot access Company A's examination by URL

#### Step 1.6: Attempt Direct Access (Security Test)
1. While logged in as Company B user
2. Try to access Company A's examination directly:
   - Copy examination ID from Company A
   - Navigate to: `/ecp/examination/{company-a-exam-id}`
3. Expected: 
   - ❌ Should return 403 Forbidden or 404 Not Found
   - ✅ No data displayed

#### Step 1.7: Create Examination for Company B
1. As Company B user
2. Go to **Patients** page
3. Select a Company B patient
4. Click **"New Examination"**
5. Fill in basic details and save
6. Verify examination is created successfully

#### Step 1.8: Final Verification
1. Switch back to Company A user
2. Verify Company A still sees only their examinations
3. Verify Company B's examination is NOT visible

### ✅ Multi-Tenancy Test Results
- [ ] Company A can create examinations
- [ ] Company B can create examinations
- [ ] Company A cannot see Company B's data
- [ ] Company B cannot see Company A's data
- [ ] Direct URL access is blocked across companies
- [ ] Data is properly isolated by companyId

---

## Test 2: Comprehensive Examination Workflow

### Prerequisites
- Logged in as ECP user
- At least one patient in the system
- Server running on port 3000

### Steps to Test Full Examination Workflow

#### Step 2.1: Start New Examination
1. Navigate to **Patients** page
2. Select any patient
3. Click **"New Examination"** button
4. Verify:
   - ✅ Redirected to `/ecp/examination/new?patientId={id}`
   - ✅ Patient is auto-selected in header
   - ✅ Patient details visible
   - ✅ Horizontal tabs visible at top
   - ✅ Full-width layout (no sidebar)

#### Step 2.2: Fill Tab 1 - General History
1. Click **"General History"** tab (should be active by default)
2. Fill in:
   - **Schedule**:
     - Date: Select today's date
     - Seen By: Your name (e.g., "Dr. John Smith")
     - Healthcare: Select "Private" or "NHS"
     - Evidence: Optional reference
   - **Reason for Visit**: "Routine eye examination"
   - **Symptoms**:
     - Visual Impairment: Select appropriate option
     - Check: Flashes, Floaters, Headaches (if applicable)
     - Other: Add any additional symptoms
   - **Lifestyle**:
     - Occupation: Patient's job
     - CL Wearer: Yes/No
     - VDU User: Yes/No
     - Smoker: Yes/No
     - Driver: Yes/No
   - **Medical History**:
     - Hobbies: e.g., "Reading, sports"
     - Family History: Any relevant info
     - General Health: Current health status
     - Allergies: Any known allergies
     - Medication: Current medications

3. Click **"Save"** button
4. Verify: Success toast appears

#### Step 2.3: Fill Tab 2 - Current Rx
1. Click **"Current Rx"** tab
2. Fill in:
   - **Unaided Vision**:
     - Right Eye: Distance, Binocular, Near
     - Left Eye: Distance, Binocular, Near
   - **Primary Pair**:
     - Right: Sph, Cyl, Axis, Add, Prism, VA
     - Left: Sph, Cyl, Axis, Add, Prism, VA
   - **Contact Lens Rx** (if applicable):
     - Brand, Name, Fitting details
     - Right and Left lens specifications
3. Click **"Save"**
4. Verify data persists

#### Step 2.4: Fill Tab 3 - New Rx
1. Click **"New Rx"** tab
2. Fill in:
   - **Objective** (Retinoscopy):
     - Right: Sph, Cyl, Axis, VA
     - Left: Sph, Cyl, Axis, VA
   - **Subjective - Primary Pair**:
     - Right: Sph, Cyl, Axis, VA, Prism
     - Left: Sph, Cyl, Axis, VA, Prism
     - Binocular acuity
   - **Near Rx**:
     - Right and Left specifications
   - **Intermediate Rx**:
     - Right and Left specifications
   - **Notes**:
     - To be printed: Patient instructions
     - Not printed: Internal notes
3. Click **"Save"**

#### Step 2.5: Fill Tab 4 - Ophthalmoscopy
1. Click **"Ophthalmoscopy"** tab
2. Fill in for Right and Left eyes:
   - Media: Clear/Cloudy
   - Discs: Normal/Abnormal
   - C/D Ratio: e.g., "0.3"
   - Vessels: Normal findings
   - Fundus: Healthy/Issues
   - Macula: Normal appearance
   - Periphery: Clear/Findings
3. Additional fields:
   - Motility: Full/Restricted
   - Cover Test: Results
   - Stereopsis: Results
4. Click **"Save"**

#### Step 2.6: Fill Tab 5 - Slit Lamp
1. Click **"Slit Lamp"** tab
2. Select method: Direct/Indirect/Both
3. Check Volk if used
4. Grade findings (0-4 scale):
   - **Conjunctiva**: Redness, Limbal redness, Papillary conjunctivitis
   - **Cornea**: Neovascularisation, Oedema, Infiltrate, Stain
   - **Lids/Lashes**: Microcysts, Blepharitis, Meibomian dysfunction
5. Add other findings if needed
6. Click **"Save"**

#### Step 2.7: Fill Tab 6 - Additional Tests
1. Click **"Additional Tests"** tab
2. Fill in as applicable:
   - **Visual Fields**: Instrument, results, normal/abnormal
   - **Confrontation**: Results
   - **Wide Field Imaging**: Instrument, findings
   - **OCT**: Instrument, results
   - **Amsler**: Results, normal/abnormal
   - **Colour Vision**: Test type, results
3. Click **"Save"**

#### Step 2.8: Fill Tab 7 - Tonometry
1. Click **"Tonometry"** tab
2. Fill in:
   - **IOP Measurements**:
     - Right eye: Value 1, 2, 3, 4 (averages auto-calculate)
     - Left eye: Value 1, 2, 3, 4
     - Corrected values
     - Corneal thickness
     - Instrument used
   - **Time**: Time of measurement
   - **Anaesthetics**:
     - Info given: Yes/No
     - Drops given: R/L (1, 2, or 3)
     - Date/Time given
     - Batch number
     - Expiry date
     - Notes
3. Click **"Save"**

#### Step 2.9: Check Tab 8 & 9 (Disabled)
1. Click **"Eye Sketch"** tab
   - Verify: Tab is disabled (greyed out)
   - Status: Coming soon
2. Click **"Image Viewer"** tab
   - Verify: Tab is disabled (greyed out)
   - Status: Coming soon

#### Step 2.10: Fill Tab 10 - Summary
1. Click **"Summary"** tab
2. Fill in:
   - **Rx Issued**:
     - Status: First Rx/Repeat Rx/Stable Rx/Updated Rx Needed/Referral
     - Voucher issued: Yes/No
     - Referred for investigation: Check if yes
   - **Dispensing**:
     - Reasons: Select applicable reasons
     - Handover notes: Instructions for dispensing
   - **Recall**:
     - Assign recall group
     - Set due date
     - Mark as recurring if needed
3. Review all data entered
4. Click **"Save"**

#### Step 2.11: Test Previous Examinations Dropdown
1. In the header, click **"Previous (0)"** button
2. Verify:
   - ✅ Dropdown opens
   - ✅ Shows list of previous examinations
   - ✅ Each exam shows: Date, Status badge, Reason
   - ✅ Click on a previous exam loads it

#### Step 2.12: Test Navigation
1. Click **"Previous"** button at bottom
2. Verify: Goes to previous tab
3. Click **"Next"** button at bottom
4. Verify: Goes to next tab
5. Navigate through all tabs using buttons

#### Step 2.13: Test Print Functionality
1. Go to any tab
2. Click **"Print"** button in footer
3. Verify:
   - ✅ Print dialog opens
   - ✅ Shows formatted examination report
   - ✅ Includes all filled data
   - ✅ GOC-compliant format

#### Step 2.14: Finalize Examination
1. Navigate to **Summary** tab
2. Review all entered data
3. Click **"Finalize Examination"** button
4. Confirm finalization in dialog
5. Verify:
   - ✅ Status changes to "Finalized"
   - ✅ Examination is saved
   - ✅ Redirected to examinations list
   - ✅ Finalized exam appears in list

#### Step 2.15: Verify Data Persistence
1. From examinations list, click on the exam you just created
2. Navigate through all tabs
3. Verify:
   - ✅ All data is preserved
   - ✅ All tabs show saved information
   - ✅ Nothing is lost
   - ✅ Finalized status is maintained

#### Step 2.16: Test Back Button
1. While in examination view
2. Click **"Back"** button in header
3. Verify:
   - ✅ Returns to examinations list
   - ✅ No data lost if saved

### ✅ Comprehensive Examination Test Results
- [ ] New examination created successfully
- [ ] Patient auto-selected from URL parameter
- [ ] All 10 tabs accessible
- [ ] Tab 1 (General History) - Data saved
- [ ] Tab 2 (Current Rx) - Data saved
- [ ] Tab 3 (New Rx) - Data saved
- [ ] Tab 4 (Ophthalmoscopy) - Data saved
- [ ] Tab 5 (Slit Lamp) - Data saved
- [ ] Tab 6 (Additional Tests) - Data saved
- [ ] Tab 7 (Tonometry) - Data saved and averages calculated
- [ ] Tab 8 (Eye Sketch) - Disabled as expected
- [ ] Tab 9 (Image Viewer) - Disabled as expected
- [ ] Tab 10 (Summary) - Data saved
- [ ] Previous examinations dropdown works
- [ ] Navigation (Previous/Next) works
- [ ] Print functionality works
- [ ] Finalization works
- [ ] Data persistence verified
- [ ] Back button works

---

## Test 3: Edge Cases & Error Handling

### Test 3.1: Unsaved Changes Warning
1. Start filling an examination
2. Click "Back" button without saving
3. Expected: Warning dialog about unsaved changes
4. Result: ___________

### Test 3.2: Invalid Data Handling
1. Try to save with missing required fields
2. Expected: Validation errors displayed
3. Result: ___________

### Test 3.3: Network Error Handling
1. Disconnect from network
2. Try to save examination
3. Expected: Error toast with retry option
4. Result: ___________

### Test 3.4: Concurrent Editing
1. Open same examination in two tabs
2. Edit in both tabs
3. Save in both
4. Expected: Last save wins or conflict resolution
5. Result: ___________

---

## Overall System Status

### ✅ Completed Features
- [x] Multi-tenant architecture with companyId isolation
- [x] Comprehensive examination with 10 tabs
- [x] Full-width modern UI with horizontal tabs
- [x] Patient auto-selection from URL
- [x] Data persistence in JSONB columns
- [x] Previous examinations dropdown
- [x] Print functionality
- [x] Examination finalization
- [x] Navigation between tabs
- [x] Back button to examinations list

### 🔄 In Progress / Coming Soon
- [ ] Eye Sketch tab implementation
- [ ] Image Viewer tab implementation
- [ ] Unsaved changes warning
- [ ] Validation improvements
- [ ] Offline support

### 📊 Test Summary
**Date**: October 31, 2025
**Tester**: _____________
**Version**: 2.0
**Environment**: Development (localhost:3000)

**Multi-Tenancy Tests**: ___ / 6 passed
**Examination Workflow Tests**: ___ / 22 passed
**Edge Case Tests**: ___ / 4 passed

**Overall Status**: ___________

**Issues Found**:
1. ___________
2. ___________
3. ___________

**Notes**:
___________
___________
___________

---

## Quick Reference

### URLs
- **Login**: http://localhost:3000
- **Patients**: http://localhost:3000/ecp/patients
- **Examinations List**: http://localhost:3000/ecp/examinations
- **New Examination**: http://localhost:3000/ecp/examination/new
- **Edit Examination**: http://localhost:3000/ecp/examination/{id}

### Test Credentials
- **Company A User**: saban@newvantageco.com
- **Company B User**: (Add second company user)

### Support Documentation
- `MULTI_TENANT_EYE_EXAM_COMPLETE.md` - Multi-tenancy architecture
- `END_TO_END_TESTING_GUIDE.md` - Detailed testing procedures
- `PRINT_FUNCTIONALITY_SUMMARY.md` - Print feature details

---

**Ready to Start Testing!** 🚀

Follow the steps above systematically and check off each item as you complete it. Report any issues found during testing.
